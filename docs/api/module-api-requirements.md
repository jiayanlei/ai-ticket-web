# Module API Requirements

This document lists the minimum API surfaces needed by the route-level product requirements. It describes business needs only and does not prescribe backend layering or database design.

## Common API Shape

Most business modules need these API categories:

- List query: pagination, keyword, status, time range, and module-specific filters.
- Detail query: full business context by ID.
- State action: assign, escalate, close, publish, enable, disable, acknowledge, or restore according to the module.
- Metrics query: KPI cards, trend charts, distribution charts, and side-panel summaries.
- Audit or export: only for modules that handle sensitive records or administrative actions.

## Route API Summary

| Route | Minimum APIs |
| --- | --- |
| `/dashboard/workbench` | Summary metrics, todo list, risk alerts, quick action counts, trend overview. |
| `/service/tickets` | Ticket list, ticket detail, create ticket, update ticket, assign/transfer, escalate, merge/split, link records, lifecycle timeline, AI recommendation. |
| `/service/calls` | Call queue, call detail, agent states, call control actions, IVR info, recording list, QA result, realtime assist. |
| `/service/live-chat` | Session list, message history, takeover action, reply send, AI draft, customer context, knowledge recommendations, CSAT result. |
| `/omnichannel/email` | Email thread list, thread detail, category update, AI summary, draft create/update, approval send, attachment list, convert to ticket. |
| `/omnichannel/sms` | SMS task list, template list, create task, send plan, delivery status, retry failed sends, unsubscribe list, delivery metrics. |
| `/omnichannel/inbox` | Unified message list, customer aggregation, assignment action, convert to ticket, duplicate merge, intent detection. |
| `/operations/agents` | Agent list, agent detail, status update, skill groups, workload, current tasks, schedule relation, permission state. |
| `/operations/scheduling` | Shift calendar, schedule update, demand forecast, staffing gap, leave request, shift swap, conflict check, AI schedule suggestion. |
| `/operations/performance` | Agent metrics, team metrics, ranking, trend comparison, score detail, export. |
| `/operations/quality` | QA sample list, QA detail, AI score, rule hits, appeal submit/review, correction tracking, QA rules. |
| `/operations/training` | Course list, task list, progress update, test result, weakness recommendation, capability profile. |
| `/customers/360` | Customer list/detail, interaction timeline, tickets, conversations, calls, emails, order/contract summary, risk tags, next-best action. |
| `/customers/journey` | Journey timeline, touchpoints, lifecycle stage, key events, sentiment trend, churn risk, intervention suggestions. |
| `/knowledge/base` | Catalog tree, article list/detail, create/update article, review/publish, search, reference count, hit rate, gap discovery. |
| `/ai/agents` | AI agent list/detail, enable/disable, channel binding, takeover rules, performance metrics, fallback config. |
| `/ai/workflows` | Workflow list/detail, node config, trigger config, run records, publish, rollback, failure alerts, impact metrics. |
| `/ai/prompts` | Prompt list/detail, version list, variable config, scenario binding, test run, score result, approval publish. |
| `/ai/models` | Model list/detail, routing rules, cost metrics, volume, latency, failure rate, budget limit, gray release config. |
| `/analytics/operations` | Operations metrics, channel trends, workload metrics, efficiency metrics, SLA trend, drill-down data. |
| `/analytics/bi` | Report list/detail, saved filters, chart config, export, schedule config, metric definitions. |
| `/analytics/cockpit` | Executive KPIs, realtime trends, risk posture, command screen data, module navigation counts. |
| `/analytics/sla` | SLA policy list/detail, rule update, countdown list, warning list, breach stats, remediation actions. |
| `/analytics/risk` | Risk event list/detail, risk level update, owner assignment, closure action, evidence records, risk metrics. |
| `/analytics/monitoring` | Health metrics, API latency, error rate, queue backlog, AI call status, alert subscriptions, runtime logs. |
| `/analytics/alerts` | Alert list/detail, acknowledge, close, notification rules, related objects, handling records, duplicate grouping. |
| `/system/permissions` | Role list/detail, permission tree, role update, data scope update, permission preview, sensitive permission list. |
| `/system/audit` | Operation logs, login logs, sensitive action logs, audit detail, abnormal behavior marks, export. |
| `/system/management` | Organization, department, user, parameter, dictionary, business switch, base platform configuration APIs. |
| `/system/open-platform` | API app list/detail, key create/rotate, webhook config, callback logs, call volume, rate limit status, integration settings. |
| `/tenants` | Tenant list/detail, create tenant, update tenant, change status, members, organizations, resources, audit logs. |

## Tenant APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/tenants` | Query tenant list with pagination, keyword, status, and service state. |
| `GET` | `/tenants/{id}` | Get tenant detail, including overview and current lifecycle status. |
| `POST` | `/tenants` | Create tenant with base info, administrator, default organization, enabled modules, and permission template. |
| `PUT` | `/tenants/{id}` | Update tenant base settings and business configuration. |
| `PATCH` | `/tenants/{id}/status` | Enable, freeze, disable, restore, or archive a tenant. |
| `GET` | `/tenants/{id}/members` | Query tenant members and account status. |
| `GET` | `/tenants/{id}/organizations` | Query tenant organization and team structure. |
| `GET` | `/tenants/{id}/resources` | Query tenant resource usage and limits. |
| `GET` | `/tenants/{id}/audit-logs` | Query tenant audit logs for switching, permissions, exports, configuration, and status changes. |

## Tenant Permissions

- `tenant:center:view`
- `tenant:center:create`
- `tenant:center:update`
- `tenant:center:status`
- `tenant:center:member`
- `tenant:center:permission`
- `tenant:center:audit`
- `tenant:center:export`
