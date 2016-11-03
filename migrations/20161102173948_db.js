
exports.up = function (knex, Promise) {
  return Promise.all([
    knex.schema.createTable('Users', (table) => {
      table.increments('id').primary()
      table.string('username').unique().notNullable()
      table.string('displayName').notNullable()
      table.string('email').unique().defaultTo(null)
      table.integer('level').defaultTo(0).notNullable()
      table.string('avatarUrl').defaultTo('')
      table.boolean('canMakeShows').defaultTo(false).notNullable()
      table.timestamps()
    }),
    knex.schema.createTable('UserAuths', (table) => {
      table.increments('id').primary()
      table.string('provider')
      table.string('uid')
      table.string('username')
      table.string('displayName')
      table.string('email')
      table.string('avatarUrl')
      table.string('accessToken')
      table.string('refreshToken')
      table.integer('UserId').unsigned().notNullable()

      table.timestamps()

      table.unique(['uid', 'provider'])

      table.foreign('UserId').references('Users.id').onDelete('CASCADE').onUpdate('CASCADE')
    }),
    knex.schema.createTable('Shows', (table) => {
      table.increments('id').primary()
      table.string('name')
      table.string('description')
      table.string('twitter')
      table.string('art')
      table.string('url')
      table.string('authToken').unique().notNullable()
      table.integer('UserId').unsigned()

      table.timestamps()

      table.foreign('UserId').references('Users.id').onDelete('SET NULL').onUpdate('CASCADE')
    })
  ])
}

exports.down = function (knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('UserAuths'),
    knex.schema.dropTable('Shows'),
    knex.schema.dropTable('Users')
  ])
}
