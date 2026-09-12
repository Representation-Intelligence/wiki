const Model = require('objection').Model

module.exports = class McpAuditEvent extends Model {
  static get tableName () { return 'mcpAuditEvents' }
  static get jsonAttributes () { return ['metadata'] }
}
