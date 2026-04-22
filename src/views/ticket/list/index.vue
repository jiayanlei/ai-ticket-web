<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">工单列表</h1>
        <p class="page-description">工单状态在列表内部通过统计、筛选和 tabs 管理，左侧菜单不再拆分状态入口。</p>
      </div>
      <a-button type="primary">新建工单</a-button>
    </div>

    <div class="stat-grid">
      <a-card v-for="item in statusStats" :key="item.status" :bordered="false">
        <a-statistic :title="item.status" :value="item.count" suffix="件" />
      </a-card>
    </div>

    <a-card :bordered="false">
      <div class="ticket-list__filters">
        <a-input-search v-model:value="keyword" placeholder="搜索工单编号、标题、提交人" allow-clear />
        <a-select v-model:value="priority" placeholder="优先级" allow-clear>
          <a-select-option value="high">高</a-select-option>
          <a-select-option value="medium">中</a-select-option>
          <a-select-option value="low">低</a-select-option>
        </a-select>
        <a-range-picker />
        <a-button>重置</a-button>
        <a-button type="primary">查询</a-button>
      </div>

      <a-tabs v-model:active-key="activeStatus">
        <a-tab-pane key="all" tab="全部" />
        <a-tab-pane key="pending" tab="待处理" />
        <a-tab-pane key="processing" tab="处理中" />
        <a-tab-pane key="completed" tab="已完成" />
        <a-tab-pane key="closed" tab="已关闭" />
      </a-tabs>

      <a-table :columns="columns" :data-source="tableData" :pagination="{ pageSize: 5 }" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColorMap[record.status]">{{ record.status }}</a-tag>
          </template>
          <template v-if="column.key === 'priority'">
            <a-tag :color="priorityColorMap[record.priority]">{{ record.priority }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a>查看</a>
              <a>分派</a>
              <a>AI 分析</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';
import { ref } from 'vue';

const activeStatus = ref('all');
const keyword = ref('');
const priority = ref<string>();

const statusStats = [
  { status: '待处理', count: 18 },
  { status: '处理中', count: 27 },
  { status: '已完成', count: 146 },
  { status: '已关闭', count: 64 },
];

const columns: TableColumnsType = [
  { title: '工单编号', dataIndex: 'code', key: 'code', width: 140 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '提交人', dataIndex: 'creator', key: 'creator', width: 120 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: 'AI 分类', dataIndex: 'category', key: 'category', width: 140 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 180 },
];

const tableData = [
  {
    id: 1,
    code: 'TK-20260422-001',
    title: '企业客户无法提交报销审批',
    creator: '王明',
    priority: '高',
    status: '待处理',
    category: '流程异常',
    createdAt: '2026-04-22 09:35',
  },
  {
    id: 2,
    code: 'TK-20260422-002',
    title: '知识库搜索结果不准确',
    creator: '李娜',
    priority: '中',
    status: '处理中',
    category: '知识检索',
    createdAt: '2026-04-22 10:12',
  },
  {
    id: 3,
    code: 'TK-20260421-018',
    title: '移动端附件预览失败',
    creator: '周强',
    priority: '低',
    status: '已完成',
    category: '附件服务',
    createdAt: '2026-04-21 16:20',
  },
];

const statusColorMap: Record<string, string> = {
  待处理: 'orange',
  处理中: 'blue',
  已完成: 'green',
  已关闭: 'default',
};

const priorityColorMap: Record<string, string> = {
  高: 'red',
  中: 'gold',
  低: 'green',
};
</script>

<style scoped lang="scss">
.ticket-list {
  &__filters {
    display: grid;
    grid-template-columns: minmax(220px, 1.5fr) minmax(140px, 0.6fr) minmax(260px, 1fr) auto auto;
    gap: 12px;
    margin-bottom: 12px;
  }
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
