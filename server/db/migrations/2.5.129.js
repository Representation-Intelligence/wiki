exports.up = knex => knex.schema.createTable('personalTokens', table => {
  table.increments('id').primary()
  table.integer('userId').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
  table.string('name', 120).notNullable()
  table.string('tokenPrefix', 32).notNullable()
  table.string('tokenHash', 64).notNullable().unique()
  table.json('scopes').notNullable()
  table.string('createdAt').notNullable()
  table.string('expiresAt').notNullable()
  table.string('lastUsedAt')
  table.string('revokedAt')
})

exports.down = knex => knex.schema.dropTableIfExists('personalTokens')
