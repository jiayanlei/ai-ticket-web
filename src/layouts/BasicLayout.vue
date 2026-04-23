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
  min-height: 100vh;
  background: var(--app-bg);

  &__main {
    min-width: 0;
    background: var(--app-bg);
  }
}
</style>
