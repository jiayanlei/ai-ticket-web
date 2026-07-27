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
