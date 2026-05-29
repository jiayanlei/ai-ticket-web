<template>
  <a-card title="最近会话" :bordered="false" class="session-panel workbench-card">
    <div class="session-panel__list">
      <button
        v-for="session in sessions"
        :key="session.id"
        type="button"
        class="session-panel__item"
        :class="{ 'session-panel__item--active': session.id === activeSessionId }"
        @click="$emit('select', session.id)"
      >
        <span>{{ session.title }}</span>
        <small>{{ taskTypeTextMap[session.taskType] }}</small>
      </button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { taskTypeTextMap } from '../mock';
import type { RecentSession } from '../types';

defineProps<{
  sessions: RecentSession[];
  activeSessionId: string;
}>();

defineEmits<{
  select: [sessionId: string];
}>();
</script>

<style scoped lang="scss">
.session-panel {
  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
    min-height: 48px;
    padding: 8px 10px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;

    &:hover,
    &--active {
      background: var(--app-surface-muted);
      border-color: var(--app-border);
    }

    &--active span {
      color: #1677ff;
    }

    span {
      overflow: hidden;
      color: var(--app-text);
      font-size: 13px;
      font-weight: 600;
      line-height: 1.45;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    small {
      color: var(--app-text-secondary);
      font-size: 12px;
      line-height: 1.4;
    }
  }
}
</style>
