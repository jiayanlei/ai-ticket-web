<template>
  <div class="page-view">
    <a-card :bordered="false">
      <div class="system-page__filters">
        <a-input-search v-model:value="keyword" allow-clear placeholder="搜索会话标题、用户或消息" @search="void loadRecords()" />
      </div>

      <a-table :columns="columns" :data-source="records" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { ref } from 'vue';

import { getConversationRecordListApi } from '@/api/chat';
import type { ConversationRecordItem } from '@/api/chat';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const keyword = ref('');
const records = ref<ConversationRecordItem[]>([]);

const statusTextMap: Record<ConversationRecordItem['status'], string> = {
  completed: '已完成',
  waiting: '待处理',
  warning: '风险提示',
};

const statusColorMap: Record<ConversationRecordItem['status'], string> = {
  completed: 'green',
  waiting: 'gold',
  warning: 'red',
};

const columns: TableColumnsType<ConversationRecordItem> = [
  { title: '会话标题', dataIndex: 'title', key: 'title', width: 240 },
  { title: '任务类型', dataIndex: 'taskType', key: 'taskType', width: 160 },
  { title: '发起人', dataIndex: 'userName', key: 'userName', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '消息数', dataIndex: 'messageCount', key: 'messageCount', width: 100 },
  { title: '最后一条消息', dataIndex: 'lastMessage', key: 'lastMessage' },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
];

void loadRecords();

function getStatusText(status: ConversationRecordItem['status']) {
  return statusTextMap[status];
}

function getStatusColor(status: ConversationRecordItem['status']) {
  return statusColorMap[status];
}

async function loadRecords() {
  loading.value = true;

  try {
    const data = await getConversationRecordListApi();
    const search = keyword.value.trim().toLowerCase();
    records.value = !search
      ? data
      : data.filter((item) =>
          [item.title, item.userName, item.lastMessage, item.taskType].join(' ').toLowerCase().includes(search),
        );
  } catch (error) {
    message.error(getErrorMessage(error, '对话记录加载失败'));
  } finally {
    loading.value = false;
  }
}
</script>
