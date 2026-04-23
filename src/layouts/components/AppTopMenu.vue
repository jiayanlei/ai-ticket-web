<template>
  <div class="app-top-menu">
    <AppMenu mode="horizontal" :theme="appStore.layout.theme" />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app';
import AppMenu from '@/layouts/components/AppMenu.vue';

const appStore = useAppStore();
</script>

<style scoped lang="scss">
.app-top-menu {
  min-width: 0;

  :deep(.ant-menu) {
    min-width: 0;
    border-bottom: 0;
  }
}
</style>
