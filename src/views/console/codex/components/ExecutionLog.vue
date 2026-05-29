<template>
  <div class="execution-log">
    <div
      v-for="log in logs"
      :key="log.id"
      class="execution-log__item"
      :class="`execution-log__item--${log.level}`"
    >
      <span>{{ log.time }}</span>
      <p>{{ log.content }}</p>
    </div>

    <a-empty v-if="!logs.length" description="暂无执行日志" :image="simpleImage" />
  </div>
</template>

<script setup lang="ts">
import { Empty } from 'ant-design-vue';

import type { ExecutionLogItem } from '../types';

defineProps<{
  logs: ExecutionLogItem[];
}>();

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
</script>

<style scoped lang="scss">
.execution-log {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__item {
    padding: 9px 10px;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-border);
    border-radius: 6px;

    span {
      color: var(--app-text-secondary);
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
      font-size: 12px;
    }

    p {
      margin: 5px 0 0;
      color: var(--app-text);
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
      font-size: 12px;
      line-height: 1.55;
      word-break: break-word;
    }

    &--success p {
      color: #16a34a;
    }

    &--warning p {
      color: #d97706;
    }

    &--error p {
      color: #dc2626;
    }
  }
}
</style>
