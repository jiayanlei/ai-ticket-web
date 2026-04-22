<template>
  <a-layout-content class="app-content" :style="{ height: contentHeight }">
    <router-view v-slot="{ Component, route }">
      <keep-alive>
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

const headerHeight = 56;
const tabsHeight = 40;
const breadcrumbHeight = 44;

const contentHeight = computed(() => {
  const occupiedHeight =
    headerHeight +
    (appStore.layout.showTabs ? tabsHeight : 0) +
    (appStore.layout.showBreadcrumb ? breadcrumbHeight : 0);

  return `calc(100vh - ${occupiedHeight}px)`;
});
</script>

<style scoped lang="scss">
.app-content {
  min-width: 0;
  min-height: 0;
  padding: $app-content-padding;
  overflow: auto;
  background: $app-bg;
}
</style>
