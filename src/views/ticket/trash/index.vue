<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">工单回收站</h1>
        <p class="page-description">查询已逻辑删除的工单，并支持恢复到普通工单列表。</p>
      </div>
      <a-button @click="loadTickets">刷新</a-button>
    </div>

    <a-card :bordered="false">
      <div class="ticket-trash__filters">
        <a-input-search
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索工单编号、标题"
          @search="handleSearch"
        />
        <a-select v-model:value="query.priority" allow-clear placeholder="优先级">
          <a-select-option v-for="item in ticketPriorityOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-select-option>
        </a-select>
        <a-space>
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="primary" @click="handleSearch">查询</a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="tickets"
        :loading="loading"
        :pagination="tablePagination"
        :scroll="{ x: 1120 }"
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
          <template v-else-if="column.key === 'action'">
            <a-popconfirm title="确认恢复该工单？" @confirm="handleRestore(record.id)">
              <a>恢复</a>
            </a-popconfirm>
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

import type { ApiId } from '@/api/types';
import { getRecycleWorkOrderListApi, restoreWorkOrderApi } from '@/api/workOrder';
import type { WorkOrderItem, WorkOrderQueryParams } from '@/api/workOrder';
import {
  getTicketPriorityMeta,
  getTicketStatusMeta,
  ticketPriorityOptions,
} from '@/constants/ticket';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const tickets = ref<WorkOrderItem[]>([]);
const total = ref(0);
const query = reactive<WorkOrderQueryParams>({
  pageNum: 1,
  pageSize: 10,
});

const columns: TableColumnsType<WorkOrderItem> = [
  { title: '工单编号', dataIndex: 'ticketNo', key: 'ticketNo', width: 190 },
  { title: '标题', dataIndex: 'title', key: 'title', width: 260 },
  { title: '申请人', dataIndex: 'applicantName', key: 'applicantName', width: 120 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', fixed: 'right', width: 100 },
];

const tablePagination = computed<TablePaginationConfig>(() => ({
  current: query.pageNum,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value) => `共 ${value} 条`,
}));

onMounted(loadTickets);

async function loadTickets() {
  loading.value = true;

  try {
    const page = await getRecycleWorkOrderListApi(query);
    tickets.value = page.records;
    total.value = page.total;
    query.pageNum = page.pageNum;
    query.pageSize = page.pageSize;
  } catch (error) {
    message.error(getErrorMessage(error, '回收站加载失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  void loadTickets();
}

function resetQuery() {
  query.keyword = undefined;
  query.priority = undefined;
  handleSearch();
}

function handleTableChange(pagination: TablePaginationConfig) {
  query.pageNum = pagination.current ?? 1;
  query.pageSize = pagination.pageSize ?? 10;
  void loadTickets();
}

async function handleRestore(id: ApiId) {
  try {
    await restoreWorkOrderApi(id);
    message.success('工单已恢复');
    await loadTickets();
  } catch (error) {
    message.error(getErrorMessage(error, '恢复工单失败'));
  }
}
</script>

<style scoped lang="scss">
.ticket-trash__filters {
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) minmax(140px, 0.5fr) auto;
  gap: 12px;
  margin-bottom: 16px;
}

@media (max-width: 760px) {
  .ticket-trash__filters {
    grid-template-columns: 1fr;
  }
}
</style>
