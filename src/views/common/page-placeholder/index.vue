<template>
  <PagePlaceholder :title="title" :description="description" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import PagePlaceholder from '@/components/PagePlaceholder.vue';

const route = useRoute();

const title = computed(() => (route.meta.title as string | undefined) ?? '未命名页面');
const description = computed(
  () =>
    (route.meta.placeholderDescription as string | undefined) ??
    '该模块正在建设中，后续可继续补充业务能力。',
);
</script>
