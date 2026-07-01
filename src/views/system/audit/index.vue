<template>
  <div class="biz-page biz-page--audit">
    <header class="biz-topbar"><p>{{ pageDescription }}</p><div class="biz-topbar__controls"><div class="topbar-filter"><a-input v-model:value="query.keyword" allow-clear :placeholder="'搜索' + pageTitle + '、客户、负责人'" @press-enter="loadData" /><a-select v-model:value="query.status" allow-clear placeholder="状态" @change="loadData"><a-select-option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option></a-select><a-button type="primary" @click="loadData">查询</a-button></div><a-space class="biz-topbar__actions"><a-button @click="loadData">刷新</a-button><a-button type="primary" @click="openCreate">{{ primaryAction }}</a-button></a-space></div></header><section class="audit-shell"><main><h2>审计日志</h2><a-table :columns="tableColumns" :data-source="records" :loading="loading" :pagination="false" row-key="id" size="small"><template #bodyCell="{ column, record }"><template v-if="column.key === 'title'"><a-button type="link" @click="selectRecord(record)">{{ record.title }}</a-button></template><template v-else-if="column.key === 'status'"><a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag></template></template></a-table></main><aside><h2>追踪详情</h2><p>{{ active?.description }}</p><p>{{ active?.aiSuggestion }}</p><a-button type="primary">导出链路</a-button></aside></section>
    <a-drawer v-model:open="detailOpen" width="520" :title="detailRecord?.title"><a-descriptions v-if="detailRecord" bordered :column="1" size="small"><a-descriptions-item label="编号">{{ detailRecord.code }}</a-descriptions-item><a-descriptions-item label="客户">{{ detailRecord.customer }}</a-descriptions-item><a-descriptions-item label="负责人">{{ detailRecord.owner }}</a-descriptions-item><a-descriptions-item label="状态"><a-tag :color="statusColor(detailRecord.status)">{{ detailRecord.status }}</a-tag></a-descriptions-item><a-descriptions-item label="AI 建议">{{ detailRecord.aiSuggestion }}</a-descriptions-item></a-descriptions><a-divider>闭环记录</a-divider><a-timeline v-if="detailRecord"><a-timeline-item v-for="item in detailRecord.timeline" :key="item.time + item.action"><strong>{{ item.action }}</strong><p>{{ item.content }}</p><small>{{ item.operator }} / {{ item.time }}</small></a-timeline-item></a-timeline></a-drawer><a-modal v-model:open="createOpen" :title="'新增' + pageTitle" @ok="submitCreate"><a-form layout="vertical"><a-form-item label="标题"><a-input v-model:value="formState.title" /></a-form-item><a-form-item label="客户"><a-input v-model:value="formState.customer" /></a-form-item><a-form-item label="负责人"><a-input v-model:value="formState.owner" /></a-form-item><a-form-item label="说明"><a-textarea v-model:value="formState.description" :rows="3" /></a-form-item></a-form></a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';
import type { BusinessRecord, BusinessRecordPayload, BusinessRecordStatus } from '@/api/business';
import { createBusinessRecord, getBusinessRecordList } from '@/api/business';

const moduleName = 'system-audit';
const pageTitle = '审计中心';
const pageDescription = '审计操作日志、登录日志、敏感动作、追踪筛选、导出、详情和异常行为标记。';
const primaryAction = '导出审计';
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
  aiSuggestion: '审计中心已生成 AI 建议，请优先处理高风险记录。',
  tags: [pageTitle],
});
const tableColumns: TableColumnsType<BusinessRecord> = [
  { title: '业务项', dataIndex: 'title', key: 'title' },
  { title: '客户', dataIndex: 'customer', key: 'customer', width: 130 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '风险', dataIndex: 'risk', key: 'risk', width: 110 },
];
async function loadData() {
  loading.value = true;
  try {
    const page = await getBusinessRecordList({ module: moduleName, keyword: query.keyword, status: query.status, pageSize: 20 });
    records.value = page.records;
    active.value = page.records[0];
  } finally {
    loading.value = false;
  }
}
function selectRecord(record?: BusinessRecord) {
  if (!record) return;
  active.value = record;
  detailRecord.value = record;
  detailOpen.value = true;
}
function openCreate() {
  Object.assign(formState, {
    module: moduleName,
    title: pageTitle + '新记录',
    owner: '陈沐阳',
    customer: '蓝湖集团',
    channel: pageTitle,
    status: '待处理',
    priority: '高',
    metric: '-',
    risk: '中风险',
    description: pageDescription,
    aiSuggestion: '审计中心已生成 AI 建议，请优先处理高风险记录。',
    tags: [pageTitle],
  });
  createOpen.value = true;
}
async function submitCreate() {
  if (!formState.title.trim()) {
    message.warning('请输入标题');
    return;
  }
  await createBusinessRecord(formState);
  message.success('记录已创建');
  createOpen.value = false;
  await loadData();
}
function statusColor(status: BusinessRecordStatus) {
  const map: Record<BusinessRecordStatus, string> = { 待处理: 'default', 处理中: 'processing', 待审核: 'warning', 已完成: 'success', 已暂停: 'orange', 已关闭: 'default' };
  return map[status];
}
onMounted(loadData);
</script>

<style scoped lang="scss">
.biz-page { display: flex; flex-direction: column; gap: 16px; min-width: 1180px; color: var(--app-text); }
.biz-topbar, section > aside, section > main, .call-stage { background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 8px; box-shadow: 0 10px 26px rgba(15,23,42,.06); }
.biz-topbar { display: flex; align-items: center; gap: 18px; padding: 14px 18px; }
.biz-topbar p { flex: 0 1 420px; min-width: 240px; margin: 0; color: var(--app-text-secondary); font-weight: 600; line-height: 1.7; }
p, small { color: var(--app-text-secondary); }
.biz-topbar__controls { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex: 1; min-width: 0; }
.topbar-filter { display: grid; grid-template-columns: minmax(220px, 1fr) 150px auto; gap: 10px; flex: 1; max-width: 760px; min-width: 0; }
.biz-topbar__actions { flex: 0 0 auto; }
.call-shell, .chat-shell, .mail-shell, .sms-shell, .inbox-shell, .agent-shell, .schedule-shell, .performance-shell, .quality-shell, .training-shell, .customer-shell, .journey-shell, .ai-agent-shell, .workflow-shell, .prompt-shell, .model-shell, .analytics-shell, .bi-shell, .cockpit-shell, .sla-shell, .risk-shell, .monitor-shell, .alert-shell, .permission-shell, .audit-shell, .settings-shell, .platform-shell, .ticket-shell { display: grid; gap: 16px; }
.call-shell { grid-template-columns: 300px minmax(0, 1fr) 300px; } .chat-shell { grid-template-columns: 280px minmax(0, 1fr) 320px; } .mail-shell { grid-template-columns: 320px minmax(0, 1fr) 300px; }
.sms-shell, .performance-shell, .training-shell, .journey-shell, .ai-agent-shell, .model-shell, .cockpit-shell, .sla-shell, .risk-shell, .monitor-shell, .audit-shell, .platform-shell, .ticket-shell { grid-template-columns: minmax(0, 1fr) 320px; }
.inbox-shell, .analytics-shell, .permission-shell, .settings-shell { grid-template-columns: 220px minmax(0, 1fr) 320px; } .quality-shell, .workflow-shell, .prompt-shell, .bi-shell, .alert-shell { grid-template-columns: 260px minmax(0, 1fr) 320px; } .agent-shell, .schedule-shell { grid-template-columns: minmax(0, 1fr) 300px; }
section > aside, section > main, .call-stage { padding: 16px; min-width: 0; }
.queue-lanes article, .mail-list button, .session-list button, .inbox-shell main article, .alert-shell main article, .sla-shell main article, .model-shell main article, .app-grid article, .agent-card-grid article, .course-grid article, .status-wall article, .performance-shell main article, .ticket-shell aside button { display: block; width: 100%; padding: 12px; margin-bottom: 10px; text-align: left; background: var(--app-surface-muted); border: 1px solid var(--app-border); border-radius: 8px; }
button { font: inherit; } .active { border-color: var(--app-primary) !important; box-shadow: inset 3px 0 0 var(--app-primary); }
.call-control { padding: 18px; background: linear-gradient(135deg, rgba(79,123,255,.14), rgba(0,229,255,.08)); border-radius: 8px; } .ivr-map, .campaign-grid, .status-wall, .shift-calendar, .course-grid, .agent-card-grid, .chart-matrix, .cockpit-grid, .health-grid, .app-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
.ivr-map article, .campaign-grid article, .shift-calendar article, .workflow-canvas article, .chart-matrix article, .cockpit-grid article, .health-grid article, .customer-shell main article, .settings-shell main article { padding: 14px; background: var(--app-surface-muted); border: 1px solid var(--app-border); border-radius: 8px; }
.agent-wall span, .inbox-shell aside span, .permission-tree label, .settings-shell aside span, .customer-shell aside span, .training-shell aside span, .analytics-shell aside span, .alert-shell aside span { display: block; padding: 8px 10px; margin-bottom: 8px; background: var(--app-surface-muted); border-radius: 8px; }
.message-stream { min-height: 360px; padding: 12px; background: var(--app-surface-muted); border-radius: 8px; } .bubble { max-width: 72%; padding: 10px 12px; border-radius: 8px; background: var(--app-surface); } .bubble.agent, .bubble.ai { margin-left: auto; }
.attachment-row, .variable-row { display: flex; gap: 8px; flex-wrap: wrap; } .attachment-row span, .variable-row span { padding: 6px 10px; background: var(--app-surface-muted); border-radius: 8px; }
.demand-curve { display: flex; align-items: end; gap: 8px; padding: 16px; background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 8px; } .demand-curve div { width: 28px; background: var(--app-primary); border-radius: 6px 6px 0 0; }
.workflow-canvas { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: center; gap: 14px; } .workflow-canvas article { min-height: 120px; display: grid; place-items: center; border-color: rgba(79,123,255,.35); }
.big-kpi strong, .score { display: block; font-size: 54px; line-height: 1; } .risk-lanes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; } .risk-lanes article { padding: 14px; background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 8px; }
.health-grid .pulse, .chart-matrix article div { height: 8px; margin-top: 16px; background: linear-gradient(90deg, var(--app-primary), var(--app-accent)); border-radius: 999px; }
@media (max-width: 1360px) { .biz-page { min-width: 980px; } .call-shell, .chat-shell, .mail-shell, .sms-shell, .inbox-shell, .agent-shell, .schedule-shell, .performance-shell, .quality-shell, .training-shell, .customer-shell, .journey-shell, .ai-agent-shell, .workflow-shell, .prompt-shell, .model-shell, .analytics-shell, .bi-shell, .cockpit-shell, .sla-shell, .risk-shell, .monitor-shell, .alert-shell, .permission-shell, .audit-shell, .settings-shell, .platform-shell, .ticket-shell { grid-template-columns: 1fr; } }
</style>
