require('dotenv').config()

const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')

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
    return logonDataArray.push(logonData);
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
}
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION })
}
function generateRefreshToken(user, process) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION });
}

app.post('/token', (req, res) => {
  const refreshToken = req.body.refreshToken

  if (refreshToken == null) return res.sendStatus(401) //unauthorized

  if (!isRefreshTokenActive(refreshToken)) return res.sendStatus(403) //forbidden

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = generateAccessToken({ 'username': user.username })
    
    res.json({ 
      accessToken: accessToken,
      refreshToken: refreshToken,
      username: jwt.decode(accessToken).username,
      accessTokenExpiresAt: jwt.decode(accessToken).exp,
      refreshTokenExpiresAt: jwt.decode(refreshToken).exp
    })
  })
})

app.post('/signup', (req, res) => {
  const user = {
    username: req.body.username,
    password: req.body.password
  }
  if (!retrieveUserByUsername(user.username)) {
    saveUser(user);
  } else {
    return res.sendStatus(409) //duplicate resource
  }
  authenticate(req, res)
})

function saveUser(user) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    users.push(user)
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

app.post('/login', authenticate)

function authenticate(req, res) {
  const authData = req.body

  if (checkUsernameAndPassword(authData)) {
    const username = req.body.username
    const user = { 'username': username }
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user, process, process.env.REFRESH_TOKEN_SECRET)

    let clientInfo = getClientInfo(req)
    saveLogonInformation({
      username,
      refreshToken,
      clientInfo
    })

    res.json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      username: authData.username,
      accessTokenExpiresAt: jwt.decode(accessToken).exp,
      refreshTokenExpiresAt: jwt.decode(refreshToken).exp
    })
  } else {
    return res.sendStatus(401)
  }
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
      return u.username === authData.username && u.password === authData.password
    })
    return usersArray.length
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
}



app.listen(4000)