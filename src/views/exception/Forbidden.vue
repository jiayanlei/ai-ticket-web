<template>
  <div class="exception-page">
    <a-result status="403" title="403" sub-title="当前账号没有访问该页面的权限">
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
  name: 'ForbiddenPage',
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
