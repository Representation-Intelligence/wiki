# ewo Wiki MCP 使用说明

## 成员接入

1. 使用已验证的 `@ewo.so` 账号登录 Wiki，打开个人设置中的“AI 连接 / 个人 Key”。
2. 选择“只读”或“阅读和贡献”，创建 Key。明文只显示一次；每台机器建议单独创建，默认 90 天。
3. 远程 MCP 地址为 `https://wiki.representation.com.cn/mcp`，使用 `Authorization: Bearer <Key>`。支持 Streamable HTTP 和自定义请求头的客户端可直接接入。
4. 仅支持本地 stdio 的客户端使用下列配置。客户端包由 Wiki 同一发布镜像提供，不需要向 npm 发布组织包：

```json
{
  "mcpServers": {
    "ewo-wiki": {
      "command": "npx",
      "args": ["--yes", "--package=https://wiki.representation.com.cn/_assets/representation-intelligence-wiki-mcp-1.0.0.tgz", "ewo-wiki-mcp"],
      "env": {
        "EWO_WIKI_MCP_URL": "https://wiki.representation.com.cn/mcp",
        "EWO_WIKI_TOKEN": "在客户端安全配置中填写个人 Key"
      }
    }
  }
}
```

这是个人 Key 接入，不冒充 OAuth。只支持浏览器 OAuth、不能配置请求头且不能运行 stdio 的客户端不属于此接入方式的兼容范围。Key 不要放在聊天消息、URL、命令参数或 Git 仓库中。

## 内容与权限

- 首页是平铺内容流，通过标签或项目筛选；项目只是目录，没有单独项目成员权限。
- `team`：已有写权限的成员可直接发布；未登录不可读。
- `public`：AI 创建和编辑均保存为草稿，工具返回网页预览链接。成员在网页查看具体版本并勾选确认，才允许匿名访问；版本变化后旧确认失效。
- 图片和附件跟随所属 Post。草稿附件不会因为知道地址而公开；文本、HTML、PDF、ZIP 作为附件下载，PNG/JPEG/GIF/WebP 可内嵌。当前单文件最大 5 MiB，批量和大文件需拆分；HTML 附件不会作为同源可执行页面运行。
- URL 使用内部 `team/` 和 `public/` 前缀作为权限边界；页面内容在 Post 列表中统一展示。项目路径形如 `team/projects/<项目>/<文章>`。
- 搜索支持正文、标签和项目；工具返回精确页面 URL、作者、版本和公开确认链接。

## Key 生命周期

Key 由密码学安全随机数生成，只存 SHA256 摘要；每次请求重新检查账号启用状态、验证状态和当前用户权限。Key 不允许访问原生 GraphQL、用户管理或继续创建 Key；管理员账号的 Key 也不能绕过 Key scope 或公开确认。

个人设置可撤销单个 Key；禁用用户会立即阻止该用户所有 Key 的后续请求。操作记录见 `/mcp-audit`，成员看自己的记录，管理员看全站最近 100 条。记录不包含 Token 明文或文章正文。

## 邮箱准入

企业域名白名单使用 `ewo.so`。自助注册只有在管理员完成 SMTP 和验证邮件测试后才应开启；未验证账号不能登录或使用个人 Key。没有 SMTP 时，通过管理员创建已核验的成员账号使用同一 MCP，不自动放行仅填写公司邮箱的注册者。

## 重试和编辑

创建请求携带 `idempotencyKey`；同一成员相同 Key、相同内容返回原 Post，不会重复创建，改变内容复用 Key 返回冲突。服务端保存提交状态，落库后呈现失败会明确提示沿用同一 Key 重试。

修改携带读取结果中的 `expectedRevision`。版本比较和页面/历史/标签写入在数据库事务内完成，并发请求只有一个成功；失败后先读回，不能强行覆盖。公开内容的任何后续修改与附件变更都需要重新确认。

## 验收与发布

`TEST_WIKI_URL=http://127.0.0.1:<隔离端口> TEST_REPORT=<本地结果文件> node dev/mcp/acceptance.mjs`

仅在全新隔离实例运行，脚本建立自己的管理员及测试用户，不向真实成员发邮件。测试覆盖正式 SDK 握手、个人 Key、只读限制、原生接口隔离、中文项目及标签、幂等、并发版本、公开确认、附件字节及撤销。

生产部署前必须完成 PostgreSQL 的全套用例和实际浏览器个人设置验收。数据迁移保留旧权限设置供回滚；回滚必须同时考虑新增数据与权限，不能简单切回旧镜像却留下宽泛的公共读取规则。
