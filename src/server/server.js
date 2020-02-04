require('dotenv').config()

const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')

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

let posts = []

if (process.env.FAKE_PERSISTENT_DATA) {
  posts = [
    {
      username: 'a@a.com',
      title: 'Post 1',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc hendrerit lectus id arcu lobortis, eu congue lorem euismod. Nunc aliquam ullamcorper interdum. Fusce diam nibh, accumsan sed sollicitudin a, accumsan sed metus. Donec vestibulum congue lacinia. Mauris odio elit, auctor sed ligula eget, tempor convallis tortor. Nam consectetur ex in elementum auctor. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris sodales molestie magna, at vestibulum magna ornare at. Aenean eget ex eros. Pellentesque vel libero id purus semper ullamcorper. Cras eget venenatis est. Quisque venenatis eu est eget mollis. Integer tincidunt at quam eu scelerisque.'
    },
    {
      username: 'a@a.com',
      title: 'Post 2',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc hendrerit lectus id arcu lobortis, eu congue lorem euismod. Nunc aliquam ullamcorper interdum. Fusce diam nibh, accumsan sed sollicitudin a, accumsan sed metus. Donec vestibulum congue lacinia. Mauris odio elit, auctor sed ligula eget, tempor convallis tortor. Nam consectetur ex in elementum auctor. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris sodales molestie magna, at vestibulum magna ornare at. Aenean eget ex eros. Pellentesque vel libero id purus semper ullamcorper. Cras eget venenatis est. Quisque venenatis eu est eget mollis. Integer tincidunt at quam eu scelerisque.'
    },
    {
      username: 'test@test.com',
      title: 'Post 3',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc hendrerit lectus id arcu lobortis, eu congue lorem euismod. Nunc aliquam ullamcorper interdum. Fusce diam nibh, accumsan sed sollicitudin a, accumsan sed metus. Donec vestibulum congue lacinia. Mauris odio elit, auctor sed ligula eget, tempor convallis tortor. Nam consectetur ex in elementum auctor. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris sodales molestie magna, at vestibulum magna ornare at. Aenean eget ex eros. Pellentesque vel libero id purus semper ullamcorper. Cras eget venenatis est. Quisque venenatis eu est eget mollis. Integer tincidunt at quam eu scelerisque.'
    },
    {
      username: 'test@test.com',
      title: 'Post 4',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc hendrerit lectus id arcu lobortis, eu congue lorem euismod. Nunc aliquam ullamcorper interdum. Fusce diam nibh, accumsan sed sollicitudin a, accumsan sed metus. Donec vestibulum congue lacinia. Mauris odio elit, auctor sed ligula eget, tempor convallis tortor. Nam consectetur ex in elementum auctor. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris sodales molestie magna, at vestibulum magna ornare at. Aenean eget ex eros. Pellentesque vel libero id purus semper ullamcorper. Cras eget venenatis est. Quisque venenatis eu est eget mollis. Integer tincidunt at quam eu scelerisque.'
    }
  ]
} else {
  throw 'Not implemented yet for non fake persistent data'
}

if (process.env.FAKE_PERSISTENT_DATA) {
  app.get('/posts', authenticateToken, (req, res) => {
    res.json(posts.filter(post => post.username === req.user.username))
  })
} else {
  throw 'Not implemented yet for non fake persistent data'
}

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