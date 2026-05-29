# Codex 工作台 UI 布局优化

## 摘要

本次在现有 Codex 工作台页面基础上完成 UI 和布局优化：移除页面顶部大标题说明区域，保留右上角状态标签；左侧改为“项目状态 + 快捷任务”结构并取消最近会话模块；重构项目状态和快捷任务卡片样式；放大中间 AI 输入区并优化聊天区滚动；提升右侧执行计划区的信息层级和视觉密度。

## 已变更文件

- `src/views/console/codex/index.vue`
  - 移除顶部标题与说明文案。
  - 右上角保留 `AI DevOps` 和接口状态标签。
  - 左侧调整为项目状态在上、快捷任务在下。
  - 取消最近会话模块展示与相关组件引用。
  - 调整三栏工作区高度、网格尺寸、背景和卡片统一风格。

- `src/views/console/codex/types.ts`
  - 为快捷任务类型补充 `description` 与 `icon` 字段。

- `src/views/console/codex/mock.ts`
  - 为 8 个快捷任务补充图标和简短说明。

- `src/views/console/codex/components/ProjectStatusCard.vue`
  - 将项目状态改为更紧凑的清爽卡片。
  - 使用状态标签展示分支、环境、Git 状态和接口连接状态。

- `src/views/console/codex/components/QuickTaskList.vue`
  - 将普通按钮列表重构为轻量卡片式任务入口。
  - 增加图标、标题、说明、选中态和 hover 浮起效果。

- `src/views/console/codex/components/ChatPanel.vue`
  - 放大多行输入区域，默认高度约 110px，最大 180px。
  - 保持 Enter 发送、Shift + Enter 换行。
  - 发送按钮固定在输入区域右下角。
  - 优化聊天卡片圆角、阴影、消息区间距和底部输入区质感。

- `src/views/console/codex/components/ActionPlanPanel.vue`
  - 优化执行计划区卡片层级、内容滚动和底部按钮固定区域。
  - 提升任务信息、涉及文件、执行步骤、确认状态的视觉区隔。

- `src/views/console/codex/components/MessageItem.vue`
  - 微调消息卡片、代码块圆角和复制按钮样式，避免代码区域操作遮挡内容。

## 验证

- 已执行 `npm run type-check`，结果通过。
