<template>
  <div class="biz-page biz-page--customer">
    <header class="biz-topbar">
      <p>{{ pageDescription }}</p>
      <div class="biz-topbar__controls">
        <div class="topbar-filter">
          <a-input
            v-model:value="query.keyword"
            allow-clear
            :placeholder="'搜索' + pageTitle + '、客户、负责人'"
            @press-enter="loadData()"
          />
          <a-select v-model:value="query.status" allow-clear placeholder="状态" @change="loadData()">
            <a-select-option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
          </a-select>
          <a-button type="primary" :loading="loading" @click="loadData()">查询</a-button>
        </div>
        <a-space class="biz-topbar__actions">
          <a-button :loading="loading" @click="loadData()">刷新</a-button>
          <a-button type="primary" @click="openCreate">{{ primaryAction }}</a-button>
        </a-space>
      </div>
    </header>

    <section class="customer-panel customer-switcher">
      <div class="section-head">
        <h2>客户切换</h2>
        <span>{{ records.length }} 条跟进记录</span>
      </div>
      <a-skeleton v-if="loading && !records.length" active :paragraph="{ rows: 2 }" />
      <div v-else-if="records.length" class="customer-chip-row">
        <button
          v-for="item in records"
          :key="item.id"
          class="customer-chip"
          :class="{ active: String(active?.id) === String(item.id) }"
          type="button"
          @click="selectRecord(item)"
        >
          <strong>{{ item.customer }}</strong>
          <span>{{ item.title }}</span>
          <small>
            <a-tag :color="riskColor(item.risk)">{{ item.risk }}</a-tag>
            <a-tag :color="statusColor(item.status)">{{ item.status }}</a-tag>
            {{ item.owner }}
          </small>
        </button>
      </div>
      <a-empty v-else description="暂无客户跟进记录">
        <a-button type="primary" @click="openCreate">新建跟进</a-button>
      </a-empty>
    </section>

    <template v-if="active">
      <section class="customer-panel customer-summary">
        <div class="summary-title">
          <div>
            <h2>{{ active.customer }}</h2>
            <p>{{ active.title }}</p>
          </div>
          <a-space wrap>
            <a-tag :color="riskColor(active.risk)">{{ active.risk }}</a-tag>
            <a-tag :color="statusColor(active.status)">{{ active.status }}</a-tag>
            <a-tag :color="priorityColor(active.priority)">优先级：{{ active.priority }}</a-tag>
          </a-space>
        </div>
        <div class="summary-fields">
          <span>负责人：<strong>{{ active.owner }}</strong></span>
          <span>更新时间：<strong>{{ active.updateTime }}</strong></span>
          <span>编号：<strong>{{ active.code }}</strong></span>
        </div>
        <p class="summary-desc">说明：{{ active.description }}</p>
      </section>

      <section class="customer-panel customer-timeline">
        <div class="timeline-head">
          <h2>互动与闭环时间线</h2>
          <div class="customer-actionbar">
            <div>
              <strong>当前状态：{{ active.status }}<template v-if="nextAction">　下一步：{{ nextAction.label }}</template></strong>
              <p>{{ actionHint }}</p>
            </div>
            <a-space>
              <a-button @click="openDetail()">查看详情</a-button>
              <a-button v-if="nextAction" type="primary" @click="changeStatus(active, nextAction.status)">{{ nextAction.label }}</a-button>
            </a-space>
          </div>
        </div>
        <a-timeline>
          <a-timeline-item v-for="item in active.timeline" :key="item.time + item.action">
            <strong>{{ item.action }}</strong>
            <p>{{ item.content }}</p>
            <small>{{ item.operator }} / {{ item.time }}</small>
          </a-timeline-item>
        </a-timeline>
      </section>
    </template>

    <a-drawer v-model:open="detailOpen" width="520" :title="detailRecord?.title">
      <a-descriptions v-if="detailRecord" bordered :column="1" size="small">
        <a-descriptions-item label="编号">{{ detailRecord.code }}</a-descriptions-item>
        <a-descriptions-item label="客户">{{ detailRecord.customer }}</a-descriptions-item>
        <a-descriptions-item label="负责人">{{ detailRecord.owner }}</a-descriptions-item>
        <a-descriptions-item label="状态"><a-tag :color="statusColor(detailRecord.status)">{{ detailRecord.status }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="AI 建议">{{ detailRecord.aiSuggestion }}</a-descriptions-item>
      </a-descriptions>
      <a-divider>闭环记录</a-divider>
      <a-timeline v-if="detailRecord">
        <a-timeline-item v-for="item in detailRecord.timeline" :key="item.time + item.action">
          <strong>{{ item.action }}</strong>
          <p>{{ item.content }}</p>
          <small>{{ item.operator }} / {{ item.time }}</small>
        </a-timeline-item>
      </a-timeline>
    </a-drawer>

    <a-modal v-model:open="createOpen" :title="'新增' + pageTitle" @ok="submitCreate">
      <a-form layout="vertical">
        <a-form-item label="标题"><a-input v-model:value="formState.title" /></a-form-item>
        <a-form-item label="客户"><a-input v-model:value="formState.customer" /></a-form-item>
        <a-form-item label="负责人"><a-input v-model:value="formState.owner" /></a-form-item>
        <a-form-item label="说明"><a-textarea v-model:value="formState.description" :rows="3" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { BusinessRecord, BusinessRecordPayload, BusinessRecordPriority, BusinessRecordStatus } from '@/api/business';
import { createBusinessRecord, getBusinessRecordList, updateBusinessRecordStatus } from '@/api/business';

const moduleName = 'customers-360';
const pageTitle = '客户 360';
const pageDescription = '沉淀客户资料、工单、会话、电话、邮件、订单合同、风险标签和下一步建议。';
const primaryAction = '新建跟进';
const statusOptions = [
  { label: '待处理', value: '待处理' },
  { label: '处理中', value: '处理中' },
  { label: '待审核', value: '待审核' },
  { label: '已完成', value: '已完成' },
  { label: '已暂停', value: '已暂停' },
  { label: '已关闭', value: '已关闭' },
];
const loading = ref(false);
const records = ref<BusinessRecord[]>([]);
const active = ref<BusinessRecord>();
const detailOpen = ref(false);
const detailRecord = ref<BusinessRecord>();
const createOpen = ref(false);
const query = reactive({ keyword: '', status: undefined as BusinessRecordStatus | undefined });
const formState = reactive<BusinessRecordPayload>({
  module: moduleName,
  title: '',
  owner: '陈沐阳',
  customer: '蓝湖集团',
  channel: pageTitle,
  status: '待处理',
  priority: '高',
  metric: '-',
  risk: '中风险',
  description: pageDescription,
  aiSuggestion: '客户 360已生成 AI 建议，请优先处理高风险记录。',
  tags: [pageTitle],
});

const nextAction = computed(() => getNextAction(active.value));
const actionHint = computed(() => {
  if (!active.value) return '';
  if (nextAction.value) return '验证：动作完成后推进状态，并在时间线留下处理记录。';
  return active.value.status === '已完成' ? '该客户跟进已完成，可查看完整闭环记录。' : '当前记录暂无可推进动作，可查看详情。';
});

async function loadData(preferredId?: BusinessRecord['id']) {
  loading.value = true;
  try {
    const page = await getBusinessRecordList({ module: moduleName, keyword: query.keyword, status: query.status, pageSize: 20 });
    records.value = page.records;
    const targetId = preferredId ?? active.value?.id;
    active.value = page.records.find((item) => String(item.id) === String(targetId)) ?? page.records[0];
  } finally {
    loading.value = false;
  }
}
function selectRecord(record: BusinessRecord) {
  active.value = record;
}
function openDetail(record = active.value) {
  if (!record) return;
  detailRecord.value = record;
  detailOpen.value = true;
}
function openCreate() {
  Object.assign(formState, {
    module: moduleName,
    title: pageTitle + '新记录',
    owner: '陈沐阳',
    customer: active.value?.customer ?? '蓝湖集团',
    channel: pageTitle,
    status: '待处理',
    priority: '高',
    metric: '-',
    risk: '中风险',
    description: pageDescription,
    aiSuggestion: '客户 360已生成 AI 建议，请优先处理高风险记录。',
    tags: [pageTitle],
  });
  createOpen.value = true;
}
async function submitCreate() {
  if (!formState.title.trim()) {
    message.warning('请输入标题');
    return;
  }
  const id = await createBusinessRecord(formState);
  message.success('记录已创建');
  createOpen.value = false;
  await loadData(id);
}
async function changeStatus(record: BusinessRecord | undefined, status: BusinessRecordStatus) {
  if (!record) return;
  await updateBusinessRecordStatus(record.id, status);
  message.success('状态已更新为' + status);
  await loadData(record.id);
}
function getNextAction(record: BusinessRecord | undefined) {
  if (!record) return undefined;
  const map: Partial<Record<BusinessRecordStatus, { label: string; status: BusinessRecordStatus }>> = {
    待处理: { label: '安排回访', status: '处理中' },
    处理中: { label: '提交审核', status: '待审核' },
    待审核: { label: '标记完成', status: '已完成' },
    已暂停: { label: '恢复处理', status: '处理中' },
  };
  return map[record.status];
}
function statusColor(status: BusinessRecordStatus) {
  const map: Record<BusinessRecordStatus, string> = { 待处理: 'default', 处理中: 'processing', 待审核: 'warning', 已完成: 'success', 已暂停: 'orange', 已关闭: 'default' };
  return map[status];
}
function priorityColor(priority: BusinessRecordPriority) {
  const map: Record<BusinessRecordPriority, string> = { 低: 'default', 中: 'blue', 高: 'orange', 紧急: 'red' };
  return map[priority];
}
function riskColor(risk: string) {
  if (risk.includes('高')) return 'red';
  if (risk.includes('中')) return 'orange';
  return 'green';
}
onMounted(() => loadData());
</script>

<style scoped lang="scss">
.biz-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 1180px;
  color: var(--app-text);
}

.biz-topbar,
.customer-panel {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.biz-topbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(0, 680px);
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.biz-topbar p {
  margin: 0;
  color: var(--app-text-secondary);
  font-weight: 600;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

p,
small {
  color: var(--app-text-secondary);
}

.biz-topbar__controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.topbar-filter {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) 120px auto;
  gap: 8px;
  flex: 1;
  max-width: 520px;
  min-width: 0;
}

.biz-topbar__actions {
  flex: 0 0 auto;
}

.customer-panel {
  padding: 12px 14px;
}

.section-head,
.summary-title,
.timeline-head,
.customer-actionbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-head h2,
.customer-panel h2,
.summary-title h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 18px;
  line-height: 1.35;
}

.section-head span,
.summary-title p {
  margin: 4px 0 0;
  color: var(--app-text-secondary);
}

.customer-chip-row {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  overflow-x: auto;
}

.customer-chip {
  flex: 0 0 280px;
  display: grid;
  gap: 4px;
  min-height: 64px;
  padding: 8px 12px;
  text-align: left;
  color: var(--app-text);
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  cursor: pointer;
}

.customer-chip strong,
.customer-chip span,
.customer-chip small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-chip.active {
  border-color: var(--app-primary);
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.summary-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin-top: 8px;
}

.summary-fields span {
  color: var(--app-text-secondary);
}

.summary-fields strong {
  color: var(--app-text);
  font-weight: 600;
}

.summary-desc {
  margin: 8px 0 0;
  line-height: 1.5;
}

.timeline-head {
  align-items: flex-start;
}

.customer-timeline :deep(.ant-timeline) {
  margin-top: 10px;
  margin-bottom: 0;
}

.customer-timeline p {
  margin: 2px 0;
  line-height: 1.45;
}

.customer-actionbar {
  flex: 0 0 auto;
  max-width: 640px;
  padding-left: 16px;
  border-left: 3px solid var(--app-primary);
}

.customer-actionbar p {
  margin: 2px 0 0;
}

@media (max-width: 1360px) {
  .biz-page {
    min-width: 980px;
  }
  .topbar-filter {
    max-width: none;
  }
}
</style>
