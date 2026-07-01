<template>
  <div class="operations-page">
    <header class="operations-toolbar">
      <div class="toolbar-intro">
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageDescription }}</p>
      </div>
      <div class="toolbar-filters">
        <a-input
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索异常 / 任务 / 客户 / 负责人"
          @press-enter="loadData"
        />
        <a-range-picker v-model:value="query.range" />
        <a-select v-model:value="query.channel" allow-clear placeholder="渠道" @change="loadData">
          <a-select-option v-for="item in channelOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.team" allow-clear placeholder="团队" @change="loadData">
          <a-select-option v-for="item in teamOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.owner" allow-clear placeholder="负责人" @change="loadData">
          <a-select-option v-for="item in ownerOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.status" allow-clear placeholder="状态" @change="loadData">
          <a-select-option v-for="item in statusOptions" :key="item" :value="item">{{ item }}</a-select-option>
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
          <a-button @click="openDashboard">
            <template #icon><DashboardOutlined /></template>
            打开看板
          </a-button>
        </a-space>
      </div>
    </header>

    <main class="operations-workbench">
      <section class="health-section">
        <div class="section-heading">
          <div>
            <h2>运营健康表</h2>
            <p>按渠道、团队和业务类型汇总服务量、压力、SLA、满意度和解决效果。</p>
          </div>
          <a-segmented v-model:value="healthDimension" :options="healthDimensions" />
        </div>
        <a-table
          class="health-table"
          :columns="healthColumns"
          :data-source="filteredHealthRows"
          :pagination="false"
          :scroll="{ x: 1480, y: 240 }"
          row-key="id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <button
                class="name-cell"
                :class="{ active: activeHealth?.id === record.id }"
                type="button"
                @click="selectHealth(record)"
              >
                <strong>{{ record.name }}</strong>
                <span>{{ record.dimension }} · {{ record.scope }}</span>
              </button>
            </template>
            <template v-else-if="column.key === 'pressure'">
              <div class="pressure-cell">
                <strong>{{ record.pressure }}</strong>
                <a-progress :percent="record.pressure" :show-info="false" size="small" :status="record.pressure >= 85 ? 'exception' : 'normal'" />
              </div>
            </template>
            <template v-else-if="column.key === 'slaRisk'">
              <a-tag :color="record.slaRisk > 0 ? 'red' : 'green'">{{ record.slaRisk }} 单</a-tag>
            </template>
            <template v-else-if="column.key === 'complaintRisk'">
              <a-tag :color="record.complaintRisk >= 8 ? 'red' : record.complaintRisk >= 4 ? 'orange' : 'green'">
                {{ record.complaintRisk }} 起
              </a-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-badge :status="healthBadge(record.status)" :text="record.status" />
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button size="small" type="link" @click="openHealthDetail(record)">拆解</a-button>
                <a-button size="small" type="link" @click="focusRelatedException(record)">看异常</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </section>

      <section class="closure-grid">
        <div class="list-panel exception-panel">
          <div class="section-heading section-heading--compact">
            <div>
              <h2>风险与异常</h2>
              <p>识别当前需要处理的问题，并拆解到渠道、团队、时段和业务类型。</p>
            </div>
          </div>
          <div class="exception-list">
            <button
              v-for="item in filteredExceptions"
              :key="item.id"
              class="exception-item"
              :class="{ active: activeException?.id === item.id }"
              type="button"
              @click="selectException(item)"
            >
              <div class="item-main">
                <span class="item-title">{{ item.title }}</span>
                <p>{{ item.summary }}</p>
                <div class="tag-row">
                  <a-tag :color="riskColor(item.level)">{{ item.level }}风险</a-tag>
                  <a-tag>{{ item.channel }}</a-tag>
                  <a-tag>{{ item.team }}</a-tag>
                  <a-tag>{{ item.type }}</a-tag>
                </div>
              </div>
              <div class="item-side">
                <strong>{{ item.metric }}</strong>
                <span>{{ item.trend }}</span>
              </div>
            </button>
          </div>
        </div>

        <div class="list-panel task-panel">
          <div class="section-heading section-heading--compact">
            <div>
              <h2>改进任务</h2>
              <p>从异常发起排班、分配、培训、质检、工单和知识库优化动作。</p>
            </div>
            <a-button size="small" type="primary" @click="createTaskFromActive">
              <template #icon><PlusOutlined /></template>
              发起动作
            </a-button>
          </div>
          <a-table
            :columns="taskColumns"
            :data-source="filteredTasks"
            :pagination="false"
            :scroll="{ x: 920, y: 260 }"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <button class="task-title" type="button" @click="selectTask(record)">
                  <strong>{{ record.action }}</strong>
                  <span>{{ record.source }}</span>
                </button>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="taskStatusColor(record.status)">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'progress'">
                <a-progress :percent="record.progress" size="small" />
              </template>
              <template v-else-if="column.key === 'links'">
                <a-space wrap>
                  <a-tag v-for="link in record.links" :key="link" color="blue">{{ link }}</a-tag>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>

        <div class="list-panel review-panel">
          <div class="section-heading section-heading--compact">
            <div>
              <h2>复盘验证</h2>
              <p>对已完成动作比较处理前后指标，确认问题是否真正恢复。</p>
            </div>
          </div>
          <div class="review-list">
            <article v-for="item in reviewResults" :key="item.id">
              <div class="review-head">
                <strong>{{ item.title }}</strong>
                <a-tag :color="item.result === '已恢复' ? 'green' : 'orange'">{{ item.result }}</a-tag>
              </div>
              <div class="review-metrics">
                <span v-for="metric in item.metrics" :key="metric.name">
                  {{ metric.name }} <b>{{ metric.before }}</b> -> <b>{{ metric.after }}</b>
                </span>
              </div>
              <p>{{ item.summary }}</p>
            </article>
          </div>
        </div>
      </section>
    </main>

    <a-drawer v-model:open="detailOpen" width="620" :title="drawerTitle">
      <template v-if="activeException">
        <section class="drawer-section">
          <h3>异常概况</h3>
          <a-descriptions bordered :column="1" size="small">
            <a-descriptions-item label="风险等级">
              <a-tag :color="riskColor(activeException.level)">{{ activeException.level }}风险</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="影响范围">{{ activeException.channel }} / {{ activeException.team }} / {{ activeException.customerGroup }}</a-descriptions-item>
            <a-descriptions-item label="当前指标">{{ activeException.metric }}，{{ activeException.trend }}</a-descriptions-item>
            <a-descriptions-item label="责任团队">{{ activeException.ownerTeam }}</a-descriptions-item>
            <a-descriptions-item label="影响客户">{{ activeException.affectedCustomers }}</a-descriptions-item>
            <a-descriptions-item label="关联工单">{{ activeException.relatedTickets }}</a-descriptions-item>
          </a-descriptions>
        </section>

        <section class="drawer-section">
          <h3>原因拆解</h3>
          <div class="reason-grid">
            <article v-for="item in activeException.reasons" :key="item.dimension">
              <span>{{ item.dimension }}</span>
              <strong>{{ item.value }}</strong>
              <p>{{ item.detail }}</p>
            </article>
          </div>
        </section>

        <section class="drawer-section">
          <h3>可发起动作</h3>
          <div class="action-grid">
            <a-button v-for="item in activeException.actions" :key="item" @click="message.success(item + '已加入处理队列')">
              {{ item }}
            </a-button>
          </div>
        </section>
      </template>

      <section class="drawer-section" v-if="activeTask">
        <h3>跟进记录</h3>
        <a-descriptions bordered :column="1" size="small">
          <a-descriptions-item label="改进动作">{{ activeTask.action }}</a-descriptions-item>
          <a-descriptions-item label="负责人">{{ activeTask.owner }}</a-descriptions-item>
          <a-descriptions-item label="状态"><a-tag :color="taskStatusColor(activeTask.status)">{{ activeTask.status }}</a-tag></a-descriptions-item>
          <a-descriptions-item label="截止时间">{{ activeTask.deadline }}</a-descriptions-item>
          <a-descriptions-item label="处理结果">{{ activeTask.result }}</a-descriptions-item>
        </a-descriptions>
        <a-timeline class="drawer-timeline">
          <a-timeline-item v-for="item in activeTask.records" :key="item.time + item.content">
            <strong>{{ item.owner }}</strong>
            <p>{{ item.content }}</p>
            <small>{{ item.time }}</small>
          </a-timeline-item>
        </a-timeline>
      </section>

      <section class="drawer-section">
        <h3>复盘验证</h3>
        <div class="drawer-review">
          <span v-for="item in activeReviewMetrics" :key="item.name">
            {{ item.name }}：{{ item.before }} -> {{ item.after }}
          </span>
        </div>
      </section>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  DashboardOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

type Dimension = '渠道' | '团队' | '业务类型';
type HealthStatus = '健康' | '关注' | '风险';
type RiskLevel = '高' | '中' | '低';
type TaskStatus = '待处理' | '处理中' | '待复核' | '已完成';

interface HealthRow {
  id: string;
  dimension: Dimension;
  name: string;
  scope: string;
  serviceVolume: number;
  handling: number;
  queue: number;
  pressure: number;
  avgResponse: string;
  avgHandle: string;
  resolveRate: string;
  satisfaction: string;
  slaRisk: number;
  timeoutRate: string;
  failureRate: string;
  transferRate: string;
  complaintRisk: number;
  status: HealthStatus;
}

interface ExceptionReason {
  dimension: string;
  value: string;
  detail: string;
}

interface OperationException {
  id: string;
  title: string;
  summary: string;
  level: RiskLevel;
  channel: string;
  team: string;
  owner: string;
  status: TaskStatus;
  type: string;
  metric: string;
  trend: string;
  customerGroup: string;
  ownerTeam: string;
  affectedCustomers: string;
  relatedTickets: string;
  reasons: ExceptionReason[];
  actions: string[];
  reviewMetrics: ReviewMetric[];
}

interface ImprovementTask {
  id: string;
  source: string;
  action: string;
  owner: string;
  status: TaskStatus;
  deadline: string;
  progress: number;
  result: string;
  links: string[];
  records: Array<{ time: string; owner: string; content: string }>;
  reviewMetrics: ReviewMetric[];
}

interface ReviewMetric {
  name: string;
  before: string;
  after: string;
}

interface ReviewResult {
  id: string;
  title: string;
  result: '已恢复' | '观察中';
  summary: string;
  metrics: ReviewMetric[];
}

const pageTitle = '运营分析';
const pageDescription = '跨在线客服、呼叫、邮件、短信、工单、坐席、排班、绩效、质检和培训的数据健康分析与改进闭环中心。';
const loading = ref(false);
const healthDimension = ref<Dimension>('渠道');
const activeHealth = ref<HealthRow>();
const activeException = ref<OperationException>();
const activeTask = ref<ImprovementTask>();
const detailOpen = ref(false);

const query = reactive({
  keyword: '',
  range: undefined,
  channel: undefined as string | undefined,
  team: undefined as string | undefined,
  owner: undefined as string | undefined,
  status: undefined as TaskStatus | undefined,
});

const healthDimensions: Dimension[] = ['渠道', '团队', '业务类型'];
const channelOptions = ['在线客服', '客户联络中心', '邮件中心', '短信中心', '工单中心'];
const teamOptions = ['在线一组', '客户联络中心', '邮件工单组', 'VIP 专席', '短信运营组', '质检培训组'];
const ownerOptions = ['陈沐阳', '刘婧', '王珂', '韩书', '许言', '赵明远'];
const statusOptions: TaskStatus[] = ['待处理', '处理中', '待复核', '已完成'];

const healthColumns = [
  { title: '对象', dataIndex: 'name', key: 'name', width: 210, fixed: 'left' },
  { title: '服务量', dataIndex: 'serviceVolume', key: 'serviceVolume', width: 95, sorter: (a: HealthRow, b: HealthRow) => a.serviceVolume - b.serviceVolume },
  { title: '处理中', dataIndex: 'handling', key: 'handling', width: 95 },
  { title: '排队', dataIndex: 'queue', key: 'queue', width: 80 },
  { title: '压力', dataIndex: 'pressure', key: 'pressure', width: 130, sorter: (a: HealthRow, b: HealthRow) => a.pressure - b.pressure },
  { title: '响应时长', dataIndex: 'avgResponse', key: 'avgResponse', width: 105 },
  { title: '处理时长', dataIndex: 'avgHandle', key: 'avgHandle', width: 105 },
  { title: '解决率', dataIndex: 'resolveRate', key: 'resolveRate', width: 95 },
  { title: '满意度', dataIndex: 'satisfaction', key: 'satisfaction', width: 95 },
  { title: 'SLA风险', dataIndex: 'slaRisk', key: 'slaRisk', width: 105 },
  { title: '超时率', dataIndex: 'timeoutRate', key: 'timeoutRate', width: 95 },
  { title: '失败率', dataIndex: 'failureRate', key: 'failureRate', width: 95 },
  { title: '转人工率', dataIndex: 'transferRate', key: 'transferRate', width: 105 },
  { title: '投诉风险', dataIndex: 'complaintRisk', key: 'complaintRisk', width: 105 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 95 },
  { title: '操作', key: 'actions', width: 130, fixed: 'right' },
];

const taskColumns = [
  { title: '改进动作', dataIndex: 'action', key: 'action', width: 240, fixed: 'left' },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '截止', dataIndex: 'deadline', key: 'deadline', width: 90 },
  { title: '进度', dataIndex: 'progress', key: 'progress', width: 130 },
  { title: '业务联动', dataIndex: 'links', key: 'links', width: 230 },
  { title: '处理结果', dataIndex: 'result', key: 'result', width: 260 },
];

const healthRows: HealthRow[] = [
  { id: 'h-001', dimension: '渠道', name: '在线客服', scope: '售前 / 售后 / 投诉咨询', serviceVolume: 4286, handling: 318, queue: 46, pressure: 82, avgResponse: '28秒', avgHandle: '5分42秒', resolveRate: '89.6%', satisfaction: '93.1%', slaRisk: 18, timeoutRate: '3.8%', failureRate: '0.4%', transferRate: '12.6%', complaintRisk: 5, status: '关注' },
  { id: 'h-002', dimension: '渠道', name: '客户联络中心', scope: '热线 / VIP / 外呼回访', serviceVolume: 2380, handling: 186, queue: 68, pressure: 91, avgResponse: '16秒', avgHandle: '6分18秒', resolveRate: '84.2%', satisfaction: '88.7%', slaRisk: 31, timeoutRate: '6.9%', failureRate: '0.8%', transferRate: '9.8%', complaintRisk: 12, status: '风险' },
  { id: 'h-003', dimension: '渠道', name: '邮件中心', scope: '账单 / 权限 / 售后线程', serviceVolume: 1268, handling: 246, queue: 93, pressure: 88, avgResponse: '18分', avgHandle: '42分', resolveRate: '81.7%', satisfaction: '90.5%', slaRisk: 26, timeoutRate: '8.1%', failureRate: '0.2%', transferRate: '4.2%', complaintRisk: 4, status: '风险' },
  { id: 'h-004', dimension: '渠道', name: '短信中心', scope: '通知 / 验证码 / 满意度邀评', serviceVolume: 18620, handling: 74, queue: 12, pressure: 64, avgResponse: '自动', avgHandle: '1分20秒', resolveRate: '86.4%', satisfaction: '91.9%', slaRisk: 6, timeoutRate: '1.6%', failureRate: '5.7%', transferRate: '18.4%', complaintRisk: 2, status: '关注' },
  { id: 'h-005', dimension: '渠道', name: '工单中心', scope: '跨团队协作 / 升级处理', serviceVolume: 1764, handling: 412, queue: 38, pressure: 78, avgResponse: '11分', avgHandle: '3时12分', resolveRate: '87.5%', satisfaction: '92.2%', slaRisk: 22, timeoutRate: '5.2%', failureRate: '0.1%', transferRate: '6.5%', complaintRisk: 6, status: '关注' },
  { id: 'h-101', dimension: '团队', name: '客户联络中心', scope: '白班 / 晚班 / VIP 热线', serviceVolume: 2380, handling: 186, queue: 68, pressure: 91, avgResponse: '16秒', avgHandle: '6分18秒', resolveRate: '84.2%', satisfaction: '88.7%', slaRisk: 31, timeoutRate: '6.9%', failureRate: '0.8%', transferRate: '9.8%', complaintRisk: 12, status: '风险' },
  { id: 'h-102', dimension: '团队', name: '邮件工单组', scope: '邮件 + 工单协同', serviceVolume: 3032, handling: 514, queue: 117, pressure: 86, avgResponse: '15分', avgHandle: '2时28分', resolveRate: '84.8%', satisfaction: '91.2%', slaRisk: 34, timeoutRate: '7.2%', failureRate: '0.2%', transferRate: '5.1%', complaintRisk: 6, status: '风险' },
  { id: 'h-103', dimension: '团队', name: '在线一组', scope: '在线会话 / 售后咨询', serviceVolume: 2890, handling: 214, queue: 32, pressure: 74, avgResponse: '24秒', avgHandle: '5分16秒', resolveRate: '91.8%', satisfaction: '95.4%', slaRisk: 8, timeoutRate: '2.1%', failureRate: '0.3%', transferRate: '10.2%', complaintRisk: 2, status: '健康' },
  { id: 'h-201', dimension: '业务类型', name: '退款', scope: '账单退款 / 退订 / 争议处理', serviceVolume: 1286, handling: 176, queue: 42, pressure: 89, avgResponse: '42秒', avgHandle: '9分24秒', resolveRate: '78.8%', satisfaction: '86.5%', slaRisk: 29, timeoutRate: '8.6%', failureRate: '0.4%', transferRate: '16.8%', complaintRisk: 14, status: '风险' },
  { id: 'h-202', dimension: '业务类型', name: '登录', scope: '账号登录 / MFA / 密码重置', serviceVolume: 1044, handling: 82, queue: 12, pressure: 58, avgResponse: '18秒', avgHandle: '4分08秒', resolveRate: '93.6%', satisfaction: '96.1%', slaRisk: 3, timeoutRate: '0.9%', failureRate: '0.2%', transferRate: '7.1%', complaintRisk: 1, status: '健康' },
  { id: 'h-203', dimension: '业务类型', name: '权限', scope: '角色 / 审批 / 组织配置', serviceVolume: 732, handling: 96, queue: 18, pressure: 71, avgResponse: '3分', avgHandle: '1时16分', resolveRate: '86.9%', satisfaction: '91.7%', slaRisk: 12, timeoutRate: '4.8%', failureRate: '0.1%', transferRate: '8.2%', complaintRisk: 3, status: '关注' },
  { id: 'h-204', dimension: '业务类型', name: '投诉', scope: '服务态度 / 履约争议 / 重复来电', serviceVolume: 286, handling: 64, queue: 19, pressure: 93, avgResponse: '38秒', avgHandle: '18分', resolveRate: '72.4%', satisfaction: '79.3%', slaRisk: 18, timeoutRate: '9.8%', failureRate: '0.3%', transferRate: '21.4%', complaintRisk: 21, status: '风险' },
];

const exceptions: OperationException[] = [
  {
    id: 'e-001',
    title: '客户联络中心投诉风险升高',
    summary: '退款咨询通话满意度连续 3 个时段下降，投诉量较昨日增加 38%。',
    level: '高',
    channel: '客户联络中心',
    team: '客户联络中心',
    owner: '刘婧',
    status: '处理中',
    type: '退款',
    metric: '投诉 12 起',
    trend: '环比 +38%',
    customerGroup: '企业版续费客户',
    ownerTeam: '客户联络中心 / 质检培训组',
    affectedCustomers: '86 位客户，含 12 位高价值客户',
    relatedTickets: 'WO-20260623-0186 等 31 单',
    reasons: [
      { dimension: '渠道', value: '客户联络中心', detail: '热线排队峰值达到 68 人，等待后情绪波动明显。' },
      { dimension: '业务类型', value: '退款', detail: '退款政策解释口径不一致，重复确认增加平均处理时长。' },
      { dimension: '技能组', value: 'VIP 热线', detail: '2 名熟练坐席临时支援工单，导致退款技能覆盖不足。' },
      { dimension: '时间段', value: '10:00-12:00', detail: '来电量集中，排班冗余不足。' },
    ],
    actions: ['调整排班', '创建培训任务', '创建质检复核', '转工单跟进', '优化知识库'],
    reviewMetrics: [
      { name: '投诉量', before: '12 起', after: '待验证' },
      { name: '满意度', before: '88.7%', after: '待验证' },
      { name: '平均处理', before: '6分18秒', after: '待验证' },
    ],
  },
  {
    id: 'e-002',
    title: '邮件中心 SLA 积压',
    summary: '账单和权限邮件线程积压，26 个任务将在 30 分钟内超时。',
    level: '高',
    channel: '邮件中心',
    team: '邮件工单组',
    owner: '许言',
    status: '待处理',
    type: '账单',
    metric: 'SLA 风险 26 单',
    trend: '近 2 小时持续上升',
    customerGroup: 'APAC 中小企业客户',
    ownerTeam: '邮件工单组 / 工单中心',
    affectedCustomers: '54 位客户',
    relatedTickets: 'MAIL-9821、WO-20260623-0214',
    reasons: [
      { dimension: '渠道', value: '邮件中心', detail: '账单邮件集中涌入，自动分类命中率下降。' },
      { dimension: '团队', value: '邮件工单组', detail: '当前处理中 514 单，晚班交接前积压未释放。' },
      { dimension: '知识库', value: '账单模板缺失', detail: '新计费政策相关回复模板覆盖不足。' },
    ],
    actions: ['分配坐席', '转工单跟进', '优化知识库', '标记风险客户'],
    reviewMetrics: [
      { name: 'SLA 风险', before: '26 单', after: '待验证' },
      { name: '首响时长', before: '18分', after: '待验证' },
      { name: '解决率', before: '81.7%', after: '待验证' },
    ],
  },
  {
    id: 'e-003',
    title: '短信失败率升高',
    summary: '夜间运营商通道波动，满意度邀评和验证码通知失败率超过阈值。',
    level: '中',
    channel: '短信中心',
    team: '短信运营组',
    owner: '韩书',
    status: '待复核',
    type: '售后',
    metric: '失败率 5.7%',
    trend: '高于阈值 2.2pct',
    customerGroup: '华东移动号码段',
    ownerTeam: '短信运营组 / 在线一组',
    affectedCustomers: '约 420 个号码',
    relatedTickets: 'SMS-BATCH-0623-04',
    reasons: [
      { dimension: '渠道', value: '短信中心', detail: '单一运营商网关超时增加，重试队列拥堵。' },
      { dimension: '客户群', value: '华东移动号码段', detail: '失败号码集中，需切换备用通道。' },
      { dimension: '业务类型', value: '满意度邀评', detail: '邀评失败影响满意度样本回收。' },
    ],
    actions: ['调整短信通道', '标记风险客户', '转工单跟进'],
    reviewMetrics: [
      { name: '失败率', before: '5.7%', after: '2.4%' },
      { name: '重试成功', before: '61%', after: '86%' },
      { name: '邀评回收', before: '72%', after: '81%' },
    ],
  },
  {
    id: 'e-004',
    title: '在线客服排队突增',
    summary: '登录问题在发布后集中进线，在线一组转人工率上升。',
    level: '中',
    channel: '在线客服',
    team: '在线一组',
    owner: '赵明远',
    status: '处理中',
    type: '登录',
    metric: '排队 46 人',
    trend: '30 分钟 +27 人',
    customerGroup: '试用版客户',
    ownerTeam: '在线一组 / 知识运营部',
    affectedCustomers: '128 位客户',
    relatedTickets: 'CHAT-20260623-3021',
    reasons: [
      { dimension: '业务类型', value: '登录', detail: '新版本 MFA 提示文案变更后，机器人命中率下降。' },
      { dimension: '知识库', value: '密码重置', detail: '知识片段未覆盖新版截图和错误码。' },
      { dimension: '时间段', value: '14:00-15:00', detail: '试用客户集中完成初始化配置。' },
    ],
    actions: ['分配坐席', '优化知识库', '创建培训任务'],
    reviewMetrics: [
      { name: '排队人数', before: '46 人', after: '待验证' },
      { name: '转人工率', before: '12.6%', after: '待验证' },
      { name: '机器人命中', before: '78%', after: '待验证' },
    ],
  },
];

const improvementTasks: ImprovementTask[] = [
  {
    id: 't-001',
    source: '客户联络中心投诉风险升高',
    action: '创建退款政策专项培训',
    owner: '王珂',
    status: '处理中',
    deadline: '06-26 18:00',
    progress: 60,
    result: '已完成 18 人培训，待复核 6 条低满意度通话。',
    links: ['培训中心', '质检中心', '客户联络中心'],
    records: [
      { time: '06-23 10:40', owner: '刘婧', content: '圈定 20 通低满意度样本，标记退款解释不完整。' },
      { time: '06-23 13:30', owner: '王珂', content: '生成退款政策演练任务，覆盖白班和晚班坐席。' },
      { time: '06-23 15:10', owner: '刘婧', content: '复核 6 条培训后通话，等待晚高峰指标回看。' },
    ],
    reviewMetrics: [
      { name: '满意度', before: '88.7%', after: '91.5%' },
      { name: '投诉量', before: '12 起', after: '7 起' },
      { name: '质检分', before: '82', after: '88' },
    ],
  },
  {
    id: 't-002',
    source: '邮件中心 SLA 积压',
    action: '分配 4 名坐席支援账单邮件',
    owner: '许言',
    status: '待处理',
    deadline: '06-23 17:30',
    progress: 20,
    result: '已锁定支援名单，待排班主管确认。',
    links: ['排班调度', '邮件中心', '工单中心'],
    records: [
      { time: '06-23 14:20', owner: '许言', content: '筛选账单技能组空闲坐席，预计释放 60 单积压。' },
      { time: '06-23 14:35', owner: '陈沐阳', content: '要求 17:30 前完成首轮 SLA 风险清理。' },
    ],
    reviewMetrics: [
      { name: 'SLA 风险', before: '26 单', after: '待验证' },
      { name: '积压量', before: '93 单', after: '待验证' },
      { name: '首响时长', before: '18分', after: '待验证' },
    ],
  },
  {
    id: 't-003',
    source: '短信失败率升高',
    action: '切换备用短信通道并重试失败号码',
    owner: '韩书',
    status: '待复核',
    deadline: '06-24 10:00',
    progress: 85,
    result: '备用通道已生效，失败率回落到 2.4%。',
    links: ['短信中心', '工单中心'],
    records: [
      { time: '06-23 09:20', owner: '韩书', content: '确认运营商网关超时，开启低优先级重试队列。' },
      { time: '06-23 11:00', owner: '韩书', content: '切换备用通道，保留失败号码用于白名单重试。' },
    ],
    reviewMetrics: [
      { name: '失败率', before: '5.7%', after: '2.4%' },
      { name: '重试成功', before: '61%', after: '86%' },
      { name: '邀评回收', before: '72%', after: '81%' },
    ],
  },
  {
    id: 't-004',
    source: '在线客服排队突增',
    action: '补齐 MFA 登录知识库与快捷回复',
    owner: '赵明远',
    status: '处理中',
    deadline: '06-24 12:00',
    progress: 45,
    result: '已补 3 条错误码知识，待观察机器人命中率。',
    links: ['知识库', '在线客服', '培训中心'],
    records: [
      { time: '06-23 14:10', owner: '赵明远', content: '确认新版 MFA 错误码未进入知识库。' },
      { time: '06-23 14:50', owner: '宋之言', content: '补充截图和密码重置步骤，提交知识审核。' },
    ],
    reviewMetrics: [
      { name: '排队人数', before: '46 人', after: '待验证' },
      { name: '机器人命中', before: '78%', after: '待验证' },
      { name: '转人工率', before: '12.6%', after: '待验证' },
    ],
  },
];

const reviewResults: ReviewResult[] = [
  {
    id: 'r-001',
    title: '短信失败率治理',
    result: '已恢复',
    summary: '备用通道和失败号码重试生效，失败率低于 3% 阈值，邀评回收同步恢复。',
    metrics: [
      { name: '失败率', before: '5.7%', after: '2.4%' },
      { name: '重试成功', before: '61%', after: '86%' },
      { name: '邀评回收', before: '72%', after: '81%' },
    ],
  },
  {
    id: 'r-002',
    title: 'VIP 热线话术复训',
    result: '观察中',
    summary: '质检扣分已下降，但晚高峰投诉仍需观察一个完整班次。',
    metrics: [
      { name: '满意度', before: '88.7%', after: '91.5%' },
      { name: '投诉量', before: '12 起', after: '7 起' },
      { name: '质检分', before: '82', after: '88' },
    ],
  },
  {
    id: 'r-003',
    title: '邮件账单模板补齐',
    result: '观察中',
    summary: '模板命中率提升，但 SLA 风险仍等待支援坐席消化。',
    metrics: [
      { name: '首响', before: '18分', after: '13分' },
      { name: 'SLA风险', before: '26 单', after: '17 单' },
      { name: '解决率', before: '81.7%', after: '84.9%' },
    ],
  },
];

const filteredHealthRows = computed(() => {
  const keyword = query.keyword.trim().toLowerCase();
  return healthRows.filter((item) => {
    const matchDimension = item.dimension === healthDimension.value;
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.scope.toLowerCase().includes(keyword);
    const matchChannel = !query.channel || item.name === query.channel || item.scope.includes(query.channel);
    const matchTeam = !query.team || item.name === query.team || item.scope.includes(query.team);
    return matchDimension && matchKeyword && matchChannel && matchTeam;
  });
});

const filteredExceptions = computed(() => {
  const keyword = query.keyword.trim().toLowerCase();
  return exceptions.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      item.summary.toLowerCase().includes(keyword) ||
      item.type.toLowerCase().includes(keyword);
    const matchChannel = !query.channel || item.channel === query.channel;
    const matchTeam = !query.team || item.team === query.team;
    const matchOwner = !query.owner || item.owner === query.owner;
    const matchStatus = !query.status || item.status === query.status;
    return matchKeyword && matchChannel && matchTeam && matchOwner && matchStatus;
  });
});

const filteredTasks = computed(() => {
  const keyword = query.keyword.trim().toLowerCase();
  return improvementTasks.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.action.toLowerCase().includes(keyword) ||
      item.source.toLowerCase().includes(keyword) ||
      item.result.toLowerCase().includes(keyword);
    const matchOwner = !query.owner || item.owner === query.owner;
    const matchStatus = !query.status || item.status === query.status;
    const matchChannel = !query.channel || item.links.includes(query.channel);
    return matchKeyword && matchOwner && matchStatus && matchChannel;
  });
});

const drawerTitle = computed(() => {
  if (activeException.value) return activeException.value.title;
  if (activeTask.value) return activeTask.value.action;
  return '运营分析详情';
});

const activeReviewMetrics = computed(() => {
  return activeTask.value?.reviewMetrics ?? activeException.value?.reviewMetrics ?? reviewResults[0].metrics;
});

function loadData() {
  loading.value = true;
  window.setTimeout(() => {
    activeHealth.value = filteredHealthRows.value[0] ?? healthRows.find((item) => item.dimension === healthDimension.value);
    activeException.value = filteredExceptions.value[0] ?? exceptions[0];
    activeTask.value = filteredTasks.value[0] ?? improvementTasks[0];
    loading.value = false;
  }, 180);
}

function selectHealth(record: HealthRow) {
  activeHealth.value = record;
}

function openHealthDetail(record: HealthRow) {
  selectHealth(record);
  activeException.value = exceptions.find((item) => item.channel === record.name || item.team === record.name || item.type === record.name) ?? exceptions[0];
  activeTask.value = improvementTasks.find((item) => item.source === activeException.value?.title) ?? improvementTasks[0];
  detailOpen.value = true;
}

function focusRelatedException(record: HealthRow) {
  selectHealth(record);
  activeException.value = exceptions.find((item) => item.channel === record.name || item.team === record.name || item.type === record.name) ?? exceptions[0];
  if (activeException.value) message.success(`已定位：${activeException.value.title}`);
}

function selectException(record: OperationException) {
  activeException.value = record;
  activeTask.value = improvementTasks.find((item) => item.source === record.title) ?? activeTask.value;
  detailOpen.value = true;
}

function selectTask(record: ImprovementTask) {
  activeTask.value = record;
  activeException.value = exceptions.find((item) => item.title === record.source) ?? activeException.value;
  detailOpen.value = true;
}

function createTaskFromActive() {
  const title = activeException.value?.title ?? '当前异常';
  message.success(`${title} 的改进动作已创建`);
}

function openDashboard() {
  message.success('运营看板已打开，可继续跟踪跨模块健康指标');
}

function healthBadge(status: HealthStatus) {
  const map: Record<HealthStatus, 'success' | 'warning' | 'error'> = {
    健康: 'success',
    关注: 'warning',
    风险: 'error',
  };
  return map[status];
}

function riskColor(level: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    高: 'red',
    中: 'orange',
    低: 'blue',
  };
  return map[level];
}

function taskStatusColor(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    待处理: 'default',
    处理中: 'processing',
    待复核: 'warning',
    已完成: 'success',
  };
  return map[status];
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.operations-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  min-width: 1180px;
  overflow: hidden;
  color: var(--app-text);
}

.operations-toolbar,
.health-section,
.list-panel {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.operations-toolbar {
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
  margin: 0;
  color: var(--app-text);
  font-size: 18px;
  font-weight: 700;
}

.toolbar-intro p,
.section-heading p,
.exception-item p,
.review-list p,
.reason-grid p,
.drawer-timeline p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.toolbar-filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 250px 130px 130px 120px 120px auto;
  gap: 10px;
  align-items: center;
}

.toolbar-actions {
  justify-content: flex-end;
  white-space: nowrap;
}

.operations-workbench {
  display: grid;
  flex: 1 1 0;
  grid-template-rows: minmax(285px, 0.92fr) minmax(280px, 1.08fr);
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.health-section,
.list-panel {
  min-height: 0;
  overflow: hidden;
}

.health-section {
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.section-heading--compact {
  flex: 0 0 auto;
  margin-bottom: 10px;
}

.section-heading--compact h2 {
  font-size: 16px;
}

.health-table {
  min-height: 0;
}

.name-cell,
.task-title {
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

.name-cell strong,
.name-cell span,
.task-title strong,
.task-title span,
.item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name-cell span,
.task-title span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.name-cell.active strong {
  color: var(--app-primary);
}

.pressure-cell {
  display: grid;
  gap: 4px;
  min-width: 96px;
}

.pressure-cell strong {
  color: var(--app-primary);
}

.closure-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(430px, 1.35fr) minmax(300px, 0.85fr);
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.list-panel {
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.exception-list,
.review-list {
  display: grid;
  gap: 10px;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}

.exception-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 12px;
  width: 100%;
  padding: 12px;
  color: inherit;
  text-align: left;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  cursor: pointer;
}

.exception-item.active,
.exception-item:hover {
  border-color: var(--app-primary);
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.item-main {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.item-title {
  display: block;
  color: var(--app-text);
  font-weight: 700;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-row :deep(.ant-tag) {
  margin-inline-end: 0;
}

.item-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  min-width: 0;
}

.item-side strong {
  color: var(--app-danger);
  font-size: 15px;
}

.item-side span {
  color: var(--app-text-secondary);
  font-size: 12px;
  text-align: right;
}

.review-list article {
  padding: 12px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.review-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.review-metrics,
.drawer-review {
  display: grid;
  gap: 7px;
  margin-bottom: 10px;
}

.review-metrics span,
.drawer-review span {
  padding: 7px 9px;
  color: var(--app-text-secondary);
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 6px;
  font-size: 12px;
}

.review-metrics b {
  color: var(--app-text);
}

.drawer-section + .drawer-section {
  margin-top: 18px;
}

.drawer-section h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.reason-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.reason-grid article {
  padding: 12px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.reason-grid span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.reason-grid strong {
  display: block;
  margin: 4px 0;
}

.action-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.drawer-timeline {
  margin-top: 14px;
}

.drawer-timeline small {
  color: var(--app-text-secondary);
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

@media (max-width: 1360px) {
  .operations-page {
    min-width: 980px;
  }

  .toolbar-filters {
    grid-template-columns: minmax(220px, 1fr) 250px repeat(4, 120px);
  }

  .toolbar-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }

  .closure-grid {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .list-panel {
    min-height: 300px;
  }
}
</style>
