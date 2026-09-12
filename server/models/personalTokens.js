/* global WIKI */
const crypto = require('crypto')
const Model = require('objection').Model
const policy = require('../mcp/policy')

module.exports = class PersonalToken extends Model {
  static get tableName () { return 'personalTokens' }
  static get jsonAttributes () { return ['scopes'] }
  static async issue ({ userId, name, expiresIn = '90d', scopes = policy.SCOPES }) {
    await policy.member(userId)
    if (typeof name !== 'string' || !name.trim() || name.length > 120) throw policy.fail('INVALID_INPUT', 'Key 名称需要 1 至 120 个字符')
    if (!/^[1-9][0-9]{0,2}d$/.test(expiresIn) || parseInt(expiresIn, 10) > 365) throw policy.fail('INVALID_INPUT', '有效期应为 1 至 365 天')
    if (!Array.isArray(scopes) || !scopes.length || scopes.some(s => !policy.SCOPES.includes(s))) throw policy.fail('INVALID_INPUT', 'Key 权限范围不合法')
    const token = `ewt_live_${crypto.randomBytes(32).toString('base64url')}`
    const row = await WIKI.models.knex.transaction(async transaction => {
      const owner = WIKI.models.users.query(transaction).findById(userId)
      if (WIKI.config.db.type !== 'sqlite') owner.forUpdate()
      await owner
      const count = await this.query(transaction).where({ userId, revokedAt: null }).where('expiresAt', '>', new Date().toISOString()).resultSize()
      if (count >= 20) throw policy.fail('LIMIT_EXCEEDED', '最多保留 20 个有效 Key，请先撤销旧 Key')
      const saved = await this.query(transaction).insert({ userId, name: name.trim(), tokenPrefix: token.slice(0, 18), tokenHash: policy.hash(token), scopes: [...new Set(scopes)], createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + parseInt(expiresIn, 10) * 86400000).toISOString() })
      await WIKI.models.mcpAuditEvents.query(transaction).insert({ requestId: crypto.randomUUID(), userId, tokenId: saved.id, tool: 'token_created', status: 'complete', metadata: {}, createdAt: new Date().toISOString() })
      return saved
    })
    return { token, row }
  }
  static async authenticate (token) {
    if (typeof token !== 'string' || !/^ewt_live_[A-Za-z0-9_-]{43}$/.test(token)) return null
    const row = await this.query().findOne('tokenHash', policy.hash(token))
    if (!row || row.revokedAt || !Number.isFinite(Date.parse(row.expiresAt)) || Date.parse(row.expiresAt) <= Date.now()) return null
    if (!Array.isArray(row.scopes) || row.scopes.some(s => !policy.SCOPES.includes(s))) return null
    let user
    try { user = await policy.member(row.userId) } catch { return null }
    if (!row.lastUsedAt || Date.now() - Date.parse(row.lastUsedAt) > 60000) await this.query().findById(row.id).patch({ lastUsedAt: new Date().toISOString() })
    return { user, row }
  }
}
