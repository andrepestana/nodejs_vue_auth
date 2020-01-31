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

let refreshTokens = []
let users = []

function isRefreshTokenActive(refreshToken) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    return refreshTokens.includes(refreshToken);
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
}
function deleteRefreshToken(token) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    return refreshTokens = refreshTokens.filter(t => t !== token);
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }  
}
function saveRefreshToken(refreshToken) {
  if (process.env.FAKE_PERSISTENT_DATA) {
    return refreshTokens.push(refreshToken);
  } else {
    throw 'Not implemented yet for non fake persistent data'
  }
}
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION })
}
function generateRefreshToken(user, process) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

app.post('/token', (req, res) => {
  const refreshToken = req.body.token

  if (refreshToken == null) return res.sendStatus(401) //unauthorized

  if (!isRefreshTokenActive(refreshToken)) return res.sendStatus(403) //forbidden

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = generateAccessToken({ name: user.name })
    res.json({ accessToken: accessToken })
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
  deleteRefreshToken(req.body.token)
  res.sendStatus(204)
})

app.post('/login', authenticate)

function authenticate(req, res) {
  const authData = req.body

  if (checkUsernameAndPassword(authData)) {
    const username = req.body.username
    const user = { name: username }
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user, process, process.env.REFRESH_TOKEN_SECRET)

    saveRefreshToken(refreshToken)

    res.json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      username: authData.username,
      expiresAt: jwt.decode(accessToken).exp
    })
  } else {
    return res.sendStatus(401)
  }
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