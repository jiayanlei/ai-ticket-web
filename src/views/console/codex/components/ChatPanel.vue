<template>
  <section class="chat-panel workbench-card">
    <header class="chat-panel__header">
      <div>
        <h2>AI 对话区</h2>
        <p>Markdown、代码块、日志和风险提示会在这里汇总。</p>
      </div>
      <div class="chat-panel__actions">
        <a-button size="small" @click="$emit('regenerate')" :disabled="loading || !messages.length">重新生成</a-button>
        <a-button size="small" danger @click="$emit('clear')" :disabled="loading || !messages.length">清空当前会话</a-button>
      </div>
    </header>

    <a-alert v-if="error" class="chat-panel__error" type="warning" show-icon :message="error" />

    <div ref="messageListRef" class="chat-panel__messages">
      <MessageItem v-for="item in messages" :key="item.id" :message-item="item" />

      <div v-if="loading" class="chat-panel__loading">
        <a-spin size="small" />
        <span>AI 正在整理方案...</span>
      </div>
    </div>

    <footer class="chat-panel__input codex-input">
      <div class="chat-panel__composer">
        <a-textarea
          v-model:value="draftModel"
          :auto-size="false"
          placeholder="输入你的问题，Enter 发送，Shift + Enter 换行"
          @keydown="handleKeydown"
        />
        <div class="chat-panel__input-actions">
          <span>{{ draft.trim().length ? `${draft.trim().length} 字` : '请选择快捷任务或直接输入需求' }}</span>
          <a-button type="primary" :loading="loading" :disabled="!draft.trim()" @click="$emit('send')">发送</a-button>
        </div>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import MessageItem from './MessageItem.vue';
import type { ChatMessage } from '../types';

const props = defineProps<{
  messages: ChatMessage[];
  draft: string;
  loading: boolean;
  error: string;
}>();

const emit = defineEmits<{
  'update:draft': [value: string];
  send: [];
  clear: [];
  regenerate: [];
}>();

const messageListRef = ref<HTMLElement>();

const draftModel = computed({
  get: () => props.draft,
  set: (value: string) => emit('update:draft', value),
});

watch(
  () => [props.messages.length, props.loading],
  () => {
    scrollToBottom();
  },
);

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
    return;
  }

  event.preventDefault();
  emit('send');
}

function scrollToBottom() {
  nextTick(() => {
    const el = messageListRef.value;

    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  });
}

defineExpose({
  scrollToBottom,
});
</script>

<style scoped lang="scss">
.chat-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  box-shadow: 0 12px 34px rgb(15 23 42 / 6%);

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
    padding: 14px 16px;
    border-bottom: 1px solid var(--app-border);

    h2 {
      margin: 0;
      color: var(--app-text);
      font-size: 16px;
      font-weight: 700;
      line-height: 1.35;
    }

    p {
      margin: 4px 0 0;
      color: var(--app-text-secondary);
      font-size: 12px;
      line-height: 1.5;
    }
  }

  &__actions,
  &__input-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  &__error {
    margin: 12px 16px 0;
  }

  &__messages {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 14px;
    min-height: 0;
    padding: 18px;
    overflow-x: hidden;
    overflow-y: auto;
    background:
      linear-gradient(180deg, rgb(22 119 255 / 3%), transparent 180px),
      var(--app-surface-muted);
  }

  &__loading {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    width: fit-content;
    padding: 9px 12px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: 8px;
  }

  &__input {
    flex: 0 0 auto;
    min-height: 0;
    padding: 14px 16px 16px;
    background: linear-gradient(180deg, rgb(255 255 255 / 94%), #ffffff);
    border-top: 1px solid rgb(226 232 240 / 86%);
  }

  &__composer {
    position: relative;
    padding: 12px 12px 48px;
    background: #fbfdff;
    border: 1px solid rgb(22 119 255 / 18%);
    border-radius: 14px;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 90%),
      0 10px 28px rgb(15 23 42 / 6%);

    :deep(textarea.ant-input) {
      height: 110px;
      min-height: 110px;
      max-height: 180px;
      padding: 0;
      overflow-y: auto;
      color: var(--app-text);
      line-height: 1.6;
      background: transparent;
      border: 0;
      box-shadow: none;
      resize: none;

      &:focus {
        border: 0;
        box-shadow: none;
      }
    }
  }

  &__input-actions {
    position: absolute;
    right: 12px;
    bottom: 10px;
    left: 12px;
    justify-content: space-between;
    pointer-events: none;

    span {
      color: var(--app-text-secondary);
      font-size: 12px;
    }

    :deep(.ant-btn) {
      min-width: 74px;
      pointer-events: auto;
      border-radius: 999px;
      box-shadow: 0 8px 18px rgb(22 119 255 / 20%);
    }
  }
}
</style>
