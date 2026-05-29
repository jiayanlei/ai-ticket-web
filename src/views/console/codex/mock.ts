import type { AiAgentTaskType } from '@/api/aiAgent';
import type { ActionPlan, ChatMessage, ExecutionLogItem, ProjectStatus, QuickTask, RecentSession } from './types';

export const taskTypeTextMap: Record<AiAgentTaskType, string> = {
  FRONTEND_ERROR: '前端报错分析',
  BACKEND_API: '后端接口新增',
  BACKEND_LOG: '后端日志分析',
  SQL_GENERATE: 'SQL 生成',
  FRONTEND_DEPLOY: '前端发布',
  BACKEND_DEPLOY: '后端发布',
  GIT_CHECK: 'Git 状态检查',
  CHANGE_PLAN: '修改计划',
  NORMAL_CHAT: '普通聊天',
};

export const quickTasks: QuickTask[] = [
  {
    key: 'frontend-error',
    title: '分析前端报错',
    description: '定位 Vue / Vite / 页面异常',
    icon: '⚡',
    taskType: 'FRONTEND_ERROR',
    prompt: '请帮我分析当前前端报错，说明可能原因、涉及文件、修复方案和验证步骤。先不要修改代码。',
  },
  {
    key: 'backend-api',
    title: '新增后端接口',
    description: '生成 Controller / Service / Mapper 方案',
    icon: '🧩',
    taskType: 'BACKEND_API',
    prompt:
      '请帮我新增一个后端接口，请先输出接口路径、请求参数、返回结构、涉及文件、代码结构和风险点，不要直接修改代码。',
  },
  {
    key: 'backend-log',
    title: '分析后端日志',
    description: '定位异常链路和修复建议',
    icon: '📋',
    taskType: 'BACKEND_LOG',
    prompt: '请帮我分析最近后端日志，定位异常原因，并给出修复建议。',
  },
  {
    key: 'sql-generate',
    title: '生成 SQL',
    description: '输出 DDL / DML / 索引与风险',
    icon: '🗄️',
    taskType: 'SQL_GENERATE',
    prompt: '请根据我的需求生成 PostgreSQL SQL，说明表结构、字段含义、索引建议和执行风险，不要直接执行 SQL。',
  },
  {
    key: 'frontend-deploy',
    title: '前端构建发布',
    description: '检查 build、dist、Nginx 和回滚',
    icon: '🚀',
    taskType: 'FRONTEND_DEPLOY',
    prompt: '请帮我检查前端发布流程，输出 pnpm build、dist 检查、Nginx 部署、回滚方案。不要直接发布。',
  },
  {
    key: 'backend-deploy',
    title: '后端构建发布',
    description: '梳理打包、启动、日志和健康检查',
    icon: '🛡️',
    taskType: 'BACKEND_DEPLOY',
    prompt: '请帮我检查后端发布流程，输出 Maven 打包、Jar 启动、日志检查、健康检查、回滚方案。不要直接发布。',
  },
  {
    key: 'git-check',
    title: '检查 Git 状态',
    description: '查看分支、提交和变更风险',
    icon: '🌿',
    taskType: 'GIT_CHECK',
    prompt: '请帮我检查当前项目 Git 状态，说明是否有未提交内容、当前分支、最近提交和发布风险。',
  },
  {
    key: 'change-plan',
    title: '生成修改计划',
    description: '拆解涉及文件、步骤、风险和验证',
    icon: '🧭',
    taskType: 'CHANGE_PLAN',
    prompt: '请根据我的需求生成详细修改计划，包括涉及文件、修改步骤、风险点和验证方式，先不要改代码。',
  },
];

export const mockProjectStatus: ProjectStatus = {
  frontendProject: 'ai-ticket-web',
  backendProject: 'ai-ticket-server',
  branch: 'main',
  environment: 'dev',
  hasUncommittedChanges: true,
  latestCommit: 'feat: 初始化内置控制台页面',
  latestCommitTime: '2026-05-13 16:20',
};

export const mockLogs: ExecutionLogItem[] = [
  {
    id: 'log-1',
    level: 'info',
    time: '16:20:01',
    content: 'AI agent workbench mounted',
  },
  {
    id: 'log-2',
    level: 'success',
    time: '16:20:03',
    content: 'Project context loaded: ai-ticket-web / ai-ticket-server',
  },
  {
    id: 'log-3',
    level: 'warning',
    time: '16:20:06',
    content: '后端 AI Agent 接口暂未确认可用，当前支持本地 mock 兜底。',
  },
];

export function createDefaultPlan(taskType: AiAgentTaskType = 'CHANGE_PLAN'): ActionPlan {
  const taskText = taskTypeTextMap[taskType] ?? taskTypeTextMap.NORMAL_CHAT;

  return {
    taskType: taskText,
    riskLevel: taskType.includes('DEPLOY') || taskType === 'SQL_GENERATE' ? 'HIGH' : 'MEDIUM',
    scope: taskType === 'SQL_GENERATE' ? ['PostgreSQL', 'ai-ticket-server'] : ['ai-ticket-web', 'ai-ticket-server', 'Git'],
    affectedFiles: [
      {
        path: 'src/views/console/codex/index.vue',
        operation: 'CHECK',
      },
      {
        path: 'src/api/aiAgent.ts',
        operation: 'CREATE',
      },
      {
        path: 'src/views/console/codex/components/ActionPlanPanel.vue',
        operation: 'UPDATE',
      },
    ],
    steps: [
      '确认任务类型和输入上下文',
      '读取项目状态、最近日志和当前会话记录',
      '生成结构化影响范围与风险说明',
      '输出方案、涉及文件和验证步骤',
      '等待人工确认后再进入下一阶段',
    ],
    needConfirm: true,
  };
}

export function createDefaultMessages(): ChatMessage[] {
  return [
    {
      id: 'msg-system-1',
      type: 'system',
      time: '16:20',
      content: 'Codex 工作台已升级为 AI 开发运维工作台。当前阶段会优先调用后端接口，接口不可用时使用本地 mock 数据。',
    },
    {
      id: 'msg-assistant-1',
      type: 'assistant',
      time: '16:21',
      content:
        '可以从左侧选择快捷任务，也可以直接输入需求。我会按任务类型整理影响范围、涉及文件、执行步骤和风险等级。\n\n```bash\npnpm build\n```\n\n发送前不会自动执行发布、删除或数据库变更。',
    },
  ];
}

export function createMockAiReply(taskType: AiAgentTaskType, userMessage: string): string {
  const taskText = taskTypeTextMap[taskType] ?? taskTypeTextMap.NORMAL_CHAT;

  if (taskType === 'GIT_CHECK') {
    return `已按 **${taskText}** 生成第一阶段检查结果。\n\n- 当前分支需要以后端接口返回为准，mock 显示为 main\n- 存在未提交变更时不建议直接发布\n- 建议先执行状态检查，再补充最近提交和变更摘要\n\n\`\`\`bash\ngit status --short\ngit branch --show-current\ngit log -1 --oneline\n\`\`\`\n\n本阶段只生成检查方案，不会执行提交、推送或发布。`;
  }

  if (taskType === 'SQL_GENERATE') {
    return `我会先按 **${taskText}** 处理，不直接执行 SQL。\n\n建议输出包含：\n- 表结构和字段含义\n- PostgreSQL DDL / DML\n- 索引建议\n- 回滚方式\n- 线上执行风险\n\n\`\`\`sql\n-- 示例：仅用于方案展示，不会自动执行\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_created_at ON ticket_order(created_at);\n\`\`\`\n\n你的输入：${userMessage}`;
  }

  return `已收到 **${taskText}** 请求。我会先整理方案，不直接修改代码或执行危险动作。\n\n- 先定位上下文和影响范围\n- 再列出涉及文件与风险点\n- 最后给出验证步骤和可回滚方案\n\n\`\`\`ts\nconst taskType = '${taskType}';\nconst mode = 'plan-first';\n\`\`\``;
}

export const mockSessions: RecentSession[] = [
  {
    id: 'session-home-optimization',
    title: '大屏首页优化',
    taskType: 'CHANGE_PLAN',
    messages: [
      ...createDefaultMessages(),
      {
        id: 'msg-home-1',
        type: 'user',
        time: '16:26',
        content: '请根据我的需求生成详细修改计划，包括涉及文件、修改步骤、风险点和验证方式，先不要改代码。',
      },
    ],
    plan: createDefaultPlan('CHANGE_PLAN'),
    logs: mockLogs,
  },
  {
    id: 'session-login-error',
    title: '登录接口报错',
    taskType: 'FRONTEND_ERROR',
    messages: [
      {
        id: 'msg-login-system',
        type: 'system',
        time: '15:42',
        content: '会话已切换：登录接口报错。',
      },
      {
        id: 'msg-login-assistant',
        type: 'assistant',
        time: '15:43',
        content: '建议先检查登录页请求路径、token 写入逻辑和响应拦截器。\n\n```ts\nawait http.post<LoginVO, LoginVO>("/auth/login", params);\n```',
      },
    ],
    plan: createDefaultPlan('FRONTEND_ERROR'),
    logs: mockLogs,
  },
  {
    id: 'session-postgresql-schema',
    title: 'PostgreSQL 表结构问题',
    taskType: 'SQL_GENERATE',
    messages: [
      {
        id: 'msg-sql-system',
        type: 'system',
        time: '14:18',
        content: '会话已切换：PostgreSQL 表结构问题。',
      },
      {
        id: 'msg-sql-assistant',
        type: 'assistant',
        time: '14:19',
        content: '数据库变更建议先输出 DDL、索引、数据迁移和回滚 SQL，确认后再执行。',
      },
    ],
    plan: createDefaultPlan('SQL_GENERATE'),
    logs: mockLogs,
  },
  {
    id: 'session-frontend-release',
    title: '前端发布失败',
    taskType: 'FRONTEND_DEPLOY',
    messages: [
      {
        id: 'msg-release-system',
        type: 'system',
        time: '13:35',
        content: '会话已切换：前端发布失败。',
      },
      {
        id: 'msg-release-assistant',
        type: 'assistant',
        time: '13:36',
        content: '先确认构建产物、Nginx 静态目录、缓存策略和回滚目录，不直接发布。',
      },
    ],
    plan: createDefaultPlan('FRONTEND_DEPLOY'),
    logs: mockLogs,
  },
  {
    id: 'session-ticket-stat-api',
    title: '新增工单统计接口',
    taskType: 'BACKEND_API',
    messages: [
      {
        id: 'msg-api-system',
        type: 'system',
        time: '11:10',
        content: '会话已切换：新增工单统计接口。',
      },
      {
        id: 'msg-api-assistant',
        type: 'assistant',
        time: '11:11',
        content: '接口方案会先列出路径、请求参数、返回结构、Controller/Service/Mapper 分层和权限风险。',
      },
    ],
    plan: createDefaultPlan('BACKEND_API'),
    logs: mockLogs,
  },
];
