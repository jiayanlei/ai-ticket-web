<template>
  <a-card title="项目状态" :bordered="false" class="project-status-card workbench-card">
    <a-skeleton v-if="loading" active :paragraph="{ rows: 4 }" />

    <template v-else>
      <div class="project-status-card__grid">
        <div class="project-status-card__row">
          <span>前端</span>
          <strong>{{ status.frontendProject }}</strong>
        </div>
        <div class="project-status-card__row">
          <span>后端</span>
          <strong>{{ status.backendProject }}</strong>
        </div>
        <div class="project-status-card__row">
          <span>分支</span>
          <a-tag color="processing">{{ status.branch }}</a-tag>
        </div>
        <div class="project-status-card__row">
          <span>环境</span>
          <a-tag color="blue">{{ status.environment }}</a-tag>
        </div>
        <div class="project-status-card__row">
          <span>Git</span>
          <a-tag :color="status.hasUncommittedChanges ? 'warning' : 'success'">
            {{ status.hasUncommittedChanges ? '有未提交变更' : '干净' }}
          </a-tag>
        </div>
      </div>
    </template>
  </a-card>
</template>

<script setup lang="ts">
import type { ProjectStatus } from '../types';

defineProps<{
  status: ProjectStatus;
  source: 'api' | 'mock';
  loading: boolean;
}>();
</script>

<style scoped lang="scss">
.project-status-card {
  flex: none;

  &__grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__row {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 8px;
    align-items: center;
    min-height: 26px;

    > span {
      color: var(--app-text-secondary);
      font-size: 12px;
      font-weight: 600;
    }

    strong {
      overflow: hidden;
      color: var(--app-text);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.45;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :deep(.ant-tag) {
      width: fit-content;
      max-width: 100%;
      overflow: hidden;
      font-size: 12px;
      line-height: 20px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
