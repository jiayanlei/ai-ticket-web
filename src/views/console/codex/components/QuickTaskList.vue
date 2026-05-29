<template>
  <a-card title="快捷任务" :bordered="false" class="quick-task-list workbench-card">
    <div class="quick-task-list__items">
      <button
        v-for="task in tasks"
        :key="task.key"
        type="button"
        class="quick-task-list__item"
        :class="{ 'quick-task-list__item--active': task.taskType === activeTaskType }"
        @click="$emit('select', task)"
      >
        <span class="quick-task-list__icon">{{ task.icon }}</span>
        <span class="quick-task-list__content">
          <strong>{{ task.title }}</strong>
          <small>{{ task.description }}</small>
        </span>
      </button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import type { AiAgentTaskType } from '@/api/aiAgent';
import type { QuickTask } from '../types';

defineProps<{
  tasks: QuickTask[];
  activeTaskType: AiAgentTaskType;
}>();

defineEmits<{
  select: [task: QuickTask];
}>();
</script>

<style scoped lang="scss">
.quick-task-list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  :deep(.ant-card-head) {
    flex-shrink: 0;
  }

  :deep(.ant-card-body) {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  &__items {
    display: grid;
    grid-template-columns: 1fr;
    gap: 9px;
    height: 100%;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }

  &__item {
    position: relative;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    width: 100%;
    min-height: 66px;
    padding: 10px;
    color: var(--app-text);
    text-align: left;
    cursor: pointer;
    background:
      linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(248 251 255 / 94%)),
      var(--app-surface);
    border: 1px solid rgb(226 232 240 / 92%);
    border-radius: 12px;
    box-shadow: 0 6px 18px rgb(15 23 42 / 4%);
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease,
      background 0.18s ease;

    &::after {
      position: absolute;
      inset: 10px auto 10px 0;
      width: 3px;
      content: '';
      background: transparent;
      border-radius: 0 999px 999px 0;
      transition: background 0.18s ease;
    }

    &:hover {
      background: linear-gradient(135deg, #ffffff, #f4f8ff);
      border-color: rgb(22 119 255 / 42%);
      box-shadow: 0 10px 24px rgb(15 23 42 / 8%);
      transform: translateY(-1px);
    }

    &--active {
      background: linear-gradient(135deg, rgb(22 119 255 / 12%), rgb(255 255 255 / 96%));
      border-color: rgb(22 119 255 / 58%);
      box-shadow: 0 12px 26px rgb(22 119 255 / 12%);

      &::after {
        background: #1677ff;
      }

      .quick-task-list__icon {
        color: #0958d9;
        background: rgb(22 119 255 / 14%);
        border-color: rgb(22 119 255 / 24%);
      }

      strong {
        color: #0958d9;
      }
    }
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    font-size: 16px;
    background: #f4f7fb;
    border: 1px solid rgb(226 232 240 / 88%);
    border-radius: 10px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    min-width: 0;

    strong {
      overflow: hidden;
      color: var(--app-text);
      font-size: 13px;
      font-weight: 700;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    small {
      display: block;
      overflow: hidden;
      margin-top: 4px;
      color: var(--app-text-secondary);
      font-size: 12px;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
