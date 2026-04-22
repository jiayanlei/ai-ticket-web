<template>
  <div class="codex-console page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Codex 工作台</h1>
        <p class="page-description">内置开发控制台骨架，后续用于接入 codex-cli 并围绕当前项目进行对话式开发辅助。</p>
      </div>
      <div class="toolbar-row">
        <a-tag color="processing">Frontend Shell</a-tag>
        <a-tag color="default">CLI Pending</a-tag>
      </div>
    </div>

    <section class="codex-console__workspace">
      <aside class="codex-console__side">
        <a-card title="项目上下文" :bordered="false" class="codex-console__card">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="项目">ai-ticket-web</a-descriptions-item>
            <a-descriptions-item label="栈">Vue 3 / Vite / TypeScript</a-descriptions-item>
            <a-descriptions-item label="模式">Local Workspace</a-descriptions-item>
            <a-descriptions-item label="状态">等待 CLI 接入</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card title="快捷操作" :bordered="false" class="codex-console__card">
          <div class="codex-console__quick-actions">
            <button v-for="action in quickActions" :key="action.key" type="button" @click="applyQuickAction(action)">
              <span>{{ action.title }}</span>
              <small>{{ action.command }}</small>
            </button>
          </div>
        </a-card>
      </aside>

      <main class="codex-console__main">
        <a-card title="对话区" :bordered="false" class="codex-console__chat">
          <div class="codex-console__messages">
            <div
              v-for="messageItem in messages"
              :key="messageItem.id"
              class="codex-console__message"
              :class="`codex-console__message--${messageItem.role}`"
            >
              <span>{{ messageItem.role }}</span>
              <p>{{ messageItem.content }}</p>
              <time>{{ messageItem.time }}</time>
            </div>
          </div>
        </a-card>

        <a-card title="命令区" :bordered="false" class="codex-console__command">
          <a-textarea
            v-model:value="commandDraft"
            :rows="4"
            placeholder="输入未来要交给 codex-cli 的任务或命令，例如：分析当前路由守卫实现"
          />
          <div class="codex-console__command-actions">
            <a-button @click="clearDraft">清空</a-button>
            <a-button type="primary" @click="submitMockCommand">加入模拟队列</a-button>
          </div>
        </a-card>
      </main>

      <aside class="codex-console__logs">
        <a-card title="日志区" :bordered="false" class="codex-console__card">
          <div class="codex-console__log-list">
            <div
              v-for="log in logs"
              :key="log.id"
              class="codex-console__log"
              :class="`codex-console__log--${log.level}`"
            >
              <span>{{ log.time }}</span>
              <p>{{ log.content }}</p>
            </div>
          </div>
        </a-card>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineOptions({
  name: 'CodexConsolePage',
});

type ConsoleRole = 'system' | 'user' | 'assistant';
type ConsoleLogLevel = 'info' | 'success' | 'warning';

interface ConsoleMessage {
  id: number;
  role: ConsoleRole;
  content: string;
  time: string;
}

interface ConsoleLog {
  id: number;
  level: ConsoleLogLevel;
  content: string;
  time: string;
}

interface QuickAction {
  key: string;
  title: string;
  command: string;
}

const commandDraft = ref('分析当前项目结构，并给出下一阶段开发建议');
const messages = ref<ConsoleMessage[]>([
  {
    id: 1,
    role: 'system',
    content: '控制台前端骨架已就绪，当前阶段仅维护任务草稿、模拟对话和运行日志。',
    time: '16:20',
  },
  {
    id: 2,
    role: 'assistant',
    content: '后续接入 codex-cli 时，可将命令区输入、项目上下文和日志流统一接入任务会话。',
    time: '16:21',
  },
]);
const logs = ref<ConsoleLog[]>([
  {
    id: 1,
    level: 'info',
    content: 'Console shell mounted',
    time: '16:20:01',
  },
  {
    id: 2,
    level: 'success',
    content: 'Workspace context loaded: ai-ticket-web',
    time: '16:20:03',
  },
]);

const quickActions: QuickAction[] = [
  {
    key: 'inspect',
    title: '检查项目结构',
    command: 'codex inspect workspace',
  },
  {
    key: 'typecheck',
    title: '类型检查',
    command: 'npm run type-check',
  },
  {
    key: 'build',
    title: '生产构建',
    command: 'npm run build',
  },
  {
    key: 'review',
    title: '代码审查',
    command: 'codex review current changes',
  },
];

let idSeed = 10;

function applyQuickAction(action: QuickAction) {
  commandDraft.value = action.command;
  appendLog('info', `Quick action selected: ${action.title}`);
}

function submitMockCommand() {
  const command = commandDraft.value.trim();

  if (!command) {
    appendLog('warning', 'Command draft is empty');
    return;
  }

  messages.value.push({
    id: idSeed++,
    role: 'user',
    content: command,
    time: createShortTime(),
  });
  messages.value.push({
    id: idSeed++,
    role: 'assistant',
    content: '已加入模拟队列。真实命令执行将在后续接入 codex-cli 后启用。',
    time: createShortTime(),
  });
  appendLog('success', `Mock command queued: ${command}`);
}

function clearDraft() {
  commandDraft.value = '';
  appendLog('info', 'Command draft cleared');
}

function appendLog(level: ConsoleLogLevel, content: string) {
  logs.value.unshift({
    id: idSeed++,
    level,
    content,
    time: createLogTime(),
  });
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
</script>

<style scoped lang="scss">
.codex-console {
  &__workspace {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 320px;
    gap: 16px;
    min-height: calc(100vh - 180px);
  }

  &__side,
  &__main,
  &__logs {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  &__card,
  &__chat,
  &__command {
    background: #101827;
    border: 1px solid #1f2a3d;

    :deep(.ant-card-head) {
      min-height: 44px;
      color: #dbeafe;
      background: #111c2f;
      border-bottom-color: #1f2a3d;
    }

    :deep(.ant-card-body) {
      color: #d1d5db;
    }
  }

  &__chat {
    flex: 1;
    min-height: 420px;
  }

  &__messages,
  &__log-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__message {
    padding: 12px;
    background: #0b1220;
    border: 1px solid #1f2a3d;
    border-radius: 8px;

    span {
      color: #93c5fd;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    p {
      margin: 8px 0;
      color: #e5e7eb;
      line-height: 1.7;
    }

    time {
      color: #64748b;
      font-size: 12px;
    }

    &--user {
      background: #0f1f35;
      border-color: #1d4ed8;
    }
  }

  &__quick-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;

    button {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
      padding: 12px;
      color: #dbeafe;
      text-align: left;
      cursor: pointer;
      background: #0b1220;
      border: 1px solid #24324a;
      border-radius: 8px;

      &:hover {
        border-color: #1677ff;
      }
    }

    small {
      color: #94a3b8;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    }
  }

  &__command {
    :deep(.ant-input) {
      color: #d1d5db;
      background: #060b14;
      border-color: #24324a;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    }
  }

  &__command-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 12px;
  }

  &__log {
    padding: 10px 0;
    border-bottom: 1px solid #1f2a3d;

    span {
      color: #64748b;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
      font-size: 12px;
    }

    p {
      margin: 6px 0 0;
      color: #cbd5e1;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
      font-size: 12px;
      line-height: 1.6;
      word-break: break-word;
    }

    &--success p {
      color: #86efac;
    }

    &--warning p {
      color: #fde68a;
    }
  }
}

@media (max-width: 1280px) {
  .codex-console__workspace {
    grid-template-columns: 260px minmax(0, 1fr);
  }

  .codex-console__logs {
    grid-column: 1 / -1;
  }
}

@media (max-width: 860px) {
  .codex-console__workspace {
    grid-template-columns: 1fr;
  }
}
</style>
