# ewo Wiki 主题与发布

本 fork 为表征智能团队知识库维护 Wiki.js 的 ewo 视觉定制。Wiki.js 保持 AGPL-3.0，完整修改源码通过本仓库提供。

## 视觉来源与代码边界

- 参考：ai-habitat 的 `apps/site/src/user-console/user-console.css`，读取时 commit 为 `10c072613388214051a33d86121ea002b54ddf09`。
- 风格：米白背景、纸面容器、赤陶橙强调色；暗色模式使用深紫黑背景和亮橙强调色。
- 主题入口：`client/themes/default/scss/app.scss` 最后引入 `_ewo.scss`，覆盖顺序集中管理；打印样式继续使用上游实现。
- 登录组件：`client/components/login.vue` 增加中英文知识库标题，账号、密码、MFA、找回密码等认证流程保持上游实现。
- 不复制 ai-habitat 的业务代码或服务，不改变权限模型、存储接口、数据库结构。

## 构建与验证

- 使用仓库 `yarn.lock` 和生产 Dockerfile 构建。
- GHCR 路径固定为小写 `ghcr.io/representation-intelligence/wiki`。
- 每个测试任务使用自身的 GitHub token 登录 GHCR；测试不依赖上游 Cypress Cloud 账号。
- CI 导出 `wiki-image-amd64`：镜像归档、归档 SHA-256、registry digest 和源码 commit。服务器可从该受控制品部署，无需保存个人 GitHub token。
- CI 的上游 Cypress 用例只验证初始化。生产发布前还需要在隔离数据库副本上验证登录、阅读、搜索、用户管理、移动端和暗色模式。

## 部署规则

1. 从 feature 分支发 PR；通过验证后 Squash Merge 至 main。
2. 生产制品必须能追踪至已合并的源码，记录 commit、Actions run、镜像 digest 与归档哈希。
3. 切换前保存 Compose、旧镜像标识、PostgreSQL 逻辑备份和内容卷备份；备份包含敏感信息，仅保存在服务器受限目录。
4. 测试容器使用数据库与内容卷副本、独立内部 Docker 网络和 loopback 端口。不得把预发布版本接入生产数据库测试迁移。
5. 验证通过后只更新 `wiki` 服务，保留现有数据库和显式挂载的原内容卷；不执行 `docker compose down -v`。
6. 检查 HTTPS、登录、原页面、成员权限、用户管理和静态资源；对比切换前后页面、用户、组数据。
7. 回滚优先恢复旧镜像和 Compose。若发生数据库迁移，必须先评估兼容性；不得直接覆盖发布后新增的数据。

旧 Wiki 容器可在新版本通过验证后移除，但回滚镜像及数据备份继续保留。发布前后的具体证据另存部署记录，不把构建成功视为上线验收。
