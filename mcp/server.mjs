#!/usr/bin/env node
import readline from 'node:readline'

const endpoint = process.env.EWO_WIKI_MCP_URL || 'https://wiki.representation.com.cn/mcp'
const token = process.env.EWO_WIKI_TOKEN
if (!token) {
  process.stderr.write('EWO_WIKI_TOKEN is required\n')
  process.exit(2)
}

const tools = [
  ['wiki_get_identity', '返回当前成员身份和 MCP 权限', {}],
  ['wiki_list_projects', '列出当前可见项目目录', {}],
  ['wiki_search_posts', '搜索当前成员有权访问的 Post', { query: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, project: { type: 'string' } }],
  ['wiki_get_post', '读取一个 Post 的正文和元数据', { postId: { type: 'integer' } }],
  ['wiki_create_post', '创建 Post；team 可直接发布，public 默认只能创建草稿', { title: { type: 'string' }, content: { type: 'string' }, visibility: { type: 'string', enum: ['team', 'public'] }, tags: { type: 'array', items: { type: 'string' } }, project: { type: 'string' }, publish: { type: 'boolean' }, idempotencyKey: { type: 'string' } }],
  ['wiki_update_post', '更新 Post；必须提供 expectedRevision', { postId: { type: 'integer' }, title: { type: 'string' }, content: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, publish: { type: 'boolean' }, expectedRevision: { type: 'string' } }],
  ['wiki_publish_post', '发布一个 Post', { postId: { type: 'integer' }, expectedRevision: { type: 'string' } }],
  ['wiki_upload_attachment', '上传并校验 Post 附件', { postId: { type: 'integer' }, filename: { type: 'string' }, mime: { type: 'string' }, dataBase64: { type: 'string' }, sha256: { type: 'string' } }]
].map(([name, description, properties]) => ({ name, description, inputSchema: { type: 'object', properties, additionalProperties: false } }))

async function forward (message) {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(message), signal: AbortSignal.timeout(30000) })
  const body = await response.json()
  if (!response.ok) return { jsonrpc: '2.0', id: message.id, error: body.error || { code: -32001, message: 'Wiki MCP authorization failed' } }
  return body
}

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })
input.on('line', async line => {
  if (!line.trim()) return
  let message
  try { message = JSON.parse(line) } catch { return }
  if (message.method === 'notifications/initialized') return
  let response
  if (message.method === 'initialize') {
    response = { jsonrpc: '2.0', id: message.id, result: { protocolVersion: message.params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'ewo-wiki-mcp', version: '1.0.0' } } }
  } else if (message.method === 'tools/list') {
    response = { jsonrpc: '2.0', id: message.id, result: { tools } }
  } else if (message.method === 'tools/call') {
    response = await forward(message)
  } else {
    response = { jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Method not found' } }
  }
  process.stdout.write(`${JSON.stringify(response)}\n`)
})
