<template>
  <div class="page-view ticket-lifecycle">
    <div class="ticket-lifecycle__body">
      <a-card class="ticket-lifecycle__steps" :class="{ 'ticket-lifecycle__steps--expanded': !lifecycleCollapsed }" :bordered="false">
        <div class="ticket-lifecycle__topbar">
          <div>
            <div class="ticket-lifecycle__eyebrow">工单生命周期</div>
            <div class="ticket-lifecycle__title-row">
              <strong>{{ ticketNo }}</strong>
              <a-tag :color="currentStatusMeta.color">{{ currentStatusMeta.label }}</a-tag>
            </div>
          </div>
          <div v-if="!lifecycleCollapsed" class="ticket-lifecycle__facts">
            <span>处理人：{{ formState.assigneeName || '-' }}</span>
            <span>期望完成：{{ formState.dueTime || '-' }}</span>
            <span v-if="completedTime">完成时间：{{ completedTime }}</span>
            <span v-if="processingDuration">处理耗时：{{ processingDuration }}</span>
          </div>
          <a-button class="collapse-toggle" type="text" size="small" @click="lifecycleCollapsed = !lifecycleCollapsed">
            <component :is="lifecycleCollapsed ? RightOutlined : DownOutlined" />
            {{ lifecycleCollapsed ? '展开' : '收起' }}
          </a-button>
        </div>
        <a-steps v-if="!lifecycleCollapsed" :current="currentStepIndex" label-placement="vertical" responsive size="small">
          <a-step v-for="step in flowSteps" :key="step.key" :title="step.label" />
        </a-steps>
      </a-card>

      <div class="ticket-lifecycle__workbench" :class="{ 'ticket-lifecycle__workbench--ai-collapsed': aiPanelCollapsed }">
        <a-card class="ticket-lifecycle__form-card" :bordered="false">
          <template #title>
            <span class="section-title">
              <FileTextOutlined />
              工单信息
            </span>
          </template>
          <template #extra>
            <a-tag :color="priorityMeta.color">{{ priorityMeta.label }}</a-tag>
          </template>

          <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical" :disabled="isReadOnly">
            <div class="ticket-form-section">
              <div class="ticket-form-section__title">基础信息</div>
              <a-row :gutter="[16, 6]">
                <a-col :xs="24" :lg="12">
                  <a-form-item label="工单名称" name="title">
                    <a-input v-model:value="formState.title" placeholder="请输入工单名称" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="工单状态">
                    <a-select v-model:value="ticketStatus" disabled placeholder="请选择工单状态">
                      <a-select-option v-for="item in lifecycleStatusOptions" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="优先级" name="priority">
                    <a-select v-model:value="formState.priority" placeholder="请选择优先级">
                      <a-select-option v-for="item in priorityOptions" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="来电方式" name="source">
                    <a-select v-model:value="formState.source" placeholder="请选择来电方式">
                      <a-select-option v-for="item in sourceOptions" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="问题分类" name="category">
                    <a-select v-model:value="formState.category" placeholder="请选择问题分类">
                      <a-select-option v-for="item in categoryOptions" :key="item" :value="item">
                        {{ item }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="关联产品" name="serviceProduct">
                    <a-input v-model:value="formState.serviceProduct" placeholder="请输入产品或服务" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="期望完成时间" name="dueTime">
                    <a-date-picker
                      v-model:value="formState.dueTime"
                      show-time
                      value-format="YYYY-MM-DD HH:mm:ss"
                      class="full-width"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>

            <div class="ticket-form-section">
              <div class="ticket-form-section__title">客户与诉求</div>
              <a-row :gutter="[16, 6]">
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="客户" name="customerName">
                    <a-input v-model:value="formState.customerName" placeholder="请输入客户名称" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="联系人" name="applicantName">
                    <a-input v-model:value="formState.applicantName" placeholder="请输入联系人" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="联系电话" name="customerPhone">
                    <a-input v-model:value="formState.customerPhone" placeholder="请输入联系电话" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="客户邮箱" name="customerEmail">
                    <a-input v-model:value="formState.customerEmail" placeholder="请输入客户邮箱" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="客户等级" name="customerLevel">
                    <a-select v-model:value="formState.customerLevel" placeholder="请选择客户等级">
                      <a-select-option value="普通客户">普通客户</a-select-option>
                      <a-select-option value="重点客户">重点客户</a-select-option>
                      <a-select-option value="VIP客户">VIP客户</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="来电时间" name="contactTime">
                    <a-date-picker
                      v-model:value="formState.contactTime"
                      show-time
                      value-format="YYYY-MM-DD HH:mm:ss"
                      class="full-width"
                    />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="影响范围" name="impactScope">
                    <a-input v-model:value="formState.impactScope" placeholder="请输入影响范围" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="需要回访" name="callbackRequired">
                    <a-checkbox v-model:checked="formState.callbackRequired">需要</a-checkbox>
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item label="客户诉求" name="customerRequirement">
                    <a-textarea
                      v-model:value="formState.customerRequirement"
                      :rows="4"
                      placeholder="请输入客户希望解决的问题和诉求"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item label="问题描述" name="description">
                    <a-textarea
                      v-model:value="formState.description"
                      :rows="4"
                      placeholder="请描述问题现象、复现路径和补充背景"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>

            <div class="ticket-form-section">
              <div class="ticket-form-section__title">处理信息</div>
              <a-row :gutter="[16, 6]">
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="负责人" name="assigneeName">
                    <a-input v-model:value="formState.assigneeName" placeholder="请输入负责人" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="负责人ID" name="assigneeId">
                    <a-input v-model:value="formState.assigneeId" placeholder="请输入负责人 ID" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="负责部门" name="ownerDepartment">
                    <a-input v-model:value="formState.ownerDepartment" placeholder="请输入负责部门" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :lg="6">
                  <a-form-item label="申请人ID" name="applicantId">
                    <a-input v-model:value="formState.applicantId" placeholder="默认当前登录用户 ID" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :lg="12">
                  <a-form-item label="期望结果" name="expectedResult">
                    <a-input v-model:value="formState.expectedResult" placeholder="请输入客户期望结果" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :lg="12">
                  <a-form-item label="紧急原因" name="urgencyReason">
                    <a-input v-model:value="formState.urgencyReason" placeholder="请输入紧急原因" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :lg="12">
                  <a-form-item label="抄送邮箱" name="ccEmails">
                    <a-input v-model:value="formState.ccEmails" placeholder="多个邮箱用逗号分隔" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :lg="12">
                  <a-form-item label="标签" name="tags">
                    <a-select v-model:value="formState.tags" mode="tags" placeholder="请输入标签">
                      <a-select-option value="SLA风险">SLA风险</a-select-option>
                      <a-select-option value="高价值客户">高价值客户</a-select-option>
                      <a-select-option value="需回访">需回访</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
            </div>

            <div class="ticket-form-section">
              <div class="ticket-form-section__title">附件</div>
              <a-form-item label="附件上传" name="attachments">
                <a-upload
                  v-model:file-list="uploadFileList"
                  :before-upload="beforeUpload"
                  :max-count="6"
                  multiple
                  @change="handleUploadChange"
                >
                  <a-button>
                    <UploadOutlined />
                    选择附件
                  </a-button>
                </a-upload>
              </a-form-item>
            </div>
          </a-form>

        </a-card>

        <a-card
          class="ai-panel"
          :class="{ 'ai-panel--collapsed': aiPanelCollapsed }"
          :bordered="false"
          @click="handleAiPanelClick"
        >
          <template #title>
            <span class="section-title ai-panel__title">
              <RobotOutlined />
              <span>AI智能分析</span>
            </span>
          </template>
          <template #extra>
            <a-space :direction="aiPanelCollapsed ? 'vertical' : 'horizontal'" :size="aiPanelCollapsed ? 6 : 8">
              <a-tag v-if="aiLoading" color="processing">
                <LoadingOutlined />
                <span v-if="!aiPanelCollapsed">分析中</span>
              </a-tag>
              <a-tag v-else-if="aiAnalysis" color="success">{{ aiPanelCollapsed ? 'AI' : '已完成' }}</a-tag>
              <a-button class="collapse-toggle" type="text" size="small" @click="aiPanelCollapsed = !aiPanelCollapsed">
                <component :is="aiPanelCollapsed ? RightOutlined : LeftOutlined" />
                <span v-if="!aiPanelCollapsed">收起</span>
              </a-button>
            </a-space>
          </template>

          <div v-if="!aiPanelCollapsed && aiLoading" class="ai-panel__loading">
            <a-spin />
            <span>AI 正在识别问题类型、风险等级和推荐方案</span>
          </div>
          <a-empty
            v-else-if="!aiPanelCollapsed && !aiAnalysis"
            class="ai-panel__empty"
            description="提交工单后，AI 将自动分析问题类型、风险等级和推荐处理方案"
          />
          <div v-else-if="!aiPanelCollapsed && aiAnalysis" class="ai-panel__content">
            <div class="ai-panel__score">
              <div>
                <span>AI识别分类</span>
                <strong>{{ aiAnalysis.category }}</strong>
              </div>
              <a-tag :color="aiRiskColor">{{ aiAnalysis.riskLevel }}</a-tag>
            </div>

            <a-descriptions :column="1" size="small" bordered>
              <a-descriptions-item label="推荐处理部门">
                {{ aiAnalysis.recommendedDepartment }}
              </a-descriptions-item>
              <a-descriptions-item label="推荐处理人">
                {{ aiAnalysis.recommendedHandler }}
              </a-descriptions-item>
              <a-descriptions-item label="预计处理时长">
                {{ aiAnalysis.estimatedDuration }}
              </a-descriptions-item>
            </a-descriptions>

            <div class="ai-panel__block">
              <div class="ai-panel__block-title">相似历史工单</div>
              <a-list :data-source="aiAnalysis.similarTickets" size="small">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <div class="similar-ticket">
                      <strong>{{ item.ticketNo }}</strong>
                      <span>{{ item.title }}</span>
                      <a-tag color="blue">{{ item.similarity }}%</a-tag>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </div>

            <div class="ai-panel__block">
              <div class="ai-panel__block-title">AI处理建议</div>
              <ul class="ai-panel__suggestions">
                <li v-for="item in aiAnalysis.suggestions" :key="item">{{ item }}</li>
              </ul>
            </div>

            <div class="ai-panel__summary">
              <SafetyOutlined />
              <span>{{ aiAnalysis.summary }}</span>
            </div>
          </div>
        </a-card>
      </div>

      <a-card class="ticket-lifecycle__tabs" :bordered="false">
        <a-tabs v-model:active-key="activeTab">
          <a-tab-pane key="flow" tab="流程记录">
            <a-empty v-if="!flowRecords.length" description="暂无流程记录，提交后自动生成生命周期轨迹" />
            <a-timeline v-else class="flow-timeline">
              <a-timeline-item v-for="record in flowRecords" :key="record.id" :color="getStatusMeta(record.status).color">
                <div class="flow-timeline__item">
                  <div class="flow-timeline__main">
                    <strong>{{ record.title }}</strong>
                    <a-tag :color="getStatusMeta(record.status).color">{{ getStatusMeta(record.status).label }}</a-tag>
                  </div>
                  <p>{{ record.description }}</p>
                  <span>{{ record.operator }} · {{ record.time }}</span>
                </div>
              </a-timeline-item>
            </a-timeline>
          </a-tab-pane>

          <a-tab-pane key="comments" tab="评论记录">
            <div class="comment-box">
              <a-list :data-source="comments" size="small">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-comment :author="item.userName" :content="item.content" :datetime="item.time" />
                  </a-list-item>
                </template>
              </a-list>
              <div class="comment-box__editor">
                <a-textarea
                  v-model:value="commentText"
                  :disabled="ticketStatus === 'CLOSED'"
                  :rows="3"
                  placeholder="输入评论，补充处理过程或沟通结论"
                />
                <a-button
                  type="primary"
                  :disabled="ticketStatus === 'CLOSED'"
                  :loading="commentSubmitting"
                  @click="submitComment"
                >
                  <CommentOutlined />
                  追加评论
                </a-button>
              </div>
            </div>
          </a-tab-pane>

          <a-tab-pane key="attachments" tab="附件列表">
            <a-table
              :columns="attachmentColumns"
              :data-source="attachmentRows"
              :pagination="false"
              row-key="id"
              size="small"
            />
          </a-tab-pane>

          <a-tab-pane key="aiResult" tab="AI分析结果">
            <a-empty v-if="!aiAnalysis" description="暂无 AI 分析结果" />
            <div v-else class="ai-result">
              <a-descriptions :column="{ xs: 1, sm: 2, md: 3 }" bordered size="small">
                <a-descriptions-item label="AI分类">{{ aiAnalysis.category }}</a-descriptions-item>
                <a-descriptions-item label="风险等级">{{ aiAnalysis.riskLevel }}</a-descriptions-item>
                <a-descriptions-item label="推荐部门">{{ aiAnalysis.recommendedDepartment }}</a-descriptions-item>
                <a-descriptions-item label="推荐处理人">{{ aiAnalysis.recommendedHandler }}</a-descriptions-item>
                <a-descriptions-item label="预计时长">{{ aiAnalysis.estimatedDuration }}</a-descriptions-item>
                <a-descriptions-item label="AI摘要">{{ aiAnalysis.summary }}</a-descriptions-item>
              </a-descriptions>
              <div class="ai-result__suggestions">
                <strong>建议</strong>
                <a-tag v-for="item in aiAnalysis.suggestions" :key="item" color="blue">{{ item }}</a-tag>
              </div>
            </div>
          </a-tab-pane>

          <a-tab-pane key="logs" tab="操作日志">
            <a-table :columns="operationColumns" :data-source="operationLogs" :pagination="false" row-key="id" size="small">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'beforeStatus'">
                  <a-tag :color="getStatusMeta(record.beforeStatus).color">
                    {{ getStatusMeta(record.beforeStatus).label }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'afterStatus'">
                  <a-tag :color="getStatusMeta(record.afterStatus).color">
                    {{ getStatusMeta(record.afterStatus).label }}
                  </a-tag>
                </template>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>

    <div class="ticket-lifecycle__actions">
      <a-space wrap>
        <a-button
          v-for="action in actionButtons"
          :key="action.key"
          :danger="action.danger"
          :ghost="action.ghost"
          :loading="actionLoading === action.key || (action.key === 'aiAnalyze' && aiLoading)"
          :type="action.type || 'default'"
          @click="handleAction(action.key)"
        >
          {{ action.label }}
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CommentOutlined,
  DownOutlined,
  FileTextOutlined,
  LeftOutlined,
  LoadingOutlined,
  RightOutlined,
  RobotOutlined,
  SafetyOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';
import type { UploadChangeParam, UploadFile, UploadProps } from 'ant-design-vue/es/upload';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { ApiId } from '@/api/types';
import {
  acceptTicket as acceptTicketApi,
  addTicketComment,
  analyzeTicketByAi,
  confirmTicket as confirmTicketApi,
  finishProcessTicket,
  reopenTicket as reopenTicketApi,
  resumeTicket as resumeTicketApi,
  saveTicketDraft,
  startProcessTicket,
  submitTicket as submitTicketApi,
  suspendTicket as suspendTicketApi,
  transferTicket as transferTicketApi,
} from '@/api/ticket';
import type {
  LifecycleTicketDetail,
  LifecycleTicketPayload,
  LifecycleTicketPriority,
  LifecycleTicketSource,
  LifecycleTicketStatus,
  TicketAiAnalysis,
  TicketAttachment,
  TicketComment,
  TicketFlowRecord,
  TicketOperationLog,
} from '@/api/ticket';
import { useUserStore } from '@/stores/user';
import { getErrorMessage } from '@/utils/api-error';

type TicketActionKey =
  | 'saveDraft'
  | 'submitTicket'
  | 'acceptTicket'
  | 'transferTicket'
  | 'returnTicket'
  | 'startProcess'
  | 'aiAnalyze'
  | 'finishProcess'
  | 'suspendTicket'
  | 'upgradeTicket'
  | 'resumeTicket'
  | 'confirmTicket'
  | 'reopenTicket'
  | 'evaluateTicket';

interface ActionButton {
  key: TicketActionKey;
  label: string;
  type?: 'default' | 'primary' | 'dashed';
  danger?: boolean;
  ghost?: boolean;
}

const userStore = useUserStore();
const router = useRouter();
const formRef = ref<FormInstance>();
const ticketStatus = ref<LifecycleTicketStatus>('DRAFT');
const ticketId = ref<ApiId>('draft-local');
const ticketNo = ref('草稿未提交');
const actionLoading = ref<TicketActionKey | ''>('');
const aiLoading = ref(false);
const aiAnalysis = ref<TicketAiAnalysis>();
const activeTab = ref('flow');
const commentText = ref('');
const commentSubmitting = ref(false);
const completedTime = ref('');
const processingDuration = ref('');
const uploadFileList = ref<UploadFile[]>([]);
const lifecycleCollapsed = ref(true);
const aiPanelCollapsed = ref(false);

const formState = reactive<LifecycleTicketPayload>(createEmptyForm());
const flowRecords = ref<TicketFlowRecord[]>([]);
const comments = ref<TicketComment[]>([]);
const operationLogs = ref<TicketOperationLog[]>([]);

const rules: Record<string, Rule[]> = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
};

const priorityOptions: Array<{ label: string; value: LifecycleTicketPriority; color: string }> = [
  { label: '普通', value: 'NORMAL', color: 'blue' },
  { label: '重要', value: 'IMPORTANT', color: 'orange' },
  { label: '紧急', value: 'URGENT', color: 'red' },
];

const sourceOptions: Array<{ label: string; value: LifecycleTicketSource }> = [
  { label: '短信', value: 'SMS' },
  { label: '邮件', value: 'EMAIL' },
  { label: '电话', value: 'PHONE' },
  { label: '在线', value: 'ONLINE' },
  { label: '其他', value: 'OTHER' },
];

const lifecycleStatusOptions: Array<{ label: string; value: LifecycleTicketStatus }> = [
  { label: '草稿', value: 'DRAFT' },
  { label: '待受理', value: 'PENDING_ACCEPT' },
  { label: '已受理', value: 'ACCEPTED' },
  { label: '处理中', value: 'PROCESSING' },
  { label: '挂起中', value: 'PENDING' },
  { label: '待确认', value: 'WAIT_CONFIRM' },
];

const categoryOptions = ['IT', '流程异常', '系统故障', '账号权限', '数据问题', '咨询建议', '投诉反馈'];

const statusMetaMap: Record<LifecycleTicketStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'default' },
  PENDING_ACCEPT: { label: '待受理', color: 'orange' },
  ACCEPTED: { label: '已受理', color: 'cyan' },
  PROCESSING: { label: '处理中', color: 'blue' },
  PENDING: { label: '挂起中', color: 'gold' },
  WAIT_CONFIRM: { label: '待确认', color: 'purple' },
  COMPLETED: { label: '已完成', color: 'green' },
  CLOSED: { label: '已关闭', color: 'default' },
};

const flowSteps = [
  { key: 'DRAFT', label: '草稿' },
  { key: 'PENDING_ACCEPT', label: '待受理' },
  { key: 'ACCEPTED', label: '已受理' },
  { key: 'PROCESSING', label: '处理中' },
  { key: 'WAIT_CONFIRM', label: '待确认' },
  { key: 'COMPLETED', label: '已完成' },
];

const stepIndexMap: Record<LifecycleTicketStatus, number> = {
  DRAFT: 0,
  PENDING_ACCEPT: 1,
  ACCEPTED: 2,
  PROCESSING: 3,
  PENDING: 3,
  WAIT_CONFIRM: 4,
  COMPLETED: 5,
  CLOSED: 5,
};

const attachmentColumns = [
  { title: '附件名称', dataIndex: 'name', key: 'name' },
  { title: '大小', dataIndex: 'size', key: 'size', width: 120 },
  { title: '上传人', dataIndex: 'uploader', key: 'uploader', width: 140 },
  { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 190 },
];

const operationColumns = [
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 140 },
  { title: '操作动作', dataIndex: 'action', key: 'action' },
  { title: '操作前状态', dataIndex: 'beforeStatus', key: 'beforeStatus', width: 140 },
  { title: '操作后状态', dataIndex: 'afterStatus', key: 'afterStatus', width: 140 },
  { title: '操作时间', dataIndex: 'time', key: 'time', width: 190 },
];

const currentStatusMeta = computed(() => getStatusMeta(ticketStatus.value));
const currentStepIndex = computed(() => stepIndexMap[ticketStatus.value]);
const isReadOnly = computed(() => ticketStatus.value === 'COMPLETED' || ticketStatus.value === 'CLOSED');
const attachmentRows = computed(() => formState.attachments ?? []);
const priorityMeta = computed(() => getPriorityMeta(formState.priority));
const aiRiskColor = computed(() => {
  if (!aiAnalysis.value) {
    return 'default';
  }

  if (aiAnalysis.value.riskLevel.includes('高')) {
    return 'red';
  }

  if (aiAnalysis.value.riskLevel.includes('中')) {
    return 'orange';
  }

  return 'green';
});

const actionButtons = computed<ActionButton[]>(() => {
  switch (ticketStatus.value) {
    case 'DRAFT':
      return [
        { key: 'saveDraft', label: '暂存草稿' },
        { key: 'submitTicket', label: '提交工单', type: 'primary' },
      ];
    case 'PENDING_ACCEPT':
      return [
        { key: 'acceptTicket', label: '立即受理', type: 'primary' },
        { key: 'transferTicket', label: '转派' },
        { key: 'returnTicket', label: '退回', danger: true },
      ];
    case 'ACCEPTED':
      return [
        { key: 'startProcess', label: '开始处理', type: 'primary' },
        { key: 'transferTicket', label: '转派' },
        { key: 'aiAnalyze', label: 'AI辅助分析' },
      ];
    case 'PROCESSING':
      return [
        { key: 'finishProcess', label: '处理完成', type: 'primary' },
        { key: 'suspendTicket', label: '挂起' },
        { key: 'upgradeTicket', label: '升级', danger: true },
        { key: 'aiAnalyze', label: 'AI辅助分析' },
      ];
    case 'PENDING':
      return [{ key: 'resumeTicket', label: '恢复处理', type: 'primary' }];
    case 'WAIT_CONFIRM':
      return [
        { key: 'confirmTicket', label: '确认完成', type: 'primary' },
        { key: 'reopenTicket', label: '重新打开' },
      ];
    case 'COMPLETED':
      return [
        { key: 'evaluateTicket', label: '评价', type: 'primary' },
        { key: 'reopenTicket', label: '再次打开' },
      ];
    case 'CLOSED':
      return [];
    default:
      return [];
  }
});

const beforeUpload: UploadProps['beforeUpload'] = () => false;

onMounted(() => {
  applyCurrentUser();
});

function createEmptyForm(): LifecycleTicketPayload {
  return {
    title: '',
    priority: 'NORMAL',
    source: 'PHONE',
    category: 'IT',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerLevel: '普通客户',
    applicantId: undefined,
    applicantName: '',
    assigneeId: undefined,
    assigneeName: '',
    ownerDepartment: '',
    dueTime: undefined,
    contactTime: undefined,
    serviceProduct: '',
    customerRequirement: '',
    impactScope: '',
    expectedResult: '',
    urgencyReason: '',
    callbackRequired: false,
    ccEmails: '',
    tags: [],
    description: '',
    attachments: [],
  };
}

function applyCurrentUser() {
  formState.applicantId = userStore.userInfo?.userId || userStore.userInfo?.id;
  formState.applicantName = userStore.displayName;
}

function buildPayload(): LifecycleTicketPayload {
  return {
    ...formState,
    description: formState.description || formState.customerRequirement || '',
    attachments: [...(formState.attachments ?? [])],
  };
}

function handleUploadChange(info: UploadChangeParam<UploadFile>) {
  uploadFileList.value = info.fileList.map((file) => ({ ...file, status: 'done' }));
  formState.attachments = uploadFileList.value.map(toAttachment);
}

function toAttachment(file: UploadFile): TicketAttachment {
  const rawSize = file.size ?? file.originFileObj?.size ?? 0;

  return {
    id: file.uid,
    name: file.name,
    size: formatFileSize(rawSize),
    uploader: formState.applicantName || '管理员',
    uploadTime: nowText(),
  };
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${size} B`;
}

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
}

function getOperator() {
  return userStore.displayName || formState.assigneeName || '管理员';
}

function getStatusMeta(status: LifecycleTicketStatus | '-') {
  if (status === '-') {
    return { label: '-', color: 'default' };
  }

  return statusMetaMap[status] ?? { label: status, color: 'default' };
}

function getPriorityMeta(priority: LifecycleTicketPriority) {
  return priorityOptions.find((item) => item.value === priority) ?? { label: priority, value: priority, color: 'default' };
}

function syncTicketFromDetail(detail: LifecycleTicketDetail) {
  ticketId.value = detail.id;
  ticketNo.value = detail.ticketNo;
  ticketStatus.value = detail.status;
  completedTime.value = detail.completedTime || completedTime.value;
  processingDuration.value = detail.processingDuration || processingDuration.value;
  aiAnalysis.value = detail.aiAnalysis || aiAnalysis.value;
  Object.assign(formState, {
    title: detail.title,
    priority: detail.priority,
    source: detail.source,
    category: detail.category,
    customerName: detail.customerName,
    customerPhone: detail.customerPhone,
    customerEmail: detail.customerEmail,
    customerLevel: detail.customerLevel,
    applicantId: detail.applicantId,
    applicantName: detail.applicantName,
    assigneeId: detail.assigneeId,
    assigneeName: detail.assigneeName,
    ownerDepartment: detail.ownerDepartment,
    dueTime: detail.dueTime,
    contactTime: detail.contactTime,
    serviceProduct: detail.serviceProduct,
    customerRequirement: detail.customerRequirement,
    impactScope: detail.impactScope,
    expectedResult: detail.expectedResult,
    urgencyReason: detail.urgencyReason,
    callbackRequired: detail.callbackRequired ?? false,
    ccEmails: detail.ccEmails,
    tags: detail.tags ?? [],
    description: detail.description,
    attachments: detail.attachments ?? [],
  });
}

function appendFlow(
  title: string,
  description: string,
  status: LifecycleTicketStatus = ticketStatus.value,
  operator = getOperator(),
) {
  flowRecords.value.unshift({
    id: `flow-${Date.now()}-${flowRecords.value.length}`,
    title,
    operator,
    description,
    status,
    time: nowText(),
  });
  activeTab.value = 'flow';
}

function appendLog(
  action: string,
  beforeStatus: LifecycleTicketStatus | '-',
  afterStatus: LifecycleTicketStatus,
  operator = getOperator(),
) {
  operationLogs.value.unshift({
    id: `log-${Date.now()}-${operationLogs.value.length}`,
    operator,
    action,
    beforeStatus,
    afterStatus,
    time: nowText(),
  });
}

function applyStatusChange(
  nextStatus: LifecycleTicketStatus,
  action: string,
  description: string,
  operator = getOperator(),
) {
  const beforeStatus = ticketStatus.value;
  ticketStatus.value = nextStatus;
  appendFlow(action, description, nextStatus, operator);
  appendLog(action, beforeStatus, nextStatus, operator);
}

async function executeAction(action: TicketActionKey, runner: () => Promise<void>) {
  if (actionLoading.value) {
    return;
  }

  actionLoading.value = action;

  try {
    await runner();
  } catch (error) {
    message.error(getErrorMessage(error, '操作失败'));
  } finally {
    actionLoading.value = '';
  }
}

async function handleAction(action: TicketActionKey) {
  switch (action) {
    case 'saveDraft':
      await handleSaveDraft();
      break;
    case 'submitTicket':
      await handleSubmitTicket();
      break;
    case 'acceptTicket':
      await handleAcceptTicket();
      break;
    case 'transferTicket':
      await handleTransferTicket();
      break;
    case 'returnTicket':
      handleReturnTicket();
      break;
    case 'startProcess':
      await handleStartProcess();
      break;
    case 'aiAnalyze':
      await runAiAnalysis('manual');
      break;
    case 'finishProcess':
      await handleFinishProcess();
      break;
    case 'suspendTicket':
      await handleSuspendTicket();
      break;
    case 'upgradeTicket':
      handleUpgradeTicket();
      break;
    case 'resumeTicket':
      await handleResumeTicket();
      break;
    case 'confirmTicket':
      await handleConfirmTicket();
      break;
    case 'reopenTicket':
      await handleReopenTicket();
      break;
    case 'evaluateTicket':
      handleEvaluateTicket();
      break;
  }
}

async function handleSaveDraft() {
  await executeAction('saveDraft', async () => {
    const detail = await saveTicketDraft(buildPayload());
    syncTicketFromDetail(detail);
    appendFlow('暂存草稿', '工单信息已暂存，仍可继续补充内容', 'DRAFT');
    appendLog('暂存草稿', 'DRAFT', 'DRAFT');
    message.success('草稿已暂存');
  });
}

async function handleSubmitTicket() {
  if (!formState.description && formState.customerRequirement) {
    formState.description = formState.customerRequirement;
  }

  try {
    await formRef.value?.validate();
  } catch {
    message.warning('请先填写工单名称和问题描述');
    return;
  }

  await executeAction('submitTicket', async () => {
    const detail = await submitTicketApi(buildPayload());
    syncTicketFromDetail(detail);
    aiPanelCollapsed.value = true;
    appendFlow('提交工单', '工单进入待受理队列，等待服务台受理', 'PENDING_ACCEPT', formState.applicantName || getOperator());
    appendLog('提交工单', 'DRAFT', 'PENDING_ACCEPT', formState.applicantName || getOperator());
    message.success('工单已提交');
    window.setTimeout(() => {
      void router.push('/service/tickets');
    }, 500);
  });

  void runAiAnalysis('auto');
}

async function handleAcceptTicket() {
  await executeAction('acceptTicket', async () => {
    const result = await acceptTicketApi(ticketId.value);
    formState.assigneeId = formState.assigneeId || userStore.userInfo?.userId || userStore.userInfo?.id || '20002';
    formState.assigneeName = formState.assigneeName || userStore.displayName || '张三';
    applyStatusChange(result.status, `${formState.assigneeName}受理`, '当前处理人已接单，工单进入已受理状态', formState.assigneeName);
    message.success('已受理工单');
  });
}

async function handleStartProcess() {
  await executeAction('startProcess', async () => {
    const result = await startProcessTicket(ticketId.value);
    applyStatusChange(result.status, '开始处理', '处理人开始排查问题并记录处理过程');
    message.success('已开始处理');
  });
}

async function handleFinishProcess() {
  await executeAction('finishProcess', async () => {
    const result = await finishProcessTicket(ticketId.value);
    applyStatusChange(result.status, '处理完成', '处理方案已执行，等待申请人确认结果');
    message.success('已进入待确认');
  });
}

async function handleConfirmTicket() {
  await executeAction('confirmTicket', async () => {
    const result = await confirmTicketApi(ticketId.value);
    completedTime.value = result.completedTime;
    processingDuration.value = result.processingDuration;

    if (!aiAnalysis.value) {
      aiAnalysis.value = await analyzeTicketByAi(buildPayload());
    }

    applyStatusChange(result.status, '确认完成', '申请人已确认处理结果，工单生命周期完成');
    message.success('工单已完成');
  });
}

async function handleReopenTicket() {
  await executeAction('reopenTicket', async () => {
    const result = await reopenTicketApi(ticketId.value);
    completedTime.value = '';
    processingDuration.value = '';
    applyStatusChange(result.status, ticketStatus.value === 'COMPLETED' ? '再次打开' : '重新打开', '问题仍需继续处理，工单回到处理中');
    message.success('工单已重新打开');
  });
}

async function handleSuspendTicket() {
  await executeAction('suspendTicket', async () => {
    const result = await suspendTicketApi(ticketId.value);
    applyStatusChange(result.status, '挂起', '等待外部条件满足后继续处理');
    message.success('工单已挂起');
  });
}

async function handleResumeTicket() {
  await executeAction('resumeTicket', async () => {
    const result = await resumeTicketApi(ticketId.value);
    applyStatusChange(result.status, '恢复处理', '挂起条件解除，继续推进处理');
    message.success('已恢复处理');
  });
}

async function handleTransferTicket() {
  await executeAction('transferTicket', async () => {
    const beforeStatus = ticketStatus.value;
    const nextAssigneeName = formState.assigneeName === '王五' ? '张三' : '王五';
    const result = await transferTicketApi(ticketId.value, {
      assigneeId: nextAssigneeName === '王五' ? '20003' : '20002',
      assigneeName: nextAssigneeName,
    });
    formState.assigneeId = result.assigneeId;
    formState.assigneeName = result.assigneeName;
    appendFlow('转派', `工单已转派给 ${formState.assigneeName}`, beforeStatus);
    appendLog('转派', beforeStatus, beforeStatus);
    message.success(`已转派给 ${formState.assigneeName}`);
  });
}

function handleReturnTicket() {
  applyStatusChange('DRAFT', '退回', '服务台退回工单，申请人需要补充问题信息');
  message.success('工单已退回草稿');
}

function handleUpgradeTicket() {
  const beforeStatus = ticketStatus.value;
  formState.priority = 'URGENT';
  appendFlow('升级', '工单已升级为紧急优先级，需要优先响应', beforeStatus);
  appendLog('升级', beforeStatus, beforeStatus);
  message.success('工单已升级为紧急');
}

function handleEvaluateTicket() {
  appendLog('评价', ticketStatus.value, ticketStatus.value);
  message.success('评价已记录（模拟）');
}

function handleAiPanelClick() {
  if (aiPanelCollapsed.value) {
    aiPanelCollapsed.value = false;
  }
}

async function runAiAnalysis(mode: 'auto' | 'manual') {
  if (aiLoading.value) {
    return;
  }

  aiLoading.value = true;

  try {
    aiAnalysis.value = await analyzeTicketByAi(buildPayload());
    appendFlow(
      'AI完成分析',
      'AI已完成分类识别、风险判断、相似工单匹配和处理建议生成',
      ticketStatus.value,
      'AI助手',
    );
    appendLog(mode === 'auto' ? 'AI自动分析' : 'AI辅助分析', ticketStatus.value, ticketStatus.value, 'AI助手');

    if (mode === 'manual') {
      message.success('AI分析已完成');
    }
  } catch (error) {
    message.error(getErrorMessage(error, 'AI分析失败'));
  } finally {
    aiLoading.value = false;
  }
}

async function submitComment() {
  const content = commentText.value.trim();

  if (!content) {
    message.warning('请输入评论内容');
    return;
  }

  commentSubmitting.value = true;

  try {
    const comment = await addTicketComment(ticketId.value, content);
    comments.value.unshift(comment);
    commentText.value = '';
    message.success('评论已追加');
  } catch (error) {
    message.error(getErrorMessage(error, '追加评论失败'));
  } finally {
    commentSubmitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.ticket-lifecycle {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 0;
}

.ticket-lifecycle__steps {
  flex: none;

  :deep(.ant-card-body) {
    padding: 16px 20px 14px;
  }
}

.ticket-lifecycle__topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 0;
}

.ticket-lifecycle__steps--expanded {
  .ticket-lifecycle__topbar {
    margin-bottom: 16px;
  }
}

.ticket-lifecycle__eyebrow {
  margin-bottom: 4px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.ticket-lifecycle__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--app-text);
  font-size: 18px;
}

.ticket-lifecycle__facts {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px 14px;
  max-width: 680px;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.ticket-lifecycle__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
  padding-bottom: 12px;
}

.ticket-lifecycle__workbench {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(300px, 3fr);
  gap: 12px;
  align-items: stretch;
  transition: grid-template-columns 0.2s ease;
}

.ticket-lifecycle__workbench--ai-collapsed {
  grid-template-columns: minmax(0, 1fr) 72px;
}

.ticket-lifecycle__form-card,
.ai-panel,
.ticket-lifecycle__tabs {
  min-width: 0;
  border: 1px solid var(--app-border);
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
}

.ticket-lifecycle__form-card {
  :deep(.ant-card-body) {
    padding-bottom: 16px;
  }
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.collapse-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ticket-form-section {
  padding: 12px 0 4px;
  border-top: 1px solid var(--app-border);

  &:first-child {
    padding-top: 0;
    border-top: 0;
  }
}

.ticket-form-section__title {
  margin-bottom: 12px;
  color: var(--app-text);
  font-weight: 600;
}

.ticket-lifecycle__actions {
  position: sticky;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  flex: none;
  margin: 0 -2px -2px;
  padding: 12px 20px;
  border-top: 1px solid var(--app-border);
  background: var(--app-surface);
  box-shadow: 0 -10px 24px rgb(15 23 42 / 8%);
}

.ai-panel {
  overflow: hidden;
  transition: width 0.2s ease;

  :deep(.ant-card-body) {
    height: calc(100% - 57px);
    min-height: 420px;
  }
}

.ai-panel--collapsed {
  align-self: start;
  min-height: 300px;
  cursor: pointer;

  :deep(.ant-card-head) {
    min-height: 300px;
    padding: 10px 8px;
    border-bottom: 0;
  }

  :deep(.ant-card-head-wrapper) {
    height: 100%;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
  }

  :deep(.ant-card-head-title),
  :deep(.ant-card-extra) {
    min-width: 0;
    padding: 0;
  }

  :deep(.ant-card-body) {
    display: none;
  }

  .ai-panel__title {
    flex-direction: column;
    gap: 8px;
    white-space: nowrap;

    span {
      writing-mode: vertical-rl;
      letter-spacing: 0;
    }
  }

  .collapse-toggle {
    width: 32px;
    height: 32px;
    justify-content: center;
    padding: 0;
  }
}

.ai-panel__loading,
.ai-panel__empty {
  display: flex;
  min-height: 360px;
  align-items: center;
  justify-content: center;
}

.ai-panel__loading {
  flex-direction: column;
  gap: 12px;
  color: var(--app-text-secondary);
}

.ai-panel__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ai-panel__score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgb(22 119 255 / 18%);
  border-radius: 8px;
  background: rgb(22 119 255 / 7%);

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  span {
    color: var(--app-text-secondary);
    font-size: 12px;
  }

  strong {
    color: var(--app-text);
    font-size: 18px;
  }
}

.ai-panel__block-title {
  margin-bottom: 8px;
  color: var(--app-text);
  font-weight: 600;
}

.similar-ticket {
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr) auto;
  gap: 8px;
  width: 100%;
  align-items: center;

  span {
    min-width: 0;
    overflow: hidden;
    color: var(--app-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.ai-panel__suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: var(--app-text-secondary);
}

.ai-panel__summary {
  display: flex;
  gap: 10px;
  padding: 12px;
  color: #0958d9;
  border: 1px solid rgb(22 119 255 / 18%);
  border-radius: 8px;
  background: rgb(22 119 255 / 7%);
}

.ticket-lifecycle__tabs {
  :deep(.ant-card-body) {
    padding-top: 10px;
  }
}

.flow-timeline {
  max-height: 260px;
  overflow: auto;
  padding: 8px 6px 0;
}

.flow-timeline__item {
  p {
    margin: 6px 0 4px;
    color: var(--app-text-secondary);
  }

  span {
    color: var(--app-text-secondary);
    font-size: 12px;
  }
}

.flow-timeline__main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-box {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
}

.comment-box__editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-result__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

html.dark .ai-panel__summary {
  color: #69b1ff;
}

@media (max-width: 1180px) {
  .ticket-lifecycle {
    height: auto;
    overflow: visible;
  }

  .ticket-lifecycle__body {
    overflow: visible;
  }

  .ticket-lifecycle__workbench,
  .comment-box {
    grid-template-columns: 1fr;
  }

  .ticket-lifecycle__workbench--ai-collapsed {
    grid-template-columns: 1fr;
  }

  .ai-panel {
    :deep(.ant-card-body) {
      min-height: 320px;
    }
  }

  .ai-panel--collapsed {
    min-height: auto;

    :deep(.ant-card-head) {
      min-height: auto;
    }

    :deep(.ant-card-head-wrapper) {
      flex-direction: row;
    }

    .ai-panel__title {
      flex-direction: row;

      span {
        writing-mode: horizontal-tb;
      }
    }
  }
}

@media (max-width: 760px) {
  .ticket-lifecycle__topbar {
    flex-direction: column;
  }

  .ticket-lifecycle__facts {
    justify-content: flex-start;
  }

  .ticket-lifecycle__actions {
    justify-content: flex-start;
    margin-right: 0;
    margin-left: 0;
  }

  .similar-ticket {
    grid-template-columns: 1fr auto;

    span {
      grid-column: 1 / -1;
      white-space: normal;
    }
  }
}
</style>
