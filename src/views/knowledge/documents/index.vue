<template>
  <div class="document-center-page">
    <aside class="document-sidebar">
      <div class="document-sidebar__header">
        <strong>文件目录</strong>
        <span>按业务资料分类管理</span>
      </div>
      <button
        v-for="item in directories"
        :key="item.key"
        type="button"
        class="directory-item"
        :class="{ 'directory-item--active': activeDirectory === item.key }"
        @click="selectDirectory(item.key)"
      >
        <span>{{ item.title }}</span>
        <em>{{ getDirectoryCount(item.key) }}</em>
        <small>{{ item.description }}</small>
      </button>
    </aside>

    <main class="document-main">
      <section class="document-toolbar">
        <div class="document-toolbar__filters">
          <a-input
            v-model:value="keyword"
            allow-clear
            class="document-search"
            placeholder="搜索文件名称、上传人、摘要"
            @press-enter="applyFilters"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
          <a-range-picker v-model:value="dateRange" value-format="YYYY-MM-DD" @change="applyFilters" />
        </div>
        <div class="document-toolbar__actions">
          <a-button @click="resetFilters">重置</a-button>
          <a-upload :show-upload-list="false" :custom-request="handleUpload">
            <a-button type="primary">
              <UploadOutlined />
              上传文件
            </a-button>
          </a-upload>
        </div>
      </section>

      <a-table
        :columns="columns"
        :data-source="filteredDocuments"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'fileName'">
            <div class="file-name-cell">
              <FileTextOutlined />
              <div>
                <strong>{{ record.fileName }}</strong>
                <span>{{ record.summary }}</span>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'parseStatus'">
            <a-tag :color="statusColor(record.parseStatus)">{{ statusLabel(record.parseStatus) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="previewDocument(record)">查看</a-button>
              <a-popconfirm title="确认删除该文件吗？" ok-text="删除" cancel-text="取消" @confirm="deleteDocument(record)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </main>

    <a-drawer v-model:open="detailOpen" width="520" :title="detailRecord?.fileName || '文件详情'">
      <a-descriptions v-if="detailRecord" :column="1" bordered size="small">
        <a-descriptions-item label="文件名称">{{ detailRecord.fileName }}</a-descriptions-item>
        <a-descriptions-item label="文件目录">{{ detailRecord.category }}</a-descriptions-item>
        <a-descriptions-item label="上传人">{{ detailRecord.owner }}</a-descriptions-item>
        <a-descriptions-item label="文件大小">{{ detailRecord.size }}</a-descriptions-item>
        <a-descriptions-item label="文件格式">{{ detailRecord.format }}</a-descriptions-item>
        <a-descriptions-item label="操作日期">{{ detailRecord.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="解析状态">
          <a-tag :color="statusColor(detailRecord.parseStatus)">{{ statusLabel(detailRecord.parseStatus) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="摘要">{{ detailRecord.summary }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { TableColumnsType } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/es/vc-upload/interface';
import { message } from 'ant-design-vue';
import { FileTextOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons-vue';

import {
  createDocumentCenterItemApi,
  deleteDocumentCenterItemApi,
  getDocumentCenterListApi,
  getDocumentDirectoriesApi,
  type DocumentCenterItem,
  type DocumentDirectoryItem,
} from '@/api/document';

const loading = ref(false);
const documents = ref<DocumentCenterItem[]>([]);
const directories = ref<DocumentDirectoryItem[]>([]);
const activeDirectory = ref('all');
const keyword = ref('');
const dateRange = ref<[string, string]>();
const detailOpen = ref(false);
const detailRecord = ref<DocumentCenterItem>();

const columns: TableColumnsType<DocumentCenterItem> = [
  { title: '文件名称', dataIndex: 'fileName', key: 'fileName', width: 300 },
  { title: '操作日期', dataIndex: 'updateTime', key: 'updateTime', width: 170 },
  { title: '上传人', dataIndex: 'owner', key: 'owner', width: 110 },
  { title: '文件大小', dataIndex: 'size', key: 'size', width: 100 },
  { title: '文件格式', dataIndex: 'format', key: 'format', width: 100 },
  { title: '目录', dataIndex: 'category', key: 'category', width: 120 },
  { title: '解析状态', dataIndex: 'parseStatus', key: 'parseStatus', width: 110 },
  { title: '操作', key: 'action', fixed: 'right', width: 130 },
];

const pagination = {
  pageSize: 10,
  showTotal: (total: number) => `共 ${total} 个文件`,
};

const filteredDocuments = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  const [startDate, endDate] = dateRange.value ?? [];

  return documents.value.filter((item) => {
    const inDirectory = activeDirectory.value === 'all' || item.category === activeDirectory.value;
    const inKeyword =
      !text || [item.fileName, item.owner, item.summary, item.category, item.format].join(' ').toLowerCase().includes(text);
    const date = item.updateTime.slice(0, 10);
    const inDateRange = (!startDate || date >= startDate) && (!endDate || date <= endDate);
    return inDirectory && inKeyword && inDateRange;
  });
});

onMounted(async () => {
  await Promise.all([loadDirectories(), loadDocuments()]);
});

async function loadDirectories() {
  directories.value = await getDocumentDirectoriesApi();
}

async function loadDocuments() {
  loading.value = true;
  try {
    documents.value = await getDocumentCenterListApi();
  } finally {
    loading.value = false;
  }
}

function selectDirectory(key: string) {
  activeDirectory.value = key;
}

function applyFilters() {
  // v-model 已经完成筛选条件更新，这里保留给回车和日期变更作为明确刷新反馈点。
}

function resetFilters() {
  keyword.value = '';
  dateRange.value = undefined;
  activeDirectory.value = 'all';
}

async function handleUpload(options: UploadRequestOption) {
  const file = options.file;
  if (!(file instanceof File)) {
    options.onError?.(new Error('请选择有效文件'));
    return;
  }

  try {
    await createDocumentCenterItemApi({
      fileName: file.name,
      category: activeDirectory.value === 'all' ? '培训资料' : activeDirectory.value,
      size: formatFileSize(file.size),
      format: getFileFormat(file.name),
    });
    await loadDocuments();
    options.onSuccess?.({});
    message.success('文件已上传到文档中心');
  } catch (error) {
    options.onError?.(error instanceof Error ? error : new Error('上传失败'));
  }
}

async function deleteDocument(record: DocumentCenterItem) {
  await deleteDocumentCenterItemApi(record.id);
  await loadDocuments();
  message.success('文件已删除');
}

function previewDocument(record: DocumentCenterItem) {
  detailRecord.value = record;
  detailOpen.value = true;
}

function getDirectoryCount(key: string) {
  if (key === 'all') {
    return documents.value.length;
  }

  return documents.value.filter((item) => item.category === key).length;
}

function statusLabel(status: DocumentCenterItem['parseStatus']) {
  const labels: Record<DocumentCenterItem['parseStatus'], string> = {
    UPLOADING: '上传中',
    PARSING: '解析中',
    SUCCESS: '已入库',
    FAILED: '失败',
  };
  return labels[status];
}

function statusColor(status: DocumentCenterItem['parseStatus']) {
  const colors: Record<DocumentCenterItem['parseStatus'], string> = {
    UPLOADING: 'blue',
    PARSING: 'gold',
    SUCCESS: 'green',
    FAILED: 'red',
  };
  return colors[status];
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getFileFormat(fileName: string) {
  const ext = fileName.split('.').pop();
  return ext ? ext.toUpperCase() : 'UNKNOWN';
}
</script>

<style scoped lang="scss">
.document-center-page {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 14px;
  height: 100%;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  background: var(--app-bg);
}

.document-sidebar,
.document-main {
  min-width: 0;
  min-height: 0;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 10px;
}

.document-sidebar {
  padding: 14px;
  overflow: auto;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;

    strong {
      font-size: 16px;
      color: var(--app-text);
    }

    span {
      font-size: 12px;
      color: var(--app-text-secondary);
    }
  }
}

.directory-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 8px;
  width: 100%;
  padding: 11px 12px;
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;

  span {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    min-width: 26px;
    padding: 0 8px;
    font-size: 12px;
    font-style: normal;
    color: var(--app-primary);
    text-align: center;
    background: var(--app-primary-bg);
    border-radius: 999px;
  }

  small {
    grid-column: 1 / -1;
    overflow: hidden;
    color: var(--app-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover,
  &--active {
    background: var(--app-primary-bg);
  }
}

.document-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  overflow: hidden;
}

.document-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;

  &__filters,
  &__actions {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }
}

.document-search {
  width: 300px;
}

.file-name-cell {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;

  > span {
    flex-shrink: 0;
    margin-top: 3px;
    color: var(--app-primary);
  }

  div {
    min-width: 0;
  }

  strong,
  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--app-text);
  }

  span {
    max-width: 340px;
    font-size: 12px;
    color: var(--app-text-secondary);
  }
}

@media (max-width: 960px) {
  .document-center-page {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .document-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .document-toolbar__filters,
  .document-toolbar__actions {
    flex-wrap: wrap;
  }
}
</style>
