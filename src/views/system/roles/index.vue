<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">角色管理</h1>
        <p class="page-description">维护角色基础信息；菜单授权接口后端尚未提供。</p>
      </div>
      <a-space>
        <a-button @click="loadRoles">刷新</a-button>
        <a-button type="primary" @click="openCreate">新增角色</a-button>
      </a-space>
    </div>

    <a-card :bordered="false">
      <div class="system-page__filters">
        <a-input v-model:value="query.roleName" allow-clear placeholder="角色名称" @press-enter="handleSearch" />
        <a-input v-model:value="query.roleCode" allow-clear placeholder="角色编码" @press-enter="handleSearch" />
        <a-select v-model:value="query.status" allow-clear placeholder="状态">
          <a-select-option value="ENABLED">启用</a-select-option>
          <a-select-option value="DISABLED">停用</a-select-option>
        </a-select>
        <a-space>
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="primary" @click="handleSearch">查询</a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="roles"
        :loading="loading"
        :pagination="tablePagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'ENABLED' ? 'green' : 'default'">
              {{ record.status === 'ENABLED' ? '启用' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a @click="openEdit(record)">编辑</a>
              <a-popconfirm title="确认删除该角色？" @confirm="handleDelete(record.id)">
                <a class="danger-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="saving"
      :title="editingId ? '编辑角色' : '新增角色'"
      destroy-on-close
      @ok="submitRole"
    >
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="角色名称" name="roleName">
              <a-input v-model:value="formState.roleName" placeholder="请输入角色名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="角色编码" name="roleCode">
              <a-input v-model:value="formState.roleCode" placeholder="请输入角色编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序" name="sortOrder">
              <a-input-number v-model:value="formState.sortOrder" :min="0" :precision="0" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-select v-model:value="formState.status">
                <a-select-option value="ENABLED">启用</a-select-option>
                <a-select-option value="DISABLED">停用</a-select-option>
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
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';
import { computed, onMounted, reactive, ref } from 'vue';

import type { ApiId, CommonStatus } from '@/api/types';
import {
  createRoleApi,
  deleteRoleApi,
  getRoleDetailApi,
  getRoleListApi,
  updateRoleApi,
} from '@/api/role';
import type { RoleItem, RolePayload, RoleQueryParams } from '@/api/role';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editingId = ref<ApiId>();
const formRef = ref<FormInstance>();
const roles = ref<RoleItem[]>([]);
const total = ref(0);
const query = reactive<RoleQueryParams>({
  pageNum: 1,
  pageSize: 10,
});
const formState = reactive<RolePayload>(createEmptyForm());

const columns: TableColumnsType<RoleItem> = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName', width: 160 },
  { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode', width: 160 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 90 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', fixed: 'right', width: 120 },
];

const rules: Record<string, Rule[]> = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
};

const tablePagination = computed<TablePaginationConfig>(() => ({
  current: query.pageNum,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value) => `共 ${value} 条`,
}));

onMounted(loadRoles);

async function loadRoles() {
  loading.value = true;

  try {
    const page = await getRoleListApi(query);
    roles.value = page.records;
    total.value = page.total;
    query.pageNum = page.pageNum;
    query.pageSize = page.pageSize;
  } catch (error) {
    message.error(getErrorMessage(error, '角色列表加载失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  void loadRoles();
}

function resetQuery() {
  query.roleName = undefined;
  query.roleCode = undefined;
  query.status = undefined;
  handleSearch();
}

function handleTableChange(pagination: TablePaginationConfig) {
  query.pageNum = pagination.current ?? 1;
  query.pageSize = pagination.pageSize ?? 10;
  void loadRoles();
}

function openCreate() {
  editingId.value = undefined;
  Object.assign(formState, createEmptyForm());
  modalOpen.value = true;
}

async function openEdit(record: RoleItem) {
  editingId.value = record.id;
  Object.assign(formState, toForm(record));
  modalOpen.value = true;

  try {
    Object.assign(formState, toForm(await getRoleDetailApi(record.id)));
  } catch (error) {
    message.warning(getErrorMessage(error, '角色详情加载失败，已使用列表数据回填'));
  }
}

async function submitRole() {
  await formRef.value?.validate();
  saving.value = true;

  try {
    if (editingId.value) {
      await updateRoleApi(editingId.value, formState);
      message.success('角色已更新');
    } else {
      await createRoleApi(formState);
      message.success('角色已新增');
    }

    modalOpen.value = false;
    await loadRoles();
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: ApiId) {
  try {
    await deleteRoleApi(id);
    message.success('角色已删除');
    await loadRoles();
  } catch (error) {
    message.error(getErrorMessage(error, '删除角色失败'));
  }
}

function toForm(role: RoleItem): RolePayload {
  return {
    roleName: role.roleName,
    roleCode: role.roleCode,
    sortOrder: role.sortOrder,
    status: role.status,
    remark: role.remark ?? undefined,
  };
}

function createEmptyForm(): RolePayload & { status: CommonStatus } {
  return {
    roleName: '',
    roleCode: '',
    sortOrder: 0,
    status: 'ENABLED',
    remark: '',
  };
}
</script>
