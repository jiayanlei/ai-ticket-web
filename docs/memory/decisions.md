# 项目记忆：决策

## 2026-07-27 - 使用浅层记忆文件

- 摘要：项目记忆保存在单层 `docs/memory/` 文件夹中，按月使用 `sessions-YYYY-MM.md` 记录会话摘要，不使用多层日期目录。
- 相关：`docs/history/decision-log.md`

## 2026-07-27 - Prompt Center 使用四区块闭环

- 摘要：`/ai/prompts` 应重构为 Prompt Ops Console，包含 4 个有用的闭环区块：Problem Radar、Prompt Asset Pool、Evaluation & Release Desk、Online Feedback Board。确认的流程是“发现问题 -> 定位相关 Prompt -> 创建/测试/发布版本 -> 观察生产指标 -> 回滚或将失败样本回流到评估”。
- 相关：`src/views/ai/prompts/index.vue`、`docs/modules/route-feature-requirements.md`、`docs/api/module-api-requirements.md`

## 2026-07-27 - Data Cockpit 使用三区块闭环

- 摘要：`/analytics/cockpit` 保持简洁，只保留 3 个主区块：Health Overview、Risk Command、Closed-Loop Actions。确认的流程是“健康信号 -> 风险证据 -> 指派动作 -> 恢复验证 -> 重新进入风险池或关闭”。
- 相关：`src/views/analytics/cockpit/index.vue`、`docs/modules/analytics-data-cockpit-ui-detail.md`、`docs/modules/route-feature-requirements.md`、`docs/api/module-api-requirements.md`

## 2026-07-27 - Data Cockpit 避免卡片堆叠

- 摘要：`/analytics/cockpit` 不应实现成大面积卡片墙。优先使用横向指标条、工作列表、动作队列、抽屉、表格行、状态条、标签和时间线。卡片只用于小型信息单元，不作为页面主结构。
- 相关：`src/views/analytics/cockpit/index.vue`、`docs/modules/analytics-data-cockpit-detail.md`、`docs/modules/analytics-data-cockpit-ui-detail.md`
