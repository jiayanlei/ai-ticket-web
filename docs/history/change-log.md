# 变更留痕

记录有意义的实现、文档、配置和依赖变更。

## 模板

```md
## YYYY-MM-DD - 简短标题

- 类型：feature | fix | refactor | docs | config | dependency | test | chore
- 范围：受影响模块、页面、服务或文档
- 摘要：
- 文件：
- 验证：
- 相关：
```

## 记录

## 2026-07-28 - 优化客户 360 首屏闭环显示

- 类型：fix
- 范围：`src/views/customers/360/index.vue`
- 摘要：根据反馈取消“风险与证据”模块，收紧客户切换、客户概览和时间线间距，并将状态推进操作并入时间线头部，保证“互动与闭环时间线”和操作模块能够完整进入当前工作流视野。
- 文件：`src/views/customers/360/index.vue`、`docs/history/change-log.md`
- 验证：`npm run type-check` 通过；`npm run build` 通过；Playwright 登录后访问 `/customers/360`，时间线和操作区首屏可见，截图已保存。
- 相关：用户反馈风险证据模块不需要，时间线与操作模块未完整显示。

## 2026-07-28 - 实现客户 360 纵向闭环 UI

- 类型：feature
- 范围：`src/views/customers/360/index.vue`
- 摘要：按 Figma 和可落地 UI 文档，将客户 360 从三栏占位结构改为纵向闭环工作台，包含顶部操作条、客户切换、客户状态总览、风险证据、互动时间线和底部行动条；复用现有 `BusinessRecord` 数据结构和状态更新接口。
- 文件：`src/views/customers/360/index.vue`、`output/playwright/customer-360-landable-ui.png`
- 验证：`npm run type-check` 通过；`npm run build` 通过；Playwright 登录后访问 `/customers/360`，无控制台错误，截图已保存。
- 相关：Figma 文件 `https://www.figma.com/design/3XGwkzufnJrBHoTQlpXtr1`

## 2026-07-28 - 创建客户 360 Figma UI 画布

- 类型：docs
- 范围：Figma、`docs/modules/`
- 摘要：在 Figma 中创建客户 360 可落地 UI 方案画布，采用非三栏纵向工作流：顶部操作条、客户切换、客户状态总览、风险证据、互动时间线和底部行动条。
- 文件：Figma 文件 `https://www.figma.com/design/3XGwkzufnJrBHoTQlpXtr1`
- 验证：Figma `use_figma` 写入成功并返回画布截图，未修改页面代码。
- 相关：用户要求继续往 Figma 中生成客户 360 UI。

## 2026-07-28 - 新增客户 360 可落地 UI 方案

- 类型：docs
- 范围：`docs/modules/`
- 摘要：基于客户 360 优化探索文档，新增一版不采用三栏、可直接按现有 Vue 页面和 `BusinessRecord` 数据结构落地的 UI 方案，覆盖布局、组件拆分、数据映射、交互、状态和验收清单。
- 文件：`docs/modules/customer-360-landable-ui-design.md`、`docs/modules/customer-360-optimization-detail.md`
- 验证：文档已创建并修正上一份文档中的残留字段说明，未修改页面代码。
- 相关：用户要求根据文档设计一版可落地且不复杂的 UI。

## 2026-07-28 - 新增客户 360 优化探索文档

- 类型：docs
- 范围：`docs/modules/`
- 摘要：分析客户 360 当前页面、现有数据模型和设计约束，形成简洁可闭环的优化方向文档；根据反馈明确不采用三栏布局，建议首轮改为“客户切换、状态总览、风险证据、互动时间线、底部行动”的纵向闭环。
- 文件：`docs/modules/customer-360-optimization-detail.md`
- 验证：文档已创建，未修改页面代码。
- 相关：用户要求先不动代码，生成客户 360 页面优化详细文档。

## 2026-07-27 - 建立文档管理结构

- 类型：docs
- 范围：`docs/`
- 摘要：新增项目上下文、变更留痕、决策留痕和回滚留痕文档结构。
- 文件：`docs/README.md`、`docs/context/`、`docs/history/`
- 验证：目录和 Markdown 文件已创建。
- 相关：用户要求在 `docs/` 中管理上下文、回滚和留痕记录。

## 2026-07-27 - 新增浅层项目记忆

- 类型：docs
- 范围：`docs/memory/`
- 摘要：新增浅层记忆文件，用于快速检索项目上下文、注意事项、待办、决策、回滚说明和按月会话摘要。
- 文件：`docs/README.md`、`docs/context/project-context.md`、`docs/history/change-log.md`、`docs/history/decision-log.md`、`docs/memory/`
- 验证：记忆文件已创建，并已挂入文档地图。
- 相关：`project-memory` Codex skill。

## 2026-07-27 - 留痕语言改为中文优先

- 类型：docs
- 范围：`project-memory`、`docs/memory/`
- 摘要：明确留痕内容默认使用中文，必要的技术名、产品名、路径、命令、API 名等可以保留原文。
- 文件：`C:\Users\JionTuonon\.codex\skills\project-memory\SKILL.md`、`C:\Users\JionTuonon\.codex\skills\project-memory\agents\openai.yaml`、`docs/memory/`
- 验证：已更新规则并中文化现有浅层留痕。
- 相关：用户要求所有留痕优先使用中文。
