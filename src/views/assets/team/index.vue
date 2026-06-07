<template>
  <div class="page-view">
    <a-card :bordered="false">
      <a-table :columns="columns" :data-source="assets" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'type'">
            <a-tag color="blue">{{ getTypeText(record.type) }}</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { onMounted, ref } from 'vue';

import { getTeamAssetListApi } from '@/api/system';
import type { TeamAssetItem } from '@/api/system';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const assets = ref<TeamAssetItem[]>([]);

const typeTextMap: Record<TeamAssetItem['type'], string> = {
  template: '模板',
  manual: '手册',
  prompt: 'Prompt',
  script: '脚本',
};

const statusTextMap: Record<TeamAssetItem['status'], string> = {
  online: '上线',
  draft: '暂存',
  archived: '归档',
};

const statusColorMap: Record<TeamAssetItem['status'], string> = {
  online: 'green',
  draft: 'gold',
  archived: 'default',
};

const columns: TableColumnsType<TeamAssetItem> = [
  { title: '资产名称', dataIndex: 'name', key: 'name', width: 240 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 120 },
  { title: '所属部门', dataIndex: 'department', key: 'department', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '近 30 天使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 160 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
];

onMounted(loadAssets);

function getTypeText(type: TeamAssetItem['type']) {
  return typeTextMap[type];
}

function getStatusText(status: TeamAssetItem['status']) {
  return statusTextMap[status];
}

function getStatusColor(status: TeamAssetItem['status']) {
  return statusColorMap[status];
}

async function loadAssets() {
  loading.value = true;

  try {
    assets.value = await getTeamAssetListApi();
  } catch (error) {
    message.error(getErrorMessage(error, '团队资产库加载失败'));
  } finally {
    loading.value = false;
  }
}
</script>
