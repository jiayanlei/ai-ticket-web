<template>
  <aside class="action-plan-panel workbench-card">
    <header class="action-plan-panel__header">
      <div>
        <h2>执行计划</h2>
        <p>只展示方案和确认动作，第一阶段不执行危险操作。</p>
      </div>
      <a-tag :color="riskMeta.color">{{ riskMeta.text }}</a-tag>
    </header>

    <div class="action-plan-panel__body">
      <section class="action-plan-panel__section">
        <span class="action-plan-panel__label">当前任务类型</span>
        <strong>{{ plan.taskType }}</strong>
      </section>

      <section class="action-plan-panel__section">
        <span class="action-plan-panel__label">影响范围</span>
        <div class="action-plan-panel__tags">
          <a-tag v-for="item in plan.scope" :key="item">{{ item }}</a-tag>
        </div>
      </section>

      <section class="action-plan-panel__section">
        <span class="action-plan-panel__label">涉及文件</span>
        <div class="action-plan-panel__files">
          <div
            v-for="file in visibleFiles"
            :key="`${file.operation}-${file.path}`"
            class="action-plan-panel__file"
            :class="{ 'action-plan-panel__file--delete': file.operation === 'DELETE' }"
          >
            <code>{{ file.path }}</code>
            <a-tag :color="file.operation === 'DELETE' ? 'error' : operationColorMap[file.operation]">
              {{ file.operation }}
            </a-tag>
          </div>
        </div>
      </section>

      <section class="action-plan-panel__section">
        <span class="action-plan-panel__label">执行步骤</span>
        <a-steps direction="vertical" size="small" :current="0" class="action-plan-panel__steps">
          <a-step v-for="step in plan.steps" :key="step" :title="step" />
        </a-steps>
      </section>

      <section class="action-plan-panel__section action-plan-panel__confirm">
        <span class="action-plan-panel__label">是否需要确认</span>
        <a-tag :color="plan.needConfirm ? 'warning' : 'success'">
          {{ plan.needConfirm ? '需要人工确认' : '无需确认' }}
        </a-tag>
      </section>

      <section v-if="showLogs" class="action-plan-panel__section">
        <span class="action-plan-panel__label">执行日志</span>
        <ExecutionLog :logs="logs" />
      </section>
    </div>

    <footer class="action-plan-panel__actions">
      <a-button block @click="$emit('generate')">生成方案</a-button>
      <a-button block @click="toggleFiles">{{ filesExpanded ? '收起涉及文件' : '查看涉及文件' }}</a-button>
      <a-button block @click="showLogs = !showLogs">{{ showLogs ? '收起执行日志' : '查看执行日志' }}</a-button>

      <a-popconfirm
        v-if="plan.needConfirm && plan.riskLevel === 'HIGH'"
        title="当前任务为高风险操作。第一阶段只会记录确认，不会真正执行发布、删除或数据库变更。确认继续？"
        ok-text="确认"
        cancel-text="取消"
        @confirm="$emit('confirm')"
      >
        <a-button block type="primary" danger :loading="confirming">确认执行</a-button>
      </a-popconfirm>

      <a-button
        v-else
        block
        type="primary"
        :danger="plan.riskLevel === 'HIGH'"
        :disabled="!plan.needConfirm"
        :loading="confirming"
        @click="$emit('confirm')"
      >
        确认执行
      </a-button>

      <a-button block danger @click="$emit('cancel')">取消任务</a-button>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import ExecutionLog from './ExecutionLog.vue';
import type { AiAgentFileOperation } from '@/api/aiAgent';
import type { ActionPlan, ExecutionLogItem } from '../types';

const props = defineProps<{
  plan: ActionPlan;
  logs: ExecutionLogItem[];
  confirming: boolean;
}>();

defineEmits<{
  generate: [];
  confirm: [];
  cancel: [];
}>();

const filesExpanded = ref(false);
const showLogs = ref(false);

const riskTextMap = {
  LOW: '低风险',
  MEDIUM: '中风险',
  HIGH: '高风险',
} as const;

const riskColorMap = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
} as const;

const operationColorMap: Record<AiAgentFileOperation, string> = {
  CHECK: 'processing',
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'error',
};

const riskMeta = computed(() => ({
  text: riskTextMap[props.plan.riskLevel],
  color: riskColorMap[props.plan.riskLevel],
}));

const visibleFiles = computed(() => (filesExpanded.value ? props.plan.affectedFiles : props.plan.affectedFiles.slice(0, 3)));

function toggleFiles() {
  filesExpanded.value = !filesExpanded.value;
}
</script>

<style scoped lang="scss">
.action-plan-panel {
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
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
    padding: 14px 14px 12px;
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

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    padding: 14px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    background: rgb(248 251 255 / 78%);
    border: 1px solid rgb(226 232 240 / 72%);
    border-radius: 12px;

    strong {
      color: var(--app-text);
      font-size: 14px;
    }
  }

  &__label {
    color: var(--app-text-secondary);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__files {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__file {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    padding: 9px 10px;
    background: #ffffff;
    border: 1px solid rgb(226 232 240 / 88%);
    border-radius: 9px;

    code {
      overflow: hidden;
      color: var(--app-text);
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &--delete {
      background: rgb(255 77 79 / 10%);
      border-color: rgb(255 77 79 / 40%);

      code {
        color: #cf1322;
      }
    }
  }

  &__steps {
    :deep(.ant-steps-item-title) {
      color: var(--app-text);
      font-size: 12px;
      line-height: 1.5;
    }

    :deep(.ant-steps-item-tail::after) {
      background: var(--app-border);
    }
  }

  &__confirm {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, rgb(82 196 26 / 8%), rgb(255 255 255 / 92%));
  }

  &__actions {
    display: grid;
    flex: 0 0 auto;
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px 14px 14px;
    background: rgb(255 255 255 / 94%);
    border-top: 1px solid rgb(226 232 240 / 86%);

    :deep(.ant-btn) {
      border-radius: 9px;
    }
  }
}
</style>
