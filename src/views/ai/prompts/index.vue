<template>
  <div class="prompt-page">
    <header class="prompt-toolbar">
      <div class="toolbar-title">
        <h1>提示词中心</h1>
        <p>按问题、资产、评测、发布和反馈管理客服 Prompt。</p>
      </div>

      <div class="toolbar-controls">
        <a-segmented v-model:value="environment" :options="environmentOptions" />
        <a-input
          v-model:value="query.keyword"
          allow-clear
          class="toolbar-search"
          placeholder="搜索 Prompt、场景、负责人"
          @press-enter="applySearch"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select v-model:value="query.scenario" allow-clear placeholder="业务场景" @change="applySearch">
          <a-select-option v-for="item in scenarioOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.risk" allow-clear placeholder="风险等级" @change="applySearch">
          <a-select-option v-for="item in riskOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-space>
          <a-button @click="resetFilters">
            <template #icon><ReloadOutlined /></template>
            重置
          </a-button>
          <a-button @click="openImportSamples">
            <template #icon><ImportOutlined /></template>
            导入样本
          </a-button>
          <a-button type="primary" @click="runEvaluation">
            <template #icon><ExperimentOutlined /></template>
            运行评测
          </a-button>
        </a-space>
      </div>
    </header>

    <main class="prompt-workspace">
      <section class="prompt-panel">
        <div class="panel-heading">
          <div>
            <h2>Prompt 列表</h2>
            <p>先定位需要处理的 Prompt，再进入评测和发布。</p>
          </div>
          <a-tabs v-model:active-key="activeLifecycle" class="status-tabs">
            <a-tab-pane v-for="item in lifecycleTabs" :key="item" :tab="statusTabLabel(item)" />
          </a-tabs>
        </div>

        <div class="summary-strip">
          <button v-for="item in healthMetrics" :key="item.label" type="button" @click="focusMetric(item)">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <em :class="`tone-${item.tone}`">{{ item.delta }}</em>
          </button>
        </div>

        <a-table
          class="prompt-table"
          :columns="promptColumns"
          :data-source="filteredPrompts"
          :pagination="false"
          :scroll="{ y: 366 }"
          row-key="id"
          size="small"
          @row="tableRow"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <button
                :class="['prompt-name-cell', { active: activePrompt?.id === record.id }]"
                type="button"
                @click.stop="selectPrompt(record)"
              >
                <strong>{{ record.name }}</strong>
                <span>{{ record.scenario }} / {{ record.channel }}</span>
              </button>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="promptStatusColor(record.status)">{{ record.status }}</a-tag>
            </template>
            <template v-else-if="column.key === 'health'">
              <div class="score-cell">
                <strong>{{ record.health }}</strong>
                <a-progress
                  :percent="record.health"
                  :show-info="false"
                  size="small"
                  :status="record.health < 70 ? 'exception' : 'normal'"
                />
              </div>
            </template>
            <template v-else-if="column.key === 'risk'">
              <a-tag :color="riskColor(record.risk)">{{ record.risk }}</a-tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button size="small" type="link" @click.stop="openPromptDetail(record)">详情</a-button>
                <a-button size="small" type="link" @click.stop="clonePrompt(record)">克隆</a-button>
                <a-button size="small" type="link" @click.stop="openDiff(record)">Diff</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </section>

      <aside class="detail-panel">
        <div class="panel-heading compact">
          <div>
            <h2>处理面板</h2>
            <p>{{ activePrompt?.name }} / {{ activePrompt?.version }}</p>
          </div>
          <a-tag :color="promptStatusColor(activePrompt?.status ?? '草稿中')">{{ activePrompt?.status }}</a-tag>
        </div>

        <div class="prompt-detail-card">
          <div class="detail-card-head">
            <div>
              <h3>{{ activePrompt?.name }}</h3>
              <p>{{ activePrompt?.description }}</p>
            </div>
            <strong>{{ activePrompt?.health }}</strong>
          </div>
          <dl>
            <div>
              <dt>负责人</dt>
              <dd>{{ activePrompt?.owner }}</dd>
            </div>
            <div>
              <dt>7日调用</dt>
              <dd>{{ activePrompt?.calls }}</dd>
            </div>
            <div>
              <dt>最近变更</dt>
              <dd>{{ activePrompt?.updatedAt }}</dd>
            </div>
            <div>
              <dt>影响范围</dt>
              <dd>{{ dependencyText }}</dd>
            </div>
          </dl>
        </div>

        <div class="issue-box">
          <div>
            <span>当前问题</span>
            <h3>{{ relatedIssue?.title ?? '暂无高优先级问题' }}</h3>
            <p>{{ relatedIssue?.summary ?? '该 Prompt 当前没有关联异常，可按常规流程克隆或评测。' }}</p>
          </div>
          <a-tag v-if="relatedIssue" :color="severityColor(relatedIssue.severity)">{{ relatedIssue.severity }}</a-tag>
        </div>

        <div class="release-flow">
          <button
            v-for="step in releaseSteps"
            :key="step.label"
            :class="{ active: step.active, done: step.done }"
            type="button"
            @click="handleFlowStep(step.label)"
          >
            <span>{{ step.label }}</span>
            <strong>{{ step.value }}</strong>
          </button>
        </div>

        <div class="evaluation-list">
          <article v-for="item in evaluationMetrics" :key="item.label">
            <div>
              <span>{{ item.label }}</span>
              <strong>{{ item.score }}</strong>
            </div>
            <a-progress
              :percent="item.score"
              :show-info="false"
              size="small"
              :status="item.score < item.threshold ? 'exception' : 'normal'"
            />
            <small>阈值 {{ item.threshold }} / 失败 {{ item.failed }}</small>
          </article>
        </div>

        <div class="panel-actions">
          <a-button @click="editorOpen = true">编辑草稿</a-button>
          <a-button @click="openDiff(activePrompt)">查看 Diff</a-button>
          <a-button :disabled="!evaluationPassed" @click="approvalOpen = true">发起审批</a-button>
          <a-button :disabled="!evaluationPassed" type="primary" @click="grayRelease">灰度发布</a-button>
        </div>
      </aside>
    </main>

    <section class="feedback-panel">
      <div class="panel-heading">
        <div>
          <h2>发布反馈</h2>
          <p>观察灰度结果，把异常样本回流到评测集。</p>
        </div>
        <a-button danger @click="rollbackOpen = true">回滚</a-button>
      </div>

      <div class="feedback-grid">
        <article v-for="item in feedbackMetrics" :key="item.label" class="feedback-card">
          <span>{{ item.label }}</span>
          <strong :class="`tone-${item.tone}`">{{ item.value }}</strong>
          <small>{{ item.note }}</small>
        </article>
        <button v-for="item in exceptionClusters" :key="item.title" class="sample-card" type="button" @click="handleCluster(item)">
          <span>{{ item.title }}</span>
          <strong>{{ item.count }}</strong>
          <em>{{ item.action }}</em>
        </button>
      </div>

      <div class="feedback-actions">
        <a-button @click="addFailedSamples">加入评测集</a-button>
        <a-button @click="createIssue">创建问题</a-button>
        <a-button type="primary" @click="promoteStable">提升为稳定版本</a-button>
      </div>
    </section>

    <a-drawer v-model:open="detailOpen" width="760" :title="activePrompt?.name">
      <template v-if="activePrompt">
        <section class="drawer-section">
          <h3>Prompt 健康信息</h3>
          <div class="passport-grid">
            <article v-for="item in passportMetrics" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.note }}</small>
            </article>
          </div>
        </section>
        <section class="drawer-section">
          <h3>版本记录</h3>
          <a-timeline>
            <a-timeline-item v-for="item in activePrompt.history" :key="item.version">
              <strong>{{ item.version }} / {{ item.action }}</strong>
              <p>{{ item.note }}</p>
              <small>{{ item.operator }} / {{ item.time }}</small>
            </a-timeline-item>
          </a-timeline>
        </section>
      </template>
    </a-drawer>

    <a-drawer v-model:open="editorOpen" width="920" title="Prompt 编辑器">
      <a-form layout="vertical">
        <a-form-item label="System Instruction">
          <a-textarea v-model:value="editorState.system" :rows="5" />
        </a-form-item>
        <a-form-item label="User Template">
          <a-textarea v-model:value="editorState.user" :rows="5" />
        </a-form-item>
        <a-form-item label="Output Schema">
          <a-textarea v-model:value="editorState.schema" :rows="4" />
        </a-form-item>
        <a-alert type="info" show-icon message="保存草稿后请重新运行评测，通过后才能发起审批。" />
      </a-form>
      <template #footer>
        <a-space>
          <a-button @click="editorOpen = false">取消</a-button>
          <a-button type="primary" @click="saveDraft">保存草稿</a-button>
        </a-space>
      </template>
    </a-drawer>

    <a-drawer v-model:open="diffOpen" width="760" title="版本 Diff">
      <section class="drawer-section">
        <h3>语义变化</h3>
        <div class="diff-list">
          <article v-for="item in diffItems" :key="item.title">
            <a-tag :color="item.color">{{ item.type }}</a-tag>
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
          </article>
        </div>
      </section>
    </a-drawer>

    <a-modal v-model:open="approvalOpen" title="发起发布审批" @ok="submitApproval">
      <a-form layout="vertical">
        <a-form-item label="变更说明">
          <a-textarea v-model:value="approvalReason" :rows="4" />
        </a-form-item>
        <a-alert type="success" show-icon message="评测矩阵已通过，审批后可进入灰度。" />
      </a-form>
    </a-modal>

    <a-modal v-model:open="rollbackOpen" title="确认回滚" ok-text="确认回滚" ok-type="danger" @ok="confirmRollback">
      <p>回滚后将恢复到上一个稳定版本，并把异常样本重新加入评测集。</p>
      <a-textarea v-model:value="rollbackReason" :rows="3" placeholder="请输入回滚原因" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { ExperimentOutlined, ImportOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue';

type Environment = '生产' | '灰度' | '预发' | '草稿';
type Tone = 'green' | 'red' | 'amber' | 'blue';
type Severity = 'Critical' | 'High' | 'Warning' | 'Info';
type RiskLevel = '低' | '中' | '高' | '严重';
type PromptStatus = '草稿中' | '待评测' | '待审批' | '灰度中' | '生产中' | '需回滚' | '已归档';

interface Issue {
  id: string;
  severity: Severity;
  title: string;
  summary: string;
  promptId: string;
  promptName: string;
  impact: string;
  source: string;
  suggestion: string;
}

interface PromptAsset {
  id: string;
  name: string;
  scenario: string;
  channel: string;
  description: string;
  version: string;
  status: PromptStatus;
  health: number;
  risk: RiskLevel;
  calls: string;
  owner: string;
  updatedAt: string;
  template: string;
  dependencies: string[];
  history: Array<{
    version: string;
    action: string;
    operator: string;
    time: string;
    note: string;
  }>;
}

const environment = ref<Environment>('生产');
const environmentOptions: Environment[] = ['生产', '灰度', '预发', '草稿'];
const activeLifecycle = ref('全部');
const lifecycleTabs = ['全部', '草稿中', '待评测', '待审批', '灰度中', '生产中', '需回滚'];
const detailOpen = ref(false);
const editorOpen = ref(false);
const diffOpen = ref(false);
const approvalOpen = ref(false);
const rollbackOpen = ref(false);
const approvalReason = ref('候选版本已通过核心评测，申请进入灰度。');
const rollbackReason = ref('');

const query = reactive({
  keyword: '',
  scenario: undefined as string | undefined,
  risk: undefined as RiskLevel | undefined,
});

const scenarioOptions = ['退款', '投诉', '售后', '物流', 'VIP'];
const riskOptions: RiskLevel[] = ['低', '中', '高', '严重'];

const prompts = ref<PromptAsset[]>([
  {
    id: 'refund-reply',
    name: '退款安抚回复',
    scenario: '退款',
    channel: '在线客服',
    description: '处理退款进度、到账时效和安抚说明，约束承诺边界。',
    version: 'v12',
    status: '需回滚',
    health: 72,
    risk: '高',
    calls: '18,420',
    owner: '陈沫阳',
    updatedAt: '18 分钟前',
    template: '系统角色要求先核实订单与政策，不承诺具体到账时间，输出需包含引用来源和下一步动作。',
    dependencies: ['退款助手', '退款审批流', '在线客服', '退款政策库'],
    history: [
      { version: 'v12', action: '生产发布', operator: '陈沫阳', time: '2026-07-26 21:10', note: '压缩回复长度并加强安抚语气。' },
      { version: 'v11', action: '稳定版本', operator: '林澈', time: '2026-07-22 10:40', note: '合规评测稳定，护栏触发低。' },
      { version: 'v10', action: '回滚', operator: 'AI Ops', time: '2026-07-18 16:20', note: '退款到账承诺命中风险词。' },
    ],
  },
  {
    id: 'vip-escalation',
    name: 'VIP 升级判断',
    scenario: '投诉',
    channel: '统一收件箱',
    description: '识别高价值客户投诉升级条件，决定是否转主管或创建高优工单。',
    version: 'v7',
    status: '生产中',
    health: 88,
    risk: '中',
    calls: '7,936',
    owner: '谢砚青',
    updatedAt: '46 分钟前',
    template: '根据客户等级、情绪、SLA 和投诉次数给出升级判断，并说明人工兜底原因。',
    dependencies: ['投诉助手', 'VIP 升级流', '统一收件箱', '客户 360'],
    history: [
      { version: 'v7', action: '生产发布', operator: '谢砚青', time: '2026-07-25 09:20', note: '增加连续投诉判断。' },
      { version: 'v6', action: '灰度完成', operator: 'AI Ops', time: '2026-07-23 18:00', note: '转人工率下降 2.4%。' },
    ],
  },
  {
    id: 'logistics-delay',
    name: '物流延迟说明',
    scenario: '物流',
    channel: '邮件',
    description: '解释物流异常原因，引用承运商状态和补偿政策。',
    version: 'v5',
    status: '待评测',
    health: 64,
    risk: '高',
    calls: '5,184',
    owner: '韩书',
    updatedAt: '1 小时前',
    template: '要求引用物流节点、预计下一步和补偿边界，不得编造具体到达时间。',
    dependencies: ['邮件助手', '物流延迟工作流', '邮件中心', '物流知识库'],
    history: [
      { version: 'v5', action: '待评测', operator: '韩书', time: '2026-07-27 08:40', note: '补充承运商异常说明。' },
      { version: 'v4', action: '生产发布', operator: '韩书', time: '2026-07-20 14:30', note: '引用覆盖率 86%。' },
    ],
  },
  {
    id: 'compensation-suggestion',
    name: '售后补偿建议',
    scenario: '售后',
    channel: '在线客服',
    description: '基于订单金额、客户等级和历史投诉生成补偿建议。',
    version: 'v9-gray',
    status: '灰度中',
    health: 81,
    risk: '中',
    calls: '3,612',
    owner: '许知远',
    updatedAt: '2 小时前',
    template: '输出补偿等级、限制条件、需要人工确认的证据和不可承诺条款。',
    dependencies: ['售后助手', '补偿审批流', '在线客服', '售后政策库'],
    history: [
      { version: 'v9-gray', action: '10% 灰度', operator: '许知远', time: '2026-07-26 13:10', note: '解决率提升但差评略升。' },
      { version: 'v8', action: '稳定版本', operator: '许知远', time: '2026-07-19 11:12', note: '投诉关联较低。' },
    ],
  },
]);

const issues = ref<Issue[]>([
  {
    id: 'issue-refund-compliance',
    severity: 'Critical',
    title: '退款回复合规通过率下降',
    summary: '最近 24 小时出现 12 个承诺到账时间样本，合规评测同步下降。',
    promptId: 'refund-reply',
    promptName: '退款安抚回复 v12',
    impact: '合规 -8.2%',
    source: '护栏 + 评测',
    suggestion: '建议克隆 v11 稳定版本，补充到账时效边界，并回放退款争议评测集。',
  },
  {
    id: 'issue-vip-handoff',
    severity: 'High',
    title: 'VIP 投诉转人工升高',
    summary: '升级判断偏保守，VIP 客户连续投诉场景被过早转主管。',
    promptId: 'vip-escalation',
    promptName: 'VIP 升级判断 v7',
    impact: '转人工 +4.1%',
    source: '线上日志',
    suggestion: '建议增加客户情绪和 SLA 剩余时间的权重，先跑高价值投诉样本。',
  },
  {
    id: 'issue-logistics-citation',
    severity: 'Warning',
    title: '物流回复引用缺失',
    summary: '邮件回复中缺少承运商节点引用，导致客户追问率上升。',
    promptId: 'logistics-delay',
    promptName: '物流延迟说明 v5',
    impact: '引用 -12.6%',
    source: 'QA 抽检',
    suggestion: '建议将物流节点和知识来源设为必填变量，失败样本加入评测集。',
  },
  {
    id: 'issue-gray-negative',
    severity: 'High',
    title: '灰度版本差评升高',
    summary: '售后补偿建议 v9-gray 在灰度流量中差评增加 17 起。',
    promptId: 'compensation-suggestion',
    promptName: '售后补偿建议 v9-gray',
    impact: '差评 +17',
    source: '灰度监控',
    suggestion: '建议延长灰度并拆分低客单价与高价值客户样本，必要时回滚 v8。',
  },
]);

const activePromptId = ref(prompts.value[0].id);
const activePrompt = computed(() => prompts.value.find((item) => item.id === activePromptId.value) ?? prompts.value[0]);
const relatedIssue = computed(() => issues.value.find((item) => item.promptId === activePrompt.value?.id));

const healthMetrics = [
  { label: '待处理问题', value: '4', delta: '2 个高优先级', tone: 'red' as Tone },
  { label: '评测通过率', value: '90.1%', delta: '-6.3%', tone: 'amber' as Tone },
  { label: '灰度中', value: '1', delta: '需观察', tone: 'blue' as Tone },
  { label: '可回滚版本', value: '3', delta: '已记录', tone: 'green' as Tone },
];

const promptColumns = [
  { title: 'Prompt', dataIndex: 'name', key: 'name', width: 250 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 86 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '健康分', dataIndex: 'health', key: 'health', width: 112 },
  { title: '风险', dataIndex: 'risk', key: 'risk', width: 82 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 96 },
  { title: '最近变更', dataIndex: 'updatedAt', key: 'updatedAt', width: 112 },
  { title: '操作', key: 'actions', width: 156 },
];

const filteredPrompts = computed(() =>
  prompts.value.filter((item) => {
    const keyword = query.keyword.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      [item.name, item.scenario, item.channel, item.owner, item.description, ...item.dependencies].some((text) =>
        text.toLowerCase().includes(keyword),
      );
    const matchesScenario = !query.scenario || item.scenario === query.scenario;
    const matchesRisk = !query.risk || item.risk === query.risk;
    const matchesLifecycle = activeLifecycle.value === '全部' || item.status === activeLifecycle.value;
    return matchesKeyword && matchesScenario && matchesRisk && matchesLifecycle;
  }),
);

const statusCounts = computed(() =>
  prompts.value.reduce<Record<string, number>>(
    (result, item) => {
      result.全部 += 1;
      result[item.status] = (result[item.status] ?? 0) + 1;
      return result;
    },
    { 全部: 0 },
  ),
);

const dependencyText = computed(() => activePrompt.value?.dependencies.join(' / ') ?? '-');

const releaseSteps = computed(() => [
  { label: '发现问题', value: relatedIssue.value?.impact ?? '无异常', done: Boolean(relatedIssue.value), active: Boolean(relatedIssue.value) },
  { label: '克隆草稿', value: candidate.version, done: candidate.status !== '草稿中', active: candidate.status === '草稿中' },
  { label: '运行评测', value: evaluationPassed.value ? '通过' : '未通过', done: evaluationPassed.value, active: candidate.status === '待评测' },
  { label: '审批灰度', value: candidate.status, done: ['灰度中', '生产中'].includes(candidate.status), active: ['待审批', '灰度中'].includes(candidate.status) },
  { label: '反馈回流', value: '样本 68', done: false, active: candidate.status === '灰度中' },
]);

const candidate = reactive({
  version: 'v13-draft',
  status: '待评测',
});

const editorState = reactive({
  system: '你是企业客服 AI 助手，必须先核实订单、政策和知识来源，再给出回复建议。',
  user: '请根据 {客户等级}、{工单类型}、{订单状态} 和 {政策条款} 生成客服回复。',
  schema: '{ "reply": "string", "risk": "low|medium|high", "citations": ["string"], "nextAction": "string" }',
});

const evaluationMetrics = ref([
  { label: '准确性', score: 93, threshold: 88, failed: 2 },
  { label: '合规', score: 86, threshold: 90, failed: 5 },
  { label: '语气', score: 95, threshold: 85, failed: 1 },
  { label: '引用质量', score: 91, threshold: 88, failed: 3 },
]);

const evaluationPassed = computed(() => evaluationMetrics.value.every((item) => item.score >= item.threshold));

const feedbackMetrics = [
  { label: '满意度', value: '+2.8%', tone: 'green' as Tone, note: '灰度后轻微改善' },
  { label: '转人工', value: '-1.6%', tone: 'green' as Tone, note: '投诉场景下降' },
  { label: '护栏触发', value: '+3', tone: 'amber' as Tone, note: '退款承诺仍需处理' },
  { label: '重复咨询', value: '-4.2%', tone: 'green' as Tone, note: '引用质量提升后下降' },
];

const exceptionClusters = [
  { title: '差评样本', count: 17, action: '加入评测集' },
  { title: '合规拦截', count: 12, action: '查看护栏' },
  { title: '低置信回复', count: 31, action: '创建问题' },
  { title: '重复失败', count: 8, action: '回滚评估' },
];

const passportMetrics = computed(() => [
  { label: '线上调用', value: activePrompt.value?.calls ?? '-', note: '最近 7 天' },
  { label: '评测通过', value: `${activePrompt.value?.health ?? 0}%`, note: '核心评测集' },
  { label: '风险等级', value: activePrompt.value?.risk ?? '-', note: '当前版本' },
  { label: '稳定版本', value: activePrompt.value?.history[1]?.version ?? activePrompt.value?.version ?? '-', note: '可回滚目标' },
]);

const diffItems = [
  { type: '新增', color: 'blue', title: '补充到账时效边界', detail: '禁止承诺具体到账时间，改为引用政策范围和银行处理说明。' },
  { type: '调整', color: 'orange', title: '加强引用要求', detail: '回复必须包含政策来源和订单状态，缺失时转人工确认。' },
  { type: '风险', color: 'red', title: '承诺语仍需收紧', detail: '失败样本中仍出现“马上到账”的近义表达，需要补充护栏词。' },
];

function tableRow(record: PromptAsset) {
  return {
    onClick: () => selectPrompt(record),
  };
}

function statusTabLabel(status: string) {
  return `${status} ${statusCounts.value[status] ?? 0}`;
}

function applySearch() {
  message.success('筛选条件已应用');
}

function resetFilters() {
  query.keyword = '';
  query.scenario = undefined;
  query.risk = undefined;
  activeLifecycle.value = '全部';
}

function selectPrompt(prompt: PromptAsset) {
  activePromptId.value = prompt.id;
}

function focusMetric(item: { label: string }) {
  message.info(`已聚焦「${item.label}」`);
}

function openPromptDetail(prompt: PromptAsset) {
  activePromptId.value = prompt.id;
  detailOpen.value = true;
}

function clonePrompt(prompt?: PromptAsset) {
  if (prompt) {
    activePromptId.value = prompt.id;
  }
  candidate.status = '草稿中';
  message.success(`已从 ${activePrompt.value?.version} 克隆候选版本 ${candidate.version}`);
}

function openDiff(prompt?: PromptAsset) {
  if (prompt) {
    activePromptId.value = prompt.id;
  }
  diffOpen.value = true;
}

function runEvaluation() {
  candidate.status = evaluationPassed.value ? '评测通过' : '待评测';
  message.success(evaluationPassed.value ? '评测已完成' : '评测未通过，请处理失败样本');
}

function grayRelease() {
  candidate.status = '灰度中';
  message.success('候选版本已进入灰度');
}

function saveDraft() {
  editorOpen.value = false;
  candidate.status = '待评测';
  message.success('草稿已保存，请重新运行评测');
}

function submitApproval() {
  approvalOpen.value = false;
  candidate.status = '待审批';
  message.success('审批申请已提交');
}

function confirmRollback() {
  rollbackOpen.value = false;
  candidate.status = '需回滚';
  message.warning('已回滚到上一个稳定版本，异常样本已加入评测集');
}

function openImportSamples() {
  message.info('样本导入入口已打开');
}

function addFailedSamples() {
  message.success('失败样本已加入评测集');
}

function createIssue() {
  message.success('已从线上异常创建问题');
}

function promoteStable() {
  candidate.status = '生产中';
  message.success('候选版本已提升为稳定版本');
}

function handleCluster(item: { title: string; action: string }) {
  message.info(`${item.title}：${item.action}`);
}

function handleFlowStep(label: string) {
  message.info(`当前步骤：${label}`);
}

function severityColor(severity: Severity) {
  const map: Record<Severity, string> = {
    Critical: 'red',
    High: 'orange',
    Warning: 'gold',
    Info: 'blue',
  };
  return map[severity];
}

function riskColor(risk: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    低: 'green',
    中: 'blue',
    高: 'orange',
    严重: 'red',
  };
  return map[risk];
}

function promptStatusColor(status: PromptStatus) {
  const map: Record<PromptStatus, string> = {
    草稿中: 'default',
    待评测: 'blue',
    待审批: 'gold',
    灰度中: 'cyan',
    生产中: 'green',
    需回滚: 'red',
    已归档: 'default',
  };
  return map[status];
}
</script>

<style scoped lang="scss">
.prompt-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 980px;
  height: 100%;
  overflow: auto;
  color: var(--app-text);
}

.prompt-toolbar,
.prompt-panel,
.detail-panel,
.feedback-panel {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.prompt-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 0.7fr) minmax(680px, 1.6fr);
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
}

.toolbar-title h1,
.panel-heading h2,
.prompt-detail-card h3,
.issue-box h3,
.drawer-section h3 {
  margin: 0;
  color: var(--app-text);
}

.toolbar-title h1 {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
}

.toolbar-title p,
.panel-heading p,
.prompt-detail-card p,
.issue-box p,
.drawer-section p,
.diff-list p {
  margin: 5px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.toolbar-controls {
  display: grid;
  grid-template-columns: auto minmax(260px, 1fr) 124px 112px auto;
  gap: 10px;
  align-items: center;
}

.toolbar-search {
  min-width: 240px;
}

.prompt-workspace {
  display: grid;
  grid-template-columns: minmax(620px, 1fr) 430px;
  gap: 14px;
  flex: 0 0 auto;
  min-height: 520px;
}

.prompt-panel,
.detail-panel,
.feedback-panel {
  min-width: 0;
  padding: 16px;
}

.prompt-panel,
.detail-panel {
  min-height: 0;
  overflow: hidden;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.panel-heading.compact {
  align-items: center;
}

.panel-heading h2 {
  font-size: 17px;
  font-weight: 700;
}

.status-tabs {
  max-width: 100%;
  margin-top: -10px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.summary-strip button,
.release-flow button,
.sample-card,
.prompt-name-cell {
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.summary-strip button {
  display: grid;
  gap: 5px;
  min-height: 74px;
  padding: 12px;
  color: var(--app-text);
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.summary-strip span,
.prompt-detail-card dt,
.issue-box span,
.release-flow span,
.evaluation-list span,
.feedback-card span,
.sample-card span,
.passport-grid span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.summary-strip strong {
  font-size: 22px;
  line-height: 1;
}

.summary-strip em,
.sample-card em {
  font-size: 12px;
  font-style: normal;
}

.tone-green {
  color: var(--app-success);
}

.tone-red {
  color: var(--app-danger);
}

.tone-amber {
  color: var(--app-warning);
}

.tone-blue {
  color: var(--app-primary);
}

.prompt-table {
  :deep(.ant-table-row) {
    cursor: pointer;
  }
}

.prompt-name-cell {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 7px 8px;
  color: var(--app-text);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
}

.prompt-name-cell.active {
  border-color: rgba(79, 123, 255, 0.6);
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.prompt-name-cell strong {
  font-size: 13px;
}

.prompt-name-cell span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.score-cell {
  display: grid;
  gap: 4px;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}

.prompt-detail-card,
.issue-box,
.evaluation-list article,
.feedback-card,
.sample-card,
.passport-grid article,
.diff-list article {
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.prompt-detail-card {
  padding: 14px;
}

.detail-card-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.detail-card-head h3,
.issue-box h3,
.drawer-section h3 {
  font-size: 15px;
  font-weight: 700;
}

.detail-card-head > strong {
  color: var(--app-primary);
  font-size: 32px;
  line-height: 1;
}

.prompt-detail-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0 0;
}

.prompt-detail-card dt,
.prompt-detail-card dd {
  margin: 0;
}

.prompt-detail-card dd {
  margin-top: 4px;
  color: var(--app-text);
  font-size: 13px;
}

.issue-box {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
}

.release-flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.release-flow button {
  display: grid;
  gap: 5px;
  min-height: 66px;
  padding: 10px;
  color: var(--app-text);
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.release-flow button.done {
  border-color: rgba(34, 197, 94, 0.45);
}

.release-flow button.active {
  border-color: rgba(79, 123, 255, 0.55);
  background: rgba(79, 123, 255, 0.08);
}

.release-flow strong {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evaluation-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.evaluation-list article {
  padding: 10px;
}

.evaluation-list article > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.evaluation-list small,
.feedback-card small,
.passport-grid small {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.panel-actions,
.feedback-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.feedback-panel {
  flex: 0 0 auto;
}

.feedback-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 10px;
}

.feedback-card,
.sample-card {
  display: grid;
  gap: 5px;
  min-height: 78px;
  padding: 12px;
}

.sample-card {
  color: var(--app-text);
  background: var(--app-surface);
}

.feedback-card strong,
.sample-card strong {
  font-size: 20px;
  line-height: 1.1;
}

.feedback-actions {
  margin-top: 12px;
}

.drawer-section + .drawer-section {
  margin-top: 20px;
}

.passport-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.passport-grid article,
.diff-list article {
  display: grid;
  gap: 6px;
  padding: 12px;
}

.passport-grid strong {
  font-size: 22px;
}

.diff-list {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 1500px) {
  .prompt-toolbar,
  .prompt-workspace {
    grid-template-columns: 1fr;
  }

  .toolbar-controls {
    display: flex;
    flex-wrap: wrap;
  }

  .toolbar-search {
    flex: 1 1 320px;
  }

  .feedback-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .summary-strip,
  .release-flow,
  .feedback-grid,
  .passport-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .evaluation-list,
  .prompt-detail-card dl {
    grid-template-columns: 1fr;
  }
}
</style>
