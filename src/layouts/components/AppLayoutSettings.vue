<template>
  <a-drawer :open="open" title="布局设置" width="320" @close="emit('update:open', false)">
    <div class="layout-settings">
      <div class="layout-settings__group">
        <div class="layout-settings__label">布局模式</div>
        <a-segmented v-model:value="layoutMode" :options="layoutModeOptions" block />
      </div>

      <div class="layout-settings__group">
        <div class="layout-settings__label">菜单模式</div>
        <a-segmented v-model:value="menuMode" :options="menuModeOptions" block />
      </div>

      <a-divider />

      <a-space direction="vertical" class="layout-settings__switches">
        <a-switch v-model:checked="appStore.layout.showLogo" checked-children="显示" un-checked-children="隐藏" />
        <span>Logo</span>
      </a-space>

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

      <div class="layout-settings__group">
        <div class="layout-settings__label">内容区边距</div>
        <a-input-number v-model:value="appStore.layout.contentPadding" :min="0" :max="32" addon-after="px" />
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';
import type { LayoutMode, MenuMode } from '@/types/layout';

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
const menuModeOptions = layoutModeOptions;

const layoutMode = computed({
  get: () => appStore.layout.layoutMode,
  set: (mode: LayoutMode) => {
    appStore.setLayoutMode(mode);
  },
});

const menuMode = computed({
  get: () => appStore.layout.menuMode,
  set: (mode: MenuMode) => {
    appStore.setMenuMode(mode);
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
