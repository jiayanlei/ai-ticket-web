<template>
  <a-layout-content class="app-content" :style="contentStyle">
    <router-view v-slot="{ Component, route }">
      <keep-alive :key="appStore.keepAliveVersion">
        <component :is="Component" v-if="route.meta.keepAlive" :key="route.fullPath" />
      </keep-alive>
      <component :is="Component" v-if="!route.meta.keepAlive" :key="route.fullPath" />
    </router-view>
  </a-layout-content>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const contentStyle = computed(() => {
  const occupiedHeight =
    56 + (appStore.layout.showTabs ? 40 : 0) + (appStore.layout.showBreadcrumb ? 44 : 0);

  return {
    height: `calc(100vh - ${occupiedHeight}px)`,
    padding: `${appStore.layout.contentPadding}px`,
  };
});
</script>

<style scoped lang="scss">
.app-content {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: var(--app-bg);
}
</style>
