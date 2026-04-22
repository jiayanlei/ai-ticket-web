<template>
  <a-layout-sider
    class="app-sider"
    :collapsed="appStore.layout.sidebarCollapsed"
    :collapsed-width="appStore.layout.sidebarCollapsedWidth"
    :theme="appStore.layout.theme"
    :trigger="null"
    :width="appStore.layout.sidebarWidth"
  >
    <div v-if="appStore.layout.showLogo || !appStore.layout.sidebarCollapsed" class="app-sider__brand">
      <span v-if="appStore.layout.showLogo" class="app-sider__logo">AI</span>
      <span v-if="!appStore.layout.sidebarCollapsed" class="app-sider__title">{{ envConfig.appTitle }}</span>
    </div>

    <AppMenu :theme="appStore.layout.theme" />
  </a-layout-sider>
</template>

<script setup lang="ts">
import { envConfig } from '@/config';
import AppMenu from '@/layouts/components/AppMenu.vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
</script>

<style scoped lang="scss">
.app-sider {
  min-height: 100vh;
  overflow: auto;
  background: #ffffff;
  border-right: 1px solid $app-border;

  :deep(.ant-layout-sider-children) {
    display: flex;
    flex-direction: column;
  }

  :deep(.ant-menu) {
    flex: 1;
    min-width: 0;
    border-inline-end: 0;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    height: $app-header-height;
    padding: 0 16px;
    border-bottom: 1px solid $app-border;
  }

  &__logo {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    background: #1677ff;
    border-radius: 6px;
  }

  &__title {
    overflow: hidden;
    color: #111827;
    font-size: 16px;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
