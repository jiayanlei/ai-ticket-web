<template>
  <div class="not-found">
    <a-result status="404" title="页面不存在" sub-title="当前页面不存在或已被移除，请返回首页继续操作">
      <template #extra>
        <router-link :to="HOME_PATH">
          <a-button type="primary">返回首页</a-button>
        </router-link>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { HOME_PATH } from '@/router/constants';

defineOptions({
  name: 'NotFoundPage',
});
</script>

<style scoped lang="scss">
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 48px 16px;
  background: transparent;
}
</style>
