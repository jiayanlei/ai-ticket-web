<template>
  <div class="prompt-page">
    <header class="prompt-command-bar">
      <div class="command-intro">
        <h1>提示词中心</h1>
        <p>管理客服 AI 提示词的发现、评测、发布、观测和回滚闭环，确保线上回复可控、可测、可追踪。</p>
      </div>

      <div class="command-controls">
        <a-segmented v-model:value="environment" :options="environmentOptions" />
        <a-input
          v-model:value="query.keyword"
          allow-clear
          class="command-search"
          placeholder="搜索 Prompt / 场景 / 负责人 / Agent / Workflow"
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
        <a-space wrap>
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

      <div v-if="activeFilterTags.length" class="active-filter-row">
        <a-tag v-for="item in activeFilterTags" :key="item" closable @close.prevent="clearFilter(item)">{{ item }}</a-tag>
      </div>
    </header>

    <main class="prompt-console">
      <section class="prompt-section problem-radar">
        <div class="section-heading">
          <div>
            <h2>问题雷达</h2>
            <p>从线上日志、评测集、投诉和护栏里收敛真正需要处理的 Prompt 问题。</p>
          </div>
          <a-space>
            <a-badge status="processing" text="每 5 分钟刷新" />
            <a-button size="small" @click="message.info('已刷新问题雷达')">刷新</a-button>
          </a-space>
        </div>

        <div class="health-strip">
          <button
            v-for="item in healthMetrics"
            :key="item.label"
            class="metric-card"
            type="button"
            @click="focusMetric(item)"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <em :class="`tone-${item.tone}`">{{ item.delta }}</em>
          </button>
        </div>

        <div class="radar-grid">
          <article v-for="lane in issueLanes" :key="lane.key" class="issue-lane">
            <div class="lane-head">
              <h3>{{ lane.title }}</h3>
              <a-tag :color="lane.color">{{ lane.items.length }}</a-tag>
            </div>
            <button
              v-for="issue in lane.items"
              :key="issue.id"
              :class="['issue-card', { active: activeIssue?.id === issue.id }]"
              type="button"
              @click="selectIssue(issue)"
            >
              <div class="issue-card__top">
                <a-tag :color="severityColor(issue.severity)">{{ issue.severity }}</a-tag>
                <span>{{ issue.source }}</span>
              </div>
              <strong>{{ issue.title }}</strong>
              <p>{{ issue.summary }}</p>
              <div class="issue-card__meta">
                <span>{{ issue.promptName }}</span>
                <b>{{ issue.impact }}</b>
              </div>
            </button>
          </article>

          <aside class="ai-insight">
            <div class="ai-insight__icon"><RobotOutlined /></div>
            <div>
              <h3>AI 审稿建议</h3>
              <p>{{ activeIssue?.suggestion ?? aiInsight }}</p>
              <a-space wrap>
                <a-button size="small" type="primary" @click="enterEvaluationFromIssue">进入评测</a-button>
                <a-button size="small" @click="addFailedSamples">样本入库</a-button>
              </a-space>
            </div>
          </aside>
        </div>
      </section>

      <section class="prompt-section asset-pool">
        <div class="section-heading">
          <div>
            <h2>Prompt 资产池</h2>
            <p>按生命周期管理版本、健康分、调用链路和影响范围，定位应该改哪一个 Prompt。</p>
          </div>
          <a-space wrap>
            <a-segmented v-model:value="assetView" :options="assetViewOptions" />
            <a-button type="primary" @click="clonePrompt(activePrompt)">克隆新版本</a-button>
          </a-space>
        </div>

        <a-tabs v-model:active-key="activeLifecycle" class="lifecycle-tabs">
          <a-tab-pane v-for="item in lifecycleTabs" :key="item" :tab="item" />
        </a-tabs>

        <div class="asset-layout">
          <a-table
            v-if="assetView === '表格'"
            class="prompt-table"
            :columns="promptColumns"
            :data-source="filteredPrompts"
            :pagination="false"
            :scroll="{ x: 1360, y: 332 }"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <button
                  :class="['prompt-name-cell', { active: activePrompt?.id === record.id }]"
                  type="button"
                  @click="selectPrompt(record)"
                >
                  <strong>{{ record.name }}</strong>
                  <span>{{ record.scenario }} / {{ record.channel }} / {{ record.description }}</span>
                </button>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="promptStatusColor(record.status)">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'health'">
                <div class="score-cell">
                  <strong>{{ record.health }}</strong>
                  <a-progress :percent="record.health" :show-info="false" size="small" :status="record.health < 70 ? 'exception' : 'normal'" />
                </div>
              </template>
              <template v-else-if="column.key === 'risk'">
                <a-tag :color="riskColor(record.risk)">{{ record.risk }}</a-tag>
              </template>
              <template v-else-if="column.key === 'dependencies'">
                <a-space wrap :size="[4, 4]">
                  <a-tag v-for="item in record.dependencies.slice(0, 3)" :key="item">{{ item }}</a-tag>
                </a-space>
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button size="small" type="link" @click="openPromptDetail(record)">详情</a-button>
                  <a-button size="small" type="link" @click="clonePrompt(record)">克隆</a-button>
                  <a-button size="small" type="link" @click="openDiff(record)">Diff</a-button>
                </a-space>
              </template>
            </template>
          </a-table>

          <div v-else class="prompt-card-grid">
            <button
              v-for="item in filteredPrompts"
              :key="item.id"
              :class="['prompt-asset-card', { active: activePrompt?.id === item.id }]"
              type="button"
              @click="selectPrompt(item)"
            >
              <div class="asset-card-head">
                <strong>{{ item.name }}</strong>
                <a-tag :color="promptStatusColor(item.status)">{{ item.status }}</a-tag>
              </div>
              <p>{{ item.description }}</p>
              <div class="asset-card-metrics">
                <span>健康分 <b>{{ item.health }}</b></span>
                <span>调用 <b>{{ item.calls }}</b></span>
                <span>版本 <b>{{ item.version }}</b></span>
              </div>
              <div class="asset-card-tags">
                <a-tag>{{ item.scenario }}</a-tag>
                <a-tag :color="riskColor(item.risk)">{{ item.risk }}</a-tag>
              </div>
            </button>
          </div>

          <aside class="dependency-panel">
            <div class="dependency-head">
              <h3>影响范围</h3>
              <a-tag :color="riskColor(activePrompt?.risk ?? '中')">{{ activePrompt?.risk ?? '中' }}风险</a-tag>
            </div>
            <strong>{{ activePrompt?.name }}</strong>
            <p>{{ activePrompt?.description }}</p>
            <div class="dependency-chain">
              <span v-for="item in dependencyChain" :key="item.label">
                <b>{{ item.label }}</b>
                {{ item.value }}
              </span>
            </div>
            <a-alert
              v-if="activePrompt?.risk === '高' || activePrompt?.risk === '严重'"
              class="dependency-alert"
              type="warning"
              show-icon
              message="共享 Prompt 影响多个 Agent，发布或回滚前需要确认灰度范围。"
            />
          </aside>
        </div>
      </section>

      <section class="lower-workbench">
        <div class="prompt-section evaluation-desk">
          <div class="section-heading">
            <div>
              <h2>评测发布台</h2>
              <p>把候选版本跑过变量模拟、历史工单回放、评测矩阵和审批灰度。</p>
            </div>
            <a-tag :color="candidateStatusColor(candidate.status)">{{ candidate.status }}</a-tag>
          </div>

          <div class="candidate-card">
            <div>
              <span>当前 Prompt</span>
              <strong>{{ activePrompt?.name }}</strong>
            </div>
            <div>
              <span>生产版本</span>
              <strong>{{ activePrompt?.version }}</strong>
            </div>
            <div>
              <span>候选版本</span>
              <strong>{{ candidate.version }}</strong>
            </div>
            <div>
              <span>变更原因</span>
              <strong>{{ candidate.reason }}</strong>
            </div>
          </div>

          <div class="editor-summary">
            <div>
              <h3>Prompt 结构摘要</h3>
              <p>{{ activePrompt?.template }}</p>
            </div>
            <a-button size="small" @click="editorOpen = true">打开编辑器</a-button>
          </div>

          <div class="variable-grid">
            <button v-for="item in variables" :key="item.name" type="button" @click="message.info(`${item.name} 已填入模拟器`)">
              <span>{{ item.name }}</span>
              <strong>{{ item.value }}</strong>
            </button>
          </div>

          <div class="evaluation-matrix">
            <article v-for="item in evaluationMetrics" :key="item.label">
              <div>
                <span>{{ item.label }}</span>
                <b>{{ item.score }}</b>
              </div>
              <a-progress :percent="item.score" :show-info="false" size="small" :status="item.score < item.threshold ? 'exception' : 'normal'" />
              <small>阈值 {{ item.threshold }} / 失败样本 {{ item.failed }}</small>
            </article>
          </div>

          <div class="release-actions">
            <a-button @click="openDiff(activePrompt)">查看版本 Diff</a-button>
            <a-button :disabled="!evaluationPassed" @click="approvalOpen = true">发起审批</a-button>
            <a-button :disabled="!evaluationPassed" type="primary" @click="grayRelease">灰度发布 10%</a-button>
          </div>
        </div>

        <div class="prompt-section feedback-board">
          <div class="section-heading">
            <div>
              <h2>线上反馈板</h2>
              <p>上线后的指标、A/B 结果和异常样本回流到问题雷达，形成持续改进。</p>
            </div>
            <a-button size="small" danger @click="rollbackOpen = true">回滚</a-button>
          </div>

          <div class="feedback-trends">
            <article v-for="item in feedbackMetrics" :key="item.label">
              <div class="trend-head">
                <span>{{ item.label }}</span>
                <strong :class="`tone-${item.tone}`">{{ item.value }}</strong>
              </div>
              <div class="sparkline">
                <i v-for="bar in item.points" :key="bar" :style="{ height: `${bar}%` }" />
              </div>
              <small>{{ item.note }}</small>
            </article>
          </div>

          <div class="ab-result">
            <div>
              <span>A/B 灰度结果</span>
              <strong>v12 vs v13-draft</strong>
              <p>v13 在投诉安抚场景解决率提升 5.8%，但退款到账承诺仍有 3 个失败样本。</p>
            </div>
            <a-tag color="orange">建议延长灰度</a-tag>
          </div>

          <div class="exception-clusters">
            <button v-for="item in exceptionClusters" :key="item.title" type="button" @click="handleCluster(item)">
              <span>{{ item.title }}</span>
              <strong>{{ item.count }}</strong>
              <em>{{ item.action }}</em>
            </button>
          </div>

          <div class="closed-loop-actions">
            <a-button @click="addFailedSamples">加入评测集</a-button>
            <a-button @click="createIssue">创建问题</a-button>
            <a-button type="primary" @click="promoteStable">提升为稳定版本</a-button>
          </div>
        </div>
      </section>
    </main>

    <a-drawer v-model:open="detailOpen" width="860" :title="activePrompt?.name">
      <template v-if="activePrompt">
        <section class="drawer-section">
          <h3>Prompt 健康护照</h3>
          <div class="passport-grid">
            <article v-for="item in passportMetrics" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.note }}</small>
            </article>
          </div>
        </section>
        <section class="drawer-section">
          <h3>版本时间线</h3>
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

    <a-drawer v-model:open="editorOpen" width="980" title="Prompt 编辑器">
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

    <a-drawer v-model:open="diffOpen" width="860" title="版本 Diff">
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
        <a-alert type="success" show-icon message="评测矩阵已通过，审批后可进入 10% 灰度。" />
      </a-form>
    </a-modal>

    <a-modal v-model:open="rollbackOpen" title="确认回滚" ok-text="回滚到 v11" ok-type="danger" @ok="confirmRollback">
      <p>当前候选版本仍有合规失败样本。回滚后将恢复到上一个稳定版本，并把异常样本重新推入问题雷达。</p>
      <a-textarea v-model:value="rollbackReason" :rows="3" placeholder="请输入回滚原因" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  ExperimentOutlined,
  ImportOutlined,
  ReloadOutlined,
  RobotOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';

type Environment = '生产' | '灰度' | '预发' | '草稿';
type Tone = 'green' | 'red' | 'amber' | 'blue' | 'cyan';
type Severity = 'Critical' | 'High' | 'Warning' | 'Info';
type RiskLevel = '低' | '中' | '高' | '严重';
type PromptStatus = '草稿中' | '待评测' | '待审批' | '灰度中' | '生产中' | '需回滚' | '已归档';

interface Issue {
  id: string;
  lane: string;
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
const assetView = ref('表格');
const assetViewOptions = ['表格', '卡片'];
const activeLifecycle = ref('全部');
const lifecycleTabs = ['全部', '草稿中', '待评测', '待审批', '灰度中', '生产中', '需回滚', '已归档'];
const detailOpen = ref(false);
const editorOpen = ref(false);
const diffOpen = ref(false);
const approvalOpen = ref(false);
const rollbackOpen = ref(false);
const approvalReason = ref('v13 候选版本已通过核心评测，申请进入 10% 灰度。');
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
    lane: 'compliance',
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
    lane: 'business',
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
    lane: 'model',
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
    lane: 'release',
    severity: 'High',
    title: '灰度版本差评升高',
    summary: '售后补偿建议 v9-gray 在 10% 灰度流量中差评增加 17 起。',
    promptId: 'compensation-suggestion',
    promptName: '售后补偿建议 v9-gray',
    impact: '差评 +17',
    source: '灰度监控',
    suggestion: '建议延长灰度并拆分低客单价与高价值客户样本，必要时回滚 v8。',
  },
]);

const activeIssueId = ref(issues.value[0].id);
const activePromptId = ref(prompts.value[0].id);

const activeIssue = computed(() => issues.value.find((item) => item.id === activeIssueId.value));
const activePrompt = computed(() => prompts.value.find((item) => item.id === activePromptId.value) ?? prompts.value[0]);

const healthMetrics = [
  { label: '评测通过率', value: '90.1%', delta: '-6.3%', tone: 'red' as Tone },
  { label: '护栏触发', value: '316', delta: '+8.4%', tone: 'amber' as Tone },
  { label: '转人工率', value: '18.7%', delta: '+3.2%', tone: 'red' as Tone },
  { label: '差评关联', value: '72', delta: '+12', tone: 'amber' as Tone },
  { label: '灰度异常', value: '4', delta: '需处理', tone: 'cyan' as Tone },
];

const aiInsight =
  'AI 检测到退款、售后和物流场景的失败样本正在聚集，优先处理高风险共享 Prompt 可以降低转人工和合规触发。';

const issueLanes = computed(() => [
  { key: 'compliance', title: '合规风险', color: 'red', items: issues.value.filter((item) => item.lane === 'compliance') },
  { key: 'business', title: '业务效果下降', color: 'orange', items: issues.value.filter((item) => item.lane === 'business') },
  { key: 'model', title: '模型输出异常', color: 'blue', items: issues.value.filter((item) => item.lane === 'model') },
  { key: 'release', title: '发布阻塞', color: 'purple', items: issues.value.filter((item) => item.lane === 'release') },
]);

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

const activeFilterTags = computed(() => [query.keyword, query.scenario, query.risk].filter(Boolean) as string[]);

const promptColumns = [
  { title: 'Prompt', dataIndex: 'name', key: 'name', width: 280, fixed: 'left' },
  { title: '生产版本', dataIndex: 'version', key: 'version', width: 110 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '健康分', dataIndex: 'health', key: 'health', width: 120 },
  { title: '风险', dataIndex: 'risk', key: 'risk', width: 90 },
  { title: '7日调用', dataIndex: 'calls', key: 'calls', width: 110 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 120 },
  { title: '依赖', dataIndex: 'dependencies', key: 'dependencies', width: 240 },
  { title: '最近变更', dataIndex: 'updatedAt', key: 'updatedAt', width: 120 },
  { title: '操作', key: 'actions', width: 180, fixed: 'right' },
];

const dependencyChain = computed(() => [
  { label: 'AI Agent', value: activePrompt.value?.dependencies[0] ?? '-' },
  { label: 'Workflow', value: activePrompt.value?.dependencies[1] ?? '-' },
  { label: 'Channel', value: activePrompt.value?.dependencies[2] ?? '-' },
  { label: 'Knowledge', value: activePrompt.value?.dependencies[3] ?? '-' },
]);

const candidate = reactive({
  version: 'v13-draft',
  reason: '补充承诺边界与引用要求',
  status: '评测通过',
});

const editorState = reactive({
  system: '你是企业客服 AI 助手，必须先核实订单、政策和知识来源，再给出回复建议。',
  user: '请根据 {客户等级}、{工单类型}、{订单状态} 和 {政策条款} 生成客服回复。',
  schema: '{ "reply": "string", "risk": "low|medium|high", "citations": ["string"], "nextAction": "string" }',
});

const variables = [
  { name: '{客户等级}', value: 'VIP / 普通 / 投诉客户' },
  { name: '{工单类型}', value: '退款争议 / 物流延迟 / 售后补偿' },
  { name: '{订单状态}', value: '已支付 / 已发货 / 已退款' },
  { name: '{政策条款}', value: '退款政策 / 补偿边界' },
];

const evaluationMetrics = ref([
  { label: '准确性', score: 93, threshold: 88, failed: 2 },
  { label: '合规', score: 86, threshold: 90, failed: 5 },
  { label: '语气', score: 95, threshold: 85, failed: 1 },
  { label: '引用质量', score: 91, threshold: 88, failed: 3 },
  { label: '解决率', score: 89, threshold: 86, failed: 4 },
  { label: '回归风险', score: 92, threshold: 90, failed: 2 },
]);

const evaluationPassed = computed(() => evaluationMetrics.value.every((item) => item.score >= item.threshold));

const feedbackMetrics = [
  { label: '满意度', value: '+2.8%', tone: 'green' as Tone, note: 'v13 灰度后轻微改善', points: [35, 42, 48, 52, 57, 62, 66, 71] },
  { label: '转人工', value: '-1.6%', tone: 'green' as Tone, note: '投诉场景下降', points: [76, 70, 68, 62, 56, 51, 49, 45] },
  { label: '护栏触发', value: '+3', tone: 'amber' as Tone, note: '退款到账承诺仍需处理', points: [24, 28, 32, 36, 54, 40, 38, 45] },
  { label: '重复咨询', value: '-4.2%', tone: 'green' as Tone, note: '引用质量提升后下降', points: [62, 58, 55, 51, 47, 44, 39, 35] },
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
  { label: '护栏触发', value: activePrompt.value?.risk === '高' ? '42' : '9', note: '最近 24 小时' },
  { label: '稳定版本', value: activePrompt.value?.history[1]?.version ?? activePrompt.value?.version ?? '-', note: '可回滚目标' },
]);

const diffItems = [
  { type: '新增', color: 'blue', title: '补充到账时效边界', detail: '禁止承诺具体到账时间，改为引用政策范围和银行处理说明。' },
  { type: '调整', color: 'orange', title: '加强引用要求', detail: '回复必须包含政策来源和订单状态，缺失时转人工确认。' },
  { type: '风险', color: 'red', title: '承诺语仍需收紧', detail: '失败样本中仍出现“马上到账”的近义表达，需要补充护栏词。' },
];

function applySearch() {
  message.success('筛选条件已应用');
}

function resetFilters() {
  query.keyword = '';
  query.scenario = undefined;
  query.risk = undefined;
  activeLifecycle.value = '全部';
}

function clearFilter(tag: string) {
  if (query.keyword === tag) query.keyword = '';
  if (query.scenario === tag) query.scenario = undefined;
  if (query.risk === tag) query.risk = undefined;
}

function selectIssue(issue: Issue) {
  activeIssueId.value = issue.id;
  activePromptId.value = issue.promptId;
}

function selectPrompt(prompt: PromptAsset) {
  activePromptId.value = prompt.id;
}

function focusMetric(item: { label: string }) {
  message.info(`已聚焦「${item.label}」相关 Prompt`);
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
  candidate.status = '评测通过';
  message.success('评测已完成，合规项仍需关注');
}

function enterEvaluationFromIssue() {
  if (activeIssue.value) {
    message.success(`已载入「${activeIssue.value.title}」的失败样本`);
  }
}

function grayRelease() {
  candidate.status = '灰度中';
  message.success('候选版本已进入 10% 灰度');
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
  message.warning('已回滚到 v11，并将异常样本重新推入问题雷达');
}

function openImportSamples() {
  message.info('样本导入入口已打开');
}

function addFailedSamples() {
  message.success('失败样本已加入退款争议评测集');
}

function createIssue() {
  message.success('已从线上异常创建问题卡片');
}

function promoteStable() {
  candidate.status = '生产中';
  message.success('候选版本已提升为稳定版本');
}

function handleCluster(item: { title: string; action: string }) {
  message.info(`${item.title}：${item.action}`);
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

function candidateStatusColor(status: string) {
  if (status.includes('通过') || status === '生产中') return 'green';
  if (status.includes('回滚')) return 'red';
  if (status.includes('灰度')) return 'cyan';
  if (status.includes('审批')) return 'gold';
  return 'blue';
}
</script>

<style scoped lang="scss">
.prompt-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 980px;
  height: 100%;
  overflow: hidden;
  color: var(--app-text);
}

.prompt-command-bar,
.prompt-section {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.72)),
    var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

:global(html.dark) .prompt-command-bar,
:global(html.dark) .prompt-section {
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.86)),
    var(--app-surface);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

.prompt-command-bar {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(700px, 1.8fr);
  gap: 14px;
  padding: 14px 16px;
}

.command-intro h1,
.section-heading h2,
.lane-head h3,
.ai-insight h3,
.dependency-panel h3,
.editor-summary h3,
.drawer-section h3 {
  margin: 0;
  color: var(--app-text);
}

.command-intro h1 {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
}

.command-intro p,
.section-heading p,
.issue-card p,
.dependency-panel p,
.editor-summary p,
.ab-result p,
.drawer-section p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.command-controls {
  display: grid;
  grid-template-columns: auto minmax(280px, 1fr) 136px 120px auto;
  gap: 10px;
  align-items: center;
}

.command-search {
  min-width: 260px;
}

.active-filter-row {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.prompt-console {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}

.prompt-section {
  padding: 16px;
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.section-heading h2 {
  font-size: 17px;
  font-weight: 700;
}

.health-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.metric-card,
.issue-card,
.prompt-asset-card,
.variable-grid button,
.exception-clusters button {
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.metric-card {
  display: grid;
  gap: 6px;
  min-height: 78px;
  padding: 12px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text);
}

.metric-card span,
.candidate-card span,
.feedback-trends span,
.variable-grid span,
.dependency-chain b,
.asset-card-metrics span,
.passport-grid span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.metric-card strong {
  font-size: 24px;
  line-height: 1;
}

.metric-card em,
.exception-clusters em {
  font-style: normal;
  font-size: 12px;
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

.tone-cyan {
  color: var(--app-accent);
}

.radar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) 1.2fr;
  gap: 12px;
}

.issue-lane,
.ai-insight,
.dependency-panel,
.candidate-card,
.editor-summary,
.evaluation-matrix article,
.feedback-trends article,
.ab-result,
.passport-grid article,
.diff-list article {
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.issue-lane {
  min-height: 196px;
  padding: 12px;
}

.lane-head,
.issue-card__top,
.issue-card__meta,
.asset-card-head,
.dependency-head,
.trend-head,
.ab-result,
.candidate-card,
.editor-summary,
.release-actions,
.closed-loop-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lane-head {
  margin-bottom: 10px;
}

.lane-head h3,
.ai-insight h3,
.dependency-panel h3,
.editor-summary h3,
.drawer-section h3 {
  font-size: 14px;
  font-weight: 700;
}

.issue-card {
  display: grid;
  gap: 8px;
  width: 100%;
  min-height: 132px;
  padding: 10px;
  margin-bottom: 10px;
  color: var(--app-text);
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid transparent;
  border-radius: 8px;
}

:global(html.dark) .issue-card {
  background: rgba(15, 23, 42, 0.46);
}

.issue-card.active,
.prompt-name-cell.active,
.prompt-asset-card.active {
  border-color: rgba(79, 123, 255, 0.72);
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.issue-card strong {
  font-size: 13px;
}

.issue-card__top span,
.issue-card__meta span,
.issue-card__meta b {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.issue-card__meta b {
  color: var(--app-danger);
}

.ai-insight {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  min-height: 196px;
}

.ai-insight__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  color: #fff;
  background: linear-gradient(135deg, var(--app-primary), var(--app-accent));
  border-radius: 8px;
}

.asset-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
  min-height: 360px;
}

.lifecycle-tabs {
  margin-top: -8px;
}

.prompt-name-cell {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 8px;
  color: var(--app-text);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
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

.prompt-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.prompt-asset-card {
  display: grid;
  gap: 10px;
  min-height: 166px;
  padding: 14px;
  color: var(--app-text);
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.prompt-asset-card p {
  min-height: 40px;
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.asset-card-metrics,
.asset-card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dependency-panel {
  align-self: stretch;
  padding: 14px;
}

.dependency-panel > strong {
  display: block;
  margin-top: 10px;
}

.dependency-chain {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.dependency-chain span {
  display: grid;
  gap: 3px;
  padding: 9px 10px;
  background: rgba(255, 255, 255, 0.54);
  border-radius: 8px;
}

:global(html.dark) .dependency-chain span {
  background: rgba(15, 23, 42, 0.46);
}

.dependency-alert {
  margin-top: 14px;
}

.lower-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(420px, 0.9fr);
  gap: 16px;
}

.candidate-card {
  flex-wrap: wrap;
  padding: 12px;
}

.candidate-card div {
  display: grid;
  gap: 4px;
  min-width: 132px;
}

.candidate-card strong {
  font-size: 13px;
}

.editor-summary {
  margin-top: 12px;
  padding: 12px;
}

.variable-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.variable-grid button {
  display: grid;
  gap: 6px;
  padding: 10px;
  color: var(--app-text);
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.variable-grid strong {
  font-size: 12px;
}

.evaluation-matrix {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.evaluation-matrix article {
  padding: 10px;
}

.evaluation-matrix article > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.evaluation-matrix small,
.feedback-trends small,
.passport-grid small {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.release-actions,
.closed-loop-actions {
  justify-content: flex-end;
  margin-top: 14px;
  flex-wrap: wrap;
}

.feedback-trends {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.feedback-trends article {
  padding: 12px;
}

.trend-head strong {
  font-size: 18px;
}

.sparkline {
  display: flex;
  align-items: end;
  gap: 5px;
  height: 54px;
  margin: 10px 0;
}

.sparkline i {
  flex: 1;
  min-width: 6px;
  background: linear-gradient(180deg, var(--app-accent), var(--app-primary));
  border-radius: 5px 5px 2px 2px;
  opacity: 0.86;
}

.ab-result {
  margin-top: 12px;
  padding: 12px;
}

.ab-result > div {
  min-width: 0;
}

.ab-result strong {
  display: block;
  margin-top: 4px;
}

.exception-clusters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.exception-clusters button {
  display: grid;
  gap: 5px;
  padding: 10px;
  color: var(--app-text);
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.exception-clusters strong {
  font-size: 20px;
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

.passport-grid article {
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

.diff-list article {
  display: grid;
  gap: 8px;
  padding: 12px;
}

.diff-list p {
  margin: 0;
  color: var(--app-text-secondary);
}

@media (max-width: 1500px) {
  .prompt-command-bar,
  .radar-grid,
  .lower-workbench {
    grid-template-columns: 1fr;
  }

  .command-controls {
    display: flex;
    flex-wrap: wrap;
  }

  .command-controls > * {
    flex: 0 0 auto;
  }

  .command-controls .command-search {
    flex: 1 1 360px;
  }

  .health-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .asset-layout {
    grid-template-columns: 1fr;
  }

  .dependency-panel {
    min-height: 0;
  }
}

@media (max-width: 1200px) {
  .variable-grid,
  .exception-clusters,
  .passport-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .evaluation-matrix,
  .feedback-trends,
  .prompt-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
