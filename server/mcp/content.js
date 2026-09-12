/* global WIKI */
const p = require('./policy')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const fileType = require('file-type')
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf', zip: 'application/zip', txt: 'text/plain', md: 'text/markdown', html: 'text/html' }

async function audit (context, tool, status, pageId, transaction) {
  await WIKI.models.mcpAuditEvents.query(transaction).insert({ requestId: context.requestId, userId: context.user.id, tokenId: context.tokenId || null, tool, status, targetId: pageId || null, metadata: {}, createdAt: new Date().toISOString() })
}
async function get (context, id, write = false) {
  const page = await WIKI.models.pages.getPageFromDb(id)
  if (!page || !p.extra(page).mcpManaged) throw p.fail('NOT_FOUND', '内容不存在或不是 Post')
  p.access(context.user, page, write)
  return page
}
async function repaired (id) {
  const page = await WIKI.models.pages.getPageFromDb(id)
  await WIKI.models.pages.renderPage(page)
  await WIKI.models.pages.deletePageFromCache(page.hash)
  await WIKI.models.pages.rebuildTree()
  const rendered = await WIKI.models.pages.getPageFromDb(id)
  rendered.safeContent = WIKI.models.pages.cleanHTML(rendered.render || '')
  await WIKI.data.searchEngine.updated(rendered)
  return rendered
}
async function create (context, args) {
  p.requireScope(context, 'wiki:create')
  if (args.visibility === 'team' && args.publish) p.requireScope(context, 'wiki:publish:team')
  const id = p.hash(`${context.user.id}:create:${args.idempotencyKey}`)
  const payload = { title: args.title.trim(), content: args.content, tags: [...new Set(args.tags || [])].sort(), project: args.project ? args.project.trim() : null, visibility: args.visibility, publish: !!args.publish }
  const payloadHash = p.hash(JSON.stringify(payload))
  const requestTable = () => WIKI.models.knex('mcpRequests')
  let existing = await requestTable().where({ id }).first()
  if (!existing) {
    try { await requestTable().insert({ id, userId: context.user.id, payloadHash, state: 'started', createdAt: new Date().toISOString() }) } catch (err) {
      existing = await requestTable().where({ id }).first()
      if (!existing) throw err
    }
  }
  if (existing) {
    if (existing.payloadHash !== payloadHash) throw p.fail('IDEMPOTENCY_CONFLICT', '相同幂等键不能提交不同内容')
    if (!existing.pageId) throw p.fail('IN_PROGRESS', '上次请求仍在处理，请查询后重试同一个幂等键')
    const page = await get(context, existing.pageId)
    return p.present(existing.state === 'complete' ? page : await repaired(page.id))
  }
  const postPath = `${args.visibility}/${payload.project ? 'projects/' + p.slug(payload.project) : 'posts'}/${p.slug(payload.title)}-${id.slice(0, 12)}`
  let page
  try {
    page = await WIKI.models.pages.createPage({ path: postPath,
      title: payload.title,
      content: payload.content,
      description: '',
      editor: 'markdown',
      isPublished: args.visibility === 'team' && !!args.publish,
      isPrivate: false,
      locale: WIKI.config.lang.code,
      tags: payload.tags,
      user: context.user,
      extra: { mcpManaged: true, project: payload.project },
      onPersist: async (transaction, saved) => {
        await transaction('mcpRequests').where({ id }).update({ pageId: saved.id, state: 'committed' })
        await audit(context, 'wiki_create_post', 'committed', saved.id, transaction)
      } })
  } catch (err) {
    const row = await requestTable().where({ id }).first()
    if (row.pageId) throw p.fail('PERSISTED_RETRY_SAME_KEY', '内容已保存，呈现尚未完成；沿用相同幂等键重试')
    // Release only this failed, uncommitted request so a validated retry is possible.
    await requestTable().where({ id, state: 'started' }).delete()
    throw err
  }
  await requestTable().where({ id }).update({ state: 'complete' })
  return p.present(page)
}
async function update (context, args, publishOnly = false, humanReview = false) {
  p.requireScope(context, 'wiki:update')
  const page = await get(context, args.postId, true)
  const publicPost = p.visibility(page) === 'public'
  const published = humanReview ? true : (publicPost ? false : (publishOnly ? true : (args.publish === undefined ? !!page.isPublished : args.publish)))
  if (publishOnly && publicPost && !humanReview) return { ...p.present(page), status: 'awaiting_confirmation', reviewUrl: `${WIKI.config.host}/mcp-review/${page.id}` }
  if (published && !humanReview) p.requireScope(context, 'wiki:publish:team')
  const saved = await WIKI.models.pages.updatePage({ id: page.id, expectedRevision: args.expectedRevision, title: args.title === undefined ? page.title : args.title.trim(), content: args.content === undefined ? page.content : args.content, tags: args.tags === undefined ? (page.tags || []).map(t => t.tag) : args.tags, description: page.description, locale: page.localeCode, path: page.path, isPublished: published, isPrivate: false, user: context.user, humanReview, onPersist: (trx, row) => audit(context, humanReview ? 'human_public_confirm' : 'wiki_update_post', 'committed', row.id, trx) })
  return p.present(saved)
}
async function search (context, args) {
  p.requireScope(context, 'wiki:read')
  const escaped = (args.query || '').toLowerCase().replace(/[\\%_]/g, '\\$&')
  const query = WIKI.models.pages.query().withGraphFetched('tags').where('localeCode', WIKI.config.lang.code).where('id', '>', args.afterId || 0).orderBy('id')
  query.where(builder => builder.where('path', 'like', 'team/%').orWhere('path', 'like', 'public/%'))
  if (escaped) query.where(builder => builder.whereRaw('LOWER(title) LIKE ?', [`%${escaped}%`]).orWhereRaw('LOWER(content) LIKE ?', [`%${escaped}%`]))
  if (args.project) query.where('path', 'like', `%/projects/${p.slug(args.project)}/%`)
  if (args.visibility) query.where('path', 'like', `${args.visibility}/%`)
  if (args.tags && args.tags.length) for (const tag of args.tags) query.whereExists(WIKI.models.knex('pageTags').join('tags', 'tags.id', 'pageTags.tagId').whereRaw('?? = ??', ['pageTags.pageId', 'pages.id']).where('tags.tag', tag.toLowerCase()).select('tags.id'))
  const posts = []
  let cursor = args.afterId || 0
  // Filter permissions before paginating the visible result; scan cursor allows bounded resumption.
  for (let batch = 0; batch < 10 && posts.length < args.limit; batch++) {
    const rows = await query.clone().where('id', '>', cursor).limit(100)
    for (const row of rows) {
      cursor = row.id
      try { p.access(context.user, row) } catch { continue }
      if (!p.extra(row).mcpManaged) continue
      posts.push(p.present(row))
      if (posts.length === args.limit) break
    }
    if (rows.length < 100) break
  }
  return { posts, nextAfterId: posts.length ? cursor : null }
}
async function upload (context, args) {
  p.requireScope(context, 'wiki:upload')
  const page = await get(context, args.postId, true)
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(args.filename)) throw p.fail('INVALID_INPUT', '请使用不含路径分隔符的文件名')
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(args.dataBase64)) throw p.fail('INVALID_INPUT', 'Base64 格式无效')
  const bytes = Buffer.from(args.dataBase64, 'base64')
  if (!bytes.length || bytes.length > 5 * 1024 * 1024 || p.hash(bytes) !== args.sha256) throw p.fail('INVALID_INPUT', '文件大小或 SHA256 校验失败')
  const ext = path.extname(args.filename).slice(1).toLowerCase()
  if (!MIME[ext] || args.mime !== MIME[ext]) throw p.fail('INVALID_INPUT', '不支持此文件类型')
  if (['txt', 'md', 'html'].includes(ext)) {
    try { new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { throw p.fail('INVALID_INPUT', '文本必须为 UTF-8') }
  } else {
    const detected = await fileType.fromBuffer(bytes)
    if (!detected || detected.mime !== MIME[ext]) throw p.fail('INVALID_INPUT', '文件内容与 MIME 不匹配')
  }
  const filename = `${args.sha256.slice(0, 20)}-${args.filename.toLowerCase()}`
  const assetPath = `team/attachments/${page.id}/${filename}`
  if (!WIKI.auth.checkAccess(context.user, ['write:assets'], { path: assetPath })) throw p.fail('FORBIDDEN', '没有附件写权限')
  let parentId = null
  for (const slug of ['team', 'attachments', String(page.id)]) {
    let folder = await WIKI.models.assetFolders.query().findOne({ parentId, slug })
    if (!folder) folder = await WIKI.models.assetFolders.query().insert({ parentId, slug, name: slug })
    parentId = folder.id
  }
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-mcp-'))
  const file = path.join(temp, filename)
  try {
    await fs.writeFile(file, bytes, { mode: 0o600 })
    const asset = await WIKI.models.assets.upload({ path: file, originalname: filename, mimetype: args.mime, size: bytes.length, folderId: parentId, assetPath, mode: 'upload', user: context.user })
    if (!asset) throw p.fail('UPLOAD_FAILED', '附件没有保存成功')
    const updated = await WIKI.models.pages.updatePage({ id: page.id,
      expectedRevision: page.updatedAt,
      content: page.content,
      title: page.title,
      description: page.description,
      tags: page.tags.map(t => t.tag),
      isPublished: p.visibility(page) === 'public' ? false : !!page.isPublished,
      user: context.user,
      onPersist: async (trx, saved) => {
        const old = await trx('mcpAttachments').where({ assetId: asset.id }).first()
        if (!old) await trx('mcpAttachments').insert({ assetId: asset.id, pageId: page.id, sha256: args.sha256, filename: args.filename, mime: args.mime })
        await audit(context, 'wiki_upload_attachment', 'committed', saved.id, trx)
      } })
    return { assetId: asset.id, url: `${WIKI.config.host}/mcp-assets/${page.id}/${asset.id}/${encodeURIComponent(args.filename)}`, sha256: args.sha256, bytes: bytes.length, revision: updated.updatedAt }
  } finally {
    // Exact two entries owned by this upload; no recursive cleanup.
    await fs.unlink(file).catch(err => { if (err.code !== 'ENOENT') throw err })
    await fs.rmdir(temp)
  }
}
async function history (context, args) {
  p.requireScope(context, 'wiki:read')
  const page = await get(context, args.postId)
  if (!WIKI.auth.checkAccess(context.user, ['read:history'], { path: page.path, locale: page.localeCode })) throw p.fail('FORBIDDEN', '没有版本历史读取权限')
  return WIKI.models.pageHistory.getHistory({ pageId: page.id, offsetPage: 0, offsetSize: 30 })
}
async function dispatch (context, name, args) {
  switch (name) {
    case 'wiki_get_identity': p.requireScope(context, 'wiki:read'); return { userId: context.user.id, email: context.user.email, name: context.user.name, scopes: context.scopes }
    case 'wiki_create_post': return create(context, args)
    case 'wiki_get_post': p.requireScope(context, 'wiki:read'); return p.present(await get(context, args.postId))
    case 'wiki_search_posts': return search(context, args)
    case 'wiki_update_post': return update(context, args)
    case 'wiki_publish_post': return update(context, args, true)
    case 'wiki_upload_attachment': return upload(context, args)
    case 'wiki_get_post_history': return history(context, args)
    case 'wiki_list_projects': {
      const result = await search(context, { query: '', limit: 100, afterId: args.afterId || 0 })
      return { projects: [...new Set(result.posts.map(x => x.project).filter(Boolean))], nextAfterId: result.nextAfterId }
    }
    default: throw p.fail('UNKNOWN_TOOL', '未知工具')
  }
}
module.exports = { dispatch, get, update, audit }
