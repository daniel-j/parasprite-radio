
import { bookshelf } from '../db'
import token from '../utils/token'

const User = bookshelf.Model.extend({
  tableName: 'Users',
  hasTimestamps: true,

  auths () {
    return this.hasMany(UserAuth, 'UserId')
  }
})

const UserAuth = bookshelf.Model.extend({
  tableName: 'UserAuths',
  hasTimestamps: true,

  user () {
    return this.belongsTo(User, 'UserId')
  }
})

const Show = bookshelf.Model.extend({
  tableName: 'Shows',
  hasTimestamps: true,

  user () {
    return this.belongsTo(User, 'UserId')
  }
})

const API = {
  findById: async function (id, withAuth = false) {
    let user = await User.forge({id: id}).fetch({
      columns: ['id', 'username', 'displayName', 'email', 'level', 'avatarUrl', 'canMakeShows']
    })
    if (!user) return null
    user = user.serialize()
    user.auths = null
    if (withAuth) {
      let auths = await UserAuth.forge({UserId: user.id}).fetch({
        columns: ['provider', 'username', 'displayName', 'email', 'avatarUrl']
      })
      user.auths = auths.serialize()
    }
    return user
  },

  update: async function (id, data) {
    let user = User.forge({id: id})
    await user.save({
      username: data.username,
      displayName: data.displayName,
      email: data.email,
      avatarUrl: data.avatarUrl
    }, {patch: true, method: 'update'})
    return API.findById(id, true)
  },

  handleAuth: async function (info) {
    let userAuth = await UserAuth.forge({provider: info.provider, uid: info.uid}).fetch()
    if (!userAuth) {
      let user = User.forge({
        username: info.username,
        displayName: info.displayName,
        email: info.email,
        avatarUrl: info.avatarUrl
      })
      user = await user.save()
      userAuth = UserAuth.forge({
        provider: info.provider,
        uid: info.uid,
        accessToken: info.accessToken,
        refreshToken: info.refreshToken,
        username: info.username,
        displayName: info.displayName,
        email: info.email,
        avatarUrl: info.avatarUrl,
        UserId: user.get('id')
      })
      userAuth = await userAuth.save()
      return user.serialize()
    } else {
      userAuth.set({
        accessToken: info.accessToken,
        refreshToken: info.refreshToken,
        username: info.username,
        displayName: info.displayName,
        email: info.email,
        avatarUrl: info.avatarUrl
      })
      userAuth = await userAuth.save()
      let user = await User.forge({id: userAuth.get('UserId')}).fetch()
      return user.serialize()
    }
  },

  // TODO: Move show methods to its own file
  createShow: async function (userId, info) {
    let user = await User.forge({id: userId, canMakeShows: true}).fetch()
    if (!user) {
      throw new Error('permission denied')
    }
    return Show
      .forge({
        name: info.name,
        description: info.description,
        twitter: info.twitter,
        art: info.art,
        url: info.url,
        authToken: token.generate(),
        UserId: user.id
      })
      .save()
  },

  getShows (userId) {
    return Show.forge()
      .where({UserId: userId})
      .orderBy('name', 'ASC')
      .fetchAll({columns: ['id', 'name', 'description', 'twitter', 'art', 'url', 'authToken']})
  },

  updateShow (userId, showId, info) {
    return Show.forge()
      .where({UserId: userId, id: showId})
      .save({
        name: info.name,
        description: info.description,
        url: info.url,
        twitter: info.twitter
      }, {patch: true, method: 'update'})
  },

  removeShow (userId, showId) {
    return Show.forge()
      .where({UserId: userId, id: showId})
      .destroy()
  },

  authUserWithShow: async function (authToken) {
    let show = await Show.forge({authToken: authToken}).fetch()
    if (!show) {
      throw new Error('Invalid auth token')
    }
    let user = await API.findById(show.get('UserId'))
    if (!user) {
      throw new Error('Permission denied')
    }
    return {show, user}
  },

  updateToken: async function (userId, showId) {
    let newToken = token.generate()
    await Show.forge({UserId: userId, id: showId}).set({authToken: newToken}).save()
    return newToken
  }
}

export default API
