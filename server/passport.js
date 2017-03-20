
import passport from 'passport'
import { Strategy as TwitterStrategy } from 'passport-twitter'
import { Strategy as OAuth2Strategy } from 'passport-oauth2'
import User from './models/user'
import config from '../scripts/config'
import { fetchJSON } from '../scripts/fetcher'

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
  // console.log("SERIALIZE", user.id)
  done(null, user.id)
})

// used to deserialize the user
passport.deserializeUser(function (id, done) {
  // console.log "UNSERIALIZE", id
  User.findById(id).then((user) => done(null, user)).catch((err) => done(err))
})

if (config.passport.poniverse && config.passport.poniverse.clientID) {
  const poniverse = new OAuth2Strategy(config.passport.poniverse, function (accessToken, refreshToken, profile, done) {
    let provider = 'poniverse'
    fetchJSON('https://api.poniverse.net/v1/users/me?access_token=' + accessToken, null, function (err, data) {
      if (err) {
        done(err, null)
        return
      }

      let userInfo = {
        provider: provider,
        accessToken: accessToken,
        refreshToken: refreshToken,
        uid: data.id,

        username: data.username,
        displayName: data.display_name,
        email: data.email,
        level: 0,
        avatarUrl: ''
      }

      User.handleAuth(userInfo).then((user) => done(null, user)).catch((err) => { throw err })
    })
  })

  poniverse.name = 'poniverse' // replace 'oauth2'
  passport.use(poniverse)
}

if (config.passport.trotland && config.passport.trotland.clientID) {
  const trotland = new OAuth2Strategy(config.passport.trotland, function (accessToken, refreshToken, profile, done) {
    let provider = 'trotland'
    fetchJSON('https://trotland.ml/oauth2/user?access_token=' + accessToken, null, function (err, data) {
      if (err) {
        done(err, null)
        return
      }

      let userInfo = {
        provider: provider,
        accessToken: accessToken,
        refreshToken: refreshToken,
        uid: data.id,

        username: data.username,
        displayName: data.display_name,
        email: data.email,
        level: 0,
        avatarUrl: ''
      }

      User.handleAuth(userInfo).then((user) => done(null, user)).catch((err) => { throw err })
    })
  })

  trotland.name = 'trotland' // replace 'oauth2'
  passport.use(trotland)
}

if (config.passport.twitter && config.passport.twitter.consumerKey) {
  passport.use(new TwitterStrategy(config.passport.twitter, function (accessToken, refreshToken, profile, done) {
    let provider = 'twitter'

    let userInfo = {
      provider: provider,
      accessToken: accessToken,
      refreshToken: refreshToken,
      uid: profile.id,

      username: profile.username,
      displayName: profile.displayName,
      level: 0,
      avatarUrl: profile.photos[0].value
    }

    User.handleAuth(userInfo).then((user) => done(null, user)).catch((err) => { throw err })
  }))
}
