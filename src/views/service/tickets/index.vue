<template>
  <div class="page-view service-ticket-page">
    <a-card :bordered="false">
      <div class="system-page__filters service-ticket-page__filters">
        <a-input v-model:value="query.keyword" allow-clear placeholder="工单编号 / 标题 / 客户 / 处理人" @press-enter="handleSearch" />
        <a-select v-model:value="query.lifecycleStatus" allow-clear placeholder="生命周期状态">
          <a-select-option v-for="item in lifecycleStatusOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-select-option>
        </a-select>
        <a-select v-model:value="query.priority" allow-clear placeholder="优先级">
          <a-select-option v-for="item in ticketPriorityOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-select-option>
        </a-select>
        <a-input v-model:value="query.category" allow-clear placeholder="分类" @press-enter="handleSearch" />
        <a-input v-model:value="query.assigneeId" allow-clear placeholder="处理人 ID" @press-enter="handleSearch" />
        <a-select v-model:value="query.slaRisk" allow-clear placeholder="SLA 风险">
          <a-select-option :value="true">仅看风险</a-select-option>
        </a-select>
        <a-space>
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button type="primary" @click="router.push('/service/tickets/create')">创建工单</a-button>
        </a-space>
      </div>
    </a-card>

    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data-source="tickets"
        :loading="loading"
        :pagination="tablePagination"
        :scroll="{ x: 1680 }"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <a class="ticket-title" @click="openDetail(record)">{{ record.title }}</a>
          </template>
          <template v-else-if="column.key === 'priority'">
            <a-tag :color="getTicketPriorityMeta(record.priority).color">
              {{ getTicketPriorityMeta(record.priority).label }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'lifecycleStatus'">
            <a-tag :color="getLifecycleStatusMeta(record.lifecycleStatus).color">
              {{ getLifecycleStatusMeta(record.lifecycleStatus).label }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'sla'">
            <a-tag :color="isSlaRisk(record) ? 'red' : 'green'">
              {{ record.dueTime || '-' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'aiRiskLevel'">
            <a-tag :color="getAiRiskColor(record.aiRiskLevel)">
              {{ record.aiRiskLevel || '-' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a @click="openDetail(record)">查看</a>
              <a :class="{ disabled: record.lifecycleStatus === 'CLOSED' }" @click="openEdit(record)">编辑</a>
              <a-dropdown v-if="getRowActions(record).length">
                <a>流转</a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item v-for="action in getRowActions(record)" :key="action.key">
                      <a-popconfirm
                        v-if="action.danger"
                        :title="`确认${action.label}该工单？`"
                        @confirm="handleLifecycleAction(record, action.key)"
                      >
                        <a class="danger-link">{{ action.label }}</a>
                      </a-popconfirm>
                      <a v-else @click="handleLifecycleAction(record, action.key)">{{ action.label }}</a>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
              <a-popconfirm title="确认删除该工单？删除后进入回收站。" @confirm="handleDelete(record.id)">
                <a v-if="record.lifecycleStatus !== 'CLOSED'" class="danger-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailOpen" width="820px" title="工单详情" destroy-on-close>
      <a-spin :spinning="detailLoading">
        <a-empty v-if="!currentTicket" description="暂无工单详情" />
        <template v-else>
          <div class="ticket-detail__header">
            <div>
              <h2>{{ currentTicket.title }}</h2>
              <span>{{ currentTicket.ticketNo }}</span>
            </div>
            <a-space wrap>
              <a-tag :color="getLifecycleStatusMeta(currentTicket.status).color">
                {{ getLifecycleStatusMeta(currentTicket.status).label }}
              </a-tag>
              <a-tag :color="getPriorityMeta(currentTicket.priority).color">
                {{ getPriorityMeta(currentTicket.priority).label }}
              </a-tag>
            </a-space>
          </div>

          <a-tabs>
            <a-tab-pane key="base" tab="基础信息">
              <a-descriptions :column="2" bordered size="small">
                <a-descriptions-item label="客户">{{ currentTicket.customerName || '-' }}</a-descriptions-item>
                <a-descriptions-item label="联系人">{{ currentTicket.applicantName || '-' }}</a-descriptions-item>
                <a-descriptions-item label="联系电话">{{ currentTicket.customerPhone || '-' }}</a-descriptions-item>
                <a-descriptions-item label="邮箱">{{ currentTicket.customerEmail || '-' }}</a-descriptions-item>
                <a-descriptions-item label="来源">{{ currentTicket.source }}</a-descriptions-item>
                <a-descriptions-item label="分类">{{ currentTicket.category }}</a-descriptions-item>
                <a-descriptions-item label="负责人">{{ currentTicket.assigneeName || '-' }}</a-descriptions-item>
                <a-descriptions-item label="负责部门">{{ currentTicket.ownerDepartment || '-' }}</a-descriptions-item>
                <a-descriptions-item label="SLA 截止">{{ currentTicket.dueTime || '-' }}</a-descriptions-item>
                <a-descriptions-item label="服务产品">{{ currentTicket.serviceProduct || '-' }}</a-descriptions-item>
                <a-descriptions-item label="客户诉求" :span="2">{{ currentTicket.customerRequirement || '-' }}</a-descriptions-item>
                <a-descriptions-item label="问题描述" :span="2">{{ currentTicket.description }}</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <a-tab-pane key="ai" tab="AI 分析">
              <a-empty v-if="!currentTicket.aiAnalysis" description="暂无 AI 分析结果" />
              <a-descriptions v-else :column="2" bordered size="small">
                <a-descriptions-item label="AI 分类">{{ currentTicket.aiAnalysis.category }}</a-descriptions-item>
                <a-descriptions-item label="风险等级">
                  <a-tag :color="currentTicket.aiAnalysis.riskLevel.includes('高') ? 'red' : 'orange'">
                    {{ currentTicket.aiAnalysis.riskLevel }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="推荐部门">{{ currentTicket.aiAnalysis.recommendedDepartment }}</a-descriptions-item>
                <a-descriptions-item label="推荐处理人">{{ currentTicket.aiAnalysis.recommendedHandler }}</a-descriptions-item>
                <a-descriptions-item label="预计时长">{{ currentTicket.aiAnalysis.estimatedDuration }}</a-descriptions-item>
                <a-descriptions-item label="AI 摘要" :span="2">{{ currentTicket.aiAnalysis.summary }}</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <a-tab-pane key="flow" tab="流程记录">
              <a-timeline>
                <a-timeline-item v-for="item in flowRecords" :key="item.id" :color="getLifecycleStatusMeta(item.status).color">
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.description }}</p>
                  <small>{{ item.operator }} / {{ item.time }}</small>
                </a-timeline-item>
              </a-timeline>
            </a-tab-pane>

            <a-tab-pane key="comments" tab="评论">
              <a-list :data-source="comments" size="small">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-comment :author="item.userName" :content="item.content" :datetime="item.time" />
                  </a-list-item>
                </template>
              </a-list>
              <div class="ticket-detail__comment">
                <a-textarea
                  v-model:value="commentText"
                  :disabled="currentTicket.status === 'CLOSED'"
                  :rows="3"
                  placeholder="补充处理过程或沟通结论"
                />
                <a-button
                  type="primary"
                  :disabled="currentTicket.status === 'CLOSED'"
                  :loading="commentSubmitting"
                  @click="submitComment"
                >
                  追加评论
                </a-button>
              </div>
            </a-tab-pane>

            <a-tab-pane key="attachments" tab="附件">
              <a-table :columns="attachmentColumns" :data-source="attachments" :pagination="false" row-key="id" size="small" />
            </a-tab-pane>

            <a-tab-pane key="logs" tab="操作日志">
              <a-table :columns="operationColumns" :data-source="operationLogs" :pagination="false" row-key="id" size="small">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'beforeStatus'">
                    <a-tag :color="getLifecycleStatusMeta(record.beforeStatus).color">
                      {{ getLifecycleStatusMeta(record.beforeStatus).label }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'afterStatus'">
                    <a-tag :color="getLifecycleStatusMeta(record.afterStatus).color">
                      {{ getLifecycleStatusMeta(record.afterStatus).label }}
                    </a-tag>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>
          </a-tabs>
        </template>
      </a-spin>
    </a-drawer>

    <a-modal
      v-model:open="editOpen"
      :confirm-loading="saving"
      title="编辑工单"
      destroy-on-close
      width="760px"
      @ok="submitEdit"
    >
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
        <a-row :gutter="12">
          <a-col :span="24">
            <a-form-item label="工单标题" name="title">
              <a-input v-model:value="formState.title" placeholder="请输入工单标题" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="优先级" name="priority">
              <a-select v-model:value="formState.priority">
                <a-select-option v-for="item in ticketPriorityOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="分类" name="category">
              <a-input v-model:value="formState.category" placeholder="请输入分类" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="来源" name="source">
              <a-input v-model:value="formState.source" placeholder="请输入来源" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="期望完成时间" name="dueTime">
              <a-date-picker v-model:value="formState.dueTime" show-time value-format="YYYY-MM-DD HH:mm:ss" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="处理人 ID" name="assigneeId">
              <a-input v-model:value="formState.assigneeId" placeholder="请输入处理人 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="处理人姓名" name="assigneeName">
              <a-input v-model:value="formState.assigneeName" placeholder="请输入处理人姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="问题描述" name="description">
              <a-textarea v-model:value="formState.description" :rows="5" placeholder="请输入问题描述" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="AI 摘要" name="aiSummary">
              <a-textarea v-model:value="formState.aiSummary" :rows="3" placeholder="请输入 AI 摘要" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { ApiId } from '@/api/types';
import {
  acceptTicket,
  addTicketComment,
  confirmTicket,
  finishProcessTicket,
  getTicketAttachments,
  getTicketComments,
  getTicketDetail,
  getTicketFlowRecords,
  getTicketOperationLogs,
  reopenTicket,
  resumeTicket,
  startProcessTicket,
  suspendTicket,
  transferTicket,
} from '@/api/ticket';
import type {
  LifecycleTicketDetail,
  LifecycleTicketPriority,
  LifecycleTicketStatus,
  TicketAttachment,
  TicketComment,
  TicketFlowRecord,
  TicketOperationLog,
} from '@/api/ticket';
import {
  deleteWorkOrderApi,
  getWorkOrderDetailApi,
  getWorkOrderListApi,
  toWorkOrderUpdatePayload,
  updateWorkOrderApi,
} from '@/api/workOrder';
import type { TicketStatus, UpdateWorkOrderPayload, WorkOrderItem, WorkOrderQueryParams } from '@/api/workOrder';
import { getTicketPriorityMeta, ticketPriorityOptions } from '@/constants/ticket';
import { getErrorMessage } from '@/utils/api-error';

type LifecycleActionKey = 'accept' | 'start' | 'finish' | 'confirm' | 'suspend' | 'resume' | 'reopen' | 'transfer';
interface LifecycleAction {
  key: LifecycleActionKey;
  label: string;
  danger?: boolean;
}

const router = useRouter();
const loading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const detailOpen = ref(false);
const editOpen = ref(false);
const commentSubmitting = ref(false);
const editingId = ref<ApiId>();
const formRef = ref<FormInstance>();
const tickets = ref<WorkOrderItem[]>([]);
const currentTicket = ref<LifecycleTicketDetail>();
const flowRecords = ref<TicketFlowRecord[]>([]);
const comments = ref<TicketComment[]>([]);
const attachments = ref<TicketAttachment[]>([]);
const operationLogs = ref<TicketOperationLog[]>([]);
const commentText = ref('');
const total = ref(0);
const query = reactive<WorkOrderQueryParams>({
  pageNum: 1,
  pageSize: 10,
});
const formState = reactive<UpdateWorkOrderPayload>(createEmptyForm());

const lifecycleStatusOptions: Array<{ label: string; value: LifecycleTicketStatus; color: string }> = [
  { label: '草稿', value: 'DRAFT', color: 'default' },
  { label: '待受理', value: 'PENDING_ACCEPT', color: 'orange' },
  { label: '已受理', value: 'ACCEPTED', color: 'cyan' },
  { label: '处理中', value: 'PROCESSING', color: 'blue' },
  { label: '挂起中', value: 'PENDING', color: 'gold' },
  { label: '待确认', value: 'WAIT_CONFIRM', color: 'purple' },
  { label: '已完成', value: 'COMPLETED', color: 'green' },
  { label: '已关闭', value: 'CLOSED', color: 'default' },
];

const columns: TableColumnsType<WorkOrderItem> = [
  { title: '工单编号', dataIndex: 'ticketNo', key: 'ticketNo', width: 180 },
  { title: '标题', dataIndex: 'title', key: 'title', width: 240 },
  { title: '客户', dataIndex: 'applicantName', key: 'applicantName', width: 120 },
  { title: '申请人', dataIndex: 'applicantName', key: 'applicantName', width: 120 },
  { title: '处理人', dataIndex: 'assigneeName', key: 'assigneeName', width: 120 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100 },
  { title: '状态', dataIndex: 'lifecycleStatus', key: 'lifecycleStatus', width: 110 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 100 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
  { title: 'SLA 截止', key: 'sla', width: 170 },
  { title: 'AI 风险', dataIndex: 'aiRiskLevel', key: 'aiRiskLevel', width: 100 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 170 },
  { title: '操作', key: 'action', fixed: 'right', width: 240 },
];

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

const rules: Record<string, Rule[]> = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
};

const tablePagination = computed<TablePaginationConfig>(() => ({
  current: query.pageNum,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value) => `共 ${value} 条`,
}));

onMounted(loadTickets);

async function loadTickets() {
  loading.value = true;

  try {
    const page = await getWorkOrderListApi(query);
    tickets.value = page.records;
    total.value = page.total;
    query.pageNum = page.pageNum;
    query.pageSize = page.pageSize;
  } catch (error) {
    message.error(getErrorMessage(error, '工单列表加载失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  void loadTickets();
}

function resetQuery() {
  query.keyword = undefined;
  query.lifecycleStatus = undefined;
  query.priority = undefined;
  query.category = undefined;
  query.assigneeId = undefined;
  query.slaRisk = undefined;
  handleSearch();
}

function handleTableChange(pagination: TablePaginationConfig) {
  query.pageNum = pagination.current ?? 1;
  query.pageSize = pagination.pageSize ?? 10;
  void loadTickets();
}

async function openDetail(record: WorkOrderItem) {
  detailOpen.value = true;
  detailLoading.value = true;
  commentText.value = '';

  try {
    const detail = await getTicketDetail(record.id);
    currentTicket.value = detail;
    const [flows, commentRows, attachmentRows, logs] = await Promise.all([
      getTicketFlowRecords(record.id),
      getTicketComments(record.id),
      getTicketAttachments(record.id),
      getTicketOperationLogs(record.id),
    ]);
    flowRecords.value = flows;
    comments.value = commentRows;
    attachments.value = attachmentRows;
    operationLogs.value = logs;
  } catch (error) {
    message.error(getErrorMessage(error, '工单详情加载失败'));
  } finally {
    detailLoading.value = false;
  }
}

async function openEdit(record: WorkOrderItem) {
  if (record.lifecycleStatus === 'CLOSED') {
    message.warning('已关闭工单只允许查看');
    return;
  }

  editingId.value = record.id;
  Object.assign(formState, toWorkOrderUpdatePayload(record));
  editOpen.value = true;

  try {
    Object.assign(formState, toWorkOrderUpdatePayload(await getWorkOrderDetailApi(record.id)));
  } catch (error) {
    message.warning(getErrorMessage(error, '工单详情加载失败，已使用列表数据回填'));
  }
}

async function submitEdit() {
  await formRef.value?.validate();

  if (!editingId.value) {
    return;
  }

  saving.value = true;

  try {
    await updateWorkOrderApi(editingId.value, formState);
    message.success('工单已更新');
    editOpen.value = false;
    await refreshTickets();
  } catch (error) {
    message.error(getErrorMessage(error, '更新工单失败'));
  } finally {
    saving.value = false;
  }
}

async function handleLifecycleAction(record: WorkOrderItem, action: LifecycleActionKey) {
  try {
    if (action === 'accept') {
      await acceptTicket(record.id);
    } else if (action === 'start') {
      await startProcessTicket(record.id);
    } else if (action === 'finish') {
      await finishProcessTicket(record.id);
    } else if (action === 'confirm') {
      await confirmTicket(record.id);
    } else if (action === 'suspend') {
      await suspendTicket(record.id);
    } else if (action === 'resume') {
      await resumeTicket(record.id);
    } else if (action === 'reopen') {
      await reopenTicket(record.id);
    } else if (action === 'transfer') {
      await transferTicket(record.id, { assigneeId: '20003', assigneeName: '王五' });
    }

    message.success('工单状态已更新');
    await refreshTickets();

    if (currentTicket.value && String(currentTicket.value.id) === String(record.id)) {
      await openDetail(record);
    }
  } catch (error) {
    message.error(getErrorMessage(error, '工单状态更新失败'));
  }
}

async function handleDelete(id: ApiId) {
  try {
    await deleteWorkOrderApi(id);
    message.success('工单已移入回收站');
    await refreshTickets();
  } catch (error) {
    message.error(getErrorMessage(error, '删除工单失败'));
  }
}

async function submitComment() {
  const content = commentText.value.trim();

  if (!content || !currentTicket.value) {
    return;
  }

  commentSubmitting.value = true;

  try {
    const comment = await addTicketComment(currentTicket.value.id, content);
    comments.value.unshift(comment);
    commentText.value = '';
    message.success('评论已追加');
  } catch (error) {
    message.error(getErrorMessage(error, '追加评论失败'));
  } finally {
    commentSubmitting.value = false;
  }
}

async function refreshTickets() {
  await loadTickets();
}

function getRowActions(record: WorkOrderItem): LifecycleAction[] {
  const status = record.lifecycleStatus;

  if (status === 'PENDING_ACCEPT') {
    return [
      { key: 'accept' as const, label: '受理' },
      { key: 'transfer' as const, label: '转派' },
    ];
  }

  if (status === 'ACCEPTED') {
    return [
      { key: 'start' as const, label: '开始处理' },
      { key: 'transfer' as const, label: '转派' },
    ];
  }

  if (status === 'PROCESSING') {
    return [
      { key: 'finish' as const, label: '处理完成' },
      { key: 'suspend' as const, label: '挂起' },
    ];
  }

  if (status === 'PENDING') {
    return [{ key: 'resume' as const, label: '恢复处理' }];
  }

  if (status === 'WAIT_CONFIRM') {
    return [
      { key: 'confirm' as const, label: '确认完成' },
      { key: 'reopen' as const, label: '重新打开', danger: true },
    ];
  }

  if (status === 'COMPLETED') {
    return [{ key: 'reopen' as const, label: '再次打开' }];
  }

  return [];
}

function getLifecycleStatusMeta(status?: LifecycleTicketStatus | '-') {
  if (status === '-') {
    return { label: '-', color: 'default' };
  }

  return lifecycleStatusOptions.find((item) => item.value === status) ?? { label: status || '-', color: 'default' };
}

function getPriorityMeta(priority: LifecycleTicketPriority) {
  const map: Record<LifecycleTicketPriority, { label: string; color: string }> = {
    NORMAL: { label: '普通', color: 'blue' },
    IMPORTANT: { label: '重要', color: 'orange' },
    URGENT: { label: '紧急', color: 'red' },
  };
  return map[priority] ?? { label: priority, color: 'default' };
}

function getAiRiskColor(level?: string | null) {
  if (level === 'URGENT' || level === 'HIGH' || level?.includes('高')) {
    return 'red';
  }

  if (level === 'MEDIUM' || level?.includes('中')) {
    return 'orange';
  }

  return 'green';
}

function isSlaRisk(record: WorkOrderItem) {
  return record.priority === 'URGENT' || record.aiRiskLevel === 'HIGH' || record.aiRiskLevel === 'URGENT';
}

function createEmptyForm(): UpdateWorkOrderPayload {
  return {
    title: '',
    description: '',
    priority: 'NORMAL',
    status: 'NEW' as TicketStatus,
    source: 'WEB',
    category: '',
    assigneeId: undefined,
    assigneeName: '',
    dueTime: undefined,
    aiSummary: '',
    aiRiskLevel: '',
  };
}
</script>

<style scoped lang="scss">
.service-ticket-page {
  &__filters {
    grid-template-columns: minmax(220px, 1.6fr) minmax(140px, 0.8fr) minmax(120px, 0.7fr) minmax(120px, 0.7fr) minmax(120px, 0.7fr) minmax(120px, 0.7fr) auto;
  }
}

.ticket-title {
  color: #1677ff;
}

.disabled {
  color: var(--app-text-muted);
  cursor: not-allowed;
}

.ticket-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h2 {
    margin: 0 0 4px;
    font-size: 18px;
  }

  span {
    color: var(--app-text-secondary);
  }
}

.ticket-detail__comment {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

small {
  color: var(--app-text-secondary);
}

@media (max-width: 1280px) {
  .service-ticket-page__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .service-ticket-page__filters {
    grid-template-columns: 1fr;
  }
}
</style>
