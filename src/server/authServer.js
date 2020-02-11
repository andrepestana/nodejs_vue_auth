require('dotenv').config()
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const encryptUtil = require('./encryptUtil')
const userValidation = require('./validation/userValidation')
const ExtendedArray = require('./util/ExtendedArray.js')
const nodemailer = require('nodemailer');

const emailConfirmationEndPoint = '/confirmEmail'

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

let logonDataArray = []
let users = []

function isRefreshTokenActive(token) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    let filterResult = logonDataArray.filter(l => l.refreshToken === token)
    if(filterResult.length) return filterResult[0].revoked !== true
    else return false
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
}

function isEmailConfirmationTokenPending(emailConfirmationToken) {
  
  const username = jwt.decode(emailConfirmationToken).username

  if (process.env.FAKE_PERSISTENT_DATA) {
    let filterResult = users.filter(l => l.username === username)
    if(filterResult.length) return filterResult[0].confirmedEmail === false
    else return false
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
}

function revokeRefreshToken(token) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    let filterResult = logonDataArray.filter(l => l.refreshToken === token)
    if(filterResult.length) filterResult[0].revoked = true
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }  
}
function saveLogonInformation(logonData) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    return logonDataArray.push(logonData)
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
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

app.get(emailConfirmationEndPoint, (req, res) => {
  const emailConfirmationToken = req.query.emailConfirmationToken

  const emailConfirmationValidationErrorMessage = [{
    messageId: 'emailConfirmationError',
    message: `The link to confirm email is not valid`,
    category: 'validationMessage'
  }]

  if (emailConfirmationToken == null || !isEmailConfirmationTokenPending(emailConfirmationToken)) {
    return res.status(401).send(emailConfirmationValidationErrorMessage) 
  }

  jwt.verify(emailConfirmationToken, process.env.EMAIL_CONFIRMATION_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).send(emailConfirmationValidationErrorMessage) 
    
    let username = jwt.decode(emailConfirmationToken).username
    let updateUser = retrieveUserByUsername(username)
    updateUser.confirmedEmail = true
    saveUser(updateUser)
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

  if (!retrieveUserByUsername(user.username)) {
    saveUser(user);
    if(process.env.SEND_MAIL_ON_SIGNUP) {
      sendConfirmationMail(user)
    }
  } else {
    return res.sendStatus(409) //duplicate resource
  }
  authenticate(req, res)
})

function saveUser(user) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    let foundIndex = users.findIndex(u => u.username == user.username);
    if(foundIndex === -1)
      users.push(user)
    else {
      users[foundIndex] = user;
    }
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
}

function retrieveUserByUsername(username) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    return users.find(u => u.username === username)
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
}

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
  if (checkUsernameAndPassword(authData)) {
    const password = encryptUtil.cryptPassword(req.body.newPassword)
    const user = retrieveUserByUsername(username)
    user.password = password
    saveUser(user);
    res.sendStatus(200)
  } else {
    return res.sendStatus(401)
  }
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
  if (checkUsernameAndPassword(authData)) {
    const username = req.body.username
    const user = { 'username': username }
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user, process, process.env.REFRESH_TOKEN_SECRET)

    let clientInfo = getClientInfo(req)
    let accessTokenExpirationDate = jwt.decode(accessToken).exp * 1000
    let refreshTokenExpirationDate = jwt.decode(refreshToken).exp * 1000
    let refreshTokenCreatedDate = jwt.decode(refreshToken).iat * 1000
    saveLogonInformation({
      username,
      refreshToken,
      clientInfo,
      refreshTokenCreatedDate,
      refreshTokenExpirationDate,
      remoteAddress: getRemoteAddress(req)
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

function getRemoteAddress(req) {
    
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  var host = req.get('host')
  
  if(ip === "127.0.0.1" || ip === "::ffff:127.0.0.1" || ip === "::1" || host.indexOf("localhost") !== -1)
    return "localhost"
  else return ip
}

function getClientInfo(request) {
  let clientInfo = {
    clientIPaddr: null,
    clientProxy: null
  }

  // is client going through a proxy?
  if (request.headers['via']) {
    clientInfo.clientIPaddr = request.headers['x-forwarded-for']
    clientInfo.clientProxy = request.headers['via']
  } else {
    clientInfo.clientIPaddr = request.connection.remoteAddress
    clientInfo.clientProxy = "none"
  }
  clientInfo.userAgent = request.headers['user-agent']
  
  return clientInfo
}

function checkUsernameAndPassword(authData) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    let usersArray = users.filter(u => {
      return u.username === authData.username
    })
    return usersArray.length && encryptUtil.comparePassword(authData.password, usersArray[0].password) 
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
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
      if (process.env.FAKE_PERSISTENT_DATA) {
        let filterResult = logonDataArray.filter(l => l.username === user.username)
        if(filterResult) res.json(filterResult)
      } else {
        throw 'Not implemented yet for non fake persistent data'
      } 
    }
  }) 
})

function sendConfirmationMail(user) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: user.username,
    subject: 'User registration confirmation',
    html: `<p>User registration confirmation for <strong>${user.username}</strong></p><p>${generateConfirmationEmailToken(user)}`
  }

  transport.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  })
}

function generateConfirmationEmailToken(user) {
  return process.env.VUE_APP_AUTH_URL + emailConfirmationEndPoint + '?emailConfirmationToken=' + user.emailConfirmationToken
}


app.listen(4000)