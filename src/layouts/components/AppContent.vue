<template>
  <a-layout-content class="app-content" :style="contentStyle">
    <router-view v-slot="{ Component, route }">
      <keep-alive :key="appStore.keepAliveVersion">
        <component :is="Component" v-if="route.meta.keepAlive" :key="getRouteComponentKey(route.fullPath)" />
      </keep-alive>
      <component :is="Component" v-if="!route.meta.keepAlive" :key="getRouteComponentKey(route.fullPath)" />
    </router-view>
  </a-layout-content>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const contentStyle = computed(() => {
  return {
    padding: `${appStore.layout.contentPadding}px`,
  };
});

function getRouteComponentKey(path: string) {
  return `${path}:${appStore.routeRefreshKeys[path] ?? 0}`;
}
</script>

<style scoped lang="scss">
.app-content {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: var(--app-bg);

  &:has(> .codex-workbench),
  &:has(> .ai-ticket-page) {
    overflow: hidden;
  }
}
</style>
