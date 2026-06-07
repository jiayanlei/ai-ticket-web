<template>
  <div class="page-view">
    <a-card :bordered="false" class="page-placeholder">
      <div class="page-placeholder__header">
        <h2 class="page-placeholder__title">{{ title }}</h2>
        <p class="page-placeholder__description">{{ description }}</p>
      </div>

      <a-empty :description="emptyText" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    emptyText?: string;
  }>(),
  {
    description: '该模块正在建设中，后续可继续补充业务能力。',
    emptyText: '功能建设中',
  },
);
</script>

<style scoped lang="scss">
.page-placeholder {
  min-height: 420px;
}

.page-placeholder__header {
  margin-bottom: 24px;
}

.page-placeholder__title {
  margin: 0 0 8px;
  color: var(--app-text);
  font-size: 22px;
  font-weight: 600;
}

.page-placeholder__description {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 14px;
  line-height: 1.7;
}
</style>
