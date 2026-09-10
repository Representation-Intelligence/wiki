# ewo 品牌补全验证记录

日期：2026-09-09。基线：`4b54df26`，分支：`feat/ewo-brand-completion`。

## 已验证

- `yarn.lock` 冻结安装成功。为避免本机自动下载旧 Cypress，安装时使用 `--ignore-scripts`；随后手动应用现有 `patch-package` 补丁，并重建本地 SQLite 模块。
- Node 24.19.0 执行生产 webpack 配置：退出码 0；仍有上游资源体积警告。
- `jest server --runInBand`：2 个 suite、7 项测试通过，其中 4 项覆盖默认品牌兼容、自定义品牌保留及不修改传入配置。
- 本次改动文件的 ESLint：除以下基线错误外通过；Pug 错误页检查和 `git diff --check` 通过。
- 全新 SQLite 数据库、loopback 3087 端口启动真实 Wiki；没有连接生产数据库。使用隔离测试账户完成登录、创建与更新中英文页面、读取历史、A/B 版本选择和对比视图切换。
- 本地数据库仍保留旧标题 `Wiki.js` 时，重启后浏览器标题和导航显示 ewo，确认读取兼容生效。
- 实测 `/login`、`/zh/home`、`/en/home`、`/h/zh/home`、`/h/en/home`、`/s/en/home`、`/a/users`。
- 在默认中文、启用语言路径的配置下，英文历史页返回操作曾跳到 `/zh/home`；修复后实测返回 `/en/home`。
- 375×812 手机视口：历史页及阅读页无文档横向溢出；返回按钮和账户入口位于视口内；并排对比内容在自身容器内滚动。
- 实际 Vue/Vuetify 暗色主题切换后，加载深色版 ewo 字标，差异新增/删除区域和选中按钮具有对应的暗色配色。
- 浏览器请求 Apple touch icon、192/32/16px 图标和 manifest 均为 HTTP 200；品牌字体加载成功。

截图和构建素材 SHA-256 保存在本地忽略目录 `test-results/ewo-brand/`，不作为生产制品提交。

## 基线问题与未验证项

- `nav-header.vue` 原有 `searchEnter`、`searchMove` 事件触发两条 `vue/custom-event-name-casing`；原有 Cypress 文件的两条 Chai 断言触发 `no-unused-expressions`。已用 `origin/main` 文件复核相同错误，本次未变更这些契约。
- 不带范围的 Jest 会误扫 Cypress 文件，报 `cy is not defined`。服务端测试和 Cypress 必须分开运行。
- 已补充原有 Cypress 的品牌及历史页手机暗色断言，但本机未运行 Cypress 容器全套测试；浏览器回归通过实际本地服务执行。
- Docker daemon 未运行；未构建 Docker 镜像，未执行生产部署或生产数据验收。欢迎/无权限/不存在/错误页的模板及样式已编译，未逐一完成浏览器状态验收。
- 系统默认 Node 26 与旧依赖不兼容；本地运行及最终构建改用与生产 Dockerfile 同主版本的 Node 24。
