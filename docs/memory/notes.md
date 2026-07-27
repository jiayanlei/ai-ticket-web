# 项目记忆：上下文 notes

## 2026-07-27 - 文档记忆结构建立

- 摘要：项目使用 `docs/` 存放正式文档，使用 `docs/memory/` 存放便于对话时快速检索的浅层项目记忆。
- 相关：`docs/README.md`、`docs/context/project-context.md`、`docs/history/`

## 2026-07-27 - Data Cockpit 详情文档

- 摘要：`/analytics/cockpit` 的简化方向已经沉淀为 3 个闭环模块：Health Overview、Risk Command、Closed-Loop Actions。
- 相关：`docs/modules/analytics-data-cockpit-ui-detail.md`、`src/views/analytics/cockpit/index.vue`

## 2026-07-27 - Data Cockpit UI 细化文档

- 摘要：`docs/modules/analytics-data-cockpit-ui-detail.md` 已包含可落地的 UI 细节，包括工具栏筛选、横向指标条、风险卡片、风险详情抽屉、闭环动作卡片、新建动作弹窗、页面状态、示例数据和组件拆分。
- 相关：`docs/modules/analytics-data-cockpit-ui-detail.md`、`src/views/analytics/cockpit/index.vue`

## 2026-07-27 - Data Cockpit 去卡片化方向

- 摘要：Data Cockpit 文档已优化为避免“卡片堆叠式 AI 模板感”。推荐 UI 是运营控制台结构：横向指标条、风险工作列表、动作队列、详情抽屉和时间线。
- 相关：`docs/modules/analytics-data-cockpit-detail.md`、`docs/modules/analytics-data-cockpit-ui-detail.md`、`src/views/analytics/cockpit/index.vue`

## 2026-07-27 - 背景图设计方向

- 摘要：AI Ticket OS 推荐使用 `Dark Command Data Field` 分层背景系统：深色底盘、低透明网格、轻量信号线、蓝/青/紫状态光晕和极弱噪声。为接近设计稿高保真还原，不建议整张背景图铺底，应让 Figma 图层与 Vue/SCSS 参数对应。
- 相关：`docs/design-system/background-image-direction.md`、`docs/design-system/color-tokens.md`、`src/styles/index.scss`
