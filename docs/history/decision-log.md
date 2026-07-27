# 决策留痕

记录会影响产品行为、架构、依赖、工作流或团队约定的长期决策。

## 模板

```md
## YYYY-MM-DD - 决策标题

- 状态：proposed | accepted | superseded
- 背景：
- 决策：
- 影响：
- 备选方案：
- 相关：
```

## 记录

## 2026-07-27 - 使用 `docs/` 作为项目记忆根目录

- 状态：accepted
- 背景：项目需要固定位置来存放上下文文档、留痕记录、回滚说明和交接信息。
- 决策：使用 `docs/` 作为统一文档根目录。产品和设计资产保留在已有目录中，新增 `context/` 和 `history/` 管理持续项目记忆。
- 影响：后续工作按需更新 `docs/context/project-context.md`、`docs/history/change-log.md`、`docs/history/decision-log.md` 和 `docs/history/rollback-log.md`。
- 备选方案：继续把早期迭代笔记放在 `tocodex-docs/`；该目录可以保留，但正式持续项目记忆归入 `docs/`。
- 相关：`docs/README.md`

## 2026-07-27 - 会话记忆保持浅层

- 状态：accepted
- 背景：会话记忆需要便于从对话中检索，也要简单到后续能长期维护。
- 决策：快速工作记忆放在 `docs/memory/`，只使用单层目录和按月会话文件，不建立多层日期目录。
- 影响：后续项目任务应先读取 `docs/memory/`，恢复有用上下文、注意事项、待办、决策和近期会话摘要。
- 备选方案：使用主题/日期/会话多层嵌套目录；因维护和手动搜索成本更高而放弃。
- 相关：`docs/memory/README.md`、`project-memory` Codex skill

## 2026-07-27 - 留痕语言中文优先

- 状态：accepted
- 背景：用户要求所有留痕内容默认使用中文，必要特殊词可以保留原文。
- 决策：`project-memory` 产生和维护的留痕内容默认中文优先。技术名、产品名、文件路径、命令、组件名、API 名、模块名等可保留原文以保证准确性。
- 影响：后续 `docs/memory/`、`docs/history/`、`docs/context/` 中新增的留痕记录都应以中文表达为主。
- 备选方案：继续使用英文模板；放弃，因为不符合当前项目的留痕阅读习惯。
- 相关：`C:\Users\JionTuonon\.codex\skills\project-memory\SKILL.md`、`docs/memory/README.md`
