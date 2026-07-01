<template>
  <div class="biz-page biz-page--agents">
    <header class="biz-topbar agent-topbar">
      <p>{{ pageDescription }}</p>
      <div class="biz-topbar__controls">
        <div class="topbar-filter">
          <a-input
            v-model:value="query.keyword"
            allow-clear
            placeholder="搜索坐席、团队、技能、任务"
            @press-enter="refreshAgents"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
          <a-select v-model:value="query.status" placeholder="状态">
            <a-select-option v-for="item in statusOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-select v-model:value="query.skill" placeholder="技能">
            <a-select-option v-for="item in skillOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-select v-model:value="query.team" placeholder="团队">
            <a-select-option v-for="item in teamOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
        </div>
        <a-space class="biz-topbar__actions">
          <a-button @click="refreshAgents">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </a-space>
      </div>
    </header>

    <section class="agent-shell">
      <aside class="agent-list-panel">
        <div class="panel-title">
          <div>
            <h2>坐席列表</h2>
            <small>{{ filteredAgents.length }} 人匹配当前条件</small>
          </div>
          <a-tag color="processing">实时</a-tag>
        </div>

        <div class="agent-list">
          <button
            v-for="agent in filteredAgents"
            :key="agent.id"
            class="agent-row"
            :class="{ active: selectedAgent?.id === agent.id, danger: hasAlert(agent) }"
            @click="selectAgent(agent.id)"
          >
            <div class="agent-row__head">
              <strong>{{ agent.name }}</strong>
              <a-tag :color="statusColor(agent.status)">{{ agent.status }}</a-tag>
            </div>
            <div class="agent-row__meta">
              <span>{{ agent.team }}</span>
              <span>最近活跃 {{ agent.lastActive }}</span>
            </div>
            <div class="agent-tags">
              <a-tag v-for="skill in agent.skills" :key="skill">{{ skill }}</a-tag>
            </div>
            <div class="load-line">
              <span>当前负载 {{ agent.currentLoad }}/{{ agent.capacity }}</span>
              <span>处理中 {{ agent.processing }} 单</span>
            </div>
            <a-progress
              :percent="loadPercent(agent)"
              :show-info="false"
              :status="loadPercent(agent) >= 90 ? 'exception' : 'active'"
            />
            <div class="agent-row__foot">
              <span>今日 {{ agent.todayHandled }}</span>
              <span>满意度 {{ agent.satisfaction }}%</span>
              <span v-if="hasAlert(agent)" class="warn-text"><WarningOutlined /> {{ agent.alerts.length }}</span>
            </div>
          </button>

          <a-empty v-if="!filteredAgents.length" description="暂无匹配坐席" />
        </div>
      </aside>

      <main v-if="selectedAgent" class="agent-detail-panel">
        <div class="detail-scroll">
          <section class="visual-grid">
            <article class="visual-card visual-card--load">
              <div class="section-title">
                <h2>负载容量</h2>
                <small>{{ selectedAgent.currentLoad }}/{{ selectedAgent.capacity }} 当前总接待量</small>
              </div>
              <div ref="loadChartRef" class="agent-chart agent-chart--load" />
            </article>

            <article class="visual-card visual-card--channel">
              <div class="section-title">
                <h2>渠道任务</h2>
                <small>在线客服、呼叫、工单、邮件、短信</small>
              </div>
              <div ref="channelChartRef" class="agent-chart" />
            </article>

            <article class="visual-card">
              <div class="section-title">
                <h2>技能匹配</h2>
                <small>{{ dispatchSuggestion(selectedAgent) }}</small>
              </div>
              <div ref="skillChartRef" class="agent-chart" />
            </article>

            <article class="visual-card">
              <div class="section-title">
                <h2>处理趋势</h2>
                <small>处理量、解决率、满意度联动</small>
              </div>
              <div ref="trendChartRef" class="agent-chart" />
            </article>
          </section>
        </div>

        <aside class="agent-side">
          <section class="side-section">
            <h2>绩效联动</h2>
            <div class="metric-row">
              <span>今日处理量</span>
              <strong>{{ selectedAgent.todayHandled }}</strong>
            </div>
            <div class="metric-row">
              <span>解决率</span>
              <strong>{{ selectedAgent.solvedRate }}%</strong>
            </div>
            <div class="metric-row">
              <span>满意度</span>
              <strong>{{ selectedAgent.satisfaction }}%</strong>
            </div>
          </section>
          <section class="side-section">
            <h2>任务分配</h2>
            <label>待分配任务</label>
            <a-select v-model:value="dispatchForm.taskId" class="full-control">
              <a-select-option v-for="task in pendingTasks" :key="task.id" :value="task.id">
                {{ task.title }}
              </a-select-option>
            </a-select>
            <label>分配依据</label>
            <a-select v-model:value="dispatchForm.rule" class="full-control">
              <a-select-option value="skill">技能优先</a-select-option>
              <a-select-option value="load">负载优先</a-select-option>
              <a-select-option value="priority">优先级优先</a-select-option>
            </a-select>
            <a-button block type="primary" @click="assignTask(selectedAgent)">确认分配</a-button>
          </section>
        </aside>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { message } from 'ant-design-vue';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ReloadOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons-vue';

type AgentStatus = '在线' | '忙碌' | '离线' | '小休' | '培训中';
type AgentSkill = '退款' | '账单' | '技术支持' | 'VIP' | '投诉';
type TaskPriority = '低' | '中' | '高' | '紧急';

interface AgentTask {
  id: string;
  title: string;
  channel: string;
  priority: TaskPriority;
  skill: AgentSkill;
  status: string;
  sla: string;
  customer: string;
  updatedAt: string;
}

interface AgentRecord {
  time: string;
  title: string;
  content: string;
  result: string;
}

interface AgentAlert {
  title: string;
  content: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  team: string;
  status: AgentStatus;
  skills: AgentSkill[];
  currentLoad: number;
  capacity: number;
  processing: number;
  todayHandled: number;
  solvedRate: number;
  satisfaction: number;
  lastActive: string;
  channels: {
    chat: number;
    call: number;
    ticket: number;
    email: number;
    sms: number;
  };
  alerts: AgentAlert[];
  tasks: AgentTask[];
  records: AgentRecord[];
}

const pageDescription = '管理坐席资料、在线状态、技能组、负载容量、任务分配和坐席运营可视化。';
const statusOptions: Array<AgentStatus | '全部状态'> = ['全部状态', '在线', '忙碌', '离线', '小休', '培训中'];
const skillOptions: Array<AgentSkill | '全部技能'> = ['全部技能', '退款', '账单', '技术支持', 'VIP', '投诉'];
const teamOptions = ['全部团队', '华东客服组', 'VIP 专席', '技术支持组', '投诉处理组'];

const agents = ref<Agent[]>([
  {
    id: 'A001',
    name: '陈沐阳',
    role: '高级坐席',
    team: 'VIP 专席',
    status: '在线',
    skills: ['VIP', '退款', '投诉'],
    currentLoad: 7,
    capacity: 10,
    processing: 5,
    todayHandled: 42,
    solvedRate: 91,
    satisfaction: 96,
    lastActive: '1 分钟前',
    channels: { chat: 3, call: 1, ticket: 2, email: 1, sms: 0 },
    alerts: [{ title: 'SLA 临期', content: 'VIP 退款工单剩余 18 分钟触达 SLA。' }],
    tasks: [
      { id: 'T101', title: 'VIP 客户退款加急', channel: '工单', priority: '紧急', skill: '退款', status: '处理中', sla: '18 分钟', customer: '蓝湖集团', updatedAt: '10:42' },
      { id: 'T102', title: '投诉会话升级', channel: '在线客服', priority: '高', skill: '投诉', status: '处理中', sla: '42 分钟', customer: '锐云科技', updatedAt: '10:36' },
    ],
    records: [
      { time: '10:42', title: '接入 VIP 退款工单', content: '已核验订单、支付流水和客户等级。', result: '处理中' },
      { time: '09:58', title: '完成投诉回访', content: '同步补偿方案并关联原始会话。', result: '已解决' },
    ],
  },
  {
    id: 'A002',
    name: '李若宁',
    role: '在线客服',
    team: '华东客服组',
    status: '忙碌',
    skills: ['账单', '退款'],
    currentLoad: 11,
    capacity: 10,
    processing: 8,
    todayHandled: 38,
    solvedRate: 86,
    satisfaction: 89,
    lastActive: '刚刚',
    channels: { chat: 5, call: 2, ticket: 2, email: 1, sms: 1 },
    alerts: [
      { title: '负载过高', content: '当前负载已超过容量，建议转移低优先级任务。' },
      { title: '长时间未响应', content: '账单咨询会话已 9 分钟未回复。' },
    ],
    tasks: [
      { id: 'T201', title: '账单金额争议', channel: '在线客服', priority: '高', skill: '账单', status: '等待回复', sla: '25 分钟', customer: '星河零售', updatedAt: '10:45' },
      { id: 'T202', title: '退款进度查询', channel: '短信', priority: '中', skill: '退款', status: '待处理', sla: '2 小时', customer: '北辰商贸', updatedAt: '10:21' },
    ],
    records: [
      { time: '10:45', title: '账单咨询转人工', content: '客户补充了发票和扣费截图。', result: '待确认' },
      { time: '09:40', title: '完成短信回访', content: '发送退款到账说明。', result: '已完成' },
    ],
  },
  {
    id: 'A003',
    name: '周启航',
    role: '技术支持',
    team: '技术支持组',
    status: '小休',
    skills: ['技术支持', 'VIP'],
    currentLoad: 3,
    capacity: 8,
    processing: 3,
    todayHandled: 24,
    solvedRate: 94,
    satisfaction: 97,
    lastActive: '12 分钟前',
    channels: { chat: 1, call: 0, ticket: 2, email: 0, sms: 0 },
    alerts: [{ title: '状态异常', content: '仍有 3 个技术工单处理中，当前状态为小休。' }],
    tasks: [
      { id: 'T301', title: 'API 回调失败排查', channel: '工单', priority: '高', skill: '技术支持', status: '处理中', sla: '1 小时', customer: '鲸云互联', updatedAt: '10:18' },
      { id: 'T302', title: 'VIP 集成咨询', channel: '邮件', priority: '中', skill: 'VIP', status: '待回复', sla: '3 小时', customer: '云麓软件', updatedAt: '09:52' },
    ],
    records: [
      { time: '10:18', title: '接入技术工单', content: '已定位到回调签名配置差异。', result: '处理中' },
      { time: '08:57', title: '关闭登录故障', content: '补充知识库方案并同步客户。', result: '已解决' },
    ],
  },
  {
    id: 'A004',
    name: '王嘉仪',
    role: '投诉专员',
    team: '投诉处理组',
    status: '培训中',
    skills: ['投诉', '账单'],
    currentLoad: 2,
    capacity: 6,
    processing: 2,
    todayHandled: 16,
    solvedRate: 88,
    satisfaction: 92,
    lastActive: '25 分钟前',
    channels: { chat: 0, call: 1, ticket: 1, email: 0, sms: 0 },
    alerts: [{ title: '技能不匹配', content: '有一条技术支持邮件待分配，建议转给技术支持组。' }],
    tasks: [
      { id: 'T401', title: '账单投诉升级', channel: '客户联络中心', priority: '高', skill: '投诉', status: '处理中', sla: '36 分钟', customer: '晨星教育', updatedAt: '10:05' },
    ],
    records: [
      { time: '10:05', title: '接听投诉电话', content: '已记录客户诉求，等待主管确认补偿口径。', result: '升级中' },
      { time: '09:12', title: '完成账单解释', content: '客户确认扣费周期说明。', result: '已解决' },
    ],
  },
  {
    id: 'A005',
    name: '赵一诺',
    role: '邮件坐席',
    team: '华东客服组',
    status: '离线',
    skills: ['账单', '技术支持'],
    currentLoad: 0,
    capacity: 8,
    processing: 0,
    todayHandled: 19,
    solvedRate: 90,
    satisfaction: 94,
    lastActive: '1 小时前',
    channels: { chat: 0, call: 0, ticket: 0, email: 0, sms: 0 },
    alerts: [],
    tasks: [],
    records: [
      { time: '09:30', title: '完成邮件批处理', content: '处理 12 封账单类邮件并完成标签归档。', result: '已完成' },
      { time: '08:46', title: '同步知识库建议', content: '补充账单周期 FAQ。', result: '已完成' },
    ],
  },
]);

const selectedAgentId = ref(agents.value[0]?.id);
const loadChartRef = ref<HTMLDivElement>();
const channelChartRef = ref<HTMLDivElement>();
const skillChartRef = ref<HTMLDivElement>();
const trendChartRef = ref<HTMLDivElement>();
let loadChart: echarts.ECharts | undefined;
let channelChart: echarts.ECharts | undefined;
let skillChart: echarts.ECharts | undefined;
let trendChart: echarts.ECharts | undefined;

const query = reactive({
  keyword: '',
  status: '全部状态' as AgentStatus | '全部状态',
  skill: '全部技能' as AgentSkill | '全部技能',
  team: '全部团队',
});
const dispatchForm = reactive({
  taskId: 'P001',
  rule: 'skill',
});
const pendingTasks = [
  { id: 'P001', title: 'VIP 投诉会话 / 紧急' },
  { id: 'P002', title: '账单邮件待回复 / 高' },
  { id: 'P003', title: '技术工单待接入 / 中' },
];
const filteredAgents = computed(() => {
  const keyword = query.keyword.trim().toLowerCase();
  return agents.value.filter((agent) => {
    const matchKeyword =
      !keyword ||
      [agent.name, agent.team, agent.role, ...agent.skills, ...agent.tasks.map((task) => task.title)]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    const matchStatus = query.status === '全部状态' || agent.status === query.status;
    const matchSkill = query.skill === '全部技能' || agent.skills.includes(query.skill);
    const matchTeam = query.team === '全部团队' || agent.team === query.team;
    return matchKeyword && matchStatus && matchSkill && matchTeam;
  });
});

const selectedAgent = computed(() => {
  return filteredAgents.value.find((agent) => agent.id === selectedAgentId.value) || filteredAgents.value[0] || agents.value[0];
});

function selectAgent(id: string) {
  selectedAgentId.value = id;
}

function refreshAgents() {
  message.success('坐席状态已刷新');
  renderCharts();
}

function assignTask(agent?: Agent) {
  if (!agent) return;
  const task = pendingTasks.find((item) => item.id === dispatchForm.taskId);
  message.success(`${task?.title || '待分配任务'} 已按${ruleLabel(dispatchForm.rule)}分配给 ${agent.name}`);
}

function loadPercent(agent: Agent) {
  return Math.min(100, Math.round((agent.currentLoad / agent.capacity) * 100));
}

function hasAlert(agent: Agent) {
  return agent.alerts.length > 0 || loadPercent(agent) >= 90;
}

function statusColor(status: AgentStatus) {
  const map: Record<AgentStatus, string> = {
    在线: 'success',
    忙碌: 'warning',
    离线: 'default',
    小休: 'blue',
    培训中: 'purple',
  };
  return map[status];
}

function channelLoads(agent: Agent) {
  return [
    { label: '在线客服', value: agent.channels.chat },
    { label: '呼叫', value: agent.channels.call },
    { label: '工单', value: agent.channels.ticket },
    { label: '邮件', value: agent.channels.email },
    { label: '短信', value: agent.channels.sms },
  ];
}

function dispatchSuggestion(agent: Agent) {
  if (agent.status === '离线') return '暂不分配';
  if (loadPercent(agent) >= 90) return '转移低优先级任务';
  if (loadPercent(agent) <= 40) return '可承接新任务';
  return '保持技能优先分配';
}

function dispatchReason(agent: Agent) {
  if (agent.status === '离线') return '坐席不在线，避免产生未响应任务。';
  if (loadPercent(agent) >= 90) return '当前容量接近上限，优先保护 SLA 和响应时效。';
  if (loadPercent(agent) <= 40) return '负载较低，可承接匹配技能的新会话或工单。';
  return '状态和容量稳定，继续按技能标签匹配任务。';
}

function priorityCounts(agent: Agent) {
  const counts: Record<TaskPriority, number> = { 低: 0, 中: 0, 高: 0, 紧急: 0 };
  agent.tasks.forEach((task) => {
    counts[task.priority] += 1;
  });
  return counts;
}

function ruleLabel(rule: string) {
  const map: Record<string, string> = {
    skill: '技能优先',
    load: '负载优先',
    priority: '优先级优先',
  };
  return map[rule] || '技能优先';
}

function skillScores(agent: Agent) {
  const skills: AgentSkill[] = ['退款', '账单', '技术支持', 'VIP', '投诉'];
  return skills.map((skill) => {
    const taskCount = agent.tasks.filter((task) => task.skill === skill).length;
    return agent.skills.includes(skill) ? Math.min(100, 76 + taskCount * 8) : 28;
  });
}

function trendValues(agent: Agent) {
  const base = Math.max(4, Math.round(agent.todayHandled / 8));
  const loadOffset = Math.round(loadPercent(agent) / 20);
  return [base - 2, base, base + loadOffset, base + 2, base + loadOffset + 1, base + 3].map((value) => Math.max(1, value));
}

function chartTextColor() {
  return document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
}

function chartLabelColor() {
  return document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#0f172a';
}

function initCharts() {
  if (loadChartRef.value && !loadChart) loadChart = echarts.init(loadChartRef.value);
  if (channelChartRef.value && !channelChart) channelChart = echarts.init(channelChartRef.value);
  if (skillChartRef.value && !skillChart) skillChart = echarts.init(skillChartRef.value);
  if (trendChartRef.value && !trendChart) trendChart = echarts.init(trendChartRef.value);
  resizeCharts();
  renderCharts();
}

function renderCharts() {
  const agent = selectedAgent.value;
  if (!agent) return;

  const textColor = chartTextColor();
  const labelColor = chartLabelColor();
  const channels = channelLoads(agent);
  const counts = priorityCounts(agent);

  loadChart?.setOption({
    color: ['#4f7bff', '#ef4444', '#f59e0b', '#94a3b8'],
    animation: false,
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['62%', '82%'],
        center: ['34%', '50%'],
        label: { show: false },
        data: [
          { name: '已占用', value: agent.currentLoad },
          { name: '剩余容量', value: Math.max(0, agent.capacity - agent.currentLoad) },
        ],
      },
      {
        type: 'pie',
        radius: ['0%', '46%'],
        center: ['75%', '50%'],
        label: { color: labelColor, formatter: '{b}\\n{c}' },
        data: Object.entries(counts).map(([name, value]) => ({ name, value })),
      },
    ],
    graphic: [
      {
        type: 'text',
        left: '25%',
        top: '43%',
        style: {
          text: `${loadPercent(agent)}%`,
          fill: labelColor,
          fontSize: 24,
          fontWeight: 700,
          textAlign: 'center',
        },
      },
    ],
  });

  channelChart?.setOption({
    color: ['#4f7bff'],
    animation: false,
    tooltip: { trigger: 'axis' },
    grid: { left: 34, right: 12, top: 24, bottom: 28 },
    xAxis: {
      type: 'category',
      data: channels.map((item) => item.label),
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, .45)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, .22)' } },
    },
    series: [
      {
        type: 'bar',
        barWidth: 24,
        data: channels.map((item) => item.value),
        itemStyle: { borderRadius: [6, 6, 0, 0] },
      },
    ],
  });

  skillChart?.setOption({
    color: ['#22c55e'],
    animation: false,
    tooltip: { trigger: 'item' },
    radar: {
      radius: '68%',
      indicator: ['退款', '账单', '技术支持', 'VIP', '投诉'].map((name) => ({ name, max: 100 })),
      axisName: { color: textColor },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, .28)' } },
      splitArea: { areaStyle: { color: ['rgba(79, 123, 255, .04)', 'rgba(34, 197, 94, .04)'] } },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, .28)' } },
    },
    series: [
      {
        type: 'radar',
        areaStyle: { color: 'rgba(34, 197, 94, .16)' },
        data: [{ name: '技能覆盖', value: skillScores(agent) }],
      },
    ],
  });

  trendChart?.setOption({
    color: ['#4f7bff', '#22c55e', '#f59e0b'],
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { color: textColor } },
    grid: { left: 34, right: 12, top: 24, bottom: 44 },
    xAxis: {
      type: 'category',
      data: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
      axisLabel: { color: textColor },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, .45)' } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, .22)' } },
    },
    series: [
      { name: '处理量', type: 'line', smooth: true, data: trendValues(agent) },
      { name: '解决率', type: 'line', smooth: true, data: trendValues(agent).map((value) => Math.round((value * agent.solvedRate) / 100)) },
      { name: '满意度', type: 'line', smooth: true, data: trendValues(agent).map((value) => Math.round((value * agent.satisfaction) / 100)) },
    ],
  });
}

function resizeCharts() {
  loadChart?.resize();
  channelChart?.resize();
  skillChart?.resize();
  trendChart?.resize();
}

onMounted(() => {
  nextTick(initCharts);
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts);
  loadChart?.dispose();
  channelChart?.dispose();
  skillChart?.dispose();
  trendChart?.dispose();
});

watch(selectedAgent, () => {
  nextTick(() => {
    initCharts();
    resizeCharts();
    window.setTimeout(resizeCharts, 80);
  });
});
</script>

<style scoped lang="scss">
.biz-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-width: 1180px;
  min-height: 0;
  overflow: hidden;
  color: var(--app-text);
}

.biz-topbar,
.agent-list-panel,
.agent-detail-panel {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgb(15 23 42 / 6%);
}

.biz-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.agent-topbar {
  justify-content: space-between;
}

.biz-topbar p {
  flex: 1 1 auto;
  min-width: 260px;
  margin: 0;
  color: var(--app-text-secondary);
  font-weight: 600;
  line-height: 1.7;
}

.biz-topbar__controls {
  display: flex;
  flex: 0 1 auto;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.topbar-filter {
  display: grid;
  flex: 0 1 auto;
  grid-template-columns: minmax(360px, 420px) 120px 140px 150px;
  gap: 8px;
  min-width: 0;
}

.biz-topbar__actions {
  flex: 0 0 auto;
}

.agent-shell {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
  overflow: hidden;
}

.agent-list-panel,
.agent-detail-panel {
  min-width: 0;
  min-height: 0;
}

.agent-list-panel {
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.panel-title,
.section-title,
.agent-row__head,
.agent-row__meta,
.load-line,
.agent-row__foot,
.metric-row {
  display: flex;
  align-items: center;
}

.panel-title,
.section-title,
.agent-row__head,
.load-line,
.agent-row__foot,
.metric-row {
  justify-content: space-between;
  gap: 12px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 22px;
  line-height: 1.3;
}

h2 {
  font-size: 16px;
  line-height: 1.4;
}

p,
small,
.agent-row__meta,
.load-line,
.agent-row__foot,
.side-section label {
  color: var(--app-text-secondary);
}

.agent-list,
.detail-scroll {
  min-height: 0;
  overflow: auto;
}

.agent-list {
  flex: 1 1 auto;
  padding-right: 2px;
  margin-top: 10px;
}

.agent-row {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 8px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.agent-row.active {
  border-color: var(--app-primary);
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.agent-row.danger:not(.active) {
  border-color: rgb(239 68 68 / 34%);
}

.agent-row__head strong,
.metric-row strong {
  color: var(--app-text);
}

.agent-row__meta,
.agent-row__foot {
  margin-top: 6px;
  font-size: 12px;
}

.agent-row__meta {
  justify-content: flex-start;
  gap: 12px;
}

.agent-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.load-line {
  margin-top: 8px;
  font-size: 12px;
}

.warn-text {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: var(--app-danger);
}

.agent-detail-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 0;
  overflow: hidden;
}

.detail-scroll {
  padding: 10px;
}

.detail-section,
.side-section {
  padding: 12px;
  margin-bottom: 10px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.visual-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.visual-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  background: rgb(255 255 255 / 72%);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.visual-card .section-title {
  flex: 0 0 auto;
}

:global(html.dark) .visual-card {
  background: rgb(255 255 255 / 8%);
}

.agent-chart {
  flex: 1 1 auto;
  width: 100%;
  min-height: 210px;
  height: auto;
  margin-top: 6px;
}

.agent-chart--load {
  min-height: 210px;
}

.agent-side {
  min-height: 0;
  padding: 10px 10px 10px 0;
  overflow: auto;
}

.side-section {
  display: grid;
  gap: 10px;
}

.metric-row {
  padding: 8px 0;
  border-bottom: 1px solid var(--app-border);
}

.metric-row:last-child {
  border-bottom: 0;
}

.full-control {
  width: 100%;
}

@media (max-width: 1360px) {
  .biz-page {
    min-width: 980px;
  }

  .agent-topbar {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .biz-topbar p {
    flex-basis: 100%;
  }

  .biz-topbar__controls {
    width: 100%;
    justify-content: flex-start;
  }

  .topbar-filter {
    flex: 1 1 auto;
    grid-template-columns: minmax(260px, 360px) 120px 140px 150px;
  }

  .agent-shell {
    grid-template-columns: 360px minmax(0, 1fr);
  }

  .agent-detail-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .agent-side {
    padding: 0 10px 10px;
  }

  .visual-grid {
    grid-template-columns: 1fr;
  }
}
</style>
