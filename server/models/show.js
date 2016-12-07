
import { bookshelf } from '../db'
import token from '../utils/token'
import UserAPI, { User } from './user'

const Show = bookshelf.Model.extend({
  tableName: 'Shows',
  hasTimestamps: true,

  user () {
    return this.belongsTo(User, 'UserId')
  }
})

const API = {
  create: async function (userId, info) {
    let user = await User.forge({id: userId}).where({canMakeShows: true}).fetch()
    if (!user) {
      throw new Error('Permission denied')
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
      .query((qb) => qb.innerJoin('Users', 'Users.id', 'Shows.UserId'))
      .orderBy('name', 'ASC')
      .fetchAll({columns: ['Shows.id', 'name', 'description', 'twitter', 'art', 'url', 'authToken', 'UserId', 'displayName']})
  },

  update (userId, showId, info) {
    return Show.forge({id: showId})
      .where({UserId: userId})
      .save({
        name: info.name,
        description: info.description,
        url: info.url,
        twitter: info.twitter
      }, {patch: true, method: 'update'})
  },

  remove (userId, showId) {
    return Show.forge({id: showId})
      .where({UserId: userId})
      .destroy()
  },

  updateToken: async function (userId, showId) {
    let newToken = token.generate()
    await Show.forge({id: showId}).where({UserId: userId}).set({authToken: newToken}).save()
    return newToken
  },

  authUser: async function (authToken) {
    let show = await Show.forge().where({authToken: authToken}).fetch()
    if (!show) {
      throw new Error('Invalid auth token')
    }
    let user = await UserAPI.findById(show.get('UserId'))
    if (!user) {
      throw new Error('Permission denied')
    }
    return {show, user}
  }
}

export default API
export { Show }
