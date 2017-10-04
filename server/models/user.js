
import { bookshelf } from '../db'

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
      email: data.email || null,
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
  }
}

export default API
export { User, UserAuth }
