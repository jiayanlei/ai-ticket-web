<template>
  <div class="page-view permission-page">
    <div class="stat-grid">
      <a-card v-for="item in stats" :key="item.title" :bordered="false" :loading="loading">
        <a-statistic :title="item.title" :value="item.value" />
      </a-card>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="15">
        <a-card title="按钮权限清单" :bordered="false" :loading="loading">
          <a-table :columns="columns" :data-source="permissions" row-key="id" :pagination="{ pageSize: 10 }" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="9">
        <a-card title="最近权限变更" :bordered="false" :loading="loading">
          <a-timeline>
            <a-timeline-item v-for="item in overview?.recentChanges || []" :key="item">
              {{ item }}
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { computed, ref } from 'vue';

import { getMenuListApi } from '@/api/menu';
import type { MenuItem } from '@/api/menu';
import { getPermissionOverviewApi } from '@/api/system';
import type { PermissionOverview } from '@/api/system';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const overview = ref<PermissionOverview>();
const permissions = ref<MenuItem[]>([]);

const stats = computed(() => [
  { title: '用户数', value: overview.value?.totalUsers ?? 0 },
  { title: '启用用户', value: overview.value?.enabledUsers ?? 0 },
  { title: '角色数', value: overview.value?.totalRoles ?? 0 },
  { title: '按钮权限', value: overview.value?.totalPermissions ?? 0 },
]);

const columns: TableColumnsType<MenuItem> = [
  { title: '权限名称', dataIndex: 'menuName', key: 'menuName', width: 180 },
  { title: '权限标识', dataIndex: 'perms', key: 'perms' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
];

void loadPermissionData();

async function loadPermissionData() {
  loading.value = true;

  try {
    const [overviewData, menuData] = await Promise.all([
      getPermissionOverviewApi(),
      getMenuListApi({ menuType: 'BUTTON' }),
    ]);
    overview.value = overviewData;
    permissions.value = menuData;
  } catch (error) {
    message.error(getErrorMessage(error, '用户权限数据加载失败'));
  } finally {
    loading.value = false;
  }
}
</script>
