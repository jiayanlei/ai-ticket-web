<template>
  <div class="page-view culture-page">
    <a-card v-for="item in articles" :key="item.id" :bordered="false" class="culture-card" :loading="loading">
      <div class="culture-card__meta">
        <a-tag color="blue">{{ item.category }}</a-tag>
        <span>{{ item.publishTime }}</span>
      </div>
      <h3>{{ item.title }}</h3>
      <p>{{ item.summary }}</p>
      <div class="culture-card__footer">
        <span>{{ item.audience }}</span>
        <strong>{{ item.owner }}</strong>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import { onMounted, ref } from 'vue';

import { getCultureArticleListApi } from '@/api/system';
import type { CultureArticleItem } from '@/api/system';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const articles = ref<CultureArticleItem[]>([]);

onMounted(loadArticles);

async function loadArticles() {
  loading.value = true;

  try {
    articles.value = await getCultureArticleListApi();
  } catch (error) {
    message.error(getErrorMessage(error, '企业文化内容加载失败'));
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.culture-page {
  display: grid;
  gap: 16px;
}

.culture-card__meta,
.culture-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.culture-card__meta {
  margin-bottom: 10px;
}

.culture-card__footer {
  margin-top: 12px;
  color: var(--app-text-secondary);
}

h3 {
  margin: 0 0 10px;
}

p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}
</style>
