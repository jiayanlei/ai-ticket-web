<template>
  <div class="exception-page">
    <a-result status="500" title="500" sub-title="服务暂时不可用，请稍后重试">
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
  name: 'ServerErrorPage',
});
</script>

<style scoped lang="scss">
.exception-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: $app-bg;
}
</style>
