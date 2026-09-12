/* global WIKI */

const crypto = require('crypto')
const moment = require('moment')
const Model = require('objection').Model

const TOKEN_PREFIX = 'ewt_live_'

module.exports = class PersonalToken extends Model {
  static get tableName () { return 'personalTokens' }
  static get jsonAttributes () { return ['scopes'] }

  static hash (token) {
    return crypto.createHmac('sha256', WIKI.config.sessionSecret).update(token).digest('hex')
  }

  static createToken () {
    const secret = crypto.randomBytes(32).toString('base64url')
    return `${TOKEN_PREFIX}${secret}`
  }

  static async issue ({ userId, name, expiresIn = '90d', scopes }) {
    const token = this.createToken()
    const expiresAt = moment.utc().add(require('ms')(expiresIn), 'ms').toISOString()
    const row = await this.query().insert({
      userId,
      name: name.trim(),
      tokenPrefix: token.slice(0, 18),
      tokenHash: this.hash(token),
      scopes: JSON.stringify(scopes),
      expiresAt,
      createdAt: moment.utc().toISOString()
    })
    return { token, row }
  }

  static async authenticate (token) {
    if (!token || !token.startsWith(TOKEN_PREFIX)) return null
    const row = await this.query().findOne('tokenHash', this.hash(token))
    if (!row || row.revokedAt || moment.utc().isAfter(moment(row.expiresAt))) return null
    const user = await WIKI.models.users.query().findById(row.userId).withGraphFetched('groups').modifyGraph('groups', builder => {
      builder.select('groups.id', 'permissions', 'pageRules', 'redirectOnLogin')
    })
    if (!user || !user.isActive) return null
    user.permissions = user.getGlobalPermissions()
    user.groups = user.getGroups()
    user.mcpScopes = JSON.parse(row.scopes || '[]')
    await this.query().findById(row.id).patch({ lastUsedAt: moment.utc().toISOString() })
    return { user, row }
  }
}
