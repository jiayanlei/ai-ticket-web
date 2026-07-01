<template>
  <div class="page-view">
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
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { getWorkOrderListApi } from '@/api/workOrder';
import type { WorkOrderItem } from '@/api/workOrder';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const tickets = ref<WorkOrderItem[]>([]);
const riskChartRef = ref<HTMLDivElement>();
const categoryChartRef = ref<HTMLDivElement>();
let riskChart: echarts.ECharts | undefined;
let categoryChart: echarts.ECharts | undefined;

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
