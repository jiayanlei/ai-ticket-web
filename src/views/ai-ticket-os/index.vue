<template>
  <div class="ai-ticket-page">
    <section class="command-hero">
      <div class="command-hero__copy">
        <span class="command-hero__eyebrow">{{ page.number }} / {{ page.group }}</span>
        <h1>{{ page.title }}</h1>
        <p>{{ page.objective }}</p>
      </div>
      <div class="command-hero__actions">
        <a-button>
          <template #icon><ReloadOutlined /></template>
          {{ t('common.refresh') }}
        </a-button>
        <a-button type="primary">
          <template #icon><ThunderboltOutlined /></template>
          {{ page.primaryAction }}
        </a-button>
      </div>
    </section>

    <section class="smart-filter">
      <a-input class="smart-filter__search" :placeholder="t('aiTicketOs.labels.searchPlaceholder')">
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-select v-model:value="filterState.channel" class="smart-filter__select">
        <a-select-option value="all">{{ t('aiTicketOs.labels.allChannels') }}</a-select-option>
        <a-select-option value="voice">{{ t('aiTicketOs.labels.voice') }}</a-select-option>
        <a-select-option value="chat">{{ t('aiTicketOs.labels.liveChat') }}</a-select-option>
        <a-select-option value="email">{{ t('aiTicketOs.labels.email') }}</a-select-option>
      </a-select>
      <a-select v-model:value="filterState.status" class="smart-filter__select">
        <a-select-option value="active">{{ t('aiTicketOs.labels.active') }}</a-select-option>
        <a-select-option value="risk">{{ t('aiTicketOs.labels.atRisk') }}</a-select-option>
        <a-select-option value="breached">{{ t('aiTicketOs.labels.breached') }}</a-select-option>
      </a-select>
      <a-button>
        <template #icon><FilterOutlined /></template>
        {{ t('aiTicketOs.actions.smartFilter') }}
      </a-button>
    </section>

    <section class="page-grid">
      <main class="page-grid__main">
        <section class="glass-panel command-panel">
          <div class="panel-heading">
            <div>
              <span>{{ t('aiTicketOs.labels.aiCommandPanel') }}</span>
              <h2>{{ t('aiTicketOs.labels.recommendedOperations') }}</h2>
            </div>
            <a-tag color="processing">{{ t('aiTicketOs.labels.live') }}</a-tag>
          </div>
          <div class="command-panel__body">
            <div class="copilot-orb">
              <RobotOutlined />
            </div>
            <div>
              <h3>{{ page.aiInsight }}</h3>
              <p>
                {{ t('aiTicketOs.labels.copilotReviewed') }}
              </p>
            </div>
          </div>
          <div class="command-panel__actions">
            <a-button type="primary">{{ t('aiTicketOs.actions.applyRecommendation') }}</a-button>
            <a-button>{{ t('aiTicketOs.actions.openEvidence') }}</a-button>
            <a-button>{{ t('aiTicketOs.actions.assignOwnerButton') }}</a-button>
          </div>
        </section>

        <section class="chart-grid">
          <article v-for="(chart, index) in page.charts" :key="chart" class="glass-panel chart-card">
            <div class="panel-heading panel-heading--compact">
              <div>
                <span>{{ t('aiTicketOs.labels.realtimeChart') }}</span>
                <h2>{{ chart }}</h2>
              </div>
              <a-tag :color="index === 0 ? 'blue' : index === 1 ? 'purple' : 'cyan'">ECharts</a-tag>
            </div>
            <div :ref="(el) => setChartRef(el, index)" class="chart-card__canvas" />
          </article>
        </section>

        <section class="glass-panel table-panel">
          <div class="panel-heading">
            <div>
              <span>{{ t('aiTicketOs.labels.advancedTable') }}</span>
              <h2>{{ page.title }} {{ t('aiTicketOs.labels.workQueue') }}</h2>
            </div>
            <a-space>
              <a-button size="small">{{ t('common.export') }}</a-button>
              <a-button size="small" type="primary">
                <template #icon><PlusCircleOutlined /></template>
                {{ t('common.new') }}
              </a-button>
            </a-space>
          </div>

          <a-table :columns="columns" :data-source="tableRows" :pagination="false" size="middle" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.statusColor">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'risk'">
                <span class="risk-pill" :class="`risk-pill--${record.riskTone}`">{{ record.risk }}</span>
              </template>
              <template v-else-if="column.key === 'ai'">
                <span class="ai-score">{{ record.ai }}</span>
              </template>
            </template>
          </a-table>
        </section>
      </main>

      <aside class="page-grid__side">
        <section class="glass-panel side-panel">
          <div class="panel-heading panel-heading--compact">
            <div>
              <span>{{ t('aiTicketOs.labels.liveStatus') }}</span>
              <h2>{{ t('aiTicketOs.labels.operationalHealth') }}</h2>
            </div>
          </div>
          <div class="health-list">
            <article v-for="item in healthItems" :key="item.label" class="health-item">
              <span class="health-item__dot" :class="`health-item__dot--${item.tone}`" />
              <div>
                <strong>{{ item.label }}</strong>
                <small>{{ item.value }}</small>
              </div>
            </article>
          </div>
        </section>

        <section class="glass-panel side-panel">
          <div class="panel-heading panel-heading--compact">
            <div>
              <span>{{ t('aiTicketOs.labels.workflow') }}</span>
              <h2>{{ page.panels[0] }}</h2>
            </div>
          </div>
          <div class="workflow-map">
            <article v-for="node in workflowNodes" :key="node.label" class="workflow-node">
              <component :is="node.icon" />
              <span>{{ node.label }}</span>
            </article>
          </div>
        </section>

        <section class="glass-panel side-panel">
          <div class="panel-heading panel-heading--compact">
            <div>
              <span>{{ t('aiTicketOs.labels.activityFeed') }}</span>
              <h2>{{ t('aiTicketOs.labels.realtimeEvents') }}</h2>
            </div>
          </div>
          <div class="activity-feed">
            <article v-for="event in activityFeed" :key="event.id" class="activity-event">
              <span>{{ event.time }}</span>
              <p>{{ event.text }}</p>
            </article>
          </div>
        </section>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue';
import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, GraphChart, HeatmapChart, LineChart, PieChart, RadarChart, SankeyChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECharts, EChartsCoreOption } from 'echarts/core';

import { aiTicketPageMap, aiTicketPages } from '@/views/ai-ticket-os/page-config';
import type { AiTicketPageConfig } from '@/views/ai-ticket-os/page-config';

echarts.use([
  BarChart,
  CanvasRenderer,
  FunnelChart,
  GraphChart,
  GridComponent,
  HeatmapChart,
  LegendComponent,
  LineChart,
  PieChart,
  RadarChart,
  RadarComponent,
  SankeyChart,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
]);

type RiskTone = 'low' | 'medium' | 'high';
type MetricTone = AiTicketPageConfig['metrics'][number]['tone'];

interface LocalePageConfig {
  title: string;
  group: string;
  objective: string;
  primaryAction: string;
  metrics: [string, string, string, MetricTone][];
  panels: string[];
  charts: string[];
  aiInsight: string;
}

interface TableRow {
  id: string;
  item: string;
  owner: string;
  channel: string;
  status: string;
  statusColor: string;
  sla: string;
  risk: string;
  riskTone: RiskTone;
  ai: string;
}

const route = useRoute();
const { locale, rt, t, tm } = useI18n();
const filterState = reactive({
  channel: 'all',
  status: 'active',
});
const chartElements = shallowRef<(HTMLElement | null)[]>([]);
const chartInstances: ECharts[] = [];

const pageIndexByPath = new Map(aiTicketPages.map((item, index) => [item.path, index]));
const page = computed(() => {
  const englishPage = aiTicketPageMap.get(route.path) ?? aiTicketPages[0];
  const pageIndex = pageIndexByPath.get(englishPage.path) ?? 0;
  const localePages = Object.values(tm('aiTicketOs.pages') as Record<string, LocalePageConfig>);
  const localePage = locale.value === 'zh-CN' ? localePages[pageIndex] : undefined;

  if (!localePage) {
    return englishPage;
  }

  return {
    ...englishPage,
    ...localePage,
    primaryAction: rt(localePage.primaryAction),
    metrics: localePage.metrics.map(([label, value, delta, tone]) => ({ label, value, delta, tone })),
  };
});
const columns = computed(() => [
  { title: t('aiTicketOs.table.workItem'), dataIndex: 'item', key: 'item' },
  { title: t('aiTicketOs.table.owner'), dataIndex: 'owner', key: 'owner', width: 150 },
  { title: t('aiTicketOs.table.channel'), dataIndex: 'channel', key: 'channel', width: 130 },
  { title: t('aiTicketOs.table.status'), dataIndex: 'status', key: 'status', width: 130 },
  { title: t('aiTicketOs.table.sla'), dataIndex: 'sla', key: 'sla', width: 120 },
  { title: t('aiTicketOs.table.risk'), dataIndex: 'risk', key: 'risk', width: 130 },
  { title: t('aiTicketOs.table.aiSignal'), dataIndex: 'ai', key: 'ai', width: 150 },
]);

const tableRows = computed<TableRow[]>(() => {
  const title = page.value.title.replace(' Center', '');
  return [
    {
      id: 'row-1',
      item: `${title} ${t('aiTicketOs.table.priorityCase')}`,
      owner: 'Avery Chen',
      channel: t('aiTicketOs.labels.voice'),
      status: t('aiTicketOs.table.inProgress'),
      statusColor: 'processing',
      sla: t('aiTicketOs.table.minutesLeft42'),
      risk: t('aiTicketOs.table.medium'),
      riskTone: 'medium',
      ai: t('aiTicketOs.table.confidence'),
    },
    {
      id: 'row-2',
      item: `${title} ${t('aiTicketOs.table.escalationWorkflow')}`,
      owner: 'Maya Lin',
      channel: t('aiTicketOs.labels.liveChat'),
      status: t('aiTicketOs.labels.atRisk'),
      statusColor: 'warning',
      sla: t('aiTicketOs.table.minutesLeft18'),
      risk: t('aiTicketOs.table.high'),
      riskTone: 'high',
      ai: t('aiTicketOs.table.actionAdvised'),
    },
    {
      id: 'row-3',
      item: `${title} ${t('aiTicketOs.table.resolutionBatch')}`,
      owner: 'AI Ops Agent',
      channel: t('aiTicketOs.labels.email'),
      status: t('aiTicketOs.table.resolved'),
      statusColor: 'success',
      sla: t('aiTicketOs.table.met'),
      risk: t('aiTicketOs.table.low'),
      riskTone: 'low',
      ai: t('aiTicketOs.table.autoClosed'),
    },
  ];
});

const healthItems = computed(() => [
  { label: t('aiTicketOs.health.aiRuntime'), value: t('aiTicketOs.health.aiRuntimeValue'), tone: 'green' },
  {
    label: t('aiTicketOs.health.slaPressure'),
    value: t('aiTicketOs.health.slaPressureValue', { value: page.value.metrics[1]?.value ?? '91%' }),
    tone: 'amber',
  },
  { label: t('aiTicketOs.health.queueLoad'), value: t('aiTicketOs.health.queueLoadValue'), tone: 'blue' },
  { label: t('aiTicketOs.health.riskStream'), value: t('aiTicketOs.health.riskStreamValue'), tone: 'red' },
]);

const workflowNodes = computed(() => [
  { label: page.value.panels[0] ?? t('aiTicketOs.workflow.intake'), icon: BranchesOutlined },
  { label: page.value.panels[1] ?? t('aiTicketOs.workflow.aiTriage'), icon: RobotOutlined },
  { label: page.value.panels[2] ?? t('aiTicketOs.workflow.humanReview'), icon: ClockCircleOutlined },
  { label: t('aiTicketOs.workflow.closedLoop'), icon: CheckCircleOutlined },
]);

const activityFeed = computed(() => [
  { id: 'event-1', time: '09:42', text: t('aiTicketOs.activity.recommendationGenerated', { title: page.value.title }) },
  { id: 'event-2', time: '09:37', text: t('aiTicketOs.activity.slaGuardrail') },
  { id: 'event-3', time: '09:31', text: t('aiTicketOs.activity.policyUpdated') },
  { id: 'event-4', time: '09:18', text: t('aiTicketOs.activity.sentimentScored') },
]);

function setChartRef(el: Element | ComponentPublicInstance | null, index: number) {
  chartElements.value[index] = el instanceof HTMLElement ? el : null;
}

function renderCharts() {
  disposeCharts();
  chartElements.value.forEach((el, index) => {
    if (!el) {
      return;
    }

    const chart = echarts.init(el);
    chart.setOption(createChartOption(page.value.charts[index] ?? t('aiTicketOs.charts.realtimeMonitor'), index));
    chartInstances.push(chart);
  });
}

function disposeCharts() {
  while (chartInstances.length) {
    chartInstances.pop()?.dispose();
  }
}

function createChartOption(title: string, index: number): EChartsCoreOption {
  const isDark = document.documentElement.classList.contains('dark');
  const chartTextColor = isDark ? '#94a3b8' : '#64748b';
  const chartLabelColor = isDark ? '#e2e8f0' : '#334155';
  const strongLineColor = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.16)';
  const softLineColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const radarAreaColor = isDark
    ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
    : ['rgba(79,123,255,0.04)', 'rgba(15,23,42,0.025)'];
  const common = {
    color: ['#4F7BFF', '#00E5FF', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444'],
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 34, right: 16, top: 34, bottom: 28 },
    textStyle: { color: chartTextColor },
  };

  if (/radar|quality|skill|emotion/i.test(title)) {
    return {
      ...common,
      radar: {
        indicator: [
          t('aiTicketOs.charts.speed'),
          t('aiTicketOs.charts.quality'),
          t('aiTicketOs.charts.sla'),
          t('aiTicketOs.charts.ai'),
          t('aiTicketOs.charts.cost'),
          t('aiTicketOs.charts.risk'),
        ].map((name) => ({ name, max: 100 })),
        radius: '62%',
        axisName: { color: chartTextColor },
        splitLine: { lineStyle: { color: strongLineColor } },
        splitArea: { areaStyle: { color: radarAreaColor } },
      },
      series: [{ type: 'radar', data: [{ value: [88, 93, 81, 96, 74, 68], name: title }], areaStyle: { opacity: 0.22 } }],
    };
  }

  if (/funnel/i.test(title)) {
    return {
      ...common,
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'funnel',
          left: '8%',
          top: 16,
          bottom: 8,
          width: '84%',
          data: [
            { name: t('aiTicketOs.charts.intake'), value: 100 },
            { name: t('aiTicketOs.charts.aiTriage'), value: 82 },
            { name: t('aiTicketOs.charts.assisted'), value: 64 },
            { name: t('aiTicketOs.charts.resolved'), value: 49 },
          ],
        },
      ],
    };
  }

  if (/sankey|flow|chain|graph|map/i.test(title)) {
    return {
      ...common,
      tooltip: { trigger: 'item' },
      series: [
        {
          type: /sankey|flow/i.test(title) ? 'sankey' : 'graph',
          layout: /sankey|flow/i.test(title) ? undefined : 'force',
          roam: false,
          data: [
            { name: t('aiTicketOs.charts.intake') },
            { name: t('aiTicketOs.charts.aiTriage') },
            { name: t('aiTicketOs.charts.agent') },
            { name: t('aiTicketOs.charts.customer') },
            { name: t('aiTicketOs.charts.resolved') },
          ],
          links: [
            { source: t('aiTicketOs.charts.intake'), target: t('aiTicketOs.charts.aiTriage'), value: 42 },
            { source: t('aiTicketOs.charts.aiTriage'), target: t('aiTicketOs.charts.agent'), value: 28 },
            { source: t('aiTicketOs.charts.agent'), target: t('aiTicketOs.charts.customer'), value: 19 },
            { source: t('aiTicketOs.charts.customer'), target: t('aiTicketOs.charts.resolved'), value: 14 },
          ],
          lineStyle: { color: 'source', opacity: 0.28 },
          label: { color: chartLabelColor },
        },
      ],
    };
  }

  if (index === 1) {
    return {
      ...common,
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { color: chartTextColor } },
      series: [
        {
          type: 'pie',
          radius: ['48%', '72%'],
          center: ['50%', '44%'],
          data: [
            { name: t('aiTicketOs.charts.healthy'), value: 48 },
            { name: t('aiTicketOs.charts.watch'), value: 26 },
            { name: t('aiTicketOs.labels.atRisk'), value: 16 },
            { name: t('aiTicketOs.charts.critical'), value: 10 },
          ],
        },
      ],
    };
  }

  return {
    ...common,
    xAxis: {
      type: 'category',
      data: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
      axisLine: { lineStyle: { color: strongLineColor } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: softLineColor } },
    },
    series: [
      {
        name: title,
        type: index === 2 ? 'bar' : 'line',
        smooth: true,
        areaStyle: index === 0 ? { opacity: 0.18 } : undefined,
        data: [320, 420, 380, 520, 610, 740],
      },
      {
        name: t('aiTicketOs.charts.aiAssisted'),
        type: 'line',
        smooth: true,
        data: [180, 260, 310, 390, 460, 560],
      },
    ],
  };
}

function handleResize() {
  chartInstances.forEach((chart) => chart.resize());
}

watch(
  () => [route.path, locale.value],
  async () => {
    await nextTick();
    renderCharts();
  },
);

onMounted(async () => {
  await nextTick();
  renderCharts();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  disposeCharts();
});
</script>

<style scoped lang="scss">
.ai-ticket-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-width: 1180px;
  overflow: auto;
  color: var(--app-text);
}

.command-hero,
.glass-panel,
.smart-filter {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

:global(html.dark) .command-hero,
:global(html.dark) .glass-panel,
:global(html.dark) .smart-filter {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.035)),
    rgba(15, 23, 42, 0.72);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(22px);
}

.command-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 132px;
  padding: 22px 24px;
  overflow: hidden;
  border-radius: 8px;

  &__copy {
    min-width: 0;
  }

  &__eyebrow {
    color: var(--app-accent);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1 {
    margin: 8px 0 8px;
    color: var(--app-text);
    font-size: 32px;
    line-height: 1.08;
  }

  p {
    max-width: 980px;
    margin: 0;
    color: var(--app-text-secondary);
    font-size: 15px;
  }

  &__actions {
    display: flex;
    flex: 0 0 auto;
    gap: 10px;
  }
}

.smart-filter {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 180px 180px auto;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;

  :deep(.ant-input-affix-wrapper),
  :deep(.ant-select-selector) {
    color: var(--app-text);
    background: var(--app-surface-muted) !important;
    border-color: var(--app-border) !important;
    border-radius: 8px;
  }
}

.page-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;

  &__main,
  &__side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
}

.glass-panel {
  border-radius: 8px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  span {
    display: block;
    color: var(--app-accent);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0;
  }

  h2 {
    margin: 4px 0 0;
    color: var(--app-text);
    font-size: 18px;
  }

  &--compact {
    margin-bottom: 12px;

    h2 {
      font-size: 15px;
    }
  }
}

.command-panel,
.table-panel,
.side-panel,
.chart-card {
  padding: 16px;
}

.command-panel {
  &__body {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr);
    gap: 14px;
    align-items: start;

    h3 {
      margin: 0 0 8px;
      color: var(--app-text);
      font-size: 17px;
      line-height: 1.45;
    }

    p {
      margin: 0;
      color: var(--app-text-secondary);
      line-height: 1.65;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
  }
}

.copilot-orb {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  color: #ffffff;
  font-size: 25px;
  background: linear-gradient(135deg, var(--app-primary), var(--app-secondary));
  border-radius: 8px;
  box-shadow: 0 18px 36px rgba(79, 123, 255, 0.28);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.chart-card__canvas {
  width: 100%;
  height: 260px;
}

.table-panel {
  :deep(.ant-table) {
    color: var(--app-text);
    background: transparent;
  }

  :deep(.ant-table-thead > tr > th) {
    color: var(--app-text-secondary);
    background: var(--app-surface-muted);
    border-bottom-color: var(--app-border);
  }

  :deep(.ant-table-tbody > tr > td) {
    color: var(--app-text);
    background: rgba(255, 255, 255, 0.72);
    border-bottom-color: var(--app-border);
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: rgba(79, 123, 255, 0.08);
  }
}

.risk-pill,
.ai-score {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}

.risk-pill {
  &--low {
    color: #15803d;
    background: rgba(34, 197, 94, 0.14);
  }

  &--medium {
    color: #b45309;
    background: rgba(245, 158, 11, 0.14);
  }

  &--high {
    color: #b91c1c;
    background: rgba(239, 68, 68, 0.16);
  }
}

.ai-score {
  color: #1d4ed8;
  background: rgba(79, 123, 255, 0.16);
}

.health-list,
.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.health-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;

  &__dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;

    &--green {
      background: var(--app-success);
    }

    &--amber {
      background: var(--app-warning);
    }

    &--blue {
      background: var(--app-primary);
    }

    &--red {
      background: var(--app-danger);
    }
  }

  strong,
  small {
    display: block;
  }

  small {
    color: var(--app-text-secondary);
  }
}

.workflow-map {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.workflow-node {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: space-between;
  min-height: 92px;
  padding: 12px;
  color: var(--app-text);
  background: linear-gradient(135deg, rgba(79, 123, 255, 0.16), rgba(0, 229, 255, 0.06));
  border: 1px solid rgba(79, 123, 255, 0.22);
  border-radius: 8px;

  svg {
    color: var(--app-accent);
    font-size: 22px;
  }
}

.activity-event {
  padding: 10px 0;
  border-bottom: 1px solid var(--app-border);

  span {
    color: var(--app-accent);
    font-size: 12px;
    font-weight: 800;
  }

  p {
    margin: 4px 0 0;
    color: var(--app-text-secondary);
    line-height: 1.5;
  }
}

:global(html.dark) .table-panel {
  :deep(.ant-table-thead > tr > th) {
    background: rgba(255, 255, 255, 0.06);
  }

  :deep(.ant-table-tbody > tr > td) {
    background: rgba(255, 255, 255, 0.018);
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}

:global(html.dark) .risk-pill {
  &--low {
    color: #bbf7d0;
  }

  &--medium {
    color: #fde68a;
  }

  &--high {
    color: #fecaca;
  }
}

:global(html.dark) .ai-score {
  color: #bfdbfe;
}

@media (max-width: 1360px) {
  .ai-ticket-page {
    min-width: 980px;
  }

  .page-grid {
    grid-template-columns: 1fr;
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
