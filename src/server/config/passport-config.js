const LocalStrategy = require('passport-local').Strategy
const encryptUtil = require('../util/encryptUtil')

function initialize(passport, getUserByUsername, getUserById) {
  const authenticateUser = async (username, password, done) => {
    const user = getUserByUsername(username)
    if (user == null) {
      return done(null, false, { message: 'No user with that email' })
    }

    try {
      if ( encryptUtil.comparePassword(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }

  passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.username))
  passport.deserializeUser((username, done) => {
    return done(null, getUserByUsername(username))
  })
}

module.exports = initialize