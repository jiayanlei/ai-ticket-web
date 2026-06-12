# Enterprise Customer Service Domain Model

## Core Objects

- Ticket: service request with SLA, priority, owner, channel, lifecycle, tags, AI recommendation, sentiment, and estimated resolution.
- Customer: account or contact with value tier, risk tier, lifecycle stage, history, sentiment, and satisfaction.
- Conversation: omnichannel interaction across phone, chat, email, SMS, WhatsApp, Telegram, Facebook, WeChat, WeCom, DingTalk, and Feishu.
- Agent: human or AI operator with skills, capacity, status, quality score, productivity, and routing eligibility.
- Knowledge Item: article, FAQ, document, graph node, vector chunk, or reviewed answer.
- AI Agent: autonomous workflow participant with tools, prompts, logs, trace, cost, and performance.
- SLA Policy: response and resolution contract by customer tier, channel, priority, and service type.
- Alert: operational, service, risk, security, or system event with escalation and notification policy.
- Permission: role, menu, data scope, API scope, tenant, and audit boundary.

## Key Lifecycles

- Ticket: New -> Triage -> Assigned -> In Progress -> Pending Customer -> Escalated -> Resolved -> Archived.
- Call: Queued -> Connected -> Assisted -> Wrapped -> Scored -> Ticketed.
- Knowledge: Draft -> Reviewed -> Published -> Embedded -> Evaluated -> Retired.
- AI Workflow: Draft -> Simulated -> Approved -> Published -> Monitored -> Optimized.
