<template>
  <div ref="pageRef" class="biz-page biz-page--performance">
    <header class="performance-toolbar">
      <div class="toolbar-intro">
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageDescription }}</p>
      </div>
      <div class="toolbar-filters">
        <a-input
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索坐席 / 团队 / 工号"
          @press-enter="loadData"
        />
        <a-select v-model:value="query.team" allow-clear placeholder="团队" @change="loadData">
          <a-select-option v-for="item in teamOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.channel" allow-clear placeholder="渠道" @change="loadData">
          <a-select-option v-for="item in channelOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-range-picker v-model:value="query.range" />
        <a-select v-model:value="query.status" allow-clear placeholder="状态" @change="loadData">
          <a-select-option v-for="item in performanceStatusOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-space class="toolbar-actions">
          <a-button type="primary" :loading="loading" @click="loadData">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button @click="loadData">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
          <a-button @click="openBoard('metrics')">
            <template #icon><DashboardOutlined /></template>
            打开看板
          </a-button>
          <a-button @click="message.success('绩效结果已加入导出队列')">
            <template #icon><DownloadOutlined /></template>
            导出
          </a-button>
        </a-space>
      </div>
    </header>

    <main class="performance-workbench">
      <section ref="scoreSectionRef" class="score-table-section">
        <div ref="sectionHeadingRef" class="section-heading">
          <h2>绩效总览</h2>
          <p>按个人、团队、渠道和周期计算得分，异常可直接进入改进闭环。</p>
        </div>

        <a-table
          class="performance-table"
          :columns="scoreColumns"
          :data-source="filteredScoreRows"
          :pagination="false"
          :scroll="{ x: 1420, y: tableScrollY }"
          row-key="id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'agent'">
              <button
                class="agent-cell"
                :class="{ active: activeScore?.id === record.id }"
                type="button"
                @click="selectScore(record)"
              >
                <strong>{{ record.agent }}</strong>
                <span>{{ record.employeeNo }} · {{ record.team }}</span>
              </button>
            </template>
            <template v-else-if="column.key === 'score'">
              <div class="score-cell">
                <strong>{{ record.score }}</strong>
                <a-progress :percent="record.score" :show-info="false" size="small" />
              </div>
            </template>
            <template v-else-if="column.key === 'rank'">
              <a-tag :color="record.rank <= 3 ? 'green' : record.rank >= 10 ? 'orange' : 'blue'">
                第 {{ record.rank }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'qualityScore'">
              <span :class="['metric-value', record.qualityScore < 86 ? 'metric-value--risk' : '']">
                {{ record.qualityScore }}
              </span>
            </template>
            <template v-else-if="column.key === 'exceptions'">
              <div class="tag-list">
                <a-tag
                  v-for="item in record.exceptions"
                  :key="item"
                  :color="exceptionColor(item)"
                >
                  {{ item }}
                </a-tag>
              </div>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-badge :status="record.status === '需改进' ? 'warning' : record.status === '复盘中' ? 'processing' : 'success'" :text="record.status" />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button size="small" type="link" @click="openBoard('metrics', record)">拆解</a-button>
                <a-button size="small" type="link" @click="createTask(record)">建任务</a-button>
                <a-button size="small" type="link" @click="openLinkedRecord(record)">查记录</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </section>

    </main>

    <a-drawer v-model:open="boardOpen" width="70vw" title="绩效看板" class="performance-board-drawer">
      <a-tabs v-model:active-key="activeTab" class="analysis-tabs">
        <a-tab-pane key="metrics" tab="指标拆解">
          <div class="analysis-scroll">
            <div class="breakdown-table">
              <div class="breakdown-head">
                <span>指标</span>
                <span>当前值</span>
                <span>目标</span>
                <span>权重</span>
                <span>趋势</span>
                <span>数据来源</span>
              </div>
              <div v-for="item in activeMetricRows" :key="item.name" class="breakdown-row">
                <span>{{ item.name }}</span>
                <strong>{{ item.value }}</strong>
                <span>{{ item.target }}</span>
                <span>{{ item.weight }}</span>
                <a-tag :color="item.trend === '下降' ? 'orange' : item.trend === '异常' ? 'red' : 'green'">
                  {{ item.trend }}
                </a-tag>
                <span>{{ item.source }}</span>
              </div>
            </div>
          </div>
        </a-tab-pane>
        <a-tab-pane key="exceptions" tab="异常原因">
          <div class="analysis-scroll">
            <div class="reason-list">
              <article v-for="item in activeExceptionReasons" :key="item.title">
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.description }}</p>
                </div>
                <a-tag :color="item.level === '高' ? 'red' : item.level === '中' ? 'orange' : 'blue'">
                  {{ item.level }}风险
                </a-tag>
              </article>
            </div>
          </div>
        </a-tab-pane>
        <a-tab-pane key="tasks" tab="改进任务">
          <div class="analysis-scroll">
            <a-table
              :columns="taskColumns"
              :data-source="improvementTasks"
              :pagination="false"
              :scroll="{ x: 980, y: 420 }"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="taskStatusColor(record.status)">{{ record.status }}</a-tag>
                </template>
                <template v-else-if="column.key === 'links'">
                  <a-space wrap>
                    <a-tag v-for="item in record.links" :key="item" color="blue">{{ item }}</a-tag>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
        <a-tab-pane key="review" tab="历史复盘">
          <div class="analysis-scroll review-grid">
            <article v-for="item in reviewRecords" :key="item.period">
              <strong>{{ item.period }}</strong>
              <p>{{ item.summary }}</p>
              <span>{{ item.archive }}</span>
            </article>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-drawer>

    <a-drawer v-model:open="detailOpen" width="520" :title="detailRecord?.title">
      <a-descriptions v-if="detailRecord" bordered :column="1" size="small">
        <a-descriptions-item label="编号">{{ detailRecord.code }}</a-descriptions-item>
        <a-descriptions-item label="客户">{{ detailRecord.customer }}</a-descriptions-item>
        <a-descriptions-item label="负责人">{{ detailRecord.owner }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="statusColor(detailRecord.status)">{{ detailRecord.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="AI 建议">{{ detailRecord.aiSuggestion }}</a-descriptions-item>
      </a-descriptions>
      <a-divider>闭环记录</a-divider>
      <a-timeline v-if="detailRecord">
        <a-timeline-item v-for="item in detailRecord.timeline" :key="item.time + item.action">
          <strong>{{ item.action }}</strong>
          <p>{{ item.content }}</p>
          <small>{{ item.operator }} / {{ item.time }}</small>
        </a-timeline-item>
      </a-timeline>
    </a-drawer>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import {
  DashboardOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { BusinessRecord, BusinessRecordStatus } from '@/api/business';
import { getBusinessRecordList } from '@/api/business';

type PerformanceStatus = '达标' | '需改进' | '复盘中';
type RiskLevel = '高' | '中' | '低';

interface ScoreRow {
  id: string;
  agent: string;
  employeeNo: string;
  team: string;
  channel: string;
  score: number;
  rank: number;
  handled: number;
  firstResponse: string;
  resolveRate: string;
  satisfaction: string;
  qualityScore: number;
  timeoutRate: string;
  transferRate: string;
  complaintRate: string;
  exceptions: string[];
  status: PerformanceStatus;
}

interface MetricRow {
  name: string;
  value: string;
  target: string;
  weight: string;
  trend: '上升' | '稳定' | '下降' | '异常';
  source: string;
}

interface ExceptionReason {
  title: string;
  description: string;
  level: RiskLevel;
}

interface ImprovementTask {
  id: string;
  agent: string;
  task: string;
  owner: string;
  deadline: string;
  status: '待处理' | '处理中' | '待复核' | '已完成';
  result: string;
  links: string[];
}

const moduleName = 'operations-performance';
const pageTitle = '绩效中心';
const pageDescription = '统一管理在线客服、呼叫、邮件、短信和工单坐席绩效，串联质检、培训与复盘闭环。';
const loading = ref(false);
const records = ref<BusinessRecord[]>([]);
const active = ref<BusinessRecord>();
const activeTab = ref('metrics');
const activeScore = ref<ScoreRow>();
const pageRef = ref<HTMLElement>();
const scoreSectionRef = ref<HTMLElement>();
const sectionHeadingRef = ref<HTMLElement>();
const tableScrollY = ref(360);
const boardOpen = ref(false);
const detailOpen = ref(false);
const detailRecord = ref<BusinessRecord>();
const query = reactive({
  keyword: '',
  team: undefined as string | undefined,
  channel: undefined as string | undefined,
  range: undefined,
  status: undefined as PerformanceStatus | undefined,
});

const performanceStatusOptions: PerformanceStatus[] = ['达标', '需改进', '复盘中'];
const teamOptions = ['在线一组', '客户联络中心', '邮件工单组', 'VIP 专席'];
const channelOptions = ['在线客服', '客户联络中心', '邮件', '短信', '工单'];

const scoreColumns = [
  { title: '坐席 / 团队', dataIndex: 'agent', key: 'agent', width: 210, fixed: 'left' },
  { title: '渠道', dataIndex: 'channel', key: 'channel', width: 110 },
  { title: '得分', dataIndex: 'score', key: 'score', width: 130, sorter: (a: ScoreRow, b: ScoreRow) => a.score - b.score },
  { title: '排名', dataIndex: 'rank', key: 'rank', width: 90, sorter: (a: ScoreRow, b: ScoreRow) => a.rank - b.rank },
  { title: '处理量', dataIndex: 'handled', key: 'handled', width: 95 },
  { title: '首响', dataIndex: 'firstResponse', key: 'firstResponse', width: 95 },
  { title: '解决率', dataIndex: 'resolveRate', key: 'resolveRate', width: 95 },
  { title: '满意度', dataIndex: 'satisfaction', key: 'satisfaction', width: 95 },
  { title: '质检分', dataIndex: 'qualityScore', key: 'qualityScore', width: 95 },
  { title: '超时率', dataIndex: 'timeoutRate', key: 'timeoutRate', width: 95 },
  { title: '转人工率', dataIndex: 'transferRate', key: 'transferRate', width: 105 },
  { title: '投诉率', dataIndex: 'complaintRate', key: 'complaintRate', width: 95 },
  { title: '异常标签', dataIndex: 'exceptions', key: 'exceptions', width: 240 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 170, fixed: 'right' },
];

const taskColumns = [
  { title: '坐席', dataIndex: 'agent', key: 'agent', width: 110 },
  { title: '改进事项', dataIndex: 'task', key: 'task', width: 240 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 110 },
  { title: '截止时间', dataIndex: 'deadline', key: 'deadline', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '处理结果', dataIndex: 'result', key: 'result', width: 220 },
  { title: '业务联动', dataIndex: 'links', key: 'links', width: 220 },
];

const scoreRows: ScoreRow[] = [
  {
    id: 'p-001',
    agent: '陈沐阳',
    employeeNo: 'A1024',
    team: '在线一组',
    channel: '在线客服',
    score: 96,
    rank: 1,
    handled: 486,
    firstResponse: '18秒',
    resolveRate: '92.4%',
    satisfaction: '98.2%',
    qualityScore: 94,
    timeoutRate: '1.8%',
    transferRate: '7.5%',
    complaintRate: '0.2%',
    exceptions: ['无重大异常'],
    status: '达标',
  },
  {
    id: 'p-002',
    agent: '林知夏',
    employeeNo: 'A1098',
    team: 'VIP 专席',
    channel: '客户联络中心',
    score: 91,
    rank: 2,
    handled: 352,
    firstResponse: '9秒',
    resolveRate: '89.8%',
    satisfaction: '96.7%',
    qualityScore: 91,
    timeoutRate: '2.1%',
    transferRate: '5.2%',
    complaintRate: '0.5%',
    exceptions: ['质检关注'],
    status: '达标',
  },
  {
    id: 'p-003',
    agent: '周予安',
    employeeNo: 'A1130',
    team: '邮件工单组',
    channel: '邮件',
    score: 86,
    rank: 5,
    handled: 278,
    firstResponse: '12分',
    resolveRate: '87.1%',
    satisfaction: '93.4%',
    qualityScore: 88,
    timeoutRate: '3.6%',
    transferRate: '4.9%',
    complaintRate: '0.8%',
    exceptions: ['首响波动'],
    status: '复盘中',
  },
  {
    id: 'p-004',
    agent: '王嘉宁',
    employeeNo: 'A1186',
    team: '客户联络中心',
    channel: '客户联络中心',
    score: 78,
    rank: 11,
    handled: 421,
    firstResponse: '14秒',
    resolveRate: '76.5%',
    satisfaction: '84.3%',
    qualityScore: 82,
    timeoutRate: '6.4%',
    transferRate: '12.8%',
    complaintRate: '2.4%',
    exceptions: ['满意度低', '投诉升高', '解决率下降'],
    status: '需改进',
  },
  {
    id: 'p-005',
    agent: '赵一鸣',
    employeeNo: 'A1217',
    team: '在线一组',
    channel: '工单',
    score: 74,
    rank: 14,
    handled: 198,
    firstResponse: '26分',
    resolveRate: '72.8%',
    satisfaction: '86.1%',
    qualityScore: 79,
    timeoutRate: '9.2%',
    transferRate: '9.4%',
    complaintRate: '1.8%',
    exceptions: ['首响超时', '质检扣分', '超时率高'],
    status: '需改进',
  },
  {
    id: 'p-006',
    agent: '宋梨',
    employeeNo: 'A1266',
    team: '邮件工单组',
    channel: '短信',
    score: 83,
    rank: 8,
    handled: 632,
    firstResponse: '自动触达',
    resolveRate: '85.6%',
    satisfaction: '91.5%',
    qualityScore: 87,
    timeoutRate: '2.9%',
    transferRate: '18.6%',
    complaintRate: '0.9%',
    exceptions: ['转人工率高'],
    status: '复盘中',
  },
];

const improvementTasks: ImprovementTask[] = [
  {
    id: 't-001',
    agent: '王嘉宁',
    task: '复盘近 20 通低满意度通话，输出话术修正点',
    owner: '主管 刘婧',
    deadline: '06-27',
    status: '处理中',
    result: '已完成 12 通，发现退款解释不完整',
    links: ['质检中心', '通话记录'],
  },
  {
    id: 't-002',
    agent: '赵一鸣',
    task: '补充 SLA 规则培训并由质检复核 5 个工单',
    owner: '培训 王珂',
    deadline: '06-28',
    status: '待处理',
    result: '待安排 30 分钟专项培训',
    links: ['培训中心', '工单记录'],
  },
  {
    id: 't-003',
    agent: '宋梨',
    task: '分析短信转人工节点，优化自动回复分流策略',
    owner: '运营 韩书',
    deadline: '06-30',
    status: '待复核',
    result: '已调整两条意图识别规则',
    links: ['会话记录', '坐席中心'],
  },
  {
    id: 't-004',
    agent: '周予安',
    task: '邮件首响超 10 分钟样本复盘',
    owner: '组长 许言',
    deadline: '07-01',
    status: '已完成',
    result: '高峰时段模板缺失，已补齐 6 条知识片段',
    links: ['知识库', '邮件记录'],
  },
];

const reviewRecords = [
  {
    period: '2026 年 6 月第 3 周',
    summary: '客户联络中心投诉率环比上升，已将退款政策话术纳入质检重点。',
    archive: '已归档：周绩效复盘 / 质检扣分明细 / 培训完成率',
  },
  {
    period: '2026 年 6 月第 2 周',
    summary: '在线客服首响稳定，短信渠道转人工率偏高，需要持续观察意图识别效果。',
    archive: '已归档：渠道趋势 / 团队排名 / 异常处理结果',
  },
  {
    period: '2026 年 5 月月度',
    summary: 'VIP 专席满意度保持领先，邮件工单组解决率低于目标 3.2 个百分点。',
    archive: '已归档：月度绩效结果 / 导出报表 / 主管复盘纪要',
  },
];

let tableResizeObserver: ResizeObserver | undefined;

const filteredScoreRows = computed(() => {
  const keyword = query.keyword.trim();
  return scoreRows.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.agent.includes(keyword) ||
      item.team.includes(keyword) ||
      item.employeeNo.toLowerCase().includes(keyword.toLowerCase());
    const matchTeam = !query.team || item.team === query.team;
    const matchChannel = !query.channel || item.channel === query.channel;
    const matchStatus = !query.status || item.status === query.status;
    return matchKeyword && matchTeam && matchChannel && matchStatus;
  });
});

const activeMetricRows = computed<MetricRow[]>(() => {
  const row = activeScore.value ?? scoreRows[0];
  return [
    { name: '处理量', value: String(row.handled), target: '日均 180+', weight: '15%', trend: row.handled < 220 ? '下降' : '稳定', source: '在线客服 / 呼叫 / 邮件 / 短信 / 工单' },
    { name: '首响时长', value: row.firstResponse, target: '在线 30秒内 / 工单 15分钟内', weight: '15%', trend: row.exceptions.includes('首响超时') ? '异常' : '稳定', source: '会话记录 / 工单 SLA' },
    { name: '解决率', value: row.resolveRate, target: '85%+', weight: '20%', trend: row.exceptions.includes('解决率下降') ? '下降' : '稳定', source: '工单关闭 / 会话结案' },
    { name: '满意度', value: row.satisfaction, target: '92%+', weight: '20%', trend: row.exceptions.includes('满意度低') ? '异常' : '上升', source: '满意度评价 / 投诉记录' },
    { name: '质检分', value: String(row.qualityScore), target: '86+', weight: '20%', trend: row.qualityScore < 86 ? '下降' : '稳定', source: '质检中心' },
    { name: '风险项', value: `${row.timeoutRate} / ${row.complaintRate}`, target: '超时 < 5% / 投诉 < 1%', weight: '10%', trend: row.exceptions.length > 1 ? '异常' : '稳定', source: 'SLA / 投诉 / 转人工' },
  ];
});

const activeExceptionReasons = computed<ExceptionReason[]>(() => {
  const row = activeScore.value ?? scoreRows[0];
  if (row.status === '达标') {
    return [
      {
        title: '无阻断性异常',
        description: '本周期处理量、质检分、满意度和投诉率均在目标范围内，可沉淀为优秀样本。',
        level: '低',
      },
      {
        title: '可复用经验',
        description: '建议将高满意度会话同步到培训中心，作为新人演练素材。',
        level: '低',
      },
    ];
  }

  return row.exceptions.map((item) => ({
    title: item,
    description: reasonText(item),
    level: item.includes('投诉') || item.includes('质检') ? '高' : '中',
  }));
});

async function loadData() {
  loading.value = true;
  try {
    const page = await getBusinessRecordList({
      module: moduleName,
      keyword: query.keyword,
      status: undefined,
      pageSize: 20,
    });
    records.value = page.records;
    active.value = page.records[0];
    if (!activeScore.value) activeScore.value = filteredScoreRows.value[0] ?? scoreRows[0];
  } finally {
    loading.value = false;
  }
}

function selectScore(record: ScoreRow) {
  activeScore.value = record;
}

function openBoard(tab = 'metrics', record?: ScoreRow) {
  if (record) activeScore.value = record;
  activeTab.value = tab;
  boardOpen.value = true;
}

function createTask(record: ScoreRow) {
  activeScore.value = record;
  openBoard('tasks', record);
  message.success(`${record.agent} 的改进任务已定位`);
}

function openLinkedRecord(record: ScoreRow) {
  activeScore.value = record;
  const matchedRecord = records.value.find((item) => item.owner === record.agent) ?? records.value[0];
  if (!matchedRecord) {
    message.info('暂无关联业务记录');
    return;
  }
  detailRecord.value = matchedRecord;
  detailOpen.value = true;
}

function exceptionColor(label: string) {
  if (label.includes('投诉') || label.includes('质检')) return 'red';
  if (label.includes('超时') || label.includes('下降') || label.includes('低')) return 'orange';
  if (label.includes('关注') || label.includes('波动') || label.includes('转人工')) return 'blue';
  return 'green';
}

function taskStatusColor(status: ImprovementTask['status']) {
  const map: Record<ImprovementTask['status'], string> = {
    待处理: 'default',
    处理中: 'processing',
    待复核: 'warning',
    已完成: 'success',
  };
  return map[status];
}

function reasonText(label: string) {
  const map: Record<string, string> = {
    满意度低: '满意度评价集中在等待过久、解释不完整和一次解决失败，需要回看低分会话。',
    首响超时: '高峰时段首响超过目标，需检查排班覆盖、工单分配和快捷回复模板。',
    解决率下降: '重复进线和二次转派增加，建议联动知识库补齐高频问题答案。',
    质检扣分: '质检扣分集中在流程确认和风险提示，需要主管辅导并复核样本。',
    投诉升高: '投诉率超过目标，需要关联投诉记录和通话录音定位根因。',
    超时率高: 'SLA 超时集中在跨团队协作节点，需要明确升级责任人。',
    转人工率高: '短信自动触达后转人工比例偏高，需复盘意图识别和分流规则。',
    首响波动: '邮件高峰时段响应不稳定，需要检查模板覆盖和待办队列堆积。',
    质检关注: '质检分达标但存在细节扣分，建议抽取优秀样本做对照训练。',
  };
  return map[label] ?? '该异常已进入复盘池，需结合会话、工单、质检和培训数据继续定位。';
}

function statusColor(status: BusinessRecordStatus) {
  const map: Record<BusinessRecordStatus, string> = {
    待处理: 'default',
    处理中: 'processing',
    待审核: 'warning',
    已完成: 'success',
    已暂停: 'orange',
    已关闭: 'default',
  };
  return map[status];
}

function updateTableScrollY() {
  const sectionHeight = scoreSectionRef.value?.clientHeight ?? 0;
  const headingHeight = sectionHeadingRef.value?.offsetHeight ?? 0;
  if (!sectionHeight) return;
  tableScrollY.value = Math.max(260, sectionHeight - headingHeight - 78);
}

onMounted(async () => {
  await loadData();
  await nextTick();
  updateTableScrollY();
  tableResizeObserver = new ResizeObserver(updateTableScrollY);
  if (pageRef.value) tableResizeObserver.observe(pageRef.value);
  if (scoreSectionRef.value) tableResizeObserver.observe(scoreSectionRef.value);
});

onBeforeUnmount(() => {
  tableResizeObserver?.disconnect();
});
</script>

<style scoped lang="scss">
.biz-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 152px);
  min-height: 680px;
  min-width: 1180px;
  overflow: hidden;
  color: var(--app-text);
}

.performance-toolbar,
.score-table-section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.performance-toolbar {
  flex: 0 0 auto;
  padding: 14px 16px;
}

.toolbar-intro {
  display: flex;
  align-items: baseline;
  gap: 14px;
  min-width: 0;
  margin-bottom: 12px;
}

.toolbar-intro h1,
.section-heading h2 {
  flex: 0 0 auto;
  margin: 0;
  color: var(--app-text);
  font-size: 18px;
  font-weight: 700;
}

.toolbar-intro p,
.section-heading p,
.reason-list p,
.review-grid p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.toolbar-filters {
  display: grid;
  grid-template-columns: minmax(220px, 1.1fr) 140px 140px 260px 130px auto;
  gap: 10px;
  align-items: center;
}

.toolbar-actions {
  justify-content: flex-end;
  white-space: nowrap;
}

.performance-workbench {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.score-table-section {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  padding: 14px;
  overflow: hidden;
}

.section-heading {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 12px;
  min-width: 0;
}

.section-heading p {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.performance-table {
  flex: 1 1 0;
  min-height: 0;
}

.agent-cell {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
  padding: 0;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.agent-cell strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-cell span {
  overflow: hidden;
  color: var(--app-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-cell.active strong {
  color: var(--app-primary);
}

.score-cell {
  display: grid;
  gap: 4px;
  min-width: 92px;
}

.score-cell strong {
  color: var(--app-primary);
}

.metric-value--risk {
  color: #cf1322;
  font-weight: 700;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-list :deep(.ant-tag) {
  margin-inline-end: 0;
}

.analysis-tabs {
  height: 100%;
}

.analysis-tabs :deep(.ant-tabs-content),
.analysis-tabs :deep(.ant-tabs-tabpane) {
  height: 100%;
  min-height: 0;
}

.analysis-scroll {
  max-height: calc(100vh - 170px);
  overflow: auto;
  padding-right: 2px;
}

.breakdown-table {
  min-width: 920px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  overflow: hidden;
}

.breakdown-head,
.breakdown-row {
  display: grid;
  grid-template-columns: 1.1fr 0.8fr 1.3fr 0.7fr 0.7fr 1.4fr;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}

.breakdown-head {
  color: var(--app-text-secondary);
  background: var(--app-surface-muted);
  font-weight: 600;
}

.breakdown-row + .breakdown-row {
  border-top: 1px solid var(--app-border);
}

.reason-list {
  display: grid;
  gap: 10px;
}

.reason-list article {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 12px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(260px, 1fr));
  gap: 10px;
}

.review-grid article {
  padding: 12px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.review-grid span {
  display: block;
  margin-top: 10px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

button {
  font: inherit;
}

:deep(.ant-table-wrapper),
:deep(.ant-spin-nested-loading),
:deep(.ant-spin-container),
:deep(.ant-table),
:deep(.ant-table-container) {
  min-height: 0;
}

:deep(.performance-board-drawer .ant-drawer-body) {
  min-height: 0;
  overflow: hidden;
  padding-top: 12px;
}

:deep(.performance-board-drawer .ant-tabs) {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}

@media (max-width: 1360px) {
  .biz-page {
    min-width: 980px;
  }

  .toolbar-filters {
    grid-template-columns: minmax(220px, 1fr) repeat(4, 140px);
  }

  .toolbar-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
