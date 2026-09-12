/* global WIKI */
const express = require('express')
const crypto = require('crypto')
const Ajv = require('ajv')
const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js')
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js')
const policy = require('../mcp/policy')
const content = require('../mcp/content')
const tools = require('../mcp/tools')
const router = express.Router()
const ajv = new Ajv({ useDefaults: true, allErrors: true })
const validators = new Map(tools.map(t => [t.name, ajv.compile(t.inputSchema)]))
const rates = new Map()
const escape = text => String(text == null ? '' : text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
function html (title, body) {
  return `<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | ewo Wiki</title><style>body{font:16px/1.7 system-ui;background:#f8f7f3;color:#292723;margin:0}main{max-width:960px;padding:28px 24px 80px;margin:auto}nav{display:flex;gap:24px;border-bottom:1px solid #ddd;padding:12px 0 24px;margin-bottom:32px}a{color:#af4717;text-decoration:none}h1{font-size:32px}article{background:#fff;padding:22px;margin:18px 0;border:1px solid #e5e2da;border-radius:12px}small,.muted{color:#777}button{background:#c95320;color:white;border:0;border-radius:6px;padding:10px 18px;cursor:pointer}input{padding:10px;border:1px solid #ccc;border-radius:6px;font:inherit}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#fafafa;padding:16px}label{display:block;margin:14px 0}code{overflow-wrap:anywhere}@media(prefers-color-scheme:dark){body{background:#211f1b;color:#e5e2da}article,pre{background:#292723;border-color:#555}a{color:#ffa779}}</style><main><nav><b>ewo Wiki</b><a href="/home">全部内容</a><a href="/p/profile">个人设置 / MCP Key</a></nav>${body}</main></html>`
}
function uiError (res, err) { return res.status(err.publicCode === 'UNAUTHORIZED' ? 401 : 400).type('html').send(html('操作未完成', `<h1>操作未完成</h1><p>${escape(err.publicCode ? err.message : '请求暂时无法完成，请重新读取后再试。')}</p>`)) }
function context (user, token) { return { user, scopes: token.scopes, tokenId: token.id, requestId: crypto.randomUUID() } }
router.all('/mcp', async (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  if (req.get('origin') && req.get('origin') !== new URL(WIKI.config.host).origin) return res.status(403).json({ error: 'INVALID_ORIGIN' })
  if (!req.mcpToken) return res.status(401).set('WWW-Authenticate', 'Bearer realm="ewo-wiki-mcp"').json({ error: 'MCP_KEY_REQUIRED' })
  const key = req.mcpToken.id
  const now = Date.now()
  if (rates.size > 10000) for (const [k, rate] of rates) if (rate.end < now) rates.delete(k)
  const rate = rates.get(key) || { count: 0, end: now + 60000 }
  if (rate.end < now) { rate.count = 0; rate.end = now + 60000 }
  rates.set(key, rate)
  if (++rate.count > 120) return res.status(429).set('Retry-After', '60').json({ error: 'RATE_LIMITED' })
  const ctx = context(req.user, req.mcpToken)
  const server = new Server({ name: 'ewo-wiki', version: '1.0.0' }, { capabilities: { tools: {} } })
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))
  server.setRequestHandler(CallToolRequestSchema, async request => {
    const validate = validators.get(request.params.name)
    const args = request.params.arguments || {}
    if (!validate || !validate(args)) return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: 'INVALID_INPUT', message: '请核对工具名称、必填字段和参数类型', requestId: ctx.requestId }) }] }
    try {
      const result = await content.dispatch(ctx, request.params.name, args)
      return { content: [{ type: 'text', text: JSON.stringify(result) }] }
    } catch (err) {
      await content.audit(ctx, request.params.name, 'error', args.postId).catch(() => {})
      return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: err.publicCode || 'OPERATION_FAILED', message: err.publicCode ? err.message : '操作未完成，请重新读取状态后重试', requestId: ctx.requestId }) }] }
    }
  })
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  res.on('close', () => { transport.close(); server.close() })
  try { await server.connect(transport); await transport.handleRequest(req, res, req.body) } catch (err) { next(err) }
})
router.get(['/home', '/zh/home', '/en/home'], async (req, res, next) => {
  try {
    const args = { query: typeof req.query.q === 'string' ? req.query.q.slice(0, 200) : '', limit: 30, afterId: Math.max(0, parseInt(req.query.after, 10) || 0) }
    if (req.query.project) args.project = String(req.query.project).slice(0, 80)
    if (req.query.tag) args.tags = [String(req.query.tag).slice(0, 50)]
    const result = await content.dispatch({ user: req.user, scopes: ['wiki:read'] }, 'wiki_search_posts', args)
    const cards = result.posts.map(post => `<article><h2><a href="${escape(post.url)}">${escape(post.title)}</a></h2><small>${post.visibility === 'team' ? '团队内' : '可公开'} · ${post.status === 'draft' ? '草稿' : '已发布'}${post.project ? ' · 项目：<a href="/home?project=' + encodeURIComponent(post.project) + '">' + escape(post.project) + '</a>' : ''}</small><p>${post.tags.map(tag => '<a href="/home?tag=' + encodeURIComponent(tag) + '">#' + escape(tag) + '</a>').join('　')}</p>${post.reviewUrl && post.status === 'draft' ? `<a href="${escape(post.reviewUrl)}">预览并确认公开</a>` : ''}</article>`).join('')
    res.set('Cache-Control', 'private, no-store').type('html').send(html('全部内容', `<h1>团队知识与项目动态</h1><p class="muted">内容平铺展示，按项目和标签查找。</p><form><input name="q" placeholder="搜索内容" value="${escape(args.query)}"><button>搜索</button></form>${cards || '<p>暂无可见内容。成员可以通过 MCP 发布第一篇 Post。</p>'}${result.nextAfterId ? `<a href="/home?${new URLSearchParams({ ...req.query, after: result.nextAfterId })}">继续浏览</a>` : ''}`))
  } catch (err) { next(err) }
})
router.get('/mcp-audit', async (req, res) => {
  try {
    const user = await policy.browserMember(req)
    const query = WIKI.models.mcpAuditEvents.query().orderBy('id', 'desc').limit(100)
    if (!user.permissions.includes('manage:system')) query.where('userId', user.id)
    const rows = await query
    res.set('Cache-Control', 'no-store').type('html').send(html('AI 操作记录', '<h1>AI 操作记录</h1><p>最近 100 条记录；不记录 Key 明文或文章正文。</p>' + rows.map(row => `<article><b>${escape(row.tool)}</b> · ${escape(row.status)}<p>成员 ${row.userId} · Key ${row.tokenId || '网页'} · 内容 ${row.targetId || '—'}</p><small>${escape(row.createdAt)} · ${escape(row.requestId)}</small></article>`).join('')))
  } catch (err) { uiError(res, err) }
})
router.get('/mcp-review/:id', async (req, res) => {
  try {
    const user = await policy.browserMember(req)
    const page = await content.get({ user }, Number(req.params.id), true)
    if (policy.visibility(page) !== 'public') throw policy.fail('INVALID_INPUT', '这篇内容不需要公开确认')
    const attachments = await WIKI.models.knex('mcpAttachments').where('pageId', page.id)
    const attachmentList = attachments.map(a => `<li><a href="/mcp-assets/${page.id}/${a.assetId}/${encodeURIComponent(a.filename)}">${escape(a.filename)}</a> · ${escape(a.mime)}<br><code>${escape(a.sha256)}</code></li>`).join('')
    const proof = { id: page.id, revision: page.updatedAt, nonce: crypto.randomBytes(32).toString('hex'), expires: Date.now() + 600000 }
    req.session.mcpReview = proof
    res.set('Cache-Control', 'no-store').type('html').send(html('确认公开内容', `<h1>确认公开：${escape(page.title)}</h1><p>确认后，任何人都可以阅读这篇内容及关联附件。本次确认仅适用于当前版本。</p><pre>${escape(page.content)}</pre><h2>关联附件</h2><ul>${attachmentList || '<li>无附件</li>'}</ul><p>标签：${escape((page.tags || []).map(x => x.tag).join('、'))}</p><form method="post"><input type="hidden" name="nonce" value="${proof.nonce}"><label><input type="checkbox" name="confirmed" value="yes" required> 我已检查此版本，确认可以对外公开</label><button>确认并公开此版本</button></form>`))
  } catch (err) { uiError(res, err) }
})
router.post('/mcp-review/:id', async (req, res) => {
  try {
    const user = await policy.browserMember(req)
    const proof = req.session.mcpReview
    if (!proof || proof.id !== Number(req.params.id) || proof.expires < Date.now() || req.body.nonce !== proof.nonce || req.body.confirmed !== 'yes') throw policy.fail('FORBIDDEN', '确认已过期，请重新打开预览')
    const result = await content.update({ user, scopes: policy.SCOPES, requestId: crypto.randomUUID() }, { postId: proof.id, expectedRevision: proof.revision }, true, true)
    req.session.mcpReview = null
    res.redirect(303, result.url)
  } catch (err) { uiError(res, err) }
})
router.get('/mcp-assets/:pageId/:assetId/:filename', async (req, res) => {
  try {
    const page = await content.get({ user: req.user }, Number(req.params.pageId))
    const link = await WIKI.models.knex('mcpAttachments').where({ pageId: page.id, assetId: Number(req.params.assetId) }).first()
    if (!link || link.filename !== req.params.filename) return res.sendStatus(404)
    const bytes = await WIKI.models.knex('assetData').where({ id: link.assetId }).first()
    if (!bytes) return res.sendStatus(404)
    res.set('Cache-Control', 'private, no-store').set('X-Content-Type-Options', 'nosniff')
    if (!link.mime.startsWith('image/')) res.attachment(link.filename)
    res.type(link.mime).send(bytes.data)
  } catch { res.sendStatus(404) }
})
module.exports = router
