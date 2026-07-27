# 项目记忆：注意事项

## 2026-07-27 - 保持记忆有用

- 摘要：不要记录完整对话原文，只记录有长期价值的上下文、注意事项、未完成事项、决策、回滚说明和会话摘要。
- 相关：`docs/memory/README.md`

## 2026-07-27 - Prompt 页面编码问题

- 摘要：`src/views/ai/prompts/index.vue` 当前中文文本存在乱码。实现 Prompt Center 重构前，先修复编码或重写页面文案，否则 UI 文案和本地化标签可能继续损坏。
- 相关：`src/views/ai/prompts/index.vue`

## 2026-07-27 - Data Cockpit 编码和范围控制

- 摘要：`src/views/analytics/cockpit/index.vue` 当前中文文本存在乱码。实现新方向时，需要干净地重写页面文案，并把第一版限制在 3 个区块内，不要扩成密集图表集合。
- 相关：`src/views/analytics/cockpit/index.vue`、`docs/modules/analytics-data-cockpit-ui-detail.md`

## 2026-07-27 - Data Cockpit 卡片堆叠风险

- 摘要：避免把 `/analytics/cockpit` 做成 KPI 卡片、风险卡片、动作卡片的堆叠页面，这会显得像 AI 生成的后台模板。应使用横向指标条、工作列表、队列、抽屉、状态标签、进度条和时间线。
- 相关：`src/views/analytics/cockpit/index.vue`、`docs/modules/analytics-data-cockpit-detail.md`、`docs/modules/analytics-data-cockpit-ui-detail.md`
