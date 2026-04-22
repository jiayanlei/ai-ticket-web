<template>
  <a-drawer :open="open" title="布局设置" width="320" @close="emit('update:open', false)">
    <div class="layout-settings">
      <div class="layout-settings__group">
        <div class="layout-settings__label">布局模式</div>
        <a-segmented v-model:value="layoutMode" :options="layoutModeOptions" block />
      </div>

      <a-divider />

      <a-space direction="vertical" class="layout-settings__switches">
        <a-switch v-model:checked="appStore.layout.fixedHeader" checked-children="固定" un-checked-children="滚动" />
        <span>固定顶部 Header</span>
      </a-space>

      <a-space direction="vertical" class="layout-settings__switches">
        <a-switch v-model:checked="appStore.layout.showBreadcrumb" checked-children="显示" un-checked-children="隐藏" />
        <span>面包屑区域</span>
      </a-space>

      <a-space direction="vertical" class="layout-settings__switches">
        <a-switch v-model:checked="appStore.layout.showTabs" checked-children="显示" un-checked-children="隐藏" />
        <span>多标签页区域</span>
      </a-space>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';
import type { LayoutMode } from '@/types/layout';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const appStore = useAppStore();

const layoutModeOptions = [
  { label: '左侧', value: 'side' },
  { label: '顶部', value: 'top' },
  { label: '混合', value: 'mixed' },
];

const layoutMode = computed({
  get: () => appStore.layout.mode,
  set: (mode: LayoutMode) => {
    appStore.setLayoutMode(mode);
  },
});
</script>

<style scoped lang="scss">
.layout-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__label {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  &__switches {
    width: 100%;

    :deep(.ant-space-item:last-child) {
      color: #4b5563;
    }
  }
}
</style>
