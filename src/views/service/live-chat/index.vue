<template>
  <div class="biz-page biz-page--chat">
    <header class="biz-topbar">
      <p>{{ pageDescription }}</p>
      <a-space class="biz-topbar__actions">
        <a-button :loading="loading" @click="loadData">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
        <a-button @click="batchAssign">
          <template #icon><TeamOutlined /></template>
          批量分配
        </a-button>
        <a-button @click="exportReport">
          <template #icon><ExportOutlined /></template>
          导出报表
        </a-button>
      </a-space>
    </header>

    <section class="chat-workspace">
      <aside class="queue-panel">
        <div class="panel-title">
          <h2>会话队列</h2>
        </div>
        <a-input
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索会话"
          @press-enter="loadData"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <div class="queue-filters">
          <a-segmented v-model:value="queueStatus" size="small" :options="queueStatusOptions" />
          <a-select v-model:value="priorityFilter" size="small" class="priority-select" :options="priorityOptions" />
        </div>

        <div class="session-cards">
          <button
            v-for="item in filteredSessions"
            :key="item.id"
            class="session-card"
            :class="{ active: active?.id === item.id, 'session-card--risk': item.riskLevel === '高风险' }"
            @click="setActive(item)"
          >
            <div class="session-card__head">
              <strong>{{ item.customerName }}</strong>
              <span>{{ item.waitingTime }}</span>
            </div>
            <p>{{ item.issueSummary }}</p>
            <div class="session-card__foot">
              <div class="session-card__tags">
                <a-tag :color="sessionStatusColor(item.sessionStatus)">{{ item.sessionStatus }}</a-tag>
                <a-tag :color="riskColor(item.riskLevel)">{{ item.riskLevel }}</a-tag>
              </div>
              <a-badge v-if="item.unread" :count="item.unread" />
            </div>
          </button>
          <a-empty v-if="!filteredSessions.length" description="暂无匹配会话" />
        </div>
      </aside>

      <main class="conversation-panel">
        <div v-if="active" class="conversation-head">
          <div class="conversation-title">
            <div class="conversation-head__meta">
              <a-tag>{{ active.channel }}</a-tag>
              <a-tag :color="sessionStatusColor(active.sessionStatus)">{{ active.sessionStatus }}</a-tag>
              <a-tag :color="riskColor(active.riskLevel)">{{ active.riskLevel }}</a-tag>
            </div>
            <h1 :title="conversationTitle">{{ conversationTitle }}</h1>
          </div>
          <a-space>
            <a-button @click="selectRecord(active)">会话详情</a-button>
            <a-button @click="assignActive">
              <template #icon><SwapOutlined /></template>
              转派
            </a-button>
            <a-button type="primary" @click="takeOverActive">
              <template #icon><UserSwitchOutlined /></template>
              接管
            </a-button>
          </a-space>
        </div>

        <a-alert
          v-if="showRiskAlert && active?.riskLevel === '高风险'"
          class="risk-alert"
          type="warning"
          closable
          show-icon
          message="高风险会话：机器人未命中意图，客户多次追问，建议人工接管并引用密码重置知识库。"
          @close="showRiskAlert = false"
        />

        <div class="message-stream">
          <template v-if="active">
            <article
              v-for="item in active.messages"
              :key="item.time + item.content"
              class="message-item"
              :class="'message-item--' + item.role"
            >
              <div class="message-item__bubble">
                <div class="message-item__head">
                  <strong>{{ roleText(item.role) }}</strong>
                  <small>{{ item.time }}</small>
                </div>
                <p>{{ item.content }}</p>
              </div>
            </article>
          </template>
          <a-empty v-else description="请选择会话" />
        </div>

        <section class="reply-box">
          <div class="reply-tools">
            <a-space wrap>
              <a-button size="small" @click="insertDraft">
                <template #icon><EditOutlined /></template>
                插入 AI 草稿
              </a-button>
              <a-button size="small" @click="quoteKnowledge">
                <template #icon><FileTextOutlined /></template>
                引用知识库
              </a-button>
              <a-button size="small" @click="saveInternalNote">
                <template #icon><CommentOutlined /></template>
                保存内部备注
              </a-button>
            </a-space>
            <a-space>
              <a-button @click="assignActive">转派坐席</a-button>
              <a-button type="primary" @click="markResolved">
                <template #icon><CheckCircleOutlined /></template>
                标记已解决
              </a-button>
            </a-space>
          </div>
          <a-textarea v-model:value="replyText" placeholder="输入客服回复，或先插入 AI 草稿后再编辑" :rows="4" />
        </section>
      </main>

      <aside class="ai-panel">
        <section class="context-card">
          <div class="panel-title">
            <h2>AI 辅助</h2>
            <a-tag :color="confidenceColor(active?.aiConfidence ?? 0)">置信度 {{ active?.aiConfidence ?? 0 }}%</a-tag>
          </div>
          <div class="ai-summary">
            <span>意图：{{ active?.intent }}</span>
            <span>风险：{{ active?.riskReason }}</span>
          </div>
          <h4>AI 回复草稿</h4>
          <p class="draft-text">{{ active?.aiDraft }}</p>
          <a-button block type="primary" @click="insertDraft">插入到输入框</a-button>
          <a-divider />
          <h4>建议动作</h4>
          <ul class="compact-list">
            <li v-for="action in active?.suggestedActions ?? []" :key="action">{{ action }}</li>
          </ul>
          <h4>关联知识库</h4>
          <button v-for="article in active?.knowledgeArticles ?? []" :key="article" class="knowledge-link" @click="quoteKnowledge">
            {{ article }}
          </button>
          <a-alert
            v-if="showKnowledgeGapAlert && active?.knowledgeGap"
            class="gap-alert"
            type="error"
            closable
            show-icon
            message="知识库缺口"
            :description="active.knowledgeGap"
            @close="showKnowledgeGapAlert = false"
          />
          <a-space class="context-actions">
            <a-button @click="openKnowledgeGap">查看详情</a-button>
            <a-button type="primary" @click="addKnowledge">补充知识库</a-button>
          </a-space>
        </section>
      </aside>
    </section>

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

    <a-modal v-model:open="knowledgeOpen" title="知识库缺口详情" :footer="null">
      <template v-if="active">
        <a-descriptions bordered :column="1" size="small">
          <a-descriptions-item label="当前问题">{{ active.issueSummary }}</a-descriptions-item>
          <a-descriptions-item label="缺口说明">{{ active.knowledgeGap }}</a-descriptions-item>
          <a-descriptions-item label="建议补充">补齐密码重置失败、业务工作台权限校验、转人工边界说明。</a-descriptions-item>
          <a-descriptions-item label="关联会话">{{ active.code }}</a-descriptions-item>
        </a-descriptions>
      </template>
    </a-modal>

    <a-modal v-model:open="resolveOpen" title="满意度闭环" @ok="submitResolution">
      <a-form layout="vertical">
        <a-form-item label="处理结果">
          <a-textarea v-model:value="resolution.result" :rows="3" placeholder="记录本次解决方式、是否转工单、是否补充知识库" />
        </a-form-item>
        <a-form-item label="客户满意度">
          <a-radio-group v-model:value="resolution.satisfaction">
            <a-radio value="满意">满意</a-radio>
            <a-radio value="一般">一般</a-radio>
            <a-radio value="不满意">不满意</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  CheckCircleOutlined,
  CommentOutlined,
  EditOutlined,
  ExportOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
  SwapOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { BusinessRecord, BusinessRecordStatus } from '@/api/business';
import { getBusinessRecordList, updateBusinessRecordStatus } from '@/api/business';

type QueueStatus = '待接管' | 'AI 处理中' | '人工处理中' | '已解决';
type PriorityFilter = '重点优先' | '高风险' | '普通' | '低优先级';
type MessageRole = 'customer' | 'ai' | 'agent' | 'system' | 'note';

interface ChatMessage {
  role: MessageRole;
  time: string;
  content: string;
}

interface ChatSession extends BusinessRecord {
  customerName: string;
  issueSummary: string;
  sessionStatus: QueueStatus;
  riskLevel: '高风险' | '普通' | '低优先级';
  waitingTime: string;
  lastMessage: string;
  unread: number;
  intent: string;
  source: string;
  aiDraft: string;
  aiConfidence: number;
  riskReason: string;
  suggestedActions: string[];
  knowledgeArticles: string[];
  knowledgeGap: string;
  messages: ChatMessage[];
}

const moduleName = 'service-live-chat';
const pageDescription = '管理会话大厅、机器人转人工、AI 回复草稿、知识缺口和满意度闭环。';
const queueStatusOptions = [
  { label: '待接', value: '待接管' },
  { label: 'AI', value: 'AI 处理中' },
  { label: '人工', value: '人工处理中' },
  { label: '解决', value: '已解决' },
];
const priorityOptions = ['重点优先', '高风险', '普通', '低优先级'].map((value) => ({ label: value, value }));

const loading = ref(false);
const records = ref<BusinessRecord[]>([]);
const active = ref<ChatSession>();
const detailOpen = ref(false);
const detailRecord = ref<BusinessRecord>();
const knowledgeOpen = ref(false);
const resolveOpen = ref(false);
const queueStatus = ref<QueueStatus>('待接管');
const priorityFilter = ref<PriorityFilter>('重点优先');
const replyText = ref('');
const showRiskAlert = ref(true);
const showKnowledgeGapAlert = ref(true);
const query = reactive({ keyword: '', status: undefined as BusinessRecordStatus | undefined });
const resolution = reactive({ result: '', satisfaction: '满意' });

const sessions = computed(() => records.value.map((record, index) => enrichSession(record, index)));
const filteredSessions = computed(() =>
  sessions.value.filter((item) => {
    const matchStatus = item.sessionStatus === queueStatus.value;
    const matchPriority = priorityFilter.value === '重点优先' || item.riskLevel === priorityFilter.value;
    return matchStatus && matchPriority;
  }),
);
const conversationTitle = computed(() =>
  active.value ? `${active.value.title} · ${active.value.customerName} · ${active.value.code} · ${active.value.intent}` : '',
);

async function loadData() {
  loading.value = true;
  const activeId = active.value?.id;
  try {
    const page = await getBusinessRecordList({ module: moduleName, keyword: query.keyword, status: query.status, pageSize: 20 });
    records.value = page.records;
    const nextSessions = records.value.map((record, index) => enrichSession(record, index));
    active.value = nextSessions.find((item) => item.id === activeId) ?? nextSessions[0];
    resetAlertVisibility();
  } finally {
    loading.value = false;
  }
}

function setActive(record: ChatSession) {
  active.value = record;
  replyText.value = '';
  resetAlertVisibility();
}

function selectRecord(record?: BusinessRecord) {
  if (!record) return;
  active.value = enrichSession(record, records.value.findIndex((item) => item.id === record.id));
  detailRecord.value = record;
  detailOpen.value = true;
  resetAlertVisibility();
}

function resetAlertVisibility() {
  showRiskAlert.value = true;
  showKnowledgeGapAlert.value = true;
}

async function takeOverActive() {
  if (!active.value) return;
  await changeStatus(active.value, '处理中');
  message.success('已接管会话，状态变为人工处理中');
}

async function changeStatus(record: BusinessRecord | undefined, status: BusinessRecordStatus) {
  if (!record) return;
  await updateBusinessRecordStatus(record.id, status);
  await loadData();
}

function insertDraft() {
  if (!active.value) return;
  replyText.value = active.value.aiDraft;
  message.success('AI 草稿已插入输入框，可编辑后发送');
}

function quoteKnowledge() {
  if (!active.value) return;
  const article = active.value.knowledgeArticles[0] ?? '密码重置标准处理流程';
  replyText.value = [replyText.value, `已引用知识库：《${article}》。`].filter(Boolean).join('\n');
  message.success('已引用知识库');
}

function saveInternalNote() {
  if (!replyText.value.trim()) {
    message.warning('请先输入内部备注内容');
    return;
  }
  message.success('内部备注已保存，不会发送给客户');
}

function markResolved() {
  if (!active.value) return;
  resolution.result = `已按《${active.value.knowledgeArticles[0]}》完成处理，并记录知识缺口。`;
  resolution.satisfaction = '满意';
  resolveOpen.value = true;
}

async function submitResolution() {
  if (!active.value) return;
  await changeStatus(active.value, '已完成');
  resolveOpen.value = false;
  message.success(`已记录处理结果，客户满意度：${resolution.satisfaction}`);
}

function assignActive() {
  message.success('已转派给密码重置技能组');
}

function batchAssign() {
  message.success('已按风险和技能组生成批量分配建议');
}

function exportReport() {
  message.success('会话报表已加入导出队列');
}

function openKnowledgeGap() {
  if (!active.value) return;
  knowledgeOpen.value = true;
}

function addKnowledge() {
  message.success('已创建知识库补充任务');
}

function enrichSession(record: BusinessRecord, index: number): ChatSession {
  const status = sessionStatus(record);
  const isPassword = record.title.includes('密码') || index === 0;
  const riskLevel = record.risk === '高风险' || record.priority === '紧急' ? '高风险' : index === 2 ? '低优先级' : '普通';
  const customerName = record.customer || ['蓝湖集团', '星河科技', '云杉零售'][index % 3];
  const intent = isPassword ? '密码重置' : index === 1 ? '机器人转人工' : '售后催促';
  const gap = isPassword ? '机器人未命中“业务工作台内密码重置”意图，现有知识只覆盖通用账号登录。' : '相似问题缺少可复用处理步骤，需要知识运营补齐。';

  return {
    ...record,
    customerName,
    issueSummary: record.description,
    sessionStatus: status,
    riskLevel,
    waitingTime: index === 0 ? '等待 8 分钟' : index === 1 ? '等待 3 分钟' : '等待 45 秒',
    lastMessage: index === 0 ? '客户：我已经试了三次，还是收不到重置入口。' : record.aiSuggestion,
    unread: index === 0 ? 3 : index === 1 ? 1 : 0,
    intent,
    source: index === 1 ? 'App 在线客服' : 'Web 在线客服',
    aiDraft: isPassword
      ? '您好，已看到您在业务工作台内无法完成密码重置。我会先为您核对账号权限和重置入口状态，如果系统侧存在异常，将同步创建工单并给出预计处理时间。'
      : record.aiSuggestion,
    aiConfidence: isPassword ? 82 : index === 1 ? 76 : 91,
    riskReason: riskLevel === '高风险' ? '高价值客户、多次追问、存在投诉倾向' : '常规咨询，可由 AI 辅助处理',
    suggestedActions: [
      riskLevel === '高风险' ? '建议立即人工接管高风险会话' : '建议继续由 AI 辅助坐席处理',
      isPassword ? '建议引用密码重置知识库' : '建议核对最近工单记录',
      record.status === '已完成' ? '建议记录满意度闭环' : '必要时创建后续工单',
    ],
    knowledgeArticles: isPassword ? ['密码重置标准处理流程', '账号权限校验与重置入口说明'] : ['在线客服转人工处理规范', '售后进度查询回复模板'],
    knowledgeGap: gap,
    messages: buildMessages(record, status, intent, gap),
  };
}

function buildMessages(record: BusinessRecord, status: ChatSession['sessionStatus'], intent: string, gap: string): ChatMessage[] {
  return [
    { role: 'customer', time: '09:18', content: record.description },
    { role: 'ai', time: '09:18', content: 'AI 已尝试识别意图，但当前知识库对该场景命中不足。' },
    { role: 'system', time: '09:19', content: `系统事件：机器人转人工，意图识别为「${intent}」。` },
    { role: 'agent', time: '09:20', content: status === '人工处理中' ? '已收到，我正在核对账号权限和处理进度。' : 'AI 建议坐席接管后核对会话信息。' },
    { role: 'note', time: '09:21', content: `内部备注：${gap}` },
  ];
}

function sessionStatus(record: BusinessRecord): ChatSession['sessionStatus'] {
  const map: Record<BusinessRecordStatus, ChatSession['sessionStatus']> = {
    待处理: '待接管',
    处理中: '人工处理中',
    待审核: 'AI 处理中',
    已完成: '已解决',
    已暂停: '待接管',
    已关闭: '已解决',
  };
  return map[record.status];
}

function roleText(role: MessageRole) {
  const map: Record<MessageRole, string> = {
    customer: '客户消息',
    ai: 'AI 自动回复',
    agent: '坐席回复',
    system: '系统事件',
    note: '内部备注',
  };
  return map[role];
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

function sessionStatusColor(status: ChatSession['sessionStatus']) {
  const map: Record<ChatSession['sessionStatus'], string> = {
    待接管: 'purple',
    'AI 处理中': 'blue',
    人工处理中: 'geekblue',
    已解决: 'green',
  };
  return map[status];
}

function riskColor(risk: ChatSession['riskLevel']) {
  const map: Record<ChatSession['riskLevel'], string> = {
    高风险: 'red',
    普通: 'orange',
    低优先级: 'green',
  };
  return map[risk];
}

function confidenceColor(confidence: number) {
  if (confidence >= 88) return 'green';
  if (confidence >= 75) return 'blue';
  return 'orange';
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.biz-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  min-width: 1180px;
  overflow: hidden;
  color: var(--app-text);
}

.biz-topbar,
.queue-panel,
.conversation-panel,
.context-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.biz-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex: none;
  padding: 12px 18px;
}

.biz-topbar p {
  margin: 0;
  color: var(--app-text-secondary);
  font-weight: 600;
  line-height: 1.7;
}

.muted-text,
p,
small {
  color: var(--app-text-secondary);
}

.chat-workspace {
  display: grid;
  grid-template-columns: 300px minmax(560px, 1fr) 360px;
  flex: 1;
  gap: 16px;
  align-items: stretch;
  min-height: 0;
}

.queue-panel,
.conversation-panel,
.context-card {
  min-width: 0;
  padding: 14px 16px;
}

.queue-panel,
.ai-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.queue-panel,
.conversation-panel,
.ai-panel {
  height: 100%;
}

.panel-title,
.conversation-head,
.reply-tools,
.session-card__head,
.session-card__foot,
.message-item__head,
.context-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.biz-page :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: 7px;
  font-weight: 500;
  line-height: 1;
}

.biz-page :deep(.ant-btn-sm) {
  height: 30px;
  padding: 0 10px;
}

.biz-page :deep(.ant-btn-primary) {
  color: #fff;
  background: linear-gradient(135deg, #4f7bff 0%, #7c4dff 100%);
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(79, 123, 255, 0.22);
}

.biz-page :deep(.ant-btn-default) {
  color: var(--app-text);
  background: var(--app-surface);
  border-color: var(--app-border);
}

.biz-page :deep(.ant-btn .anticon) {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
}

h1,
h2,
h3,
h4,
p {
  margin: 0;
}

h1 {
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 18px;
  line-height: 34px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h2 {
  font-size: 16px;
}

h3 {
  margin-top: 10px;
  font-size: 18px;
}

h4 {
  margin: 12px 0 8px;
  font-size: 14px;
}

.queue-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 104px;
  gap: 8px;
}

.queue-filters :deep(.ant-segmented-item-label) {
  padding: 0 8px;
}

.priority-select {
  width: 104px;
}

.priority-select :deep(.ant-select-selector),
.queue-panel :deep(.ant-input-affix-wrapper),
.queue-filters :deep(.ant-segmented) {
  border-radius: 7px;
}

.session-cards {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.session-card,
.knowledge-link {
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  cursor: pointer;
}

.session-card {
  display: block;
  padding: 10px 12px;
  margin-bottom: 8px;
}

.session-card p {
  display: -webkit-box;
  margin: 8px 0 10px;
  overflow: hidden;
  line-height: 1.5;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.session-card__head span {
  flex: none;
  color: var(--app-text-muted);
  font-size: 12px;
}

.session-card.active {
  border-color: var(--app-primary);
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.session-card--risk {
  background: rgba(239, 68, 68, 0.06);
}

.session-card__foot {
  align-items: flex-start;
}

.session-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.conversation-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.conversation-head {
  align-items: flex-start;
  flex: none;
  min-width: 0;
}

.conversation-title {
  flex: 1;
  min-width: 0;
}

.conversation-head > :deep(.ant-space) {
  flex: none;
}

.conversation-head__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.risk-alert {
  flex: none;
  border-radius: 8px;
}

.message-stream {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow: auto;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.025), rgba(15, 23, 42, 0.045)),
    var(--app-surface-muted);
  border-radius: 8px;
}

.message-item {
  display: flex;
  margin-bottom: 14px;
}

.message-item:last-child {
  margin-bottom: 0;
}

.message-item--customer {
  justify-content: flex-start;
}

.message-item--ai,
.message-item--agent {
  justify-content: flex-end;
}

.message-item--system,
.message-item--note {
  justify-content: center;
}

.message-item__bubble {
  width: fit-content;
  max-width: 68%;
  padding: 11px 13px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.message-item--customer .message-item__bubble {
  border-color: rgba(79, 123, 255, 0.32);
  border-top-left-radius: 4px;
}

.message-item--ai .message-item__bubble {
  background: rgba(79, 123, 255, 0.08);
  border-color: rgba(79, 123, 255, 0.18);
}

.message-item--agent .message-item__bubble {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.2);
  border-top-right-radius: 4px;
}

.message-item--system .message-item__bubble,
.message-item--note .message-item__bubble {
  max-width: 92%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.72);
  border-style: dashed;
  box-shadow: none;
}

.message-item--system .message-item__bubble {
  border-color: rgba(79, 123, 255, 0.26);
}

.message-item--note .message-item__bubble {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.28);
}

.message-item__head {
  margin-bottom: 7px;
}

.message-item__head strong {
  color: var(--app-text);
  font-size: 13px;
}

.message-item__head small {
  font-size: 12px;
}

.message-item__bubble p {
  line-height: 1.65;
}

.reply-box {
  flex: none;
  padding-top: 2px;
}

.reply-tools {
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.reply-tools :deep(.ant-space) {
  row-gap: 6px;
}

.reply-box :deep(.ant-input) {
  min-height: 78px;
  border-radius: 7px;
}

.ai-panel {
  overflow: auto;
}

.compact-list {
  padding-left: 18px;
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.ai-summary {
  display: grid;
  gap: 8px;
  margin: 12px 0;
}

.ai-summary span,
.draft-text {
  padding: 10px;
  color: var(--app-text-secondary);
  background: var(--app-surface-muted);
  border-radius: 8px;
}

.draft-text {
  margin-bottom: 10px;
  line-height: 1.7;
}

.knowledge-link {
  display: block;
  padding: 9px 10px;
  margin-bottom: 8px;
}

.gap-alert {
  margin-top: 12px;
  border-radius: 8px;
}

.context-actions {
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: 12px;
}

.context-actions :deep(.ant-btn) {
  min-width: 88px;
}

.context-actions :deep(.ant-btn-primary) {
  color: #fff;
  background: linear-gradient(135deg, #4f7bff 0%, #7c4dff 100%);
  border-color: transparent;
}

@media (max-width: 1360px) {
  .biz-page {
    min-width: 980px;
  }

  .chat-workspace {
    grid-template-columns: 1fr;
    overflow: auto;
  }
}
</style>
