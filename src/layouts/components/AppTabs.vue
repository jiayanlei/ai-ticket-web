<template>
  <div class="app-tabs" :style="tabsStyle">
    <div class="app-tabs__scroll">
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

    <AppTenantSelector v-if="showTabsTenantSelector" class="app-tabs__tenant" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { appSettings } from '@/config';
import AppTenantSelector from '@/layouts/components/AppTenantSelector.vue';
import { useAppStore } from '@/stores/app';
import { useTabsStore } from '@/stores/tabs';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const tabsStore = useTabsStore();
const { locale, te, t } = useI18n();
const tabsStyle = computed(() => ({
  paddingLeft: `${appStore.layout.contentPadding}px`,
  paddingRight: `${appStore.layout.contentPadding}px`,
}));
const showTabsTenantSelector = computed(() => ['top', 'mixed'].includes(appStore.layout.menuMode));

watch(
  () => route.fullPath,
  () => {
    if (route.path === '/dashboard/screen' && route.query.fullscreen === '1') {
      return;
    }

    if (route.meta.public || route.meta.hidden || (!route.meta.title && !route.meta.i18nKey)) {
      return;
    }

    tabsStore.addTab({
      path: route.fullPath,
      title: getRouteTitle(),
    });
  },
  { immediate: true },
);

watch(locale, () => {
  tabsStore.tabs.forEach((tab) => {
    const matchedRoute = router.resolve(tab.path);
    const i18nKey = matchedRoute.meta.i18nKey as string | undefined;
    if (i18nKey && te(i18nKey)) {
      tab.title = t(i18nKey);
    }
  });
});

function getRouteTitle() {
  const i18nKey = route.meta.i18nKey as string | undefined;
  if (i18nKey && te(i18nKey)) {
    return t(i18nKey);
  }

  return (route.meta.title as string | undefined) ?? '未命名页面';
}

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
  gap: 12px;
  height: $app-tabs-height;
  min-width: 0;
  padding-top: 5px;
  padding-bottom: 4px;
  overflow: hidden;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);

  &__scroll {
    flex: 0 1 min(72vw, 1320px);
    width: min(72vw, 1320px);
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  &__tenant {
    flex: 0 0 auto;
    margin-left: auto;
  }

  &__scroll :deep(.ant-tabs) {
    min-width: max-content;
  }

  &__scroll :deep(.ant-tabs-nav) {
    height: 31px;
    margin: 0;
  }

  &__scroll :deep(.ant-tabs-nav-wrap) {
    min-width: 0;
  }

  &__scroll :deep(.ant-tabs-nav-list) {
    min-width: 0;
  }

  &__scroll :deep(.ant-tabs-tab) {
    height: 30px;
    margin: 0 6px 0 0;
    padding: 5px 12px;
    color: var(--app-text-secondary);
    background: var(--app-surface-muted);
    border-color: var(--app-border);
    border-radius: 6px 6px 0 0;
  }

  &__scroll :deep(.ant-tabs-tab-active) {
    background: var(--app-surface);
    border-bottom-color: var(--app-surface);
  }

  &__scroll :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
    color: var(--app-text);
  }

  &__scroll :deep(.ant-tabs-tab-btn) {
    max-width: 160px;
    overflow: hidden;
    color: inherit;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__scroll :deep(.ant-tabs-tab-remove) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-left: 8px;
    color: var(--app-text-secondary) !important;
    border-radius: 4px;
  }

  &__scroll :deep(.ant-tabs-tab-remove:hover) {
    color: var(--app-text) !important;
    background: var(--app-surface-muted);
  }

  &__scroll :deep(.ant-tabs-nav-operations) {
    height: 30px;
  }

  &__scroll :deep(.ant-tabs-nav-more) {
    width: 30px;
    height: 30px;
    color: var(--app-text-secondary);
    border-radius: 6px;
  }

  &__scroll :deep(.ant-tabs-nav-more:hover) {
    color: var(--app-text);
    background: var(--app-surface-muted);
  }
}
</style>
