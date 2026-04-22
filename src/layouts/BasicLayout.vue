<template>
  <a-layout class="basic-layout" :class="layoutClass">
    <AppSider v-if="showSideMenu" />

    <a-layout class="basic-layout__main">
      <AppHeader />
      <AppBreadcrumb v-if="appStore.layout.showBreadcrumb" />
      <AppTabs v-if="appStore.layout.showTabs" />
      <AppContent />
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import AppBreadcrumb from '@/layouts/components/AppBreadcrumb.vue';
import AppContent from '@/layouts/components/AppContent.vue';
import AppHeader from '@/layouts/components/AppHeader.vue';
import AppSider from '@/layouts/components/AppSider.vue';
import AppTabs from '@/layouts/components/AppTabs.vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const showSideMenu = computed(() => ['side', 'mixed'].includes(appStore.layout.mode));
const layoutClass = computed(() => `basic-layout--${appStore.layout.mode}`);
</script>

<style scoped lang="scss">
.basic-layout {
  min-height: 100vh;
  background: $app-bg;

  &__main {
    min-width: 0;
    background: $app-bg;
  }
}
</style>
