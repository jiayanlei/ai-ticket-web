# 项目上下文

## 当前快照

- 日期：2026-07-27
- 项目：AI Ticket OS
- 技术栈：Vue 3、Vite、TypeScript、Ant Design Vue、ECharts、Pinia、Vue Router、SCSS
- 文档根目录：`docs/`

## 当前目标

使用 `docs/` 统一管理项目上下文、变更留痕、回滚说明和交接记录。

## 已知约束

- 产品和设计资产保留在现有目录中。
- 实现说明尽量关联到受影响文件、任务、提交或版本。
- 回滚、恢复或 hotfix 前后，需要记录原因、范围、方法和验证结果。
- 留痕内容默认使用中文；必要的技术名、产品名、路径、命令、API 名等可以保留原文。

## 活跃区域

- 产品和业务上下文：`docs/business/`
- 路由和模块需求：`docs/modules/`
- API 需求：`docs/api/`
- 设计系统：`docs/design-system/`
- 验收和 QA：`docs/acceptance/`
- 项目上下文和交接：`docs/context/`
- 变更、回滚和决策留痕：`docs/history/`
- 快速项目记忆和会话摘要：`docs/memory/`

## 交接提示

- 改代码前先查看 `docs/history/change-log.md` 的近期工作。
- 改架构、产品行为或依赖前先查看 `docs/history/decision-log.md`。
- 恢复或回滚行为前先查看 `docs/history/rollback-log.md`。
- 开始任务时先查看 `docs/memory/`，恢复有用说明、注意事项、待办、决策和近期会话摘要。
