<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">数据驾驶舱</h1>
        <p class="page-description">当前驾驶舱数据由工单分页接口派生，后端暂无专用统计 Controller。</p>
      </div>
      <a-button @click="loadCockpit">刷新</a-button>
    </div>

    <div class="stat-grid">
      <a-card v-for="item in stats" :key="item.title" :bordered="false" :loading="loading">
        <a-statistic :title="item.title" :value="item.value" :suffix="item.suffix" />
      </a-card>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="14">
        <a-card title="状态分布" :bordered="false" :loading="loading">
          <div ref="statusChartRef" class="cockpit-chart" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="10">
        <a-card title="优先级分布" :bordered="false" :loading="loading">
          <div ref="priorityChartRef" class="cockpit-chart" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import * as echarts from 'echarts';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { getWorkOrderListApi } from '@/api/workOrder';
import type { TicketPriority, TicketStatus, WorkOrderItem } from '@/api/workOrder';
import { getErrorMessage } from '@/utils/api-error';
import { ticketPriorityOptions, ticketStatusOptions } from '@/constants/ticket';

const loading = ref(false);
const tickets = ref<WorkOrderItem[]>([]);
const statusTotals = ref<Record<TicketStatus, number>>({
  NEW: 0,
  PROCESSING: 0,
  PENDING: 0,
  RESOLVED: 0,
  CLOSED: 0,
});
const statusChartRef = ref<HTMLDivElement>();
const priorityChartRef = ref<HTMLDivElement>();
let statusChart: echarts.ECharts | undefined;
let priorityChart: echarts.ECharts | undefined;

const stats = computed(() => [
  { title: '总工单', value: Object.values(statusTotals.value).reduce((sum, value) => sum + value, 0), suffix: '件' },
  { title: '未关闭', value: statusTotals.value.NEW + statusTotals.value.PROCESSING + statusTotals.value.PENDING, suffix: '件' },
  { title: '已解决', value: statusTotals.value.RESOLVED, suffix: '件' },
  { title: '已关闭', value: statusTotals.value.CLOSED, suffix: '件' },
]);

onMounted(async () => {
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value);
  }
  if (priorityChartRef.value) {
    priorityChart = echarts.init(priorityChartRef.value);
  }

  await loadCockpit();
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts);
  statusChart?.dispose();
  priorityChart?.dispose();
});

async function loadCockpit() {
  loading.value = true;

  try {
    const [recentPage, ...statusPages] = await Promise.all([
      getWorkOrderListApi({ pageNum: 1, pageSize: 100 }),
      ...ticketStatusOptions.map((item) => getWorkOrderListApi({ pageNum: 1, pageSize: 1, status: item.value })),
    ]);
    tickets.value = recentPage.records;
    statusTotals.value = ticketStatusOptions.reduce(
      (result, item, index) => ({
        ...result,
        [item.value]: statusPages[index]?.total ?? 0,
      }),
      { ...statusTotals.value },
    );
    renderCharts();
  } catch (error) {
    message.error(getErrorMessage(error, '驾驶舱数据加载失败'));
  } finally {
    loading.value = false;
  }
}

function renderCharts() {
  statusChart?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 32, right: 16, top: 24, bottom: 28 },
    xAxis: { type: 'category', data: ticketStatusOptions.map((item) => item.label) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        type: 'bar',
        data: ticketStatusOptions.map((item) => statusTotals.value[item.value]),
      },
    ],
  });

  const priorityCounts = countPriority(tickets.value);
  priorityChart?.setOption({
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        data: ticketPriorityOptions.map((item) => ({
          name: item.label,
          value: priorityCounts[item.value] ?? 0,
        })),
      },
    ],
  });
}

function countPriority(records: WorkOrderItem[]) {
  return records.reduce<Partial<Record<TicketPriority, number>>>((result, item) => {
    result[item.priority] = (result[item.priority] ?? 0) + 1;
    return result;
  }, {});
}

function resizeCharts() {
  statusChart?.resize();
  priorityChart?.resize();
}
</script>

<style scoped lang="scss">
.cockpit-chart {
  width: 100%;
  height: 280px;
}
</style>
