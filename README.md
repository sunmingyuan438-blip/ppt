# Proposal PPT

面向 B2B 销售与售前的 AI 方案工作台。用户可以用自然语言描述客户需求，上传会议纪要、公司 PPT、案例和品牌材料，先确认脱敏后的项目简报，再确认 12—15 页提纲，最后导出文本、形状、表格和流程图均可继续编辑的 PPTX。

**换电脑继续开发：先阅读 [开发交接文档](docs/HANDOFF.md)。** 文档记录截至 2026-10-13 的完成情况、未完成事项、启动步骤和下一次开发的建议顺序。当前真实 AI 接口已实现并通过模拟测试，尚未完成带真实密钥的端到端联调。

## 本地运行

```powershell
npm ci
npm run dev
```

开发环境默认使用 `APP_ENV=fixture`，服务端监听 `8080`，Vite 前端监听 `5173`。打开 `http://localhost:5173`，点击“进入工作台”即可创建 fixture 会话。

```powershell
npm test
npm run typecheck
npm run build
```

## 当前能力

- OAuth 2.1 + PKCE 路由和 `identity` / `points.spend` 授权范围。
- 项目、文件上传、30 天保留策略和 fixture 内存存储。
- TXT、Markdown、DOCX、PDF、XLSX、PPTX 材料解析，以及 PPTX 主题色提取。
- 上传资料会先解析和脱敏，保存安全摘要与品牌主题；后续项目简报会把这些摘要带入生成上下文。
- 可填写公开参考链接；系统只在工作台展示网页标题、短摘要和抓取状态，来源不会默认写入导出的 PPTX。
- 客户名称、联系人、手机号、邮箱、金额、账号和项目编号脱敏，并在简报确认页展示检查结果。
- Fixture 模式下生成知识付费行业方案简报与 14 页提纲；生产模式通过当前登录用户的 OAuth token 调用 AIGZM `deepseek-v4-flash`。
- 对话式提纲调整示例：`压缩成 10 页`、`更聚焦管理层`。
- 真实模式下，简报、提纲和任意自然语言修改都调用 AIGZM；保存前校验返回结构，失败不会覆盖现有方案。演示模式保留固定示例。
- 使用 PptxGenJS 生成可编辑 PPTX，导出文件仅包含已确认的方案内容。

## 生产接入注意事项

### 本地开发者 API Key 联调

2026-10-13 用户确认先使用开发者自己的积分完成真实生成联调。在根目录 `.env` 中配置：

```dotenv
APP_ENV=developer
AIGZM_API_ORIGIN=https://aigzm.com
AIGZM_MODEL_KEY=deepseek-v4-flash
AIGZM_API_KEY=
```

在 `AIGZM_API_KEY=` 后填入已激活的账号级 Developer API Key，新建 Key 需要在平台确认已保存后才能调用。填写后重启 `npm run dev`，打开 `http://localhost:5173/api/oauth/start` 建立本地工作台会话。该模式调用 `/v1/developer/models/{modelKey}/invoke`，只发送 `X-API-Key`，扣减 Key 所属开发者的积分。它不需要 OAuth Client 或数据库配置；本地会话不是平台授权令牌。

开发者模式只在本机回环地址监听；凭据缺失时工作台可打开，但真实生成返回配置提示。密钥不会出现在前端响应、日志或 Git 中。当前项目数据仍在内存中，重启服务会清空。

### 正式 OAuth 接入

本地启动会读取项目根目录的 `.env`（已被 Git 忽略）；可参考 `.env.example` 填写。生产 OAuth 模式需要正式、已启用的 Client，授权范围为 `identity points.spend`。Sandbox Token 只可用于基础联调，平台不会允许它调用真实模型；OAuth 模式不会自动改用开发者积分。`developer` 模式是用户明确确认的独立配置。

本地浏览器使用 `5173` 时，回调白名单必须完整登记 `http://localhost:5173/api/oauth/callback`，并将 `AIGZM_REDIRECT_URI` 配为相同地址。模型通过 `AIGZM_MODEL_KEY` 配置，每次调用前从实时模型目录检查可用性。令牌兑换按官方 JSON 契约执行；无效授权、积分不足、待核对结果和不完整输出会显示明确错误，不自动重复扣费调用。

本轮接口核对来源（2026-10-13）：[OpenAPI](https://aigzm.com/openapi.json)、[DeepSeek-V4-Flash 实时文档](https://aigzm.com/v1/platform/models/deepseek-v4-flash/documentation)、[安全接入指南](https://aigzm.com/developer-integration-guide.md)。目前完成契约模拟测试，尚未完成持有真实用户 Token 的联调。

生产模式需要在服务端配置 AIGZM OAuth 参数、数据库和 `SESSION_SECRET`。访问令牌只在服务端会话中保存，不进入浏览器或日志。当前 MVP 的项目和对象存储仍默认走内存实现；接入真实部署前应将 `MemoryProjectRepository` / `MemoryObjectStore` 替换为 MySQL / S3 实现，并执行 Drizzle schema migration。

