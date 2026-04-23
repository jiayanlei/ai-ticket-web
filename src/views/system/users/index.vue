<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">用户管理</h1>
        <p class="page-description">维护系统用户、组织归属、账号状态和登录权限。</p>
      </div>
      <a-space>
        <a-button @click="loadUsers">刷新</a-button>
        <a-button type="primary" @click="openCreate">新增用户</a-button>
      </a-space>
    </div>

    <a-card :bordered="false">
      <div class="system-page__filters">
        <a-input v-model:value="query.username" allow-clear placeholder="用户名" @press-enter="handleSearch" />
        <a-input v-model:value="query.nickname" allow-clear placeholder="昵称" @press-enter="handleSearch" />
        <a-select v-model:value="query.deptId" allow-clear placeholder="部门">
          <a-select-option v-for="dept in deptOptions" :key="dept.id" :value="dept.id">
            {{ dept.deptName }}
          </a-select-option>
        </a-select>
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
        :data-source="users"
        :loading="loading"
        :pagination="tablePagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'deptId'">
            {{ getDeptName(record.deptId) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'ENABLED' ? 'green' : 'default'">
              {{ record.status === 'ENABLED' ? '启用' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a @click="openEdit(record)">编辑</a>
              <a-popconfirm title="确认删除该用户？" @confirm="handleDelete(record.id)">
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
      :title="editingId ? '编辑用户' : '新增用户'"
      destroy-on-close
      @ok="submitUser"
    >
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="用户名" name="username">
              <a-input v-model:value="formState.username" :disabled="Boolean(editingId)" placeholder="请输入用户名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item v-if="!editingId" label="密码" name="password">
              <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="昵称" name="nickname">
              <a-input v-model:value="formState.nickname" placeholder="请输入昵称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="部门" name="deptId">
              <a-select v-model:value="formState.deptId" allow-clear placeholder="请选择部门">
                <a-select-option v-for="dept in deptOptions" :key="dept.id" :value="dept.id">
                  {{ dept.deptName }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱" name="email">
              <a-input v-model:value="formState.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号" name="mobile">
              <a-input v-model:value="formState.mobile" placeholder="请输入手机号" />
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
            <a-form-item label="头像 URL" name="avatar">
              <a-input v-model:value="formState.avatar" placeholder="请输入头像 URL" />
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
import { getDeptListApi } from '@/api/dept';
import type { DeptItem } from '@/api/dept';
import {
  createUserApi,
  deleteUserApi,
  getUserDetailApi,
  getUserListApi,
  updateUserApi,
} from '@/api/user';
import type { UserItem, UserQueryParams } from '@/api/user';
import { getErrorMessage } from '@/utils/api-error';

interface UserFormState {
  username: string;
  password: string;
  nickname: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  deptId?: ApiId;
  status: CommonStatus;
}

const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editingId = ref<ApiId>();
const formRef = ref<FormInstance>();
const users = ref<UserItem[]>([]);
const deptOptions = ref<DeptItem[]>([]);
const total = ref(0);
const query = reactive<UserQueryParams>({
  pageNum: 1,
  pageSize: 10,
});
const formState = reactive<UserFormState>(createEmptyForm());

const columns: TableColumnsType<UserItem> = [
  { title: '用户名', dataIndex: 'username', key: 'username', width: 140 },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 140 },
  { title: '部门', dataIndex: 'deptId', key: 'deptId', width: 140 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
  { title: '手机号', dataIndex: 'mobile', key: 'mobile', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '最后登录', dataIndex: 'lastLoginTime', key: 'lastLoginTime', width: 170 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', fixed: 'right', width: 120 },
];

const rules: Record<string, Rule[]> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度应为 6-64 位', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
};

const tablePagination = computed<TablePaginationConfig>(() => ({
  current: query.pageNum,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value) => `共 ${value} 条`,
}));

onMounted(async () => {
  await Promise.all([loadDepartments(), loadUsers()]);
});

async function loadUsers() {
  loading.value = true;

  try {
    const page = await getUserListApi(query);
    users.value = page.records;
    total.value = page.total;
    query.pageNum = page.pageNum;
    query.pageSize = page.pageSize;
  } catch (error) {
    message.error(getErrorMessage(error, '用户列表加载失败'));
  } finally {
    loading.value = false;
  }
}

async function loadDepartments() {
  try {
    deptOptions.value = await getDeptListApi({ status: 'ENABLED' });
  } catch (error) {
    message.warning(getErrorMessage(error, '部门列表加载失败，用户部门下拉暂不可用'));
  }
}

function handleSearch() {
  query.pageNum = 1;
  void loadUsers();
}

function resetQuery() {
  query.username = undefined;
  query.nickname = undefined;
  query.deptId = undefined;
  query.status = undefined;
  handleSearch();
}

function handleTableChange(pagination: TablePaginationConfig) {
  query.pageNum = pagination.current ?? 1;
  query.pageSize = pagination.pageSize ?? 10;
  void loadUsers();
}

function openCreate() {
  editingId.value = undefined;
  Object.assign(formState, createEmptyForm());
  modalOpen.value = true;
}

async function openEdit(record: UserItem) {
  editingId.value = record.id;
  Object.assign(formState, {
    username: record.username,
    password: '',
    nickname: record.nickname,
    email: record.email ?? undefined,
    mobile: record.mobile ?? undefined,
    avatar: record.avatar ?? undefined,
    deptId: record.deptId ?? undefined,
    status: record.status,
  });
  modalOpen.value = true;

  try {
    const detail = await getUserDetailApi(record.id);
    Object.assign(formState, {
      username: detail.username,
      password: '',
      nickname: detail.nickname,
      email: detail.email ?? undefined,
      mobile: detail.mobile ?? undefined,
      avatar: detail.avatar ?? undefined,
      deptId: detail.deptId ?? undefined,
      status: detail.status,
    });
  } catch (error) {
    message.warning(getErrorMessage(error, '用户详情加载失败，已使用列表数据回填'));
  }
}

async function submitUser() {
  await formRef.value?.validate();
  saving.value = true;

  try {
    if (editingId.value) {
      await updateUserApi(editingId.value, {
        nickname: formState.nickname,
        email: formState.email,
        mobile: formState.mobile,
        avatar: formState.avatar,
        deptId: formState.deptId,
        status: formState.status,
      });
      message.success('用户已更新');
    } else {
      await createUserApi(formState);
      message.success('用户已新增');
    }

    modalOpen.value = false;
    await loadUsers();
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: ApiId) {
  try {
    await deleteUserApi(id);
    message.success('用户已删除');
    await loadUsers();
  } catch (error) {
    message.error(getErrorMessage(error, '删除用户失败'));
  }
}

function getDeptName(deptId: ApiId | null) {
  if (!deptId) {
    return '-';
  }

  return deptOptions.value.find((dept) => String(dept.id) === String(deptId))?.deptName ?? String(deptId);
}

function createEmptyForm(): UserFormState {
  return {
    username: '',
    password: '',
    nickname: '',
    status: 'ENABLED',
  };
}
</script>
