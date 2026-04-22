<template>
  <div class="app-top-menu">
    <AppMenu mode="horizontal" theme="light" />
  </div>
</template>

<script setup lang="ts">
import AppMenu from '@/layouts/components/AppMenu.vue';
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
