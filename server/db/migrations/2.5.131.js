exports.up = knex => knex.schema.createTable('mcpAuditEvents', table => {
  table.increments('id').primary()
  table.string('requestId', 100).notNullable().index()
  table.integer('userId').unsigned().references('id').inTable('users').onDelete('SET NULL')
  table.integer('tokenId').unsigned().references('id').inTable('personalTokens').onDelete('SET NULL')
  table.string('tool', 80).notNullable()
  table.string('status', 20).notNullable()
  table.integer('targetId').unsigned()
  table.json('metadata').notNullable()
  table.string('createdAt').notNullable()
})

exports.down = knex => knex.schema.dropTableIfExists('mcpAuditEvents')
