# ewo Wiki MCP

这是 ewo Wiki 的本地 stdio MCP 客户端。它不保存 Wiki 内容，也不持有管理员凭据；每次工具调用都把成员自己的 Token 转发给 Wiki MCP 端点。

```json
{
  "mcpServers": {
    "ewo-wiki": {
      "command": "npx",
      "args": ["-y", "@representation-intelligence/wiki-mcp"],
      "env": {
        "EWO_WIKI_MCP_URL": "https://wiki.representation.com.cn/mcp",
        "EWO_WIKI_TOKEN": "ewt_live_..."
      }
    }
  }
}
```

Token 在 Wiki 的个人设置中创建，只显示一次，可随时撤销。`team` 内容可按权限直接发布；`public` 内容只能先创建草稿，再由人工确认后发布。
