exports.up = knex => knex.schema
  .createTable('mcpRequests', table => {
    table.string('id', 64).primary()
    table.integer('userId').notNullable()
    table.string('payloadHash', 64).notNullable()
    table.string('state', 20).notNullable()
    table.integer('pageId')
    table.string('createdAt').notNullable()
  })
  .createTable('mcpAttachments', table => {
    table.integer('assetId').primary()
    table.integer('pageId').notNullable().index()
    table.string('sha256', 64).notNullable()
    table.string('filename', 160).notNullable()
    table.string('mime', 100).notNullable()
  })
exports.down = async knex => {
  await knex.schema.dropTableIfExists('mcpAttachments')
  await knex.schema.dropTableIfExists('mcpRequests')
}
