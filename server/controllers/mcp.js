/* global WIKI */

const express = require('express')
const crypto = require('crypto')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const _ = require('lodash')
const router = express.Router()

const tools = [
  { name: 'wiki_get_identity', description: '返回当前成员身份和 MCP 权限', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'wiki_list_projects', description: '列出当前可见项目目录', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'wiki_search_posts', description: '搜索当前成员有权访问的 Post', inputSchema: { type: 'object', properties: { query: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, project: { type: 'string' } }, required: ['query'], additionalProperties: false } },
  { name: 'wiki_get_post', description: '读取一个 Post 的正文和元数据', inputSchema: { type: 'object', properties: { postId: { type: 'integer' } }, required: ['postId'], additionalProperties: false } },
  { name: 'wiki_create_post', description: '创建 Post；team 可直接发布，public 默认只能创建草稿', inputSchema: { type: 'object', properties: { title: { type: 'string', minLength: 1, maxLength: 200 }, content: { type: 'string', minLength: 1, maxLength: 1000000 }, visibility: { type: 'string', enum: ['team', 'public'] }, tags: { type: 'array', items: { type: 'string', maxLength: 50 }, maxItems: 20 }, project: { type: 'string', maxLength: 80 }, publish: { type: 'boolean' }, idempotencyKey: { type: 'string', minLength: 8, maxLength: 100 } }, required: ['title', 'content', 'visibility', 'idempotencyKey'], additionalProperties: false } },
  { name: 'wiki_update_post', description: '更新 Post；必须提供 expectedRevision 防止覆盖他人修改', inputSchema: { type: 'object', properties: { postId: { type: 'integer' }, title: { type: 'string', maxLength: 200 }, content: { type: 'string', maxLength: 1000000 }, tags: { type: 'array', items: { type: 'string', maxLength: 50 }, maxItems: 20 }, publish: { type: 'boolean' }, expectedRevision: { type: 'string' } }, required: ['postId', 'expectedRevision'], additionalProperties: false } },
  { name: 'wiki_publish_post', description: '发布 team Post；public 需要 wiki:publish:public', inputSchema: { type: 'object', properties: { postId: { type: 'integer' }, expectedRevision: { type: 'string' } }, required: ['postId', 'expectedRevision'], additionalProperties: false } },
  { name: 'wiki_upload_attachment', description: '上传并校验 Post 附件', inputSchema: { type: 'object', properties: { postId: { type: 'integer' }, filename: { type: 'string', maxLength: 160 }, mime: { type: 'string', maxLength: 100 }, dataBase64: { type: 'string', maxLength: 7000000 }, sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' } }, required: ['postId', 'filename', 'mime', 'dataBase64', 'sha256'], additionalProperties: false } }
]

function error (code, message) {
  return { code, message }
}

function scope (req, wanted) {
  if (req.user && req.user.permissions && req.user.permissions.includes('manage:system')) return true
  return tokenScopes(req).includes(wanted)
}

function tokenScopes (req) {
  if (!req.mcpToken) return []
  if (Array.isArray(req.mcpToken.scopes)) return req.mcpToken.scopes
  if (typeof req.mcpToken.scopes === 'string' && req.mcpToken.scopes.startsWith('[')) return JSON.parse(req.mcpToken.scopes)
  return typeof req.mcpToken.scopes === 'string' ? req.mcpToken.scopes.split(',').filter(Boolean) : []
}

function requireScope (req, wanted) {
  if (!scope(req, wanted)) throw error(-32003, `缺少权限 ${wanted}`)
}

function slugify (value) {
  const slug = value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
  return slug || `post-${crypto.randomBytes(5).toString('hex')}`
}

function pagePath ({ title, visibility, project }) {
  const prefix = visibility === 'public' ? 'public' : 'team'
  const base = project ? `projects/${slugify(project)}` : 'posts'
  return `${prefix}/${base}/${slugify(title)}`
}

function readExtra (page) {
  try { return typeof page.extra === 'string' ? JSON.parse(page.extra) : (page.extra || {}) } catch { return {} }
}

function publicPage (page) {
  const extra = readExtra(page)
  return { id: page.id, path: page.path.replace(/^(public|team)\//, ''), title: page.title, description: page.description, content: page.content, tags: (page.tags || []).map(t => t.tag || t), visibility: extra.visibility || (page.path.startsWith('public/') ? 'public' : 'team'), project: extra.project || null, isPublished: page.isPublished, revision: page.updatedAt, authorId: page.authorId, creatorId: page.creatorId }
}

async function getPage (id) {
  const page = await WIKI.models.pages.getPageFromDb(id)
  if (!page || !WIKI.auth.checkAccess({ ...WIKI.auth.guest, permissions: [] }, ['read:pages'], { path: page.path, locale: page.localeCode })) return page
  return page
}

async function findVisiblePage (req, id, writable = false) {
  const page = await WIKI.models.pages.getPageFromDb(id)
  if (!page) throw error(-32004, '页面不存在')
  const needed = writable ? 'write:pages' : 'read:pages'
  if (!WIKI.auth.checkAccess(req.user, [needed], { path: page.path, locale: page.localeCode })) throw error(-32003, '无权访问此页面')
  return page
}

async function dispatch (req, name, args) {
  if (!req.mcpToken && !(req.user && req.user.permissions && req.user.permissions.includes('manage:system'))) throw error(-32001, '需要 MCP Token')
  switch (name) {
    case 'wiki_get_identity':
      requireScope(req, 'wiki:read')
      return { userId: req.user.id, email: req.user.email, name: req.user.name, scopes: tokenScopes(req) }
    case 'wiki_list_projects': {
      requireScope(req, 'wiki:read')
      const pages = await WIKI.models.pages.query().where('localeCode', WIKI.config.lang.code).where('isPublished', true)
      const projects = _.uniq(pages.filter(p => WIKI.auth.checkAccess(req.user, ['read:pages'], { path: p.path, locale: p.localeCode })).map(p => p.path.match(/^(?:public|team)\/projects\/([^/]+)/)?.[1]).filter(Boolean))
      return projects.map(slug => ({ slug, path: `projects/${slug}` }))
    }
    case 'wiki_search_posts': {
      requireScope(req, 'wiki:read')
      const query = String(args.query || '').trim().toLowerCase()
      const pages = await WIKI.models.pages.query().where('localeCode', WIKI.config.lang.code).where('isPublished', true).limit(100)
      return pages.filter(p => WIKI.auth.checkAccess(req.user, ['read:pages'], { path: p.path, locale: p.localeCode })).filter(p => `${p.title} ${p.description}`.toLowerCase().includes(query) && (!args.project || p.path.includes(`/projects/${slugify(args.project)}/`))).map(publicPage)
    }
    case 'wiki_get_post':
      requireScope(req, 'wiki:read')
      return publicPage(await findVisiblePage(req, args.postId))
    case 'wiki_create_post': {
      requireScope(req, 'wiki:create')
      if (args.visibility === 'public' && args.publish) throw error(-32003, 'public 内容需要人工确认后发布')
      if (args.visibility === 'team' && args.publish) requireScope(req, 'wiki:publish:team')
      const pathValue = pagePath(args)
      const duplicate = await WIKI.models.pages.query().findOne({ path: pathValue, localeCode: WIKI.config.lang.code })
      if (duplicate) return publicPage(duplicate)
      const page = await WIKI.models.pages.createPage({ path: pathValue, title: args.title.trim(), content: args.content, description: '', editor: 'markdown', isPublished: args.visibility === 'team' && args.publish === true, isPrivate: false, locale: WIKI.config.lang.code, tags: args.tags || [], user: req.user, extra: JSON.stringify({ visibility: args.visibility, project: args.project || null, idempotencyKey: args.idempotencyKey }) })
      return publicPage(page)
    }
    case 'wiki_update_post': {
      requireScope(req, 'wiki:update')
      const page = await findVisiblePage(req, args.postId, true)
      if (page.updatedAt !== args.expectedRevision) throw error(-32009, '版本冲突，请先重新读取页面')
      const extra = readExtra(page)
      if (args.publish === true && extra.visibility === 'public') requireScope(req, 'wiki:publish:public')
      if (args.publish === true && extra.visibility !== 'public') requireScope(req, 'wiki:publish:team')
      const updated = await WIKI.models.pages.updatePage({ id: page.id, title: args.title === undefined ? page.title : args.title.trim(), content: args.content === undefined ? page.content : args.content, description: page.description || '', editor: page.editorKey, isPublished: args.publish === undefined ? page.isPublished : args.publish, isPrivate: page.isPrivate, locale: page.localeCode, path: page.path, tags: args.tags || (page.tags || []).map(t => t.tag), user: req.user })
      return publicPage(updated)
    }
    case 'wiki_publish_post': {
      requireScope(req, 'wiki:update')
      const page = await findVisiblePage(req, args.postId, true)
      if (page.updatedAt !== args.expectedRevision) throw error(-32009, '版本冲突，请先重新读取页面')
      const extra = readExtra(page)
      requireScope(req, extra.visibility === 'public' ? 'wiki:publish:public' : 'wiki:publish:team')
      return publicPage(await WIKI.models.pages.updatePage({ id: page.id, title: page.title, content: page.content, description: page.description || '', editor: page.editorKey, isPublished: true, isPrivate: page.isPrivate, locale: page.localeCode, path: page.path, tags: (page.tags || []).map(t => t.tag), user: req.user }))
    }
    case 'wiki_upload_attachment': {
      requireScope(req, 'wiki:upload')
      await findVisiblePage(req, args.postId, true)
      if (!/^[a-z0-9][a-z0-9._-]{0,159}$/i.test(args.filename)) throw error(-32602, '文件名不合法')
      const bytes = Buffer.from(args.dataBase64, 'base64')
      if (bytes.length > 5 * 1024 * 1024 || crypto.createHash('sha256').update(bytes).digest('hex') !== args.sha256) throw error(-32602, '文件大小或 SHA256 校验失败')
      const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-mcp-'))
      const file = path.join(temp, args.filename)
      await fs.writeFile(file, bytes, { mode: 0o600 })
      const asset = await WIKI.models.assets.upload({ path: file, originalname: args.filename, mimetype: args.mime, size: bytes.length, folderId: null, assetPath: args.filename, mode: 'upload', user: req.user, skipStorage: false })
      await fs.remove(temp)
      return { assetId: asset && asset.id, filename: args.filename, url: `/${args.filename}`, sha256: args.sha256 }
    }
    default: throw error(-32601, `未知工具 ${name}`)
  }
}

router.use(express.json({ limit: '8mb' }))
router.all('/mcp', async (req, res) => {
  if (req.method !== 'POST') return res.status(405).set('Allow', 'POST').end()
  if (!req.mcpToken && !(req.user && req.user.permissions && req.user.permissions.includes('manage:system'))) return res.status(401).set('WWW-Authenticate', 'Bearer realm="ewo-wiki-mcp"').json({ jsonrpc: '2.0', error: { code: -32001, message: '需要 MCP Token' } })
  const body = req.body || {}
  const requestId = req.get('x-request-id') || `mcp_${crypto.randomBytes(12).toString('hex')}`
  try {
    if (body.method === 'initialize') return res.json({ jsonrpc: '2.0', id: body.id, result: { protocolVersion: body.params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'ewo-wiki-mcp', version: '1.0.0' } } })
    if (body.method === 'notifications/initialized') return res.status(202).end()
    if (body.method === 'tools/list') return res.json({ jsonrpc: '2.0', id: body.id, result: { tools } })
    if (body.method === 'tools/call') {
      const toolName = body.params?.name
      const result = await dispatch(req, toolName, body.params?.arguments || {})
      await WIKI.models.mcpAuditEvents.query().insert({ requestId, userId: req.user?.id || null, tokenId: req.mcpToken?.id || null, tool: toolName, status: 'success', targetId: result?.id || result?.postId || null, metadata: { method: body.method }, createdAt: new Date().toISOString() })
      return res.json({ jsonrpc: '2.0', id: body.id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } })
    }
    return res.status(400).json({ jsonrpc: '2.0', id: body.id, error: { code: -32601, message: 'Unsupported method' } })
  } catch (err) {
    if (body.method === 'tools/call') {
      try { await WIKI.models.mcpAuditEvents.query().insert({ requestId, userId: req.user?.id || null, tokenId: req.mcpToken?.id || null, tool: body.params?.name || 'unknown', status: 'error', targetId: body.params?.arguments?.postId || null, metadata: { message: err.message }, createdAt: new Date().toISOString() }) } catch (auditErr) { WIKI.logger.warn(auditErr) }
    }
    const e = err.code ? err : error(-32000, err.message || 'MCP request failed')
    return res.json({ jsonrpc: '2.0', id: body.id, error: e })
  }
})

module.exports = router
