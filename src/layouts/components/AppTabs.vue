<template>
  <div class="app-tabs" :style="tabsStyle">
    <a-tabs
      :active-key="tabsStore.activePath"
      size="small"
      type="editable-card"
      hide-add
      @edit="handleEdit"
      @change="handleChange"
    >
      <a-tab-pane v-for="tab in tabsStore.tabs" :key="tab.path" :tab="tab.title" />
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { appSettings } from '@/config';
import { useAppStore } from '@/stores/app';
import { useTabsStore } from '@/stores/tabs';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const tabsStore = useTabsStore();
const tabsStyle = computed(() => ({
  paddingLeft: `${appStore.layout.contentPadding}px`,
  paddingRight: `${appStore.layout.contentPadding}px`,
}));

watch(
  () => route.fullPath,
  () => {
    if (route.meta.public || !route.meta.title) {
      return;
    }

    tabsStore.addTab({
      path: route.fullPath,
      title: (route.meta.title as string | undefined) ?? '未命名页面',
    });
  },
  { immediate: true },
);

function handleChange(key: string) {
  tabsStore.setActive(key);
  router.push(key);
}

function handleEdit(targetKey: string | MouseEvent | KeyboardEvent, action: 'add' | 'remove') {
  if (action === 'remove' && typeof targetKey === 'string') {
    const nextPath = tabsStore.removeTab(targetKey) || appSettings.app.defaultHomePath;
    router.push(nextPath || appSettings.app.defaultHomePath);
  }
}
</script>

<style scoped lang="scss">
.app-tabs {
  display: flex;
  align-items: center;
  height: $app-tabs-height;
  min-width: 0;
  padding-top: 5px;
  padding-bottom: 4px;
  overflow: hidden;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);

  :deep(.ant-tabs) {
    width: 100%;
    min-width: 0;
  }

  :deep(.ant-tabs-nav) {
    margin: 0;
    height: 31px;
  }

  :deep(.ant-tabs-nav-wrap) {
    min-width: 0;
  }

  :deep(.ant-tabs-nav-list) {
    min-width: 0;
  }

  :deep(.ant-tabs-tab) {
    height: 30px;
    margin: 0 6px 0 0;
    padding: 5px 12px;
    color: var(--app-text-secondary);
    background: var(--app-surface-muted);
    border-color: var(--app-border);
    border-radius: 6px 6px 0 0;
  }

  :deep(.ant-tabs-tab-active) {
    background: var(--app-surface);
    border-bottom-color: var(--app-surface);
  }

  :deep(.ant-tabs-tab-btn) {
    max-width: 160px;
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.ant-tabs-nav-operations) {
    height: 30px;
  }

  :deep(.ant-tabs-nav-more) {
    width: 30px;
    height: 30px;
    border-radius: 6px;
  }
}
</style>
