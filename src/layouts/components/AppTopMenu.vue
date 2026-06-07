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
}
</style>
