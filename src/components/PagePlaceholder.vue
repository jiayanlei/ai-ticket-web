<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-description">{{ description }}</p>
      </div>
      <slot name="actions" />
    </div>

    <a-card :bordered="false">
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
    description: '该页面已完成路由和基础容器搭建，后续可继续补充业务组件。',
    emptyText: '功能建设中',
  },
);
</script>
