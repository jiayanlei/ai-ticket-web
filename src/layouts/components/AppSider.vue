<template>
  <a-layout-sider
    class="app-sider"
    :collapsed="appStore.layout.sidebarCollapsed"
    :collapsed-width="appStore.layout.sidebarCollapsedWidth"
    :theme="appStore.layout.theme"
    :trigger="null"
    :width="appStore.layout.sidebarWidth"
  >
    <div v-if="showSiderBrand" class="app-sider__brand">
      <span v-if="appStore.layout.showLogo" class="app-sider__logo">AI</span>
      <span v-if="!appStore.layout.sidebarCollapsed" class="app-sider__copy">
        <strong class="app-sider__title">{{ envConfig.appTitle }}</strong>
        <small>Enterprise AI Customer Service OS</small>
      </span>
    </div>

    <div class="app-sider__menu-wrap">
      <AppMenu scope="side" :theme="appStore.layout.theme" />
    </div>
  </a-layout-sider>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { envConfig } from '@/config';
import AppMenu from '@/layouts/components/AppMenu.vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const showSiderBrand = computed(
  () => ['side', 'mixed'].includes(appStore.layout.menuMode) && (appStore.layout.showLogo || !appStore.layout.sidebarCollapsed),
);
const menuWrapOffset = computed(() => (showSiderBrand.value ? `${56}px` : '0px'));
</script>

<style scoped lang="scss">
.app-sider {
  min-height: 100vh;
  background: var(--app-sider-bg);
  border-right: 1px solid var(--app-border);
  box-shadow: 20px 0 44px rgba(0, 0, 0, 0.24);

  :deep(.ant-layout-sider-children) {
    display: flex;
    flex-direction: column;
  }

  :deep(.ant-menu) {
    flex: 1;
    min-width: 0;
    padding: 10px 10px 18px;
    border-inline-end: 0;
    background: transparent;
  }

  :deep(.ant-menu-item),
  :deep(.ant-menu-submenu-title) {
    height: 40px;
    margin: 3px 0;
    color: var(--app-text-secondary);
    border-radius: 8px;
  }

  :deep(.ant-menu-item-selected) {
    color: var(--app-text);
    background: var(--app-menu-active-bg);
    box-shadow: inset 0 0 0 1px rgba(79, 123, 255, 0.26);
  }

  :deep(.ant-menu-submenu-selected > .ant-menu-submenu-title) {
    color: var(--app-text);
  }

  :deep(.ant-menu-item .ant-menu-item-icon),
  :deep(.ant-menu-submenu-title .anticon),
  :deep(.ant-menu-submenu-arrow) {
    color: currentColor !important;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    height: $app-header-height;
    padding: 0 18px;
    border-bottom: 1px solid var(--app-border);
  }

  &__logo {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--app-primary), var(--app-accent));
    border-radius: 10px;
    box-shadow: 0 14px 30px rgba(79, 123, 255, 0.32);
  }

  &__copy {
    display: flex;
    flex-direction: column;
    min-width: 0;

    small {
      overflow: hidden;
      color: var(--app-text-muted);
      font-size: 10px;
      letter-spacing: 0;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__title {
    overflow: hidden;
    color: var(--app-text);
    font-size: 17px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__menu-wrap {
    height: calc(100vh - #{v-bind(menuWrapOffset)});
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>
