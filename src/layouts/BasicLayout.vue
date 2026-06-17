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

const showSideMenu = computed(() => ['side', 'mixed'].includes(appStore.layout.menuMode));
const layoutClass = computed(() => `basic-layout--${appStore.layout.layoutMode}`);
</script>

<style scoped lang="scss">
.basic-layout {
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  background: var(--app-bg);

  &__main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--app-bg);
  }
}

:global(.basic-layout:has(.ai-ticket-page)) {
  overflow: hidden;
}
</style>
