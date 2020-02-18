const express = require('express')
const router = express.Router()
const userValidation = require('../validation/userValidation')
const encryptUtil = require('../util/encryptUtil')
const jwt = require('jsonwebtoken')
const userDao = require('../dao/userDao')
const logonDataDao = require('../dao/logonDataDao')
const extendedArray = require('../util/extendedArray')
const mailSender = require('../mail/mailSender')
const requestUtil = require('../util/requestUtil')
const messageUtil = require('../../common/messageUtil')
const authEndpoints = require('./authEndpoints')


router.post(authEndpoints.LOGIN, authenticate)

router.delete(authEndpoints.LOGOUT, (req, res) => {
    revokeRefreshToken(req.query.refreshToken)
    res.status(200).send({ 
      messages: messageUtil.successMessages(authEndpoints.LOGIN, 
                                            'You\'ve been logged out.')
    })
})

router.post(authEndpoints.SIGNUP, (req, res) => {
    let validationMessages = new extendedArray()
   
    // validate form
    validationMessages.pushArray(userValidation.validateUsername(req.body.username))
    validationMessages.pushArray(userValidation.validateUsernameDoesntExist(req.body.username))
    validationMessages.pushArray(userValidation.validatePassword(req.body.password))
    validationMessages.pushArray(userValidation.validateConfirmPassword(req.body.password, req.body.confirmPassword))
    validationMessages.pushArray(userValidation.validateAge(req.body.age))
    validationMessages.pushArray(userValidation.validateTerms(req.body.terms))
    
    // return 422 in case of invalid
    if(validationMessages.length) {
      return res.status(422).send({ messages: validationMessages })
    }
  
    const password = encryptUtil.cryptPassword(req.body.password)
    const user = {
      username: req.body.username,
      password,
      age: req.body.age,
      confirmedEmail: false,
      emailConfirmationToken: generateEmailConfirmationToken({ 'username': req.body.username })
    }
      
    userDao.saveUser(user);
    if(process.env.SEND_MAIL_ON_SIGNUP === 'true') {
        mailSender.sendConfirmationMail(user)
    }
    
    authenticate(req, res)
})

router.get(authEndpoints.CONFIRM_EMAIL, (req, res) => {
    const emailConfirmationToken = req.query.emailConfirmationToken
  
    const emailConfirmationValidationErrorMessage = { 
      messages: messageUtil.successMessages(authEndpoints.CONFIRM_EMAIL, 
                                            `The link to confirm email is not valid`)
    }
  
    if (emailConfirmationToken == null || !isEmailConfirmationTokenPending(emailConfirmationToken)) {
      return res.status(401).send(emailConfirmationValidationErrorMessage) 
    }
  
    jwt.verify(emailConfirmationToken, process.env.EMAIL_CONFIRMATION_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(403).send(emailConfirmationValidationErrorMessage) 
      
      let username = jwt.decode(emailConfirmationToken).username
      let persistedUser = userDao.retrieveUserByUsername(username)
      persistedUser.confirmedEmail = true
      userDao.updateUser(persistedUser)
      res.json({
        messages: messageUtil.successMessages(authEndpoints.CONFIRM_EMAIL, 
                                              `The email address has been confirmed for ${ username }`)
      })
    })
  })

router.post(authEndpoints.CHANGE_PASSWORD, (req, res) => {
    let accessToken = null
    let authorizationHeader = req.headers['authorization']
    if(!authorizationHeader) res.sendStatus(403)
    else if(req.headers['authorization'].split(' ').length === 2) {
      accessToken = req.headers['authorization'].split(' ')[1]
    }
    
    const authData = req.body
    const username = jwt.decode(accessToken).username
    
    let validationMessages = new extendedArray()
    validationMessages.pushArray(userValidation.validatePasswordForLogin(req.body.password))
    validationMessages.pushArray(userValidation.validateUserIsAuthenticated(username, req.body.password))
    validationMessages.pushArray(userValidation.validateNewPassword(req.body.newPassword, req.body.password))
    validationMessages.pushArray(userValidation.validateConfirmPassword(req.body.newPassword, req.body.confirmPassword))
    // return 422 in case of invalid
    if(validationMessages.length) {
      return res.status(422).send({ messages: validationMessages })
    }
  
    authData.username = username
      const password = encryptUtil.cryptPassword(req.body.newPassword)
      const user = userDao.retrieveUserByUsername(username)
      user.password = password
      userDao.updateUser(user);
      res.status(200).send({
          messages: messageUtil.successMessages(authEndpoints.CHANGE_PASSWORD, 
                                              'Your password was successfully changed.')
      })
})
  
router.post(authEndpoints.TOKEN, (req, res) => {
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

router.post(authEndpoints.SEND_EMAIL_TO_RETRIEVE_PASSWORD, (req, res) => {
    let validationMessages = new extendedArray()
   
    // validate form
    validationMessages.pushArray(userValidation.validateUsername(req.body.username))
    if(!validationMessages.length)
      validationMessages.pushArray(userValidation.validateUsernameExists(req.body.username))
    
    // return 422 in case of invalid
    if(validationMessages.length) {
      return res.status(422).send({
        messages: validationMessages
      })
    }
    const retrievePasswordToken = generateRetrievePasswordToken({ 'username': req.body.username })
    mailSender.sendRetrievePasswordMail(req.body, retrievePasswordToken, function(error, info) {
      if (error) {
        res.status(500).send({
          messages: messageUtil.errorMessages(authEndpoints.SEND_EMAIL_TO_RETRIEVE_PASSWORD, error)
        })
      } else {
        res.status(200).send({
          messages: messageUtil.successMessages(authEndpoints.SEND_EMAIL_TO_RETRIEVE_PASSWORD, 
                                                `An email was sent to ${req.body.username}. Check you inbox mail.`)
        })
      }
    })
    
})
   
router.post(authEndpoints.CHANGE_LOST_PASSWORD, (req, res) => {
    jwt.verify(req.body.retrievePasswordToken, process.env.RETRIEVE_PASSWORD_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(403).send({
        messages: messageUtil.validationMessages(authEndpoints.CHANGE_LOST_PASSWORD, `The token provided is not valid`)
      }) 
      
      const username = user.username
      const persistedUser = userDao.retrieveUserByUsername(username)
      if(persistedUser) {
  
        let validationMessages = new extendedArray()
        validationMessages.pushArray(userValidation.validateNewPassword(req.body.newPassword, req.body.password))
        validationMessages.pushArray(userValidation.validateConfirmPassword(req.body.newPassword, req.body.confirmPassword))
        // return 422 in case of invalid
        if(validationMessages.length) {
          return res.status(422).send({
              messages: validationMessages
          })
        }
        
        const password = encryptUtil.cryptPassword(req.body.newPassword)
        persistedUser.password = password
        userDao.updateUser(persistedUser);
        res.status(200).send({
            messages: messageUtil.successMessages(authEndpoints.CHANGE_LOST_PASSWORD, `Your password was successfully changed.`)
        })
      } else {
        res.status(403).send({
            messages: messageUtil.validationMessages(authEndpoints.CHANGE_LOST_PASSWORD, `The token provided is not valid`)
        }) 
      }
      
    })
})

router.get(authEndpoints.USER_SESSIONS, (req, res) => {
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

function authenticate(req, res) {
    let validationMessages = new extendedArray()
  
    validationMessages.pushArray(userValidation.validateUsernameForLogin(req.body.username))
    validationMessages.pushArray(userValidation.validatePasswordForLogin(req.body.password))
    // return 422 in case of invalid
    if(validationMessages.length) {
      return res.status(422).send({ messages: validationMessages })
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
      return res.status(401).send({
          messages: messageUtil.validationMessages('usernameAndPasswordAuthentication', 'Username or Password invalid')
      })
    }
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

function authenticateUsernameAndPassword(authData) {
    let user = userDao.retrieveUserByUsername(authData.username)
    return user && user.username && encryptUtil.comparePassword(authData.password, user.password) 
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
function revokeRefreshToken(token) {
    let filterResult = logonDataDao.findLogonDataByRefreshToken(token)
    if(filterResult.length) filterResult[0].revoked = true
}
function generateRetrievePasswordToken(user) {
    return jwt.sign(user, process.env.RETRIEVE_PASSWORD_TOKEN_SECRET, { expiresIn: process.env.RETRIEVE_PASSWORD_TOKEN_EXPIRATION })
}

module.exports = router;