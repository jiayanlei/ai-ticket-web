<template>
  <div class="app-top-menu">
    <AppMenu mode="horizontal" scope="top" :theme="appStore.layout.theme" />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app';
import AppMenu from '@/layouts/components/AppMenu.vue';

const appStore = useAppStore();
</script>

<style scoped lang="scss">
.app-top-menu {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.ant-menu) {
    display: flex;
    flex-wrap: nowrap;
    width: max-content;
    min-width: 100%;
    border-bottom: 0;
  }

  :deep(.ant-menu-overflow) {
    display: flex;
    flex-wrap: nowrap;
    width: max-content;
    min-width: 100%;
  }

  :deep(.ant-menu-horizontal) {
    flex: 0 0 auto;
    line-height: $app-header-height;
  }

  :deep(.ant-menu-horizontal > .ant-menu-item),
  :deep(.ant-menu-horizontal > .ant-menu-submenu) {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    height: $app-header-height;
    padding-inline: 14px;
    white-space: nowrap;
  }

  :deep(.ant-menu-horizontal > .ant-menu-item .ant-menu-title-content),
  :deep(.ant-menu-horizontal > .ant-menu-submenu .ant-menu-submenu-title) {
    display: inline-flex;
    align-items: center;
    min-width: max-content;
    white-space: nowrap;
  }

  :deep(.ant-menu-horizontal .ant-menu-item-icon),
  :deep(.ant-menu-horizontal .ant-menu-submenu-title .anticon) {
    flex: 0 0 auto;
    margin-inline-end: 6px;
    font-size: 16px;
  }

  :deep(.ant-menu-horizontal .ant-menu-title-content),
  :deep(.ant-menu-horizontal .app-menu-node__title),
  :deep(.ant-menu-horizontal .app-menu-node__title-text) {
    display: inline-flex;
    align-items: center;
    min-width: max-content;
    overflow: visible;
    text-overflow: clip;
    white-space: nowrap;
  }
}
</style>
