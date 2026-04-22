<template>
  <div class="app-breadcrumb">
    <a-breadcrumb>
      <a-breadcrumb-item>首页</a-breadcrumb-item>
      <a-breadcrumb-item v-if="parentTitle">{{ parentTitle }}</a-breadcrumb-item>
      <a-breadcrumb-item>{{ currentTitle }}</a-breadcrumb-item>
    </a-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const parentTitle = computed(() => route.meta.parentTitle as string | undefined);
const currentTitle = computed(() => (route.meta.title as string | undefined) ?? '未命名页面');
</script>

<style scoped lang="scss">
.app-breadcrumb {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 $app-content-padding;
  background: #ffffff;
  border-bottom: 1px solid $app-border;
}
</style>
