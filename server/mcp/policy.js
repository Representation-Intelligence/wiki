/* global WIKI */
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const SCOPES = ['wiki:read', 'wiki:create', 'wiki:update', 'wiki:upload', 'wiki:publish:team']

function fail (code, message) {
  const error = new Error(message)
  error.publicCode = code
  return error
}
async function member (id) {
  const user = await WIKI.models.users.query().findById(id).withGraphFetched('groups')
  if (!user || !user.isActive || !user.isVerified || user.id === 2) throw fail('UNAUTHORIZED', '账号未启用或尚未验证')
  user.permissions = user.getGlobalPermissions()
  if (!user.permissions.includes('manage:system') && !/^[^@\s]+@ewo\.so$/i.test(user.email)) throw fail('FORBIDDEN', '仅允许已验证的 ewo.so 成员')
  user.groups = user.getGroups()
  return user
}
async function browserMember (req, mutation = false) {
  const cookie = req.cookies && req.cookies.jwt
  const payload = cookie && jwt.decode(cookie)
  if (!req.user || req.mcpToken || !payload || payload.api || payload.id !== req.user.id) throw fail('UNAUTHORIZED', '请使用 Wiki 网页登录管理连接')
  const origin = req.get('origin')
  if (origin && origin !== new URL(WIKI.config.host).origin) throw fail('FORBIDDEN', '来源不受信任')
  if (mutation && req.get('x-ewo-mcp-ui') !== '1') throw fail('FORBIDDEN', '缺少网页操作标识')
  return member(req.user.id)
}
function requireScope (context, scope) {
  // Administrators remain bounded by the grant on this token.
  if (!context.scopes.includes(scope)) throw fail('FORBIDDEN', `当前 Key 缺少 ${scope}`)
}
function access (user, page, write = false) {
  if (!WIKI.auth.checkAccess(user, [write ? 'write:pages' : 'read:pages'], { path: page.path, locale: page.localeCode, tags: (page.tags || []).map(t => t.tag || t) })) throw fail('NOT_FOUND', '内容不存在或无权访问')
  if (!write && !page.isPublished && !WIKI.auth.checkAccess(user, ['write:pages'], { path: page.path, locale: page.localeCode })) throw fail('NOT_FOUND', '内容不存在或无权访问')
}
function hash (data) { return crypto.createHash('sha256').update(data).digest('hex') }
function extra (page) { return typeof page.extra === 'string' ? JSON.parse(page.extra) : (page.extra || {}) }
function visibility (page) { return page.path.startsWith('public/') ? 'public' : 'team' }
function slug (value) {
  const ascii = value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  return ascii || `item-${hash(value).slice(0, 12)}`
}
function present (page) {
  return { postId: page.id, title: page.title, path: page.path, url: `${WIKI.config.host}/${page.localeCode}/${page.path}`, content: page.content, tags: (page.tags || []).map(t => t.tag || t), project: extra(page).project || null, visibility: visibility(page), status: page.isPublished ? 'published' : 'draft', revision: page.updatedAt, authorId: page.authorId, creatorId: page.creatorId, reviewUrl: visibility(page) === 'public' ? `${WIKI.config.host}/mcp-review/${page.id}` : null }
}
module.exports = { SCOPES, fail, member, browserMember, requireScope, access, hash, extra, visibility, slug, present }
