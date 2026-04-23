<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">我的待办</h1>
        <p class="page-description">基于工单状态筛选待处理、处理中和挂起工单。</p>
      </div>
      <a-button @click="loadTodos">刷新</a-button>
    </div>

    <a-card :bordered="false">
      <a-tabs v-model:active-key="activeStatus" @change="handleStatusChange">
        <a-tab-pane key="NEW" tab="新建" />
        <a-tab-pane key="PROCESSING" tab="处理中" />
        <a-tab-pane key="PENDING" tab="挂起" />
      </a-tabs>

      <a-table
        :columns="columns"
        :data-source="tickets"
        :loading="loading"
        :pagination="tablePagination"
        :scroll="{ x: 980 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'priority'">
            <a-tag :color="getTicketPriorityMeta(record.priority).color">
              {{ getTicketPriorityMeta(record.priority).label }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getTicketStatusMeta(record.status).color">
              {{ getTicketStatusMeta(record.status).label }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { getWorkOrderListApi } from '@/api/workOrder';
import type { TicketStatus, WorkOrderItem, WorkOrderQueryParams } from '@/api/workOrder';
import { getTicketPriorityMeta, getTicketStatusMeta } from '@/constants/ticket';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const activeStatus = ref<TicketStatus>('NEW');
const tickets = ref<WorkOrderItem[]>([]);
const total = ref(0);
const query = reactive<WorkOrderQueryParams>({
  pageNum: 1,
  pageSize: 10,
});

const columns: TableColumnsType<WorkOrderItem> = [
  { title: '工单编号', dataIndex: 'ticketNo', key: 'ticketNo', width: 190 },
  { title: '标题', dataIndex: 'title', key: 'title', width: 260 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '处理人', dataIndex: 'assigneeName', key: 'assigneeName', width: 120 },
  { title: '期望完成', dataIndex: 'dueTime', key: 'dueTime', width: 170 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
];

const tablePagination = computed<TablePaginationConfig>(() => ({
  current: query.pageNum,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value) => `共 ${value} 条`,
}));

onMounted(loadTodos);

async function loadTodos() {
  loading.value = true;

  try {
    const page = await getWorkOrderListApi({
      ...query,
      status: activeStatus.value,
    });
    tickets.value = page.records;
    total.value = page.total;
    query.pageNum = page.pageNum;
    query.pageSize = page.pageSize;
  } catch (error) {
    message.error(getErrorMessage(error, '待办列表加载失败'));
  } finally {
    loading.value = false;
  }
}

function handleStatusChange() {
  query.pageNum = 1;
  void loadTodos();
}

function handleTableChange(pagination: TablePaginationConfig) {
  query.pageNum = pagination.current ?? 1;
  query.pageSize = pagination.pageSize ?? 10;
  void loadTodos();
}
</script>
