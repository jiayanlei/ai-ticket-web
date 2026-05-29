# Codex 工作台与首页大屏布局优化

## 变更摘要

- 删除 Codex 工作台顶部右侧 `AI DevOps` 与 `API Connected` 状态标签，避免占位和视觉冗余。
- 将 Codex 工作台改为使用父级主内容区高度，修复外层页面级纵向滚动与横向溢出问题。
- 优化 Codex 三栏布局、AI 对话区、底部输入区、左侧快捷任务和右侧执行计划的内部滚动策略。
- 删除工作台首页大屏 `AI分析概览` 中的“热点问题 Top5”模块及其数据类型、mock 数据和样式。
- 构建校验通过：`npm run build`。

## 修改文件

- `src/views/console/codex/index.vue`
  - 删除右上角状态栏模板。
  - 将工作台高度改为 `height: 100%`，保留 `min-height: 0` 与 `overflow: hidden`。
  - 三栏布局使用 `grid` 固定在当前内容区内，响应式状态下仍保持三栏完整展示，避免外层页面滚动。

- `src/views/console/codex/components/ChatPanel.vue`
  - 聊天面板设为 `height: 100%` 的 flex column。
  - 消息列表使用 `flex: 1` 和内部纵向滚动。
  - 输入区固定在底部，文本框保持较大输入空间，发送按钮保持在输入框右下角。

- `src/views/console/codex/components/QuickTaskList.vue`
  - 快捷任务卡片改为内部 flex 布局。
  - 快捷任务列表使用内部滚动，避免撑破左侧栏。

- `src/views/console/codex/components/ActionPlanPanel.vue`
  - 执行计划面板设为 `height: 100%`。
  - 内容区内部滚动，底部操作按钮固定在面板底部。

- `src/views/console/codex/components/ProjectStatusCard.vue`
  - 删除项目状态卡片中的接口状态行，彻底移除 `API Connected` 展示。

- `src/layouts/components/AppContent.vue`
  - 针对 Codex 工作台页面禁用主内容容器外层滚动，让滚动只发生在内部模块。

- `src/views/dashboard/workbench/index.vue`
  - 删除“热点问题 Top5”模板模块。
  - 删除 `HotTopic` 类型、`hotTopics` mock 数据及相关样式。
  - AI 分析概览仅保留核心指标展示。
