export interface AiTicketMetricConfig {
  label: string;
  value: string;
  delta: string;
  tone: 'blue' | 'cyan' | 'purple' | 'green' | 'amber' | 'red';
}

export interface AiTicketPageConfig {
  path: string;
  number: string;
  title: string;
  group: string;
  objective: string;
  primaryAction: string;
  metrics: AiTicketMetricConfig[];
  panels: string[];
  charts: string[];
  aiInsight: string;
}

export const aiTicketPages: AiTicketPageConfig[] = [
  {
    "path": "/dashboard/workbench",
    "title": "Dashboard",
    "group": "Smart Workspace",
    "objective": "Real-time enterprise service command overview",
    "primaryAction": "Open Command Screen",
    "metrics": [
      {
        "label": "Today Service Volume",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "blue"
      },
      {
        "label": "SLA Achievement",
        "value": "90.1%",
        "delta": "-6.3%",
        "tone": "cyan"
      },
      {
        "label": "AI Resolution Rate",
        "value": "92.2%",
        "delta": "+8.4%",
        "tone": "purple"
      },
      {
        "label": "Agent Efficiency",
        "value": "72",
        "delta": "-10.5%",
        "tone": "green"
      }
    ],
    "panels": [
      "Realtime Service Board",
      "Alert Center",
      "Agent Online State"
    ],
    "charts": [
      "Service Trends",
      "Sentiment Mix",
      "Regional Heatmap"
    ],
    "aiInsight": "AI detects rising refund intents in APAC and recommends adding two billing specialists to the live queue.",
    "number": "01"
  },
  {
    "path": "/service/tickets",
    "title": "Ticket Center",
    "group": "Service Center",
    "objective": "Control ticket lifecycle, escalation, approval, archive, merge, split and relationship mapping",
    "primaryAction": "Create Ticket",
    "metrics": [
      {
        "label": "Open Tickets",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "cyan"
      },
      {
        "label": "SLA At Risk",
        "value": "947",
        "delta": "-6.3%",
        "tone": "purple"
      },
      {
        "label": "AI Recommendations",
        "value": "316",
        "delta": "+8.4%",
        "tone": "green"
      },
      {
        "label": "Avg Resolution ETA",
        "value": "94.3%",
        "delta": "-10.5%",
        "tone": "amber"
      }
    ],
    "panels": [
      "Ticket Lifecycle",
      "Escalation Queue",
      "Relationship Graph"
    ],
    "charts": [
      "Ticket Trend",
      "Priority Split",
      "SLA Burn Down"
    ],
    "aiInsight": "AI recommends merging 18 duplicate login incidents and escalating the enterprise SSO cluster.",
    "number": "02"
  },
  {
    "path": "/service/calls",
    "title": "Call Center",
    "group": "Service Center",
    "objective": "Operate live call queues, IVR, monitoring, recording, QA and AI real-time assistance",
    "primaryAction": "Monitor Queue",
    "metrics": [
      {
        "label": "Queued Calls",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "purple"
      },
      {
        "label": "Active Calls",
        "value": "947",
        "delta": "-6.3%",
        "tone": "green"
      },
      {
        "label": "Idle Agents",
        "value": "316",
        "delta": "+8.4%",
        "tone": "amber"
      },
      {
        "label": "Risk Calls",
        "value": "72",
        "delta": "-10.5%",
        "tone": "red"
      }
    ],
    "panels": [
      "Live Queue",
      "IVR Flow",
      "Agent Status Wall"
    ],
    "charts": [
      "Call Volume",
      "Queue Distribution",
      "Emotion Radar"
    ],
    "aiInsight": "AI flags 6 calls with churn risk and suggests supervisor whisper support for premium accounts.",
    "number": "03"
  },
  {
    "path": "/service/live-chat",
    "title": "Live Chat Center",
    "group": "Service Center",
    "objective": "Manage chat hall, customer context, AI replies, handoff and satisfaction",
    "primaryAction": "Take Over",
    "metrics": [
      {
        "label": "Active Chats",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "green"
      },
      {
        "label": "Bot Containment",
        "value": "947",
        "delta": "-6.3%",
        "tone": "amber"
      },
      {
        "label": "Human Handoff",
        "value": "316",
        "delta": "+8.4%",
        "tone": "red"
      },
      {
        "label": "CSAT",
        "value": "72",
        "delta": "-10.5%",
        "tone": "blue"
      }
    ],
    "panels": [
      "Conversation Hall",
      "Customer Context",
      "AI Reply Drafts"
    ],
    "charts": [
      "Chat Load",
      "Intent Heat",
      "Resolution Funnel"
    ],
    "aiInsight": "AI found a knowledge gap in password reset flows and drafted a new response template.",
    "number": "04"
  },
  {
    "path": "/omnichannel/email",
    "title": "Email Center",
    "group": "Omnichannel Center",
    "objective": "Operate email inbox, thread classification, AI summary, drafting and analysis",
    "primaryAction": "Draft Reply",
    "metrics": [
      {
        "label": "Unread Threads",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "amber"
      },
      {
        "label": "Auto Replies",
        "value": "947",
        "delta": "-6.3%",
        "tone": "red"
      },
      {
        "label": "Avg First Reply",
        "value": "316",
        "delta": "+8.4%",
        "tone": "blue"
      },
      {
        "label": "Escalated Emails",
        "value": "72",
        "delta": "-10.5%",
        "tone": "cyan"
      }
    ],
    "panels": [
      "Priority Inbox",
      "Thread Timeline",
      "AI Draft Studio"
    ],
    "charts": [
      "Email Volume",
      "Category Mix",
      "Response SLA"
    ],
    "aiInsight": "AI summarized 42 billing threads and prepared compliant reply drafts for approval.",
    "number": "05"
  },
  {
    "path": "/omnichannel/sms",
    "title": "SMS Center",
    "group": "Omnichannel Center",
    "objective": "Manage SMS templates, tasks, marketing, notices, OTP and delivery analytics",
    "primaryAction": "Create Campaign",
    "metrics": [
      {
        "label": "SMS Tasks",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "red"
      },
      {
        "label": "Delivery Rate",
        "value": "90.1%",
        "delta": "-6.3%",
        "tone": "blue"
      },
      {
        "label": "OTP Success",
        "value": "92.2%",
        "delta": "+8.4%",
        "tone": "cyan"
      },
      {
        "label": "Failed Sends",
        "value": "72",
        "delta": "-10.5%",
        "tone": "purple"
      }
    ],
    "panels": [
      "Template Library",
      "Task Pipeline",
      "Delivery Diagnostics"
    ],
    "charts": [
      "Delivery Trend",
      "Provider Split",
      "Failure Reasons"
    ],
    "aiInsight": "AI recommends moving OTP traffic to Provider B during the current latency spike.",
    "number": "06"
  },
  {
    "path": "/omnichannel/inbox",
    "title": "Unified Inbox",
    "group": "Omnichannel Center",
    "objective": "Unify phone, SMS, email, live chat, WhatsApp, Telegram, Facebook, WeChat, WeCom, DingTalk and Feishu",
    "primaryAction": "Route Message",
    "metrics": [
      {
        "label": "Unified Items",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "blue"
      },
      {
        "label": "Channels Online",
        "value": "947",
        "delta": "-6.3%",
        "tone": "cyan"
      },
      {
        "label": "Unassigned Items",
        "value": "316",
        "delta": "+8.4%",
        "tone": "purple"
      },
      {
        "label": "AI Routed",
        "value": "72",
        "delta": "-10.5%",
        "tone": "green"
      }
    ],
    "panels": [
      "Omnichannel Inbox",
      "Channel Health",
      "Routing Rules"
    ],
    "charts": [
      "Channel Volume",
      "Routing Sankey",
      "Sentiment Stream"
    ],
    "aiInsight": "AI routed 91% of new contacts and identified Telegram as today's fastest-growing support channel.",
    "number": "07"
  },
  {
    "path": "/operations/agents",
    "title": "Agent Center",
    "group": "Agent Operations",
    "objective": "Manage service organization, agents, skills, online status, utilization and capability assessment",
    "primaryAction": "Add Agent",
    "metrics": [
      {
        "label": "Online Agents",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "cyan"
      },
      {
        "label": "Occupancy",
        "value": "947",
        "delta": "-6.3%",
        "tone": "purple"
      },
      {
        "label": "Skill Coverage",
        "value": "92.2%",
        "delta": "+8.4%",
        "tone": "green"
      },
      {
        "label": "Quality Score",
        "value": "94.3%",
        "delta": "-10.5%",
        "tone": "amber"
      }
    ],
    "panels": [
      "Organization Tree",
      "Skill Groups",
      "Status Monitor"
    ],
    "charts": [
      "Utilization Trend",
      "Skill Radar",
      "Team Load"
    ],
    "aiInsight": "AI suggests rebalancing 12 agents from general support to technical escalation.",
    "number": "08"
  },
  {
    "path": "/operations/scheduling",
    "title": "Workforce Scheduling",
    "group": "Agent Operations",
    "objective": "Plan calendar schedules, gantt shifts, leave, overtime, forecast and AI auto-scheduling",
    "primaryAction": "Run AI Schedule",
    "metrics": [
      {
        "label": "Coverage Rate",
        "value": "88.0%",
        "delta": "+4.2%",
        "tone": "purple"
      },
      {
        "label": "Forecast Demand",
        "value": "947",
        "delta": "-6.3%",
        "tone": "green"
      },
      {
        "label": "Overtime Hours",
        "value": "10m",
        "delta": "+8.4%",
        "tone": "amber"
      },
      {
        "label": "Leave Requests",
        "value": "72",
        "delta": "-10.5%",
        "tone": "red"
      }
    ],
    "panels": [
      "Calendar Schedule",
      "Gantt Planner",
      "Forecast Coverage"
    ],
    "charts": [
      "Demand Forecast",
      "Coverage Heatmap",
      "Shift Mix"
    ],
    "aiInsight": "AI generated a revised weekend roster with 14% lower overtime risk.",
    "number": "09"
  },
  {
    "path": "/operations/performance",
    "title": "Performance Center",
    "group": "Agent Operations",
    "objective": "Track KPI boards, rankings, agent performance, team performance, quality, response and resolution",
    "primaryAction": "Review Ranking",
    "metrics": [
      {
        "label": "Top KPI",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "green"
      },
      {
        "label": "Avg Response",
        "value": "947",
        "delta": "-6.3%",
        "tone": "amber"
      },
      {
        "label": "Resolution Rate",
        "value": "92.2%",
        "delta": "+8.4%",
        "tone": "red"
      },
      {
        "label": "CSAT",
        "value": "72",
        "delta": "-10.5%",
        "tone": "blue"
      }
    ],
    "panels": [
      "KPI Wall",
      "Leaderboard",
      "Team Scorecards"
    ],
    "charts": [
      "Performance Trend",
      "Team Comparison",
      "Quality Radar"
    ],
    "aiInsight": "AI highlights a coaching opportunity for agents with high handle time but strong satisfaction.",
    "number": "10"
  },
  {
    "path": "/operations/quality",
    "title": "AI Quality Inspection",
    "group": "Agent Operations",
    "objective": "Inspect recordings and text for violations, risk, service scoring, emotion and manual review",
    "primaryAction": "Start Review",
    "metrics": [
      {
        "label": "Inspected Items",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "amber"
      },
      {
        "label": "Violation Rate",
        "value": "90.1%",
        "delta": "-6.3%",
        "tone": "red"
      },
      {
        "label": "AI Score",
        "value": "92.2%",
        "delta": "+8.4%",
        "tone": "blue"
      },
      {
        "label": "Manual Review",
        "value": "72",
        "delta": "-10.5%",
        "tone": "cyan"
      }
    ],
    "panels": [
      "Recording QA",
      "Text QA",
      "Risk Detection"
    ],
    "charts": [
      "Quality Trend",
      "Violation Split",
      "Emotion Radar"
    ],
    "aiInsight": "AI detected compliance risk in 9 calls and queued them for senior reviewer validation.",
    "number": "11"
  },
  {
    "path": "/operations/training",
    "title": "Training Center",
    "group": "Agent Operations",
    "objective": "Manage courses, exams, learning maps, capability graph and AI simulation training",
    "primaryAction": "Launch Drill",
    "metrics": [
      {
        "label": "Active Courses",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "red"
      },
      {
        "label": "Exam Pass Rate",
        "value": "90.1%",
        "delta": "-6.3%",
        "tone": "blue"
      },
      {
        "label": "Practice Sessions",
        "value": "316",
        "delta": "+8.4%",
        "tone": "cyan"
      },
      {
        "label": "Skill Growth",
        "value": "72",
        "delta": "-10.5%",
        "tone": "purple"
      }
    ],
    "panels": [
      "Course Center",
      "Learning Map",
      "AI Roleplay"
    ],
    "charts": [
      "Learning Trend",
      "Skill Graph",
      "Exam Funnel"
    ],
    "aiInsight": "AI created a simulation scenario for angry billing customers based on recent ticket clusters.",
    "number": "12"
  },
  {
    "path": "/customers/360",
    "title": "Customer 360",
    "group": "Customer Center",
    "objective": "Provide customer profile, lifecycle, ticket, call, conversation, revenue, satisfaction, risk and value context",
    "primaryAction": "Open Profile",
    "metrics": [
      {
        "label": "High Value Customers",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "blue"
      },
      {
        "label": "Churn Risk",
        "value": "947",
        "delta": "-6.3%",
        "tone": "cyan"
      },
      {
        "label": "Lifecycle Stage",
        "value": "316",
        "delta": "+8.4%",
        "tone": "purple"
      },
      {
        "label": "Avg Sentiment",
        "value": "11m",
        "delta": "-10.5%",
        "tone": "green"
      }
    ],
    "panels": [
      "Customer Profile",
      "History Timeline",
      "Risk And Value"
    ],
    "charts": [
      "Lifecycle Funnel",
      "Value Distribution",
      "Sentiment Trend"
    ],
    "aiInsight": "AI identifies 37 enterprise customers with rising complaint frequency and declining sentiment.",
    "number": "13"
  },
  {
    "path": "/knowledge/base",
    "title": "Knowledge Base",
    "group": "Knowledge Center",
    "objective": "Manage articles, FAQ, knowledge graph, review, search, AI Q&A, RAG and vector stores",
    "primaryAction": "New Article",
    "metrics": [
      {
        "label": "Published Articles",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "cyan"
      },
      {
        "label": "FAQ Coverage",
        "value": "90.1%",
        "delta": "-6.3%",
        "tone": "purple"
      },
      {
        "label": "RAG Hit Rate",
        "value": "92.2%",
        "delta": "+8.4%",
        "tone": "green"
      },
      {
        "label": "Review Backlog",
        "value": "72",
        "delta": "-10.5%",
        "tone": "amber"
      }
    ],
    "panels": [
      "Knowledge Articles",
      "Knowledge Graph",
      "RAG Configuration"
    ],
    "charts": [
      "Search Trend",
      "Coverage Map",
      "Vector Health"
    ],
    "aiInsight": "AI found 23 unresolved intents without approved knowledge coverage.",
    "number": "14"
  },
  {
    "path": "/ai/agents",
    "title": "AI Agent Center",
    "group": "AI Capability Center",
    "objective": "Operate agent marketplace, orchestration, monitoring, logs, performance, cost, tools, traces and multi-agent collaboration",
    "primaryAction": "Deploy Agent",
    "metrics": [
      {
        "label": "Running Agents",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "purple"
      },
      {
        "label": "Tool Calls",
        "value": "947",
        "delta": "-6.3%",
        "tone": "green"
      },
      {
        "label": "Avg Latency",
        "value": "216ms",
        "delta": "+8.4%",
        "tone": "amber"
      },
      {
        "label": "AI Cost",
        "value": "$23.5k",
        "delta": "-10.5%",
        "tone": "red"
      }
    ],
    "panels": [
      "Agent Marketplace",
      "Run Monitor",
      "Multi-Agent Graph"
    ],
    "charts": [
      "Agent Performance",
      "Cost Trend",
      "Tool Call Chain"
    ],
    "aiInsight": "AI recommends throttling the refund analysis agent because cost per resolved case rose 18%.",
    "number": "15"
  },
  {
    "path": "/ai/workflows",
    "title": "AI Workflow Center",
    "group": "AI Capability Center",
    "objective": "Build visual workflows with nodes, conditions, tools, model calls and approval flows",
    "primaryAction": "Publish Workflow",
    "metrics": [
      {
        "label": "Active Workflows",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "green"
      },
      {
        "label": "Success Rate",
        "value": "90.1%",
        "delta": "-6.3%",
        "tone": "amber"
      },
      {
        "label": "Approval Wait",
        "value": "10m",
        "delta": "+8.4%",
        "tone": "red"
      },
      {
        "label": "Failed Runs",
        "value": "72",
        "delta": "-10.5%",
        "tone": "blue"
      }
    ],
    "panels": [
      "Workflow Builder",
      "Node Inspector",
      "Approval Flow"
    ],
    "charts": [
      "Run Trend",
      "Failure Reasons",
      "Workflow Sankey"
    ],
    "aiInsight": "AI simulation found a missing fallback branch in the VIP escalation workflow.",
    "number": "16"
  },
  {
    "path": "/ai/prompts",
    "title": "AI Prompt Center",
    "group": "AI Capability Center",
    "objective": "Manage prompt library, versions, evaluations, optimization and A/B tests",
    "primaryAction": "Run Evaluation",
    "metrics": [
      {
        "label": "Prompt Versions",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "amber"
      },
      {
        "label": "Eval Score",
        "value": "90.1%",
        "delta": "-6.3%",
        "tone": "red"
      },
      {
        "label": "A/B Tests",
        "value": "316",
        "delta": "+8.4%",
        "tone": "blue"
      },
      {
        "label": "Regression Alerts",
        "value": "72",
        "delta": "-10.5%",
        "tone": "cyan"
      }
    ],
    "panels": [
      "Prompt Library",
      "Version Diff",
      "Evaluation Matrix"
    ],
    "charts": [
      "Eval Trend",
      "Variant Comparison",
      "Risk Radar"
    ],
    "aiInsight": "AI recommends promoting prompt v12 after a 6.4% improvement in first-contact resolution.",
    "number": "17"
  },
  {
    "path": "/customers/journey",
    "title": "Customer Journey",
    "group": "Customer Center",
    "objective": "Analyze customer touchpoints, churn, conversion and funnel movement",
    "primaryAction": "Analyze Journey",
    "metrics": [
      {
        "label": "Touchpoints",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "red"
      },
      {
        "label": "Conversion Rate",
        "value": "90.1%",
        "delta": "-6.3%",
        "tone": "blue"
      },
      {
        "label": "Churn Signals",
        "value": "316",
        "delta": "+8.4%",
        "tone": "cyan"
      },
      {
        "label": "Journey Gaps",
        "value": "72",
        "delta": "-10.5%",
        "tone": "purple"
      }
    ],
    "panels": [
      "Journey Map",
      "Touchpoint Analysis",
      "Churn Drivers"
    ],
    "charts": [
      "Journey Timeline",
      "Funnel Analysis",
      "Touchpoint Sankey"
    ],
    "aiInsight": "AI found onboarding delay as the largest churn predictor for mid-market customers.",
    "number": "18"
  },
  {
    "path": "/analytics/operations",
    "title": "Operations Analytics",
    "group": "Analytics",
    "objective": "Analyze service, channel, agent, customer, quality and AI operations",
    "primaryAction": "Explore Data",
    "metrics": [
      {
        "label": "Service Volume",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "blue"
      },
      {
        "label": "Channel Efficiency",
        "value": "947",
        "delta": "-6.3%",
        "tone": "cyan"
      },
      {
        "label": "Quality Index",
        "value": "316",
        "delta": "+8.4%",
        "tone": "purple"
      },
      {
        "label": "AI Contribution",
        "value": "72",
        "delta": "-10.5%",
        "tone": "green"
      }
    ],
    "panels": [
      "Service Analysis",
      "Channel Analysis",
      "AI Analysis"
    ],
    "charts": [
      "Area Trend",
      "Stacked Channels",
      "Quality Radar"
    ],
    "aiInsight": "AI attributes 31% of SLA improvement to automated triage and knowledge recommendations.",
    "number": "19"
  },
  {
    "path": "/analytics/bi",
    "title": "BI Reports",
    "group": "Analytics",
    "objective": "Create drag-and-drop reports, chart designers, datasets, metrics and published dashboards",
    "primaryAction": "Create Report",
    "metrics": [
      {
        "label": "Datasets",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "cyan"
      },
      {
        "label": "Published Boards",
        "value": "947",
        "delta": "-6.3%",
        "tone": "purple"
      },
      {
        "label": "Metric Health",
        "value": "316",
        "delta": "+8.4%",
        "tone": "green"
      },
      {
        "label": "Report Runs",
        "value": "72",
        "delta": "-10.5%",
        "tone": "amber"
      }
    ],
    "panels": [
      "Report Builder",
      "Dataset Manager",
      "Metric Catalog"
    ],
    "charts": [
      "Dataset Freshness",
      "Chart Usage",
      "Publish Funnel"
    ],
    "aiInsight": "AI detected duplicate metrics for resolution rate and proposed one governed definition.",
    "number": "20"
  },
  {
    "path": "/analytics/cockpit",
    "title": "Data Cockpit",
    "group": "Analytics",
    "objective": "Operate CEO, operations, support and AI operation cockpits",
    "primaryAction": "Switch Cockpit",
    "metrics": [
      {
        "label": "Executive Health",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "purple"
      },
      {
        "label": "Service Pressure",
        "value": "947",
        "delta": "-6.3%",
        "tone": "green"
      },
      {
        "label": "AI ROI",
        "value": "316",
        "delta": "+8.4%",
        "tone": "amber"
      },
      {
        "label": "Risk Index",
        "value": "72",
        "delta": "-10.5%",
        "tone": "red"
      }
    ],
    "panels": [
      "CEO Cockpit",
      "Support Cockpit",
      "AI Ops Cockpit"
    ],
    "charts": [
      "Executive Trend",
      "Geo Heatmap",
      "Risk Matrix"
    ],
    "aiInsight": "AI cockpit shows token cost is stable while automated resolution continues to increase.",
    "number": "21"
  },
  {
    "path": "/analytics/sla",
    "title": "SLA Management",
    "group": "Analytics",
    "objective": "Manage SLA policies, monitoring, warnings and timeout analysis",
    "primaryAction": "Create SLA Policy",
    "metrics": [
      {
        "label": "SLA Achievement",
        "value": "88.0%",
        "delta": "+4.2%",
        "tone": "green"
      },
      {
        "label": "At Risk Tickets",
        "value": "947",
        "delta": "-6.3%",
        "tone": "amber"
      },
      {
        "label": "Breached Tickets",
        "value": "316",
        "delta": "+8.4%",
        "tone": "red"
      },
      {
        "label": "Policy Count",
        "value": "72",
        "delta": "-10.5%",
        "tone": "blue"
      }
    ],
    "panels": [
      "SLA Policies",
      "SLA Monitor",
      "Timeout Analysis"
    ],
    "charts": [
      "SLA Burn Down",
      "Policy Heatmap",
      "Breach Causes"
    ],
    "aiInsight": "AI predicts 21 tickets will breach within 45 minutes without reassignment.",
    "number": "22"
  },
  {
    "path": "/analytics/risk",
    "title": "Risk Warning",
    "group": "Analytics",
    "objective": "Monitor complaint risk, churn risk, public opinion risk and service risk",
    "primaryAction": "Open War Room",
    "metrics": [
      {
        "label": "Critical Risks",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "amber"
      },
      {
        "label": "Complaint Risk",
        "value": "947",
        "delta": "-6.3%",
        "tone": "red"
      },
      {
        "label": "Churn Risk",
        "value": "316",
        "delta": "+8.4%",
        "tone": "blue"
      },
      {
        "label": "Service Risk",
        "value": "72",
        "delta": "-10.5%",
        "tone": "cyan"
      }
    ],
    "panels": [
      "Realtime Risk",
      "Risk Escalation",
      "Public Opinion Watch"
    ],
    "charts": [
      "Risk Trend",
      "Risk Map",
      "Complaint Funnel"
    ],
    "aiInsight": "AI recommends immediate outreach to three enterprise accounts with severe sentiment decline.",
    "number": "23"
  },
  {
    "path": "/analytics/monitoring",
    "title": "System Monitoring",
    "group": "Analytics",
    "objective": "Monitor services, APIs, database, agents, queues and logs",
    "primaryAction": "Inspect Service",
    "metrics": [
      {
        "label": "Service Uptime",
        "value": "88.0%",
        "delta": "+4.2%",
        "tone": "red"
      },
      {
        "label": "API Latency",
        "value": "198ms",
        "delta": "-6.3%",
        "tone": "blue"
      },
      {
        "label": "Queue Lag",
        "value": "316",
        "delta": "+8.4%",
        "tone": "cyan"
      },
      {
        "label": "Agent Errors",
        "value": "72",
        "delta": "-10.5%",
        "tone": "purple"
      }
    ],
    "panels": [
      "Service Monitor",
      "API Monitor",
      "Log Stream"
    ],
    "charts": [
      "Latency Trend",
      "Queue Depth",
      "Dependency Graph"
    ],
    "aiInsight": "AI correlates queue lag with a database read replica latency spike.",
    "number": "24"
  },
  {
    "path": "/analytics/alerts",
    "title": "Alert Center",
    "group": "Analytics",
    "objective": "Operate alert stream, rules, escalation and notification strategy",
    "primaryAction": "Create Rule",
    "metrics": [
      {
        "label": "Open Alerts",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "blue"
      },
      {
        "label": "Critical Alerts",
        "value": "947",
        "delta": "-6.3%",
        "tone": "cyan"
      },
      {
        "label": "MTTA",
        "value": "316",
        "delta": "+8.4%",
        "tone": "purple"
      },
      {
        "label": "Escalations",
        "value": "72",
        "delta": "-10.5%",
        "tone": "green"
      }
    ],
    "panels": [
      "Realtime Alert Stream",
      "Alert Rules",
      "Notification Policy"
    ],
    "charts": [
      "Alert Trend",
      "Severity Mix",
      "Escalation Flow"
    ],
    "aiInsight": "AI grouped 16 related alerts into one incident around messaging provider instability.",
    "number": "25"
  },
  {
    "path": "/system/permissions",
    "title": "Permission Center",
    "group": "System Management",
    "objective": "Manage RBAC, organization, roles, menus, data permissions and API permissions",
    "primaryAction": "Create Role",
    "metrics": [
      {
        "label": "Roles",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "cyan"
      },
      {
        "label": "Permission Sets",
        "value": "947",
        "delta": "-6.3%",
        "tone": "purple"
      },
      {
        "label": "API Scopes",
        "value": "316",
        "delta": "+8.4%",
        "tone": "green"
      },
      {
        "label": "Data Policies",
        "value": "72",
        "delta": "-10.5%",
        "tone": "amber"
      }
    ],
    "panels": [
      "RBAC Matrix",
      "Organization Tree",
      "API Permissions"
    ],
    "charts": [
      "Role Coverage",
      "Permission Risk",
      "Access Graph"
    ],
    "aiInsight": "AI detects two roles with excessive export permissions and recommends review.",
    "number": "26"
  },
  {
    "path": "/system/audit",
    "title": "Audit Center",
    "group": "System Management",
    "objective": "Review operation logs, login logs, security audit and risk audit",
    "primaryAction": "Export Audit",
    "metrics": [
      {
        "label": "Audit Events",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "purple"
      },
      {
        "label": "Risk Events",
        "value": "947",
        "delta": "-6.3%",
        "tone": "green"
      },
      {
        "label": "Failed Logins",
        "value": "316",
        "delta": "+8.4%",
        "tone": "amber"
      },
      {
        "label": "Sensitive Actions",
        "value": "72",
        "delta": "-10.5%",
        "tone": "red"
      }
    ],
    "panels": [
      "Operation Logs",
      "Login Logs",
      "Security Audit"
    ],
    "charts": [
      "Audit Trend",
      "Risk Distribution",
      "Actor Graph"
    ],
    "aiInsight": "AI highlights unusual tenant-switch activity by an administrator account.",
    "number": "27"
  },
  {
    "path": "/system/management",
    "title": "System Management",
    "group": "System Management",
    "objective": "Manage parameters, dictionaries, tenants and integration configuration",
    "primaryAction": "Save Config",
    "metrics": [
      {
        "label": "Tenants",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "green"
      },
      {
        "label": "Integrations",
        "value": "947",
        "delta": "-6.3%",
        "tone": "amber"
      },
      {
        "label": "Dictionaries",
        "value": "316",
        "delta": "+8.4%",
        "tone": "red"
      },
      {
        "label": "Config Drift",
        "value": "72",
        "delta": "-10.5%",
        "tone": "blue"
      }
    ],
    "panels": [
      "Parameter Config",
      "Tenant Management",
      "Integration Config"
    ],
    "charts": [
      "Config Changes",
      "Tenant Usage",
      "Integration Health"
    ],
    "aiInsight": "AI recommends rotating two integration secrets that are close to policy expiration.",
    "number": "28"
  },
  {
    "path": "/ai/models",
    "title": "AI Model Center",
    "group": "AI Capability Center",
    "objective": "Manage models, model routing, token monitoring, cost analysis and evaluations",
    "primaryAction": "Update Route",
    "metrics": [
      {
        "label": "Active Models",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "amber"
      },
      {
        "label": "Token Usage",
        "value": "3.2M",
        "delta": "-6.3%",
        "tone": "red"
      },
      {
        "label": "Model Cost",
        "value": "$19.8k",
        "delta": "+8.4%",
        "tone": "blue"
      },
      {
        "label": "Eval Score",
        "value": "94.3%",
        "delta": "-10.5%",
        "tone": "cyan"
      }
    ],
    "panels": [
      "Model Registry",
      "Routing Rules",
      "Token Monitor"
    ],
    "charts": [
      "Token Trend",
      "Cost Analysis",
      "Model Evaluation"
    ],
    "aiInsight": "AI recommends routing low-risk FAQ tasks to the economical model tier.",
    "number": "29"
  },
  {
    "path": "/system/open-platform",
    "title": "Open Platform",
    "group": "System Management",
    "objective": "Manage APIs, webhooks, SDKs and application marketplace",
    "primaryAction": "Create API Key",
    "metrics": [
      {
        "label": "API Calls",
        "value": "12840",
        "delta": "+4.2%",
        "tone": "red"
      },
      {
        "label": "Webhook Success",
        "value": "90.1%",
        "delta": "-6.3%",
        "tone": "blue"
      },
      {
        "label": "SDK Downloads",
        "value": "316",
        "delta": "+8.4%",
        "tone": "cyan"
      },
      {
        "label": "Marketplace Apps",
        "value": "72",
        "delta": "-10.5%",
        "tone": "purple"
      }
    ],
    "panels": [
      "API Management",
      "Webhook Management",
      "App Marketplace"
    ],
    "charts": [
      "API Traffic",
      "Webhook Reliability",
      "App Adoption"
    ],
    "aiInsight": "AI detected a webhook retry storm and suggests applying backoff policy v2.",
    "number": "30"
  },
];

export const aiTicketPageMap = new Map(aiTicketPages.map((page) => [page.path, page]));
