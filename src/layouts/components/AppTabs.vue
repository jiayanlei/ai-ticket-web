<template>
  <div class="app-tabs" :class="{ 'app-tabs--limited': limitTabsWidth }" :style="tabsStyle">
    <div class="app-tabs__scroll">
      <a-tabs
        :active-key="tabsStore.activePath"
        size="small"
        type="editable-card"
        hide-add
        @edit="handleEdit"
        @change="handleChange"
      >
        <a-tab-pane v-for="(tab, index) in tabsStore.tabs" :key="tab.path">
          <template #tab>
            <a-dropdown trigger="contextmenu">
              <span class="app-tabs__title">{{ tab.title }}</span>
              <template #overlay>
                <a-menu @click="handleContextMenuClick($event, tab)">
                  <a-menu-item key="refresh">
                    <template #icon><ReloadOutlined /></template>
                    {{ t('tabs.refresh') }}
                  </a-menu-item>
                  <a-menu-item key="fullscreen">
                    <template #icon><FullscreenExitOutlined v-if="isFullscreen" /><FullscreenOutlined v-else /></template>
                    {{ t('tabs.fullscreen') }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="closeCurrent">
                    <template #icon><CloseOutlined /></template>
                    {{ t('tabs.closeCurrent') }}
                  </a-menu-item>
                  <a-menu-item key="closeOther" :disabled="tabsStore.tabs.length <= 1">
                    <template #icon><CloseCircleOutlined /></template>
                    {{ t('tabs.closeOther') }}
                  </a-menu-item>
                  <a-menu-item key="closeLeft" :disabled="index === 0">
                    <template #icon><VerticalRightOutlined /></template>
                    {{ t('tabs.closeLeft') }}
                  </a-menu-item>
                  <a-menu-item key="closeRight" :disabled="index === tabsStore.tabs.length - 1">
                    <template #icon><VerticalLeftOutlined /></template>
                    {{ t('tabs.closeRight') }}
                  </a-menu-item>
                  <a-menu-item key="closeAll">
                    <template #icon><MinusCircleOutlined /></template>
                    {{ t('tabs.closeAll') }}
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </a-tab-pane>
      </a-tabs>
    </div>

    <AppTenantSelector v-if="showTabsTenantSelector" class="app-tabs__tenant" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  CloseCircleOutlined,
  CloseOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
  VerticalLeftOutlined,
  VerticalRightOutlined,
} from '@ant-design/icons-vue';
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface';

import { appSettings } from '@/config';
import AppTenantSelector from '@/layouts/components/AppTenantSelector.vue';
import { useAppStore } from '@/stores/app';
import type { AppTab } from '@/stores/tabs';
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
const limitTabsWidth = computed(() => ['top', 'mixed'].includes(appStore.layout.layoutMode));
const showTabsTenantSelector = computed(() => ['top', 'mixed'].includes(appStore.layout.menuMode));
const isFullscreen = ref(Boolean(document.fullscreenElement));

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

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState);
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

async function handleContextMenuClick(info: MenuInfo, tab: AppTab) {
  const key = String(info.key);

  if (key === 'refresh') {
    await refreshTab(tab.path);
    return;
  }

  if (key === 'fullscreen') {
    await toggleFullscreen();
    return;
  }

  if (key === 'closeCurrent') {
    await router.push(tabsStore.removeTab(tab.path) || appSettings.app.defaultHomePath);
    return;
  }

  if (key === 'closeOther') {
    await router.push(tabsStore.closeOtherTabs(tab.path));
    return;
  }

  if (key === 'closeLeft') {
    await router.push(tabsStore.closeLeftTabs(tab.path));
    return;
  }

  if (key === 'closeRight') {
    await router.push(tabsStore.closeRightTabs(tab.path));
    return;
  }

  if (key === 'closeAll') {
    tabsStore.clearTabs();
    await router.push(appSettings.app.defaultHomePath);
  }
}

async function refreshTab(path: string) {
  if (route.fullPath !== path) {
    await router.push(path);
  }

  appStore.refreshRoute(path);
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen().catch(() => undefined);
    syncFullscreenState();
    return;
  }

  await document.exitFullscreen().catch(() => undefined);
  syncFullscreenState();
}

function syncFullscreenState() {
  isFullscreen.value = Boolean(document.fullscreenElement);
}
</script>

<style scoped lang="scss">
.app-tabs {
  display: flex;
  align-items: center;
  gap: 12px;
  height: calc($app-tabs-height + 7px);
  min-width: 0;
  padding-top: 5px;
  padding-bottom: 4px;
  overflow: hidden;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);

  &__scroll {
    flex: 1 1 auto;
    width: auto;
    height: 37px;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-color: rgb(148 163 184 / 55%) rgb(226 232 240 / 68%);
    scrollbar-width: thin;
  }

  &__scroll::-webkit-scrollbar {
    height: 6px;
  }

  &__scroll::-webkit-scrollbar-track {
    background: rgb(226 232 240 / 68%);
    border-radius: 999px;
  }

  &__scroll::-webkit-scrollbar-thumb {
    background: rgb(148 163 184 / 55%);
    border-radius: 999px;
  }

  &__scroll:hover::-webkit-scrollbar-thumb {
    background: rgb(100 116 139 / 72%);
  }

  &--limited &__scroll {
    flex: 0 1 min(72vw, 1320px);
    width: min(72vw, 1320px);
  }

  &__tenant {
    flex: 0 0 auto;
    margin-left: auto;
  }

  &__title {
    display: inline-block;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
    white-space: nowrap;
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
