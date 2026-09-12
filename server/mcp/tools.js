const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false })
const str = (maxLength = 200) => ({ type: 'string', minLength: 1, maxLength })
const postId = { type: 'integer', minimum: 1 }
const tags = { type: 'array', maxItems: 20, items: str(50), uniqueItems: true }
const revision = str(80)
const tools = [
  ['wiki_get_identity', '查看当前成员与 Key 权限', object({})],
  ['wiki_list_projects', '按内容列出项目目录；项目不单独设权限', object({ afterId: { type: 'integer', minimum: 0 } })],
  ['wiki_search_posts', '按正文、标签和项目搜索 Post', object({ query: { type: 'string', maxLength: 200 }, tags, project: str(80), visibility: { enum: ['team', 'public'] }, limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, afterId: { type: 'integer', minimum: 0 } })],
  ['wiki_get_post', '读取 Post 正文及版本号', object({ postId }, ['postId'])],
  ['wiki_create_post', '创建 Post；team 可以直接发布，public 返回人工确认链接', object({ title: str(), content: str(1000000), visibility: { enum: ['team', 'public'] }, project: str(80), tags, publish: { type: 'boolean', default: false }, idempotencyKey: str(100) }, ['title', 'content', 'visibility', 'idempotencyKey'])],
  ['wiki_update_post', '使用 expectedRevision 更新 Post；public 修改重新进入待确认状态', object({ postId, title: str(), content: str(1000000), tags, publish: { type: 'boolean' }, expectedRevision: revision }, ['postId', 'expectedRevision'])],
  ['wiki_publish_post', '发布 team，public 返回人工确认链接', object({ postId, expectedRevision: revision }, ['postId', 'expectedRevision'])],
  ['wiki_get_post_history', '查看 Post 版本历史', object({ postId }, ['postId'])],
  ['wiki_upload_attachment', '上传不超过 5 MiB 的附件；提供文件 SHA256，附件按父页面的可见性访问', object({ postId, filename: str(140), mime: str(100), dataBase64: str(7000000), sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' } }, ['postId', 'filename', 'mime', 'dataBase64', 'sha256'])]
].map(([name, description, inputSchema]) => ({ name, description, inputSchema, annotations: { readOnlyHint: ['wiki_get_identity', 'wiki_list_projects', 'wiki_search_posts', 'wiki_get_post', 'wiki_get_post_history'].includes(name), destructiveHint: false, openWorldHint: false } }))
module.exports = tools
