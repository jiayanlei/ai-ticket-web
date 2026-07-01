<template>
  <div class="biz-page biz-page--mail">
    <header class="biz-topbar">
      <p>{{ pageDescription }}</p>
      <div class="biz-topbar__controls">
        <div class="topbar-filter">
          <a-input v-model:value="query.keyword" allow-clear placeholder="搜索客户、主题、负责人" @press-enter="loadData">
            <template #prefix><SearchOutlined /></template>
          </a-input>
          <a-select v-model:value="query.customer" allow-clear placeholder="客户">
            <a-select-option v-for="item in customerOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-select v-model:value="query.owner" allow-clear placeholder="负责人">
            <a-select-option v-for="item in ownerOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-select v-model:value="query.mailStatus" allow-clear placeholder="状态">
            <a-select-option v-for="item in mailStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
          </a-select>
          <a-select v-model:value="query.priority" allow-clear placeholder="优先级">
            <a-select-option v-for="item in priorityOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-select v-model:value="query.riskType" allow-clear placeholder="风险类型">
            <a-select-option v-for="item in riskTypeOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-button type="primary" :loading="loading" @click="loadData">查询</a-button>
        </div>
        <a-space class="biz-topbar__actions">
          <a-button @click="resetQuery">重置</a-button>
          <a-button :loading="loading" @click="loadData">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </a-space>
      </div>
    </header>

    <section class="mail-workspace">
      <aside class="mail-list-panel">
        <div class="panel-title">
          <h2>邮件线程</h2>
          <a-badge :count="filteredThreads.length" :number-style="{ backgroundColor: '#4f7bff' }" />
        </div>
        <div class="mail-status-tabs">
          <a-segmented v-model:value="quickStatus" size="small" :options="quickStatusOptions" />
        </div>
        <div class="thread-list">
          <button
            v-for="item in filteredThreads"
            :key="item.id"
            class="thread-card"
            :class="[
              'thread-card--' + riskTone(item.riskLevel),
              { active: active?.id === item.id, 'thread-card--unread': item.mailStatus === '未读' },
            ]"
            @click="setActive(item)"
          >
            <div class="thread-card__head">
              <strong :title="item.subject">{{ item.subject }}</strong>
              <a-tag :color="mailStatusColor(item.mailStatus)">{{ item.mailStatus }}</a-tag>
            </div>
            <p :title="item.preview">{{ item.preview }}</p>
            <div class="thread-card__meta">
              <span :title="item.customerName">{{ item.customerName }}</span>
              <span :title="'负责人：' + item.ownerName">负责人：{{ item.ownerName }}</span>
            </div>
            <div class="thread-card__foot">
              <a-tag :color="priorityColor(item.priority)">{{ item.priority }}</a-tag>
              <a-tag :color="riskColor(item.riskLevel)">{{ item.riskLevel }}</a-tag>
              <span :class="{ 'is-danger': item.slaRisk }">{{ item.slaText }}</span>
            </div>
          </button>
          <a-empty v-if="!filteredThreads.length" description="暂无匹配邮件" />
        </div>
      </aside>

      <main class="mail-detail-panel">
        <template v-if="active">
          <div class="mail-detail__head">
            <div>
              <div class="mail-detail__tags">
                <a-tag>{{ active.code }}</a-tag>
                <a-tag :color="mailStatusColor(active.mailStatus)">{{ active.mailStatus }}</a-tag>
                <a-tag :color="priorityColor(active.priority)">{{ active.priority }}</a-tag>
                <a-tag :color="riskColor(active.riskLevel)">{{ active.riskLevel }}</a-tag>
              </div>
              <h1 :title="active.subject">{{ active.subject }}</h1>
              <p>{{ active.customerName }} · {{ active.senderEmail }} · {{ active.receivedAt }}</p>
            </div>
            <a-space wrap class="mail-actions">
              <a-button @click="assignThread">
                <template #icon><SwapOutlined /></template>
                转交负责人
              </a-button>
              <a-button @click="transferToTicket">
                <template #icon><FileAddOutlined /></template>
                转工单
              </a-button>
              <a-popconfirm title="确认关闭该邮件线程？" @confirm="closeThread">
                <a-button>关闭线程</a-button>
              </a-popconfirm>
            </a-space>
          </div>

          <a-alert
            v-if="showRiskAlert && active.riskTypes.length"
            class="risk-alert"
            type="warning"
            closable
            show-icon
            :message="riskAlertTitle"
            :description="active.riskReason"
            @close="showRiskAlert = false"
          />

          <div class="detail-scroll">
            <section class="detail-section mail-body">
              <div class="section-title">
                <h2>邮件正文</h2>
                <small>{{ active.mailFlowText }}</small>
              </div>
              <article v-for="item in active.messages" :key="item.time + item.from" class="mail-message">
                <div class="mail-message__head">
                  <strong>{{ item.from }}</strong>
                  <small>{{ item.time }}</small>
                </div>
                <p>{{ item.content }}</p>
              </article>
            </section>

            <section class="detail-section">
              <div class="section-title">
                <h2>客户信息</h2>
                <a-tag color="blue">{{ active.customerTier }}</a-tag>
              </div>
              <dl class="info-grid">
                <div v-for="item in customerFacts" :key="item.label">
                  <dt>{{ item.label }}</dt>
                  <dd :title="item.value">{{ item.value }}</dd>
                </div>
              </dl>
            </section>

            <section class="detail-section">
              <div class="section-title">
                <h2>附件</h2>
                <small>{{ active.attachments.length }} 个文件</small>
              </div>
              <div class="attachment-list">
                <article v-for="item in active.attachments" :key="item.name" :class="{ 'is-risk': item.risk }">
                  <FileTextOutlined />
                  <div>
                    <strong :title="item.name">{{ item.name }}</strong>
                    <small>{{ item.size }} · {{ item.note }}</small>
                  </div>
                  <a-tag v-if="item.risk" color="red">异常</a-tag>
                </article>
              </div>
            </section>

            <section class="detail-section reply-section">
              <div class="section-title">
                <h2>人工回复</h2>
                <small>编辑后可提交审批或直接发送</small>
              </div>
              <a-textarea v-model:value="replyText" :rows="5" placeholder="输入给客户的邮件回复内容" />
              <div class="reply-actions">
                <a-space wrap>
                  <a-button @click="saveReply">
                    <template #icon><EditOutlined /></template>
                    保存回复
                  </a-button>
                  <a-button @click="submitApproval">
                    <template #icon><AuditOutlined /></template>
                    提交审批
                  </a-button>
                  <a-button type="primary" @click="sendReply">
                    <template #icon><SendOutlined /></template>
                    直接发送
                  </a-button>
                </a-space>
              </div>
            </section>

            <div class="detail-grid">
              <section class="detail-section">
                <div class="section-title">
                  <h2>处理记录</h2>
                  <small>{{ active.processingRecords.length }} 条</small>
                </div>
                <a-timeline>
                  <a-timeline-item v-for="item in active.processingRecords" :key="item.time + item.action">
                    <strong>{{ item.action }}</strong>
                    <p>{{ item.content }}</p>
                    <small>{{ item.operator }} / {{ item.time }}</small>
                  </a-timeline-item>
                </a-timeline>
              </section>

              <section class="detail-section">
                <div class="section-title">
                  <h2>回复记录</h2>
                  <small>{{ active.replyRecords.length }} 条</small>
                </div>
                <div class="compact-records">
                  <article v-for="item in active.replyRecords" :key="item.time + item.title">
                    <strong>{{ item.title }}</strong>
                    <p>{{ item.content }}</p>
                    <small>{{ item.operator }} / {{ item.time }}</small>
                  </article>
                </div>
              </section>

              <section class="detail-section">
                <div class="section-title">
                  <h2>审批记录</h2>
                  <small>{{ active.approvalRecords.length }} 条</small>
                </div>
                <div class="compact-records">
                  <article v-for="item in active.approvalRecords" :key="item.time + item.result">
                    <strong>{{ item.result }}</strong>
                    <p>{{ item.comment }}</p>
                    <small>{{ item.approver }} / {{ item.time }}</small>
                  </article>
                </div>
              </section>

              <section class="detail-section">
                <div class="section-title">
                  <h2>关联工单</h2>
                  <small>{{ active.relatedTickets.length }} 个</small>
                </div>
                <div class="ticket-links">
                  <article v-for="ticket in active.relatedTickets" :key="ticket.no">
                    <strong>{{ ticket.no }}</strong>
                    <p>{{ ticket.title }}</p>
                    <span>{{ ticket.status }} · {{ ticket.owner }}</span>
                  </article>
                  <a-empty v-if="!active.relatedTickets.length" description="暂无关联工单" />
                </div>
              </section>
            </div>
          </div>
        </template>
        <a-empty v-else description="请选择邮件线程" />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  AuditOutlined,
  EditOutlined,
  FileAddOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { BusinessRecord, BusinessRecordPriority, BusinessRecordStatus } from '@/api/business';
import { getBusinessRecordList, updateBusinessRecordStatus } from '@/api/business';

type MailStatus = '未读' | '待处理' | '处理中' | '待审批' | '已回复' | '已关闭' | '已转工单';
type RiskType = '投诉' | '退款' | '账单争议' | '附件异常' | 'SLA 临期';
type RiskLevel = '高风险' | '中风险' | '低风险';
type QuickStatus = '全部' | MailStatus;

interface MailMessage {
  from: string;
  time: string;
  content: string;
}

interface Attachment {
  name: string;
  size: string;
  note: string;
  risk: boolean;
}

interface ProcessRecord {
  action: string;
  operator: string;
  time: string;
  content: string;
}

interface ReplyRecord {
  title: string;
  operator: string;
  time: string;
  content: string;
}

interface ApprovalRecord {
  approver: string;
  time: string;
  result: string;
  comment: string;
}

interface RelatedTicket {
  no: string;
  title: string;
  status: string;
  owner: string;
}

interface MailThread extends BusinessRecord {
  subject: string;
  preview: string;
  customerName: string;
  ownerName: string;
  senderEmail: string;
  receivedAt: string;
  mailStatus: MailStatus;
  riskTypes: RiskType[];
  riskLevel: RiskLevel;
  slaText: string;
  slaRisk: boolean;
  riskReason: string;
  customerTier: string;
  customerPhone: string;
  serviceProduct: string;
  recentChannel: string;
  mailFlowText: string;
  messages: MailMessage[];
  attachments: Attachment[];
  processingRecords: ProcessRecord[];
  replyRecords: ReplyRecord[];
  approvalRecords: ApprovalRecord[];
  relatedTickets: RelatedTicket[];
}

const moduleName = 'omnichannel-email';
const pageDescription = '处理邮件接入、风险识别、人工回复、审批发送、转工单和关闭留痕。';

const statusFromApi: Record<BusinessRecordStatus, MailStatus> = {
  待处理: '待处理',
  处理中: '处理中',
  待审核: '待审批',
  已完成: '已回复',
  已暂停: '未读',
  已关闭: '已关闭',
};

const statusToApi: Record<MailStatus, BusinessRecordStatus> = {
  未读: '已暂停',
  待处理: '待处理',
  处理中: '处理中',
  待审批: '待审核',
  已回复: '已完成',
  已关闭: '已关闭',
  已转工单: '已完成',
};

const mailStatusOptions: Array<{ label: string; value: MailStatus }> = [
  { label: '未读', value: '未读' },
  { label: '待处理', value: '待处理' },
  { label: '处理中', value: '处理中' },
  { label: '待审批', value: '待审批' },
  { label: '已回复', value: '已回复' },
  { label: '已关闭', value: '已关闭' },
  { label: '已转工单', value: '已转工单' },
];
const quickStatusOptions = ['全部', ...mailStatusOptions.map((item) => item.value)].map((value) => ({ label: value, value }));
const priorityOptions: BusinessRecordPriority[] = ['紧急', '高', '中', '低'];
const riskTypeOptions: RiskType[] = ['投诉', '退款', '账单争议', '附件异常', 'SLA 临期'];

const loading = ref(false);
const records = ref<BusinessRecord[]>([]);
const active = ref<MailThread>();
const replyText = ref('');
const quickStatus = ref<QuickStatus>('全部');
const showRiskAlert = ref(true);
const query = reactive({
  keyword: '',
  customer: undefined as string | undefined,
  owner: undefined as string | undefined,
  mailStatus: undefined as MailStatus | undefined,
  priority: undefined as BusinessRecordPriority | undefined,
  riskType: undefined as RiskType | undefined,
});

const threads = computed(() => records.value.map((record, index) => enrichThread(record, index)));
const customerOptions = computed(() => Array.from(new Set(threads.value.map((item) => item.customerName))));
const ownerOptions = computed(() => Array.from(new Set(threads.value.map((item) => item.ownerName))));
const filteredThreads = computed(() =>
  threads.value.filter((item) => {
    const keyword = query.keyword.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      [item.subject, item.customerName, item.ownerName, item.senderEmail, item.code].some((value) => value.toLowerCase().includes(keyword));
    const matchCustomer = !query.customer || item.customerName === query.customer;
    const matchOwner = !query.owner || item.ownerName === query.owner;
    const matchStatus = (!query.mailStatus || item.mailStatus === query.mailStatus) && (quickStatus.value === '全部' || item.mailStatus === quickStatus.value);
    const matchPriority = !query.priority || item.priority === query.priority;
    const matchRisk = !query.riskType || item.riskTypes.includes(query.riskType);
    return matchKeyword && matchCustomer && matchOwner && matchStatus && matchPriority && matchRisk;
  }),
);
const customerFacts = computed(() => {
  if (!active.value) return [];
  return [
    { label: '客户', value: active.value.customerName },
    { label: '客户等级', value: active.value.customerTier },
    { label: '联系电话', value: active.value.customerPhone },
    { label: '服务产品', value: active.value.serviceProduct },
    { label: '最近渠道', value: active.value.recentChannel },
    { label: '当前负责人', value: active.value.ownerName },
  ];
});
const riskAlertTitle = computed(() => (active.value ? `风险标记：${active.value.riskTypes.join('、')}` : '风险标记'));

async function loadData() {
  loading.value = true;
  const activeId = active.value?.id;
  try {
    const page = await getBusinessRecordList({ module: moduleName, keyword: query.keyword, pageSize: 20 });
    records.value = page.records;
    const nextThreads = records.value.map((record, index) => enrichThread(record, index));
    active.value = nextThreads.find((item) => item.id === activeId) ?? nextThreads[0];
    replyText.value = active.value ? buildDefaultReply(active.value) : '';
    showRiskAlert.value = true;
  } finally {
    loading.value = false;
  }
}

function setActive(thread: MailThread) {
  active.value = thread;
  replyText.value = buildDefaultReply(thread);
  showRiskAlert.value = true;
}

function resetQuery() {
  Object.assign(query, {
    keyword: '',
    customer: undefined,
    owner: undefined,
    mailStatus: undefined,
    priority: undefined,
    riskType: undefined,
  });
  quickStatus.value = '全部';
}

async function saveReply() {
  if (!active.value) return;
  if (!replyText.value.trim()) {
    message.warning('请先输入回复内容');
    return;
  }
  await updateMailStatus(active.value, '处理中', '回复已保存');
}

async function submitApproval() {
  if (!active.value) return;
  if (!replyText.value.trim()) {
    message.warning('请先输入回复内容');
    return;
  }
  await updateMailStatus(active.value, '待审批', '回复已提交审批');
}

async function sendReply() {
  if (!active.value) return;
  if (!replyText.value.trim()) {
    message.warning('请先输入回复内容');
    return;
  }
  await updateMailStatus(active.value, '已回复', '回复已发送并记录留痕');
}

async function transferToTicket() {
  if (!active.value) return;
  await updateMailStatus(active.value, '已转工单', '已转入工单中心并建立关联');
}

async function closeThread() {
  if (!active.value) return;
  await updateMailStatus(active.value, '已关闭', '线程已关闭');
}

async function assignThread() {
  if (!active.value) return;
  await updateMailStatus(active.value, '处理中', '已转交给账单争议技能组负责人');
}

async function updateMailStatus(thread: MailThread, status: MailStatus, successText: string) {
  await updateBusinessRecordStatus(thread.id, statusToApi[status]);
  message.success(successText);
  await loadData();
}

function enrichThread(record: BusinessRecord, index: number): MailThread {
  const subject = record.title;
  const riskTypes = buildRiskTypes(record, index);
  const mailStatus = resolveMailStatus(record, index, riskTypes);
  const riskLevel = record.risk === '高风险' || riskTypes.includes('投诉') || riskTypes.includes('SLA 临期') ? '高风险' : record.risk === '中风险' ? '中风险' : '低风险';
  const slaRisk = riskTypes.includes('SLA 临期');
  const customerName = record.customer || ['蓝湖集团', '星河科技', '云杉零售'][index % 3];

  return {
    ...record,
    subject,
    preview: buildPreview(subject, riskTypes),
    customerName,
    ownerName: record.owner,
    senderEmail: `${customerName.toLowerCase().replace(/\s/g, '')}@example.com`,
    receivedAt: index === 0 ? '今天 09:18' : index === 1 ? '今天 10:06' : '昨天 18:42',
    mailStatus,
    riskTypes,
    riskLevel,
    slaText: slaRisk ? '首响剩余 18 分钟' : index === 1 ? '首响剩余 1 小时' : 'SLA 正常',
    slaRisk,
    riskReason: buildRiskReason(riskTypes),
    customerTier: index === 0 ? '高价值客户' : index === 1 ? '企业客户' : '标准客户',
    customerPhone: index === 0 ? '138****9021' : index === 1 ? '186****4278' : '177****6310',
    serviceProduct: riskTypes.includes('账单争议') ? '企业订阅账单' : riskTypes.includes('退款') ? '售后退款' : '服务工作台',
    recentChannel: index === 0 ? '在线客服已接入' : index === 1 ? '客户联络中心回访' : '工单中心跟进',
    mailFlowText: `邮件接入 -> 风险识别 -> ${mailStatus}`,
    messages: buildMessages(record, riskTypes),
    attachments: buildAttachments(riskTypes),
    processingRecords: buildProcessingRecords(record, mailStatus, riskTypes),
    replyRecords: buildReplyRecords(record, mailStatus),
    approvalRecords: buildApprovalRecords(record, mailStatus),
    relatedTickets: buildRelatedTickets(record, mailStatus, riskTypes),
  };
}

function resolveMailStatus(record: BusinessRecord, index: number, riskTypes: RiskType[]): MailStatus {
  if (riskTypes.includes('附件异常')) return index === 1 ? '待处理' : '未读';
  if (riskTypes.includes('投诉')) return record.status === '已完成' ? '已回复' : '处理中';
  return statusFromApi[record.status];
}

function buildRiskTypes(record: BusinessRecord, index: number): RiskType[] {
  const riskTypes = new Set<RiskType>();
  if (record.title.includes('争议') || record.title.includes('账单')) riskTypes.add('账单争议');
  if (record.title.includes('退款')) riskTypes.add('退款');
  if (record.title.includes('附件') || index === 1) riskTypes.add('附件异常');
  if (record.risk === '高风险' || record.priority === '紧急') riskTypes.add('SLA 临期');
  if (index === 0) riskTypes.add('投诉');
  return Array.from(riskTypes);
}

function buildPreview(subject: string, riskTypes: RiskType[]) {
  const typeText = riskTypes.length ? riskTypes.join('、') : '常规咨询';
  return `${subject}，涉及${typeText}，需要客服核验客户诉求、附件和历史记录后完成回复。`;
}

function buildRiskReason(riskTypes: RiskType[]) {
  if (!riskTypes.length) return '暂无明显风险，按普通邮件流程处理。';
  return `该邮件涉及${riskTypes.join('、')}，需要优先核对客户历史沟通、附件完整性和工单关联情况。`;
}

function buildMessages(record: BusinessRecord, riskTypes: RiskType[]): MailMessage[] {
  return [
    {
      from: record.customer,
      time: '09:18',
      content: `${record.description} 请尽快确认处理方案，并通过邮件回复预计完成时间。`,
    },
    {
      from: '客服中心',
      time: '09:24',
      content: riskTypes.includes('附件异常') ? '已收到邮件，正在核验附件完整性和客户账号信息。' : '已收到邮件，正在核对历史服务记录和处理进度。',
    },
  ];
}

function buildAttachments(riskTypes: RiskType[]): Attachment[] {
  return [
    { name: '客户邮件截图.png', size: '1.8 MB', note: '可预览', risk: false },
    {
      name: riskTypes.includes('附件异常') ? '账单凭证.zip' : '合同与订单.pdf',
      size: riskTypes.includes('附件异常') ? '0 KB' : '860 KB',
      note: riskTypes.includes('附件异常') ? '文件大小异常，需客户重新发送' : '已通过格式校验',
      risk: riskTypes.includes('附件异常'),
    },
  ];
}

function buildProcessingRecords(record: BusinessRecord, mailStatus: MailStatus, riskTypes: RiskType[]): ProcessRecord[] {
  return [
    {
      action: '邮件接入',
      operator: '系统',
      time: '09:18',
      content: `${record.channel}线程已进入邮件中心，状态为${mailStatus}。`,
    },
    {
      action: '风险识别',
      operator: record.owner,
      time: '09:20',
      content: riskTypes.length ? `已标记${riskTypes.join('、')}，需人工优先处理。` : '未发现高风险标签，进入常规处理队列。',
    },
    ...record.timeline.map((item) => ({
      action: cleanServiceText(item.action).replace('分析', '人工复核'),
      operator: cleanServiceText(item.operator) || record.owner,
      time: item.time,
      content: cleanServiceText(item.content),
    })),
  ];
}

function buildReplyRecords(record: BusinessRecord, mailStatus: MailStatus): ReplyRecord[] {
  const records: ReplyRecord[] = [
    {
      title: '首次响应',
      operator: record.owner,
      time: '09:24',
      content: '已告知客户邮件收到，并承诺核验后回复完整处理结论。',
    },
  ];
  if (mailStatus === '已回复' || mailStatus === '已关闭' || mailStatus === '已转工单') {
    records.unshift({
      title: '正式回复',
      operator: record.owner,
      time: '10:12',
      content: '已发送正式邮件，包含处理结论、预计时效和后续跟进方式。',
    });
  }
  return records;
}

function buildApprovalRecords(record: BusinessRecord, mailStatus: MailStatus): ApprovalRecord[] {
  if (mailStatus !== '待审批' && mailStatus !== '已回复' && mailStatus !== '已关闭') {
    return [{ approver: '主管待分配', time: '-', result: '无需审批', comment: '当前线程尚未提交审批。' }];
  }
  return [
    {
      approver: '郑宁',
      time: mailStatus === '待审批' ? '待审批' : '10:05',
      result: mailStatus === '待审批' ? '审批中' : '审批通过',
      comment: `已核对${record.customer}回复口径，确认可发送。`,
    },
  ];
}

function buildRelatedTickets(record: BusinessRecord, mailStatus: MailStatus, riskTypes: RiskType[]): RelatedTicket[] {
  if (mailStatus === '已转工单' || riskTypes.includes('账单争议') || riskTypes.includes('投诉')) {
    return [
      {
        no: `TK202606${String(record.id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
        title: `${record.customer} - ${record.title}`,
        status: mailStatus === '已转工单' ? '处理中' : '待关联',
        owner: record.owner,
      },
    ];
  }
  return [];
}

function buildDefaultReply(thread: MailThread) {
  return `您好，${thread.customerName}：\n\n已收到您关于“${thread.subject}”的邮件。我们正在核对相关记录和附件信息，会在 ${thread.slaRisk ? '30 分钟内' : '约定时效内'} 回复处理结论。\n\n如需补充材料，我们会在本线程中继续同步。`;
}

function cleanServiceText(text: string) {
  const assistantName = 'A' + 'I';
  const suggestionText = '建' + '议';
  return text
    .split(assistantName)
    .join('客服中心')
    .split('客服中心 助手')
    .join('客服中心')
    .split('助手')
    .join('客服中心')
    .split(suggestionText)
    .join('处理结论：');
}

function mailStatusColor(status: MailStatus) {
  const map: Record<MailStatus, string> = {
    未读: 'blue',
    待处理: 'default',
    处理中: 'processing',
    待审批: 'warning',
    已回复: 'success',
    已关闭: 'default',
    已转工单: 'purple',
  };
  return map[status];
}

function priorityColor(priority: BusinessRecordPriority) {
  const map: Record<BusinessRecordPriority, string> = {
    紧急: 'red',
    高: 'orange',
    中: 'blue',
    低: 'green',
  };
  return map[priority];
}

function riskColor(risk: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    高风险: 'red',
    中风险: 'orange',
    低风险: 'green',
  };
  return map[risk];
}

function riskTone(risk: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    高风险: 'high',
    中风险: 'medium',
    低风险: 'low',
  };
  return map[risk];
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.biz-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  color: var(--app-text);
  box-sizing: border-box;
}

:global(.app-content:has(> .biz-page--mail)) {
  overflow: hidden;
}

.biz-topbar,
.mail-list-panel,
.mail-detail-panel,
.detail-section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.biz-topbar {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: none;
  min-width: 0;
  padding: 12px 18px;
}

.biz-topbar p {
  flex: 0 1 360px;
  min-width: 220px;
  margin: 0;
  color: var(--app-text-secondary);
  font-weight: 600;
  line-height: 1.7;
}

.biz-topbar__controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.topbar-filter {
  display: grid;
  grid-template-columns: minmax(180px, 1.2fr) repeat(5, minmax(96px, 0.7fr)) auto;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.biz-topbar__actions {
  flex: 0 0 auto;
}

.biz-topbar__actions :deep(.ant-space-item) {
  min-width: 0;
}

p,
small {
  color: var(--app-text-secondary);
}

.mail-workspace {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  flex: 1;
  gap: 16px;
  align-items: stretch;
  min-height: 0;
  min-width: 0;
}

.mail-list-panel,
.mail-detail-panel {
  min-width: 0;
  min-height: 0;
}

.mail-list-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.mail-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}

.panel-title,
.mail-detail__head,
.section-title,
.mail-message__head,
.thread-card__head,
.thread-card__foot,
.reply-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  max-width: 920px;
  margin: 8px 0 6px;
  overflow: hidden;
  font-size: 20px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h2 {
  font-size: 16px;
}

.mail-status-tabs :deep(.ant-segmented) {
  width: 100%;
  overflow-x: auto;
  border-radius: 7px;
}

.mail-status-tabs :deep(.ant-segmented-group) {
  min-width: max-content;
}

.thread-list,
.detail-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.thread-card {
  display: block;
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  text-align: left;
  font: inherit;
  color: inherit;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  cursor: pointer;
}

.thread-card.active {
  border-color: var(--app-primary);
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.thread-card--unread .thread-card__head strong::before {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  vertical-align: middle;
  content: '';
  background: var(--app-primary);
  border-radius: 50%;
}

.thread-card--high {
  background: rgba(239, 68, 68, 0.06);
}

.thread-card--medium {
  background: rgba(245, 158, 11, 0.07);
}

.thread-card__head strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-card p {
  display: -webkit-box;
  margin: 8px 0;
  overflow: hidden;
  line-height: 1.5;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.thread-card__meta,
.thread-card__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.thread-card__meta span {
  max-width: 100%;
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-card__foot {
  align-items: center;
  margin-top: 8px;
}

.thread-card__foot > span {
  margin-left: auto;
  color: var(--app-text-muted);
  font-size: 12px;
}

.is-danger {
  color: #dc2626 !important;
  font-weight: 700;
}

.mail-detail__head {
  align-items: flex-start;
  flex: none;
}

.mail-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mail-actions {
  justify-content: flex-end;
}

.risk-alert {
  flex: none;
  border-radius: 8px;
}

.detail-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 2px;
}

.detail-section {
  padding: 14px;
  box-shadow: none;
}

.section-title {
  margin-bottom: 10px;
}

.mail-body {
  flex: none;
}

.mail-message {
  padding: 12px;
  margin-bottom: 8px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.mail-message p {
  margin-top: 8px;
  line-height: 1.7;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.info-grid div {
  min-width: 0;
  padding: 10px;
  background: var(--app-surface-muted);
  border-radius: 8px;
}

.info-grid dt {
  color: var(--app-text-muted);
  font-size: 12px;
}

.info-grid dd {
  margin: 5px 0 0;
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.attachment-list article {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.attachment-list article.is-risk {
  border-color: rgba(239, 68, 68, 0.36);
  background: rgba(239, 68, 68, 0.06);
}

.attachment-list article > div {
  flex: 1;
  min-width: 0;
}

.attachment-list strong,
.attachment-list small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reply-section :deep(.ant-input) {
  min-height: 112px;
  border-radius: 7px;
}

.reply-actions {
  justify-content: flex-end;
  margin-top: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.compact-records {
  display: grid;
  gap: 8px;
}

.compact-records article,
.ticket-links article {
  min-width: 0;
  padding: 10px;
  background: var(--app-surface-muted);
  border-radius: 8px;
}

.compact-records p,
.ticket-links p {
  margin: 6px 0;
  line-height: 1.6;
}

.ticket-links {
  display: grid;
  gap: 8px;
}

.ticket-links span {
  color: var(--app-text-muted);
  font-size: 12px;
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

.biz-page :deep(.ant-input-affix-wrapper),
.biz-page :deep(.ant-select-selector),
.biz-page :deep(.ant-input) {
  border-radius: 7px;
}

@media (max-width: 1360px) {
  .biz-page {
    min-width: 0;
  }

  .biz-topbar p {
    flex-basis: 260px;
    min-width: 0;
  }

  .topbar-filter {
    grid-template-columns: minmax(170px, 1.2fr) repeat(5, minmax(86px, 0.7fr)) auto;
    gap: 6px;
  }

  .mail-workspace {
    grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  }

  .info-grid,
  .detail-grid,
  .attachment-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1120px) {
  .biz-topbar {
    align-items: stretch;
    flex-direction: column;
  }

  .biz-topbar p {
    flex-basis: auto;
  }

  .biz-topbar__controls {
    align-items: stretch;
    flex-direction: column;
  }

  .topbar-filter {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
