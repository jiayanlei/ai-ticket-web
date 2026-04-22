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
    tabsStore.addTab({
      path: route.fullPath,
      title: (route.meta.title as string | undefined) ?? '未命名页面',
    });
  },
  { immediate: true },
);

function handleChange(key: string) {
  router.push(key);
}

function handleEdit(targetKey: string | MouseEvent | KeyboardEvent, action: 'add' | 'remove') {
  if (action === 'remove' && typeof targetKey === 'string') {
    tabsStore.removeTab(targetKey);
    if (tabsStore.activePath) {
      router.push(tabsStore.activePath);
    }
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
  background: #ffffff;
  border-bottom: 1px solid $app-border;

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
    color: #4b5563;
    background: #f8fafc;
    border-color: #e5e7eb;
    border-radius: 6px 6px 0 0;
  }

  :deep(.ant-tabs-tab-active) {
    background: #ffffff;
    border-bottom-color: #ffffff;
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
