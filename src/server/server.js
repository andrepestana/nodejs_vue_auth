require('dotenv').config()

const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const postDao = require('./dao/postDao')

app.use(express.json())

if (process.env.ALLOW_ACCESS_FROM_ANY_ORIGIN) {
  app.all('/*', function(req, res, next) {
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

app.get('/posts', authenticateToken, (req, res) => {
    res.json(postDao.findPostsByUsername(req.user.username))
})

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

app.listen(3000)