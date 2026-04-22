<template>
  <div class="not-found">
    <a-result status="404" title="404" sub-title="当前页面不存在或已被移除">
      <template #extra>
        <router-link to="/dashboard/workbench">
          <a-button type="primary">返回首页</a-button>
        </router-link>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'NotFoundPage',
});
</script>

<style scoped lang="scss">
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: $app-bg;
}
</style>
