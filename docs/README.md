# AI Ticket OS Product Assets

This directory stores the formal product, design, prototype, and acceptance assets for AI Ticket OS.

AI Ticket OS is an enterprise AI customer service operating system for large-scale support centers, call centers, after-sales teams, and customer success operations.

## Directory Map

- `business/`: domain context, operating model, and role/permission discussions.
- `modules/`: route-level feature requirements and module behavior specifications.
- `api/`: module API requirements and permission suggestions.
- `prompts/`: reusable design and page-generation prompts.
- `information-architecture/`: sitemap, navigation model, route and permission matrix.
- `design-system/`: visual language, tokens, components, charts, icons, and states.
- `prototypes/`: static prototype images and source files.
- `acceptance/`: implementation and visual QA checklists.
- `context/`: project context, current status, and working-memory notes.
- `history/`: change records, rollback records, and decision trace.
- `memory/`: shallow project memory for quick retrieval, cautions, todos, decisions, and session traces.

## Key Documents

- `modules/route-feature-requirements.md`: required functions for the 30 main routes and the Tenant Center extension route.
- `business/tenant-management-closed-loop.md`: tenant creation, initialization, configuration, members, permissions, resources, audit, freeze, restore, disable, and archive lifecycle.
- `api/module-api-requirements.md`: minimum API surfaces and permission suggestions by module.
- `context/project-context.md`: current project context and handoff notes.
- `history/change-log.md`: implementation and documentation change trace.
- `history/rollback-log.md`: rollback records and recovery notes.
- `history/decision-log.md`: important technical and product decisions.
- `memory/README.md`: shallow memory map and usage rules.
- `memory/project.md`: project overview and current state for quick context recovery.
- `memory/sessions-YYYY-MM.md`: monthly session summaries.

## Documentation Workflow

Use `docs/` as the single source of truth for project context, traceability, and recovery notes.

1. Before larger changes, update `context/project-context.md` with the current goal, known constraints, and affected areas.
2. After each meaningful change, add an entry to `history/change-log.md`.
3. When a decision changes product behavior, architecture, dependencies, or workflow, record it in `history/decision-log.md`.
4. When reverting, hotfixing, or restoring behavior, record the reason, scope, method, and verification result in `history/rollback-log.md`.
5. Keep entries dated with `YYYY-MM-DD` and reference related files, branches, commits, issues, or tasks when available.
6. For fast context recovery during conversations, keep concise working memory in `memory/`.
7. 留痕内容默认使用中文；必要的技术名、产品名、路径、命令、API 名等可以保留原文。

## Product Direction

- Primary UI language: English.
- Design language: Future Enterprise SaaS, AI Native First, Glassmorphism, Cyber Tech, Dark Mode, Data Intelligence, Operation Command Center.
- Primary canvas: 1920x1080 desktop.
- Responsive scope: desktop first with basic responsive support for narrower laptop screens.
- Engineering target: directly implementable Vue 3 enterprise admin system.
