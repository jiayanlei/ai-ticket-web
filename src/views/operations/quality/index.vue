<template>
  <div class="biz-page quality-page">
    <header class="quality-toolbar">
      <div class="toolbar-copy">
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageDescription }}</p>
      </div>
      <div class="toolbar-filters">
        <a-input
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索样本标题、客户、坐席、风险标签"
          @press-enter="filterSamples"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select v-model:value="query.channel" allow-clear placeholder="渠道" @change="filterSamples">
          <a-select-option v-for="item in channelOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.agent" allow-clear placeholder="坐席" @change="filterSamples">
          <a-select-option v-for="item in agentOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.status" allow-clear placeholder="状态" @change="filterSamples">
          <a-select-option v-for="item in statusOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.type" allow-clear placeholder="质检类型" @change="filterSamples">
          <a-select-option v-for="item in typeOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-space class="toolbar-actions">
          <a-button type="primary" :loading="loading" @click="filterSamples">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button @click="resetQuery">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
          <a-button type="primary" @click="runQualityCheck">
            <template #icon><ThunderboltOutlined /></template>
            运行质检
          </a-button>
        </a-space>
      </div>
    </header>

    <main class="quality-workbench">
      <section class="sample-section">
        <div class="section-heading">
          <div>
            <h2>质检样本</h2>
            <p>覆盖在线客服、客户联络中心、邮件、短信、工单等样本，按风险和复核状态推进闭环。</p>
          </div>
          <a-tag color="processing">{{ filteredSamples.length }} 条样本</a-tag>
        </div>

        <a-table
          class="quality-table"
          :columns="sampleColumns"
          :data-source="filteredSamples"
          :loading="loading"
          :pagination="false"
          :row-class-name="rowClassName"
          :scroll="{ x: 1360, y: tableHeight }"
          row-key="id"
          size="middle"
          @row="sampleRow"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <button class="sample-title" type="button" @click.stop="openDetail(record)">
                <strong>{{ record.title }}</strong>
                <span>{{ record.sampleNo }} / {{ record.qualityType }} / {{ record.time }}</span>
              </button>
            </template>
            <template v-else-if="column.key === 'channel'">
              <a-tag :color="channelColor(record.channel)">{{ record.channel }}</a-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-badge :status="statusBadge(record.status)" :text="record.status" />
            </template>
            <template v-else-if="column.key === 'score'">
              <div class="score-cell">
                <strong :class="{ danger: record.aiScore < 80 }">{{ record.aiScore }}</strong>
                <a-progress :percent="record.aiScore" :show-info="false" size="small" />
              </div>
            </template>
            <template v-else-if="column.key === 'risk'">
              <a-tag :color="riskColor(record.riskLevel)">{{ record.riskLevel }}</a-tag>
            </template>
            <template v-else-if="column.key === 'rules'">
              <div class="tag-stack">
                <a-tag v-for="item in record.matchedRules.slice(0, 2)" :key="item" color="blue">{{ item }}</a-tag>
                <span v-if="record.matchedRules.length > 2">+{{ record.matchedRules.length - 2 }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button size="small" type="link" @click.stop="openDetail(record)">查看</a-button>
                <a-button size="small" type="link" @click.stop="submitReview(record)">复核</a-button>
                <a-button size="small" type="link" @click.stop="createRectifyTask(record)">整改</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </section>

      <a-drawer
        v-if="activeSample"
        v-model:open="detailOpen"
        class="quality-detail-drawer"
        title="质检详情"
        width="860"
        destroy-on-close
      >
        <div class="detail-scroll">
          <section class="detail-header">
            <div>
              <div class="detail-title">
                <h2>{{ activeSample.title }}</h2>
                <a-tag :color="riskColor(activeSample.riskLevel)">{{ activeSample.riskLevel }}</a-tag>
              </div>
              <p>{{ activeSample.customer }} / {{ activeSample.channel }} / {{ activeSample.agent }} / {{ activeSample.time }}</p>
            </div>
            <div class="score-summary">
              <span>AI 评分</span>
              <strong :class="{ danger: activeSample.aiScore < 80 }">{{ activeSample.aiScore }}</strong>
            </div>
          </section>

          <section class="detail-block">
            <div class="block-title">
              <h3>AI 初评依据</h3>
              <a-tag :color="statusTagColor(activeSample.status)">{{ activeSample.status }}</a-tag>
            </div>
            <p class="ai-summary">{{ activeSample.aiSummary }}</p>
            <div class="deduction-list">
              <article v-for="item in activeSample.deductions" :key="item.rule">
                <div>
                  <strong>{{ item.rule }}</strong>
                  <p>{{ item.reason }}</p>
                </div>
                <span class="deduction-points">-{{ item.points }}</span>
              </article>
            </div>
          </section>

          <section class="detail-block">
            <div class="block-title">
              <h3>证据时间线</h3>
              <span>按会话和通话时间排序</span>
            </div>
            <a-timeline class="evidence-timeline">
              <a-timeline-item v-for="item in activeSample.evidenceTimeline" :key="item.time + item.title" :color="evidenceColor(item.type)">
                <div class="timeline-card">
                  <div class="timeline-head">
                    <strong>{{ item.time }} {{ item.title }}</strong>
                    <a-tag>{{ item.type }}</a-tag>
                  </div>
                  <p>{{ item.content }}</p>
                  <small>{{ item.source }}</small>
                </div>
              </a-timeline-item>
            </a-timeline>
          </section>

          <section class="detail-block">
            <div class="block-title">
              <h3>命中规则</h3>
              <span>服务规范、话术合规、响应时效、情绪风险、投诉倾向、业务违规</span>
            </div>
            <div class="rule-list">
              <article v-for="item in activeSample.ruleDetails" :key="item.name">
                <div>
                  <strong>{{ item.name }}</strong>
                  <p>{{ item.description }}</p>
                </div>
                <span :class="['confidence-value', confidenceClass(item.confidence)]">
                  {{ item.confidence }}%
                </span>
              </article>
            </div>
          </section>

          <section class="detail-block">
            <div class="block-title">
              <h3>人工复核</h3>
              <span>确认、调分、备注和提交复核结果</span>
            </div>
            <a-form layout="vertical" class="review-form">
              <a-form-item label="复核结论">
                <a-segmented v-model:value="reviewForm.result" :options="reviewResultOptions" />
              </a-form-item>
              <div class="review-grid">
                <a-form-item label="调整后评分">
                  <a-input-number v-model:value="reviewForm.score" :max="100" :min="0" class="full-control" />
                </a-form-item>
                <a-form-item label="复核人">
                  <a-select v-model:value="reviewForm.reviewer" class="full-control">
                    <a-select-option v-for="item in reviewerOptions" :key="item" :value="item">{{ item }}</a-select-option>
                  </a-select>
                </a-form-item>
              </div>
              <a-form-item label="复核备注">
                <a-textarea v-model:value="reviewForm.remark" :rows="3" placeholder="补充复核依据、调整原因或后续动作" />
              </a-form-item>
              <a-space wrap>
                <a-button type="primary" @click="submitReview(activeSample)">提交复核</a-button>
                <a-button @click="createRectifyTask(activeSample)">生成整改</a-button>
                <a-button @click="archiveSample(activeSample)">归档结果</a-button>
              </a-space>
            </a-form>
          </section>

          <section class="detail-block">
            <div class="block-title">
              <h3>申诉处理</h3>
              <span>保留坐席申诉、质检员和主管处理记录</span>
            </div>
            <div class="record-list">
              <article v-for="item in activeSample.appeals" :key="item.time + item.operator">
                <div>
                  <strong>{{ item.operator }} / {{ item.action }}</strong>
                  <p>{{ item.content }}</p>
                </div>
                <small>{{ item.time }}</small>
              </article>
            </div>
          </section>

          <section class="detail-block">
            <div class="block-title">
              <h3>整改任务</h3>
              <span>关联培训中心、绩效中心、坐席中心</span>
            </div>
            <div class="task-list">
              <article v-for="item in activeSample.rectifyTasks" :key="item.title">
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.owner }} / {{ item.dueDate }} / {{ item.linkedTo }}</p>
                </div>
                <span :class="['task-status', taskStatusClass(item.status)]">{{ item.status }}</span>
              </article>
            </div>
          </section>

          <section class="detail-block">
            <div class="block-title">
              <h3>结果归档与规则优化</h3>
              <span>沉淀评分、扣分、复核、申诉、整改和规则问题</span>
            </div>
            <div class="archive-grid">
              <div>
                <span>归档状态</span>
                <strong>{{ activeSample.archiveStatus }}</strong>
              </div>
              <div>
                <span>规则优化</span>
                <strong>{{ activeSample.ruleOptimization }}</strong>
              </div>
            </div>
            <div class="record-list compact">
              <article v-for="item in activeSample.reviewRecords" :key="item.time + item.action">
                <div>
                  <strong>{{ item.action }}</strong>
                  <p>{{ item.content }}</p>
                </div>
                <small>{{ item.operator }} / {{ item.time }}</small>
              </article>
            </div>
          </section>
        </div>
      </a-drawer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons-vue';

type QualityChannel = '在线客服' | '客户联络中心' | '邮件' | '短信' | '工单';
type QualityStatus = '待初评' | 'AI 已初评' | '待复核' | '申诉中' | '整改中' | '已归档';
type QualityType = '抽检' | '全量质检' | '投诉专项' | '低分复盘' | '合规巡检';
type RiskLevel = '低风险' | '中风险' | '高风险' | '严重风险';
type EvidenceType = '投诉倾向' | '违规话术' | '响应时效' | '情绪升级' | '业务违规' | '服务规范';
type TaskStatus = '待处理' | '进行中' | '待验收' | '已完成';

interface DeductionItem {
  rule: string;
  points: number;
  reason: string;
}

interface EvidenceItem {
  time: string;
  type: EvidenceType;
  title: string;
  content: string;
  source: string;
}

interface RuleDetail {
  name: string;
  description: string;
  confidence: number;
}

interface ProcessRecord {
  operator: string;
  action: string;
  content: string;
  time: string;
}

interface RectifyTask {
  title: string;
  owner: string;
  dueDate: string;
  status: TaskStatus;
  linkedTo: string;
}

interface QualitySample {
  id: string;
  sampleNo: string;
  title: string;
  channel: QualityChannel;
  customer: string;
  agent: string;
  time: string;
  status: QualityStatus;
  qualityType: QualityType;
  aiScore: number;
  riskLevel: RiskLevel;
  riskTags: string[];
  matchedRules: string[];
  reviewer: string;
  updatedAt: string;
  aiSummary: string;
  deductions: DeductionItem[];
  evidenceTimeline: EvidenceItem[];
  ruleDetails: RuleDetail[];
  appeals: ProcessRecord[];
  rectifyTasks: RectifyTask[];
  reviewRecords: ProcessRecord[];
  archiveStatus: string;
  ruleOptimization: string;
}

const pageTitle = 'AI 质检';
const pageDescription = '围绕多渠道服务样本完成 AI 初评、证据复核、申诉整改、结果归档和规则优化。';
const loading = ref(false);
const tableHeight = 520;

const channelOptions: QualityChannel[] = ['在线客服', '客户联络中心', '邮件', '短信', '工单'];
const statusOptions: QualityStatus[] = ['待初评', 'AI 已初评', '待复核', '申诉中', '整改中', '已归档'];
const typeOptions: QualityType[] = ['抽检', '全量质检', '投诉专项', '低分复盘', '合规巡检'];
const reviewerOptions = ['韩清', '周岚', '罗一鸣', '质检主管'];
const reviewResultOptions = ['确认 AI 结果', '调整评分', '退回复核', '升级主管'];

const query = reactive({
  keyword: '',
  channel: undefined as QualityChannel | undefined,
  agent: undefined as string | undefined,
  status: undefined as QualityStatus | undefined,
  type: undefined as QualityType | undefined,
});

const reviewForm = reactive({
  result: '确认 AI 结果',
  score: 82,
  reviewer: '韩清',
  remark: 'AI 命中证据充分，建议生成话术合规整改并纳入本周班组复盘。',
});

const samples = ref<QualitySample[]>([
  {
    id: 'QS-1001',
    sampleNo: 'QC20260623001',
    title: '退款政策解释不完整引发投诉倾向',
    channel: '在线客服',
    customer: '蓝湖集团',
    agent: '陈沐阳',
    time: '2026-06-23 10:18',
    status: '待复核',
    qualityType: '投诉专项',
    aiScore: 76,
    riskLevel: '高风险',
    riskTags: ['投诉倾向', '话术偏离', '情绪升级'],
    matchedRules: ['服务规范', '话术合规', '情绪风险', '投诉倾向'],
    reviewer: '韩清',
    updatedAt: '2026-06-23 11:02',
    aiSummary:
      'AI 初评认为坐席在退款限制说明中遗漏关键条件，客户连续表达不满后未及时安抚，存在投诉升级风险。扣分证据来自 00:42 的政策解释和 02:08 的情绪升级片段。',
    deductions: [
      { rule: '话术合规', points: 8, reason: '退款口径缺少“审核周期”和“不可退场景”说明，容易造成客户误解。' },
      { rule: '情绪风险', points: 6, reason: '客户明确表达“我要投诉”后，坐席未先安抚再解释。' },
      { rule: '服务规范', points: 5, reason: '结束前未确认客户是否接受后续处理方案。' },
    ],
    evidenceTimeline: [
      {
        time: '00:42',
        type: '违规话术',
        title: '退款政策解释不完整',
        content: '坐席仅说明“需要后台审核”，未同步审核时长和不可退条件。',
        source: '在线客服会话 #C-82910',
      },
      {
        time: '01:35',
        type: '响应时效',
        title: '超过 SLA 响应阈值',
        content: '客户追问后 96 秒无回复，命中高价值客户响应时效规则。',
        source: '消息间隔检测',
      },
      {
        time: '02:08',
        type: '投诉倾向',
        title: '客户提出投诉',
        content: '客户表示“这个解释我不能接受，我要投诉你们”。',
        source: '情绪与意图识别',
      },
    ],
    ruleDetails: [
      { name: '服务规范-结束确认', description: '会话结束前需确认客户是否认可处理方案。', confidence: 91 },
      { name: '话术合规-退款政策', description: '退款口径需包含周期、限制条件和后续动作。', confidence: 94 },
      { name: '情绪风险-升级安抚', description: '客户情绪升高时需先安抚并给出明确承诺。', confidence: 88 },
      { name: '投诉倾向-显性投诉', description: '识别“投诉、监管、曝光”等显性风险表达。', confidence: 96 },
    ],
    appeals: [
      {
        operator: '陈沐阳',
        action: '发起申诉',
        content: '坐席说明当时后台系统超时，退款周期无法确认，请求复核响应时效扣分。',
        time: '2026-06-23 11:20',
      },
      {
        operator: '韩清',
        action: '待补充证据',
        content: '已要求补充系统异常截图，话术合规扣分维持。',
        time: '2026-06-23 11:34',
      },
    ],
    rectifyTasks: [
      { title: '退款话术专项复训', owner: '培训中心 / 林澈', dueDate: '2026-06-26', status: '进行中', linkedTo: '培训中心' },
      { title: '客户投诉安抚演练', owner: '坐席中心 / 陈沐阳', dueDate: '2026-06-25', status: '待处理', linkedTo: '坐席中心' },
    ],
    reviewRecords: [
      {
        operator: 'AI 质检',
        action: '完成初评',
        content: '命中 4 条规则，初评分 76，建议人工复核。',
        time: '2026-06-23 10:51',
      },
      {
        operator: '韩清',
        action: '进入复核',
        content: '已确认投诉倾向证据，等待坐席申诉材料。',
        time: '2026-06-23 11:08',
      },
    ],
    archiveStatus: '待复核完成后归档',
    ruleOptimization: '建议补充“系统异常导致口径不完整”的豁免条件',
  },
  {
    id: 'QS-1002',
    sampleNo: 'QC20260623002',
    title: '客户联络中心催收场景疑似强压话术',
    channel: '客户联络中心',
    customer: '北辰零售',
    agent: '许宁',
    time: '2026-06-23 09:42',
    status: '申诉中',
    qualityType: '合规巡检',
    aiScore: 68,
    riskLevel: '严重风险',
    riskTags: ['业务违规', '敏感话术', '申诉中'],
    matchedRules: ['业务违规', '话术合规', '服务规范'],
    reviewer: '质检主管',
    updatedAt: '2026-06-23 10:46',
    aiSummary: '通话中出现疑似强压式表述，AI 标记为严重风险；坐席已申诉称为客户复述内容，需主管复听确认。',
    deductions: [
      { rule: '业务违规', points: 14, reason: '疑似使用强制性承诺表述，违反催收沟通规范。' },
      { rule: '话术合规', points: 10, reason: '未按标准话术说明客户可选处理路径。' },
    ],
    evidenceTimeline: [
      {
        time: '03:16',
        type: '业务违规',
        title: '疑似强压式表述',
        content: 'AI 转写识别到“今天必须处理，否则后果自负”相关表达。',
        source: '通话录音 #CALL-9037',
      },
      {
        time: '03:42',
        type: '服务规范',
        title: '缺少选择权说明',
        content: '坐席未继续说明延期、分期和转人工主管处理路径。',
        source: '规则匹配',
      },
    ],
    ruleDetails: [
      { name: '业务违规-强制承诺', description: '禁止以威胁或强压方式要求客户承诺。', confidence: 86 },
      { name: '话术合规-可选路径', description: '涉及费用和权益时需明确客户选择权。', confidence: 82 },
    ],
    appeals: [
      {
        operator: '许宁',
        action: '发起申诉',
        content: '申诉称该句为复述客户原话，请主管复听前后文。',
        time: '2026-06-23 10:10',
      },
      {
        operator: '质检主管',
        action: '处理中',
        content: '已进入主管复听，暂不归档。',
        time: '2026-06-23 10:38',
      },
    ],
    rectifyTasks: [
      { title: '敏感话术复盘', owner: '绩效中心 / 主管组', dueDate: '2026-06-24', status: '待处理', linkedTo: '绩效中心' },
    ],
    reviewRecords: [
      {
        operator: 'AI 质检',
        action: '完成初评',
        content: '命中业务违规与话术合规规则，建议主管复核。',
        time: '2026-06-23 09:58',
      },
    ],
    archiveStatus: '申诉处理中',
    ruleOptimization: '需要优化转写引用客户原话的上下文识别',
  },
  {
    id: 'QS-1003',
    sampleNo: 'QC20260623003',
    title: '邮件回复未给出明确 SLA 和责任人',
    channel: '邮件',
    customer: '远山物流',
    agent: '林溪',
    time: '2026-06-22 16:25',
    status: '整改中',
    qualityType: '抽检',
    aiScore: 81,
    riskLevel: '中风险',
    riskTags: ['响应时效', '服务规范'],
    matchedRules: ['响应时效', '服务规范'],
    reviewer: '周岚',
    updatedAt: '2026-06-23 09:15',
    aiSummary: '邮件回复已解决核心问题，但缺少预计完成时间和责任人，可能影响客户预期管理。',
    deductions: [
      { rule: '服务规范', points: 7, reason: '未说明后续责任人和反馈节点。' },
      { rule: '响应时效', points: 4, reason: '首次回复晚于 VIP 客户邮件 SLA 18 分钟。' },
    ],
    evidenceTimeline: [
      {
        time: '16:25',
        type: '响应时效',
        title: '首次回复超时',
        content: 'VIP 客户邮件首次响应超出 30 分钟 SLA。',
        source: '邮件 #MAIL-12820',
      },
      {
        time: '16:32',
        type: '服务规范',
        title: '缺少后续节点',
        content: '邮件正文未写明预计处理完成时间和责任人。',
        source: '邮件正文解析',
      },
    ],
    ruleDetails: [
      { name: '响应时效-VIP 邮件', description: 'VIP 邮件需在 30 分钟内首次响应。', confidence: 93 },
      { name: '服务规范-闭环承诺', description: '异步渠道需给出责任人和下一次反馈时间。', confidence: 90 },
    ],
    appeals: [],
    rectifyTasks: [
      { title: '邮件闭环模板修订', owner: '培训中心 / 周岚', dueDate: '2026-06-27', status: '进行中', linkedTo: '培训中心' },
      { title: 'VIP 邮件 SLA 复盘', owner: '绩效中心 / 林溪', dueDate: '2026-06-28', status: '待验收', linkedTo: '绩效中心' },
    ],
    reviewRecords: [
      {
        operator: '周岚',
        action: '复核通过',
        content: '扣分依据明确，已生成整改任务。',
        time: '2026-06-23 09:11',
      },
    ],
    archiveStatus: '整改完成后归档',
    ruleOptimization: '当前规则有效，建议纳入邮件模板检查项',
  },
  {
    id: 'QS-1004',
    sampleNo: 'QC20260622018',
    title: '短信通知模板缺少退订说明',
    channel: '短信',
    customer: '青云会员',
    agent: '系统触达',
    time: '2026-06-22 14:08',
    status: '已归档',
    qualityType: '全量质检',
    aiScore: 88,
    riskLevel: '低风险',
    riskTags: ['模板合规'],
    matchedRules: ['话术合规'],
    reviewer: '罗一鸣',
    updatedAt: '2026-06-22 17:30',
    aiSummary: '短信内容无敏感承诺，但营销触达模板缺少退订说明，已完成模板修订并归档。',
    deductions: [{ rule: '话术合规', points: 5, reason: '营销短信需包含清晰退订路径。' }],
    evidenceTimeline: [
      {
        time: '14:08',
        type: '违规话术',
        title: '缺少退订说明',
        content: '短信模板末尾未包含“退订回 T”等说明。',
        source: '短信模板 #SMS-7782',
      },
    ],
    ruleDetails: [{ name: '话术合规-营销退订', description: '营销短信必须包含退订路径。', confidence: 97 }],
    appeals: [],
    rectifyTasks: [
      { title: '营销短信模板修订', owner: '坐席中心 / 模板管理员', dueDate: '2026-06-22', status: '已完成', linkedTo: '坐席中心' },
    ],
    reviewRecords: [
      {
        operator: '罗一鸣',
        action: '归档',
        content: '模板已修订，评分、扣分原因和整改记录完成归档。',
        time: '2026-06-22 17:30',
      },
    ],
    archiveStatus: '已归档',
    ruleOptimization: '已将退订说明加入模板发布前校验',
  },
  {
    id: 'QS-1005',
    sampleNo: 'QC20260622021',
    title: '工单转派后未同步客户处理进度',
    channel: '工单',
    customer: '星桥科技',
    agent: '赵言',
    time: '2026-06-22 18:40',
    status: 'AI 已初评',
    qualityType: '低分复盘',
    aiScore: 79,
    riskLevel: '中风险',
    riskTags: ['工单闭环', '客户催办'],
    matchedRules: ['服务规范', '响应时效', '投诉倾向'],
    reviewer: '待分配',
    updatedAt: '2026-06-23 08:20',
    aiSummary: '工单内部已转派但未同步客户，客户二次催办后出现不满表达，建议进入人工复核并生成闭环提醒整改。',
    deductions: [
      { rule: '服务规范', points: 8, reason: '转派后未向客户同步处理进度。' },
      { rule: '投诉倾向', points: 5, reason: '客户二次催办并表达“没人负责”的负向意图。' },
    ],
    evidenceTimeline: [
      {
        time: '18:40',
        type: '服务规范',
        title: '内部转派未外部同步',
        content: '工单转派至技术二线后，没有自动或人工同步客户。',
        source: '工单 #TK-66291',
      },
      {
        time: '20:15',
        type: '投诉倾向',
        title: '客户二次催办',
        content: '客户留言“到底有没有人负责这个问题”。',
        source: '工单评论',
      },
    ],
    ruleDetails: [
      { name: '服务规范-转派通知', description: '工单转派后需同步客户当前处理人和预计反馈时间。', confidence: 92 },
      { name: '投诉倾向-无人负责', description: '客户表达无人处理、没人负责时标记投诉倾向。', confidence: 84 },
    ],
    appeals: [],
    rectifyTasks: [],
    reviewRecords: [
      {
        operator: 'AI 质检',
        action: '完成初评',
        content: '建议分配复核人并生成工单闭环整改任务。',
        time: '2026-06-23 08:20',
      },
    ],
    archiveStatus: '待人工复核',
    ruleOptimization: '建议与工单自动通知规则联动',
  },
]);

const activeSample = ref(samples.value[0]);
const detailOpen = ref(false);

const sampleColumns = [
  { title: '样本标题', dataIndex: 'title', key: 'title', width: 300 },
  { title: '渠道', dataIndex: 'channel', key: 'channel', width: 110 },
  { title: '客户', dataIndex: 'customer', key: 'customer', width: 120, ellipsis: true },
  { title: '坐席', dataIndex: 'agent', key: 'agent', width: 110 },
  { title: '质检状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: 'AI 评分', dataIndex: 'aiScore', key: 'score', width: 130, sorter: (a: QualitySample, b: QualitySample) => a.aiScore - b.aiScore },
  { title: '风险等级', dataIndex: 'riskLevel', key: 'risk', width: 110 },
  { title: '命中规则', dataIndex: 'matchedRules', key: 'rules', width: 210 },
  { title: '复核人', dataIndex: 'reviewer', key: 'reviewer', width: 110 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
  { title: '操作', key: 'action', width: 170 },
];

const agentOptions = computed(() => Array.from(new Set(samples.value.map((item) => item.agent))));

const filteredSamples = computed(() => {
  const keyword = query.keyword.trim().toLowerCase();
  return samples.value.filter((item) => {
    const keywordMatched =
      !keyword ||
      [item.title, item.customer, item.agent, item.sampleNo, ...item.riskTags, ...item.matchedRules]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    return (
      keywordMatched &&
      (!query.channel || item.channel === query.channel) &&
      (!query.agent || item.agent === query.agent) &&
      (!query.status || item.status === query.status) &&
      (!query.type || item.qualityType === query.type)
    );
  });
});

watch(
  activeSample,
  (sample) => {
    if (!sample) return;
    reviewForm.score = sample.aiScore;
    reviewForm.reviewer = sample.reviewer === '待分配' ? '韩清' : sample.reviewer;
    reviewForm.remark = sample.aiSummary;
  },
  { immediate: true },
);

function filterSamples() {
  loading.value = true;
  window.setTimeout(() => {
    loading.value = false;
    if (!filteredSamples.value.some((item) => item.id === activeSample.value?.id)) {
      activeSample.value = filteredSamples.value[0];
    }
  }, 180);
}

function resetQuery() {
  query.keyword = '';
  query.channel = undefined;
  query.agent = undefined;
  query.status = undefined;
  query.type = undefined;
  filterSamples();
}

function selectSample(sample: QualitySample) {
  activeSample.value = sample;
}

function openDetail(sample: QualitySample) {
  selectSample(sample);
  detailOpen.value = true;
}

function sampleRow(record: QualitySample) {
  return {
    onClick: () => openDetail(record),
  };
}

function rowClassName(record: QualitySample) {
  return record.id === activeSample.value?.id ? 'quality-row-active' : '';
}

function runQualityCheck() {
  message.success('已提交多渠道样本质检任务');
}

function submitReview(sample: QualitySample) {
  message.success(`${sample.sampleNo} 复核结果已提交`);
}

function createRectifyTask(sample: QualitySample) {
  message.success(`${sample.sampleNo} 已生成整改任务`);
}

function archiveSample(sample: QualitySample) {
  message.success(`${sample.sampleNo} 已归档质检结果`);
}

function channelColor(channel: QualityChannel) {
  const map: Record<QualityChannel, string> = {
    在线客服: 'blue',
    客户联络中心: 'purple',
    邮件: 'cyan',
    短信: 'green',
    工单: 'geekblue',
  };
  return map[channel];
}

function statusBadge(status: QualityStatus) {
  const map: Record<QualityStatus, 'default' | 'processing' | 'success' | 'warning' | 'error'> = {
    待初评: 'default',
    'AI 已初评': 'processing',
    待复核: 'warning',
    申诉中: 'error',
    整改中: 'processing',
    已归档: 'success',
  };
  return map[status];
}

function statusTagColor(status: QualityStatus) {
  const map: Record<QualityStatus, string> = {
    待初评: 'default',
    'AI 已初评': 'blue',
    待复核: 'orange',
    申诉中: 'red',
    整改中: 'purple',
    已归档: 'green',
  };
  return map[status];
}

function riskColor(risk: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    低风险: 'green',
    中风险: 'orange',
    高风险: 'red',
    严重风险: 'volcano',
  };
  return map[risk];
}

function evidenceColor(type: EvidenceType) {
  const map: Record<EvidenceType, string> = {
    投诉倾向: 'red',
    违规话术: 'orange',
    响应时效: 'blue',
    情绪升级: 'purple',
    业务违规: 'red',
    服务规范: 'green',
  };
  return map[type];
}

function confidenceClass(confidence: number) {
  if (confidence >= 90) {
    return 'confidence-value--high';
  }
  if (confidence >= 80) {
    return 'confidence-value--medium';
  }
  return 'confidence-value--low';
}

function taskStatusClass(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    待处理: 'task-status--todo',
    进行中: 'task-status--doing',
    待验收: 'task-status--review',
    已完成: 'task-status--done',
  };
  return map[status];
}
</script>

<style scoped lang="scss">
.quality-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  color: var(--app-text);
}

.quality-toolbar,
.sample-section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgb(15 23 42 / 6%);
}

.quality-toolbar {
  display: grid;
  gap: 14px;
  padding: 14px 18px;
}

.toolbar-copy {
  min-width: 0;

  h1 {
    margin: 0 0 6px;
    font-size: 20px;
    line-height: 1.3;
  }

  p {
    margin: 0;
    color: var(--app-text-secondary);
    line-height: 1.7;
  }
}

.toolbar-filters {
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(4, minmax(118px, 0.75fr)) auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.toolbar-actions {
  justify-content: flex-end;
  white-space: nowrap;
}

.toolbar-actions :deep(.ant-btn-primary.ant-btn-background-ghost) {
  color: #315cff;
  background: rgba(79, 123, 255, 0.1);
  border-color: rgba(79, 123, 255, 0.35);
}

.toolbar-actions :deep(.ant-btn-primary.ant-btn-background-ghost:hover) {
  color: #ffffff;
  background: var(--app-primary);
  border-color: var(--app-primary);
}

.quality-workbench {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.sample-section {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
}

.section-heading,
.block-title,
.detail-title,
.timeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.section-heading {
  margin-bottom: 14px;

  h2 {
    margin: 0 0 4px;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: var(--app-text-secondary);
  }
}

.quality-table {
  flex: 1 1 auto;
  min-height: 0;

  :deep(.ant-table-wrapper),
  :deep(.ant-spin-nested-loading),
  :deep(.ant-spin-container),
  :deep(.ant-table) {
    min-height: 0;
  }

  :deep(.quality-row-active td) {
    background: rgba(79, 123, 255, 0.08) !important;
  }

  :deep(.ant-table-row) {
    cursor: pointer;
  }
}

.sample-title {
  display: grid;
  width: 100%;
  min-width: 0;
  padding: 0;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;

  strong,
  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    margin-top: 4px;
    color: var(--app-text-muted);
    font-size: 12px;
  }
}

.score-cell {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 8px;
  align-items: center;

  strong {
    font-size: 18px;

    &.danger {
      color: var(--app-danger);
    }
  }
}

.tag-stack {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;

  span {
    color: var(--app-text-muted);
    font-size: 12px;
  }
}

.detail-scroll {
  max-height: calc(100vh - 112px);
  overflow: auto;
}

.detail-header,
.detail-block {
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
}

.detail-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  margin-bottom: 12px;

  h2 {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 18px;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    margin: 6px 0 0;
    color: var(--app-text-secondary);
    line-height: 1.6;
  }
}

.score-summary {
  display: grid;
  min-width: 64px;
  text-align: right;

  span {
    color: var(--app-text-muted);
    font-size: 12px;
  }

  strong {
    font-size: 32px;
    line-height: 1.1;

    &.danger {
      color: var(--app-danger);
    }
  }
}

.detail-block {
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 16px;
  }

  .block-title > span {
    min-width: 0;
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.ai-summary {
  margin: 12px 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.deduction-list,
.rule-list,
.record-list,
.task-list {
  display: grid;
  gap: 8px;
}

.deduction-list article,
.rule-list article,
.record-list article,
.task-list article,
.timeline-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  padding: 10px;
  background: var(--app-surface-muted);
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 8px;

  strong,
  p {
    min-width: 0;
  }

  p {
    margin: 4px 0 0;
    color: var(--app-text-secondary);
    line-height: 1.6;
  }

  small {
    color: var(--app-text-muted);
    white-space: nowrap;
  }
}

.deduction-points,
.confidence-value,
.task-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.deduction-points {
  color: var(--app-danger);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.22);
}

.confidence-value--high {
  color: #15803d;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.24);
}

.confidence-value--medium {
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.26);
}

.confidence-value--low {
  color: #2563eb;
  background: rgba(79, 123, 255, 0.1);
  border: 1px solid rgba(79, 123, 255, 0.24);
}

.task-status--todo {
  color: var(--app-text-secondary);
  background: rgba(100, 116, 139, 0.1);
  border: 1px solid rgba(100, 116, 139, 0.22);
}

.task-status--doing {
  color: #2563eb;
  background: rgba(79, 123, 255, 0.1);
  border: 1px solid rgba(79, 123, 255, 0.24);
}

.task-status--review {
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.26);
}

.task-status--done {
  color: #15803d;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.24);
}

.evidence-timeline {
  margin-top: 14px;

  :deep(.ant-timeline-item-last) {
    padding-bottom: 0;
  }
}

.timeline-card {
  display: block;
}

.timeline-head {
  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.review-form {
  margin-top: 12px;
}

.review-grid,
.archive-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.full-control {
  width: 100%;
}

.archive-grid {
  margin: 12px 0;

  div {
    padding: 10px;
    background: var(--app-surface-muted);
    border-radius: 8px;
  }

  span {
    display: block;
    margin-bottom: 4px;
    color: var(--app-text-muted);
    font-size: 12px;
  }

  strong {
    line-height: 1.5;
  }
}

.record-list.compact {
  article {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 1500px) {
  .toolbar-filters {
    grid-template-columns: minmax(240px, 1fr) repeat(4, minmax(120px, 1fr));
  }

  .toolbar-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .quality-workbench {
    overflow: auto;
  }

  .sample-section {
    min-height: 560px;
  }
}
</style>
