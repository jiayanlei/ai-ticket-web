# Tenant Management Closed Loop

This document describes the management lifecycle for tenants in AI Ticket OS. It covers administration and governance only. Commercial billing, packages, renewals, and overdue payment restrictions are out of scope for this version.

## Positioning

Tenant management controls the operating boundary of enterprise customers, business units, or regional service organizations. The tenant is the top-level context for data isolation, organization structure, user membership, permissions, service configuration, AI capability access, resource limits, and audit traceability.

The top tenant selector is used for switching the current work context. Tenant Management is an independent top-level navigation group, while Tenant Center is the page used for managing the tenant lifecycle. It is not part of System Management.

## Lifecycle

| Stage | Purpose | Required Result |
| --- | --- | --- |
| Draft | Create the tenant record before activation. | Basic tenant information is saved but not available for normal users. |
| Initializing | Generate default structures and settings. | Default organization, roles, permissions, and system settings are prepared. |
| Enabled | Allow tenant users to access business modules. | Tenant can operate tickets, calls, chats, knowledge, AI, analytics, and system settings. |
| Frozen | Temporarily block risky or non-compliant tenant activity. | Login and sensitive writes are blocked according to policy, while audit records remain readable. |
| Restored | Recover a frozen tenant after review. | Tenant returns to enabled status with historical data and audit records preserved. |
| Disabled | Stop tenant business usage. | Login and business writes are disabled. Required historical data remains retained. |
| Archived | Move inactive tenant to long-term retention. | Tenant is hidden from daily operations and kept for audit or retention requirements. |

## Closed-Loop Process

1. Create tenant  
   Fill tenant name, tenant code, administrator, default organization, and enabled modules.

2. Initialize tenant  
   Generate default roles, default organization, default permission template, and base system settings.

3. Configure tenant  
   Configure channels, SLA rules, ticket rules, AI switches, knowledge scope, language, time zone, and data permissions.

4. Invite members  
   Add administrators, support leads, agents, AI operations users, knowledge managers, and auditors.

5. Operate daily service  
   Tenant users work inside tickets, calls, live chat, email, SMS, knowledge, AI, analytics, and reports under tenant data boundaries.

6. Monitor and audit  
   Track resource usage, sensitive operations, tenant switching, permission changes, configuration changes, and abnormal behavior.

7. Freeze and restore  
   Freeze a tenant for security, compliance, or operations reasons. Restore only after review, while keeping historical data and audit records.

8. Disable and archive  
   Disable tenant login and business writes, then archive when the tenant no longer participates in daily operations.

## Tenant Data Boundary

- Business records must belong to a tenant context, including tickets, conversations, customers, agents, knowledge, AI agents, workflows, prompts, reports, alerts, and audit logs.
- Cross-tenant access is disabled by default.
- Super administrator and auditor access must be explicit and logged.
- Tenant switching must write an audit record when it changes the active work context.
- Tenant data export must require permission and produce an audit trail.

## Core Management Areas

| Area | Required Capabilities |
| --- | --- |
| Basic Info | Tenant name, code, status, administrator, service state, creation time, description. |
| Organization | Departments, teams, skill groups, default organization, parent-child structure. |
| Members | Users, administrators, support leads, agents, AI operators, knowledge managers, auditors, invitation status, account status. |
| Permissions | Tenant roles, menu permission, action permission, data scope, sensitive permission approval. |
| Business Settings | Channel access, default SLA policy, ticket rules, AI switches, knowledge scope, language, time zone. |
| Resources | User count, AI agent count, knowledge capacity, API call quota, channel access count. |
| Audit | Tenant switching, administrator operation, permission change, sensitive export, configuration change, status change. |

## Status Rules

- Draft tenants cannot be selected in the header tenant selector.
- Initializing tenants should show setup progress and block normal business usage.
- Enabled tenants can be selected and used by authorized users.
- Frozen tenants should block login or high-risk writes according to policy, and show a clear reason.
- Restored tenants keep historical data, members, permissions, and audit logs.
- Disabled tenants block login and business writes.
- Archived tenants are excluded from normal tenant lists by default but remain searchable by administrators or auditors.

## Minimum Acceptance Criteria

- Administrators can understand how a tenant moves from creation to archive.
- Tenant configuration, organization, users, permissions, resources, and audit are described as one closed loop.
- Tenant Center is clearly separated from the top tenant selector and from System Management.
- Billing and package logic are not included in this version.
