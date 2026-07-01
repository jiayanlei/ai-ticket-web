<template>
  <div class="biz-page biz-page--call">
    <header class="biz-topbar">
      <div v-if="showOperationsAlert" class="ops-alert" :class="'ops-alert--' + operationsAlert.tone">
        <span>当前风险等级</span>
        <a-tag :color="operationsAlert.color">{{ operationsAlert.level }}</a-tag>
        <button class="ops-alert__close" type="button" aria-label="关闭当前风险提示" @click="showOperationsAlert = false">x</button>
        <strong>{{ operationsAlert.title }}</strong>
        <small>{{ operationsAlert.description }}</small>
      </div>
      <div class="biz-topbar__controls">
        <div class="topbar-filter">
          <a-input v-model:value="query.keyword" allow-clear :placeholder="'搜索' + pageTitle + '、客户、负责人'" @press-enter="loadData" />
          <a-select v-model:value="query.center" allow-clear placeholder="客户联络中心">
            <a-select-option v-for="item in centerOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-select v-model:value="query.customer" allow-clear placeholder="客户">
            <a-select-option v-for="item in customerOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-select v-model:value="query.owner" allow-clear placeholder="负责人">
            <a-select-option v-for="item in ownerOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-select v-model:value="query.status" allow-clear placeholder="状态" @change="loadData">
            <a-select-option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
          </a-select>
          <a-button type="primary" @click="loadData">查询</a-button>
        </div>
        <a-space class="biz-topbar__actions">
          <a-button @click="loadData">刷新</a-button>
          <a-button type="primary" @click="openQueueMonitor">{{ primaryAction }}</a-button>
        </a-space>
      </div>
    </header>

    <section class="call-shell">
      <aside class="queue-lanes">
        <div class="panel-title">
          <h2 title="优先级来电队列">优先级来电队列</h2>
          <small>按风险、VIP、等待时长排序</small>
        </div>
        <div class="queue-lanes__list">
          <article
            v-for="(item, index) in priorityRecords"
            :key="item.id"
            :class="['queue-card', 'queue-card--' + riskTone(item.risk), { active: active?.id === item.id }]"
            @click="active = item"
          >
            <div class="queue-card__head">
              <span :title="`${getCallMeta(item, index).queueName} / ${getCallMeta(item, index).phone}`">{{ getCallMeta(item, index).queueName }} / {{ getCallMeta(item, index).phone }}</span>
              <a-tag :color="riskColor(item.risk)">{{ item.risk }}</a-tag>
            </div>
            <strong :title="item.title">{{ item.title }}</strong>
            <div class="queue-card__tags">
              <a-tag v-for="tag in getCallMeta(item, index).customerTags" :key="tag">{{ tag }}</a-tag>
            </div>
            <small :title="`${getCallMeta(item, index).businessType} / 等待 ${getCallMeta(item, index).waitingSeconds} 秒`">{{ getCallMeta(item, index).businessType }} / 等待 {{ getCallMeta(item, index).waitingSeconds }} 秒</small>
            <div class="queue-card__actions">
              <a-button size="small" type="primary" @click.stop="active = item">接入</a-button>
              <a-button size="small" @click.stop="assignFirstAvailable(item)">分配</a-button>
              <a-button size="small" @click.stop="markAttention(item)">标记关注</a-button>
            </div>
          </article>
        </div>
      </aside>

      <main class="call-stage">
        <div class="call-control">
          <div class="call-control__head">
            <span>当前重点通话</span>
            <a-tag v-if="active" :color="riskColor(active.risk)">{{ active.risk }}</a-tag>
          </div>
          <h2 :title="active?.title ?? '暂无通话'">{{ active?.title ?? '暂无通话' }}</h2>
          <p>{{ active?.description }}</p>
          <div v-if="active" class="call-facts">
            <span>客户：{{ active.customer }}</span>
            <span>身份：{{ getActiveCallMeta().customerTags.join('、') }}</span>
            <span>状态：{{ getActiveCallMeta().callStatus }}</span>
            <span>等待：{{ getActiveCallMeta().waitingSeconds }} 秒</span>
            <span>坐席：{{ getActiveCallMeta().agentName }}</span>
            <span>业务：{{ getActiveCallMeta().businessType }}</span>
          </div>
          <div v-if="active" class="ai-advice">
            <strong>AI 判断</strong>
            <p>风险原因：{{ getActiveCallMeta().riskReason }}</p>
            <p>建议动作：{{ getActiveCallMeta().recommendedAction }}</p>
            <small>处理 SLA：{{ getActiveCallMeta().slaText }}</small>
          </div>
          <a-space wrap class="call-actions">
            <a-button type="primary" @click="handleCallAction('monitor')">监听</a-button>
            <a-button @click="handleCallAction('whisper')">耳语</a-button>
            <a-button class="call-actions__assign" type="primary" @click="handleCallAction('assign')">分配坐席</a-button>
            <a-button @click="handleCallAction('ticket')">转工单</a-button>
            <a-popconfirm title="强插会影响当前通话，确认继续？" @confirm="handleCallAction('barge')">
              <a-button danger>强插</a-button>
            </a-popconfirm>
            <a-popconfirm title="确认挂断当前通话并进入话后整理？" @confirm="handleCallAction('disconnect')">
              <a-button danger ghost>挂断</a-button>
            </a-popconfirm>
          </a-space>
        </div>
        <div class="ivr-map">
          <article v-for="node in processNodes" :key="node.label" :class="'ivr-map__item--' + node.status">
            <span>{{ node.label }}</span>
            <strong>{{ node.text }}</strong>
            <small>{{ node.detail }}</small>
          </article>
        </div>
      </main>

      <aside class="agent-wall">
        <section>
          <div class="panel-title">
            <h2 title="可调度坐席">可调度坐席</h2>
            <small>{{ availableAgents.length }} 人可接入</small>
          </div>
          <div class="agent-section__list">
            <article v-for="agent in availableAgents" :key="agent.name" class="agent-card">
              <strong :title="agent.name">{{ agent.name }}</strong>
              <small :title="`${agent.status}｜${agent.skill}｜负载 ${agent.load}`">{{ agent.status }}｜{{ agent.skill }}｜负载 {{ agent.load }}</small>
              <span :title="`今日接通 ${agent.connected} 通`">今日接通 {{ agent.connected }} 通</span>
              <a-button size="small" type="primary" @click="assignAgent(agent.name)">分配</a-button>
            </article>
          </div>
        </section>
        <section>
          <div class="panel-title">
            <h2 title="异常坐席">异常坐席</h2>
            <small>通话超长 / 质检异常</small>
          </div>
          <div class="agent-section__list">
            <article v-for="agent in abnormalAgents" :key="agent.name" class="agent-card agent-card--warn">
              <strong :title="agent.name">{{ agent.name }}</strong>
              <small :title="`${agent.status}｜${agent.skill}｜${agent.exception}`">{{ agent.status }}｜{{ agent.skill }}｜{{ agent.exception }}</small>
              <div class="agent-card__actions">
                <a-button size="small" @click="message.info('已进入 ' + agent.name + ' 的监听视图')">监听</a-button>
                <a-button size="small" @click="message.success('已提醒 ' + agent.name)">提醒</a-button>
                <a-button size="small" @click="message.success('已标记 ' + agent.name + ' 的异常状态')">标记</a-button>
              </div>
            </article>
          </div>
        </section>
      </aside>
    </section>
    <a-modal v-model:open="queueMonitorOpen" width="min(1420px, calc(100vw - 32px))" :footer="null" centered class="queue-monitor-modal">
      <template #title>
        <div class="queue-monitor__title">
          <strong>监控队列</strong>
          <small>实时查看各呼叫队列排队、等待、坐席和风险情况</small>
          <span>更新于 {{ queueUpdatedAt }}</span>
        </div>
      </template>

      <div class="queue-monitor">
        <div class="queue-monitor__metrics">
          <article v-for="item in queueOverview" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </div>

        <div class="queue-monitor__filters">
          <a-input v-model:value="queueFilter.keyword" allow-clear placeholder="搜索队列名称" />
          <a-select v-model:value="queueFilter.center" allow-clear placeholder="客户联络中心">
            <a-select-option v-for="item in queueCenterOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-select v-model:value="queueFilter.status" allow-clear placeholder="队列状态">
            <a-select-option value="正常">正常</a-select-option>
            <a-select-option value="拥堵">拥堵</a-select-option>
            <a-select-option value="高风险">高风险</a-select-option>
          </a-select>
          <a-select v-model:value="queueFilter.businessType" allow-clear placeholder="业务类型">
            <a-select-option v-for="item in queueBusinessOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
          <a-checkbox v-model:checked="queueFilter.onlyRisk">只看高风险</a-checkbox>
          <a-checkbox v-model:checked="queueFilter.onlyWaiting">只看有排队</a-checkbox>
          <a-button @click="resetQueueFilter">重置</a-button>
        </div>

        <div class="queue-monitor__body">
          <section class="queue-monitor__list">
            <article
              v-for="item in filteredMonitorQueues"
              :key="item.id"
              :class="['monitor-queue-card', 'monitor-queue-card--' + queueStatusTone(item.status), { active: selectedQueue?.id === item.id }]"
            >
              <div class="monitor-queue-card__head">
                <div>
                  <strong :title="item.queueName">{{ item.queueName }}</strong>
                  <small>{{ item.callCenterName }} / {{ item.businessType }}</small>
                </div>
                <a-tag :color="queueStatusColor(item.status)">{{ item.status }}</a-tag>
              </div>
              <p :title="item.riskReason">{{ item.riskReason }}</p>
              <div class="monitor-queue-card__facts">
                <span>排队 {{ item.waitingCount }} 人</span>
                <span>最长 {{ formatWaitTime(item.longestWaitSeconds) }}</span>
                <span>平均 {{ formatWaitTime(item.avgWaitSeconds) }}</span>
                <span>在线 {{ item.onlineAgents }} 人</span>
                <span>空闲 {{ item.idleAgents }} 人</span>
                <span>忙碌 {{ item.busyAgents }} 人</span>
                <span>接入 {{ item.todayIncoming }}</span>
                <span>处理 {{ item.todayHandled }}</span>
                <span>放弃 {{ item.todayAbandoned }}</span>
              </div>
              <div class="monitor-queue-card__actions">
                <a-button size="small" type="primary" @click="selectMonitorQueue(item)">查看详情</a-button>
                <a-button size="small" @click="remindQueue(item)">{{ remindedQueueIds.includes(item.id) ? '已提醒' : '提醒' }}</a-button>
                <a-button size="small" @click="dispatchQueue(item)">调度</a-button>
              </div>
            </article>
            <a-empty v-if="!filteredMonitorQueues.length" description="暂无符合条件的队列" />
          </section>

          <aside class="queue-monitor__detail">
            <div v-if="selectedQueue">
              <div class="panel-title">
                <h2 :title="selectedQueue.queueName">{{ selectedQueue.queueName }}</h2>
                <a-tag :color="queueStatusColor(selectedQueue.status)">{{ selectedQueue.status }}</a-tag>
              </div>
              <p>{{ selectedQueue.riskReason }}</p>
              <div class="queue-monitor__advice">
                <strong>建议动作</strong>
                <span>{{ selectedQueue.waitingCount > selectedQueue.idleAgents ? '优先分配空闲坐席，并提醒主管关注等待超时客户。' : '维持当前承接节奏，继续观察队列等待变化。' }}</span>
              </div>
              <div v-if="dispatchedQueueIds.includes(selectedQueue.id)" class="queue-monitor__dispatch">
                <strong>可调度坐席</strong>
                <span v-for="agent in availableAgents" :key="agent.name">{{ agent.name }} / {{ agent.skill }} / 负载 {{ agent.load }}</span>
              </div>
              <div class="queue-monitor__customers">
                <article v-for="customer in selectedQueue.waitingCustomers" :key="customer.id">
                  <div>
                    <strong>{{ customer.customerName }}</strong>
                    <small>{{ customer.phoneMasked }} / {{ customer.businessType }} / {{ customer.currentStatus }}</small>
                  </div>
                  <a-tag v-for="tag in customer.riskTags" :key="tag" :color="customerTagColor(tag)">{{ tag }}</a-tag>
                  <span>已等待 {{ formatWaitTime(customer.waitSeconds) }}</span>
                  <p>{{ customer.suggestedAction }}，建议坐席：{{ customer.suggestedAgent }}</p>
                </article>
              </div>
            </div>
            <a-empty v-else description="请选择队列查看详情" />
          </aside>
        </div>
      </div>
    </a-modal>

    <a-drawer v-model:open="detailOpen" width="520" :title="detailRecord?.title"><a-descriptions v-if="detailRecord" bordered :column="1" size="small"><a-descriptions-item label="编号">{{ detailRecord.code }}</a-descriptions-item><a-descriptions-item label="客户">{{ detailRecord.customer }}</a-descriptions-item><a-descriptions-item label="负责人">{{ detailRecord.owner }}</a-descriptions-item><a-descriptions-item label="状态"><a-tag :color="statusColor(detailRecord.status)">{{ detailRecord.status }}</a-tag></a-descriptions-item><a-descriptions-item label="AI 建议">{{ detailRecord.aiSuggestion }}</a-descriptions-item></a-descriptions><a-divider>闭环记录</a-divider><a-timeline v-if="detailRecord"><a-timeline-item v-for="item in detailRecord.timeline" :key="item.time + item.action"><strong>{{ item.action }}</strong><p>{{ item.content }}</p><small>{{ item.operator }} / {{ item.time }}</small></a-timeline-item></a-timeline></a-drawer><a-modal v-model:open="createOpen" :title="'新增' + pageTitle" @ok="submitCreate"><a-form layout="vertical"><a-form-item label="标题"><a-input v-model:value="formState.title" /></a-form-item><a-form-item label="客户"><a-input v-model:value="formState.customer" /></a-form-item><a-form-item label="负责人"><a-input v-model:value="formState.owner" /></a-form-item><a-form-item label="说明"><a-textarea v-model:value="formState.description" :rows="3" /></a-form-item></a-form></a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { BusinessRecord, BusinessRecordPayload, BusinessRecordStatus } from '@/api/business';
import { createBusinessRecord, getBusinessRecordList, updateBusinessRecordStatus } from '@/api/business';

const moduleName = 'service-calls';
const pageTitle = '客户联络中心';
const pageDescription = '运营实时呼叫队列、坐席状态、监听、耳语、强插、挂断、录音和质检闭环。';
const primaryAction = '监控队列';
const statusOptions = [
  { label: '待处理', value: '待处理' },
  { label: '处理中', value: '处理中' },
  { label: '待审核', value: '待审核' },
  { label: '已完成', value: '已完成' },
  { label: '已暂停', value: '已暂停' },
  { label: '已关闭', value: '已关闭' },
];
const loading = ref(false);
const records = ref<BusinessRecord[]>([]);
const active = ref<BusinessRecord>();
const detailOpen = ref(false);
const detailRecord = ref<BusinessRecord>();
const createOpen = ref(false);
const showOperationsAlert = ref(true);
const query = reactive({
  keyword: '',
  center: undefined as string | undefined,
  customer: undefined as string | undefined,
  owner: undefined as string | undefined,
  status: undefined as BusinessRecordStatus | undefined,
});
const formState = reactive<BusinessRecordPayload>({
  module: moduleName,
  title: '',
  owner: '陈沐阳',
  customer: '蓝湖集团',
  channel: pageTitle,
  status: '待处理',
  priority: '高',
  metric: '-',
  risk: '中风险',
  description: pageDescription,
  aiSuggestion: '客户联络中心已生成 AI 建议，请优先处理高风险记录。',
  tags: [pageTitle],
});
interface CallMeta {
  phone: string;
  queueName: string;
  waitingSeconds: number;
  agentName: string;
  callStatus: string;
  recordingStatus: string;
  qaScore: number;
  linkedTicketNo: string;
  customerTags: string[];
  businessType: string;
  riskReason: string;
  riskDuration: string;
  recommendedAction: string;
  slaText: string;
}
interface AgentState {
  name: string;
  status: string;
  skill: string;
  load: string;
  connected: number;
  exception?: string;
}
type QueueStatus = '正常' | '拥堵' | '高风险';
interface WaitingCustomer {
  id: string;
  customerName: string;
  phoneMasked: string;
  customerLevel: string;
  businessType: string;
  waitSeconds: number;
  riskTags: string[];
  currentStatus: string;
  suggestedAction: string;
  suggestedAgent: string;
}
interface MonitorQueue {
  id: string;
  queueName: string;
  callCenterName: string;
  businessType: string;
  waitingCount: number;
  longestWaitSeconds: number;
  avgWaitSeconds: number;
  onlineAgents: number;
  idleAgents: number;
  busyAgents: number;
  todayIncoming: number;
  todayHandled: number;
  todayAbandoned: number;
  status: QueueStatus;
  riskReason: string;
  waitingCustomers: WaitingCustomer[];
}
const callMetaMap = ref<Record<string, CallMeta>>({});
const agentStates: AgentState[] = [
  { name: '陈沐阳', status: '在线', skill: '技术支持', load: '32%', connected: 38 },
  { name: '刘薇', status: '空闲', skill: 'VIP 专线', load: '18%', connected: 24 },
  { name: '谢砚青', status: '在线', skill: '售后', load: '45%', connected: 31 },
  { name: '郑宁', status: '忙碌', skill: '售后', load: '91%', connected: 42, exception: '通话 12 分钟' },
  { name: '周启', status: '监听中', skill: '退款复核', load: '86%', connected: 29, exception: '质检异常' },
];
const centerOptions = ['华东客户联络中心', '华南客户联络中心', '华北客户联络中心'];
const queueMonitorOpen = ref(false);
const queueUpdatedAt = ref('');
const selectedQueue = ref<MonitorQueue>();
const remindedQueueIds = ref<string[]>([]);
const dispatchedQueueIds = ref<string[]>([]);
const queueFilter = reactive({
  keyword: '',
  center: undefined as string | undefined,
  status: undefined as QueueStatus | undefined,
  businessType: undefined as string | undefined,
  onlyRisk: false,
  onlyWaiting: false,
});
const monitorQueues = ref<MonitorQueue[]>([
  {
    id: 'q-vip',
    queueName: 'VIP 专线队列',
    callCenterName: '华东客户联络中心',
    businessType: 'VIP 专线',
    waitingCount: 8,
    longestWaitSeconds: 186,
    avgWaitSeconds: 92,
    onlineAgents: 6,
    idleAgents: 1,
    busyAgents: 5,
    todayIncoming: 146,
    todayHandled: 132,
    todayAbandoned: 5,
    status: '高风险',
    riskReason: 'VIP 客户等待超时，空闲坐席不足，建议立即分配主管坐席。',
    waitingCustomers: [
      { id: 'c-001', customerName: '蓝湖集团 / 林女士', phoneMasked: '138****0921', customerLevel: 'VIP', businessType: 'VIP 专线', waitSeconds: 186, riskTags: ['VIP', '等待超时'], currentStatus: '等待中', suggestedAction: '优先接入', suggestedAgent: '刘薇' },
      { id: 'c-002', customerName: '云岭科技 / 高先生', phoneMasked: '186****7348', customerLevel: 'VIP', businessType: '技术支持', waitSeconds: 124, riskTags: ['VIP', '技术故障'], currentStatus: '待升级', suggestedAction: '升级主管处理', suggestedAgent: '陈沐阳' },
    ],
  },
  {
    id: 'q-refund',
    queueName: '退款复核队列',
    callCenterName: '华南客户联络中心',
    businessType: '退款',
    waitingCount: 13,
    longestWaitSeconds: 142,
    avgWaitSeconds: 78,
    onlineAgents: 5,
    idleAgents: 0,
    busyAgents: 5,
    todayIncoming: 218,
    todayHandled: 197,
    todayAbandoned: 11,
    status: '高风险',
    riskReason: '退款风险客户集中进入队列，当前无空闲坐席，放弃量上升。',
    waitingCustomers: [
      { id: 'c-003', customerName: '星驰贸易 / 周先生', phoneMasked: '177****4186', customerLevel: '普通客户', businessType: '退款', waitSeconds: 142, riskTags: ['退款风险', '等待超时'], currentStatus: '等待中', suggestedAction: '分配空闲坐席', suggestedAgent: '周启' },
      { id: 'c-004', customerName: '北辰零售 / 赵女士', phoneMasked: '159****8302', customerLevel: '老客', businessType: '退款', waitSeconds: 96, riskTags: ['退款风险'], currentStatus: '已分配', suggestedAction: '提醒坐席接入', suggestedAgent: '谢砚青' },
    ],
  },
  {
    id: 'q-after-sale',
    queueName: '售后服务热线',
    callCenterName: '华北客户联络中心',
    businessType: '售后',
    waitingCount: 9,
    longestWaitSeconds: 88,
    avgWaitSeconds: 54,
    onlineAgents: 7,
    idleAgents: 1,
    busyAgents: 6,
    todayIncoming: 305,
    todayHandled: 286,
    todayAbandoned: 7,
    status: '拥堵',
    riskReason: '售后咨询量高于当前承接能力，建议临时调入一名通用坐席。',
    waitingCustomers: [
      { id: 'c-005', customerName: '晨风制造 / 孙先生', phoneMasked: '136****1128', customerLevel: '老客', businessType: '售后', waitSeconds: 88, riskTags: ['售后'], currentStatus: '等待中', suggestedAction: '分配空闲坐席', suggestedAgent: '谢砚青' },
    ],
  },
  {
    id: 'q-tech',
    queueName: '技术支持队列',
    callCenterName: '华东客户联络中心',
    businessType: '技术支持',
    waitingCount: 4,
    longestWaitSeconds: 52,
    avgWaitSeconds: 31,
    onlineAgents: 6,
    idleAgents: 2,
    busyAgents: 4,
    todayIncoming: 168,
    todayHandled: 159,
    todayAbandoned: 2,
    status: '正常',
    riskReason: '队列等待稳定，坐席承接能力充足。',
    waitingCustomers: [
      { id: 'c-006', customerName: '海川物流 / 马女士', phoneMasked: '188****4027', customerLevel: '普通客户', businessType: '技术支持', waitSeconds: 52, riskTags: ['技术故障'], currentStatus: '等待中', suggestedAction: '按序接入', suggestedAgent: '陈沐阳' },
    ],
  },
  {
    id: 'q-complaint',
    queueName: '投诉升级队列',
    callCenterName: '华南客户联络中心',
    businessType: '投诉',
    waitingCount: 5,
    longestWaitSeconds: 167,
    avgWaitSeconds: 105,
    onlineAgents: 3,
    idleAgents: 0,
    busyAgents: 3,
    todayIncoming: 64,
    todayHandled: 53,
    todayAbandoned: 6,
    status: '高风险',
    riskReason: '投诉客户等待过久且无人接入，建议主管立即介入。',
    waitingCustomers: [
      { id: 'c-007', customerName: '万象商业 / 王女士', phoneMasked: '139****6651', customerLevel: 'VIP', businessType: '投诉', waitSeconds: 167, riskTags: ['投诉风险', 'VIP', '等待超时'], currentStatus: '待升级', suggestedAction: '升级主管处理', suggestedAgent: '刘薇' },
    ],
  },
]);
const queueCenterOptions = computed(() => Array.from(new Set(monitorQueues.value.map((item) => item.callCenterName))));
const queueBusinessOptions = computed(() => Array.from(new Set(monitorQueues.value.map((item) => item.businessType))));
const filteredMonitorQueues = computed(() =>
  monitorQueues.value.filter((item) => {
    const keywordMatched = !queueFilter.keyword || item.queueName.includes(queueFilter.keyword.trim());
    return (
      keywordMatched &&
      (!queueFilter.center || item.callCenterName === queueFilter.center) &&
      (!queueFilter.status || item.status === queueFilter.status) &&
      (!queueFilter.businessType || item.businessType === queueFilter.businessType) &&
      (!queueFilter.onlyRisk || item.status === '高风险') &&
      (!queueFilter.onlyWaiting || item.waitingCount > 0)
    );
  }),
);
const queueOverview = computed(() => {
  const queues = monitorQueues.value;
  const waitingTotal = queues.reduce((sum, item) => sum + item.waitingCount, 0);
  const avgWait = queues.length ? Math.round(queues.reduce((sum, item) => sum + item.avgWaitSeconds, 0) / queues.length) : 0;
  return [
    { label: '当前排队总人数', value: waitingTotal },
    { label: '高风险队列', value: queues.filter((item) => item.status === '高风险').length },
    { label: '最长等待', value: formatWaitTime(Math.max(...queues.map((item) => item.longestWaitSeconds))) },
    { label: '平均等待', value: formatWaitTime(avgWait) },
    { label: '在线坐席', value: queues.reduce((sum, item) => sum + item.onlineAgents, 0) },
  ];
});
const customerOptions = computed(() => Array.from(new Set(records.value.map((item) => item.customer))));
const ownerOptions = computed(() => Array.from(new Set(records.value.map((item) => item.owner))));
const filteredRecords = computed(() =>
  records.value.filter((item) => {
    const meta = getCallMeta(item);
    return (!query.center || meta.queueName.includes(query.center.slice(0, 2))) && (!query.customer || item.customer === query.customer) && (!query.owner || item.owner === query.owner);
  }),
);
const priorityRecords = computed(() =>
  [...filteredRecords.value].sort((left, right) => {
    const leftMeta = getCallMeta(left);
    const rightMeta = getCallMeta(right);
    return riskWeight(right.risk) - riskWeight(left.risk) || vipWeight(rightMeta) - vipWeight(leftMeta) || rightMeta.waitingSeconds - leftMeta.waitingSeconds;
  }),
);
const riskRecords = computed(() => priorityRecords.value.filter((item) => item.risk.includes('高') || item.risk.includes('中') || item.priority === '紧急'));
const availableAgents = computed(() => agentStates.filter((item) => !item.exception && item.status !== '忙碌'));
const abnormalAgents = computed(() => agentStates.filter((item) => item.exception));
const operationsAlert = computed(() => {
  const firstRisk = riskRecords.value[0];
  const meta = firstRisk ? getCallMeta(firstRisk) : undefined;
  const emergency = riskRecords.value.some((item) => item.risk.includes('高') || getCallMeta(item).waitingSeconds >= 90);
  return {
    level: emergency ? '紧急' : riskRecords.value.length ? '预警' : '正常',
    color: emergency ? 'red' : riskRecords.value.length ? 'orange' : 'green',
    tone: emergency ? 'danger' : riskRecords.value.length ? 'warn' : 'normal',
    title: firstRisk ? `${firstRisk.title}，等待 ${meta?.waitingSeconds ?? 0} 秒` : '队列运行稳定',
    description: `当前存在 ${riskRecords.value.length} 通重点关注来电，${firstRisk ? '请优先处理最高优先级事件。' : '暂无超时和高风险来电。'}`,
  };
});
const processNodes = computed(() => {
  const meta = getActiveCallMeta();
  const hasTimeout = meta.waitingSeconds >= 90 || active.value?.risk.includes('高');
  return [
    { label: 'IVR 接入', status: 'done', text: '已完成', detail: '来电已进入队列' },
    { label: '身份校验', status: 'done', text: '已完成', detail: meta.customerTags.join('、') || '客户身份已确认' },
    { label: '意图识别', status: 'done', text: '已完成', detail: meta.businessType },
    { label: '坐席接通', status: hasTimeout ? 'error' : 'current', text: hasTimeout ? '异常' : '进行中', detail: hasTimeout ? '等待超时' : meta.callStatus },
    { label: '质检归档', status: 'todo', text: '未开始', detail: meta.recordingStatus },
  ];
});
async function loadData() {
  loading.value = true;
  try {
    const page = await getBusinessRecordList({ module: moduleName, keyword: query.keyword, status: query.status, pageSize: 20 });
    records.value = page.records;
    syncCallMeta(page.records);
    active.value = priorityRecords.value[0] ?? page.records[0];
    showOperationsAlert.value = true;
  } finally {
    loading.value = false;
  }
}
function openQueueMonitor() {
  queueUpdatedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  selectedQueue.value = filteredMonitorQueues.value.find((item) => item.status === '高风险') ?? filteredMonitorQueues.value[0] ?? monitorQueues.value[0];
  queueMonitorOpen.value = true;
}
function resetQueueFilter() {
  Object.assign(queueFilter, {
    keyword: '',
    center: undefined,
    status: undefined,
    businessType: undefined,
    onlyRisk: false,
    onlyWaiting: false,
  });
  selectedQueue.value = monitorQueues.value[0];
}
function selectMonitorQueue(queue: MonitorQueue) {
  selectedQueue.value = queue;
}
function remindQueue(queue: MonitorQueue) {
  if (!remindedQueueIds.value.includes(queue.id)) {
    remindedQueueIds.value.push(queue.id);
  }
  message.success(`已提醒主管关注 ${queue.queueName}`);
}
function dispatchQueue(queue: MonitorQueue) {
  selectedQueue.value = queue;
  if (!dispatchedQueueIds.value.includes(queue.id)) {
    dispatchedQueueIds.value.push(queue.id);
  }
  message.success(`已进入 ${queue.queueName} 的坐席调度处理`);
}
async function submitCreate() {
  if (!formState.title.trim()) {
    message.warning('请输入标题');
    return;
  }
  await createBusinessRecord(formState);
  message.success('记录已创建');
  createOpen.value = false;
  await loadData();
}
async function changeStatus(record: BusinessRecord | undefined, status: BusinessRecordStatus) {
  if (!record) return;
  await updateBusinessRecordStatus(record.id, status);
  message.success('状态已更新为' + status);
  await loadData();
}
function syncCallMeta(list: BusinessRecord[]) {
  list.forEach((item, index) => {
    if (callMetaMap.value[String(item.id)]) return;
    const waitingSeconds = [96, 64, 42, 118, 35, 73][index % 6];
    const businessType = ['退款咨询', '售后热线', '账号问题', '技术支持', '发票咨询', '物流进度'][index % 6];
    const isVip = index % 3 === 0 || item.title.includes('VIP');
    const riskReason = item.risk.includes('高') || waitingSeconds >= 90 ? 'VIP 客户排队超时、无人接入' : item.risk.includes('中') ? '客户情绪升高、退款关键词' : '常规排队等待';
    callMetaMap.value[String(item.id)] = {
      phone: ['138****0921', '186****7348', '177****4186'][index % 3],
      queueName: ['VIP队列', '技术支持队列', '售后队列', '华东客户联络中心'][index % 4],
      waitingSeconds,
      agentName: ['陈沐阳', '郑宁', '刘薇'][index % 3],
      callStatus: item.status === '已关闭' ? '话后整理' : '通话中',
      recordingStatus: item.status === '已关闭' ? '已归档' : '录音中',
      qaScore: item.risk.includes('高') ? 72 : 91,
      linkedTicketNo: item.status === '已关闭' ? 'TK202606070001' : '-',
      customerTags: [isVip ? 'VIP' : '老客', item.risk.includes('高') ? '投诉风险' : '普通咨询'],
      businessType,
      riskReason,
      riskDuration: waitingSeconds >= 90 ? `${waitingSeconds} 秒` : `${Math.max(1, Math.round(waitingSeconds / 30))} 分钟`,
      recommendedAction: item.risk.includes('高') || waitingSeconds >= 90 ? '优先分配主管坐席，并建立工单跟进' : '转人工复核，必要时开启耳语辅助',
      slaText: item.risk.includes('高') || waitingSeconds >= 90 ? '建议 30 秒内处理' : '建议 2 分钟内处理',
    };
  });
}
function getCallMeta(record: BusinessRecord, index = 0) {
  return (
    callMetaMap.value[String(record.id)] ?? {
      phone: '138****0000',
      queueName: `队列 ${index + 1}`,
      waitingSeconds: 0,
      agentName: record.owner,
      callStatus: record.status,
      recordingStatus: '未开始',
      qaScore: 0,
      linkedTicketNo: '-',
      customerTags: [],
      businessType: '待识别',
      riskReason: '暂无风险',
      riskDuration: '-',
      recommendedAction: '等待运营选择来电',
      slaText: '-',
    }
  );
}
function getActiveCallMeta() {
  return active.value ? getCallMeta(active.value) : getCallMeta({ id: 'empty', owner: '-', status: '待处理' } as BusinessRecord);
}
function riskWeight(risk: string) {
  if (risk.includes('高')) return 3;
  if (risk.includes('中')) return 2;
  if (risk.includes('低')) return 1;
  return 0;
}
function vipWeight(meta: CallMeta) {
  return meta.customerTags.includes('VIP') ? 1 : 0;
}
function riskColor(risk: string) {
  if (risk.includes('高')) return 'red';
  if (risk.includes('中')) return 'orange';
  return 'default';
}
function riskTone(risk: string) {
  if (risk.includes('高')) return 'high';
  if (risk.includes('中')) return 'middle';
  return 'low';
}
function queueStatusColor(status: QueueStatus) {
  if (status === '高风险') return 'red';
  if (status === '拥堵') return 'orange';
  return 'green';
}
function queueStatusTone(status: QueueStatus) {
  if (status === '高风险') return 'risk';
  if (status === '拥堵') return 'busy';
  return 'normal';
}
function customerTagColor(tag: string) {
  if (tag.includes('VIP') || tag.includes('超时') || tag.includes('投诉')) return 'red';
  if (tag.includes('退款')) return 'orange';
  return 'default';
}
function formatWaitTime(seconds: number) {
  if (seconds < 60) return `${seconds}秒`;
  return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
}
function assignFirstAvailable(record: BusinessRecord) {
  active.value = record;
  assignAgent(availableAgents.value[0]?.name ?? record.owner);
}
function assignAgent(agentName: string) {
  if (!active.value) {
    message.warning('请先选择一通来电');
    return;
  }
  const meta = getCallMeta(active.value);
  meta.agentName = agentName;
  meta.callStatus = '已分配坐席';
  message.success(`已分配给 ${agentName}`);
}
function markAttention(record: BusinessRecord) {
  active.value = record;
  message.success('已标记为重点关注');
}
async function handleCallAction(action: 'monitor' | 'whisper' | 'assign' | 'barge' | 'disconnect' | 'ticket') {
  if (!active.value) {
    message.warning('请先选择一通来电');
    return;
  }

  const meta = getCallMeta(active.value);

  if (action === 'monitor') {
    meta.callStatus = '主管监听中';
    await changeStatus(active.value, '处理中');
    message.success('已进入监听状态');
    return;
  }

  if (action === 'whisper') {
    meta.callStatus = '耳语辅助中';
    message.success('耳语辅助已开启');
    return;
  }

  if (action === 'assign') {
    assignAgent(availableAgents.value[0]?.name ?? active.value.owner);
    return;
  }

  if (action === 'barge') {
    meta.callStatus = '主管强插中';
    await changeStatus(active.value, '处理中');
    message.success('主管已强插当前通话');
    return;
  }

  if (action === 'disconnect') {
    meta.callStatus = '话后整理';
    meta.recordingStatus = '已归档';
    await changeStatus(active.value, '已关闭');
    message.success('通话已挂断，录音与质检记录已生成');
    return;
  }

  meta.linkedTicketNo = `TK${Date.now().toString().slice(-10)}`;
  message.success(`已生成关联工单 ${meta.linkedTicketNo}`);
}
function statusColor(status: BusinessRecordStatus) {
  const map: Record<BusinessRecordStatus, string> = { 待处理: 'default', 处理中: 'processing', 待审核: 'warning', 已完成: 'success', 已暂停: 'orange', 已关闭: 'default' };
  return map[status];
}
onMounted(loadData);
</script>

<style scoped lang="scss">
.biz-page { display: flex; flex-direction: column; gap: 16px; width: 100%; min-width: 0; height: 100%; min-height: 0; overflow: hidden; color: var(--app-text); }
.biz-topbar, section > aside, section > main, .call-stage { background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 8px; box-shadow: 0 10px 26px rgba(15,23,42,.06); }
.biz-topbar { display: grid; grid-template-columns: minmax(320px, 520px) minmax(0, 1fr); align-items: center; gap: 18px; padding: 14px 18px; }
.biz-topbar:not(:has(.ops-alert)) { grid-template-columns: minmax(0, 1fr); }
.ops-alert { display: grid; grid-template-columns: auto auto 1fr; align-items: center; gap: 8px; padding: 12px 14px; background: rgba(255, 181, 71, .12); border: 1px solid rgba(255, 181, 71, .36); border-radius: 8px; }
.ops-alert span, .ops-alert small { color: var(--app-text-secondary); }
.ops-alert strong { grid-column: 1 / -1; font-size: 16px; }
.ops-alert small { grid-column: 1 / -1; }
.ops-alert__close { justify-self: end; width: 24px; height: 24px; padding: 0; color: var(--app-text-muted); line-height: 22px; text-align: center; cursor: pointer; background: transparent; border: 0; border-radius: 6px; }
.ops-alert__close:hover { color: var(--app-text); background: rgba(15, 23, 42, .06); }
.ops-alert--danger { background: rgba(255, 77, 79, .1); border-color: rgba(255, 77, 79, .34); }
.ops-alert--normal { background: rgba(82, 196, 26, .1); border-color: rgba(82, 196, 26, .3); }
.biz-page p, .biz-page small { color: var(--app-text-secondary); }
.biz-topbar__controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 10px; flex: 1; min-width: 0; }
.topbar-filter { display: grid; grid-template-columns: minmax(180px, 1.4fr) repeat(4, minmax(110px, .8fr)) auto; gap: 10px; flex: 1; min-width: 0; }
.biz-topbar__actions { flex: 0 0 auto; }
.call-shell, .chat-shell, .mail-shell, .sms-shell, .inbox-shell, .agent-shell, .schedule-shell, .performance-shell, .quality-shell, .training-shell, .customer-shell, .journey-shell, .ai-agent-shell, .workflow-shell, .prompt-shell, .model-shell, .analytics-shell, .bi-shell, .cockpit-shell, .sla-shell, .risk-shell, .monitor-shell, .alert-shell, .permission-shell, .audit-shell, .settings-shell, .platform-shell, .ticket-shell { display: grid; gap: 16px; }
.call-shell { flex: 1 1 auto; min-height: 0; grid-template-columns: 300px minmax(0, 1fr) 300px; align-items: stretch; overflow: hidden; } .chat-shell { grid-template-columns: 280px minmax(0, 1fr) 320px; } .mail-shell { grid-template-columns: 320px minmax(0, 1fr) 300px; }
.sms-shell, .performance-shell, .training-shell, .journey-shell, .ai-agent-shell, .model-shell, .cockpit-shell, .sla-shell, .risk-shell, .monitor-shell, .audit-shell, .platform-shell, .ticket-shell { grid-template-columns: minmax(0, 1fr) 320px; }
.inbox-shell, .analytics-shell, .permission-shell, .settings-shell { grid-template-columns: 220px minmax(0, 1fr) 320px; } .quality-shell, .workflow-shell, .prompt-shell, .bi-shell, .alert-shell { grid-template-columns: 260px minmax(0, 1fr) 320px; } .agent-shell, .schedule-shell { grid-template-columns: minmax(0, 1fr) 300px; }
section > aside, section > main, .call-stage { min-width: 0; min-height: 0; padding: 16px; }
.queue-lanes article, .mail-list button, .session-list button, .inbox-shell main article, .alert-shell main article, .sla-shell main article, .model-shell main article, .app-grid article, .agent-card-grid article, .course-grid article, .status-wall article, .performance-shell main article, .ticket-shell aside button { display: block; width: 100%; padding: 12px; text-align: left; background: var(--app-surface-muted); border: 1px solid var(--app-border); border-radius: 8px; }
button { font: inherit; } .active { border-color: var(--app-primary) !important; box-shadow: inset 3px 0 0 var(--app-primary); }
.panel-title { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.panel-title h2 { min-width: 0; margin: 0; overflow: hidden; font-size: 18px; text-overflow: ellipsis; white-space: nowrap; }
.panel-title small { flex: 0 0 auto; }
.queue-lanes { display: flex; flex-direction: column; overflow: hidden; }
.queue-lanes__list { flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto; }
.queue-card { min-height: 134px; margin-bottom: 10px; }
.queue-card--high { border-color: rgba(255, 77, 79, .45) !important; }
.queue-card--middle { border-color: rgba(250, 173, 20, .5) !important; }
.queue-card__head, .call-control__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.queue-card__head span { min-width: 0; overflow: hidden; color: var(--app-text-secondary); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.queue-card strong, .agent-card strong { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-card strong { margin: 8px 0; line-height: 22px; }
.queue-card small, .agent-card small, .agent-card span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-card__tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.queue-card__actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.call-stage { display: flex; flex-direction: column; overflow-x: hidden; overflow-y: auto; }
.call-control { padding: 18px; background: linear-gradient(135deg, rgba(79,123,255,.14), rgba(0,229,255,.08)); border-radius: 8px; }
.call-control h2 { margin: 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.call-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 14px 0; }
.call-facts span, .ai-advice { padding: 9px 10px; background: rgba(255, 255, 255, .64); border: 1px solid rgba(79, 123, 255, .12); border-radius: 8px; }
.ai-advice { margin-bottom: 14px; }
.ai-advice p { margin: 6px 0; }
.call-actions :deep(.ant-btn-primary) { font-weight: 600; }
.call-actions__assign { min-width: 88px; }
.ivr-map, .campaign-grid, .status-wall, .shift-calendar, .course-grid, .agent-card-grid, .chart-matrix, .cockpit-grid, .health-grid, .app-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
.call-stage > .ivr-map { flex: 1 1 auto; align-content: start; min-height: 0; }
.ivr-map article, .campaign-grid article, .shift-calendar article, .workflow-canvas article, .chart-matrix article, .cockpit-grid article, .health-grid article, .customer-shell main article, .settings-shell main article { padding: 14px; background: var(--app-surface-muted); border: 1px solid var(--app-border); border-radius: 8px; }
.ivr-map article { display: flex; flex-direction: column; gap: 4px; min-height: 92px; }
.ivr-map__item--done { border-color: rgba(82, 196, 26, .45) !important; }
.ivr-map__item--current { border-color: rgba(79, 123, 255, .5) !important; box-shadow: inset 3px 0 0 var(--app-primary); }
.ivr-map__item--error { border-color: rgba(255, 77, 79, .48) !important; box-shadow: inset 3px 0 0 #ff4d4f; }
.ivr-map__item--todo { opacity: .72; }
.agent-wall span, .inbox-shell aside span, .permission-tree label, .settings-shell aside span, .customer-shell aside span, .training-shell aside span, .analytics-shell aside span, .alert-shell aside span { display: block; padding: 8px 10px; margin-bottom: 8px; background: var(--app-surface-muted); border-radius: 8px; }
.agent-wall { display: grid; align-content: start; gap: 14px; overflow-x: hidden; overflow-y: auto; }
.agent-wall section { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.agent-section__list { min-height: 0; overflow: visible; }
.agent-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 10px; min-height: 86px; padding: 10px; margin-bottom: 8px; background: var(--app-surface-muted); border: 1px solid var(--app-border); border-radius: 8px; }
.agent-card small, .agent-card span { grid-column: 1 / -1; margin: 0; padding: 0; background: transparent; }
.agent-card .ant-btn { grid-column: 2; grid-row: 1; }
.agent-card--warn { border-color: rgba(250, 173, 20, .45); }
.agent-card__actions { grid-column: 1 / -1; display: flex; gap: 6px; }
.queue-monitor-modal :deep(.ant-modal-body) { overflow: hidden; }
.queue-monitor__title { display: grid; gap: 2px; }
.queue-monitor__title strong { font-size: 18px; }
.queue-monitor__title small, .queue-monitor__title span { color: var(--app-text-secondary); font-size: 12px; font-weight: 400; }
.queue-monitor { display: flex; flex-direction: column; gap: 14px; min-width: 0; height: min(780px, calc(100vh - 120px)); min-height: min(620px, calc(100vh - 120px)); overflow: hidden; }
.queue-monitor__metrics { display: grid; flex: 0 0 auto; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.queue-monitor__metrics article { min-width: 0; padding: 12px; background: var(--app-surface-muted); border: 1px solid var(--app-border); border-radius: 8px; }
.queue-monitor__metrics span { display: block; overflow: hidden; color: var(--app-text-secondary); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.queue-monitor__metrics strong { display: block; margin-top: 4px; overflow: hidden; font-size: 20px; text-overflow: ellipsis; white-space: nowrap; }
.queue-monitor__filters { display: grid; flex: 0 0 auto; grid-template-columns: minmax(160px, 1fr) repeat(3, minmax(130px, .8fr)) auto auto auto; align-items: center; gap: 10px; padding: 12px; background: var(--app-surface-muted); border: 1px solid var(--app-border); border-radius: 8px; }
.queue-monitor__body { display: grid; flex: 1 1 auto; grid-template-columns: minmax(0, 1.55fr) minmax(320px, .85fr); gap: 14px; min-width: 0; min-height: 0; overflow: hidden; }
.queue-monitor__list, .queue-monitor__detail { min-width: 0; min-height: 0; max-height: 100%; }
.queue-monitor__list { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 10px; align-content: start; height: 100%; padding-right: 4px; overflow-x: hidden; overflow-y: auto; scrollbar-gutter: stable; }
.monitor-queue-card, .queue-monitor__detail { padding: 12px; background: var(--app-surface-muted); border: 1px solid var(--app-border); border-radius: 8px; }
.monitor-queue-card--risk { border-color: rgba(255, 77, 79, .48); }
.monitor-queue-card--busy { border-color: rgba(250, 173, 20, .5); }
.monitor-queue-card--normal { border-color: rgba(82, 196, 26, .36); }
.monitor-queue-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.monitor-queue-card__head div { min-width: 0; }
.monitor-queue-card__head strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.monitor-queue-card__head small { display: block; margin-top: 2px; }
.monitor-queue-card p, .queue-monitor__detail p { margin: 8px 0; }
.monitor-queue-card__facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.monitor-queue-card__facts span, .queue-monitor__advice, .queue-monitor__dispatch span { padding: 7px 8px; overflow: hidden; background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 8px; color: var(--app-text-secondary); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.monitor-queue-card__actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.queue-monitor__detail { align-self: stretch; position: sticky; top: 0; overflow: hidden; }
.queue-monitor__advice { display: grid; gap: 4px; margin-bottom: 10px; white-space: normal; }
.queue-monitor__advice strong, .queue-monitor__dispatch strong { color: var(--app-text); }
.queue-monitor__dispatch { display: grid; gap: 6px; margin-bottom: 10px; }
.queue-monitor__dispatch span { display: block; margin: 0; }
.queue-monitor__customers { display: grid; gap: 8px; }
.queue-monitor__customers article { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 10px; background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 8px; }
.queue-monitor__customers div { flex: 1 1 180px; min-width: 0; }
.queue-monitor__customers strong, .queue-monitor__customers small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-monitor__customers span { color: var(--app-text-secondary); }
.queue-monitor__customers p { flex: 1 0 100%; margin: 2px 0 0; }
.message-stream { min-height: 360px; padding: 12px; background: var(--app-surface-muted); border-radius: 8px; } .bubble { max-width: 72%; padding: 10px 12px; border-radius: 8px; background: var(--app-surface); } .bubble.agent, .bubble.ai { margin-left: auto; }
.attachment-row, .variable-row { display: flex; gap: 8px; flex-wrap: wrap; } .attachment-row span, .variable-row span { padding: 6px 10px; background: var(--app-surface-muted); border-radius: 8px; }
.demand-curve { display: flex; align-items: end; gap: 8px; padding: 16px; background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 8px; } .demand-curve div { width: 28px; background: var(--app-primary); border-radius: 6px 6px 0 0; }
.workflow-canvas { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: center; gap: 14px; } .workflow-canvas article { min-height: 120px; display: grid; place-items: center; border-color: rgba(79,123,255,.35); }
.big-kpi strong, .score { display: block; font-size: 54px; line-height: 1; } .risk-lanes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; } .risk-lanes article { padding: 14px; background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 8px; }
.health-grid .pulse, .chart-matrix article div { height: 8px; margin-top: 16px; background: linear-gradient(90deg, var(--app-primary), var(--app-accent)); border-radius: 999px; }
@media (max-width: 1360px) { .biz-topbar { grid-template-columns: 1fr; } .topbar-filter { grid-template-columns: repeat(3, minmax(0, 1fr)); } .call-shell, .chat-shell, .mail-shell, .sms-shell, .inbox-shell, .agent-shell, .schedule-shell, .performance-shell, .quality-shell, .training-shell, .customer-shell, .journey-shell, .ai-agent-shell, .workflow-shell, .prompt-shell, .model-shell, .analytics-shell, .bi-shell, .cockpit-shell, .sla-shell, .risk-shell, .monitor-shell, .alert-shell, .permission-shell, .audit-shell, .settings-shell, .platform-shell, .ticket-shell { grid-template-columns: 1fr; } }
@media (max-width: 980px) { .queue-monitor { height: min(720px, calc(100vh - 96px)); min-height: min(560px, calc(100vh - 96px)); } .queue-monitor__metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .queue-monitor__filters, .queue-monitor__body, .queue-monitor__list { grid-template-columns: 1fr; } .queue-monitor__detail { position: static; } .monitor-queue-card__facts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
