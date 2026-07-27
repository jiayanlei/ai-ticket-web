# 项目记忆：待办

## 2026-07-27 - 记忆维护

- 摘要：后续有长期价值的对话上下文，需要在任务完成后写入 `docs/memory/`。
- 相关：`project-memory` Codex skill

## 2026-07-27 - 实现 Prompt Center 四区块信息架构

- 摘要：`/ai/prompts` 需要围绕 4 个区块重构：Problem Radar、Prompt Asset Pool、Evaluation & Release Desk、Online Feedback Board。保留“线上异常发现 -> 定位 Prompt -> 编辑/评估/审批/灰度发布 -> 线上观测 -> 回滚或失败样本回流”的闭环。
- 相关：`src/views/ai/prompts/index.vue`、`docs/modules/ai-prompt-center-ui-detail.md`

## 2026-07-27 - 实现 Data Cockpit 三区块信息架构

- 摘要：`/analytics/cockpit` 需要围绕 3 个区块重构：Health Overview、Risk Command、Closed-Loop Actions。保留“异常 KPI 信号 -> 风险证据 -> 指派动作 -> 恢复验证 -> 关闭或重新进入风险池”的流程。
- 相关：`src/views/analytics/cockpit/index.vue`、`docs/modules/analytics-data-cockpit-ui-detail.md`

## 2026-07-27 - 实现 Data Cockpit UI 细化方案

- 摘要：按 UI 细化文档实现 `/analytics/cockpit`：工具栏筛选、横向指标条、3 类风险、风险工作列表、详情抽屉、新建动作弹窗、动作队列、动作状态流转和恢复验证。页面要紧凑，避免卡片过多或图表过度扩张。
- 相关：`src/views/analytics/cockpit/index.vue`、`docs/modules/analytics-data-cockpit-ui-detail.md`
