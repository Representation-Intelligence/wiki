#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'

const token = process.env.EWO_WIKI_TOKEN
const endpoint = new URL(process.env.EWO_WIKI_MCP_URL || 'https://wiki.representation.com.cn/mcp')
if (!token || (endpoint.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(endpoint.hostname)) || endpoint.username || endpoint.password) {
  process.stderr.write('请配置 EWO_WIKI_TOKEN 和受信任的 HTTPS Wiki 地址。\n')
  process.exit(2)
}
const remote = new Client({ name: 'ewo-wiki-local-client', version: '1.0.0' })
await remote.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { Authorization: `Bearer ${token}` } }, fetch: (url, init) => fetch(url, { ...init, redirect: 'error' }) })).catch(() => {
  process.stderr.write('无法连接 Wiki，请检查地址、网络和 Key 是否有效。\n')
  process.exit(2)
})
const local = new Server({ name: 'ewo-wiki', version: '1.0.0' }, { capabilities: { tools: {} } })
local.setRequestHandler(ListToolsRequestSchema, () => remote.listTools())
local.setRequestHandler(CallToolRequestSchema, async request => {
  try { return await remote.callTool(request.params) } catch {
    return { isError: true, content: [{ type: 'text', text: 'Wiki 请求未完成；写操作请先读回状态，创建操作请沿用幂等键。' }] }
  }
})
const transport = new StdioServerTransport()
transport.onclose = () => remote.close()
await local.connect(transport)
