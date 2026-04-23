<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">部门管理</h1>
        <p class="page-description">维护部门平铺数据并按 parentId 组装组织树。</p>
      </div>
      <a-space>
        <a-button @click="loadDepts">刷新</a-button>
        <a-button type="primary" @click="openCreate">新增部门</a-button>
      </a-space>
    </div>

    <a-card :bordered="false">
      <div class="system-page__filters">
        <a-input v-model:value="query.deptName" allow-clear placeholder="部门名称" @press-enter="handleSearch" />
        <a-input v-model:value="query.deptCode" allow-clear placeholder="部门编码" @press-enter="handleSearch" />
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
        :data-source="deptTree"
        :default-expand-all-rows="true"
        :loading="loading"
        :pagination="false"
        row-key="id"
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
              <a-popconfirm title="确认删除该部门？后端当前不会校验子部门或用户引用。" @confirm="handleDelete(record.id)">
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
      :title="editingId ? '编辑部门' : '新增部门'"
      destroy-on-close
      @ok="submitDept"
    >
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="父级部门" name="parentId">
              <a-tree-select
                v-model:value="formState.parentId"
                :tree-data="parentTreeData"
                allow-clear
                placeholder="请选择父级部门"
                tree-default-expand-all
              />
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
          <a-col :span="12">
            <a-form-item label="部门名称" name="deptName">
              <a-input v-model:value="formState.deptName" placeholder="请输入部门名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="部门编码" name="deptCode">
              <a-input v-model:value="formState.deptCode" placeholder="请输入部门编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="负责人" name="leader">
              <a-input v-model:value="formState.leader" placeholder="请输入负责人" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序" name="sortOrder">
              <a-input-number v-model:value="formState.sortOrder" :min="0" :precision="0" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="联系电话" name="phone">
              <a-input v-model:value="formState.phone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱" name="email">
              <a-input v-model:value="formState.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';
import { computed, onMounted, reactive, ref } from 'vue';

import {
  createDeptApi,
  deleteDeptApi,
  getDeptDetailApi,
  getDeptListApi,
  updateDeptApi,
} from '@/api/dept';
import type { DeptItem, DeptPayload, DeptQueryParams } from '@/api/dept';
import type { ApiId, CommonStatus } from '@/api/types';
import { getErrorMessage } from '@/utils/api-error';

interface DeptTreeItem extends DeptItem {
  children?: DeptTreeItem[];
}

interface TreeSelectNode {
  title: string;
  value: ApiId;
  children?: TreeSelectNode[];
}

const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editingId = ref<ApiId>();
const formRef = ref<FormInstance>();
const depts = ref<DeptItem[]>([]);
const query = reactive<DeptQueryParams>({});
const formState = reactive<DeptPayload & { status: CommonStatus }>(createEmptyForm());

const columns: TableColumnsType<DeptTreeItem> = [
  { title: '部门名称', dataIndex: 'deptName', key: 'deptName', width: 180 },
  { title: '部门编码', dataIndex: 'deptCode', key: 'deptCode', width: 140 },
  { title: '负责人', dataIndex: 'leader', key: 'leader', width: 120 },
  { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', fixed: 'right', width: 120 },
];

const rules: Record<string, Rule[]> = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  deptCode: [{ required: true, message: '请输入部门编码', trigger: 'blur' }],
};

const deptTree = computed(() => buildTree(depts.value));
const parentTreeData = computed<TreeSelectNode[]>(() => [
  {
    title: '根部门',
    value: 0,
    children: toTreeSelectNodes(filterParentCandidates(deptTree.value, editingId.value)),
  },
]);

onMounted(loadDepts);

async function loadDepts() {
  loading.value = true;

  try {
    depts.value = await getDeptListApi(query);
  } catch (error) {
    message.error(getErrorMessage(error, '部门列表加载失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void loadDepts();
}

function resetQuery() {
  query.deptName = undefined;
  query.deptCode = undefined;
  query.status = undefined;
  handleSearch();
}

function openCreate() {
  editingId.value = undefined;
  Object.assign(formState, createEmptyForm());
  modalOpen.value = true;
}

async function openEdit(record: DeptItem) {
  editingId.value = record.id;
  Object.assign(formState, toForm(record));
  modalOpen.value = true;

  try {
    Object.assign(formState, toForm(await getDeptDetailApi(record.id)));
  } catch (error) {
    message.warning(getErrorMessage(error, '部门详情加载失败，已使用列表数据回填'));
  }
}

async function submitDept() {
  await formRef.value?.validate();
  saving.value = true;

  try {
    if (editingId.value) {
      await updateDeptApi(editingId.value, formState);
      message.success('部门已更新');
    } else {
      await createDeptApi(formState);
      message.success('部门已新增');
    }

    modalOpen.value = false;
    await loadDepts();
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: ApiId) {
  try {
    await deleteDeptApi(id);
    message.success('部门已删除');
    await loadDepts();
  } catch (error) {
    message.error(getErrorMessage(error, '删除部门失败'));
  }
}

function buildTree(list: DeptItem[]) {
  const nodeMap = new Map<string, DeptTreeItem>();
  const roots: DeptTreeItem[] = [];

  list.forEach((item) => {
    nodeMap.set(String(item.id), { ...item });
  });

  nodeMap.forEach((node) => {
    const parent = nodeMap.get(String(node.parentId));

    if (parent && String(node.id) !== String(parent.id)) {
      parent.children = parent.children ?? [];
      parent.children.push(node);
      return;
    }

    roots.push(node);
  });

  return roots.sort(sortByOrder);
}

function sortByOrder(a: DeptTreeItem, b: DeptTreeItem) {
  const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

  if (orderDiff !== 0) {
    return orderDiff;
  }

  return String(a.id).localeCompare(String(b.id));
}

function toTreeSelectNodes(list: DeptTreeItem[]): TreeSelectNode[] {
  return list.map((item) => ({
    title: item.deptName,
    value: item.id,
    children: item.children ? toTreeSelectNodes(item.children) : undefined,
  }));
}

function filterParentCandidates(list: DeptTreeItem[], blockedId?: ApiId): DeptTreeItem[] {
  return list
    .filter((item) => String(item.id) !== String(blockedId))
    .map((item) => ({
      ...item,
      children: item.children ? filterParentCandidates(item.children, blockedId) : undefined,
    }));
}

function toForm(dept: DeptItem): DeptPayload & { status: CommonStatus } {
  return {
    parentId: dept.parentId,
    deptName: dept.deptName,
    deptCode: dept.deptCode,
    leader: dept.leader ?? undefined,
    phone: dept.phone ?? undefined,
    email: dept.email ?? undefined,
    sortOrder: dept.sortOrder,
    status: dept.status,
  };
}

function createEmptyForm(): DeptPayload & { status: CommonStatus } {
  return {
    parentId: 0,
    deptName: '',
    deptCode: '',
    leader: '',
    phone: '',
    email: '',
    sortOrder: 0,
    status: 'ENABLED',
  };
}
</script>
