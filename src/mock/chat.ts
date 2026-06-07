import type {
  AiAgentChatPayload,
  AiAgentChatResult,
  AiAgentConfirmPayload,
  AiAgentConfirmResult,
  AiAgentLog,
  AiAgentPlan,
  AiAgentProjectStatus,
  AiAgentTaskType,
} from '@/api/aiAgent';
import { createMockId, createMockResponse, nowText } from '@/mock/core';

export interface ConversationRecordItem {
  id: string;
  sessionId: string;
  title: string;
  taskType: AiAgentTaskType;
  userName: string;
  lastMessage: string;
  status: 'completed' | 'waiting' | 'warning';
  messageCount: number;
  updatedAt: string;
}

const conversationSeeds: ConversationRecordItem[] = [
  { id: 'conv-1', sessionId: 'session-ticket-routing', title: 'AI 路由工单优化建议', taskType: 'CHANGE_PLAN', userName: '林知远', lastMessage: '建议先把菜单、鉴权和工单数据 mock 完整闭环。', status: 'completed', messageCount: 18, updatedAt: '2026-06-07 09:34:10' },
  { id: 'conv-2', sessionId: 'session-knowledge-import', title: '知识库批量导入方案', taskType: 'BACKEND_API', userName: '宋之言', lastMessage: '需要补齐上传记录、解析状态和失败重试策略。', status: 'waiting', messageCount: 11, updatedAt: '2026-06-06 18:12:09' },
  { id: 'conv-3', sessionId: 'session-login-issue', title: '登录接口异常排查', taskType: 'FRONTEND_ERROR', userName: '陈沐阳', lastMessage: '响应拦截器已统一，建议确认 token 持久化 key。', status: 'warning', messageCount: 9, updatedAt: '2026-06-06 11:22:18' },
  { id: 'conv-4', sessionId: 'session-report-export', title: '日报导出 SQL 生成', taskType: 'SQL_GENERATE', userName: '郑宁', lastMessage: 'SQL 方案包含索引建议和回滚脚本，未自动执行。', status: 'completed', messageCount: 14, updatedAt: '2026-06-05 16:43:52' },
];

let recentLogs: AiAgentLog[] = [
  { id: 'chat-log-1', level: 'info', content: 'Mock AI agent ready for local frontend refactor.', time: '09:30:02' },
  { id: 'chat-log-2', level: 'success', content: 'Conversation records loaded from local mock store.', time: '09:30:03' },
  { id: 'chat-log-3', level: 'warning', content: 'Real backend execution is disabled in mock mode.', time: '09:30:05' },
];

function createPlan(taskType: AiAgentTaskType, message: string): AiAgentPlan {
  const taskMap: Record<AiAgentTaskType, string[]> = {
    FRONTEND_ERROR: ['定位异常页面', '检查请求入参和响应结构', '给出最小修复路径'],
    BACKEND_API: ['梳理接口契约', '确认返回结构', '标记需要的 Controller / Service / Mapper'],
    BACKEND_LOG: ['提炼错误日志', '定位异常链路', '给出修复建议'],
    SQL_GENERATE: ['明确数据来源', '生成只读 SQL 方案', '补充索引和回滚建议'],
    FRONTEND_DEPLOY: ['检查构建脚本', '确认环境变量', '补充回滚步骤'],
    BACKEND_DEPLOY: ['检查构建产物', '确认启动命令', '补充健康检查'],
    GIT_CHECK: ['核对当前分支', '查看未提交变更', '标记发布风险'],
    CHANGE_PLAN: ['识别改动范围', '划分前端/接口/数据层', '生成验证清单'],
    NORMAL_CHAT: ['理解问题上下文', '提炼关键决策点', '返回可执行建议'],
  };

  return {
    taskType,
    riskLevel: taskType.includes('DEPLOY') || taskType === 'SQL_GENERATE' ? 'HIGH' : 'MEDIUM',
    scope: ['ai-ticket-web', 'src/api', 'src/mock'],
    affectedFiles: [
      { path: 'src/api/auth.ts', operation: 'UPDATE' },
      { path: 'src/api/workOrder.ts', operation: 'UPDATE' },
      { path: 'src/mock', operation: 'CREATE' },
    ],
    steps: taskMap[taskType].map((step, index) => `${index + 1}. ${step}`),
    needConfirm: /deploy|sql/i.test(taskType) || message.includes('发布'),
  };
}

function createReply(payload: AiAgentChatPayload) {
  const hint =
    payload.taskType === 'CHANGE_PLAN'
      ? '这次更适合先做 mock 基础设施，再逐个 API 切换。'
      : payload.taskType === 'FRONTEND_ERROR'
        ? '优先检查页面是否直接依赖后端异常字段。'
        : payload.taskType === 'BACKEND_API'
          ? '建议保持前端响应结构和真实后端一致，后续恢复联调时就不用返工。'
          : '我已经按本地 mock 模式整理了建议。';

  return `${hint}\n\n当前输入：${payload.message}\n\n接下来可以继续拆到 API 层、菜单权限、工单数据闭环和 AI 会话流式展示。`;
}

export function mockSendAiAgentMessage(payload: AiAgentChatPayload) {
  conversationSeeds.unshift({
    id: createMockId('conv'),
    sessionId: payload.sessionId,
    title: payload.message.slice(0, 18) || '未命名会话',
    taskType: payload.taskType,
    userName: '当前用户',
    lastMessage: payload.message,
    status: 'completed',
    messageCount: 1,
    updatedAt: nowText(),
  });

  recentLogs = [
    {
      id: createMockId('log'),
      level: 'info',
      content: `Received ${payload.taskType} task in mock mode.`,
      time: nowText().slice(11),
    } satisfies AiAgentLog,
    ...recentLogs,
  ].slice(0, 12);

  return createMockResponse<AiAgentChatResult>({
    sessionId: payload.sessionId,
    reply: createReply(payload),
    message: {
      id: createMockId('msg'),
      role: 'assistant',
      content: createReply(payload),
      time: nowText(),
    },
    plan: createPlan(payload.taskType, payload.message),
    logs: recentLogs,
  });
}

export function mockGetAiAgentProjectStatus() {
  return createMockResponse<AiAgentProjectStatus>({
    frontendProject: 'ai-ticket-web',
    backendProject: 'ai-ticket-server',
    branch: 'main',
    environment: 'local-mock',
    hasUncommittedChanges: true,
    latestCommit: 'refactor: route all frontend APIs through mock switch',
    latestCommitTime: '2026-06-07 09:20:00',
  });
}

export function mockGetAiAgentRecentLogs() {
  return createMockResponse(recentLogs);
}

export function mockConfirmAiAgentAction(payload: AiAgentConfirmPayload) {
  const message = payload.confirm
    ? 'Mock mode 已记录确认动作，未执行真实后端或发布操作。'
    : 'Mock mode 已记录取消动作。';

  recentLogs = [
    {
      id: createMockId('log'),
      level: payload.confirm ? 'success' : 'warning',
      content: message,
      time: nowText().slice(11),
    } satisfies AiAgentLog,
    ...recentLogs,
  ].slice(0, 12);

  return createMockResponse<AiAgentConfirmResult>({
    success: true,
    message,
    plan: createPlan('CHANGE_PLAN', message),
    logs: recentLogs,
  });
}

export function getMockConversationRecords() {
  return createMockResponse(conversationSeeds);
}
