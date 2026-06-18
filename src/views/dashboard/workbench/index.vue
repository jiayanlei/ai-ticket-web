<template>
  <div class="business-workbench page-view">
    <section class="workbench-hero">
      <div class="workbench-hero__main">
        <span class="workbench-hero__eyebrow">
          <RobotOutlined />
          AI 办公助手
        </span>
        <h1>欢迎回来，{{ userStore.displayName }}</h1>
        <p>今日重点：优先处理投诉上升、技术类时长偏高和 SLA 风险工单。</p>
      </div>
      <div class="workbench-hero__time">
        <strong>{{ currentTimeText }}</strong>
        <span>{{ currentDateText }}</span>
      </div>
    </section>

    <section class="overview-grid" aria-label="今日智能概览">
      <article v-for="metric in overviewMetrics" :key="metric.key" class="overview-card" :class="`overview-card--${metric.tone}`">
        <div class="overview-card__icon">
          <component :is="metric.icon" />
        </div>
        <div class="overview-card__body">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.trend }}</small>
        </div>
      </article>
    </section>

    <section class="workbench-main">
      <main class="workbench-main__primary">
        <section class="ai-advice-panel">
          <div class="section-heading">
            <div>
              <span>AI WORK NOTE</span>
              <h2>AI 工作建议</h2>
            </div>
            <a-tag color="processing">实时生成</a-tag>
          </div>

          <div class="ai-advice-panel__content">
            <div class="ai-advice-panel__avatar">
              <RobotOutlined />
            </div>
            <div class="ai-advice-panel__list">
              <article v-for="item in aiSuggestions" :key="item.id" class="ai-advice-item">
                <div class="ai-advice-item__level" :class="`ai-advice-item__level--${item.level}`" />
                <div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.description }}</p>
                </div>
                <a-button type="link" size="small" @click="router.push(item.path)">查看</a-button>
              </article>
            </div>
          </div>
        </section>

        <section class="task-flow-panel">
          <div class="section-heading">
            <div>
              <span>TASK FLOW</span>
              <h2>我的任务流</h2>
            </div>
            <a-button type="link" @click="router.push('/dashboard/todo')">全部待办</a-button>
          </div>

          <div class="task-stage-list">
            <button
              v-for="stage in taskStages"
              :key="stage.key"
              class="task-stage"
              :class="{ 'task-stage--active': activeStage === stage.key }"
              type="button"
              @click="activeStage = stage.key"
            >
              <span>{{ stage.label }}</span>
              <strong>{{ stage.count }}</strong>
              <small>{{ stage.description }}</small>
            </button>
          </div>

          <div class="task-list">
            <article v-for="task in visibleTasks" :key="task.id" class="task-item">
              <div class="task-item__timeline">
                <span />
              </div>
              <div class="task-item__content">
                <div class="task-item__title-row">
                  <h3>{{ task.title }}</h3>
                  <a-tag :color="priorityColorMap[task.priority]">{{ priorityTextMap[task.priority] }}</a-tag>
                </div>
                <div class="task-item__meta">
                  <span>{{ task.status }}</span>
                  <span>{{ task.remaining }}</span>
                  <span>{{ task.category }}</span>
                </div>
              </div>
              <div class="task-item__actions">
                <a-tooltip title="查看">
                  <a-button shape="circle" size="small" @click="openTask(task)">
                    <template #icon><EyeOutlined /></template>
                  </a-button>
                </a-tooltip>
                <a-tooltip title="处理">
                  <a-button shape="circle" size="small" type="primary" @click="processTask(task)">
                    <template #icon><ToolOutlined /></template>
                  </a-button>
                </a-tooltip>
                <a-tooltip :title="isTaskFollowed(task.id) ? '取消关注' : '标记关注'">
                  <a-button shape="circle" size="small" @click="toggleTaskFollow(task.id)">
                    <template #icon>
                      <StarFilled v-if="isTaskFollowed(task.id)" />
                      <StarOutlined v-else />
                    </template>
                  </a-button>
                </a-tooltip>
              </div>
            </article>
          </div>
        </section>
      </main>

      <aside class="workbench-main__side">
        <section class="hotspot-panel">
          <div class="section-heading">
            <div>
              <span>HOT RADAR</span>
              <h2>业务热点雷达</h2>
            </div>
          </div>
          <div class="hotspot-radar" aria-hidden="true">
            <span class="hotspot-radar__ring hotspot-radar__ring--outer" />
            <span class="hotspot-radar__ring hotspot-radar__ring--middle" />
            <span class="hotspot-radar__ring hotspot-radar__ring--inner" />
            <span v-for="point in radarPoints" :key="point.name" class="hotspot-radar__point" :style="point.style" />
            <strong>AI</strong>
          </div>
          <div class="hotspot-tags">
            <button
              v-for="hotspot in hotspots"
              :key="hotspot.name"
              type="button"
              class="hotspot-tag"
              :class="`hotspot-tag--${hotspot.level}`"
              @click="openHotspot(hotspot.name)"
            >
              <span>{{ hotspot.name }}</span>
              <strong>{{ hotspot.count }}</strong>
            </button>
          </div>
        </section>

        <section class="quick-action-panel">
          <div class="section-heading">
            <div>
              <span>QUICK ACTION</span>
              <h2>快捷行动</h2>
            </div>
          </div>
          <div class="quick-action-grid">
            <button
              v-for="action in quickActions"
              :key="action.label"
              type="button"
              class="quick-action"
              :class="`quick-action--${action.tone}`"
              @click="router.push(action.path)"
            >
              <component :is="action.icon" />
              <span>{{ action.label }}</span>
            </button>
          </div>
        </section>

        <section class="activity-panel">
          <div class="section-heading">
            <div>
              <span>RECENT</span>
              <h2>最近动态</h2>
            </div>
          </div>
          <div class="activity-list">
            <article v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <span class="activity-item__dot" :class="`activity-item__dot--${activity.tone}`" />
              <div>
                <p>{{ activity.content }}</p>
                <small>{{ activity.time }}</small>
              </div>
            </article>
          </div>
        </section>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  AlertOutlined,
  BarChartOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PlusCircleOutlined,
  RobotOutlined,
  SettingOutlined,
  StarFilled,
  StarOutlined,
  ToolOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue';

import { useUserStore } from '@/stores/user';

type MetricTone = 'blue' | 'green' | 'amber' | 'rose';
type StageKey = 'pending' | 'followed' | 'risk' | 'done';
type Priority = 'urgent' | 'high' | 'normal';
type ActivityTone = 'blue' | 'green' | 'amber' | 'rose';

interface OverviewMetric {
  key: string;
  label: string;
  value: string;
  trend: string;
  tone: MetricTone;
  icon: Component;
}

interface AiSuggestion {
  id: string;
  title: string;
  description: string;
  level: 'risk' | 'focus' | 'normal';
  path: string;
}

interface TaskStage {
  key: StageKey;
  label: string;
  count: number;
  description: string;
}

interface TaskItem {
  id: string;
  title: string;
  priority: Priority;
  status: string;
  remaining: string;
  category: string;
}

interface Hotspot {
  name: string;
  count: number;
  level: 'hot' | 'warm' | 'cool';
}

interface QuickAction {
  label: string;
  path: string;
  tone: MetricTone | 'violet';
  icon: Component;
}

interface RecentActivity {
  id: string;
  content: string;
  time: string;
  tone: ActivityTone;
}

const router = useRouter();
const userStore = useUserStore();
const currentTime = ref(new Date());
const activeStage = ref<StageKey>('pending');
const followedTaskIds = ref<string[]>(['task-2']);
let clockTimer: ReturnType<typeof window.setInterval> | undefined;

const overviewMetrics: OverviewMetric[] = [
  {
    key: 'pending',
    label: '今日待处理',
    value: '42',
    trend: '较昨日上升 12%，上午新增压力集中',
    tone: 'blue',
    icon: ClockCircleOutlined,
  },
  {
    key: 'new',
    label: '今日新增',
    value: '68',
    trend: '电话渠道新增 31 件，客服入口最活跃',
    tone: 'green',
    icon: PlusCircleOutlined,
  },
  {
    key: 'risk',
    label: '超时风险',
    value: '9',
    trend: '有 3 条即将超时，建议优先升级',
    tone: 'rose',
    icon: AlertOutlined,
  },
  {
    key: 'ai',
    label: 'AI 已分析',
    value: '86%',
    trend: 'AI 已完成 86% 初步归因',
    tone: 'amber',
    icon: RobotOutlined,
  },
];

const aiSuggestions: AiSuggestion[] = [
  {
    id: 'advice-1',
    title: '投诉类工单上升',
    description: '服务态度相关问题较昨日增加 12%，建议先查看客户投诉和回访未完成工单。',
    level: 'risk',
    path: '/ticket/list?category=客户投诉',
  },
  {
    id: 'advice-2',
    title: '技术类平均处理时长偏高',
    description: '登录异常、接口超时集中在技术支持组，建议排查账号权限和数据同步链路。',
    level: 'focus',
    path: '/ticket/list?category=技术支持',
  },
  {
    id: 'advice-3',
    title: 'SLA 预警需要立即跟进',
    description: '有 5 条工单超过 SLA 预警线，其中 2 条为高优先级，可先分派给在线工程师。',
    level: 'normal',
    path: '/dashboard/todo',
  },
];

const taskStages: TaskStage[] = [
  { key: 'pending', label: '待我处理', count: 18, description: '6 条高优先级' },
  { key: 'followed', label: '我关注的', count: 7, description: '2 条有新动态' },
  { key: 'risk', label: '即将超时', count: 5, description: '最短剩余 36 分钟' },
  { key: 'done', label: '已完成', count: 24, description: '今日闭环率 78%' },
];

const taskMap: Record<StageKey, TaskItem[]> = {
  pending: [
    { id: 'task-1', title: '客户反馈登录后权限菜单缺失', priority: 'urgent', status: '待分派', remaining: '剩余 36 分钟', category: '账号权限' },
    { id: 'task-2', title: '数据同步失败导致报表延迟', priority: 'high', status: '处理中', remaining: '剩余 1 小时 12 分钟', category: '数据同步失败' },
    { id: 'task-3', title: '服务态度投诉需要主管复核', priority: 'normal', status: '待复核', remaining: '剩余 3 小时', category: '客户投诉' },
  ],
  followed: [
    { id: 'task-2', title: '数据同步失败导致报表延迟', priority: 'high', status: '处理中', remaining: '有新处理记录', category: '数据同步失败' },
    { id: 'task-4', title: '知识库检索结果命中率下降', priority: 'normal', status: '观察中', remaining: '今日需回看', category: '知识库' },
  ],
  risk: [
    { id: 'task-1', title: '客户反馈登录后权限菜单缺失', priority: 'urgent', status: 'SLA 预警', remaining: '剩余 36 分钟', category: '账号权限' },
    { id: 'task-5', title: '系统卡顿影响坐席接听效率', priority: 'high', status: '待升级', remaining: '剩余 52 分钟', category: '系统卡顿' },
  ],
  done: [
    { id: 'task-6', title: 'AI 已完成重复投诉归并', priority: 'normal', status: '已完成', remaining: '14:25 闭环', category: 'AI 分析' },
    { id: 'task-7', title: '发票同步异常已恢复', priority: 'normal', status: '已完成', remaining: '13:40 闭环', category: '数据同步失败' },
  ],
};

const priorityTextMap: Record<Priority, string> = {
  urgent: '紧急',
  high: '高',
  normal: '普通',
};

const priorityColorMap: Record<Priority, string> = {
  urgent: 'red',
  high: 'orange',
  normal: 'blue',
};

const hotspots: Hotspot[] = [
  { name: '登录异常', count: 26, level: 'hot' },
  { name: '系统卡顿', count: 18, level: 'hot' },
  { name: '账号权限', count: 15, level: 'warm' },
  { name: '数据同步失败', count: 12, level: 'warm' },
  { name: '客户投诉', count: 9, level: 'cool' },
];

const radarPoints = [
  { name: '登录异常', style: { left: '67%', top: '18%' } },
  { name: '系统卡顿', style: { left: '78%', top: '58%' } },
  { name: '账号权限', style: { left: '43%', top: '24%' } },
  { name: '数据同步失败', style: { left: '24%', top: '64%' } },
  { name: '客户投诉', style: { left: '52%', top: '78%' } },
];

const quickActions: QuickAction[] = [
  { label: '新建工单', path: '/service/tickets/create', tone: 'blue', icon: PlusCircleOutlined },
  { label: '工单列表', path: '/ticket/list', tone: 'green', icon: UnorderedListOutlined },
  { label: '知识库检索', path: '/knowledge', tone: 'amber', icon: BookOutlined },
  { label: 'AI 问答', path: '/ai/chat', tone: 'violet', icon: RobotOutlined },
  { label: '数据报表', path: '/analytics/cockpit', tone: 'rose', icon: BarChartOutlined },
  { label: '系统设置', path: '/system/settings', tone: 'blue', icon: SettingOutlined },
];

const recentActivities: RecentActivity[] = [
  { id: 'activity-1', content: 'TK202606080126 状态变更为处理中', time: '2 分钟前', tone: 'blue' },
  { id: 'activity-2', content: 'AI 完成一次投诉归因分析，命中服务态度问题', time: '8 分钟前', tone: 'green' },
  { id: 'activity-3', content: '知识库新增账号权限排查文档', time: '16 分钟前', tone: 'amber' },
  { id: 'activity-4', content: '有新的超时预警进入待办队列', time: '24 分钟前', tone: 'rose' },
];

const visibleTasks = computed(() => taskMap[activeStage.value]);
const currentTimeText = computed(() =>
  currentTime.value.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
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

onMounted(() => {
  clockTimer = window.setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onBeforeUnmount(() => {
  if (clockTimer) {
    window.clearInterval(clockTimer);
  }
});

function openTask(task: TaskItem) {
  router.push({
    path: '/ticket/list',
    query: {
      keyword: task.title,
    },
  });
}

function processTask(task: TaskItem) {
  router.push({
    path: '/ticket/list',
    query: {
      category: task.category,
    },
  });
}

function openHotspot(name: string) {
  router.push({
    path: '/ticket/list',
    query: {
      category: name,
    },
  });
}

function isTaskFollowed(taskId: string) {
  return followedTaskIds.value.includes(taskId);
}

function toggleTaskFollow(taskId: string) {
  if (isTaskFollowed(taskId)) {
    followedTaskIds.value = followedTaskIds.value.filter((id) => id !== taskId);
    return;
  }

  followedTaskIds.value = [...followedTaskIds.value, taskId];
}
</script>

<style scoped lang="scss">
.business-workbench {
  gap: 14px;
  padding: 2px;
}

.workbench-hero,
.overview-card,
.ai-advice-panel,
.task-flow-panel,
.hotspot-panel,
.quick-action-panel,
.activity-panel {
  border: 1px solid rgb(226 232 240 / 90%);
  border-radius: 8px;
  background: rgb(255 255 255 / 86%);
  box-shadow: 0 12px 34px rgb(15 23 42 / 6%);
}

.workbench-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 126px;
  padding: 24px 26px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(239 246 255 / 94%), rgb(255 255 255 / 92%) 45%, rgb(236 253 245 / 86%)),
    #ffffff;

  &::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: '';
    background-image:
      linear-gradient(rgb(59 130 246 / 8%) 1px, transparent 1px),
      linear-gradient(90deg, rgb(20 184 166 / 8%) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: linear-gradient(90deg, #000 0%, transparent 80%);
  }

  &__main,
  &__time {
    position: relative;
    z-index: 1;
  }

  &__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    margin-bottom: 10px;
    color: #0f766e;
    font-size: 13px;
    font-weight: 600;
    background: rgb(20 184 166 / 10%);
    border: 1px solid rgb(20 184 166 / 18%);
    border-radius: 999px;
  }

  h1 {
    margin: 0;
    color: #0f172a;
    font-size: 26px;
    line-height: 1.28;
  }

  p {
    max-width: 660px;
    margin: 8px 0 0;
    color: #475569;
    font-size: 14px;
    line-height: 1.7;
  }

  &__time {
    flex: 0 0 auto;
    display: grid;
    gap: 4px;
    min-width: 172px;
    padding: 14px 16px;
    text-align: right;
    background: rgb(255 255 255 / 72%);
    border: 1px solid rgb(148 163 184 / 20%);
    border-radius: 8px;

    strong {
      color: #0f172a;
      font-size: 28px;
      line-height: 1;
    }

    span {
      color: #64748b;
      font-size: 13px;
    }
  }
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.overview-card {
  position: relative;
  display: flex;
  gap: 14px;
  min-height: 124px;
  padding: 18px;
  overflow: hidden;

  &::after {
    position: absolute;
    right: 14px;
    bottom: 12px;
    width: 62px;
    height: 5px;
    content: '';
    background: currentColor;
    border-radius: 999px;
    opacity: 0.16;
  }

  &__icon {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    color: currentColor;
    background: rgb(255 255 255 / 72%);
    border: 1px solid currentColor;
    border-radius: 8px;
  }

  &__body {
    display: grid;
    gap: 5px;
    min-width: 0;

    span {
      color: #64748b;
      font-size: 13px;
    }

    strong {
      color: #0f172a;
      font-size: 30px;
      line-height: 1;
    }

    small {
      color: #475569;
      font-size: 12px;
      line-height: 1.55;
    }
  }

  &--blue {
    color: #2563eb;
    background: linear-gradient(135deg, rgb(239 246 255 / 96%), #ffffff);
  }

  &--green {
    color: #059669;
    background: linear-gradient(135deg, rgb(236 253 245 / 96%), #ffffff);
  }

  &--amber {
    color: #d97706;
    background: linear-gradient(135deg, rgb(255 251 235 / 96%), #ffffff);
  }

  &--rose {
    color: #e11d48;
    background: linear-gradient(135deg, rgb(255 241 242 / 96%), #ffffff);
  }
}

.workbench-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  gap: 14px;

  &__primary,
  &__side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
}

.ai-advice-panel,
.task-flow-panel,
.hotspot-panel,
.quick-action-panel,
.activity-panel {
  padding: 18px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  span {
    display: block;
    margin-bottom: 3px;
    color: #2563eb;
    font-size: 11px;
    font-weight: 700;
  }

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 17px;
    line-height: 1.35;
  }
}

.ai-advice-panel {
  background:
    linear-gradient(135deg, rgb(15 23 42 / 2%), rgb(20 184 166 / 7%)),
    rgb(255 255 255 / 90%);

  &__content {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 16px;
    align-items: stretch;
  }

  &__avatar {
    display: grid;
    place-items: center;
    min-height: 180px;
    color: #0891b2;
    font-size: 32px;
    background:
      linear-gradient(180deg, rgb(236 254 255 / 90%), rgb(255 255 255 / 76%)),
      #ffffff;
    border: 1px solid rgb(6 182 212 / 18%);
    border-radius: 8px;
    box-shadow: inset 0 0 28px rgb(6 182 212 / 12%);
  }

  &__list {
    display: grid;
    gap: 10px;
  }
}

.ai-advice-item {
  display: grid;
  grid-template-columns: 4px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 78px;
  padding: 12px 12px 12px 0;
  background: rgb(255 255 255 / 74%);
  border: 1px solid rgb(226 232 240 / 82%);
  border-radius: 8px;

  &__level {
    width: 4px;
    height: 100%;
    min-height: 54px;
    border-radius: 999px;

    &--risk {
      background: #e11d48;
    }

    &--focus {
      background: #d97706;
    }

    &--normal {
      background: #0891b2;
    }
  }

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 14px;
  }

  p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.55;
  }
}

.task-stage-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.task-stage {
  display: grid;
  gap: 5px;
  min-height: 86px;
  padding: 12px;
  color: #475569;
  text-align: left;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid rgb(226 232 240 / 90%);
  border-radius: 8px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover,
  &--active {
    color: #1d4ed8;
    border-color: rgb(37 99 235 / 38%);
    box-shadow: 0 10px 24px rgb(37 99 235 / 10%);
    transform: translateY(-1px);
  }

  span {
    font-size: 13px;
  }

  strong {
    color: #0f172a;
    font-size: 24px;
    line-height: 1;
  }

  small {
    font-size: 12px;
  }
}

.task-list {
  display: grid;
  gap: 10px;
}

.task-item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 82px;
  padding: 12px;
  background: linear-gradient(90deg, #ffffff, #f8fafc);
  border: 1px solid rgb(226 232 240 / 90%);
  border-radius: 8px;

  &__timeline {
    position: relative;
    display: grid;
    place-items: center;
    align-self: stretch;

    &::before {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 1px;
      content: '';
      background: rgb(37 99 235 / 18%);
    }

    span {
      position: relative;
      width: 10px;
      height: 10px;
      background: #2563eb;
      border: 2px solid #dbeafe;
      border-radius: 50%;
    }
  }

  &__content {
    min-width: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    h3 {
      margin: 0;
      overflow: hidden;
      color: #0f172a;
      font-size: 14px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-top: 8px;
    color: #64748b;
    font-size: 12px;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

.hotspot-panel {
  min-height: 326px;
}

.hotspot-radar {
  position: relative;
  display: grid;
  place-items: center;
  width: 188px;
  height: 188px;
  margin: 2px auto 14px;
  color: #0891b2;
  background: radial-gradient(circle, rgb(236 254 255 / 90%) 0%, rgb(255 255 255 / 0%) 70%);

  &__ring {
    position: absolute;
    border: 1px solid rgb(8 145 178 / 20%);
    border-radius: 50%;
  }

  &__ring--outer {
    inset: 8px;
  }

  &__ring--middle {
    inset: 38px;
  }

  &__ring--inner {
    inset: 68px;
  }

  &__point {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #14b8a6;
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 14px rgb(20 184 166 / 62%);
  }

  strong {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    color: #0f766e;
    background: #ffffff;
    border: 1px solid rgb(20 184 166 / 22%);
    border-radius: 50%;
  }
}

.hotspot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hotspot-tag {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 112px;
  height: 34px;
  padding: 0 10px;
  color: #334155;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid rgb(226 232 240 / 92%);
  border-radius: 999px;

  strong {
    font-size: 13px;
  }

  &--hot {
    color: #be123c;
    background: rgb(255 241 242 / 84%);
    border-color: rgb(244 63 94 / 22%);
  }

  &--warm {
    color: #b45309;
    background: rgb(255 251 235 / 86%);
    border-color: rgb(245 158 11 / 24%);
  }

  &--cool {
    color: #0f766e;
    background: rgb(240 253 250 / 86%);
    border-color: rgb(20 184 166 / 22%);
  }
}

.quick-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  color: #334155;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid rgb(226 232 240 / 90%);
  border-radius: 999px;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  span {
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--blue {
    color: #2563eb;
  }

  &--green {
    color: #059669;
  }

  &--amber {
    color: #d97706;
  }

  &--rose {
    color: #e11d48;
  }

  &--violet {
    color: #7c3aed;
  }
}

.activity-list {
  display: grid;
  gap: 12px;
}

.activity-item {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  gap: 10px;

  &__dot {
    width: 8px;
    height: 8px;
    margin-top: 7px;
    border-radius: 50%;

    &--blue {
      background: #2563eb;
    }

    &--green {
      background: #059669;
    }

    &--amber {
      background: #d97706;
    }

    &--rose {
      background: #e11d48;
    }
  }

  p {
    margin: 0;
    color: #334155;
    font-size: 13px;
    line-height: 1.55;
  }

  small {
    color: #94a3b8;
    font-size: 12px;
  }
}

@media (max-width: 1180px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workbench-main {
    grid-template-columns: 1fr;
  }

  .workbench-main__side {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }
}

@media (max-width: 860px) {
  .workbench-hero {
    align-items: flex-start;
    flex-direction: column;

    &__time {
      width: 100%;
      text-align: left;
    }
  }

  .task-stage-list,
  .workbench-main__side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .task-item {
    grid-template-columns: 18px minmax(0, 1fr);

    &__actions {
      grid-column: 2;
      justify-content: flex-start;
    }
  }
}

@media (max-width: 640px) {
  .overview-grid,
  .task-stage-list,
  .workbench-main__side,
  .quick-action-grid,
  .ai-advice-panel__content {
    grid-template-columns: 1fr;
  }

  .ai-advice-panel__avatar {
    min-height: 72px;
  }

  .ai-advice-item {
    grid-template-columns: 4px minmax(0, 1fr);

    .ant-btn {
      grid-column: 2;
      justify-self: start;
    }
  }
}
</style>
