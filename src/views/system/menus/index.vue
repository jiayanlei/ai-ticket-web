<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">菜单管理</h1>
        <p class="page-description">维护菜单结构、路由映射和权限标识；后端返回平铺列表，前端按 parentId 组装树。</p>
      </div>
      <a-space>
        <a-button @click="loadMenus">刷新</a-button>
        <a-button type="primary" @click="openCreate">新增菜单</a-button>
      </a-space>
    </div>

    <a-card :bordered="false">
      <div class="system-page__filters">
        <a-input v-model:value="query.menuName" allow-clear placeholder="菜单名称" @press-enter="handleSearch" />
        <a-select v-model:value="query.menuType" allow-clear placeholder="类型">
          <a-select-option value="DIR">目录</a-select-option>
          <a-select-option value="MENU">菜单</a-select-option>
          <a-select-option value="BUTTON">按钮</a-select-option>
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
        :data-source="menuTree"
        :default-expand-all-rows="true"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'menuType'">
            <a-tag :color="getMenuTypeColor(record.menuType)">{{ getMenuTypeText(record.menuType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'visible'">
            <a-tag :color="record.visible ? 'green' : 'default'">{{ record.visible ? '显示' : '隐藏' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'ENABLED' ? 'green' : 'default'">
              {{ record.status === 'ENABLED' ? '启用' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a @click="openEdit(record)">编辑</a>
              <a-popconfirm title="确认删除该菜单？若存在子菜单，后端当前不会校验引用。" @confirm="handleDelete(record.id)">
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
      :title="editingId ? '编辑菜单' : '新增菜单'"
      destroy-on-close
      width="720px"
      @ok="submitMenu"
    >
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="父级菜单" name="parentId">
              <a-tree-select
                v-model:value="formState.parentId"
                :tree-data="parentTreeData"
                allow-clear
                placeholder="请选择父级菜单"
                tree-default-expand-all
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="菜单类型" name="menuType">
              <a-select v-model:value="formState.menuType">
                <a-select-option value="DIR">目录</a-select-option>
                <a-select-option value="MENU">菜单</a-select-option>
                <a-select-option value="BUTTON">按钮</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="菜单名称" name="menuName">
              <a-input v-model:value="formState.menuName" placeholder="请输入菜单名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="图标" name="icon">
              <a-input v-model:value="formState.icon" placeholder="例如 user、setting" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="路由地址" name="path">
              <a-input v-model:value="formState.path" placeholder="例如 /system/users" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="组件路径" name="component">
              <a-input v-model:value="formState.component" placeholder="例如 system/user/index" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="权限标识" name="perms">
              <a-input v-model:value="formState.perms" placeholder="例如 system:user:list" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序" name="sortOrder">
              <a-input-number v-model:value="formState.sortOrder" :min="0" :precision="0" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="显示" name="visible">
              <a-switch v-model:checked="formState.visible" checked-children="显示" un-checked-children="隐藏" />
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
  createMenuApi,
  deleteMenuApi,
  getMenuDetailApi,
  getMenuListApi,
  updateMenuApi,
} from '@/api/menu';
import type { MenuItem, MenuPayload, MenuQueryParams, MenuType } from '@/api/menu';
import type { ApiId, CommonStatus } from '@/api/types';
import { getErrorMessage } from '@/utils/api-error';

interface MenuTreeItem extends MenuItem {
  children?: MenuTreeItem[];
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
const menus = ref<MenuItem[]>([]);
const query = reactive<MenuQueryParams>({});
const formState = reactive<MenuPayload & { menuType: MenuType; status: CommonStatus; visible: boolean }>(
  createEmptyForm(),
);

const menuTypeTextMap: Record<MenuType, string> = {
  DIR: '目录',
  MENU: '菜单',
  BUTTON: '按钮',
};
const menuTypeColorMap: Record<MenuType, string> = {
  DIR: 'blue',
  MENU: 'green',
  BUTTON: 'purple',
};
const columns: TableColumnsType<MenuTreeItem> = [
  { title: '菜单名称', dataIndex: 'menuName', key: 'menuName', width: 180 },
  { title: '类型', dataIndex: 'menuType', key: 'menuType', width: 90 },
  { title: '路由地址', dataIndex: 'path', key: 'path', width: 180 },
  { title: '组件路径', dataIndex: 'component', key: 'component', width: 180 },
  { title: '权限标识', dataIndex: 'perms', key: 'perms', width: 180 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
  { title: '显示', dataIndex: 'visible', key: 'visible', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '操作', key: 'action', fixed: 'right', width: 120 },
];

const rules: Record<string, Rule[]> = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
};

const menuTree = computed(() => buildTree(menus.value));
const parentTreeData = computed<TreeSelectNode[]>(() => [
  {
    title: '根目录',
    value: 0,
    children: toTreeSelectNodes(filterParentCandidates(menuTree.value, editingId.value)),
  },
]);

onMounted(loadMenus);

async function loadMenus() {
  loading.value = true;

  try {
    menus.value = await getMenuListApi(query);
  } catch (error) {
    message.error(getErrorMessage(error, '菜单列表加载失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void loadMenus();
}

function resetQuery() {
  query.menuName = undefined;
  query.menuType = undefined;
  query.status = undefined;
  handleSearch();
}

function openCreate() {
  editingId.value = undefined;
  Object.assign(formState, createEmptyForm());
  modalOpen.value = true;
}

async function openEdit(record: MenuItem) {
  editingId.value = record.id;
  Object.assign(formState, toForm(record));
  modalOpen.value = true;

  try {
    Object.assign(formState, toForm(await getMenuDetailApi(record.id)));
  } catch (error) {
    message.warning(getErrorMessage(error, '菜单详情加载失败，已使用列表数据回填'));
  }
}

async function submitMenu() {
  await formRef.value?.validate();
  saving.value = true;

  try {
    if (editingId.value) {
      await updateMenuApi(editingId.value, formState);
      message.success('菜单已更新');
    } else {
      await createMenuApi(formState);
      message.success('菜单已新增');
    }

    modalOpen.value = false;
    await loadMenus();
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: ApiId) {
  try {
    await deleteMenuApi(id);
    message.success('菜单已删除');
    await loadMenus();
  } catch (error) {
    message.error(getErrorMessage(error, '删除菜单失败'));
  }
}

function buildTree(list: MenuItem[]) {
  const nodeMap = new Map<string, MenuTreeItem>();
  const roots: MenuTreeItem[] = [];

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

function sortByOrder(a: MenuTreeItem, b: MenuTreeItem) {
  const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

  if (orderDiff !== 0) {
    return orderDiff;
  }

  return String(a.id).localeCompare(String(b.id));
}

function toTreeSelectNodes(list: MenuTreeItem[]): TreeSelectNode[] {
  return list
    .filter((item) => item.menuType !== 'BUTTON')
    .map((item) => ({
      title: item.menuName,
      value: item.id,
      children: item.children ? toTreeSelectNodes(item.children) : undefined,
    }));
}

function filterParentCandidates(list: MenuTreeItem[], blockedId?: ApiId): MenuTreeItem[] {
  return list
    .filter((item) => String(item.id) !== String(blockedId))
    .map((item) => ({
      ...item,
      children: item.children ? filterParentCandidates(item.children, blockedId) : undefined,
    }));
}

function getMenuTypeText(menuType: MenuType) {
  return menuTypeTextMap[menuType];
}

function getMenuTypeColor(menuType: MenuType) {
  return menuTypeColorMap[menuType];
}

function toForm(menu: MenuItem): MenuPayload & { menuType: MenuType; status: CommonStatus; visible: boolean } {
  return {
    parentId: menu.parentId,
    menuName: menu.menuName,
    menuType: menu.menuType,
    path: menu.path ?? undefined,
    component: menu.component ?? undefined,
    perms: menu.perms ?? undefined,
    icon: menu.icon ?? undefined,
    sortOrder: menu.sortOrder,
    visible: menu.visible,
    status: menu.status,
  };
}

function createEmptyForm(): MenuPayload & { menuType: MenuType; status: CommonStatus; visible: boolean } {
  return {
    parentId: 0,
    menuName: '',
    menuType: 'MENU',
    path: '',
    component: '',
    perms: '',
    icon: '',
    sortOrder: 0,
    visible: true,
    status: 'ENABLED',
  };
}
</script>
