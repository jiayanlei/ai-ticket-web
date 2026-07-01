<template>
  <div class="sms-page">
    <header class="sms-topbar">
      <div class="sms-filter">
        <a-input v-model:value="query.keyword" allow-clear placeholder="搜索任务、客户、负责人、业务来源">
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select v-model:value="query.status" allow-clear placeholder="状态">
          <a-select-option v-for="item in statusOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.source" allow-clear placeholder="业务来源">
          <a-select-option v-for="item in sourceOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.owner" allow-clear placeholder="负责人">
          <a-select-option v-for="item in ownerOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
      </div>
      <a-space class="sms-actions">
        <a-button @click="resetQuery">重置</a-button>
        <a-button @click="refreshData">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
        <a-button type="primary" @click="openCreate">
          <template #icon><PlusOutlined /></template>
          创建任务
        </a-button>
      </a-space>
    </header>

    <section class="sms-workspace">
      <main class="board-panel">
        <div class="panel-title">
          <div>
            <h2>短信任务列表</h2>
            <small>{{ filteredTasks.length }} 个任务，点击行查看右侧详情</small>
          </div>
          <a-tag color="blue">{{ activeTask?.businessLink ?? '请选择任务' }}</a-tag>
        </div>

        <section class="task-table-section">
          <a-table
            size="small"
            row-key="id"
            :columns="taskColumns"
            :data-source="filteredTasks"
            :pagination="false"
            :row-class-name="rowClassName"
            :scroll="{ y: 720, x: 1500 }"
            @row="buildTableRow"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <div class="task-name">
                  <strong>{{ record.name }}</strong>
                  <small>{{ record.templateName }} / {{ record.sendTime }}</small>
                </div>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
              </template>
              <template v-if="column.key === 'deliveryRate'">
                <div class="delivery-cell">
                  <span>{{ record.deliveryRate }}%</span>
                  <a-progress :percent="record.deliveryRate" size="small" :show-info="false" :status="record.failedCount > 0 ? 'exception' : 'success'" />
                </div>
              </template>
              <template v-if="column.key === 'failedCount'">
                <span :class="{ danger: record.failedCount > 0 }">{{ record.failedCount }}</span>
              </template>
              <template v-if="column.key === 'unsubscribeRisk'">
                <a-tag :color="riskColor(record.unsubscribeRisk)">{{ record.unsubscribeRisk }}</a-tag>
              </template>
              <template v-if="column.key === 'time'">
                <div class="task-time">
                  <span>{{ record.createdAt }}</span>
                  <small>{{ record.sendTime }}</small>
                </div>
              </template>
              <template v-if="column.key === 'actions'">
                <a-space size="small" class="table-actions" @click.stop>
                  <a-button class="table-action" type="link" size="small" @click="setActive(record)">详情</a-button>
                  <a-button class="table-action" type="link" size="small" :disabled="!record.failedCount" @click="retryFailed(record)">重试</a-button>
                  <a-button class="table-action" type="link" size="small" @click="pauseTask(record)">暂停</a-button>
                  <a-button class="table-action" type="link" size="small" @click="linkTicket(record)">关联</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </section>

      </main>

      <aside class="detail-panel">
        <template v-if="activeTask">
          <div class="detail-head">
            <div>
              <a-tag>{{ activeTask.code }}</a-tag>
              <a-tag :color="statusColor(activeTask.status)">{{ activeTask.status }}</a-tag>
              <h2 :title="activeTask.name">{{ activeTask.name }}</h2>
              <p>{{ activeTask.source }} / {{ activeTask.owner }} / {{ activeTask.createdAt }}</p>
            </div>
          </div>

          <div class="detail-scroll">
            <section class="detail-section">
              <div class="section-title">
                <h2>模板预览</h2>
                <small>{{ activeTemplate?.type }}</small>
              </div>
              <div class="phone-preview">
                <p>{{ activeTemplate?.content }}</p>
              </div>
            </section>

            <section class="detail-section">
              <div class="section-title">
                <h2>发送进度</h2>
                <small>{{ activeTask.sentCount }}/{{ activeTask.targetCount }}</small>
              </div>
              <a-progress :percent="activeTask.progress" :status="activeTask.status === '失败' ? 'exception' : 'active'" />
              <div class="fact-grid">
                <span>对象：{{ activeTask.audience }}</span>
                <span>发送：{{ activeTask.sendTime }}</span>
                <span>送达：{{ activeTask.deliveredCount }}</span>
                <span>失败：{{ activeTask.failedCount }}</span>
              </div>
            </section>

            <section class="detail-section">
              <div class="section-title">
                <h2>合规提醒</h2>
                <a-tag :color="activeTask.compliance.needReview ? 'warning' : 'success'">
                  {{ activeTask.compliance.needReview ? '需审核' : '已通过' }}
                </a-tag>
              </div>
              <ul class="compliance-list">
                <li v-for="item in activeTask.compliance.rules" :key="item">{{ item }}</li>
              </ul>
            </section>
          </div>

          <div class="detail-actions">
            <a-button :disabled="!activeTask.failedCount" @click="retryFailed(activeTask)">批量重试</a-button>
            <a-button @click="transferManual(activeTask)">转人工</a-button>
            <a-button @click="linkTicket(activeTask)">关联工单</a-button>
            <a-button v-if="activeTask.compliance.needReview" type="primary" @click="approveTask(activeTask)">审核通过</a-button>
            <a-button v-else type="primary" @click="pauseTask(activeTask)">暂停任务</a-button>
          </div>
        </template>
        <a-empty v-else description="请选择短信任务" />
      </aside>
    </section>

    <a-modal v-model:open="createOpen" width="720px" title="创建短信任务" @ok="submitCreate">
      <a-form layout="vertical">
        <div class="create-grid">
          <a-form-item label="任务名称">
            <a-input v-model:value="formState.name" placeholder="例如：售后进度通知" />
          </a-form-item>
          <a-form-item label="短信模板">
            <a-select v-model:value="formState.templateId" placeholder="选择模板">
              <a-select-option v-for="item in templates" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="发送对象">
            <a-input v-model:value="formState.audience" placeholder="客户分组或手机号清单" />
          </a-form-item>
          <a-form-item label="关联业务场景">
            <a-select v-model:value="formState.source" placeholder="业务来源">
              <a-select-option v-for="item in sourceOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="发送时间">
            <a-input v-model:value="formState.sendTime" placeholder="立即发送 / 今天 18:00" />
          </a-form-item>
          <a-form-item label="负责人">
            <a-input v-model:value="formState.owner" placeholder="负责人" />
          </a-form-item>
        </div>
        <a-form-item label="备注">
          <a-textarea v-model:value="formState.remark" :rows="3" placeholder="补充任务背景、发送策略或审核说明" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';

type SmsStatus = '发送中' | '已完成' | '失败' | '待重试' | '需审核' | '已暂停';
type RiskLevel = '高' | '中' | '低';

interface SmsTemplate {
  id: string;
  name: string;
  type: string;
  scene: string;
  approved: boolean;
  content: string;
}

interface SmsTask {
  id: string;
  code: string;
  name: string;
  templateId: string;
  templateName: string;
  audience: string;
  source: string;
  businessLink: string;
  status: SmsStatus;
  deliveryRate: number;
  failRate: number;
  failedCount: number;
  unsubscribeRisk: RiskLevel;
  unsubscribeCount: number;
  clickCount: number;
  replyCount: number;
  owner: string;
  createdAt: string;
  sendTime: string;
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  progress: number;
  remark: string;
  failures: Array<{ reason: string; count: number; action: string }>;
  compliance: {
    needReview: boolean;
    rules: string[];
  };
  relatedRecords: Array<{ id: string; type: string; name: string; owner: string; status: string }>;
}

interface CreateFormState {
  name: string;
  templateId: string;
  audience: string;
  source: string;
  sendTime: string;
  owner: string;
  remark: string;
}

const templates: SmsTemplate[] = [
  {
    id: 'tpl-code',
    name: '验证码',
    type: '验证码',
    scene: '登录与身份确认',
    approved: true,
    content: '【AI Ticket】您的验证码为 482916，5 分钟内有效。如非本人操作，请忽略本短信。',
  },
  {
    id: 'tpl-ticket',
    name: '工单通知',
    type: '服务通知',
    scene: '工单状态变化',
    approved: true,
    content: '【AI Ticket】您的工单 {{ticketNo}} 已更新，当前进度：{{status}}，可在服务中心查看详情。',
  },
  {
    id: 'tpl-urge',
    name: '催办提醒',
    type: '服务通知',
    scene: '超时风险催办',
    approved: true,
    content: '【AI Ticket】您有一条待处理服务事项即将超时，请尽快处理或联系在线客服。',
  },
  {
    id: 'tpl-satisfaction',
    name: '满意度邀请',
    type: '满意度',
    scene: '服务完成回访',
    approved: true,
    content: '【AI Ticket】感谢使用本次服务，诚邀您对处理结果进行评价，回复 1-5 分即可。',
  },
  {
    id: 'tpl-after-sale',
    name: '售后进度',
    type: '售后通知',
    scene: '售后流程追踪',
    approved: true,
    content: '【AI Ticket】您的售后申请已进入 {{stage}}，预计 {{time}} 前完成处理。',
  },
  {
    id: 'tpl-marketing',
    name: '营销通知',
    type: '营销',
    scene: '客户运营触达',
    approved: false,
    content: '【AI Ticket】本月服务权益已更新，点击 {{link}} 查看专属方案。回复 TD 退订。',
  },
];

const statusOptions: SmsStatus[] = ['发送中', '已完成', '失败', '待重试', '需审核', '已暂停'];
const taskColumns: TableColumnsType<SmsTask> = [
  { title: '任务名称', dataIndex: 'name', key: 'name', width: 260, fixed: 'left' },
  { title: '发送对象', dataIndex: 'audience', key: 'audience', width: 210 },
  { title: '业务来源', dataIndex: 'source', key: 'source', width: 110 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '送达率', dataIndex: 'deliveryRate', key: 'deliveryRate', width: 150 },
  { title: '失败数', dataIndex: 'failedCount', key: 'failedCount', width: 90 },
  { title: '退订风险', dataIndex: 'unsubscribeRisk', key: 'unsubscribeRisk', width: 110 },
  { title: '创建/发送时间', key: 'time', width: 150 },
  { title: '操作', key: 'actions', width: 220, fixed: 'right' },
];

const tasks = ref<SmsTask[]>([
  {
    id: 'sms-001',
    code: 'SMS20260623001',
    name: '售后进度批量通知',
    templateId: 'tpl-after-sale',
    templateName: '售后进度',
    audience: '售后处理中客户 3,260 人',
    source: '工单',
    businessLink: '关联工单 128 条',
    status: '发送中',
    deliveryRate: 93,
    failRate: 2.8,
    failedCount: 91,
    unsubscribeRisk: '低',
    unsubscribeCount: 4,
    clickCount: 386,
    replyCount: 72,
    owner: '陈沐阳',
    createdAt: '06-23 09:20',
    sendTime: '立即发送',
    targetCount: 3260,
    sentCount: 2870,
    deliveredCount: 2671,
    progress: 88,
    remark: '售后状态变更后自动触达，失败号码进入重试队列。',
    failures: [
      { reason: '号码空号或停机', count: 36, action: '建议转人工核验客户资料' },
      { reason: '运营商临时拒收', count: 55, action: '可在 30 分钟后批量重试' },
    ],
    compliance: {
      needReview: false,
      rules: ['服务通知类模板已审核', '发送时间在允许窗口内', '未命中退订客户营销限制'],
    },
    relatedRecords: [
      { id: 'WO-9021', type: '工单', name: '售后进度跟进', owner: '郑宁', status: '处理中' },
      { id: 'CALL-3188', type: '呼叫', name: '售后回访记录', owner: '刘薇', status: '已完成' },
    ],
  },
  {
    id: 'sms-002',
    code: 'SMS20260623002',
    name: '满意度评价邀请',
    templateId: 'tpl-satisfaction',
    templateName: '满意度邀请',
    audience: '今日已关闭工单客户 1,180 人',
    source: '客服',
    businessLink: '关联会话 286 条',
    status: '已完成',
    deliveryRate: 97,
    failRate: 1.4,
    failedCount: 17,
    unsubscribeRisk: '低',
    unsubscribeCount: 2,
    clickCount: 0,
    replyCount: 431,
    owner: '刘薇',
    createdAt: '06-23 08:30',
    sendTime: '今天 10:00',
    targetCount: 1180,
    sentCount: 1180,
    deliveredCount: 1145,
    progress: 100,
    remark: '工单关闭后邀请客户回复评分，评价结果回写满意度分析。',
    failures: [{ reason: '客户号码格式错误', count: 17, action: '同步客户资料后重试' }],
    compliance: {
      needReview: false,
      rules: ['满意度邀请属于服务后触达', '不包含营销链接', '回复内容进入效果追踪'],
    },
    relatedRecords: [
      { id: 'TK-7162', type: '工单', name: '账单争议已关闭', owner: '谢砚青', status: '已完成' },
      { id: 'CHAT-2238', type: '会话', name: '在线客服服务评价', owner: '刘薇', status: '已完成' },
    ],
  },
  {
    id: 'sms-003',
    code: 'SMS20260623003',
    name: '权益更新营销触达',
    templateId: 'tpl-marketing',
    templateName: '营销通知',
    audience: '高价值沉默客户 860 人',
    source: '客户',
    businessLink: '关联客户分群 1 个',
    status: '需审核',
    deliveryRate: 0,
    failRate: 0,
    failedCount: 0,
    unsubscribeRisk: '高',
    unsubscribeCount: 0,
    clickCount: 0,
    replyCount: 0,
    owner: '谢砚青',
    createdAt: '06-23 11:05',
    sendTime: '今天 18:00',
    targetCount: 860,
    sentCount: 0,
    deliveredCount: 0,
    progress: 0,
    remark: '营销类短信需先完成内容和退订合规审核。',
    failures: [],
    compliance: {
      needReview: true,
      rules: ['营销短信必须人工审核', '内容已包含 TD 退订入口', '已排除历史退订客户 42 人', '需确认发送时间不晚于 20:00'],
    },
    relatedRecords: [{ id: 'CUS-G-08', type: '客户', name: '高价值沉默客户分群', owner: '谢砚青', status: '待触达' }],
  },
  {
    id: 'sms-004',
    code: 'SMS20260622018',
    name: '验证码异常重试',
    templateId: 'tpl-code',
    templateName: '验证码',
    audience: '登录失败用户 246 人',
    source: '系统',
    businessLink: '关联登录审计 246 条',
    status: '待重试',
    deliveryRate: 82,
    failRate: 14.6,
    failedCount: 36,
    unsubscribeRisk: '低',
    unsubscribeCount: 0,
    clickCount: 0,
    replyCount: 0,
    owner: '郑宁',
    createdAt: '06-22 21:40',
    sendTime: '系统触发',
    targetCount: 246,
    sentCount: 246,
    deliveredCount: 202,
    progress: 100,
    remark: '运营商夜间通道波动，保留失败号码用于白名单通道重试。',
    failures: [
      { reason: '通道限流', count: 28, action: '切换备用通道重试' },
      { reason: '频次超限', count: 8, action: '延迟 15 分钟后自动重试' },
    ],
    compliance: {
      needReview: false,
      rules: ['验证码属于安全通知', '单号码频控已开启', '失败重试不超过 3 次'],
    },
    relatedRecords: [{ id: 'AUD-4088', type: '审计', name: '登录失败安全记录', owner: '郑宁', status: '监控中' }],
  },
  {
    id: 'sms-005',
    code: 'SMS20260622012',
    name: '工单催办提醒',
    templateId: 'tpl-urge',
    templateName: '催办提醒',
    audience: 'SLA 临期客户 420 人',
    source: '工单',
    businessLink: '关联 SLA 预警 46 条',
    status: '已暂停',
    deliveryRate: 64,
    failRate: 7.1,
    failedCount: 30,
    unsubscribeRisk: '中',
    unsubscribeCount: 9,
    clickCount: 64,
    replyCount: 18,
    owner: '陈沐阳',
    createdAt: '06-22 17:10',
    sendTime: '今天 09:00',
    targetCount: 420,
    sentCount: 270,
    deliveredCount: 173,
    progress: 64,
    remark: '退订关键词出现增多，已暂停后续发送等待复核。',
    failures: [{ reason: '客户回复退订关键词', count: 9, action: '已加入营销退订名单，服务通知保留人工复核' }],
    compliance: {
      needReview: true,
      rules: ['识别到退订关键词 TD/退订', '暂停营销类二次触达', '需确认该任务是否仍属于服务通知'],
    },
    relatedRecords: [
      { id: 'SLA-6110', type: '工单', name: 'SLA 临期提醒', owner: '陈沐阳', status: '待复核' },
      { id: 'MAIL-9012', type: '邮件', name: '客户催办邮件', owner: '刘薇', status: '处理中' },
    ],
  },
  {
    id: 'sms-006',
    code: 'SMS20260622009',
    name: '工单状态变更通知',
    templateId: 'tpl-ticket',
    templateName: '工单通知',
    audience: '今日状态变更客户 1,540 人',
    source: '工单',
    businessLink: '关联工单 312 条',
    status: '已完成',
    deliveryRate: 98,
    failRate: 0.9,
    failedCount: 14,
    unsubscribeRisk: '低',
    unsubscribeCount: 1,
    clickCount: 218,
    replyCount: 34,
    owner: '郑宁',
    createdAt: '06-22 15:35',
    sendTime: '状态变更触发',
    targetCount: 1540,
    sentCount: 1540,
    deliveredCount: 1511,
    progress: 100,
    remark: '工单状态更新后自动通知客户，并回写触达记录。',
    failures: [{ reason: '运营商网关超时', count: 14, action: '已进入低优先级重试队列' }],
    compliance: {
      needReview: false,
      rules: ['服务通知类模板已审核', '仅触达关联工单客户', '发送频率符合客户触达规则'],
    },
    relatedRecords: [{ id: 'WO-7712', type: '工单', name: '工单状态变更批次', owner: '郑宁', status: '已完成' }],
  },
  {
    id: 'sms-007',
    code: 'SMS20260622006',
    name: '呼叫未接通补发提醒',
    templateId: 'tpl-ticket',
    templateName: '工单通知',
    audience: '呼叫未接通客户 690 人',
    source: '呼叫',
    businessLink: '关联呼叫记录 690 条',
    status: '发送中',
    deliveryRate: 76,
    failRate: 3.2,
    failedCount: 22,
    unsubscribeRisk: '低',
    unsubscribeCount: 0,
    clickCount: 82,
    replyCount: 19,
    owner: '刘薇',
    createdAt: '06-22 14:10',
    sendTime: '今天 14:30',
    targetCount: 690,
    sentCount: 560,
    deliveredCount: 524,
    progress: 81,
    remark: '呼叫未接通后补发短信，提醒客户查看服务进展。',
    failures: [{ reason: '用户关机', count: 22, action: '建议延迟重试或转人工回访' }],
    compliance: {
      needReview: false,
      rules: ['服务补充通知已审核', '未包含营销内容', '发送时间在允许窗口内'],
    },
    relatedRecords: [{ id: 'CALL-6209', type: '呼叫', name: '未接通客户补触达', owner: '刘薇', status: '跟进中' }],
  },
  {
    id: 'sms-008',
    code: 'SMS20260621018',
    name: '邮件处理结果通知',
    templateId: 'tpl-ticket',
    templateName: '工单通知',
    audience: '邮件线程客户 520 人',
    source: '邮件',
    businessLink: '关联邮件 520 封',
    status: '已完成',
    deliveryRate: 95,
    failRate: 2.1,
    failedCount: 11,
    unsubscribeRisk: '低',
    unsubscribeCount: 1,
    clickCount: 73,
    replyCount: 8,
    owner: '谢砚青',
    createdAt: '06-21 18:45',
    sendTime: '邮件关闭触发',
    targetCount: 520,
    sentCount: 520,
    deliveredCount: 494,
    progress: 100,
    remark: '邮件处理完成后同步短信通知，方便客户追溯处理结果。',
    failures: [{ reason: '号码归属地限制', count: 11, action: '按地区通道重试' }],
    compliance: {
      needReview: false,
      rules: ['服务通知类模板已审核', '仅通知邮件相关客户', '失败记录保留追溯'],
    },
    relatedRecords: [{ id: 'MAIL-5118', type: '邮件', name: '处理结果通知批次', owner: '谢砚青', status: '已完成' }],
  },
  {
    id: 'sms-009',
    code: 'SMS20260621011',
    name: '售后资料补充提醒',
    templateId: 'tpl-urge',
    templateName: '催办提醒',
    audience: '资料缺失客户 310 人',
    source: '客服',
    businessLink: '关联会话 188 条',
    status: '待重试',
    deliveryRate: 88,
    failRate: 5.8,
    failedCount: 18,
    unsubscribeRisk: '中',
    unsubscribeCount: 5,
    clickCount: 41,
    replyCount: 26,
    owner: '陈沐阳',
    createdAt: '06-21 16:05',
    sendTime: '今天 16:30',
    targetCount: 310,
    sentCount: 310,
    deliveredCount: 273,
    progress: 100,
    remark: '提醒客户补充售后资料，退订回复需要人工确认通知性质。',
    failures: [{ reason: '退订关键词命中', count: 5, action: '已暂停营销触达，服务通知待复核' }],
    compliance: {
      needReview: true,
      rules: ['识别到退订关键词', '需确认补充资料提醒属于服务必要通知', '营销类短信不再触达退订客户'],
    },
    relatedRecords: [{ id: 'CHAT-9018', type: '会话', name: '售后资料补充提醒', owner: '陈沐阳', status: '待复核' }],
  },
  {
    id: 'sms-010',
    code: 'SMS20260621005',
    name: '服务预约确认通知',
    templateId: 'tpl-after-sale',
    templateName: '售后进度',
    audience: '预约上门客户 760 人',
    source: '客户',
    businessLink: '关联客户预约 760 条',
    status: '已完成',
    deliveryRate: 99,
    failRate: 0.5,
    failedCount: 4,
    unsubscribeRisk: '低',
    unsubscribeCount: 0,
    clickCount: 126,
    replyCount: 52,
    owner: '郑宁',
    createdAt: '06-21 10:20',
    sendTime: '预约确认触发',
    targetCount: 760,
    sentCount: 760,
    deliveredCount: 752,
    progress: 100,
    remark: '确认上门服务预约时间，客户回复同步到预约记录。',
    failures: [{ reason: '号码格式错误', count: 4, action: '同步客户资料后重试' }],
    compliance: {
      needReview: false,
      rules: ['服务预约通知已审核', '客户主动预约后触达', '回复内容同步预约记录'],
    },
    relatedRecords: [{ id: 'CUS-3318', type: '客户', name: '服务预约确认', owner: '郑宁', status: '已完成' }],
  },
]);

const activeTask = ref<SmsTask>(tasks.value[0]);
const createOpen = ref(false);
const query = reactive({
  keyword: '',
  status: undefined as SmsStatus | undefined,
  source: undefined as string | undefined,
  owner: undefined as string | undefined,
});
const formState = reactive<CreateFormState>({
  name: '',
  templateId: 'tpl-ticket',
  audience: '',
  source: '工单',
  sendTime: '立即发送',
  owner: '陈沐阳',
  remark: '',
});

const sourceOptions = computed(() => Array.from(new Set(tasks.value.map((item) => item.source))));
const ownerOptions = computed(() => Array.from(new Set(tasks.value.map((item) => item.owner))));
const activeTemplate = computed(() => templates.find((item) => item.id === activeTask.value?.templateId));
const filteredTasks = computed(() =>
  tasks.value.filter((task) => {
    const keyword = query.keyword.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      [task.name, task.audience, task.source, task.owner, task.code, task.businessLink].some((value) => value.toLowerCase().includes(keyword));
    const matchStatus = !query.status || task.status === query.status;
    const matchSource = !query.source || task.source === query.source;
    const matchOwner = !query.owner || task.owner === query.owner;
    return matchKeyword && matchStatus && matchSource && matchOwner;
  }),
);
function setActive(task: SmsTask) {
  activeTask.value = task;
}

function buildTableRow(record: SmsTask) {
  return {
    onClick: () => setActive(record),
  };
}

function rowClassName(record: SmsTask) {
  return activeTask.value?.id === record.id ? 'sms-table-row--active' : '';
}

function resetQuery() {
  Object.assign(query, {
    keyword: '',
    status: undefined,
    source: undefined,
    owner: undefined,
  });
}

function refreshData() {
  message.success('短信任务已刷新');
}

function openCreate() {
  Object.assign(formState, {
    name: '',
    templateId: 'tpl-ticket',
    audience: '',
    source: '工单',
    sendTime: '立即发送',
    owner: '陈沐阳',
    remark: '',
  });
  createOpen.value = true;
}

function submitCreate() {
  if (!formState.name.trim() || !formState.audience.trim()) {
    message.warning('请输入任务名称和发送对象');
    return;
  }

  const template = templates.find((item) => item.id === formState.templateId) ?? templates[0];
  const isMarketing = template.type === '营销';
  const task: SmsTask = {
    id: `sms-${Date.now()}`,
    code: `SMS${Date.now().toString().slice(-11)}`,
    name: formState.name,
    templateId: template.id,
    templateName: template.name,
    audience: formState.audience,
    source: formState.source,
    businessLink: `关联${formState.source}记录待选择`,
    status: isMarketing ? '需审核' : '发送中',
    deliveryRate: 0,
    failRate: 0,
    failedCount: 0,
    unsubscribeRisk: isMarketing ? '高' : '低',
    unsubscribeCount: 0,
    clickCount: 0,
    replyCount: 0,
    owner: formState.owner,
    createdAt: '刚刚',
    sendTime: formState.sendTime,
    targetCount: 0,
    sentCount: 0,
    deliveredCount: 0,
    progress: 0,
    remark: formState.remark,
    failures: [],
    compliance: {
      needReview: isMarketing || !template.approved,
      rules: isMarketing ? ['营销短信需人工审核', '必须包含退订入口', '客户退订后不再发送营销类短信'] : ['模板已审核', '发送对象待合规校验', '发送后自动追踪失败和回复'],
    },
    relatedRecords: [{ id: 'NEW', type: formState.source, name: '待关联业务记录', owner: formState.owner, status: '待选择' }],
  };

  tasks.value.unshift(task);
  activeTask.value = task;
  createOpen.value = false;
  message.success('短信任务已创建');
}

function retryFailed(task: SmsTask) {
  updateTask(task.id, {
    status: '发送中',
    failedCount: Math.max(0, task.failedCount - Math.ceil(task.failedCount * 0.6)),
    progress: Math.min(100, task.progress + 8),
  });
  message.success('已提交失败短信批量重试');
}

function transferManual(task: SmsTask) {
  updateTask(task.id, { status: '已暂停' });
  message.success(`${task.name} 已转人工复核`);
}

function linkTicket(task: SmsTask) {
  const exists = task.relatedRecords.some((item) => item.id === 'TK-AUTO');
  if (exists) {
    message.info('该任务已关联工单');
    return;
  }
  updateTask(task.id, {
    relatedRecords: [{ id: 'TK-AUTO', type: '工单', name: '短信失败跟进', owner: task.owner, status: '待处理' }, ...task.relatedRecords],
  });
  message.success('已关联工单用于追溯处理');
}

function approveTask(task: SmsTask) {
  updateTask(task.id, {
    status: '发送中',
    compliance: {
      needReview: false,
      rules: ['人工审核已通过', '已排除退订客户', '发送后继续监控回复和点击效果'],
    },
  });
  message.success('审核已通过，任务进入发送队列');
}

function pauseTask(task: SmsTask) {
  updateTask(task.id, { status: '已暂停' });
  message.success('任务已暂停');
}

function updateTask(id: string, patch: Partial<SmsTask>) {
  tasks.value = tasks.value.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const nextActive = tasks.value.find((item) => item.id === id);
  if (nextActive) {
    activeTask.value = nextActive;
  }
}

function statusColor(status: SmsStatus) {
  const map: Record<SmsStatus, string> = {
    发送中: 'processing',
    已完成: 'success',
    失败: 'error',
    待重试: 'orange',
    需审核: 'warning',
    已暂停: 'default',
  };
  return map[status];
}

function riskColor(risk: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    高: 'red',
    中: 'orange',
    低: 'green',
  };
  return map[risk];
}

</script>

<style scoped lang="scss">
.sms-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 1180px;
  height: calc(100vh - 176px);
  min-height: 720px;
  color: var(--app-text);
}

.sms-topbar,
.board-panel,
.detail-panel {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.sms-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
}

.sms-filter {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 150px 150px 150px;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.sms-actions {
  flex: 0 0 auto;
}

.panel-title small,
.detail-head p,
.section-title small,
.fact-grid,
.task-time small {
  color: var(--app-text-secondary);
}

.sms-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 14px;
  flex: 1;
  min-height: 0;
}

.board-panel,
.detail-panel {
  min-width: 0;
  min-height: 0;
  padding: 14px;
}

.detail-panel {
  display: flex;
  flex-direction: column;
}

.board-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  overflow: hidden;
}

.panel-title,
.section-title,
.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.panel-title h2,
.section-title h2,
.detail-head h2 {
  margin: 0;
  font-size: 16px;
}

.panel-title {
  margin-bottom: 12px;
}

.detail-scroll {
  min-height: 0;
  overflow: auto;
}

.task-name strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  font-size: 12px;
}

.fact-grid span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-table-section {
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.task-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.task-name small {
  color: var(--app-text-muted);
}

.delivery-cell {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.delivery-cell span {
  font-weight: 600;
}

.task-time {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-time span,
.task-time small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-actions {
  flex-wrap: nowrap;
}

.table-action {
  min-width: 34px;
  padding: 0 2px;
}

.detail-panel {
  padding-bottom: 0;
  overflow: hidden;
}

.detail-head {
  align-items: flex-start;
  margin-bottom: 12px;
}

.detail-head h2 {
  margin-top: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-head p {
  margin: 6px 0 0;
}

.detail-scroll {
  flex: 1;
  padding-right: 4px;
}

.detail-section {
  padding: 12px 0;
  border-top: 1px solid var(--app-border);
}

.phone-preview {
  padding: 16px;
  color: #1f2937;
  background: linear-gradient(180deg, #f8fafc, #eef4ff);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
}

.phone-preview p {
  margin: 0;
  line-height: 1.8;
}

.fact-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
}

.compliance-list {
  padding-left: 18px;
  margin: 8px 0 0;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.detail-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 0 14px;
  background: var(--app-surface);
  border-top: 1px solid var(--app-border);
}

.danger {
  color: var(--app-danger);
  font-weight: 700;
}

.warning {
  color: var(--app-warning);
  font-weight: 700;
}

.create-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

:deep(.ant-table-wrapper),
:deep(.ant-spin-nested-loading),
:deep(.ant-spin-container),
:deep(.ant-table),
:deep(.ant-table-container) {
  height: 100%;
}

:deep(.ant-table-row) {
  cursor: pointer;
}

:deep(.sms-table-row--active > td) {
  background: rgba(79, 123, 255, 0.08) !important;
}

:deep(.ant-table-thead > tr > th) {
  white-space: nowrap;
}

:deep(.ant-table-cell) {
  vertical-align: middle;
}

@media (max-width: 1360px) {
  .sms-page {
    min-width: 980px;
    height: auto;
    min-height: 0;
  }

  .sms-workspace {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    max-height: 640px;
  }

  .board-panel {
    min-height: 720px;
  }
}
</style>
