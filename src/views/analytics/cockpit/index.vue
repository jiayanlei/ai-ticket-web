<template>
  <div class="cockpit-page">
    <header class="cockpit-toolbar">
      <div class="toolbar-title">
        <h1>{{ pageTitle }}</h1>
        <span>{{ refreshText }}</span>
      </div>

      <div class="toolbar-controls">
        <a-select v-model:value="query.range" class="toolbar-select" @change="refreshCockpit">
          <a-select-option v-for="item in rangeOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.channel" class="toolbar-select" @change="refreshCockpit">
          <a-select-option v-for="item in channelOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.team" class="toolbar-select" @change="refreshCockpit">
          <a-select-option v-for="item in teamOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-button :loading="loading" @click="refreshCockpit">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
        <a-button type="primary" @click="openCommandScreen">
          <template #icon><FullscreenOutlined /></template>
          进入大屏
        </a-button>
      </div>
    </header>

    <section class="health-strip" aria-label="健康总览">
      <button
        v-for="metric in metrics"
        :key="metric.key"
        class="metric-item"
        :class="[`metric-item--${metric.status}`, { active: selectedMetricKey === metric.key }]"
        type="button"
        @click="focusMetric(metric)"
      >
        <span class="metric-label">{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <em>{{ metric.delta }}</em>
        <small>{{ metric.focus }} · 风险 {{ metric.risks }}</small>
      </button>
    </section>

    <main class="cockpit-workbench">
      <section class="risk-workbench">
        <div class="section-head">
          <div>
            <h2>风险指挥</h2>
            <p>按影响指标和证据定位优先处理项，已派发的风险会显示行动状态。</p>
          </div>
          <a-segmented v-model:value="activeRiskType" :options="riskTypeOptions" @change="changeRiskType" />
        </div>

        <a-table
          class="risk-table"
          :columns="riskColumns"
          :custom-row="riskRowProps"
          :data-source="filteredRisks"
          :loading="loading"
          :pagination="false"
          :scroll="{ x: 1040, y: 460 }"
          row-key="id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'level'">
              <a-tag :color="riskLevelColor(record.level)">{{ record.level }}</a-tag>
            </template>
            <template v-else-if="column.key === 'object'">
              <button class="row-title" type="button" @click.stop="openRisk(record)">
                <strong>{{ record.object }}</strong>
                <span>{{ record.type }} · {{ record.ownerTeam }}</span>
              </button>
            </template>
            <template v-else-if="column.key === 'impact'">
              <strong class="impact-text">{{ record.impact }}</strong>
            </template>
            <template v-else-if="column.key === 'evidence'">
              <div class="evidence-line">
                <span v-for="item in record.evidence" :key="item">{{ item }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'actionStatus'">
              <a-badge :status="actionBadgeStatus(record.actionStatus)" :text="record.actionStatus" />
            </template>
            <template v-else-if="column.key === 'links'">
              <a-space wrap>
                <a-button v-for="link in record.links" :key="link.label" size="small" type="link" @click.stop="goLink(link.path)">
                  {{ link.label }}
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </section>

      <aside class="action-queue">
        <div class="section-head section-head--compact">
          <div>
            <h2>闭环行动</h2>
            <p>处理必须有负责人、截止时间和恢复验证。</p>
          </div>
          <a-button size="small" type="primary" :disabled="!selectedRisk" @click="openCreateAction">
            <template #icon><PlusOutlined /></template>
            创建行动
          </a-button>
        </div>

        <div class="status-rail">
          <button
            v-for="item in actionStatusSummary"
            :key="item.status"
            type="button"
            :class="{ active: activeActionStatus === item.status }"
            @click="activeActionStatus = item.status"
          >
            <span>{{ item.status }}</span>
            <strong>{{ item.count }}</strong>
          </button>
        </div>

        <a-table
          class="action-table"
          :columns="actionColumns"
          :data-source="filteredActions"
          :pagination="false"
          :scroll="{ x: 760, y: 380 }"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="actionStatusColor(record.status)">{{ record.status }}</a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <button class="action-title" type="button" @click="openAction(record)">
                <strong>{{ record.action }}</strong>
                <span>{{ record.sourceRisk }}</span>
              </button>
            </template>
            <template v-else-if="column.key === 'progress'">
              <a-progress :percent="record.progress" size="small" :status="record.status === '待验证' ? 'active' : 'normal'" />
            </template>
            <template v-else-if="column.key === 'operation'">
              <a-space>
                <a-button size="small" type="link" @click="advanceAction(record)">{{ nextActionLabel(record.status) }}</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </aside>
    </main>

    <a-drawer v-model:open="detailOpen" width="720" :title="selectedRisk?.object || selectedAction?.action">
      <template v-if="selectedRisk">
        <section class="drawer-section">
          <div class="drawer-head">
            <div>
              <h3>{{ selectedRisk.type }}</h3>
              <p>{{ selectedRisk.summary }}</p>
            </div>
            <a-tag :color="riskLevelColor(selectedRisk.level)">{{ selectedRisk.level }}</a-tag>
          </div>
          <a-descriptions bordered :column="1" size="small">
            <a-descriptions-item label="影响指标">{{ selectedRisk.impact }}</a-descriptions-item>
            <a-descriptions-item label="责任团队">{{ selectedRisk.ownerTeam }}</a-descriptions-item>
            <a-descriptions-item label="建议动作">{{ selectedRisk.suggestion }}</a-descriptions-item>
            <a-descriptions-item label="行动状态">
              <a-badge :status="actionBadgeStatus(selectedRisk.actionStatus)" :text="selectedRisk.actionStatus" />
            </a-descriptions-item>
          </a-descriptions>
        </section>

        <section class="drawer-section">
          <h3>根因证据</h3>
          <a-table :columns="evidenceColumns" :data-source="selectedRisk.evidenceRows" :pagination="false" row-key="dimension" size="small" />
        </section>

        <section class="drawer-section" v-if="selectedRisk.relatedRecords.length">
          <h3>关联记录</h3>
          <a-table
            :columns="recordColumns"
            :data-source="selectedRisk.relatedRecords"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="businessStatusColor(record.status)">{{ record.status }}</a-tag>
              </template>
            </template>
          </a-table>
        </section>

        <section class="drawer-section">
          <div class="drawer-actions">
            <a-button type="primary" @click="openCreateAction">
              <template #icon><PlusOutlined /></template>
              创建闭环行动
            </a-button>
            <a-button @click="markKnownRisk">标记已知问题</a-button>
          </div>
        </section>
      </template>

      <template v-if="selectedAction">
        <section class="drawer-section">
          <h3>行动跟进</h3>
          <a-descriptions bordered :column="1" size="small">
            <a-descriptions-item label="来源风险">{{ selectedAction.sourceRisk }}</a-descriptions-item>
            <a-descriptions-item label="负责人">{{ selectedAction.owner || '未派发' }}</a-descriptions-item>
            <a-descriptions-item label="截止时间">{{ selectedAction.deadline }}</a-descriptions-item>
            <a-descriptions-item label="验证指标">{{ selectedAction.verifyMetric }}</a-descriptions-item>
            <a-descriptions-item label="当前状态">
              <a-tag :color="actionStatusColor(selectedAction.status)">{{ selectedAction.status }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </section>

        <section class="drawer-section">
          <h3>处理时间线</h3>
          <a-timeline>
            <a-timeline-item v-for="item in selectedAction.timeline" :key="item.time + item.content">
              <strong>{{ item.title }}</strong>
              <p>{{ item.content }}</p>
              <small>{{ item.time }}</small>
            </a-timeline-item>
          </a-timeline>
        </section>
      </template>
    </a-drawer>

    <a-modal v-model:open="actionModalOpen" title="创建闭环行动" ok-text="创建行动" @ok="submitAction">
      <a-form layout="vertical">
        <a-form-item label="来源风险">
          <a-input :value="actionForm.sourceRisk" disabled />
        </a-form-item>
        <a-form-item label="处理动作" required>
          <a-textarea v-model:value="actionForm.action" :rows="3" />
        </a-form-item>
        <a-form-item label="负责人" required>
          <a-select v-model:value="actionForm.owner" placeholder="选择负责人">
            <a-select-option v-for="item in ownerOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="截止时间" required>
          <a-input v-model:value="actionForm.deadline" />
        </a-form-item>
        <a-form-item label="验证指标" required>
          <a-input v-model:value="actionForm.verifyMetric" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { FullscreenOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import type { BusinessRecord, BusinessRecordStatus } from '@/api/business';
import { getBusinessRecordList } from '@/api/business';

type MetricStatus = 'normal' | 'warning' | 'critical';
type RiskType = '全部' | 'SLA风险' | '服务压力' | 'AI质量';
type RiskLevel = '紧急' | '高' | '中';
type RiskActionStatus = '未派发' | '已派发' | '处理中' | '待验证';
type ActionStatus = '全部' | '待派发' | '处理中' | '待验证' | '已关闭';

interface MetricItem {
  key: string;
  label: string;
  value: string;
  delta: string;
  status: MetricStatus;
  focus: string;
  risks: number;
  riskType: RiskType;
}

interface CockpitRisk {
  id: string;
  type: Exclude<RiskType, '全部'>;
  level: RiskLevel;
  object: string;
  summary: string;
  impact: string;
  ownerTeam: string;
  evidence: string[];
  evidenceRows: Array<{
    dimension: string;
    value: string;
    detail: string;
  }>;
  suggestion: string;
  actionStatus: RiskActionStatus;
  links: Array<{
    label: string;
    path: string;
  }>;
  relatedRecords: BusinessRecord[];
}

interface CockpitAction {
  id: string;
  riskId: string;
  sourceRisk: string;
  action: string;
  owner: string;
  deadline: string;
  status: Exclude<ActionStatus, '全部'>;
  progress: number;
  verifyMetric: string;
  timeline: Array<{
    title: string;
    content: string;
    time: string;
  }>;
}

const router = useRouter();
const pageTitle = '数据驾驶舱';
const moduleName = 'analytics-cockpit';

const loading = ref(false);
const records = ref<BusinessRecord[]>([]);
const refreshedAt = ref('22:13');
const selectedMetricKey = ref('sla');
const activeRiskType = ref<RiskType>('全部');
const activeActionStatus = ref<ActionStatus>('全部');
const selectedRisk = ref<CockpitRisk>();
const selectedAction = ref<CockpitAction>();
const detailOpen = ref(false);
const actionModalOpen = ref(false);

const rangeOptions = ['今日 08:00-当前', '近 7 天', '近 30 天'];
const channelOptions = ['全部渠道', '电话', '在线', '邮件', '短信', '统一收件箱'];
const teamOptions = ['全部团队', '华东客服', '华南客服', '技术支持', 'VIP 支持'];
const ownerOptions = ['陈沐阳', '郑宁', '刘薇', '谢砚青', '韩书'];
const riskTypeOptions: RiskType[] = ['全部', 'SLA风险', '服务压力', 'AI质量'];

const query = reactive({
  range: rangeOptions[0],
  channel: channelOptions[0],
  team: teamOptions[0],
});

const actionForm = reactive({
  sourceRisk: '',
  action: '',
  owner: '陈沐阳',
  deadline: '今天 18:00',
  verifyMetric: '',
});

const metrics = ref<MetricItem[]>([
  { key: 'health', label: '综合健康分', value: '88', delta: '+3', status: 'normal', focus: '整体稳定', risks: 0, riskType: '全部' },
  { key: 'volume', label: '今日服务量', value: '12.8k', delta: '+12.4%', status: 'normal', focus: '在线渠道增长', risks: 2, riskType: '服务压力' },
  { key: 'sla', label: 'SLA 达成率', value: '91.6%', delta: '-4.2%', status: 'warning', focus: '投诉类工单', risks: 18, riskType: 'SLA风险' },
  { key: 'pressure', label: '队列压力', value: '72', delta: '+9', status: 'warning', focus: '华东团队', risks: 6, riskType: '服务压力' },
  { key: 'aiRoi', label: 'AI ROI', value: '+8.4%', delta: '+1.8%', status: 'normal', focus: '自动解决提升', risks: 1, riskType: 'AI质量' },
]);

const risks = ref<CockpitRisk[]>([]);
const actions = ref<CockpitAction[]>([
  {
    id: 'action-001',
    riskId: 'risk-sla-vip',
    sourceRisk: '重点客户 SLA',
    action: '临时加派技术支持坐席，并把投诉类工单提升到主管队列',
    owner: '陈沐阳',
    deadline: '今天 18:00',
    status: '处理中',
    progress: 60,
    verifyMetric: 'SLA 恢复到 90% 以上',
    timeline: [
      { title: '已派发', content: '已分派给技术支持技能组，主管同步关注。', time: '15:20' },
      { title: '处理中', content: '新增 2 名坐席接入投诉类队列。', time: '15:42' },
    ],
  },
  {
    id: 'action-002',
    riskId: 'risk-ai-fail',
    sourceRisk: 'AI 处理失败',
    action: '补充投诉退款知识条目，并调整低置信度转人工阈值',
    owner: '韩书',
    deadline: '今天 19:00',
    status: '待验证',
    progress: 90,
    verifyMetric: '知识命中率恢复到 82% 以上',
    timeline: [
      { title: '知识补充', content: '已新增 6 条投诉退款问答和 2 条流程说明。', time: '16:05' },
      { title: '等待验证', content: '等待 30 分钟样本回流后比较命中率。', time: '16:30' },
    ],
  },
  {
    id: 'action-003',
    riskId: 'risk-pressure-east',
    sourceRisk: '在线渠道积压',
    action: '调整华东在线班次，将售后技能组临时转入在线队列',
    owner: '',
    deadline: '今天 17:30',
    status: '待派发',
    progress: 0,
    verifyMetric: '在线积压低于 80，会话等待低于 3 分钟',
    timeline: [{ title: '待派发', content: '风险已进入闭环队列，等待确认责任人。', time: '16:10' }],
  },
]);

const refreshText = computed(() => `更新于 ${refreshedAt.value}`);
const filteredRisks = computed(() => {
  const metric = metrics.value.find((item) => item.key === selectedMetricKey.value);
  return risks.value.filter((risk) => {
    const typeMatched = activeRiskType.value === '全部' || risk.type === activeRiskType.value;
    const metricMatched = !metric || metric.riskType === '全部' || risk.type === metric.riskType;
    return typeMatched && metricMatched;
  });
});

const actionStatusSummary = computed(() => {
  const statuses: ActionStatus[] = ['全部', '待派发', '处理中', '待验证', '已关闭'];
  return statuses.map((status) => ({
    status,
    count: status === '全部' ? actions.value.length : actions.value.filter((item) => item.status === status).length,
  }));
});

const filteredActions = computed(() =>
  actions.value.filter((item) => activeActionStatus.value === '全部' || item.status === activeActionStatus.value),
);

const riskColumns = [
  { title: '优先级', key: 'level', width: 92 },
  { title: '风险对象', key: 'object', width: 190 },
  { title: '影响指标', key: 'impact', width: 230 },
  { title: '证据', key: 'evidence', width: 250 },
  { title: '建议动作', dataIndex: 'suggestion', key: 'suggestion', width: 260 },
  { title: '行动状态', key: 'actionStatus', width: 120 },
  { title: '入口', key: 'links', width: 170 },
];

const actionColumns = [
  { title: '状态', key: 'status', width: 82 },
  { title: '处理动作', key: 'action', width: 230 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 88 },
  { title: '进度', key: 'progress', width: 140 },
  { title: '操作', key: 'operation', width: 88 },
];

const evidenceColumns = [
  { title: '维度', dataIndex: 'dimension', key: 'dimension', width: 110 },
  { title: '当前值', dataIndex: 'value', key: 'value', width: 120 },
  { title: '说明', dataIndex: 'detail', key: 'detail' },
];

const recordColumns = [
  { title: '编号', dataIndex: 'code', key: 'code', width: 130 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 90 },
  { title: '状态', key: 'status', width: 100 },
];

async function loadData() {
  loading.value = true;
  try {
    const page = await getBusinessRecordList({ module: moduleName, pageSize: 20 });
    records.value = page.records;
    risks.value = buildRisks(page.records);
    selectedRisk.value = risks.value[0];
  } finally {
    loading.value = false;
  }
}

async function refreshCockpit() {
  await loadData();
  refreshedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  message.success('数据驾驶舱已刷新');
}

function buildRisks(sourceRecords: BusinessRecord[]): CockpitRisk[] {
  const primaryRecords = sourceRecords.length > 0 ? sourceRecords : [];
  return [
    {
      id: 'risk-sla-vip',
      type: 'SLA风险',
      level: '高',
      object: '重点客户 SLA',
      summary: '重点客户投诉类工单将在 30 分钟内集中超时，需要主管升级和技能组接入。',
      impact: 'SLA -4.2%，18 单将超时',
      ownerTeam: '华东客服 / 技术支持',
      evidence: ['在线渠道', '华东团队', '投诉类', '14-16点'],
      evidenceRows: [
        { dimension: '渠道', value: '在线渠道', detail: '待响应会话集中在投诉和退款咨询。' },
        { dimension: '团队', value: '华东客服', detail: '技术支持技能组当前承压最高。' },
        { dimension: '工单', value: '18 单', detail: '30 分钟内触发 SLA 超时。' },
      ],
      suggestion: '升级工单，加派技术支持坐席',
      actionStatus: '处理中',
      links: [
        { label: '工单', path: '/service/tickets' },
        { label: 'SLA', path: '/analytics/sla' },
      ],
      relatedRecords: primaryRecords.slice(0, 3),
    },
    {
      id: 'risk-pressure-east',
      type: '服务压力',
      level: '中',
      object: '在线渠道积压',
      summary: '华东在线队列积压扩大，平均等待时间超过目标线。',
      impact: '积压 +136，等待 +6分钟',
      ownerTeam: '华东客服 / 排班',
      evidence: ['华东', '技术支持', '32 会话', '晚高峰'],
      evidenceRows: [
        { dimension: '队列', value: '+136', detail: '在线会话积压持续 42 分钟。' },
        { dimension: '坐席', value: '负载 87%', detail: '技术支持技能组无空闲容量。' },
        { dimension: '排班', value: '缺口 3 人', detail: '17:00 前需要临时调班。' },
      ],
      suggestion: '临时调班，将售后技能组转入在线队列',
      actionStatus: '已派发',
      links: [
        { label: '排班', path: '/operations/scheduling' },
        { label: '监控', path: '/analytics/monitoring' },
      ],
      relatedRecords: primaryRecords.slice(1, 4),
    },
    {
      id: 'risk-ai-fail',
      type: 'AI质量',
      level: '高',
      object: 'AI 处理失败',
      summary: '投诉退款场景转人工率升高，知识命中下降，影响自动解决效果。',
      impact: '转人工 +18%，命中 -9%',
      ownerTeam: 'AI 运营 / 知识库',
      evidence: ['知识缺口', '模型失败 23次', '退款场景', '低置信度'],
      evidenceRows: [
        { dimension: '知识', value: '命中 -9%', detail: '退款争议类知识条目覆盖不足。' },
        { dimension: '模型', value: '失败 23次', detail: '低置信度摘要触发降级。' },
        { dimension: '转人工', value: '+18%', detail: '机器人连续两轮未解决后转人工。' },
      ],
      suggestion: '补知识条目，调整低置信度转人工阈值',
      actionStatus: '待验证',
      links: [
        { label: '知识', path: '/knowledge/base' },
        { label: '模型', path: '/ai/models' },
      ],
      relatedRecords: primaryRecords.slice(0, 2),
    },
  ];
}

function focusMetric(metric: MetricItem) {
  selectedMetricKey.value = metric.key;
  activeRiskType.value = metric.riskType;
}

function changeRiskType(value: string | number) {
  activeRiskType.value = value as RiskType;
  selectedMetricKey.value = '';
}

function riskRowProps(record: CockpitRisk) {
  return {
    onClick: () => openRisk(record),
  };
}

function openRisk(risk: CockpitRisk) {
  selectedRisk.value = risk;
  selectedAction.value = undefined;
  detailOpen.value = true;
}

function openAction(action: CockpitAction) {
  selectedAction.value = action;
  selectedRisk.value = risks.value.find((item) => item.id === action.riskId);
  detailOpen.value = true;
}

function openCreateAction() {
  if (!selectedRisk.value) {
    message.warning('请先选择一条风险');
    return;
  }
  Object.assign(actionForm, {
    sourceRisk: selectedRisk.value.object,
    action: selectedRisk.value.suggestion,
    owner: '陈沐阳',
    deadline: '今天 18:00',
    verifyMetric: defaultVerifyMetric(selectedRisk.value.type),
  });
  actionModalOpen.value = true;
}

function submitAction() {
  if (!actionForm.action.trim() || !actionForm.owner || !actionForm.deadline.trim() || !actionForm.verifyMetric.trim()) {
    message.warning('请补全处理动作、负责人、截止时间和验证指标');
    return;
  }
  if (!selectedRisk.value) return;

  actions.value.unshift({
    id: `action-${Date.now()}`,
    riskId: selectedRisk.value.id,
    sourceRisk: selectedRisk.value.object,
    action: actionForm.action,
    owner: actionForm.owner,
    deadline: actionForm.deadline,
    status: '处理中',
    progress: 20,
    verifyMetric: actionForm.verifyMetric,
    timeline: [{ title: '行动创建', content: `${actionForm.owner} 已认领处理动作。`, time: refreshedAt.value }],
  });
  selectedRisk.value.actionStatus = '处理中';
  actionModalOpen.value = false;
  message.success('闭环行动已创建');
}

function advanceAction(action: CockpitAction) {
  if (action.status === '待派发') {
    action.owner = action.owner || '陈沐阳';
    action.status = '处理中';
    action.progress = 30;
    action.timeline.unshift({ title: '开始处理', content: `${action.owner} 已开始处理。`, time: refreshedAt.value });
  } else if (action.status === '处理中') {
    action.status = '待验证';
    action.progress = 90;
    action.timeline.unshift({ title: '等待验证', content: `等待系统验证：${action.verifyMetric}。`, time: refreshedAt.value });
  } else if (action.status === '待验证') {
    action.status = '已关闭';
    action.progress = 100;
    action.timeline.unshift({ title: '关闭行动', content: '验证指标已恢复，行动关闭并进入复盘记录。', time: refreshedAt.value });
  } else {
    message.info('该行动已关闭');
    return;
  }

  const risk = risks.value.find((item) => item.id === action.riskId);
  if (risk) {
    risk.actionStatus = action.status === '已关闭' ? '待验证' : action.status;
  }
  message.success('行动状态已更新');
}

function nextActionLabel(status: Exclude<ActionStatus, '全部'>) {
  const map = {
    待派发: '认领',
    处理中: '提交验证',
    待验证: '关闭',
    已关闭: '查看',
  };
  return map[status];
}

function defaultVerifyMetric(type: Exclude<RiskType, '全部'>) {
  const map = {
    SLA风险: 'SLA 恢复到 90% 以上',
    服务压力: '队列积压低于 80，会话等待低于 3 分钟',
    AI质量: '知识命中率恢复到 82% 以上',
  };
  return map[type];
}

function goLink(path: string) {
  router.push(path);
}

function openCommandScreen() {
  router.push({ path: '/dashboard/screen', query: { from: 'cockpit' } });
}

function markKnownRisk() {
  message.success('已标记为已知问题，并保留在风险列表中继续跟踪');
}

function riskLevelColor(level: RiskLevel) {
  const map = { 紧急: 'red', 高: 'orange', 中: 'gold' };
  return map[level];
}

function actionStatusColor(status: Exclude<ActionStatus, '全部'>) {
  const map = { 待派发: 'default', 处理中: 'processing', 待验证: 'warning', 已关闭: 'success' };
  return map[status];
}

function actionBadgeStatus(status: RiskActionStatus) {
  const map = { 未派发: 'default', 已派发: 'processing', 处理中: 'processing', 待验证: 'warning' } as const;
  return map[status];
}

function businessStatusColor(status: BusinessRecordStatus) {
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

onMounted(loadData);
</script>

<style scoped lang="scss">
.cockpit-page {
  display: flex;
  min-width: 1180px;
  flex-direction: column;
  gap: 14px;
  color: var(--app-text);
}

.cockpit-toolbar,
.health-strip,
.risk-workbench,
.action-queue {
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
}

.cockpit-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
}

.toolbar-title {
  display: flex;
  min-width: 220px;
  align-items: baseline;
  gap: 12px;
}

.toolbar-title h1 {
  margin: 0;
  color: var(--app-text);
  font-size: 20px;
  font-weight: 700;
}

.toolbar-title span,
.section-head p,
.metric-item small,
.row-title span,
.action-title span,
.drawer-head p,
small {
  color: var(--app-text-secondary);
}

.toolbar-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-select {
  width: 150px;
}

.toolbar-select:first-child {
  width: 180px;
}

.health-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  overflow: hidden;
}

.metric-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(72px, 1fr) auto auto;
  gap: 6px 10px;
  min-height: 78px;
  padding: 14px 16px 12px 18px;
  text-align: left;
  background: transparent;
  border: 0;
  border-right: 1px solid var(--app-border);
  cursor: pointer;
}

.metric-item:last-child {
  border-right: 0;
}

.metric-item::before {
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 3px;
  content: '';
  background: transparent;
}

.metric-item.active {
  background: var(--app-surface-muted);
}

.metric-item--normal::before {
  background: #18a058;
}

.metric-item--warning::before {
  background: #f59e0b;
}

.metric-item--critical::before {
  background: #ef4444;
}

.metric-label {
  align-self: center;
  color: var(--app-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.metric-item strong {
  color: var(--app-text);
  font-size: 24px;
  line-height: 1;
}

.metric-item em {
  align-self: center;
  color: var(--app-text-secondary);
  font-style: normal;
  font-weight: 700;
}

.metric-item--warning em,
.metric-item--critical em {
  color: #f59e0b;
}

.metric-item small {
  grid-column: 1 / -1;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cockpit-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 430px;
  gap: 14px;
  align-items: start;
}

.risk-workbench,
.action-queue {
  min-width: 0;
  padding: 14px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-head--compact {
  align-items: flex-start;
}

.section-head h2,
.drawer-section h3 {
  margin: 0;
  color: var(--app-text);
  font-size: 16px;
  font-weight: 700;
}

.section-head p {
  margin: 4px 0 0;
  line-height: 1.6;
}

.risk-table :deep(.ant-table-row),
.action-table :deep(.ant-table-row) {
  cursor: pointer;
}

.row-title,
.action-title {
  display: grid;
  width: 100%;
  gap: 3px;
  padding: 0;
  text-align: left;
  background: transparent;
  border: 0;
}

.row-title strong,
.action-title strong,
.impact-text {
  color: var(--app-text);
  font-weight: 700;
}

.evidence-line {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.evidence-line span {
  padding: 2px 7px;
  color: var(--app-text-secondary);
  background: var(--app-surface-muted);
  border-radius: 6px;
}

.status-rail {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-bottom: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  overflow: hidden;
}

.status-rail button {
  display: grid;
  gap: 2px;
  padding: 8px 6px;
  text-align: center;
  background: transparent;
  border: 0;
  border-right: 1px solid var(--app-border);
  cursor: pointer;
}

.status-rail button:last-child {
  border-right: 0;
}

.status-rail button.active {
  background: var(--app-surface-muted);
}

.status-rail span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.status-rail strong {
  color: var(--app-text);
  font-size: 18px;
}

.drawer-section {
  margin-bottom: 18px;
}

.drawer-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.drawer-head p {
  margin: 6px 0 0;
  line-height: 1.7;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1360px) {
  .cockpit-page {
    min-width: 980px;
  }

  .health-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .metric-item:nth-child(3) {
    border-right: 0;
  }

  .metric-item:nth-child(n + 4) {
    border-top: 1px solid var(--app-border);
  }

  .cockpit-workbench {
    grid-template-columns: 1fr;
  }
}
</style>
