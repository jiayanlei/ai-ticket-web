<template>
  <div
    ref="screenRef"
    class="command-screen"
    :class="{
      'command-screen--fullscreen': isScreenFullscreen,
      'command-screen--embedded': !isScreenFullscreen,
      'command-screen--compact': isCompactLayout,
      'command-screen--stacked': isStackedLayout,
    }"
  >
    <header class="screen-header">
      <div class="screen-header__brand">
        <span class="ai-orbit" aria-hidden="true">
          <span>AI</span>
        </span>
        <div>
          <div class="brand-name">AI Ticket Ops</div>
          <div class="brand-subtitle">智能工单实时运营监控</div>
        </div>
      </div>

      <div class="screen-header__center">
        <div class="screen-kicker">REAL-TIME OPERATION COMMAND</div>
        <h1>AI智能工单分析指挥中心</h1>
      </div>

      <div class="screen-header__status">
        <div class="clock-block">
          <span class="clock-time">{{ currentTimeText }}</span>
          <span class="clock-date">{{ currentDateText }}</span>
        </div>
        <div class="status-pill">
          <span class="status-dot" />
          在线坐席 {{ mockDashboardData.header.onlineAgents }}
        </div>
        <div class="status-pill status-pill--cyan">
          <span class="refresh-indicator" />
          {{ refreshStatus }}
        </div>
        <button class="screen-action" type="button" :title="fullscreenButtonTitle" :aria-label="fullscreenButtonTitle" @click="toggleFullscreen">
          <FullscreenExitOutlined v-if="isScreenFullscreen" />
          <FullscreenOutlined v-else />
        </button>
      </div>
    </header>

    <main
      class="screen-grid"
      :class="{
        'screen-grid--fullscreen': isScreenFullscreen,
        'screen-grid--embedded': !isScreenFullscreen,
        'screen-grid--compact': isCompactLayout,
        'screen-grid--stacked': isStackedLayout,
      }"
    >
      <section class="screen-column screen-column--left" :class="{ 'is-fullscreen': showExtendedSidePanels, 'is-embedded': !showExtendedSidePanels }">
        <section class="screen-panel core-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">GLOBAL OVERVIEW</span>
              <h2>核心指标</h2>
            </div>
            <span class="panel-badge panel-badge--refresh" :class="{ 'is-module-refreshing': moduleRefreshing.overview }">
              {{ moduleRefreshing.overview ? '刷新中' : '5秒刷新' }}
            </span>
          </div>

          <div class="metric-grid">
            <article v-for="metric in mockDashboardData.coreMetrics" :key="metric.key" class="metric-card">
              <div class="metric-info">
                <span class="metric-title">{{ metric.label }}</span>
                <span class="metric-trend" :class="`metric-trend--${metric.trendType}`">
                  {{ metric.trendLabel }}
                </span>
              </div>
              <div class="metric-value-row" :class="{ 'is-changing': moduleRefreshing.overview }">
                <strong class="metric-value">{{ metric.value }}</strong>
                <small class="metric-unit">{{ metric.unit }}</small>
              </div>
            </article>
          </div>
        </section>

        <div v-if="showExtendedSidePanels" class="left-bottom-grid">
          <section class="screen-panel source-panel source-panel--compact">
            <div class="panel-heading">
              <div>
                <span class="panel-kicker">CHANNEL MIX</span>
                <h2>工单来源分布</h2>
              </div>
              <span class="panel-badge">Top3</span>
            </div>
            <div ref="sourceChartRef" class="source-chart" />
            <div class="source-legend">
              <div v-for="source in sourceDistributionPreview" :key="source.name" class="source-legend__item">
                <span :style="{ background: source.color }" />
                <strong>{{ source.name }}</strong>
                <em>{{ source.value }}件</em>
              </div>
            </div>
          </section>

          <section class="screen-panel ai-panel ai-panel--compact">
            <div class="panel-heading">
              <div>
                <span class="panel-kicker">AI ANALYSIS</span>
                <h2>AI分析概览</h2>
              </div>
              <span class="panel-badge panel-badge--purple panel-badge--refresh" :class="{ 'is-module-refreshing': moduleRefreshing.aiAnalysis }">
                {{ moduleRefreshing.aiAnalysis ? '刷新中' : '8秒刷新' }}
              </span>
            </div>

            <div class="ai-analysis-compact-list">
              <article
                v-for="item in mockDashboardData.aiOverview.stats"
                :key="item.key"
                class="ai-analysis-compact-item"
                :class="`ai-analysis-compact-item--${item.accent}`"
              >
                <div class="ai-analysis-compact-text">
                  <strong>{{ item.label }}</strong>
                  <em>{{ item.status }}</em>
                </div>
                <strong class="ai-analysis-compact-value" :class="{ 'is-changing': moduleRefreshing.aiAnalysis }">{{ item.value }}</strong>
              </article>
            </div>
          </section>
        </div>

        <section v-else class="screen-panel ai-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">AI ANALYSIS</span>
              <h2>AI分析概览</h2>
            </div>
            <span class="panel-badge panel-badge--purple panel-badge--refresh" :class="{ 'is-module-refreshing': moduleRefreshing.aiAnalysis }">
              {{ moduleRefreshing.aiAnalysis ? '刷新中' : '8秒刷新' }}
            </span>
          </div>

          <div class="ai-analysis-list">
            <article
              v-for="item in mockDashboardData.aiOverview.stats"
              :key="item.key"
              class="ai-analysis-item"
              :class="`ai-analysis-item--${item.accent}`"
            >
              <div class="ai-analysis-item__icon">
                <span>{{ item.badge }}</span>
              </div>
              <div class="ai-info">
                <strong class="ai-title">{{ item.label }}</strong>
                <em class="ai-desc">{{ item.description }}</em>
              </div>
              <div class="ai-value-wrap">
                <strong class="ai-value">{{ item.value }}</strong>
                <span class="ai-status">{{ item.status }}</span>
              </div>
              <div class="ai-progress" :style="{ '--progress': `${item.percent}%` }" />
            </article>
          </div>

        </section>
      </section>

      <section class="screen-column screen-column--center">
        <section class="screen-panel situation-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">LIVE SITUATION</span>
              <h2>实时总态势</h2>
            </div>
            <span class="panel-badge panel-badge--refresh" :class="{ 'is-module-refreshing': moduleRefreshing.liveSituation }">
              {{ moduleRefreshing.liveSituation ? '刷新中' : `压力指数 ${mockDashboardData.situation.pressureIndex}` }}
            </span>
          </div>

          <div class="situation-stage">
            <div class="situation-orbit">
              <div class="situation-orbit-map">
                <div class="orbit-ring orbit-ring--outer" />
                <div class="orbit-ring orbit-ring--middle" />
                <div class="orbit-ring orbit-ring--inner" />
                <div class="situation-core">
                  <span>压力指数</span>
                  <strong>{{ pressureScore }}</strong>
                  <em>{{ pressureLabel }}</em>
                </div>
                <article
                  v-for="node in mockDashboardData.opsConstellation"
                  :key="node.key"
                  class="constellation-node"
                  :class="`constellation-node--${node.level}`"
                  :style="{
                    '--node-x': `${node.x}%`,
                    '--node-y': `${node.y}%`,
                    '--node-color': node.color,
                    '--pulse-duration': `${node.pulse}s`,
                  }"
                >
                  <strong>{{ node.value }}</strong>
                  <span>{{ node.label }}</span>
                </article>
              </div>
            </div>

            <div class="situation-grid">
              <article v-for="item in mockDashboardData.situation.metrics" :key="item.key" class="situation-card">
                <span>{{ item.label }}</span>
                <strong :class="{ 'is-changing': moduleRefreshing.liveSituation }">{{ item.value }}</strong>
                <em>{{ item.unit }}</em>
              </article>
            </div>
          </div>
        </section>

        <section class="screen-panel trend-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">LAST 60 MINUTES</span>
              <h2>近1小时电话工单进入趋势</h2>
            </div>
            <span class="panel-badge panel-badge--cyan panel-badge--refresh" :class="{ 'is-module-refreshing': moduleRefreshing.trend }">
              {{ moduleRefreshing.trend ? '刷新中' : '6秒刷新' }}
            </span>
          </div>
          <div ref="trendChartRef" class="trend-chart" />
        </section>

        <section class="screen-panel flow-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">TICKET FLOW</span>
              <h2>工单流转态势</h2>
            </div>
            <span class="panel-badge panel-badge--refresh" :class="{ 'is-module-refreshing': moduleRefreshing.ticketFlow }">
              {{ moduleRefreshing.ticketFlow ? '刷新中' : '5秒刷新' }}
            </span>
          </div>

          <div class="flow-chain">
            <article v-for="step in mockDashboardData.flowSteps" :key="step.key" class="flow-node">
              <span class="flow-node__index">{{ step.index }}</span>
              <h3>{{ step.label }}</h3>
              <strong :class="{ 'is-changing': moduleRefreshing.ticketFlow }">{{ step.count }}</strong>
              <div class="flow-node__meta">
                <span>转化 {{ step.conversion }}</span>
                <span>{{ step.avgDuration }}</span>
              </div>
            </article>
          </div>
        </section>
      </section>

      <section class="screen-column screen-column--right">
        <section class="screen-panel queue-panel" :class="{ 'queue-panel--vip': hasVipWaiting }">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">PHONE QUEUE</span>
              <h2>实时电话工单进入排队情况</h2>
            </div>
            <span class="panel-badge panel-badge--warning panel-badge--refresh" :class="{ 'is-module-refreshing': moduleRefreshing.phoneQueue }">
              {{ moduleRefreshing.phoneQueue ? '刷新中' : '2秒刷新' }}
            </span>
          </div>

          <div class="queue-summary">
            <article v-for="item in queueSummaryList" :key="item.key" class="queue-summary__item" :class="item.level">
              <span>{{ item.label }}</span>
              <strong :class="{ 'is-changing': moduleRefreshing.phoneQueue }">{{ item.value }}</strong>
              <em>{{ item.unit }}</em>
            </article>
          </div>

          <div class="queue-distribution">
            <div v-for="queue in queueDistributionPreview" :key="queue.name" class="queue-bar-row">
              <div class="queue-bar-row__label">
                <span>{{ queue.name }}</span>
                <strong>{{ queue.count }}人</strong>
              </div>
              <div class="queue-bar">
                <i :class="{ 'queue-bar__fill--vip': queue.name.includes('VIP') }" :style="{ width: `${queue.percent}%` }" />
              </div>
            </div>
          </div>

          <div class="queue-table">
            <div class="queue-table__head">
              <span>来电时间</span>
              <span>来电号码</span>
              <span>进入队列</span>
              <span>等待</span>
              <span>状态</span>
            </div>
            <div class="queue-scroll">
              <div class="scroll-track">
                <div
                  v-for="entry in queueScrollRows"
                  :key="entry.loopKey"
                  class="queue-row"
                  :class="[getQueueRowClass(entry.waitingSeconds), { 'queue-row--new': entry.id === newestQueueEntryId }]"
                >
                  <span>{{ entry.incomingAt }}</span>
                  <span>{{ entry.phone }}</span>
                  <span>{{ entry.queueName }}</span>
                  <span>{{ formatWaiting(entry.waitingSeconds) }}</span>
                  <span>
                    <i :class="`status-tag status-tag--${entry.status}`">{{ queueStatusText[entry.status] }}</i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="screen-panel alert-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">RISK WARNING</span>
              <h2>高风险工单预警</h2>
            </div>
            <span class="panel-badge panel-badge--danger panel-badge--refresh" :class="{ 'is-module-refreshing': moduleRefreshing.riskWarning }">
              {{ moduleRefreshing.riskWarning ? '刷新中' : '4秒刷新' }}
            </span>
          </div>

          <div class="alert-scroll">
            <div class="scroll-track scroll-track--alert">
              <article v-for="alert in riskScrollRows" :key="alert.loopKey" class="risk-item" :class="`risk-item--${alert.level}`">
                <div>
                  <h3>{{ alert.title }}</h3>
                  <span>{{ alert.ticketNo }} · {{ alert.department }}</span>
                </div>
                <div class="risk-item__right">
                  <strong>{{ riskLevelText[alert.level] }}</strong>
                  <em>{{ alert.createdAt }}</em>
                </div>
              </article>
            </div>
          </div>

          <div class="insight-strip">
            <div class="intent-radar">
              <div class="sub-heading">意图热力</div>
              <div class="intent-radar__grid">
                <article
                  v-for="intent in mockDashboardData.intentHotspots"
                  :key="intent.key"
                  class="intent-chip"
                  :style="{ '--heat': `${intent.heat}%`, '--intent-color': intent.color }"
                >
                  <span>{{ intent.label }}</span>
                  <strong>{{ intent.count }}</strong>
                </article>
              </div>
            </div>

            <div class="sla-lanes">
              <div class="sub-heading">SLA 航道</div>
              <article v-for="lane in mockDashboardData.slaLanes" :key="lane.key" class="sla-lane" :class="`sla-lane--${lane.status}`">
                <div>
                  <strong>{{ lane.label }}</strong>
                  <span>{{ lane.owner }}</span>
                </div>
                <div class="sla-lane__bar">
                  <i :style="{ width: `${lane.percent}%` }" />
                </div>
                <em>{{ lane.remaining }}</em>
              </article>
            </div>
          </div>
        </section>

        <section v-if="showDepartmentRanking" class="screen-panel ranking-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">LOAD RANKING</span>
              <h2>部门待办排行</h2>
            </div>
            <span class="panel-badge">负载监测</span>
          </div>

          <div class="ranking-list">
            <article v-for="(item, index) in mockDashboardData.departmentRanking" :key="item.name" class="ranking-row">
              <span class="ranking-index">{{ index + 1 }}</span>
              <div class="ranking-main">
                <div>
                  <strong>{{ item.name }}</strong>
                  <em>{{ item.owner }}</em>
                </div>
                <div class="ranking-progress">
                  <i :style="{ width: `${item.percent}%` }" />
                </div>
              </div>
              <div class="ranking-value">
                <strong>{{ item.todoCount }}</strong>
                <span :class="item.trendType">{{ item.trend }}</span>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { WORKBENCH_PATH } from '@/router/constants';

type TrendType = 'up' | 'down' | 'flat';
type QueueStatus = 'waiting' | 'answered' | 'ticketed';
type RiskLevel = 'high' | 'urgent' | 'timeout' | 'abnormal';
type ConstellationLevel = 'stable' | 'watch' | 'hot';
type SlaStatus = 'safe' | 'watch' | 'danger';

const CLOCK_REFRESH_INTERVAL_MS = 1000;
const OVERVIEW_REFRESH_INTERVAL_MS = 5000;
const LIVE_SITUATION_REFRESH_INTERVAL_MS = 3000;
const PHONE_QUEUE_REFRESH_INTERVAL_MS = 2000;
const TREND_REFRESH_INTERVAL_MS = 6000;
const TICKET_FLOW_REFRESH_INTERVAL_MS = 5000;
const AI_ANALYSIS_REFRESH_INTERVAL_MS = 8000;
const RISK_WARNING_REFRESH_INTERVAL_MS = 4000;
const EXTENDED_SIDE_PANEL_MIN_WIDTH = 1280;
const STACKED_LAYOUT_MAX_WIDTH = 1180;
const COMPACT_HEIGHT_MAX = 760;

interface CoreMetric {
  key: string;
  label: string;
  value: number;
  unit: string;
  trendLabel: string;
  trendType: TrendType;
}

interface SourceDistributionItem {
  name: string;
  value: number;
  color: string;
}

interface AiOverviewStat {
  key: string;
  label: string;
  value: string;
  percent: number;
  description: string;
  badge: string;
  status: string;
  accent: 'cyan' | 'blue' | 'violet' | 'amber';
}

interface SituationMetric {
  key: string;
  label: string;
  value: string;
  unit: string;
}

interface OpsConstellationNode {
  key: string;
  label: string;
  value: string;
  level: ConstellationLevel;
  x: number;
  y: number;
  color: string;
  pulse: number;
}

interface TrendSeries {
  labels: string[];
  inbound: number[];
  generated: number[];
  connected: number[];
  abandoned: number[];
}

interface FlowStep {
  key: string;
  index: string;
  label: string;
  count: number;
  conversion: string;
  avgDuration: string;
}

interface QueueDistributionItem {
  name: string;
  count: number;
  percent: number;
}

interface QueueEntry {
  id: string;
  incomingAt: string;
  phone: string;
  queueName: string;
  waitingSeconds: number;
  status: QueueStatus;
}

interface QueueEntryLoop extends QueueEntry {
  loopKey: string;
}

interface RiskAlert {
  id: string;
  title: string;
  ticketNo: string;
  level: RiskLevel;
  department: string;
  createdAt: string;
}

interface RiskAlertLoop extends RiskAlert {
  loopKey: string;
}

interface IntentHotspot {
  key: string;
  label: string;
  count: number;
  heat: number;
  color: string;
}

interface SlaLane {
  key: string;
  label: string;
  owner: string;
  percent: number;
  remaining: string;
  status: SlaStatus;
}

const mockDashboardData = reactive({
  header: {
    onlineAgents: 128,
  },
  coreMetrics: [
    { key: 'todayTotal', label: '今日来单总量', value: 4268, unit: '件', trendLabel: '同比 +18.6%', trendType: 'up' },
    { key: 'accepted', label: '今日已受理', value: 3896, unit: '件', trendLabel: '环比 +9.2%', trendType: 'up' },
    { key: 'resolved', label: '今日已解决', value: 3214, unit: '件', trendLabel: '环比 +12.4%', trendType: 'up' },
    { key: 'processing', label: '当前处理中', value: 472, unit: '件', trendLabel: '较峰值 -7.8%', trendType: 'down' },
    { key: 'timeout', label: '超时工单数', value: 36, unit: '件', trendLabel: '环比 +4件', trendType: 'up' },
    { key: 'aiAnalyzed', label: 'AI已分析数', value: 4018, unit: '件', trendLabel: '覆盖率 94.1%', trendType: 'flat' },
    { key: 'highRisk', label: '高风险工单数', value: 27, unit: '件', trendLabel: '需立即跟进', trendType: 'up' },
    { key: 'onlineAgents', label: '在线坐席数', value: 128, unit: '人', trendLabel: '空闲 31人', trendType: 'flat' },
  ] satisfies CoreMetric[],
  sourceDistribution: [
    { name: '电话工单', value: 2146, color: '#2ff8ff' },
    { name: 'Web工单', value: 826, color: '#1677ff' },
    { name: '企业微信', value: 548, color: '#6c5cff' },
    { name: '邮件', value: 316, color: '#29d98f' },
    { name: '人工录入', value: 278, color: '#ffb020' },
    { name: '移动端', value: 236, color: '#ff5c93' },
    { name: '自助终端', value: 184, color: '#9dff6a' },
    { name: '智能外呼', value: 126, color: '#ff7b54' },
  ] satisfies SourceDistributionItem[],
  aiOverview: {
    stats: [
      {
        key: 'classifyRate',
        label: 'AI自动分类成功率',
        value: '97.0%',
        percent: 97,
        description: '12类问题自动归档',
        badge: 'AI',
        status: '模型在线',
        accent: 'cyan',
      },
      {
        key: 'confidence',
        label: '平均识别置信度',
        value: '92.0%',
        percent: 92,
        description: '语音转写与意图识别',
        badge: 'CF',
        status: '识别稳定',
        accent: 'blue',
      },
      {
        key: 'duplicate',
        label: '疑似重复工单数',
        value: '69',
        percent: 69,
        description: '已合并建议 44 条',
        badge: 'DU',
        status: '需复核',
        accent: 'violet',
      },
      {
        key: 'upgrade',
        label: '建议升级技术支持数',
        value: '23',
        percent: 46,
        description: '涉及核心系统故障',
        badge: 'TS',
        status: '重点关注',
        accent: 'amber',
      },
    ] satisfies AiOverviewStat[],
  },
  situation: {
    pressureIndex: '76 / 100',
    metrics: [
      { key: 'queued', label: '当前排队总量', value: '86', unit: '件' },
      { key: 'processing', label: '当前处理中', value: '472', unit: '件' },
      { key: 'pending', label: '当前挂起', value: '58', unit: '件' },
      { key: 'unassigned', label: '当前待分派', value: '103', unit: '件' },
      { key: 'peak', label: '今日呼入峰值', value: '612', unit: '通/小时' },
      { key: 'avgDuration', label: '平均处理时长', value: '18.7', unit: '分钟' },
    ] satisfies SituationMetric[],
  },
  opsConstellation: [
    { key: 'voice', label: '语音识别', value: '92%', level: 'stable', x: 18, y: 25, color: '#2ff8ff', pulse: 4.8 },
    { key: 'vip', label: 'VIP呼入', value: '9', level: 'hot', x: 82, y: 25, color: '#ffb020', pulse: 3.2 },
    { key: 'robot', label: '机器人接管', value: '1.8k', level: 'stable', x: 82, y: 65, color: '#29d98f', pulse: 5.2 },
    { key: 'dispatch', label: '智能分派', value: '87%', level: 'watch', x: 18, y: 65, color: '#6c5cff', pulse: 4.1 },
    { key: 'sentiment', label: '负向情绪', value: '31', level: 'hot', x: 50, y: 6, color: '#ff5c93', pulse: 3.6 },
    { key: 'knowledge', label: '知识命中', value: '94%', level: 'stable', x: 50, y: 94, color: '#9dff6a', pulse: 5.6 },
  ] satisfies OpsConstellationNode[],
  trend: {
    labels: ['15:50', '15:55', '16:00', '16:05', '16:10', '16:15', '16:20', '16:25', '16:30', '16:35', '16:40', '16:45'],
    inbound: [188, 204, 196, 238, 242, 286, 301, 318, 336, 356, 382, 398],
    generated: [162, 178, 171, 206, 211, 254, 272, 288, 297, 318, 344, 361],
    connected: [151, 165, 158, 194, 198, 232, 246, 268, 274, 296, 317, 335],
    abandoned: [9, 11, 10, 12, 14, 17, 18, 20, 24, 26, 29, 31],
  } satisfies TrendSeries,
  flowSteps: [
    { key: 'incoming', index: '01', label: '电话进入', count: 398, conversion: '100%', avgDuration: '实时' },
    { key: 'queue', index: '02', label: '排队中', count: 86, conversion: '78.5%', avgDuration: '42秒' },
    { key: 'answer', index: '03', label: '坐席接听', count: 335, conversion: '84.2%', avgDuration: '8秒' },
    { key: 'ticket', index: '04', label: '生成工单', count: 361, conversion: '90.7%', avgDuration: '22秒' },
    { key: 'ai', index: '05', label: 'AI自动分析', count: 347, conversion: '96.1%', avgDuration: '3秒' },
    { key: 'dispatch', index: '06', label: '分派处理', count: 304, conversion: '87.6%', avgDuration: '2分10秒' },
    { key: 'done', index: '07', label: '处理完成', count: 257, conversion: '84.5%', avgDuration: '18.7分' },
  ] satisfies FlowStep[],
  queueSummary: {
    queued: 86,
    calling: 97,
    idleAgents: 31,
    avgWaitingSeconds: 42,
    maxWaitingSeconds: 156,
    abandonRate: '4.8%',
  },
  queueDistribution: [
    { name: '一级队列', count: 38, percent: 88 },
    { name: '技术支持队列', count: 27, percent: 63 },
    { name: 'VIP队列', count: 9, percent: 48 },
    { name: '售后队列', count: 12, percent: 56 },
    { name: '华东区域队列', count: 18, percent: 58 },
    { name: 'AI复核队列', count: 7, percent: 32 },
  ] satisfies QueueDistributionItem[],
  queueEntries: [
    { id: 'q-001', incomingAt: '16:45:02', phone: '138****0921', queueName: 'VIP队列', waitingSeconds: 156, status: 'waiting' },
    { id: 'q-002', incomingAt: '16:45:15', phone: '186****7348', queueName: '技术支持队列', waitingSeconds: 124, status: 'waiting' },
    { id: 'q-003', incomingAt: '16:45:28', phone: '177****4186', queueName: '一级队列', waitingSeconds: 78, status: 'waiting' },
    { id: 'q-004', incomingAt: '16:45:36', phone: '139****6672', queueName: '售后队列', waitingSeconds: 64, status: 'answered' },
    { id: 'q-005', incomingAt: '16:45:48', phone: '151****8057', queueName: '一级队列', waitingSeconds: 51, status: 'waiting' },
    { id: 'q-006', incomingAt: '16:45:59', phone: '189****2236', queueName: '技术支持队列', waitingSeconds: 39, status: 'ticketed' },
    { id: 'q-007', incomingAt: '16:46:11', phone: '133****5109', queueName: 'VIP队列', waitingSeconds: 34, status: 'waiting' },
    { id: 'q-008', incomingAt: '16:46:23', phone: '158****7490', queueName: '一级队列', waitingSeconds: 26, status: 'waiting' },
    { id: 'q-009', incomingAt: '16:46:35', phone: '195****3088', queueName: '华东区域队列', waitingSeconds: 22, status: 'waiting' },
    { id: 'q-010', incomingAt: '16:46:42', phone: '137****6192', queueName: 'AI复核队列', waitingSeconds: 18, status: 'answered' },
    { id: 'q-011', incomingAt: '16:46:53', phone: '152****7741', queueName: '售后队列', waitingSeconds: 12, status: 'waiting' },
    { id: 'q-012', incomingAt: '16:47:04', phone: '188****4316', queueName: '技术支持队列', waitingSeconds: 8, status: 'waiting' },
  ] satisfies QueueEntry[],
  riskAlerts: [
    { id: 'r-001', title: '核心系统无法登录且多次回拨未接通', ticketNo: 'WO202605120381', level: 'urgent', department: '平台运维部', createdAt: '16:42' },
    { id: 'r-002', title: 'VIP客户连续投诉发票同步失败', ticketNo: 'WO202605120367', level: 'high', department: '财务系统组', createdAt: '16:37' },
    { id: 'r-003', title: '超时未处理：录音文件缺失影响质检', ticketNo: 'WO202605120329', level: 'timeout', department: '客户联络中心', createdAt: '16:21' },
    { id: 'r-004', title: 'AI识别异常：同号码重复生成工单', ticketNo: 'WO202605120288', level: 'abnormal', department: 'AI中台', createdAt: '16:08' },
    { id: 'r-005', title: '售后退款链路失败出现重复投诉', ticketNo: 'WO202605120251', level: 'high', department: '售后服务部', createdAt: '15:58' },
    { id: 'r-006', title: '知识库命中低：新政策问题集中涌入', ticketNo: 'WO202605120244', level: 'abnormal', department: '知识运营组', createdAt: '15:47' },
    { id: 'r-007', title: '区域网络波动导致工单重复提交', ticketNo: 'WO202605120219', level: 'high', department: '区域运维组', createdAt: '15:34' },
  ] satisfies RiskAlert[],
  intentHotspots: [
    { key: 'login', label: '登录异常', count: 326, heat: 94, color: '#ff5c93' },
    { key: 'invoice', label: '发票同步', count: 218, heat: 76, color: '#ffb020' },
    { key: 'refund', label: '退款进度', count: 184, heat: 62, color: '#2ff8ff' },
    { key: 'permission', label: '权限开通', count: 151, heat: 54, color: '#6c5cff' },
    { key: 'device', label: '设备故障', count: 128, heat: 48, color: '#29d98f' },
    { key: 'policy', label: '政策咨询', count: 96, heat: 35, color: '#9dff6a' },
  ] satisfies IntentHotspot[],
  slaLanes: [
    { key: 'vip', label: 'VIP专线', owner: '客户成功部', percent: 86, remaining: '14m', status: 'danger' },
    { key: 'payment', label: '支付链路', owner: '财务系统组', percent: 68, remaining: '31m', status: 'watch' },
    { key: 'ops', label: '平台故障', owner: '平台运维部', percent: 58, remaining: '46m', status: 'watch' },
    { key: 'routine', label: '常规咨询', owner: '客户联络中心', percent: 32, remaining: '2h', status: 'safe' },
  ] satisfies SlaLane[],
  departmentRanking: [
    { name: '平台运维部', owner: '待办压力高', todoCount: 86, percent: 94, trend: '+12', trendType: 'up' },
    { name: '客户联络中心', owner: '通话量峰值', todoCount: 74, percent: 82, trend: '+8', trendType: 'up' },
    { name: '售后服务部', owner: '投诉集中', todoCount: 52, percent: 64, trend: '-5', trendType: 'down' },
    { name: '财务系统组', owner: '发票问题', todoCount: 39, percent: 51, trend: '+3', trendType: 'up' },
    { name: 'AI中台', owner: '识别复核', todoCount: 23, percent: 38, trend: '-2', trendType: 'down' },
  ],
});

const route = useRoute();
const router = useRouter();
const currentTime = ref(new Date());
const refreshStatus = ref('自动刷新中');
const moduleRefreshing = reactive({
  overview: false,
  liveSituation: false,
  phoneQueue: false,
  trend: false,
  ticketFlow: false,
  aiAnalysis: false,
  riskWarning: false,
});
const viewportWidth = ref(getViewportWidth());
const viewportHeight = ref(getViewportHeight());
const isScreenFullscreen = ref(false);
const trendData = ref<TrendSeries>({
  labels: [...mockDashboardData.trend.labels],
  inbound: [...mockDashboardData.trend.inbound],
  generated: [...mockDashboardData.trend.generated],
  connected: [...mockDashboardData.trend.connected],
  abandoned: [...mockDashboardData.trend.abandoned],
});
const queueEntries = ref<QueueEntry[]>(mockDashboardData.queueEntries.map((item) => ({ ...item })));
const newestQueueEntryId = ref(queueEntries.value[0]?.id ?? '');
const screenRef = ref<HTMLDivElement>();
const sourceChartRef = ref<HTMLDivElement>();
const trendChartRef = ref<HTMLDivElement>();
const isFullscreenEntry = computed(() => route.query.fullscreen === '1');
let sourceChart: echarts.ECharts | undefined;
let trendChart: echarts.ECharts | undefined;
const timerMap: {
  clockTimer?: ReturnType<typeof setInterval>;
  overviewTimer?: ReturnType<typeof setInterval>;
  liveSituationTimer?: ReturnType<typeof setInterval>;
  phoneQueueTimer?: ReturnType<typeof setInterval>;
  trendTimer?: ReturnType<typeof setInterval>;
  ticketFlowTimer?: ReturnType<typeof setInterval>;
  aiAnalysisTimer?: ReturnType<typeof setInterval>;
  riskWarningTimer?: ReturnType<typeof setInterval>;
} = {};
let screenResizeObserver: ResizeObserver | undefined;
let queueSequence = mockDashboardData.queueEntries.length;
let ticketSequence = 390;

const queueStatusText: Record<QueueStatus, string> = {
  waiting: '排队中',
  answered: '已接听',
  ticketed: '已转工单',
};

const riskLevelText: Record<RiskLevel, string> = {
  high: '高风险',
  urgent: '紧急',
  timeout: '超时',
  abnormal: 'AI异常',
};

const currentTimeText = computed(() =>
  currentTime.value.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }),
);
const currentDateText = computed(() => {
  const weekText = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][currentTime.value.getDay()];
  const dateText = currentTime.value.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return `${dateText} ${weekText}`;
});
const fullscreenButtonTitle = computed(() => (isScreenFullscreen.value ? '退出全屏' : '全屏展示'));
const pressureScore = computed(() => mockDashboardData.situation.pressureIndex.split('/')[0].trim());
const pressureLabel = computed(() => {
  const score = Number(pressureScore.value);
  if (score >= 85) {
    return '红色预警';
  }
  if (score >= 72) {
    return '高压运行';
  }
  if (score >= 60) {
    return '繁忙稳定';
  }
  return '平稳运行';
});
const isCompactLayout = computed(
  () => !isScreenFullscreen.value || viewportWidth.value < EXTENDED_SIDE_PANEL_MIN_WIDTH || viewportHeight.value < COMPACT_HEIGHT_MAX,
);
const isStackedLayout = computed(() => viewportWidth.value < STACKED_LAYOUT_MAX_WIDTH);
const showExtendedSidePanels = computed(
  () => isScreenFullscreen.value && viewportWidth.value >= EXTENDED_SIDE_PANEL_MIN_WIDTH && viewportHeight.value >= COMPACT_HEIGHT_MAX,
);
const showDepartmentRanking = false;
const sourceDistributionPreview = computed(() => mockDashboardData.sourceDistribution.slice(0, showExtendedSidePanels.value ? 4 : 3));
const queueDistributionPreview = computed(() => mockDashboardData.queueDistribution.slice(0, isCompactLayout.value ? 3 : 5));

const queueSummaryList = computed(() => [
  { key: 'queued', label: '当前排队数', value: mockDashboardData.queueSummary.queued, unit: '通', level: 'is-hot' },
  { key: 'calling', label: '当前通话中', value: mockDashboardData.queueSummary.calling, unit: '通', level: '' },
  { key: 'idleAgents', label: '空闲坐席数', value: mockDashboardData.queueSummary.idleAgents, unit: '人', level: 'is-good' },
  {
    key: 'avgWaitingSeconds',
    label: '平均等待时长',
    value: formatWaiting(mockDashboardData.queueSummary.avgWaitingSeconds),
    unit: '',
    level: '',
  },
  {
    key: 'maxWaitingSeconds',
    label: '最长等待时长',
    value: formatWaiting(mockDashboardData.queueSummary.maxWaitingSeconds),
    unit: '',
    level: 'is-danger',
  },
  { key: 'abandonRate', label: '放弃率', value: mockDashboardData.queueSummary.abandonRate, unit: '', level: 'is-warning' },
]);

const hasVipWaiting = computed(() => queueEntries.value.some((item) => item.queueName.includes('VIP') && item.status === 'waiting'));
const queueScrollRows = computed<QueueEntryLoop[]>(() =>
  [...queueEntries.value, ...queueEntries.value].map((item, index) => ({
    ...item,
    loopKey: `${item.id}-${index}`,
  })),
);
const riskScrollRows = computed<RiskAlertLoop[]>(() =>
  [...mockDashboardData.riskAlerts, ...mockDashboardData.riskAlerts].map((item, index) => ({
    ...item,
    loopKey: `${item.id}-${index}`,
  })),
);

onMounted(() => {
  syncViewportSize();
  isScreenFullscreen.value = Boolean(document.fullscreenElement);
  initCharts();
  startModuleRefreshTimers();
  window.addEventListener('resize', handleWindowResize);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('keydown', handleFullscreenShortcut);
  if (screenRef.value && typeof ResizeObserver !== 'undefined') {
    screenResizeObserver = new ResizeObserver(scheduleResizeCharts);
    screenResizeObserver.observe(screenRef.value);
  }
  scheduleResizeCharts();
  if (shouldEnterFullscreen()) {
    void enterFullscreen();
  }
});

onBeforeUnmount(() => {
  Object.values(timerMap).forEach((timer) => {
    if (timer) {
      window.clearInterval(timer);
    }
  });
  window.removeEventListener('resize', handleWindowResize);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('keydown', handleFullscreenShortcut);
  screenResizeObserver?.disconnect();
  sourceChart?.dispose();
  trendChart?.dispose();
});

async function toggleFullscreen() {
  if (isScreenFullscreen.value) {
    if (isFullscreenEntry.value) {
      await exitFullscreenToWorkbench();
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }
    isScreenFullscreen.value = false;
    scheduleResizeCharts();
    return;
  }

  await enterFullscreen();
}

async function enterFullscreen() {
  isScreenFullscreen.value = true;
  scheduleResizeCharts();
  await screenRef.value?.requestFullscreen?.().catch(() => undefined);
}

async function exitFullscreenToWorkbench() {
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => undefined);
  }
  isScreenFullscreen.value = false;
  scheduleResizeCharts();
  router.push(WORKBENCH_PATH);
}

function shouldEnterFullscreen() {
  return isFullscreenEntry.value;
}

function handleFullscreenChange() {
  isScreenFullscreen.value = isFullscreenEntry.value
    ? Boolean(document.fullscreenElement)
    : document.fullscreenElement === screenRef.value;
  if (!isScreenFullscreen.value && isFullscreenEntry.value) {
    void router.push(WORKBENCH_PATH);
    return;
  }

  scheduleResizeCharts();
}

function handleWindowResize() {
  syncViewportSize();
  scheduleResizeCharts();
}

function handleFullscreenShortcut(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !isScreenFullscreen.value) {
    return;
  }

  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => {
      isScreenFullscreen.value = false;
      scheduleResizeCharts();
    });
    return;
  }

  if (isFullscreenEntry.value) {
    void router.push(WORKBENCH_PATH);
    return;
  }

  isScreenFullscreen.value = false;
  scheduleResizeCharts();
}

function scheduleResizeCharts() {
  nextTick(() => {
    syncChartsForLayout();
    resizeCharts();
    window.setTimeout(() => {
      syncChartsForLayout();
      resizeCharts();
    }, 120);
  });
}

function initCharts() {
  syncChartsForLayout();
}

function syncChartsForLayout() {
  if (sourceChartRef.value) {
    if (!sourceChart || sourceChart.getDom() !== sourceChartRef.value) {
      sourceChart?.dispose();
      sourceChart = echarts.init(sourceChartRef.value);
    }
    renderSourceChart();
  } else if (sourceChart) {
    sourceChart.dispose();
    sourceChart = undefined;
  }

  if (trendChartRef.value) {
    if (!trendChart || trendChart.getDom() !== trendChartRef.value) {
      trendChart?.dispose();
      trendChart = echarts.init(trendChartRef.value);
    }
    renderTrendChart();
  }
}

function renderSourceChart() {
  sourceChart?.setOption({
    color: mockDashboardData.sourceDistribution.map((item) => item.color),
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(5, 16, 36, 0.92)',
      borderColor: 'rgba(47, 248, 255, 0.32)',
      textStyle: { color: '#d7f8ff' },
    },
    series: [
      {
        name: '工单来源',
        type: 'pie',
        radius: ['46%', '68%'],
        center: ['50%', '48%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: '#071830',
          borderWidth: 3,
        },
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        data: mockDashboardData.sourceDistribution.map((item) => ({ name: item.name, value: item.value })),
      },
    ],
  });
}

function renderTrendChart() {
  const axisTextColor = '#8db7d7';
  const gridLineColor = 'rgba(91, 200, 255, 0.12)';

  trendChart?.setOption({
    color: ['#2ff8ff', '#1677ff', '#29d98f', '#ff7b54'],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(5, 16, 36, 0.94)',
      borderColor: 'rgba(47, 248, 255, 0.36)',
      textStyle: { color: '#d7f8ff' },
    },
    legend: {
      top: 0,
      right: 8,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: axisTextColor },
      data: ['呼入总量', '成功生成工单量', '接通量', '放弃量'],
    },
    grid: {
      left: 42,
      right: 18,
      top: 42,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: gridLineColor } },
      axisLabel: { color: axisTextColor, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      minInterval: 20,
      axisLabel: { color: axisTextColor },
      splitLine: { lineStyle: { color: gridLineColor, type: 'dashed' } },
    },
    series: [
      createLineSeries('呼入总量', trendData.value.inbound, '#2ff8ff'),
      createLineSeries('成功生成工单量', trendData.value.generated, '#1677ff'),
      createLineSeries('接通量', trendData.value.connected, '#29d98f'),
      createLineSeries('放弃量', trendData.value.abandoned, '#ff7b54', false),
    ],
  });
}

function createLineSeries(name: string, data: number[], color: string, showArea = true) {
  return {
    name,
    type: 'line',
    smooth: true,
    showSymbol: false,
    lineStyle: {
      width: name === '呼入总量' ? 3 : 2,
      color,
    },
    areaStyle: showArea
      ? {
          opacity: 0.18,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color },
            { offset: 1, color: 'rgba(6, 21, 46, 0)' },
          ]),
        }
      : undefined,
    data,
  };
}

function startModuleRefreshTimers() {
  timerMap.clockTimer = window.setInterval(refreshClockData, CLOCK_REFRESH_INTERVAL_MS);
  timerMap.overviewTimer = window.setInterval(refreshOverviewData, OVERVIEW_REFRESH_INTERVAL_MS);
  timerMap.liveSituationTimer = window.setInterval(refreshLiveSituationData, LIVE_SITUATION_REFRESH_INTERVAL_MS);
  timerMap.phoneQueueTimer = window.setInterval(refreshPhoneQueueData, PHONE_QUEUE_REFRESH_INTERVAL_MS);
  timerMap.trendTimer = window.setInterval(refreshTrendData, TREND_REFRESH_INTERVAL_MS);
  timerMap.ticketFlowTimer = window.setInterval(refreshTicketFlowData, TICKET_FLOW_REFRESH_INTERVAL_MS);
  timerMap.aiAnalysisTimer = window.setInterval(refreshAiAnalysisData, AI_ANALYSIS_REFRESH_INTERVAL_MS);
  timerMap.riskWarningTimer = window.setInterval(refreshRiskWarningData, RISK_WARNING_REFRESH_INTERVAL_MS);
}

function refreshClockData() {
  currentTime.value = new Date();
}

function refreshOverviewData() {
  flashModuleRefresh('overview');
  updateCoreSnapshot();
}

function refreshLiveSituationData() {
  flashModuleRefresh('liveSituation');
  updateSituationSnapshot();
  updateConstellationSnapshot();
}

function refreshPhoneQueueData() {
  currentTime.value = new Date();
  flashModuleRefresh('phoneQueue');
  updateQueueSnapshot();
}

function refreshTrendData() {
  currentTime.value = new Date();
  flashModuleRefresh('trend');
  trendData.value = {
    ...trendData.value,
    labels: [...trendData.value.labels.slice(1), formatTrendLabel(currentTime.value)],
    inbound: shiftTrend(trendData.value.inbound, 18, 420),
    generated: shiftTrend(trendData.value.generated, 12, 385),
    connected: shiftTrend(trendData.value.connected, 10, 360),
    abandoned: shiftTrend(trendData.value.abandoned, 2, 42),
  };
  renderTrendChart();
}

function refreshTicketFlowData() {
  flashModuleRefresh('ticketFlow');
  updateFlowSnapshot();
}

function refreshAiAnalysisData() {
  flashModuleRefresh('aiAnalysis');
  updateAiAnalysisSnapshot();
}

function refreshRiskWarningData() {
  flashModuleRefresh('riskWarning');
  updateRiskAlerts();
  updateInsightSnapshot();
}

function flashModuleRefresh(module: keyof typeof moduleRefreshing) {
  moduleRefreshing[module] = true;
  window.setTimeout(() => {
    moduleRefreshing[module] = false;
  }, 720);
}

function shiftTrend(values: number[], deltaRange: number, maxValue: number) {
  const nextValue = Math.min(maxValue, Math.max(0, values[values.length - 1] + Math.round(Math.random() * deltaRange - deltaRange / 3)));
  return [...values.slice(1), nextValue];
}

function updateQueueSnapshot() {
  const queued = clamp(mockDashboardData.queueSummary.queued + randomInt(-3, 3), 68, 116);
  const calling = clamp(mockDashboardData.queueSummary.calling + randomInt(-2, 2), 80, 126);
  const onlineAgents = clamp(mockDashboardData.header.onlineAgents + randomInt(-2, 3), 116, 142);
  const idleAgents = clamp(onlineAgents - calling + randomInt(-2, 2), 18, 48);
  const avgWaitingSeconds = clamp(mockDashboardData.queueSummary.avgWaitingSeconds + randomInt(-4, 8), 28, 98);
  const maxWaitingSeconds = clamp(Math.max(avgWaitingSeconds + randomInt(30, 86), mockDashboardData.queueSummary.maxWaitingSeconds + randomInt(-10, 16)), 92, 186);

  mockDashboardData.header.onlineAgents = onlineAgents;
  mockDashboardData.queueSummary.queued = queued;
  mockDashboardData.queueSummary.calling = calling;
  mockDashboardData.queueSummary.idleAgents = idleAgents;
  mockDashboardData.queueSummary.avgWaitingSeconds = avgWaitingSeconds;
  mockDashboardData.queueSummary.maxWaitingSeconds = maxWaitingSeconds;
  mockDashboardData.queueSummary.abandonRate = `${(4.2 + Math.random() * 1.6).toFixed(1)}%`;
  mockDashboardData.queueDistribution = buildQueueDistribution(queued);

  const nextEntry = createQueueEntry();
  newestQueueEntryId.value = nextEntry.id;
  queueEntries.value = [
    nextEntry,
    ...queueEntries.value
      .map((item, index) => {
        const status = getNextQueueStatus(item.status, index);
        return {
          ...item,
          status,
          waitingSeconds:
            status === 'waiting'
              ? clamp(item.waitingSeconds + Math.round(PHONE_QUEUE_REFRESH_INTERVAL_MS / 1000), 0, 220)
              : Math.max(item.waitingSeconds - randomInt(5, 13), 0),
        };
      })
      .filter((item) => item.status === 'waiting' || item.waitingSeconds > 8),
  ].slice(0, 10);
}

function updateCoreSnapshot() {
  const todayDelta = randomInt(8, 24);
  updateCoreMetric('todayTotal', mockDashboardData.coreMetrics[0].value + todayDelta, `同比 +${(18 + Math.random() * 2).toFixed(1)}%`, 'up');
  updateCoreMetric('accepted', mockDashboardData.coreMetrics[1].value + randomInt(5, 18), `环比 +${(8.4 + Math.random() * 1.8).toFixed(1)}%`, 'up');
  updateCoreMetric('resolved', mockDashboardData.coreMetrics[2].value + randomInt(4, 14), `环比 +${(11 + Math.random() * 2).toFixed(1)}%`, 'up');
  updateCoreMetric('processing', clamp(mockDashboardData.coreMetrics[3].value + randomInt(-8, 9), 420, 530), '较峰值 -7.8%', 'down');
  updateCoreMetric('timeout', clamp(mockDashboardData.coreMetrics[4].value + randomInt(-1, 2), 28, 46), `环比 +${randomInt(2, 6)}件`, 'up');
  updateCoreMetric('aiAnalyzed', mockDashboardData.coreMetrics[5].value + Math.max(todayDelta - randomInt(1, 5), 1), `覆盖率 ${(93.4 + Math.random() * 2).toFixed(1)}%`, 'flat');
  updateCoreMetric('highRisk', clamp(mockDashboardData.coreMetrics[6].value + randomInt(-1, 2), 22, 35), '需立即跟进', 'up');
  updateCoreMetric('onlineAgents', mockDashboardData.header.onlineAgents, `空闲 ${mockDashboardData.queueSummary.idleAgents}人`, 'flat');
}

function updateSituationSnapshot() {
  const queued = mockDashboardData.queueSummary.queued;
  const processing = getCoreMetricValue('processing');
  const highRisk = getCoreMetricValue('highRisk');
  const pressure = clamp(Math.round(queued * 0.45 + highRisk * 0.75 + mockDashboardData.queueSummary.avgWaitingSeconds * 0.32), 58, 92);

  mockDashboardData.situation.pressureIndex = `${pressure} / 100`;
  updateSituationMetric('queued', queued.toString());
  updateSituationMetric('processing', processing.toString());
  updateSituationMetric('pending', clamp(Number(mockDashboardData.situation.metrics[2].value) + randomInt(-2, 3), 46, 72).toString());
  updateSituationMetric('unassigned', clamp(Number(mockDashboardData.situation.metrics[3].value) + randomInt(-4, 5), 82, 126).toString());
  updateSituationMetric('peak', clamp(Number(mockDashboardData.situation.metrics[4].value) + randomInt(-6, 10), 586, 638).toString());
  updateSituationMetric('avgDuration', (18 + Math.random() * 2.6).toFixed(1));
}

function updateConstellationSnapshot() {
  mockDashboardData.opsConstellation.forEach((node) => {
    if (node.key === 'voice') {
      const value = clamp(parseInt(node.value, 10) + randomInt(-1, 1), 88, 97);
      node.value = `${value}%`;
      node.level = value < 90 ? 'watch' : 'stable';
      return;
    }

    if (node.key === 'vip') {
      const value = clamp(Number(node.value) + randomInt(-1, 2), 6, 16);
      node.value = String(value);
      node.level = value >= 12 ? 'hot' : 'watch';
      return;
    }

    if (node.key === 'robot') {
      const value = clamp(Math.round(Number(node.value.replace('k', '')) * 10 + randomInt(-1, 2)), 15, 23);
      node.value = `${(value / 10).toFixed(1)}k`;
      node.level = 'stable';
      return;
    }

    if (node.key === 'dispatch') {
      const value = clamp(parseInt(node.value, 10) + randomInt(-2, 2), 80, 94);
      node.value = `${value}%`;
      node.level = value < 84 ? 'watch' : 'stable';
      return;
    }

    if (node.key === 'sentiment') {
      const value = clamp(Number(node.value) + randomInt(-3, 4), 20, 45);
      node.value = String(value);
      node.level = value >= 34 ? 'hot' : 'watch';
      return;
    }

    const value = clamp(parseInt(node.value, 10) + randomInt(-1, 1), 88, 98);
    node.value = `${value}%`;
    node.level = value < 91 ? 'watch' : 'stable';
  });
}

function updateFlowSnapshot() {
  const inbound = trendData.value.inbound[trendData.value.inbound.length - 1] ?? 398;
  const generated = trendData.value.generated[trendData.value.generated.length - 1] ?? 361;
  const connected = trendData.value.connected[trendData.value.connected.length - 1] ?? 335;
  const queued = mockDashboardData.queueSummary.queued;
  const processing = getCoreMetricValue('processing');

  updateFlowStep('incoming', inbound, '100%', '实时');
  updateFlowStep('queue', queued, `${clamp(Math.round((queued / Math.max(inbound, 1)) * 100), 62, 86)}%`, formatWaiting(mockDashboardData.queueSummary.avgWaitingSeconds));
  updateFlowStep('answer', connected, `${clamp(Math.round((connected / Math.max(inbound, 1)) * 100), 78, 91)}%`, `${randomInt(6, 11)}秒`);
  updateFlowStep('ticket', generated, `${clamp(Math.round((generated / Math.max(inbound, 1)) * 100), 86, 96)}%`, `${randomInt(18, 28)}秒`);
  updateFlowStep('ai', Math.max(generated - randomInt(4, 18), 0), `${(95 + Math.random() * 2.2).toFixed(1)}%`, `${randomInt(2, 5)}秒`);
  updateFlowStep('dispatch', Math.max(processing - randomInt(150, 190), 0), `${(86 + Math.random() * 3).toFixed(1)}%`, `2分${randomInt(4, 26)}秒`);
  updateFlowStep('done', getCoreMetricValue('resolved'), `${(83 + Math.random() * 2.8).toFixed(1)}%`, `${(17 + Math.random() * 2.5).toFixed(1)}分`);
}

function updateAiAnalysisSnapshot() {
  mockDashboardData.aiOverview.stats.forEach((item) => {
    if (item.key === 'classifyRate') {
      item.percent = clamp(item.percent + randomInt(-1, 1), 94, 99);
      item.value = `${item.percent.toFixed(1)}%`;
      item.description = '12类问题自动归档';
      return;
    }

    if (item.key === 'confidence') {
      item.percent = clamp(item.percent + randomInt(-1, 1), 88, 96);
      item.value = `${item.percent.toFixed(1)}%`;
      item.description = '语音转写与意图识别';
      return;
    }

    if (item.key === 'duplicate') {
      const nextValue = clamp(Number(item.value) + randomInt(-2, 4), 48, 86);
      item.value = String(nextValue);
      item.percent = clamp(nextValue, 44, 88);
      item.description = `已合并建议 ${clamp(Math.round(nextValue * 0.64), 28, 58)} 条`;
      return;
    }

    const nextValue = clamp(Number(item.value) + randomInt(-1, 3), 18, 36);
    item.value = String(nextValue);
    item.percent = clamp(Math.round(nextValue * 2), 36, 72);
    item.description = '涉及核心系统故障';
  });
}

function updateRiskAlerts() {
  if (Math.random() < 0.55) {
    mockDashboardData.riskAlerts.unshift(createRiskAlert());
    mockDashboardData.riskAlerts.splice(7);
    return;
  }

  const lastAlert = mockDashboardData.riskAlerts.pop();
  if (lastAlert) {
    mockDashboardData.riskAlerts.unshift({ ...lastAlert, createdAt: formatShortTime(currentTime.value) });
  }
}

function updateInsightSnapshot() {
  mockDashboardData.intentHotspots.forEach((intent) => {
    intent.count = clamp(intent.count + randomInt(-8, 14), 42, 380);
    intent.heat = clamp(Math.round(intent.count / 3.6) + randomInt(-3, 4), 24, 100);
  });

  mockDashboardData.slaLanes.forEach((lane) => {
    lane.percent = clamp(lane.percent + randomInt(-4, 7), 18, 96);
    lane.status = lane.percent >= 82 ? 'danger' : lane.percent >= 58 ? 'watch' : 'safe';
    lane.remaining = formatSlaRemaining(lane.status, lane.percent);
  });
}

function buildQueueDistribution(queued: number) {
  const vipCount = clamp(Math.round(queued * 0.11) + randomInt(-1, 2), 6, 16);
  const techCount = clamp(Math.round(queued * 0.32) + randomInt(-2, 3), 20, 42);
  const afterSaleCount = clamp(Math.round(queued * 0.15) + randomInt(-1, 2), 9, 22);
  const eastCount = clamp(Math.round(queued * 0.18) + randomInt(-2, 2), 10, 26);
  const aiReviewCount = clamp(Math.round(queued * 0.08) + randomInt(-1, 2), 4, 14);
  const primaryCount = Math.max(queued - vipCount - techCount - afterSaleCount - eastCount - aiReviewCount, 20);
  const rows = [
    { name: '一级队列', count: primaryCount },
    { name: '技术支持队列', count: techCount },
    { name: 'VIP队列', count: vipCount },
    { name: '售后队列', count: afterSaleCount },
    { name: '华东区域队列', count: eastCount },
    { name: 'AI复核队列', count: aiReviewCount },
  ];

  return rows.map((item) => ({
    ...item,
    percent: clamp(Math.round((item.count / 44) * 100), 24, 100),
  }));
}

function createQueueEntry(): QueueEntry {
  queueSequence += 1;
  const queues = ['一级队列', '技术支持队列', 'VIP队列', '售后队列', '华东区域队列', 'AI复核队列'];
  const prefixes = ['138', '139', '151', '158', '177', '186', '189', '133', '195', '137', '152', '188'];

  return {
    id: `q-live-${Date.now()}-${queueSequence}`,
    incomingAt: formatClock(currentTime.value),
    phone: `${pickRandom(prefixes)}****${String(randomInt(1000, 9999))}`,
    queueName: pickRandom(queues),
    waitingSeconds: randomInt(3, 18),
    status: 'waiting',
  };
}

function createRiskAlert(): RiskAlert {
  ticketSequence += randomInt(1, 4);
  const templates = [
    { title: '等待超时：客户连续呼入未完成接听', department: '客户联络中心', level: 'timeout' },
    { title: 'VIP客户触发服务升级规则', department: '客户成功部', level: 'urgent' },
    { title: 'AI识别置信度异常需人工复核', department: 'AI中台', level: 'abnormal' },
    { title: '核心业务系统工单集中升高', department: '平台运维部', level: 'high' },
  ] as const;
  const template = pickRandom([...templates]);

  return {
    id: `r-live-${Date.now()}-${ticketSequence}`,
    title: template.title,
    ticketNo: `WO20260513${String(ticketSequence).padStart(4, '0')}`,
    level: template.level,
    department: template.department,
    createdAt: formatShortTime(currentTime.value),
  };
}

function getNextQueueStatus(status: QueueStatus, index: number): QueueStatus {
  if (status !== 'waiting' || index < 1) {
    return status;
  }

  const randomValue = Math.random();
  if (randomValue < 0.14) {
    return 'answered';
  }
  if (randomValue < 0.23) {
    return 'ticketed';
  }
  return 'waiting';
}

function updateCoreMetric(key: string, value: number, trendLabel: string, trendType: TrendType) {
  const metric = mockDashboardData.coreMetrics.find((item) => item.key === key);
  if (!metric) {
    return;
  }

  metric.value = value;
  metric.trendLabel = trendLabel;
  metric.trendType = trendType;
}

function getCoreMetricValue(key: string) {
  return mockDashboardData.coreMetrics.find((item) => item.key === key)?.value ?? 0;
}

function updateSituationMetric(key: string, value: string) {
  const metric = mockDashboardData.situation.metrics.find((item) => item.key === key);
  if (metric) {
    metric.value = value;
  }
}

function updateFlowStep(key: string, count: number, conversion: string, avgDuration: string) {
  const step = mockDashboardData.flowSteps.find((item) => item.key === key);
  if (!step) {
    return;
  }

  step.count = count;
  step.conversion = conversion;
  step.avgDuration = avgDuration;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatClock(date: Date) {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTrendLabel(date: Date) {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatShortTime(date: Date) {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resizeCharts() {
  sourceChart?.resize();
  trendChart?.resize();
}

function formatWaiting(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m${String(rest).padStart(2, '0')}s`;
}

function formatSlaRemaining(status: SlaStatus, percent: number) {
  if (status === 'danger') {
    return `${clamp(100 - percent + randomInt(2, 8), 6, 22)}m`;
  }

  if (status === 'watch') {
    return `${clamp(100 - percent + randomInt(8, 22), 24, 58)}m`;
  }

  return `${clamp(Math.round((100 - percent) / 18), 1, 4)}h`;
}

function getQueueRowClass(waitingSeconds: number) {
  return {
    'queue-row--warning': waitingSeconds > 60 && waitingSeconds <= 120,
    'queue-row--danger': waitingSeconds > 120,
  };
}

function syncViewportSize() {
  viewportWidth.value = getViewportWidth();
  viewportHeight.value = getViewportHeight();
}

function getViewportWidth() {
  return typeof window === 'undefined' ? 1440 : window.innerWidth;
}

function getViewportHeight() {
  return typeof window === 'undefined' ? 900 : window.innerHeight;
}
</script>

<style scoped lang="scss">
.command-screen {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 620px;
  overflow: hidden;
  color: #d8f7ff;
  background:
    linear-gradient(115deg, rgb(7 13 30 / 88%) 0%, transparent 38%, rgb(14 38 59 / 58%) 68%, transparent 100%),
    linear-gradient(155deg, rgb(8 42 61 / 42%) 0%, transparent 28%, rgb(73 29 62 / 22%) 62%, transparent 100%),
    linear-gradient(135deg, #040b18 0%, #08182f 48%, #030814 100%);
  isolation: isolate;
}

.command-screen--fullscreen,
.command-screen:fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100vw;
  min-width: 0;
  height: 100vh;
  min-height: 0;
  background-color: #040b18;
  border-radius: 0;
}

.command-screen--embedded {
  border: 1px solid rgb(72 191 255 / 16%);
  border-radius: 8px;
}

.command-screen--compact {
  min-height: 0;
}

.command-screen::before {
  position: absolute;
  inset: 0;
  z-index: -2;
  content: '';
  background-image:
    linear-gradient(rgb(84 209 255 / 8%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(84 209 255 / 8%) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(to bottom, rgb(0 0 0 / 82%), transparent 88%);
}

.command-screen::after {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  content: '';
  background:
    linear-gradient(90deg, transparent, rgb(47 248 255 / 6%), transparent),
    linear-gradient(to bottom, rgb(255 255 255 / 4%), transparent 20%, transparent 80%, rgb(47 248 255 / 5%));
}

.screen-header {
  display: grid;
  grid-template-columns: 230px minmax(260px, 1fr) 480px;
  gap: 12px;
  align-items: center;
  height: 64px;
  padding: 8px 12px 7px;
}

.screen-header__brand,
.screen-header__status {
  display: flex;
  align-items: center;
  min-width: 0;
}

.screen-header__brand {
  gap: 14px;
}

.ai-orbit {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #07111f;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0;
  background: linear-gradient(135deg, #2ff8ff, #8aa7ff);
  border-radius: 12px;
  box-shadow: 0 0 24px rgb(47 248 255 / 46%);
}

.ai-orbit::before,
.ai-orbit::after {
  position: absolute;
  inset: -5px;
  content: '';
  border: 1px solid rgb(47 248 255 / 34%);
  border-radius: 15px;
  animation: orbitPulse 3s ease-in-out infinite;
}

.ai-orbit::after {
  inset: -9px;
  border-color: rgb(108 92 255 / 28%);
  animation-delay: 0.8s;
}

.brand-name {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
}

.brand-subtitle,
.screen-kicker,
.panel-kicker {
  color: #77a9c7;
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.screen-header__center {
  position: relative;
  text-align: center;
}

.screen-header__center::before,
.screen-header__center::after {
  position: absolute;
  top: 50%;
  width: 18%;
  height: 1px;
  content: '';
  background: linear-gradient(90deg, transparent, rgb(47 248 255 / 70%));
}

.screen-header__center::before {
  left: 0;
}

.screen-header__center::after {
  right: 0;
  transform: rotate(180deg);
}

.screen-header__center h1 {
  margin: 4px 0 0;
  color: #f1fdff;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.1;
  text-shadow:
    0 0 16px rgb(47 248 255 / 55%),
    0 0 34px rgb(22 119 255 / 28%);
}

.screen-header__status {
  justify-content: flex-end;
  gap: 8px;
}

.clock-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-right: 8px;
}

.clock-time {
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.clock-date {
  margin-top: 6px;
  color: #8ab9d6;
  font-size: 12px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 9px;
  color: #bfebff;
  font-size: 12px;
  white-space: nowrap;
  background: rgb(15 45 82 / 70%);
  border: 1px solid rgb(92 202 255 / 22%);
  border-radius: 5px;
  box-shadow: inset 0 0 18px rgb(47 248 255 / 6%);
}

.screen-action {
  position: relative;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 30px;
  min-width: 30px;
  height: 30px;
  padding: 0;
  color: #9eefff;
  cursor: pointer;
  background: rgb(47 248 255 / 10%);
  border: 1px solid rgb(47 248 255 / 28%);
  border-radius: 5px;
  box-shadow: inset 0 0 14px rgb(47 248 255 / 8%);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.screen-action:hover {
  color: #ffffff;
  border-color: rgb(47 248 255 / 58%);
  box-shadow:
    inset 0 0 18px rgb(47 248 255 / 14%),
    0 0 14px rgb(47 248 255 / 20%);
}

.status-pill--cyan {
  color: #7cf8ff;
}

.status-pill--refreshing {
  border-color: rgb(47 248 255 / 46%);
  box-shadow:
    inset 0 0 18px rgb(47 248 255 / 12%),
    0 0 12px rgb(47 248 255 / 12%);
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #29d98f;
  border-radius: 50%;
  box-shadow: 0 0 12px #29d98f;
}

.refresh-indicator {
  width: 7px;
  height: 7px;
  background: #2ff8ff;
  border-radius: 50%;
  box-shadow: 0 0 12px #2ff8ff;
  animation: refreshDot 1.4s ease-in-out infinite;
}

.screen-grid {
  display: grid;
  grid-template-columns: minmax(220px, 24fr) minmax(440px, 52fr) minmax(230px, 24fr);
  gap: 12px;
  height: calc(100% - 64px);
  min-height: 0;
  padding: 0 12px 12px;
}

.screen-column {
  display: grid;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.screen-column--left {
  grid-template-rows: minmax(300px, 0.48fr) minmax(250px, 0.52fr);
}

.screen-column--left.is-fullscreen {
  grid-template-rows: minmax(369px, 0.56fr) minmax(0, 0.44fr);
}

.screen-column--center {
  grid-template-rows: minmax(204px, 0.95fr) minmax(190px, 1.2fr) minmax(140px, 0.72fr);
}

.screen-column--right {
  grid-template-rows: minmax(270px, 1fr) minmax(282px, 1fr);
}

.screen-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgb(12 35 67 / 78%), rgb(5 17 36 / 70%)),
    rgb(5 16 36 / 70%);
  border: 1px solid rgb(72 191 255 / 24%);
  border-radius: 8px;
  box-shadow:
    inset 0 0 28px rgb(47 248 255 / 7%),
    0 0 28px rgb(22 119 255 / 8%);
}

.screen-panel::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  border: 1px solid transparent;
  border-image: linear-gradient(135deg, rgb(47 248 255 / 65%), transparent 28%, transparent 72%, rgb(108 92 255 / 45%)) 1;
  opacity: 0.66;
}

.screen-panel::after {
  position: absolute;
  top: 0;
  left: 14px;
  width: 78px;
  height: 2px;
  content: '';
  background: linear-gradient(90deg, #2ff8ff, transparent);
  box-shadow: 0 0 18px rgb(47 248 255 / 76%);
}

.panel-heading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.panel-heading h2 {
  margin: 4px 0 0;
  color: #effdff;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.2;
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  color: #9bdfff;
  font-size: 11px;
  white-space: nowrap;
  background: rgb(47 248 255 / 9%);
  border: 1px solid rgb(47 248 255 / 22%);
  border-radius: 4px;
}

.panel-badge--cyan {
  color: #77f9ff;
}

.panel-badge--purple {
  color: #cabdff;
  background: rgb(108 92 255 / 12%);
  border-color: rgb(108 92 255 / 28%);
}

.panel-badge--warning {
  color: #ffc766;
  background: rgb(255 176 32 / 12%);
  border-color: rgb(255 176 32 / 30%);
}

.panel-badge--danger {
  color: #ff9a91;
  background: rgb(255 92 93 / 12%);
  border-color: rgb(255 92 93 / 32%);
}

.panel-badge--refresh {
  position: relative;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.panel-badge--refresh.is-module-refreshing {
  color: #ffffff;
  border-color: rgb(47 248 255 / 48%);
  box-shadow: 0 0 12px rgb(47 248 255 / 16%);
}

.metric-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(62px, 1fr));
  gap: 8px;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

.core-panel,
.source-panel,
.ai-panel,
.queue-panel,
.alert-panel,
.ranking-panel {
  display: flex;
  flex-direction: column;
}

.left-bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.left-bottom-grid .panel-heading {
  gap: 6px;
  margin-bottom: 8px;
}

.left-bottom-grid .panel-heading h2 {
  overflow: visible;
  font-size: 14px;
  white-space: nowrap;
}

.left-bottom-grid .panel-kicker {
  font-size: 10px;
}

.left-bottom-grid .panel-badge {
  height: 20px;
  padding: 0 6px;
  font-size: 10px;
}

.metric-card {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 10px;
  align-items: center;
  min-width: 0;
  min-height: 62px;
  padding: 8px 10px 8px 12px;
  overflow: visible;
  background:
    linear-gradient(90deg, rgb(16 55 98 / 78%), rgb(7 24 52 / 64%) 52%, rgb(10 45 82 / 62%)),
    linear-gradient(135deg, rgb(16 55 98 / 72%), rgb(5 18 39 / 52%));
  border: 1px solid rgb(84 209 255 / 18%);
  border-radius: 6px;
}

.metric-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.metric-title {
  display: block;
  overflow: visible;
  color: #b3d9ee;
  font-size: 12px;
  font-weight: 700;
  line-height: 17px;
  text-overflow: unset;
  white-space: normal;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 4px;
  width: 96px;
  min-width: 88px;
  min-height: 38px;
  line-height: 1;
  text-align: right;
}

.metric-value {
  flex: 0 0 auto;
  color: #f3feff;
  font-size: 30px;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0;
  text-shadow:
    0 0 14px rgb(47 248 255 / 42%),
    0 0 26px rgb(22 119 255 / 28%);
  animation: digitPulse 3.6s ease-in-out infinite;
}

.is-changing {
  animation: valueRefresh 0.95s ease both;
}

.metric-unit {
  flex: 0 0 auto;
  color: #75dfff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.15;
}

.metric-trend {
  display: inline-flex;
  margin-top: 4px;
  overflow: visible;
  font-size: 11px;
  line-height: 16px;
  text-overflow: unset;
  white-space: nowrap;
}

.metric-trend--up {
  color: #ffbc66;
}

.metric-trend--down {
  color: #5bffa8;
}

.metric-trend--flat {
  color: #7bdff7;
}

.source-panel {
  padding-bottom: 12px;
}

.source-panel--compact {
  padding-bottom: 12px;
}

.source-chart {
  position: absolute;
  top: 40px;
  left: 0;
  width: 100%;
  height: 112px;
}

.source-legend {
  position: absolute;
  right: 16px;
  bottom: 10px;
  left: 16px;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 10px;
}

.source-legend__item {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: #add4e8;
  font-size: 12px;
}

.source-legend__item span {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  box-shadow: 0 0 10px currentcolor;
}

.source-legend__item strong {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-legend__item em {
  margin-left: auto;
  color: #e2fbff;
  font-style: normal;
  font-variant-numeric: tabular-nums;
}

.source-panel--compact .source-chart {
  position: relative;
  top: auto;
  left: auto;
  flex: 1 1 auto;
  width: 100%;
  height: auto;
  min-height: 112px;
  margin: -4px 0 0;
}

.source-panel--compact .source-legend {
  position: relative;
  right: auto;
  bottom: auto;
  left: auto;
  flex: 0 0 auto;
  grid-template-columns: minmax(0, 1fr);
  gap: 5px;
  margin-top: 6px;
}

.source-panel--compact .source-legend__item {
  font-size: 11px;
}

.ai-analysis-list {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: repeat(4, minmax(58px, 1fr));
  gap: 8px;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
}

.ai-analysis-item {
  --accent-color: #2ff8ff;
  box-sizing: border-box;
  position: relative;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  grid-template-areas:
    'icon info value'
    'progress progress progress';
  column-gap: 10px;
  row-gap: 8px;
  align-items: center;
  min-width: 0;
  min-height: 58px;
  padding: 10px 12px 9px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(47 248 255 / 11%), transparent 42%),
    linear-gradient(180deg, rgb(12 36 68 / 92%), rgb(7 22 44 / 82%));
  border: 1px solid rgb(91 200 255 / 16%);
  border-radius: 8px;
  box-shadow:
    inset 0 0 18px rgb(47 248 255 / 6%),
    0 0 18px rgb(22 119 255 / 6%);
}

.ai-analysis-item::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  border-radius: inherit;
  background: linear-gradient(135deg, rgb(255 255 255 / 7%), transparent 36%);
  opacity: 0.45;
}

.ai-analysis-item--blue {
  --accent-color: #1677ff;
}

.ai-analysis-item--violet {
  --accent-color: #6c5cff;
}

.ai-analysis-item--amber {
  --accent-color: #ffb020;
}

.ai-analysis-item__icon {
  grid-area: icon;
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  background:
    radial-gradient(circle at 35% 28%, rgb(255 255 255 / 26%), transparent 30%),
    linear-gradient(180deg, rgb(255 255 255 / 10%), rgb(255 255 255 / 2%)),
    var(--accent-color);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 50%;
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 4%),
    0 0 16px color-mix(in srgb, var(--accent-color) 58%, transparent);
}

.ai-analysis-item__icon::after {
  position: absolute;
  inset: -4px;
  content: '';
  border: 1px solid color-mix(in srgb, var(--accent-color) 35%, transparent);
  border-radius: 50%;
  opacity: 0.65;
}

.ai-info {
  grid-area: info;
  position: relative;
  z-index: 1;
  min-width: 0;
}

.ai-title,
.ai-desc {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-title {
  color: #effdff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.ai-desc {
  margin-top: 4px;
  color: #8db7d7;
  font-size: 11px;
  font-style: normal;
  line-height: 1.25;
  white-space: nowrap;
}

.ai-value-wrap {
  grid-area: value;
  position: relative;
  z-index: 1;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  min-width: 72px;
  text-align: right;
}

.ai-value {
  color: #ffffff;
  font-size: 23px;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-shadow:
    0 0 14px rgb(47 248 255 / 38%),
    0 0 24px rgb(22 119 255 / 20%);
}

.ai-status {
  margin-top: 5px;
  padding: 0 6px;
  color: color-mix(in srgb, var(--accent-color) 72%, #ffffff 28%);
  font-size: 10px;
  line-height: 16px;
  white-space: nowrap;
  background: rgb(255 255 255 / 4%);
  border: 1px solid color-mix(in srgb, var(--accent-color) 28%, transparent);
  border-radius: 999px;
}

.ai-progress {
  grid-area: progress;
  position: relative;
  z-index: 1;
  height: 4px;
  overflow: hidden;
  background: rgb(126 185 255 / 10%);
  border-radius: 999px;
}

.ai-progress::before {
  display: block;
  width: var(--progress);
  height: 100%;
  content: '';
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent-color) 78%, #ffffff 22%), rgba(47, 248, 255, 0.18));
  border-radius: inherit;
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent-color) 45%, transparent);
}

.ai-analysis-compact-list {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 8px;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
}

.ai-analysis-compact-item {
  --accent-color: #2ff8ff;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
  min-height: 0;
  padding: 7px 8px;
  overflow: hidden;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--accent-color) 18%, transparent), transparent 60%),
    rgb(10 31 59 / 82%);
  border: 1px solid color-mix(in srgb, var(--accent-color) 24%, transparent);
  border-radius: 6px;
}

.ai-analysis-compact-item--blue {
  --accent-color: #1677ff;
}

.ai-analysis-compact-item--violet {
  --accent-color: #6c5cff;
}

.ai-analysis-compact-item--amber {
  --accent-color: #ffb020;
}

.ai-analysis-compact-text {
  min-width: 0;
}

.ai-analysis-compact-text strong,
.ai-analysis-compact-text em {
  display: block;
  min-width: 0;
}

.ai-analysis-compact-text strong {
  overflow: visible;
  color: #effdff;
  font-size: 11px;
  font-weight: 760;
  line-height: 1.14;
  white-space: normal;
}

.ai-analysis-compact-text em {
  margin-top: 3px;
  overflow: hidden;
  color: color-mix(in srgb, var(--accent-color) 62%, #c6eaff 38%);
  font-size: 10px;
  font-style: normal;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-analysis-compact-value {
  flex: 0 0 auto;
  min-width: 48px;
  color: #ffffff;
  font-size: 20px;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: right;
  text-shadow:
    0 0 14px color-mix(in srgb, var(--accent-color) 42%, transparent),
    0 0 22px rgb(22 119 255 / 22%);
}

.sub-heading {
  margin-bottom: 8px;
  color: #81dfff;
  font-size: 12px;
  font-weight: 700;
}

.ranking-progress,
.queue-bar {
  height: 7px;
  overflow: hidden;
  background: rgb(126 185 255 / 11%);
  border-radius: 999px;
}

.ranking-progress i,
.queue-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #1677ff, #2ff8ff);
  border-radius: inherit;
  box-shadow: 0 0 12px rgb(47 248 255 / 45%);
}

.situation-panel {
  display: flex;
  flex-direction: column;
}

.situation-stage {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(190px, 0.95fr) minmax(260px, 1.05fr);
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
}

.situation-orbit {
  --orbit-map-height: 190px;
  --orbit-map-width: 320px;
  --orbit-ring-size: 190px;
  position: relative;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: var(--orbit-map-height);
  overflow: hidden;
  background:
    linear-gradient(180deg, rgb(47 248 255 / 10%), transparent 64%),
    rgb(7 24 49 / 54%);
  border: 1px solid rgb(47 248 255 / 18%);
  border-radius: 8px;
}

.situation-orbit-map {
  position: relative;
  width: var(--orbit-map-width);
  height: var(--orbit-map-height);
  flex: 0 0 auto;
}

.orbit-ring {
  position: absolute;
  inset: 50%;
  border: 1px solid rgb(126 222 255 / 16%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.orbit-ring--outer {
  width: var(--orbit-ring-size);
  aspect-ratio: 1;
  border-style: dashed;
  animation: orbitRotate 26s linear infinite;
}

.orbit-ring--middle {
  width: calc(var(--orbit-ring-size) * 0.72);
  aspect-ratio: 1;
  border-color: rgb(47 248 255 / 26%);
  animation: orbitRotate 18s linear infinite reverse;
}

.orbit-ring--inner {
  width: calc(var(--orbit-ring-size) * 0.44);
  aspect-ratio: 1;
  border-color: rgb(255 176 32 / 22%);
}

.situation-core {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  width: 100px;
  height: 100px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 34%, rgb(47 248 255 / 32%), transparent 54%),
    linear-gradient(180deg, rgb(14 48 84 / 88%), rgb(6 19 41 / 92%));
  border: 1px solid rgb(47 248 255 / 38%);
  border-radius: 50%;
  box-shadow:
    inset 0 0 24px rgb(47 248 255 / 16%),
    0 0 30px rgb(47 248 255 / 18%);
  transform: translate(-50%, -50%);
}

.situation-core span,
.situation-core em {
  color: #8fc8df;
  font-size: 11px;
  font-style: normal;
  line-height: 1;
}

.situation-core strong {
  color: #ffffff;
  font-size: 36px;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-shadow:
    0 0 16px rgb(47 248 255 / 58%),
    0 0 28px rgb(255 176 32 / 18%);
}

.constellation-node {
  box-sizing: border-box;
  position: absolute;
  top: var(--node-y);
  left: var(--node-x);
  display: grid;
  place-items: center;
  width: 76px;
  height: 42px;
  padding: 5px 7px;
  overflow: hidden;
  color: #effdff;
  background: rgb(6 20 43 / 78%);
  border: 1px solid color-mix(in srgb, var(--node-color) 44%, transparent);
  border-radius: 6px;
  box-shadow:
    inset 0 0 14px color-mix(in srgb, var(--node-color) 11%, transparent),
    0 0 16px color-mix(in srgb, var(--node-color) 22%, transparent);
  transform: translate(-50%, -50%);
  animation: nodePulse var(--pulse-duration) ease-in-out infinite;
}

.constellation-node::before {
  position: absolute;
  top: 50%;
  left: -18px;
  width: 18px;
  height: 1px;
  content: '';
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--node-color) 72%, transparent));
}

.constellation-node strong {
  display: block;
  width: 100%;
  overflow: hidden;
  color: #ffffff;
  font-size: 16px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.constellation-node span {
  display: block;
  width: 100%;
  margin-top: 3px;
  overflow: hidden;
  color: color-mix(in srgb, var(--node-color) 72%, #d9f8ff 28%);
  font-size: 10px;
  line-height: 1.1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.constellation-node--hot {
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--node-color) 20%, transparent), transparent),
    rgb(34 18 35 / 84%);
}

.situation-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-height: 0;
}

.situation-card {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px 8px;
  text-align: center;
  background:
    linear-gradient(180deg, rgb(47 248 255 / 10%), transparent),
    rgb(7 25 52 / 68%);
  border: 1px solid rgb(47 248 255 / 19%);
  border-radius: 7px;
}

.situation-card span,
.situation-card em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.situation-card span {
  color: #91bdd7;
  font-size: 12px;
}

.situation-card strong {
  display: block;
  margin-top: 7px;
  color: #ffffff;
  font-size: 28px;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-shadow:
    0 0 16px rgb(47 248 255 / 55%),
    0 0 28px rgb(22 119 255 / 35%);
}

.situation-card em {
  margin-top: 6px;
  color: #72dbff;
  font-size: 12px;
  font-style: normal;
}

.trend-chart {
  position: relative;
  z-index: 1;
  width: 100%;
  height: calc(100% - 40px);
  min-height: 0;
}

.flow-chain {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  height: calc(100% - 38px);
  align-items: stretch;
}

.flow-node {
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  padding: 10px 8px;
  background: linear-gradient(180deg, rgb(16 53 98 / 76%), rgb(5 18 38 / 58%));
  border: 1px solid rgb(87 203 255 / 22%);
  border-radius: 7px;
}

.flow-node:not(:last-child)::after {
  position: absolute;
  top: 50%;
  right: -8px;
  z-index: 2;
  width: 8px;
  height: 1px;
  content: '';
  background: #2ff8ff;
  box-shadow: 0 0 10px #2ff8ff;
}

.flow-node__index {
  color: rgb(47 248 255 / 55%);
  font-size: 12px;
  font-weight: 800;
}

.flow-node h3 {
  min-height: 32px;
  margin: 6px 0 0;
  color: #e7fbff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
}

.flow-node strong {
  margin-top: auto;
  color: #ffffff;
  font-size: 24px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.flow-node__meta {
  display: grid;
  gap: 5px;
  margin-top: 8px;
  color: #8ab9d6;
  font-size: 11px;
}

.queue-panel {
  border-color: rgb(47 248 255 / 38%);
}

.queue-panel--vip {
  animation: vipPanelGlow 2.2s ease-in-out infinite;
}

.queue-summary {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  flex: 0 0 auto;
}

.queue-summary__item {
  min-width: 0;
  min-height: 0;
  padding: 7px 8px;
  background: rgb(9 31 61 / 68%);
  border: 1px solid rgb(91 200 255 / 17%);
  border-radius: 6px;
}

.queue-summary__item span,
.queue-summary__item em {
  display: block;
  overflow: hidden;
  color: #8db7d7;
  font-size: 11px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-summary__item strong {
  display: inline-flex;
  margin-top: 5px;
  color: #ffffff;
  font-size: 20px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.queue-summary__item.is-hot strong,
.queue-summary__item.is-warning strong {
  color: #ffc766;
}

.queue-summary__item.is-danger strong {
  color: #ff6b6b;
  text-shadow: 0 0 12px rgb(255 76 76 / 48%);
}

.queue-summary__item.is-good strong {
  color: #63ffa6;
}

.queue-distribution {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 6px;
  flex: 0 0 auto;
  margin-top: 9px;
}

.queue-bar-row__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  color: #aed7eb;
  font-size: 12px;
}

.queue-bar-row__label strong {
  color: #ffffff;
}

.queue-bar {
  height: 8px;
}

.queue-bar__fill--vip {
  background: linear-gradient(90deg, #ffb020, #ff5c93) !important;
  box-shadow: 0 0 12px rgb(255 176 32 / 50%) !important;
}

.queue-table {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 88px;
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid rgb(87 203 255 / 16%);
  border-radius: 6px;
}

.queue-table__head,
.queue-row {
  display: grid;
  grid-template-columns: 58px 78px minmax(56px, 1fr) 46px 52px;
  gap: 6px;
  align-items: center;
}

.queue-table__head {
  height: 26px;
  padding: 0 8px;
  color: #76a8c8;
  font-size: 11px;
  background: rgb(47 248 255 / 7%);
  border-bottom: 1px solid rgb(87 203 255 / 14%);
}

.queue-scroll {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
  overflow: hidden;
}

.scroll-track {
  animation: scrollY 15s linear infinite;
}

.queue-scroll:hover .scroll-track,
.alert-scroll:hover .scroll-track {
  animation-play-state: paused;
}

.queue-row {
  height: 28px;
  padding: 0 8px;
  color: #d8f4ff;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  border-bottom: 1px solid rgb(87 203 255 / 8%);
}

.queue-table__head span,
.queue-row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-row--warning {
  color: #ffd166;
  background: rgb(255 176 32 / 8%);
}

.queue-row--danger {
  color: #ff8a83;
  background: rgb(255 76 76 / 10%);
  animation: dangerBlink 1.2s ease-in-out infinite;
}

.queue-row--new {
  color: #ffffff;
  background: rgb(47 248 255 / 13%);
  animation: rowInsertFlash 1.6s ease-out;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 5px;
  font-size: 10px;
  font-style: normal;
  white-space: nowrap;
  border-radius: 3px;
}

.status-tag--waiting {
  color: #ffc766;
  background: rgb(255 176 32 / 14%);
}

.status-tag--answered {
  color: #7bf7ff;
  background: rgb(47 248 255 / 12%);
}

.status-tag--ticketed {
  color: #6dffa8;
  background: rgb(41 217 143 / 12%);
}

.alert-scroll {
  position: relative;
  z-index: 1;
  flex: 1 1 112px;
  height: auto;
  min-height: 0;
  overflow: hidden;
}

.scroll-track--alert {
  animation-duration: 18s;
}

.risk-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 50px;
  padding: 7px 0;
  border-bottom: 1px solid rgb(87 203 255 / 10%);
}

.risk-item h3 {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #effdff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.risk-item span {
  display: block;
  margin-top: 4px;
  color: #85b1ce;
  font-size: 11px;
}

.risk-item__right {
  flex: 0 0 70px;
  text-align: right;
}

.risk-item__right strong,
.risk-item__right em {
  display: block;
}

.risk-item__right strong {
  color: #ff6b6b;
  font-size: 13px;
}

.risk-item__right em {
  margin-top: 6px;
  color: #82abc8;
  font-size: 11px;
  font-style: normal;
}

.risk-item--high .risk-item__right strong {
  color: #ffb020;
}

.risk-item--abnormal .risk-item__right strong {
  color: #be9cff;
}

.risk-item--timeout .risk-item__right strong,
.risk-item--urgent .risk-item__right strong {
  color: #ff6b6b;
}

.insight-strip {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  flex: 0 0 auto;
  min-height: 132px;
  margin-top: 10px;
}

.intent-radar,
.sla-lanes {
  min-width: 0;
  padding: 9px;
  background: rgb(8 28 56 / 56%);
  border: 1px solid rgb(91 200 255 / 14%);
  border-radius: 7px;
}

.intent-radar__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.intent-chip {
  --intent-color: #2ff8ff;

  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
  height: 27px;
  padding: 0 7px;
  overflow: hidden;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--intent-color) var(--heat), transparent), transparent 82%),
    rgb(5 18 38 / 72%);
  border: 1px solid color-mix(in srgb, var(--intent-color) 28%, transparent);
  border-radius: 5px;
}

.intent-chip span {
  min-width: 0;
  overflow: hidden;
  color: #d7f4ff;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.intent-chip strong {
  flex: 0 0 auto;
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.sla-lanes {
  display: grid;
  gap: 6px;
}

.sla-lane {
  display: grid;
  grid-template-columns: minmax(76px, 1fr) minmax(44px, 0.8fr) 34px;
  gap: 7px;
  align-items: center;
  min-width: 0;
}

.sla-lane strong,
.sla-lane span,
.sla-lane em {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sla-lane strong {
  color: #effdff;
  font-size: 11px;
  line-height: 1.2;
}

.sla-lane span {
  margin-top: 2px;
  color: #85b1ce;
  font-size: 10px;
}

.sla-lane em {
  color: #b6eaff;
  font-size: 11px;
  font-style: normal;
  text-align: right;
}

.sla-lane__bar {
  height: 7px;
  overflow: hidden;
  background: rgb(126 185 255 / 12%);
  border-radius: 999px;
}

.sla-lane__bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #29d98f, #2ff8ff);
  border-radius: inherit;
  box-shadow: 0 0 10px rgb(47 248 255 / 35%);
}

.sla-lane--watch .sla-lane__bar i {
  background: linear-gradient(90deg, #ffb020, #2ff8ff);
}

.sla-lane--danger .sla-lane__bar i {
  background: linear-gradient(90deg, #ff5c93, #ffb020);
}

.sla-lane--danger em {
  color: #ff9a91;
}

.ranking-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 7px;
  flex: 1 1 auto;
  min-height: 0;
  padding-right: 4px;
  overflow: auto;
}

.ranking-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 46px;
  gap: 8px;
  align-items: center;
}

.ranking-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: #062033;
  font-size: 12px;
  font-weight: 900;
  background: linear-gradient(135deg, #2ff8ff, #8aa7ff);
  border-radius: 5px;
}

.ranking-main {
  min-width: 0;
}

.ranking-main div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 5px;
}

.ranking-main strong {
  overflow: hidden;
  color: #e5f9ff;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-main em {
  flex: 0 0 auto;
  color: #83adc8;
  font-size: 11px;
  font-style: normal;
}

.ranking-value {
  text-align: right;
}

.ranking-value strong {
  display: block;
  color: #ffffff;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

.ranking-value span {
  display: block;
  margin-top: 5px;
  font-size: 11px;
}

.ranking-value .up {
  color: #ffbc66;
}

.ranking-value .down {
  color: #63ffa6;
}

.command-screen--embedded .screen-panel {
  padding: 10px;
}

.command-screen--embedded .panel-heading {
  gap: 8px;
  margin-bottom: 8px;
}

.command-screen--embedded .panel-heading h2 {
  font-size: 14px;
}

.command-screen--embedded .panel-badge {
  height: 22px;
  padding: 0 7px;
  font-size: 11px;
}

.command-screen--embedded .metric-grid {
  grid-template-rows: repeat(4, minmax(58px, 1fr));
  gap: 7px;
}

.command-screen--embedded .metric-card {
  grid-template-columns: minmax(0, 1fr);
  gap: 5px;
  align-content: center;
  min-height: 58px;
  padding: 7px 8px;
}

.command-screen--embedded .metric-title {
  font-size: 11px;
  line-height: 16px;
}

.command-screen--embedded .metric-value-row {
  justify-content: flex-start;
  width: 100%;
  min-width: 0;
  min-height: 28px;
  text-align: left;
}

.command-screen--embedded .metric-value {
  font-size: 24px;
  line-height: 1;
}

.command-screen--embedded .metric-unit {
  font-size: 11px;
}

.command-screen--embedded .metric-trend {
  margin-top: 2px;
  font-size: 10px;
  line-height: 15px;
}

.command-screen--compact .metric-grid {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: repeat(8, minmax(34px, 1fr));
  gap: 6px;
}

.command-screen--compact .metric-card {
  grid-template-columns: minmax(0, 1fr) minmax(88px, auto);
  gap: 8px;
  min-height: 34px;
  padding: 6px 8px;
}

.command-screen--compact .metric-value-row {
  justify-content: flex-end;
  width: auto;
  min-width: 88px;
  min-height: 28px;
  text-align: right;
}

.command-screen--compact .metric-value {
  font-size: 24px;
}

.command-screen--embedded .ai-analysis-list {
  grid-template-rows: repeat(4, minmax(48px, 1fr));
  gap: 7px;
}

.command-screen--embedded .ai-analysis-item {
  grid-template-columns: 30px minmax(0, 1fr) auto;
  column-gap: 8px;
  row-gap: 6px;
  min-height: 48px;
  padding: 7px 8px 6px;
}

.command-screen--embedded .ai-analysis-item__icon {
  width: 30px;
  height: 30px;
  font-size: 9px;
}

.command-screen--embedded .ai-title {
  font-size: 12px;
  line-height: 16px;
}

.command-screen--embedded .ai-desc {
  margin-top: 2px;
  font-size: 10px;
  line-height: 14px;
}

.command-screen--embedded .ai-value {
  font-size: 20px;
}

.command-screen--embedded .ai-status {
  margin-top: 4px;
}

.command-screen--embedded .situation-grid {
  gap: 7px;
}

.command-screen--embedded .situation-card {
  padding: 8px 6px;
}

.command-screen--embedded .situation-card strong {
  margin-top: 5px;
  font-size: 22px;
}

.command-screen--embedded .trend-chart {
  height: calc(100% - 34px);
}

.command-screen--embedded .flow-chain {
  gap: 6px;
  height: calc(100% - 34px);
}

.command-screen--embedded .flow-node {
  padding: 8px 6px;
}

.command-screen--embedded .flow-node:not(:last-child)::after {
  right: -6px;
  width: 6px;
}

.command-screen--embedded .flow-node h3 {
  min-height: 30px;
  margin-top: 5px;
  font-size: 11px;
}

.command-screen--embedded .flow-node strong {
  font-size: 20px;
}

.command-screen--embedded .flow-node__meta {
  gap: 3px;
  margin-top: 6px;
  font-size: 10px;
}

.command-screen--embedded .queue-summary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.command-screen--embedded .queue-summary__item {
  padding: 6px 7px;
}

.command-screen--embedded .queue-summary__item strong {
  margin-top: 4px;
  font-size: 18px;
}

.command-screen--embedded .queue-distribution {
  gap: 5px;
  margin-top: 8px;
}

.command-screen--embedded .queue-table {
  min-height: 84px;
  max-height: 116px;
  margin-top: 8px;
}

.command-screen--embedded .queue-table__head,
.command-screen--embedded .queue-row {
  grid-template-columns: 52px minmax(68px, 1fr) 52px 42px 46px;
  gap: 5px;
}

.command-screen--embedded .queue-table__head {
  height: 24px;
  padding: 0 6px;
}

.command-screen--embedded .queue-row {
  height: 26px;
  padding: 0 6px;
  font-size: 11px;
}

.command-screen--embedded .alert-scroll {
  min-height: 0;
}

.command-screen--embedded .risk-item {
  min-height: 46px;
  padding: 6px 0;
}

.command-screen--fullscreen .screen-header,
.command-screen:fullscreen .screen-header {
  grid-template-columns: minmax(260px, 0.9fr) minmax(420px, 1.45fr) minmax(440px, 1fr);
  gap: 18px;
  height: 88px;
  padding: 14px 24px 10px;
}

.command-screen--fullscreen .screen-header__center h1,
.command-screen:fullscreen .screen-header__center h1 {
  margin-top: 6px;
  font-size: 34px;
}

.command-screen--fullscreen .clock-time,
.command-screen:fullscreen .clock-time {
  font-size: 24px;
}

.command-screen--fullscreen .ai-orbit,
.command-screen:fullscreen .ai-orbit {
  width: 54px;
  height: 54px;
  font-size: 18px;
  border-radius: 16px;
}

.command-screen--fullscreen .ai-orbit::before,
.command-screen:fullscreen .ai-orbit::before {
  inset: -8px;
  border-radius: 20px;
}

.command-screen--fullscreen .ai-orbit::after,
.command-screen:fullscreen .ai-orbit::after {
  inset: -14px;
  border-radius: 20px;
}

.command-screen--fullscreen .brand-name,
.command-screen:fullscreen .brand-name {
  font-size: 18px;
}

.command-screen--fullscreen .status-pill,
.command-screen:fullscreen .status-pill {
  height: 32px;
  padding: 0 12px;
}

.command-screen--fullscreen .screen-action,
.command-screen:fullscreen .screen-action {
  width: 34px;
  min-width: 34px;
  height: 34px;
}

.command-screen--fullscreen .screen-grid,
.command-screen:fullscreen .screen-grid {
  grid-template-columns: minmax(320px, 24fr) minmax(500px, 45fr) minmax(340px, 31fr);
  gap: 16px;
  height: calc(100% - 88px);
  padding: 0 20px 20px;
}

.command-screen--fullscreen .screen-column,
.command-screen:fullscreen .screen-column {
  gap: 16px;
}

.command-screen--fullscreen .screen-column--left.is-fullscreen,
.command-screen:fullscreen .screen-column--left.is-fullscreen {
  grid-template-rows: minmax(369px, 0.56fr) minmax(0, 0.44fr);
}

.command-screen--fullscreen .left-bottom-grid,
.command-screen:fullscreen .left-bottom-grid {
  gap: 14px;
}

.command-screen--fullscreen .screen-column--center,
.command-screen:fullscreen .screen-column--center {
  grid-template-rows: minmax(230px, 0.95fr) minmax(230px, 1.18fr) minmax(174px, 0.72fr);
}

.command-screen--fullscreen .screen-column--right,
.command-screen:fullscreen .screen-column--right {
  grid-template-rows: minmax(390px, 1fr) minmax(250px, 0.78fr);
}

.command-screen--fullscreen .screen-panel,
.command-screen:fullscreen .screen-panel {
  padding: 16px;
}

.command-screen--fullscreen .panel-heading,
.command-screen:fullscreen .panel-heading {
  margin-bottom: 12px;
}

.command-screen--fullscreen .panel-heading h2,
.command-screen:fullscreen .panel-heading h2 {
  font-size: 17px;
}

.command-screen--fullscreen .metric-grid,
.command-screen:fullscreen .metric-grid {
  grid-template-rows: repeat(4, minmax(66px, 1fr));
  gap: 9px;
}

.command-screen--fullscreen .metric-card,
.command-screen:fullscreen .metric-card {
  grid-template-columns: minmax(0, 1fr) 108px;
  gap: 11px;
  min-height: 66px;
  padding: 9px 11px 9px 13px;
}

.command-screen--fullscreen .metric-title,
.command-screen:fullscreen .metric-title {
  font-size: 12px;
  line-height: 18px;
}

.command-screen--fullscreen .metric-value,
.command-screen:fullscreen .metric-value {
  font-size: 33px;
  line-height: 1;
}

.command-screen--fullscreen .metric-value-row,
.command-screen:fullscreen .metric-value-row {
  width: 108px;
  min-width: 98px;
  min-height: 40px;
}

.command-screen--fullscreen .source-panel--compact .source-chart,
.command-screen:fullscreen .source-panel--compact .source-chart {
  top: auto;
  height: auto;
  min-height: 130px;
}

.command-screen--fullscreen .source-panel--compact .source-legend,
.command-screen:fullscreen .source-panel--compact .source-legend {
  bottom: auto;
  gap: 6px;
}

.command-screen--fullscreen .ai-analysis-compact-list,
.command-screen:fullscreen .ai-analysis-compact-list {
  gap: 9px;
}

.command-screen--fullscreen .ai-analysis-compact-item,
.command-screen:fullscreen .ai-analysis-compact-item {
  padding: 8px 9px;
}

.command-screen--fullscreen .ai-analysis-compact-value,
.command-screen:fullscreen .ai-analysis-compact-value {
  font-size: 21px;
}

.command-screen--fullscreen .situation-card,
.command-screen:fullscreen .situation-card {
  padding: 14px 10px;
}

.command-screen--fullscreen .situation-card strong,
.command-screen:fullscreen .situation-card strong {
  margin-top: 8px;
  font-size: 30px;
}

.command-screen--fullscreen .flow-chain,
.command-screen:fullscreen .flow-chain {
  gap: 12px;
  height: calc(100% - 42px);
}

.command-screen--fullscreen .flow-node,
.command-screen:fullscreen .flow-node {
  padding: 14px 10px 12px;
}

.command-screen--fullscreen .flow-node:not(:last-child)::after,
.command-screen:fullscreen .flow-node:not(:last-child)::after {
  right: -12px;
  width: 12px;
}

.command-screen--fullscreen .flow-node h3,
.command-screen:fullscreen .flow-node h3 {
  min-height: 36px;
  margin-top: 8px;
  font-size: 14px;
}

.command-screen--fullscreen .flow-node strong,
.command-screen:fullscreen .flow-node strong {
  font-size: 30px;
}

.command-screen--fullscreen .queue-summary,
.command-screen:fullscreen .queue-summary {
  gap: 9px;
}

.command-screen--fullscreen .queue-summary__item,
.command-screen:fullscreen .queue-summary__item {
  padding: 10px 9px;
}

.command-screen--fullscreen .queue-summary__item strong,
.command-screen:fullscreen .queue-summary__item strong {
  margin-top: 7px;
  font-size: 24px;
}

.command-screen--fullscreen .queue-distribution,
.command-screen:fullscreen .queue-distribution {
  gap: 8px;
  margin-top: 12px;
}

.command-screen--fullscreen .queue-table,
.command-screen:fullscreen .queue-table {
  min-height: 150px;
  margin-top: 14px;
}

.command-screen--fullscreen .queue-table__head,
.command-screen--fullscreen .queue-row,
.command-screen:fullscreen .queue-table__head,
.command-screen:fullscreen .queue-row {
  grid-template-columns: 75px 96px 92px 58px 70px;
  gap: 8px;
}

.command-screen--fullscreen .queue-table__head,
.command-screen:fullscreen .queue-table__head {
  height: 30px;
  padding: 0 10px;
}

.command-screen--fullscreen .queue-row,
.command-screen:fullscreen .queue-row {
  height: 30px;
  padding: 0 10px;
}

.command-screen--fullscreen .risk-item,
.command-screen:fullscreen .risk-item {
  min-height: 62px;
  padding: 10px 0;
}

.command-screen--fullscreen .ranking-list,
.command-screen:fullscreen .ranking-list {
  gap: 9px;
}

.command-screen--fullscreen .ranking-row,
.command-screen:fullscreen .ranking-row {
  grid-template-columns: 30px minmax(0, 1fr) 58px;
  gap: 10px;
}

.command-screen--fullscreen .ranking-index,
.command-screen:fullscreen .ranking-index {
  width: 26px;
  height: 26px;
}

.command-screen--fullscreen .ranking-value strong,
.command-screen:fullscreen .ranking-value strong {
  font-size: 20px;
}

@keyframes orbitPulse {
  0%,
  100% {
    opacity: 0.42;
    transform: scale(0.94);
  }

  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

@keyframes digitPulse {
  0%,
  100% {
    filter: brightness(1);
  }

  50% {
    filter: brightness(1.25);
  }
}

@keyframes valueRefresh {
  0% {
    filter: brightness(1);
    transform: translateY(0) scale(1);
  }

  38% {
    filter: brightness(1.45);
    transform: translateY(-1px) scale(1.035);
  }

  100% {
    filter: brightness(1);
    transform: translateY(0) scale(1);
  }
}

@keyframes refreshDot {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.82);
  }

  50% {
    opacity: 1;
    transform: scale(1.12);
  }
}

@keyframes rowInsertFlash {
  0% {
    box-shadow: inset 3px 0 0 #2ff8ff;
    filter: brightness(1.45);
  }

  100% {
    box-shadow: inset 0 0 0 rgb(47 248 255 / 0%);
    filter: brightness(1);
  }
}

@keyframes vipPanelGlow {
  0%,
  100% {
    box-shadow:
      inset 0 0 28px rgb(47 248 255 / 7%),
      0 0 28px rgb(22 119 255 / 8%);
  }

  50% {
    box-shadow:
      inset 0 0 30px rgb(255 176 32 / 10%),
      0 0 32px rgb(255 176 32 / 24%);
  }
}

@keyframes dangerBlink {
  0%,
  100% {
    background: rgb(255 76 76 / 9%);
  }

  50% {
    background: rgb(255 76 76 / 21%);
  }
}

@keyframes scrollY {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-50%);
  }
}

@keyframes orbitRotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes nodePulse {
  0%,
  100% {
    filter: brightness(1);
    transform: translate(-50%, -50%);
  }

  50% {
    filter: brightness(1.18);
    transform: translate(-50%, -50%);
  }
}

@media (max-height: 920px) {
  .screen-panel {
    padding: 10px;
  }

  .command-screen:not(.command-screen--compact) .metric-card {
    grid-template-columns: minmax(0, 1fr);
    gap: 5px;
    align-content: center;
    min-height: 56px;
    padding: 6px 8px;
  }

  .metric-title {
    font-size: 10px;
    line-height: 15px;
  }

  .command-screen:not(.command-screen--compact) .metric-value-row {
    justify-content: flex-start;
    width: 100%;
    min-width: 0;
    min-height: 28px;
    text-align: left;
  }

  .command-screen:not(.command-screen--compact) .metric-value {
    font-size: 24px;
    line-height: 1;
  }

  .metric-trend {
    margin-top: 1px;
    font-size: 10px;
    line-height: 14px;
  }

  .situation-card strong {
    font-size: 24px;
  }

  .situation-stage {
    grid-template-columns: minmax(170px, 0.92fr) minmax(240px, 1.08fr);
  }

  .situation-core {
    width: 86px;
    height: 86px;
  }

  .situation-core strong {
    font-size: 30px;
  }

  .constellation-node {
    min-width: 54px;
    padding: 4px 6px;
  }

  .constellation-node strong {
    font-size: 14px;
  }

  .insight-strip {
    min-height: 116px;
    gap: 8px;
    margin-top: 8px;
  }

  .intent-radar,
  .sla-lanes {
    padding: 7px;
  }

  .intent-chip {
    height: 24px;
  }

  .ai-analysis-item {
    grid-template-columns: 30px minmax(0, 1fr) auto;
    column-gap: 8px;
    row-gap: 6px;
    min-height: 48px;
    padding: 6px 8px;
  }

  .ai-analysis-item__icon {
    width: 30px;
    height: 30px;
    font-size: 9px;
  }

  .risk-item {
    min-height: 46px;
    padding: 6px 0;
  }
}

@media (max-height: 920px) {
  .command-screen--fullscreen .screen-column--left.is-fullscreen,
  .command-screen:fullscreen .screen-column--left.is-fullscreen {
    grid-template-rows: minmax(347px, 0.56fr) minmax(0, 0.44fr);
  }

  .command-screen--fullscreen .screen-column--center,
  .command-screen:fullscreen .screen-column--center {
    grid-template-rows: minmax(204px, 0.95fr) minmax(210px, 1.16fr) minmax(154px, 0.72fr);
  }

  .command-screen--fullscreen .screen-column--right,
  .command-screen:fullscreen .screen-column--right {
    grid-template-rows: minmax(350px, 1fr) minmax(226px, 0.78fr);
  }
}

@media (max-height: 780px) {
  .command-screen--fullscreen .screen-header,
  .command-screen:fullscreen .screen-header {
    height: 78px;
    padding-top: 10px;
  }

  .command-screen--fullscreen .screen-grid,
  .command-screen:fullscreen .screen-grid {
    height: calc(100% - 78px);
    padding-bottom: 14px;
  }

  .command-screen--fullscreen .screen-column--left.is-fullscreen,
  .command-screen:fullscreen .screen-column--left.is-fullscreen {
    grid-template-rows: minmax(295px, 0.56fr) minmax(0, 0.44fr);
  }

  .command-screen--fullscreen .screen-column--center,
  .command-screen:fullscreen .screen-column--center {
    grid-template-rows: minmax(178px, 0.95fr) minmax(188px, 1.16fr) minmax(132px, 0.72fr);
  }

  .command-screen--fullscreen .screen-column--right,
  .command-screen:fullscreen .screen-column--right {
    grid-template-rows: minmax(310px, 1fr) minmax(202px, 0.78fr);
  }
}

.command-screen--fullscreen.command-screen--compact .screen-column--left {
  grid-template-rows: minmax(300px, 0.55fr) minmax(0, 0.45fr);
}

.command-screen--fullscreen.command-screen--compact .screen-column--right {
  grid-template-rows: minmax(310px, 1fr) minmax(220px, 0.82fr);
}

.command-screen--fullscreen.command-screen--compact .screen-grid {
  grid-template-columns: minmax(240px, 24fr) minmax(480px, 52fr) minmax(260px, 24fr);
}

.command-screen--fullscreen.command-screen--compact .metric-grid {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: repeat(8, minmax(28px, 1fr));
  gap: 5px;
  flex: 1 1 0;
  height: auto;
}

.command-screen--fullscreen.command-screen--compact .metric-card {
  grid-template-columns: minmax(0, 1fr) minmax(84px, auto);
  gap: 8px;
  min-height: 28px;
  padding: 4px 8px;
  overflow: hidden;
}

.command-screen--fullscreen.command-screen--compact .metric-title {
  font-size: 10px;
  line-height: 13px;
}

.command-screen--fullscreen.command-screen--compact .metric-trend {
  margin-top: 1px;
  font-size: 10px;
  line-height: 12px;
}

.command-screen--fullscreen.command-screen--compact .metric-value-row {
  justify-content: flex-end;
  width: auto;
  min-width: 84px;
  min-height: 26px;
  text-align: right;
}

.command-screen--fullscreen.command-screen--compact .metric-value {
  font-size: 22px;
}

.command-screen--stacked {
  overflow: hidden;
}

.command-screen--stacked .screen-header {
  grid-template-columns: minmax(0, 1fr) auto;
  height: auto;
  min-height: 58px;
  padding: 8px 10px;
}

.command-screen--stacked .screen-header__brand {
  display: none;
}

.command-screen--stacked .screen-header__center {
  min-width: 0;
  text-align: left;
}

.command-screen--stacked .screen-header__center::before,
.command-screen--stacked .screen-header__center::after {
  display: none;
}

.command-screen--stacked .screen-header__center h1 {
  margin-top: 3px;
  overflow: hidden;
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command-screen--stacked .screen-kicker {
  font-size: 10px;
}

.command-screen--stacked .screen-header__status {
  flex-wrap: wrap;
  gap: 6px;
  max-width: 410px;
}

.command-screen--stacked .clock-block {
  padding-right: 0;
}

.command-screen--stacked .clock-time {
  font-size: 16px;
}

.command-screen--stacked .clock-date {
  display: none;
}

.command-screen--stacked .status-pill {
  height: 26px;
  padding: 0 7px;
  font-size: 11px;
}

.command-screen--stacked .screen-action {
  width: 28px;
  min-width: 28px;
  height: 28px;
}

.command-screen--stacked .screen-grid {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(520px, auto) repeat(2, minmax(260px, auto));
  gap: 10px;
  height: calc(100% - 58px);
  padding: 0 10px 10px;
  overflow-x: hidden;
  overflow-y: auto;
}

.command-screen--stacked .screen-column--center {
  order: 1;
  grid-template-rows: minmax(330px, 0.95fr) minmax(240px, 1.2fr) minmax(150px, 0.72fr);
  min-height: 730px;
}

.command-screen--stacked .screen-column--left {
  order: 2;
  grid-template-rows: minmax(210px, 1fr) minmax(230px, 1fr);
  min-height: 450px;
}

.command-screen--stacked .screen-column--right {
  order: 3;
  grid-template-rows: minmax(360px, 1fr) minmax(280px, 0.85fr);
  min-height: 660px;
}

.command-screen--stacked .situation-stage {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(170px, 1fr) auto;
}

.command-screen--stacked .situation-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.command-screen--stacked .insight-strip {
  grid-template-columns: minmax(0, 1fr);
  min-height: 240px;
}

.command-screen--stacked .flow-chain {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  height: auto;
  min-height: 0;
  overflow-y: auto;
}

.command-screen--stacked .flow-node:not(:last-child)::after {
  display: none;
}

.command-screen--stacked .queue-table {
  min-height: 96px;
  max-height: 150px;
}

@media (max-width: 920px) {
  .command-screen--stacked .screen-header {
    grid-template-columns: minmax(0, 1fr);
  }

  .command-screen--stacked .screen-header__status {
    justify-content: flex-start;
    max-width: 100%;
  }

  .command-screen--stacked .status-pill--cyan {
    display: none;
  }

  .command-screen--stacked .screen-grid {
    height: calc(100% - 92px);
  }

  .command-screen--stacked .situation-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .command-screen--stacked .flow-chain {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
