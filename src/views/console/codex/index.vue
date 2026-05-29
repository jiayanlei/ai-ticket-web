<template>
  <div class="codex-workbench page-view">
    <section class="codex-workbench__layout">
      <aside class="codex-workbench__left">
        <ProjectStatusCard :status="projectStatus" :source="statusSource" :loading="statusLoading" />
        <QuickTaskList :tasks="quickTasks" :active-task-type="activeTaskType" @select="handleQuickTaskSelect" />
      </aside>

      <main class="codex-workbench__center">
        <ChatPanel
          ref="chatPanelRef"
          v-model:draft="inputDraft"
          :messages="messages"
          :loading="chatLoading"
          :error="chatError"
          @send="sendMessage"
          @clear="clearCurrentSession"
          @regenerate="regenerateLastAnswer"
        />
      </main>

      <ActionPlanPanel
        class="codex-workbench__right"
        :plan="plan"
        :logs="logs"
        :confirming="confirming"
        @generate="generatePlan"
        @confirm="confirmTask"
        @cancel="cancelTask"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';

import {
  confirmAiAgentAction,
  getAiAgentProjectStatus,
  getAiAgentRecentLogs,
  sendAiAgentMessage,
} from '@/api/aiAgent';
import type {
  AiAgentChatResult,
  AiAgentLog,
  AiAgentMessageRole,
  AiAgentPlan,
  AiAgentRiskLevel,
  AiAgentTaskType,
} from '@/api/aiAgent';
import ActionPlanPanel from './components/ActionPlanPanel.vue';
import ChatPanel from './components/ChatPanel.vue';
import ProjectStatusCard from './components/ProjectStatusCard.vue';
import QuickTaskList from './components/QuickTaskList.vue';
import {
  createDefaultMessages,
  createDefaultPlan,
  createMockAiReply,
  mockLogs,
  mockProjectStatus,
  quickTasks,
  taskTypeTextMap,
} from './mock';
import type { ActionPlan, ChatMessage, ChatMessageType, ExecutionLogItem, ProjectStatus, QuickTask } from './types';

defineOptions({
  name: 'CodexConsolePage',
});

const activeSessionId = ref('session-default');
const activeTaskType = ref<AiAgentTaskType>('CHANGE_PLAN');
const messages = ref<ChatMessage[]>(deepClone(createDefaultMessages()));
const logs = ref<ExecutionLogItem[]>(deepClone(mockLogs));
const plan = ref<ActionPlan>(deepClone(createDefaultPlan()));
const projectStatus = ref<ProjectStatus>(deepClone(mockProjectStatus));
const statusSource = ref<'api' | 'mock'>('mock');
const statusLoading = ref(false);
const chatLoading = ref(false);
const confirming = ref(false);
const chatError = ref('');
const inputDraft = ref('');
const chatPanelRef = ref<InstanceType<typeof ChatPanel>>();

let idSeed = Date.now();

onMounted(() => {
  loadProjectStatus();
  loadRecentLogs();
  scrollChatToBottom();
});

function handleQuickTaskSelect(task: QuickTask) {
  inputDraft.value = task.prompt;
  activeTaskType.value = task.taskType;
  plan.value = createDefaultPlan(task.taskType);
  appendLog('info', `已填充快捷任务：${task.title}`);
  persistCurrentSession();
  scrollChatToBottom();
}

async function sendMessage() {
  const content = inputDraft.value.trim();

  if (!content || chatLoading.value) {
    return;
  }

  const taskType = activeTaskType.value || 'NORMAL_CHAT';
  inputDraft.value = '';
  chatError.value = '';
  messages.value.push(createMessage('user', content));
  appendLog('info', `发送任务：${taskTypeTextMap[taskType]}`);
  persistCurrentSession();

  await requestAssistantReply(content, taskType);
}

async function regenerateLastAnswer() {
  if (chatLoading.value) {
    return;
  }

  const lastUserMessage = [...messages.value].reverse().find((item) => item.type === 'user');

  if (!lastUserMessage) {
    message.warning('当前会话还没有可重新生成的用户消息');
    return;
  }

  chatError.value = '';
  appendLog('info', '重新生成上一条 AI 回复');
  await requestAssistantReply(lastUserMessage.content, activeTaskType.value);
}

function clearCurrentSession() {
  messages.value = [];
  logs.value = [];
  plan.value = createDefaultPlan(activeTaskType.value);
  chatError.value = '';
  persistCurrentSession();
  message.success('当前会话已清空');
}

function generatePlan() {
  plan.value = createDefaultPlan(activeTaskType.value);
  messages.value.push(
    createMessage(
      'assistant',
      `已生成 **${taskTypeTextMap[activeTaskType.value]}** 的结构化方案。请在右侧查看影响范围、涉及文件、执行步骤和风险等级。`,
    ),
  );
  appendLog('success', `生成方案：${plan.value.taskType}`);
  persistCurrentSession();
  scrollChatToBottom();
}

async function confirmTask() {
  if (confirming.value) {
    return;
  }

  confirming.value = true;

  try {
    const result = await confirmAiAgentAction({
      sessionId: activeSessionId.value,
      actionType: 'GENERATE_DIFF',
      confirm: true,
    });

    if (result.plan) {
      plan.value = normalizePlan(result.plan, activeTaskType.value);
    }

    if (result.logs?.length) {
      logs.value = normalizeLogs(result.logs);
    }

    messages.value.push(createMessage('success', result.message || '后端确认接口已记录确认。第一阶段不会直接执行危险操作。'));
    appendLog('success', '确认执行已提交到 AI Agent');
    message.success('已记录确认');
  } catch {
    messages.value.push(createMessage('warning', '确认接口暂不可用，已使用本地 mock 记录确认；不会执行发布、删除或数据库变更。'));
    appendLog('warning', '后端确认接口不可用，已记录 mock 确认');
    message.warning('已使用 mock 记录确认，不会执行危险操作');
  } finally {
    confirming.value = false;
    persistCurrentSession();
    scrollChatToBottom();
  }
}

function cancelTask() {
  plan.value = {
    ...plan.value,
    needConfirm: false,
  };
  messages.value.push(createMessage('warning', '当前任务已取消，待确认动作已关闭。'));
  appendLog('warning', '任务已取消');
  persistCurrentSession();
  scrollChatToBottom();
}

async function requestAssistantReply(content: string, taskType: AiAgentTaskType) {
  chatLoading.value = true;
  scrollChatToBottom();

  try {
    const result = await sendAiAgentMessage({
      sessionId: activeSessionId.value,
      message: content,
      taskType,
    });

    applyChatResult(result, taskType, content);
  } catch {
    chatError.value = 'AI Agent 接口暂不可用，已使用本地 mock 回复。';
    messages.value.push(createMessage('warning', '后端 /api/ai-agent/chat 暂不可用，当前展示本地 mock 方案。'));
    messages.value.push(createMessage('assistant', createMockAiReply(taskType, content)));
    plan.value = createDefaultPlan(taskType);
    appendLog('warning', 'AI Agent chat 接口不可用，使用 mock 回复');
  } finally {
    chatLoading.value = false;
    persistCurrentSession();
    scrollChatToBottom();
  }
}

function applyChatResult(result: AiAgentChatResult, taskType: AiAgentTaskType, fallbackMessage: string) {
  const role = normalizeMessageRole(result.message?.role);
  const content =
    result.message?.content ||
    result.reply ||
    result.content ||
    `后端已收到请求，但未返回回复内容。\n\n${createMockAiReply(taskType, fallbackMessage)}`;

  messages.value.push(createMessage(role, content));
  plan.value = result.plan ? normalizePlan(result.plan, taskType) : createDefaultPlan(taskType);

  if (result.logs?.length) {
    logs.value = normalizeLogs(result.logs);
  } else {
    appendLog('success', `AI Agent 已返回：${taskTypeTextMap[taskType]}`);
  }
}

async function loadProjectStatus() {
  statusLoading.value = true;

  try {
    projectStatus.value = await getAiAgentProjectStatus();
    statusSource.value = 'api';
  } catch {
    projectStatus.value = deepClone(mockProjectStatus);
    statusSource.value = 'mock';
  } finally {
    statusLoading.value = false;
  }
}

async function loadRecentLogs() {
  try {
    const recentLogs = await getAiAgentRecentLogs();

    if (recentLogs.length) {
      logs.value = normalizeLogs(recentLogs);
      persistCurrentSession();
    }
  } catch {
    logs.value = deepClone(mockLogs);
    persistCurrentSession();
  }
}

function normalizePlan(source: AiAgentPlan, taskType: AiAgentTaskType): ActionPlan {
  const fallback = createDefaultPlan(taskType);
  const riskLevel = normalizeRiskLevel(source.riskLevel);
  const taskText = isKnownTaskType(source.taskType) ? taskTypeTextMap[source.taskType] : source.taskType;

  return {
    taskType: taskText || fallback.taskType,
    riskLevel,
    scope: Array.isArray(source.scope) && source.scope.length ? source.scope : fallback.scope,
    affectedFiles:
      Array.isArray(source.affectedFiles) && source.affectedFiles.length ? source.affectedFiles : fallback.affectedFiles,
    steps: Array.isArray(source.steps) && source.steps.length ? source.steps : fallback.steps,
    needConfirm: Boolean(source.needConfirm),
  };
}

function normalizeLogs(source: AiAgentLog[]): ExecutionLogItem[] {
  return source.map((item) => ({
    id: String(item.id ?? createId('log')),
    level: item.level,
    content: item.content,
    time: item.time || createLogTime(),
  }));
}

function normalizeMessageRole(role?: AiAgentMessageRole): ChatMessageType {
  const allowList: ChatMessageType[] = ['user', 'assistant', 'system', 'log', 'warning', 'success', 'error'];

  return role && allowList.includes(role) ? role : 'assistant';
}

function normalizeRiskLevel(level?: string): AiAgentRiskLevel {
  if (level === 'LOW' || level === 'MEDIUM' || level === 'HIGH') {
    return level;
  }

  return 'MEDIUM';
}

function isKnownTaskType(taskType: string): taskType is AiAgentTaskType {
  return taskType in taskTypeTextMap;
}

function createMessage(type: ChatMessageType, content: string): ChatMessage {
  return {
    id: createId('msg'),
    type,
    content,
    time: createShortTime(),
  };
}

function appendLog(level: ExecutionLogItem['level'], content: string) {
  logs.value.unshift({
    id: createId('log'),
    level,
    content,
    time: createLogTime(),
  });
}

function persistCurrentSession() {
  // 最近会话模块已从页面移除，这里保留会话持久化入口，便于后续接入后端会话存储。
}

function scrollChatToBottom() {
  nextTick(() => {
    chatPanelRef.value?.scrollToBottom();
  });
}

function createId(prefix: string) {
  idSeed += 1;
  return `${prefix}-${idSeed}`;
}

function createShortTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

function createLogTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
</script>

<style scoped lang="scss">
.codex-workbench {
  position: relative;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 0%, rgb(22 119 255 / 7%), transparent 32%),
    linear-gradient(135deg, #f8fbff 0%, #f5f7fb 48%, #ffffff 100%);

  &__layout {
    display: grid;
    grid-template-columns: minmax(240px, 280px) minmax(0, 1fr) minmax(320px, 360px);
    gap: 16px;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  &__left,
  &__center,
  &__right {
    min-width: 0;
    min-height: 0;
  }

  &__left {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  &__center {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :deep(.workbench-card) {
    box-shadow: 0 12px 34px rgb(15 23 42 / 6%);
  }

  :deep(.ant-card) {
    background: rgb(255 255 255 / 92%);
    border: 1px solid rgb(226 232 240 / 90%);
    border-radius: 14px;
  }

  :deep(.ant-card-head) {
    min-height: 42px;
    border-bottom-color: rgb(226 232 240 / 78%);
  }

  :deep(.ant-card-head-title) {
    color: var(--app-text);
    font-size: 14px;
    font-weight: 700;
  }

  :deep(.ant-card-body) {
    padding: 12px;
  }

  :deep(.ant-tag) {
    margin-inline-end: 0;
    border-radius: 999px;
  }
}

@media (max-width: 1320px) {
  .codex-workbench {
    &__layout {
      grid-template-columns: minmax(220px, 250px) minmax(0, 1fr) minmax(280px, 320px);
      gap: 12px;
    }
  }
}

@media (max-width: 960px) {
  .codex-workbench {
    &__layout {
      grid-template-columns: minmax(160px, 0.68fr) minmax(0, 1.35fr) minmax(200px, 0.9fr);
      gap: 10px;
    }
  }
}
</style>
