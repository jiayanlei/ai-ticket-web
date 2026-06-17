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

## Key Documents

- `modules/route-feature-requirements.md`: required functions for the 30 main routes and the Tenant Center extension route.
- `business/tenant-management-closed-loop.md`: tenant creation, initialization, configuration, members, permissions, resources, audit, freeze, restore, disable, and archive lifecycle.
- `api/module-api-requirements.md`: minimum API surfaces and permission suggestions by module.

## Product Direction

- Primary UI language: English.
- Design language: Future Enterprise SaaS, AI Native First, Glassmorphism, Cyber Tech, Dark Mode, Data Intelligence, Operation Command Center.
- Primary canvas: 1920x1080 desktop.
- Responsive scope: desktop first with basic responsive support for narrower laptop screens.
- Engineering target: directly implementable Vue 3 enterprise admin system.
