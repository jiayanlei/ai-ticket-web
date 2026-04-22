<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">工作台首页</h1>
        <p class="page-description">汇总待处理工单、AI 分析趋势和知识库运营指标。</p>
      </div>
      <a-button type="primary">新建工单</a-button>
    </div>

    <div class="stat-grid">
      <a-card v-for="item in stats" :key="item.title" :bordered="false">
        <a-statistic :title="item.title" :value="item.value" :suffix="item.suffix" />
      </a-card>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="14">
        <a-card title="工单趋势" :bordered="false" class="chart-panel">
          <div ref="chartRef" class="workbench-chart" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="10">
        <a-card title="近期待办" :bordered="false">
          <a-list :data-source="todos" item-layout="horizontal">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.title" :description="item.description" />
                <a-tag :color="item.color">{{ item.status }}</a-tag>
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
import { onBeforeUnmount, onMounted, ref } from 'vue';

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | undefined;

const stats = [
  { title: '今日新增工单', value: 32, suffix: '件' },
  { title: '待处理工单', value: 18, suffix: '件' },
  { title: 'AI 已分析', value: 126, suffix: '次' },
  { title: '知识命中率', value: 86, suffix: '%' },
];

const todos = [
  { title: '高优先级工单待分派', description: '来自企业客户服务队列', status: '待处理', color: 'red' },
  { title: 'AI 分析结果需复核', description: '异常类别置信度偏低', status: '复核中', color: 'orange' },
  { title: 'FAQ 条目待更新', description: '已有 4 条用户反馈', status: '待维护', color: 'blue' },
];

onMounted(() => {
  if (!chartRef.value) {
    return;
  }

  chart = echarts.init(chartRef.value);
  chart.setOption({
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
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '新增工单',
        type: 'line',
        smooth: true,
        data: [28, 34, 31, 46, 42, 25, 32],
      },
      {
        name: 'AI 分析',
        type: 'bar',
        data: [40, 48, 44, 62, 56, 36, 52],
      },
    ],
  });

  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  chart?.dispose();
});

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
