<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">工作台首页</h1>
        <p class="page-description">当前统计由工单分页接口实时派生，后续可切换到专用统计接口。</p>
      </div>
      <a-button type="primary" @click="router.push('/ticket/create')">新建工单</a-button>
    </div>

    <div class="stat-grid">
      <a-card v-for="item in stats" :key="item.title" :bordered="false" :loading="loading">
        <a-statistic :title="item.title" :value="item.value" :suffix="item.suffix" />
      </a-card>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="14">
        <a-card title="近 7 日工单趋势" :bordered="false" class="chart-panel" :loading="loading">
          <div ref="chartRef" class="workbench-chart" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="10">
        <a-card title="近期待办" :bordered="false" :loading="loading">
          <a-list :data-source="todos" item-layout="horizontal">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.title" :description="item.description" />
                <a-tag :color="getTicketStatusMeta(item.status).color">
                  {{ getTicketStatusMeta(item.status).label }}
                </a-tag>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getWorkOrderListApi } from '@/api/workOrder';
import type { TicketStatus, WorkOrderItem } from '@/api/workOrder';
import { getTicketStatusMeta, ticketStatusOptions } from '@/constants/ticket';
import { getErrorMessage } from '@/utils/api-error';
import { message } from 'ant-design-vue';

interface TodoItem {
  title: string;
  description: string;
  status: TicketStatus;
}

const router = useRouter();
const chartRef = ref<HTMLDivElement>();
const loading = ref(false);
const statusTotals = ref<Record<TicketStatus, number>>({
  NEW: 0,
  PROCESSING: 0,
  PENDING: 0,
  RESOLVED: 0,
  CLOSED: 0,
});
const recentTickets = ref<WorkOrderItem[]>([]);
let chart: echarts.ECharts | undefined;

const stats = computed(() => [
  { title: '新建工单', value: statusTotals.value.NEW, suffix: '件' },
  { title: '处理中工单', value: statusTotals.value.PROCESSING, suffix: '件' },
  { title: '挂起工单', value: statusTotals.value.PENDING, suffix: '件' },
  { title: '已解决工单', value: statusTotals.value.RESOLVED, suffix: '件' },
]);
const todos = computed<TodoItem[]>(() =>
  recentTickets.value
    .filter((item) => ['NEW', 'PROCESSING', 'PENDING'].includes(item.status))
    .slice(0, 6)
    .map((item) => ({
      title: item.title,
      description: `${item.ticketNo} / ${item.assigneeName || '未分派'} / ${item.createTime}`,
      status: item.status,
    })),
);

onMounted(async () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
  }

  await loadWorkbench();
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  chart?.dispose();
});

async function loadWorkbench() {
  loading.value = true;

  try {
    const [recentPage, ...statusPages] = await Promise.all([
      getWorkOrderListApi({ pageNum: 1, pageSize: 100 }),
      ...ticketStatusOptions.map((item) => getWorkOrderListApi({ pageNum: 1, pageSize: 1, status: item.value })),
    ]);
    recentTickets.value = recentPage.records;
    statusTotals.value = ticketStatusOptions.reduce(
      (result, item, index) => ({
        ...result,
        [item.value]: statusPages[index]?.total ?? 0,
      }),
      { ...statusTotals.value },
    );
    renderChart();
  } catch (error) {
    message.error(getErrorMessage(error, '工作台数据加载失败'));
  } finally {
    loading.value = false;
  }
}

function renderChart() {
  const labels = createRecentDateLabels();
  const createdCounts = labels.map((date) => recentTickets.value.filter((item) => item.createTime?.startsWith(date)).length);
  const resolvedCounts = labels.map(
    (date) =>
      recentTickets.value.filter(
        (item) => item.status === 'RESOLVED' && (item.resolvedTime?.startsWith(date) || item.updateTime?.startsWith(date)),
      ).length,
  );

  chart?.setOption({
    color: ['#1677ff', '#52c41a'],
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: 32,
      right: 18,
      top: 28,
      bottom: 28,
    },
    xAxis: {
      type: 'category',
      data: labels,
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    series: [
      {
        name: '新增工单',
        type: 'line',
        smooth: true,
        data: createdCounts,
      },
      {
        name: '已解决',
        type: 'bar',
        data: resolvedCounts,
      },
    ],
  });
}

function createRecentDateLabels() {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
}

function resizeChart() {
  chart?.resize();
}
</script>

<style scoped lang="scss">
.workbench-chart {
  width: 100%;
  height: 260px;
}
</style>
