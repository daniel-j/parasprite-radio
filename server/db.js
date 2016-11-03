import Knex from 'knex'
import Bookshelf from 'bookshelf'
import knexconfig from '../knexfile'

const knex = Knex(knexconfig)
const bookshelf = Bookshelf(knex)

export { bookshelf, knex }
