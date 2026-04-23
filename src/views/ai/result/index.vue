<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">智能分析结果</h1>
        <p class="page-description">当前从工单列表接口读取 AI 摘要和风险字段；后端尚无独立 AI 分析记录接口。</p>
      </div>
      <a-button @click="loadResults">刷新</a-button>
    </div>

    <a-card :bordered="false">
      <div class="system-page__filters">
        <a-input-search
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索工单编号、标题"
          @search="handleSearch"
        />
        <a-select v-model:value="query.status" allow-clear placeholder="工单状态">
          <a-select-option v-for="item in ticketStatusOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-select-option>
        </a-select>
        <a-input v-model:value="query.category" allow-clear placeholder="分类" @press-enter="handleSearch" />
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
        :scroll="{ x: 1180 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getTicketStatusMeta(record.status).color">
              {{ getTicketStatusMeta(record.status).label }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'aiRiskLevel'">
            <a-tag :color="getRiskColor(record.aiRiskLevel)">{{ record.aiRiskLevel || '未分析' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'aiSummary'">
            {{ record.aiSummary || '-' }}
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
import type { WorkOrderItem, WorkOrderQueryParams } from '@/api/workOrder';
import { getTicketStatusMeta, ticketStatusOptions } from '@/constants/ticket';
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
  { title: '标题', dataIndex: 'title', key: 'title', width: 240 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
  { title: 'AI 风险', dataIndex: 'aiRiskLevel', key: 'aiRiskLevel', width: 120 },
  { title: 'AI 摘要', dataIndex: 'aiSummary', key: 'aiSummary' },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 170 },
];

const tablePagination = computed<TablePaginationConfig>(() => ({
  current: query.pageNum,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value) => `共 ${value} 条`,
}));

onMounted(loadResults);

async function loadResults() {
  loading.value = true;

  try {
    const page = await getWorkOrderListApi(query);
    tickets.value = page.records;
    total.value = page.total;
    query.pageNum = page.pageNum;
    query.pageSize = page.pageSize;
  } catch (error) {
    message.error(getErrorMessage(error, 'AI 分析结果加载失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  void loadResults();
}

function resetQuery() {
  query.keyword = undefined;
  query.status = undefined;
  query.category = undefined;
  handleSearch();
}

function handleTableChange(pagination: TablePaginationConfig) {
  query.pageNum = pagination.current ?? 1;
  query.pageSize = pagination.pageSize ?? 10;
  void loadResults();
}

function getRiskColor(risk: string | null) {
  const colorMap: Record<string, string> = {
    LOW: 'green',
    NORMAL: 'blue',
    MEDIUM: 'gold',
    HIGH: 'orange',
    URGENT: 'red',
  };

  return risk ? colorMap[risk] ?? 'blue' : 'default';
}
</script>
