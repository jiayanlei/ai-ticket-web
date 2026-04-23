<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">AI 分析总览</h1>
        <p class="page-description">基于工单列表中的 AI 摘要、风险等级和分类字段生成概览。</p>
      </div>
      <a-button @click="loadOverview">刷新</a-button>
    </div>

    <div class="stat-grid">
      <a-card v-for="item in stats" :key="item.title" :bordered="false" :loading="loading">
        <a-statistic :title="item.title" :value="item.value" :suffix="item.suffix" />
      </a-card>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="12">
        <a-card title="风险分布" :bordered="false" :loading="loading">
          <div ref="riskChartRef" class="ai-overview__chart" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="分类分布" :bordered="false" :loading="loading">
          <div ref="categoryChartRef" class="ai-overview__chart" />
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
import type { WorkOrderItem } from '@/api/workOrder';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const tickets = ref<WorkOrderItem[]>([]);
const riskChartRef = ref<HTMLDivElement>();
const categoryChartRef = ref<HTMLDivElement>();
let riskChart: echarts.ECharts | undefined;
let categoryChart: echarts.ECharts | undefined;

const analyzedCount = computed(() => tickets.value.filter((item) => item.aiSummary || item.aiRiskLevel).length);
const stats = computed(() => [
  { title: '样本工单', value: tickets.value.length, suffix: '件' },
  { title: '已有 AI 字段', value: analyzedCount.value, suffix: '件' },
  { title: '高风险工单', value: tickets.value.filter((item) => ['HIGH', 'URGENT'].includes(item.aiRiskLevel || '')).length, suffix: '件' },
  {
    title: '字段覆盖率',
    value: tickets.value.length ? Math.round((analyzedCount.value / tickets.value.length) * 100) : 0,
    suffix: '%',
  },
]);

onMounted(async () => {
  if (riskChartRef.value) {
    riskChart = echarts.init(riskChartRef.value);
  }
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value);
  }

  await loadOverview();
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts);
  riskChart?.dispose();
  categoryChart?.dispose();
});

async function loadOverview() {
  loading.value = true;

  try {
    const page = await getWorkOrderListApi({ pageNum: 1, pageSize: 100 });
    tickets.value = page.records;
    renderCharts();
  } catch (error) {
    message.error(getErrorMessage(error, 'AI 概览加载失败'));
  } finally {
    loading.value = false;
  }
}

function renderCharts() {
  const riskData = toChartData(countBy(tickets.value.map((item) => item.aiRiskLevel || '未分析')));
  const categoryData = toChartData(countBy(tickets.value.map((item) => item.category || '未分类')));

  riskChart?.setOption({
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        data: riskData,
      },
    ],
  });

  categoryChart?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 32, right: 16, top: 24, bottom: 28 },
    xAxis: { type: 'category', data: categoryData.map((item) => item.name) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'bar', data: categoryData.map((item) => item.value) }],
  });
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function toChartData(counts: Record<string, number>) {
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function resizeCharts() {
  riskChart?.resize();
  categoryChart?.resize();
}
</script>

<style scoped lang="scss">
.ai-overview__chart {
  width: 100%;
  height: 280px;
}
</style>
