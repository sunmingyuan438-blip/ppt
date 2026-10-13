# Proposal PPT 开发交接

更新日期：2026-10-13（Asia/Shanghai）。仓库：https://github.com/sunmingyuan438-blip/ppt 。项目文件在仓库根目录，新电脑克隆后不需要再进入 `proposal-ppt-site` 子目录。

## 产品目标与已确认的选择

为 B2B 销售和售前提供 AI 方案工作台。用户描述客户需求、上传资料后，先确认项目简报，再生成与修改提纲，最后导出可编辑 PPTX。首个示例是 FDE 知识付费客户方案，覆盖内容生产、获客、转化、交付、留存和复购，首版目标 12—15 页。

用户已认可当前界面，已授权继续开发。2026-10-13 明确确认先使用账号级 Developer API Key，按开发者本人积分完成真实模型联调。正式用户 OAuth 与个人积分模式作为后续独立阶段，不借用其他业务应用的 Client ID。

## 已完成与验证程度

| 部分 | 当前状态 | 证据或限制 |
| --- | --- | --- |
| 首页、四步工作台 | 已实现 | 需求输入、简报确认、提纲编排、导出；修复 CSS 丢失及本地 API 代理 |
| 材料上传与解析 | 已实现并有测试 | TXT、Markdown、DOCX、PDF、XLSX、PPTX；解析后形成摘要 |
| 数据脱敏 | 已实现并有测试 | 客户、联系人、手机号、邮箱、金额、账号、项目编号；规则识别仍有覆盖边界 |
| 参考来源 | 已实现并有测试 | 公开链接标题、短摘要、抓取状态；不默认写入 PPT |
| 简报和提纲生成 | 接口已实现 | fixture 提供确定性示例；真实模式调用 AIGZM，输出经结构校验 |
| 自然语言修改 | 接口已实现并有模拟测试 | 真实模式支持任意修改指令；fixture 只支持少量固定示例 |
| 逐页内容编辑 | 已实现 | 修改标题、结论、要点，失焦保存；保存按顺序执行，生成等待保存完成 |
| PPTX 导出 | 已实现并有测试 | 原生文本和形状等可编辑；测试解包 PPTX 验证修改后的标题和结论 |
| 开发者 API Key 模式 | 已实现，待真实联调 | `APP_ENV=developer`，单一 `X-API-Key` 请求头，本地会话与平台凭据隔离 |
| 真实调用边界 | 已实现并有模拟测试 | 实时模型目录、120 秒超时、幂等键、积分不足、待核对结果、空正文、截断和无效 JSON |
| OAuth | 有基础代码与测试 | PKCE、state、JSON 令牌兑换和 userinfo；完整正式身份验证和令牌生命周期仍需完善 |
| 存储 | 内存 MVP | MySQL schema/client 和 S3 适配器已有基础文件，尚未接入运行中的仓储 |

最后一次本地验证：`npm run typecheck`、`npm test`（11 个文件、30 项测试通过）、`npm run build`、`git diff --check` 均通过。本机登录和项目接口验证正常。没有真实平台请求号或真实生成成功证据，不应将模拟测试描述为真实联调成功。

## 新电脑启动

准备 Git 和 Node.js；推荐 Node.js 24（本机验证使用 24.16.0）。项目使用 `process.loadEnvFile`，不要使用缺少该方法的旧 Node 20 版本。

```powershell
git clone https://github.com/sunmingyuan438-blip/ppt.git
cd ppt
npm ci
Copy-Item .env.example .env
npm run dev
```

打开 http://localhost:5173 ，点击“进入工作台”；或者直接打开 http://localhost:5173/api/oauth/start 。前端端口为 5173，API 端口为 8080。保持运行 `npm run dev` 的终端打开。

`.env.example` 默认 `APP_ENV=fixture`，无需凭据就能检查页面和导出流程。真实 AI 联调时只修改以下项目：

```dotenv
APP_ENV=developer
AIGZM_API_ORIGIN=https://aigzm.com
AIGZM_MODEL_KEY=deepseek-v4-flash
AIGZM_API_KEY=
```

将已启用的账号级 API Key 填在最后一个等号后，重启服务，再进入工作台。新建 Key 应在平台确认已保存后激活。Key 只存服务端 `.env` 或环境变量，禁止发到聊天、提交到 Git 或加入前端变量。无 Key 时页面仍可打开，生成返回配置提示，不会回退为假结果。

GitHub 不包含 `.env`、密钥、依赖安装目录、构建产物或浏览器会话。新电脑需要自行重新配置 Key。当前项目、上传文件、简报和提纲都使用内存，重启即丢失，也不会随代码自动迁移。

## 后续工作顺序

### 1. 先完成一次真实生成闭环

- 配置已激活的 Developer API Key，确认 Key 所属账号可用模型和积分。
- 用知识付费示例生成简报和 12—15 页提纲，核对内容是否符合输入而非固定模板。
- 用任意修改要求验证真实改写；直接修改一页，再导出 PPTX，确认内容一致。
- 记录请求号、耗时、页数、结果质量和积分消耗；不记录完整密钥或敏感输入。余额不足、未激活 Key、无效 Key、截断输出和待核对结果继续保留错误提示，不盲目重复扣费。
- 对导出文件进行真实视觉验收：中文显示、长文本、换行、溢出、图表和流程图。现有自动化测试只证明结构与内容，不证明全部视觉质量。

### 2. 数据库与材料持久化

- 实现并接入 MySQL 项目、材料、简报、提纲、编辑记录和导出记录仓储，完成迁移。
- 将原文件和导出结果接入对象存储；目前 S3 `signedUrl` 只是基础占位逻辑，需要真实签名或受鉴权下载接口。
- 接入持久会话、过期清理和 30 天保留任务；重启后恢复项目，并验证用户数据隔离。
- 保存原始需求表单，避免项目恢复时显示默认示例输入。

### 3. PPT 视觉质量与产品交互

- 工作台预览目前使用示意柱形图与节点，不等同于实际导出页面；完善真实页面预览和一致性。
- 将提取出的品牌配色、字体、Logo 真正应用到导出器；当前导出器使用固定主题。
- 完善逐页修改失败后的重试、恢复、保存状态、长文案布局和编辑冲突处理。
- 完善手机端流程；当前窄屏隐藏材料侧栏及 AI 聊天侧栏。
- 案例、报价、指标须有依据或明确标为待确认，不生成虚构的效果数据。

### 4. 独立应用 OAuth 与正式上线

- 为 Proposal PPT 建立独立 Sandbox，登记精确回调白名单，完成基础 OAuth 联调；Sandbox Token 不能真实调用模型。
- 完成正式申请后使用已启用的正式 Client。上线申请和发布需用户明确授权。
- 完善 issuer/audience/nonce 校验、OIDC 验签（如申请 openid）、刷新令牌轮换和持久会话。当前只发送 nonce，尚未完成完整的 ID Token 校验流程。
- 将正式运行的内存仓储替换为真实数据库，核实余额、错误、敏感日志及账户隔离。
- 修复并验证生产启动入口与 SPA 路由：目前 `npm start` 指向 `dist/server/index.js`，TypeScript 实际生成 `dist/server/server/index.js`；静态目录和页面回退也需一起修正。开发模式 `npm run dev` 可用。
- 补充 Playwright 端到端测试（已配置脚本，但暂无 `tests/e2e` 用例）、持续集成、部署包和回滚验收。

## 代码导航

- `src/main.tsx` / `src/style.css`：页面与交互。
- `config/config.ts`：环境配置和本地 `.env` 读取。
- `server/ai/model-client.ts`：实时模型目录、模型调用及安全错误。
- `server/ai/output-validation.ts`：模型 JSON 与页面结构校验。
- `server/routes/generation.ts`：简报、提纲、AI 修改、逐页保存、生成及导出。
- `server/export/pptx.ts`：可编辑 PPTX 生成器。
- `server/auth/*`：本地会话、OAuth 与 PKCE。
- `server/ingestion/*` / `server/privacy/*`：材料解析和脱敏。
- `server/research/web.ts`：参考来源抓取。
- `server/db/*` / `server/artifacts/*` / `server/storage/*`：数据模型和存储。
- `tests/*`：当前 30 项测试。
- `docs/superpowers/specs/2026-10-13-developer-ai-design.md`：已确认的开发者模式设计。
- `docs/superpowers/plans/2026-10-13-developer-ai.md`：实施步骤与尚未完成的真实联调。

## 给新电脑上的开发助手

可以直接发送：

> 请先阅读 README.md 和 docs/HANDOFF.md，继续开发 Proposal PPT。用户已认可当前界面，并确认先用开发者 API Key 完成真实 AI 联调。先检查本地 .env 是否配置密钥，仅报告是否配置，不输出密钥。沿用现有设计，先验证需求→简报→提纲→编辑→PPTX 导出，再按交接文档推进持久化、视觉质量和独立 OAuth。不要把模拟测试当作真实调用成功，不借用其他应用凭据。生产部署前先修复启动入口和静态页面回退。
