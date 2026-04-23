<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">工单列表</h1>
        <p class="page-description">对接工单分页、详情、修改、删除和状态变更接口。</p>
      </div>
      <a-button type="primary" @click="router.push('/ticket/create')">新建工单</a-button>
    </div>

    <div class="stat-grid">
      <a-card v-for="item in statusStats" :key="item.status" :bordered="false" :loading="statsLoading">
        <a-statistic :title="item.label" :value="item.count" suffix="件" />
      </a-card>
    </div>

    <a-card :bordered="false">
      <div class="ticket-list__filters">
        <a-input-search
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索工单编号、标题"
          @search="handleSearch"
        />
        <a-select v-model:value="query.priority" allow-clear placeholder="优先级">
          <a-select-option v-for="item in ticketPriorityOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-select-option>
        </a-select>
        <a-input v-model:value="query.category" allow-clear placeholder="分类" @press-enter="handleSearch" />
        <a-space>
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="primary" @click="handleSearch">查询</a-button>
        </a-space>
      </div>

      <a-tabs v-model:active-key="activeStatus" @change="handleStatusTabChange">
        <a-tab-pane key="ALL" tab="全部" />
        <a-tab-pane v-for="item in ticketStatusOptions" :key="item.value" :tab="item.label" />
      </a-tabs>

      <a-table
        :columns="columns"
        :data-source="tickets"
        :loading="loading"
        :pagination="tablePagination"
        :scroll="{ x: 1280 }"
        row-key="id"
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
          <template v-else-if="column.key === 'status'">
            <a-select
              :value="record.status"
              :options="statusSelectOptions"
              size="small"
              class="ticket-list__status-select"
              @change="handleStatusSelectChange(record, $event)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a @click="openDetail(record)">查看</a>
              <a @click="openEdit(record)">编辑</a>
              <a-popconfirm title="确认删除该工单？删除后会进入回收站。" @confirm="handleDelete(record.id)">
                <a class="danger-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailOpen" title="工单详情" width="640">
      <a-spin :spinning="detailLoading">
        <a-empty v-if="!currentTicket" description="暂无工单详情" />
        <a-descriptions v-else :column="1" bordered size="small">
          <a-descriptions-item label="工单编号">{{ currentTicket.ticketNo }}</a-descriptions-item>
          <a-descriptions-item label="标题">{{ currentTicket.title }}</a-descriptions-item>
          <a-descriptions-item label="描述">{{ currentTicket.description }}</a-descriptions-item>
          <a-descriptions-item label="优先级">
            <a-tag :color="getTicketPriorityMeta(currentTicket.priority).color">
              {{ getTicketPriorityMeta(currentTicket.priority).label }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getTicketStatusMeta(currentTicket.status).color">
              {{ getTicketStatusMeta(currentTicket.status).label }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="分类">{{ currentTicket.category || '-' }}</a-descriptions-item>
          <a-descriptions-item label="来源">{{ currentTicket.source || '-' }}</a-descriptions-item>
          <a-descriptions-item label="申请人">{{ currentTicket.applicantName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="处理人">{{ currentTicket.assigneeName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="期望完成">{{ currentTicket.dueTime || '-' }}</a-descriptions-item>
          <a-descriptions-item label="AI 摘要">{{ currentTicket.aiSummary || '-' }}</a-descriptions-item>
          <a-descriptions-item label="AI 风险">{{ currentTicket.aiRiskLevel || '-' }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ currentTicket.createTime }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ currentTicket.updateTime }}</a-descriptions-item>
        </a-descriptions>
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
            <a-form-item label="状态" name="status">
              <a-select v-model:value="formState.status">
                <a-select-option v-for="item in ticketStatusOptions" :key="item.value" :value="item.value">
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
            <a-form-item label="处理人 ID" name="assigneeId">
              <a-input v-model:value="formState.assigneeId" placeholder="请输入处理人 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="处理人姓名" name="assigneeName">
              <a-input v-model:value="formState.assigneeName" placeholder="请输入处理人姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="期望完成时间" name="dueTime">
              <a-date-picker
                v-model:value="formState.dueTime"
                show-time
                value-format="YYYY-MM-DD HH:mm:ss"
                class="full-width"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="AI 风险等级" name="aiRiskLevel">
              <a-input v-model:value="formState.aiRiskLevel" placeholder="例如 LOW/HIGH" />
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
  deleteWorkOrderApi,
  getWorkOrderDetailApi,
  getWorkOrderListApi,
  toWorkOrderUpdatePayload,
  updateWorkOrderApi,
} from '@/api/workOrder';
import type {
  TicketStatus,
  UpdateWorkOrderPayload,
  WorkOrderItem,
  WorkOrderQueryParams,
} from '@/api/workOrder';
import {
  getTicketPriorityMeta,
  getTicketStatusMeta,
  ticketPriorityOptions,
  ticketStatusOptions,
} from '@/constants/ticket';
import { getErrorMessage } from '@/utils/api-error';

type StatusTabKey = 'ALL' | TicketStatus;

const router = useRouter();
const loading = ref(false);
const statsLoading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const detailOpen = ref(false);
const editOpen = ref(false);
const editingId = ref<ApiId>();
const formRef = ref<FormInstance>();
const tickets = ref<WorkOrderItem[]>([]);
const currentTicket = ref<WorkOrderItem>();
const total = ref(0);
const activeStatus = ref<StatusTabKey>('ALL');
const statusStats = ref(ticketStatusOptions.map((item) => ({ ...item, status: item.value, count: 0 })));
const query = reactive<WorkOrderQueryParams>({
  pageNum: 1,
  pageSize: 10,
});
const formState = reactive<UpdateWorkOrderPayload>(createEmptyForm());

const columns: TableColumnsType<WorkOrderItem> = [
  { title: '工单编号', dataIndex: 'ticketNo', key: 'ticketNo', width: 190 },
  { title: '标题', dataIndex: 'title', key: 'title', width: 220 },
  { title: '申请人', dataIndex: 'applicantName', key: 'applicantName', width: 120 },
  { title: '处理人', dataIndex: 'assigneeName', key: 'assigneeName', width: 120 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 130 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', fixed: 'right', width: 160 },
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
const statusSelectOptions = computed(() =>
  ticketStatusOptions.map((item) => ({
    label: item.label,
    value: item.value,
  })),
);

onMounted(async () => {
  await Promise.all([loadTickets(), loadStatusStats()]);
});

async function loadTickets() {
  loading.value = true;

  try {
    const page = await getWorkOrderListApi({
      ...query,
      status: activeStatus.value === 'ALL' ? undefined : activeStatus.value,
    });
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

async function loadStatusStats() {
  statsLoading.value = true;

  try {
    const pages = await Promise.all(
      ticketStatusOptions.map((item) => getWorkOrderListApi({ pageNum: 1, pageSize: 1, status: item.value })),
    );
    statusStats.value = ticketStatusOptions.map((item, index) => ({
      ...item,
      status: item.value,
      count: pages[index]?.total ?? 0,
    }));
  } catch (error) {
    message.warning(getErrorMessage(error, '工单统计加载失败'));
  } finally {
    statsLoading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  void loadTickets();
}

function resetQuery() {
  query.keyword = undefined;
  query.priority = undefined;
  query.category = undefined;
  handleSearch();
}

function handleStatusTabChange() {
  query.pageNum = 1;
  void loadTickets();
}

function handleTableChange(pagination: TablePaginationConfig) {
  query.pageNum = pagination.current ?? 1;
  query.pageSize = pagination.pageSize ?? 10;
  void loadTickets();
}

async function openDetail(record: WorkOrderItem) {
  currentTicket.value = record;
  detailOpen.value = true;
  detailLoading.value = true;

  try {
    currentTicket.value = await getWorkOrderDetailApi(record.id);
  } catch (error) {
    message.warning(getErrorMessage(error, '工单详情加载失败，已使用列表数据展示'));
  } finally {
    detailLoading.value = false;
  }
}

async function openEdit(record: WorkOrderItem) {
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
    await Promise.all([loadTickets(), loadStatusStats()]);
  } catch (error) {
    message.error(getErrorMessage(error, '更新工单失败'));
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(record: WorkOrderItem, status: TicketStatus) {
  if (record.status === status) {
    return;
  }

  try {
    await updateWorkOrderApi(record.id, toWorkOrderUpdatePayload(record, { status }));
    record.status = status;
    message.success('工单状态已更新');
    await loadStatusStats();
  } catch (error) {
    message.error(getErrorMessage(error, '更新工单状态失败'));
  }
}

function handleStatusSelectChange(record: WorkOrderItem, value: unknown) {
  if (!isTicketStatus(value)) {
    return;
  }

  void handleStatusChange(record, value);
}

function isTicketStatus(value: unknown): value is TicketStatus {
  return ticketStatusOptions.some((item) => item.value === value);
}

async function handleDelete(id: ApiId) {
  try {
    await deleteWorkOrderApi(id);
    message.success('工单已删除');
    await Promise.all([loadTickets(), loadStatusStats()]);
  } catch (error) {
    message.error(getErrorMessage(error, '删除工单失败'));
  }
}

function createEmptyForm(): UpdateWorkOrderPayload {
  return {
    title: '',
    description: '',
    priority: 'NORMAL',
    status: 'NEW',
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
.ticket-list {
  &__filters {
    display: grid;
    grid-template-columns: minmax(220px, 1.5fr) minmax(140px, 0.6fr) minmax(160px, 0.8fr) auto;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__status-select {
    width: 104px;
  }
}

.ticket-title {
  color: #1677ff;
}

@media (max-width: 980px) {
  .ticket-list__filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .ticket-list__filters {
    grid-template-columns: 1fr;
  }
}
</style>
