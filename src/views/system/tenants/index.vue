<template>
  <div class="page-view tenant-page">
    <section class="tenant-page__stats">
      <a-card v-for="item in statCards" :key="item.label" :bordered="false" class="tenant-stat-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.description }}</small>
      </a-card>
    </section>

    <a-card :bordered="false">
      <div class="system-page__filters">
        <a-input v-model:value="query.keyword" allow-clear placeholder="租户名称 / 编码 / 管理员" @press-enter="handleSearch" />
        <a-select v-model:value="query.status" allow-clear placeholder="租户状态">
          <a-select-option v-for="option in tenantStatusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </a-select-option>
        </a-select>
        <a-select v-model:value="query.serviceStatus" allow-clear placeholder="服务状态">
          <a-select-option v-for="option in serviceStatusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </a-select-option>
        </a-select>
        <a-space>
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button type="primary" @click="openCreate">新增租户</a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="tenants"
        :loading="loading"
        :pagination="tablePagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tenantName'">
            <a class="tenant-name" @click="openDetail(record)">
              <strong>{{ record.tenantName }}</strong>
              <span>{{ record.tenantCode }}</span>
            </a>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getTenantStatusMeta(record.status).color">
              {{ getTenantStatusMeta(record.status).label }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'serviceStatus'">
            <a-tag :color="getServiceStatusMeta(record.serviceStatus).color">
              {{ getServiceStatusMeta(record.serviceStatus).label }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'counts'">
            <span>{{ record.organizationCount }} 组织 / {{ record.userCount }} 用户</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a @click="openDetail(record)">详情</a>
              <a @click="openEdit(record)">编辑</a>
              <a-dropdown>
                <a>状态</a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item v-for="action in getStatusActions(record.status)" :key="action.status">
                      <a-popconfirm :title="`确认${action.label}该租户？`" @confirm="handleStatusChange(record, action.status)">
                        <a>{{ action.label }}</a>
                      </a-popconfirm>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="saving"
      :title="editingId ? '编辑租户' : '新增租户'"
      destroy-on-close
      width="720px"
      @ok="submitTenant"
    >
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="租户名称" name="tenantName">
              <a-input v-model:value="formState.tenantName" placeholder="请输入租户名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="租户编码" name="tenantCode">
              <a-input v-model:value="formState.tenantCode" placeholder="请输入租户编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="租户管理员" name="administrator">
              <a-input v-model:value="formState.administrator" placeholder="请输入管理员姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="管理员邮箱" name="administratorEmail">
              <a-input v-model:value="formState.administratorEmail" placeholder="请输入管理员邮箱" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="默认组织" name="defaultOrganization">
              <a-input v-model:value="formState.defaultOrganization" placeholder="请输入默认组织" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="启用模块" name="enabledModules">
              <a-select v-model:value="formState.enabledModules" mode="multiple" placeholder="请选择启用模块">
                <a-select-option v-for="module in moduleOptions" :key="module" :value="module">
                  {{ module }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="备注" name="remark">
              <a-textarea v-model:value="formState.remark" :rows="3" placeholder="请输入备注" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="detailOpen" width="760px" title="租户详情" destroy-on-close>
      <a-spin :spinning="detailLoading">
        <template v-if="tenantDetail">
          <div class="tenant-detail__header">
            <div>
              <h2>{{ tenantDetail.tenantName }}</h2>
              <span>{{ tenantDetail.tenantCode }}</span>
            </div>
            <a-space>
              <a-tag :color="getTenantStatusMeta(tenantDetail.status).color">
                {{ getTenantStatusMeta(tenantDetail.status).label }}
              </a-tag>
              <a-tag :color="getServiceStatusMeta(tenantDetail.serviceStatus).color">
                {{ getServiceStatusMeta(tenantDetail.serviceStatus).label }}
              </a-tag>
            </a-space>
          </div>

          <a-tabs>
            <a-tab-pane key="overview" tab="概览">
              <a-descriptions bordered :column="2" size="small">
                <a-descriptions-item label="管理员">{{ tenantDetail.administrator }}</a-descriptions-item>
                <a-descriptions-item label="管理员邮箱">{{ tenantDetail.administratorEmail }}</a-descriptions-item>
                <a-descriptions-item label="默认组织">{{ tenantDetail.defaultOrganization }}</a-descriptions-item>
                <a-descriptions-item label="时区">{{ tenantDetail.settings.timezone }}</a-descriptions-item>
                <a-descriptions-item label="语言">{{ tenantDetail.settings.language }}</a-descriptions-item>
                <a-descriptions-item label="SLA 策略">{{ tenantDetail.settings.slaPolicy }}</a-descriptions-item>
                <a-descriptions-item label="知识范围">{{ tenantDetail.settings.knowledgeScope }}</a-descriptions-item>
                <a-descriptions-item label="工单规则">{{ tenantDetail.settings.ticketRule }}</a-descriptions-item>
                <a-descriptions-item label="启用模块" :span="2">
                  <a-space wrap>
                    <a-tag v-for="module in tenantDetail.enabledModules" :key="module" color="blue">{{ module }}</a-tag>
                  </a-space>
                </a-descriptions-item>
                <a-descriptions-item label="服务渠道" :span="2">
                  <a-space wrap>
                    <a-tag v-for="channel in tenantDetail.settings.channels" :key="channel">{{ channel }}</a-tag>
                  </a-space>
                </a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <a-tab-pane key="organizations" tab="组织">
              <a-table :columns="organizationColumns" :data-source="organizations" :pagination="false" size="small" row-key="id" />
            </a-tab-pane>

            <a-tab-pane key="members" tab="成员">
              <a-table :columns="memberColumns" :data-source="members" :pagination="false" size="small" row-key="id">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'accountStatus'">
                    <a-tag :color="getAccountStatusMeta(record.accountStatus).color">
                      {{ getAccountStatusMeta(record.accountStatus).label }}
                    </a-tag>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>

            <a-tab-pane key="permissions" tab="权限">
              <a-space wrap>
                <a-tag v-for="permission in tenantDetail.permissions" :key="permission" color="processing">
                  {{ permission }}
                </a-tag>
              </a-space>
            </a-tab-pane>

            <a-tab-pane key="resources" tab="资源">
              <div class="tenant-resource-list">
                <article v-for="item in resources" :key="item.key" class="tenant-resource">
                  <div>
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.used }} / {{ item.limit }} {{ item.unit }}</span>
                  </div>
                  <a-progress :percent="getResourcePercent(item)" :status="getResourcePercent(item) >= 85 ? 'exception' : 'active'" />
                </article>
              </div>
            </a-tab-pane>

            <a-tab-pane key="audit" tab="审计">
              <a-timeline>
                <a-timeline-item v-for="log in auditLogs" :key="log.id" :color="log.result === 'SUCCESS' ? 'green' : 'orange'">
                  <p>{{ log.action }}：{{ log.target }}</p>
                  <small>{{ log.operator }} / {{ log.operateTime }}</small>
                </a-timeline-item>
              </a-timeline>
            </a-tab-pane>
          </a-tabs>
        </template>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';
import { computed, onMounted, reactive, ref } from 'vue';

import type {
  TenantAuditLog,
  TenantDetail,
  TenantItem,
  TenantMember,
  TenantOrganization,
  TenantPayload,
  TenantQueryParams,
  TenantResourceUsage,
  TenantServiceStatus,
  TenantStatus,
} from '@/api/tenant';
import {
  createTenantApi,
  getTenantAuditLogsApi,
  getTenantDetailApi,
  getTenantListApi,
  getTenantMembersApi,
  getTenantOrganizationsApi,
  getTenantResourcesApi,
  updateTenantApi,
  updateTenantStatusApi,
} from '@/api/tenant';
import type { ApiId } from '@/api/types';
import { getErrorMessage } from '@/utils/api-error';

interface TenantStatusOption {
  label: string;
  value: TenantStatus;
  color: string;
}

interface ServiceStatusOption {
  label: string;
  value: TenantServiceStatus;
  color: string;
}

interface AccountStatusMeta {
  label: string;
  color: string;
}

const moduleOptions = ['工单', '呼叫', '在线会话', '邮件', '短信', '知识库', 'AI', '数据分析'];

const tenantStatusOptions: TenantStatusOption[] = [
  { label: '草稿', value: 'DRAFT', color: 'default' },
  { label: '初始化中', value: 'INITIALIZING', color: 'processing' },
  { label: '启用', value: 'ENABLED', color: 'green' },
  { label: '冻结', value: 'FROZEN', color: 'orange' },
  { label: '停用', value: 'DISABLED', color: 'red' },
  { label: '归档', value: 'ARCHIVED', color: 'default' },
];

const serviceStatusOptions: ServiceStatusOption[] = [
  { label: '正常', value: 'NORMAL', color: 'green' },
  { label: '预警', value: 'WARNING', color: 'orange' },
  { label: '暂停', value: 'SUSPENDED', color: 'red' },
];

const loading = ref(false);
const saving = ref(false);
const detailLoading = ref(false);
const modalOpen = ref(false);
const detailOpen = ref(false);
const editingId = ref<ApiId>();
const formRef = ref<FormInstance>();
const tenants = ref<TenantItem[]>([]);
const tenantDetail = ref<TenantDetail>();
const organizations = ref<TenantOrganization[]>([]);
const members = ref<TenantMember[]>([]);
const resources = ref<TenantResourceUsage[]>([]);
const auditLogs = ref<TenantAuditLog[]>([]);
const total = ref(0);
const query = reactive<TenantQueryParams>({
  pageNum: 1,
  pageSize: 10,
});
const formState = reactive<TenantPayload>(createEmptyForm());

const columns: TableColumnsType<TenantItem> = [
  { title: '租户', dataIndex: 'tenantName', key: 'tenantName', width: 220 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '管理员', dataIndex: 'administrator', key: 'administrator', width: 120 },
  { title: '组织 / 用户', key: 'counts', width: 150 },
  { title: '坐席数', dataIndex: 'agentCount', key: 'agentCount', width: 90 },
  { title: 'AI Agent', dataIndex: 'aiAgentCount', key: 'aiAgentCount', width: 100 },
  { title: '服务状态', dataIndex: 'serviceStatus', key: 'serviceStatus', width: 110 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', fixed: 'right', width: 170 },
];

const organizationColumns: TableColumnsType<TenantOrganization> = [
  { title: '组织名称', dataIndex: 'organizationName', key: 'organizationName' },
  { title: '负责人', dataIndex: 'leader', key: 'leader', width: 120 },
  { title: '成员数', dataIndex: 'memberCount', key: 'memberCount', width: 100 },
  { title: '服务范围', dataIndex: 'serviceScope', key: 'serviceScope' },
];

const memberColumns: TableColumnsType<TenantMember> = [
  { title: '成员', dataIndex: 'nickname', key: 'nickname', width: 120 },
  { title: '角色', dataIndex: 'roleName', key: 'roleName', width: 140 },
  { title: '部门', dataIndex: 'department', key: 'department' },
  { title: '账号状态', dataIndex: 'accountStatus', key: 'accountStatus', width: 110 },
  { title: '最近活跃', dataIndex: 'lastActiveTime', key: 'lastActiveTime', width: 170 },
];

const rules: Record<string, Rule[]> = {
  tenantName: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  tenantCode: [{ required: true, message: '请输入租户编码', trigger: 'blur' }],
  administrator: [{ required: true, message: '请输入租户管理员', trigger: 'blur' }],
  administratorEmail: [{ required: true, message: '请输入管理员邮箱', trigger: 'blur' }],
  defaultOrganization: [{ required: true, message: '请输入默认组织', trigger: 'blur' }],
  enabledModules: [{ required: true, type: 'array', min: 1, message: '请选择启用模块', trigger: 'change' }],
};

const tablePagination = computed<TablePaginationConfig>(() => ({
  current: query.pageNum,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value) => `共 ${value} 条`,
}));

const statCards = computed(() => {
  const enabled = tenants.value.filter((item) => item.status === 'ENABLED').length;
  const frozen = tenants.value.filter((item) => item.status === 'FROZEN').length;
  const warning = tenants.value.filter((item) => item.serviceStatus !== 'NORMAL').length;

  return [
    { label: '租户总数', value: total.value, description: '当前可管理租户' },
    { label: '启用租户', value: enabled, description: '可正常进入业务模块' },
    { label: '冻结租户', value: frozen, description: '需管理员复核' },
    { label: '资源预警', value: warning, description: '资源或服务状态异常' },
  ];
});

onMounted(loadTenants);

async function loadTenants() {
  loading.value = true;

  try {
    const page = await getTenantListApi(query);
    tenants.value = page.records;
    total.value = page.total;
    query.pageNum = page.pageNum;
    query.pageSize = page.pageSize;
  } catch (error) {
    message.error(getErrorMessage(error, '租户列表加载失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  void loadTenants();
}

function resetQuery() {
  query.keyword = undefined;
  query.status = undefined;
  query.serviceStatus = undefined;
  handleSearch();
}

function handleTableChange(pagination: TablePaginationConfig) {
  query.pageNum = pagination.current ?? 1;
  query.pageSize = pagination.pageSize ?? 10;
  void loadTenants();
}

function openCreate() {
  editingId.value = undefined;
  Object.assign(formState, createEmptyForm());
  modalOpen.value = true;
}

async function openEdit(record: TenantItem) {
  editingId.value = record.id;
  Object.assign(formState, toForm(record));
  modalOpen.value = true;

  try {
    Object.assign(formState, toForm(await getTenantDetailApi(record.id)));
  } catch (error) {
    message.warning(getErrorMessage(error, '租户详情加载失败，已使用列表数据回填'));
  }
}

async function submitTenant() {
  await formRef.value?.validate();
  saving.value = true;

  try {
    if (editingId.value) {
      await updateTenantApi(editingId.value, formState);
      message.success('租户已更新');
    } else {
      await createTenantApi(formState);
      message.success('租户已新增，正在初始化');
    }

    modalOpen.value = false;
    await loadTenants();
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function openDetail(record: TenantItem) {
  detailOpen.value = true;
  detailLoading.value = true;

  try {
    const [detail, organizationList, memberList, resourceList, auditList] = await Promise.all([
      getTenantDetailApi(record.id),
      getTenantOrganizationsApi(record.id),
      getTenantMembersApi(record.id),
      getTenantResourcesApi(record.id),
      getTenantAuditLogsApi(record.id),
    ]);
    tenantDetail.value = detail;
    organizations.value = organizationList;
    members.value = memberList;
    resources.value = resourceList;
    auditLogs.value = auditList;
  } catch (error) {
    message.error(getErrorMessage(error, '租户详情加载失败'));
  } finally {
    detailLoading.value = false;
  }
}

async function handleStatusChange(record: TenantItem, status: TenantStatus) {
  try {
    await updateTenantStatusApi(record.id, status);
    message.success(`租户状态已更新为${getTenantStatusMeta(status).label}`);
    await loadTenants();

    if (tenantDetail.value && String(tenantDetail.value.id) === String(record.id)) {
      await openDetail(record);
    }
  } catch (error) {
    message.error(getErrorMessage(error, '租户状态更新失败'));
  }
}

function getStatusActions(status: TenantStatus) {
  const actions: Array<{ label: string; status: TenantStatus }> = [];

  if (status === 'DRAFT' || status === 'INITIALIZING' || status === 'DISABLED' || status === 'FROZEN') {
    actions.push({ label: '启用', status: 'ENABLED' });
  }

  if (status === 'ENABLED') {
    actions.push({ label: '冻结', status: 'FROZEN' }, { label: '停用', status: 'DISABLED' });
  }

  if (status === 'FROZEN') {
    actions.push({ label: '恢复', status: 'ENABLED' }, { label: '停用', status: 'DISABLED' });
  }

  if (status === 'DISABLED') {
    actions.push({ label: '归档', status: 'ARCHIVED' });
  }

  return actions;
}

function toForm(tenant: TenantItem | TenantDetail): TenantPayload {
  return {
    tenantName: tenant.tenantName,
    tenantCode: tenant.tenantCode,
    administrator: tenant.administrator,
    administratorEmail: tenant.administratorEmail,
    defaultOrganization: tenant.defaultOrganization,
    enabledModules: [...tenant.enabledModules],
    remark: tenant.remark ?? undefined,
  };
}

function createEmptyForm(): TenantPayload {
  return {
    tenantName: '',
    tenantCode: '',
    administrator: '',
    administratorEmail: '',
    defaultOrganization: '',
    enabledModules: ['工单', '知识库'],
    remark: '',
  };
}

function getTenantStatusMeta(status: TenantStatus) {
  return tenantStatusOptions.find((item) => item.value === status) ?? tenantStatusOptions[0];
}

function getServiceStatusMeta(status: TenantServiceStatus) {
  return serviceStatusOptions.find((item) => item.value === status) ?? serviceStatusOptions[0];
}

function getAccountStatusMeta(status: TenantMember['accountStatus']): AccountStatusMeta {
  const statusMap: Record<TenantMember['accountStatus'], AccountStatusMeta> = {
    ACTIVE: { label: '正常', color: 'green' },
    INVITED: { label: '已邀请', color: 'processing' },
    DISABLED: { label: '停用', color: 'default' },
  };

  return statusMap[status];
}

function getResourcePercent(item: TenantResourceUsage) {
  if (!item.limit) {
    return 0;
  }

  return Math.min(Math.round((item.used / item.limit) * 100), 100);
}
</script>

<style scoped lang="scss">
.tenant-page {
  display: grid;
  gap: 16px;

  &__stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
}

.tenant-stat-card {
  span,
  small {
    display: block;
    color: var(--app-text-secondary);
  }

  strong {
    display: block;
    margin: 8px 0 4px;
    color: var(--app-text);
    font-size: 28px;
    line-height: 1;
  }
}

.tenant-name {
  display: inline-grid;
  gap: 4px;

  strong {
    color: var(--app-text);
  }

  span {
    color: var(--app-text-secondary);
    font-size: 12px;
  }
}

.tenant-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h2 {
    margin: 0 0 4px;
    font-size: 20px;
  }

  span {
    color: var(--app-text-secondary);
  }
}

.tenant-resource-list {
  display: grid;
  gap: 14px;
}

.tenant-resource {
  display: grid;
  gap: 8px;

  > div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  span {
    color: var(--app-text-secondary);
  }
}

@media (max-width: 1100px) {
  .tenant-page__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .tenant-page__stats {
    grid-template-columns: 1fr;
  }
}
</style>
