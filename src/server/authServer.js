require('dotenv').config()
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const encryptUtil = require('./util/encryptUtil')
const userValidation = require('./validation/userValidation')
const ExtendedArray = require('./util/ExtendedArray.js')
const userDao = require('./dao/userDao')
const logonDataDao = require('./dao/logonDataDao')
const requestUtil = require('./util/requestUtil')
const mailSender = require('./mail/mailSender')
app.use(express.json())

if (process.env.ALLOW_ACCESS_FROM_ANY_ORIGIN) {
  app.all('/*', function (req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method == 'OPTIONS') {
      res.status(200).end();
    } else {
      next();
    }
  });
}


function isRefreshTokenActive(token) {
  let filterResult = logonDataDao.findLogonDataByRefreshToken(token)
  if(filterResult.length) return filterResult[0].revoked !== true
  else return false
}

function isEmailConfirmationTokenPending(emailConfirmationToken) {
  const tokenUser = jwt.decode(emailConfirmationToken)
  if(tokenUser && tokenUser.username) {
      let user = userDao.retrieveUserByUsername(tokenUser.username)
      if(user && user.username) return user.confirmedEmail === false
      else return false
  } else {
    return false
  }
}

function revokeRefreshToken(token) {
    let filterResult = logonDataDao.findLogonDataByRefreshToken(token)
    if(filterResult.length) filterResult[0].revoked = true
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION })
}
function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION })
}
function generateEmailConfirmationToken(user) {
  return jwt.sign(user, process.env.EMAIL_CONFIRMATION_TOKEN_SECRET, { expiresIn: process.env.EMAIL_CONFIRMATION_TOKEN_EXPIRATION })
}
function generateRetrievePasswordToken(user) {
  return jwt.sign(user, process.env.RETRIEVE_PASSWORD_TOKEN_SECRET, { expiresIn: process.env.RETRIEVE_PASSWORD_TOKEN_EXPIRATION })
}
app.post('/token', (req, res) => {
  const refreshToken = req.body.refreshToken

  if (refreshToken == null) return res.sendStatus(401) //unauthorized

  if (!isRefreshTokenActive(refreshToken)) return res.sendStatus(403) //forbidden

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = generateAccessToken({ 'username': user.username })
    let accessTokenExpirationDate = jwt.decode(accessToken).exp * 1000
    let refreshTokenExpirationDate = jwt.decode(refreshToken).exp * 1000
    let username = jwt.decode(accessToken).username
    res.json({ 
      accessToken,
      refreshToken,
      username,
      accessTokenExpirationDate,
      refreshTokenExpirationDate
    })
  })
})

app.get('/confirmEmail', (req, res) => {
  const emailConfirmationToken = req.query.emailConfirmationToken

  const emailConfirmationValidationErrorMessage = [{
    messageId: 'emailConfirmationError',
    category: 'validationMessage',
    message: `The link to confirm email is not valid`
  }]

  if (emailConfirmationToken == null || !isEmailConfirmationTokenPending(emailConfirmationToken)) {
    return res.status(401).send(emailConfirmationValidationErrorMessage) 
  }

  jwt.verify(emailConfirmationToken, process.env.EMAIL_CONFIRMATION_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).send(emailConfirmationValidationErrorMessage) 
    
    let username = jwt.decode(emailConfirmationToken).username
    let persistedUser = userDao.retrieveUserByUsername(username)
    persistedUser.confirmedEmail = true
    userDao.updateUser(persistedUser)
    res.json([
      {
        messageId: 'emailConfirmationSuccess',
        message: `The email address has been confirmed for ${ username }`,
        category: 'successMessage'
      }
    ])

  })
})


app.post('/signup', (req, res) => {
  let validationMessages = new ExtendedArray()
 
  // validate form
  validationMessages.pushArray(userValidation.validateUsername(req.body.username))
  validationMessages.pushArray(userValidation.validatePassword(req.body.password))
  validationMessages.pushArray(userValidation.validateConfirmPassword(req.body.password, req.body.confirmPassword))
  validationMessages.pushArray(userValidation.validateAge(req.body.age))
  validationMessages.pushArray(userValidation.validateTerms(req.body.terms))
  
  // return 422 in case of invalid
  if(validationMessages.length) {
    return res.status(422).send(validationMessages.filter((vm) => vm != undefined))
  }

  const password = encryptUtil.cryptPassword(req.body.password)
  const user = {
    username: req.body.username,
    password,
    age: req.body.age,
    confirmedEmail: false,
    emailConfirmationToken: generateEmailConfirmationToken({ 'username': req.body.username })
  }

  if (!userDao.retrieveUserByUsername(user.username)) {
    userDao.saveUser(user);
    if(process.env.SEND_MAIL_ON_SIGNUP === 'true') {
      mailSender.sendConfirmationMail(user)
    }
  } else {
    return res.sendStatus(409) //duplicate resource
  }
  authenticate(req, res)
})

app.post('/sendEmailToRetrievePassword', (req, res) => {
  let validationMessages = new ExtendedArray()
 
  // validate form
  validationMessages.pushArray(userValidation.validateUsername(req.body.username))
  if(!validationMessages.length)
    validationMessages.pushArray(userValidation.validateUsernameExists(req.body.username))
  
  // return 422 in case of invalid
  if(validationMessages.length) {
    return res.status(422).send(validationMessages)
  }
  const retrievePasswordToken = generateRetrievePasswordToken({ 'username': req.body.username })
  mailSender.sendRetrievePasswordMail(req.body, retrievePasswordToken, function(error, info) {
    if (error) {
      res.status(500).send({
        messageId: 'sendEmailToRetrievePasswordError',
        message: error,
        category: 'errorMessage'
      })
    } else {
      res.status(200).send({
        messageId: 'sendEmailToRetrievePasswordSuccess',
        message: `An email was sent to ${req.body.username}. Check you inbox mail.`,
        category: 'successMessage'
      })
    }
  })
  
})

app.delete('/logout', (req, res) => {
  revokeRefreshToken(req.query.refreshToken)
  res.sendStatus(204)
})

app.post('/changePassword', (req, res) => {
  let accessToken = null
  let authorizationHeader = req.headers['authorization']
  if(!authorizationHeader) res.sendStatus(403)
  else if(req.headers['authorization'].split(' ').length === 2) {
    accessToken = req.headers['authorization'].split(' ')[1]
  }
  
  const authData = req.body

  let validationMessages = new ExtendedArray()
  validationMessages.pushArray(userValidation.validatePasswordForLogin(req.body.password))
  validationMessages.pushArray(userValidation.validateNewPassword(req.body.newPassword, req.body.password))
  validationMessages.pushArray(userValidation.validateConfirmPassword(req.body.newPassword, req.body.confirmPassword))
  // return 422 in case of invalid
  if(validationMessages.length) {
    return res.status(422).send(validationMessages.filter((vm) => vm != undefined))
  }

  const username = jwt.decode(accessToken).username
  authData.username = username
  if (authenticateUsernameAndPassword(authData)) {
    const password = encryptUtil.cryptPassword(req.body.newPassword)
    const user = userDao.retrieveUserByUsername(username)
    user.password = password
    userDao.updateUser(user);
    res.sendStatus(200)
  } else {
    return res.sendStatus(401)
  }
})

app.post('/changeLostPassword', (req, res) => {

  jwt.verify(req.body.retrievePasswordToken, process.env.RETRIEVE_PASSWORD_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).send({
      messageId: 'retrievePasswordError',
      message: `The token provided is not valid`,
      category: 'successMessage'
    }) 
    
    const username = user.username
    const persistedUser = userDao.retrieveUserByUsername(username)
    if(persistedUser) {

      let validationMessages = new ExtendedArray()
      validationMessages.pushArray(userValidation.validateNewPassword(req.body.newPassword, req.body.password))
      validationMessages.pushArray(userValidation.validateConfirmPassword(req.body.newPassword, req.body.confirmPassword))
      // return 422 in case of invalid
      if(validationMessages.length) {
        return res.status(422).send(validationMessages.filter((vm) => vm != undefined))
      }
      
      const password = encryptUtil.cryptPassword(req.body.newPassword)
      persistedUser.password = password
      userDao.updateUser(persistedUser);
      res.sendStatus(200)
    } else {
      res.status(403).send({
        messageId: 'retrievePasswordError',
        message: `The token provided is not valid`,
        category: 'successMessage'
      }) 
    }
    
  })
})

app.post('/login', authenticate)

function authenticate(req, res) {
  let validationMessages = new ExtendedArray()

  validationMessages.pushArray(userValidation.validateUsernameForLogin(req.body.username))
  validationMessages.pushArray(userValidation.validatePasswordForLogin(req.body.password))
  // return 422 in case of invalid
  if(validationMessages.length) {
    return res.status(422).send(validationMessages.filter((vm) => vm != undefined))
  }

  const authData = req.body
  if (authenticateUsernameAndPassword(authData)) {
    const username = req.body.username
    const user = { 'username': username }
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user, process, process.env.REFRESH_TOKEN_SECRET)

    let clientInfo = requestUtil.getClientInfo(req)
    let accessTokenExpirationDate = jwt.decode(accessToken).exp * 1000
    let refreshTokenExpirationDate = jwt.decode(refreshToken).exp * 1000
    let refreshTokenCreatedDate = jwt.decode(refreshToken).iat * 1000
    logonDataDao.saveLogonData({
      username,
      refreshToken,
      clientInfo,
      refreshTokenCreatedDate,
      refreshTokenExpirationDate,
      remoteAddress: requestUtil.getRemoteAddress(req)
    })

    res.json({
      accessToken,
      refreshToken,
      username: authData.username,
      accessTokenExpirationDate,
      refreshTokenExpirationDate
    })
  } else {
    return res.sendStatus(401)
  }
}

function authenticateUsernameAndPassword(authData) {
    let user = userDao.retrieveUserByUsername(authData.username)
    return user && user.username && encryptUtil.comparePassword(authData.password, user.password) 
}

app.get('/userSessions', (req, res) => {
  let accessToken = null
  let authorizationHeader = req.headers['authorization']
  if(!authorizationHeader) res.sendStatus(403)
  else if(req.headers['authorization'].split(' ').length === 2) {
    accessToken = req.headers['authorization'].split(' ')[1]
  }
  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    else { 
      let queryResult = logonDataDao.filterLogonDataByUsername(user.username)
      if(queryResult) res.json(queryResult)
    }
  }) 
})


app.listen(4000)