<template>
  <div class="bi-portal-page">
    <header class="bi-toolbar">
      <div class="toolbar-head">
        <div class="toolbar-title">
          <h1>BI 报表</h1>
          <p>统一管理报表资产、订阅交付、导出任务和指标口径，确保业务数据可查、可信、可追踪。</p>
        </div>
        <a-space class="toolbar-actions">
          <a-button @click="openExportCenter">
            <template #icon><DownloadOutlined /></template>
            导出中心
          </a-button>
          <a-button @click="openSubscriptionCenter">
            <template #icon><BellOutlined /></template>
            订阅中心
          </a-button>
          <a-button type="primary" @click="openCreateWizard">
            <template #icon><PlusOutlined /></template>
            新建报表
          </a-button>
        </a-space>
      </div>

      <div class="toolbar-filters">
        <a-input
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索报表、指标、客户、负责人"
          @press-enter="loadPortal"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-range-picker v-model:value="query.range" />
        <a-select v-model:value="query.domain" allow-clear placeholder="业务域" @change="loadPortal">
          <a-select-option v-for="item in domainOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.status" allow-clear placeholder="状态" @change="loadPortal">
          <a-select-option v-for="item in statusOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.owner" allow-clear placeholder="负责人" @change="loadPortal">
          <a-select-option v-for="item in ownerOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-space class="filter-actions">
          <a-button type="primary" :loading="loading" @click="loadPortal">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button @click="resetQuery">
            <template #icon><ReloadOutlined /></template>
            重置
          </a-button>
        </a-space>
      </div>

      <div v-if="activeFilterTags.length" class="filter-tags">
        <a-tag v-for="item in activeFilterTags" :key="item" closable @close.prevent="removeFilter(item)">
          {{ item }}
        </a-tag>
        <a-button type="link" size="small" @click="resetQuery">清除全部</a-button>
      </div>
    </header>

    <section class="health-overview">
      <button
        v-for="item in healthCards"
        :key="item.key"
        class="metric-card"
        :class="`metric-card--${item.tone}`"
        type="button"
        @click="handleHealthClick(item.key)"
      >
        <span class="metric-label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <span class="metric-delta">{{ item.delta }}</span>
        <component :is="item.icon" class="metric-icon" />
      </button>
    </section>

    <section class="shortcut-section">
      <div class="section-title">
        <div>
          <h2>快捷入口</h2>
          <p>按推荐、最近使用、收藏、负责和异常状态快速进入报表。</p>
        </div>
        <a-button type="link" @click="viewMode = 'table'">查看全部报表</a-button>
      </div>

      <div class="shortcut-grid">
        <button
          v-for="group in shortcutGroups"
          :key="group.key"
          class="shortcut-card"
          :class="{ 'shortcut-card--warning': group.key === 'abnormal' }"
          type="button"
          @click="handleShortcut(group.key)"
        >
          <span class="shortcut-title">{{ group.title }}</span>
          <strong>{{ group.main.name }}</strong>
          <span class="shortcut-meta">{{ group.main.meta }}</span>
          <div class="shortcut-links">
            <span v-for="item in group.links" :key="item">{{ item }}</span>
          </div>
        </button>
      </div>
    </section>

    <section class="asset-section">
      <div class="asset-head">
        <a-tabs v-model:active-key="activeDomain" @change="loadPortal">
          <a-tab-pane v-for="item in domainTabs" :key="item" :tab="item" />
        </a-tabs>
        <div class="asset-actions">
          <a-segmented v-model:value="viewMode" :options="viewOptions" />
          <a-button :disabled="!selectedRowKeys.length" @click="batchSubscribe">批量订阅</a-button>
          <a-button :disabled="!selectedRowKeys.length" @click="batchExport">批量导出</a-button>
        </div>
      </div>

      <a-table
        v-if="viewMode === 'table'"
        class="report-table"
        :columns="reportColumns"
        :data-source="filteredReports"
        :loading="loading"
        :pagination="{ pageSize: 8, showSizeChanger: false }"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        :scroll="{ x: 1420 }"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <button class="report-name" type="button" @click="openReport(record)">
              <strong>{{ record.name }}</strong>
              <span>{{ record.description }}</span>
              <span class="report-tags">
                <a-tag v-for="tag in record.tags" :key="tag">{{ tag }}</a-tag>
              </span>
            </button>
          </template>
          <template v-else-if="column.key === 'owner'">
            <div class="owner-cell">
              <a-avatar size="small">{{ record.owner.slice(0, 1) }}</a-avatar>
              <span>{{ record.owner }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'usageCount'">
            <div class="trend-cell">
              <strong>{{ record.usageCount.toLocaleString() }}</strong>
              <span :class="record.usageTrend.startsWith('+') ? 'trend-up' : 'trend-down'">{{ record.usageTrend }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'trustScore'">
            <a-tooltip>
              <template #title>
                数据新鲜度 40% / 刷新成功率 25% / 口径一致性 25% / 使用反馈 10%
              </template>
              <div class="trust-cell">
                <strong>{{ record.trustScore }}</strong>
                <a-progress :percent="record.trustScore" :show-info="false" size="small" :status="record.trustScore < 80 ? 'exception' : 'normal'" />
              </div>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" type="link" @click="openReport(record)">打开</a-button>
              <a-button size="small" type="link" :disabled="record.status !== '已发布'" @click="openSubscribe(record)">订阅</a-button>
              <a-button size="small" type="link" :disabled="record.status === '草稿'" @click="createExportTask(record)">导出</a-button>
              <a-dropdown>
                <a-button size="small" type="link">
                  <template #icon><MoreOutlined /></template>
                </a-button>
                <template #overlay>
                  <a-menu @click="handleReportMenuClick($event, record)">
                    <a-menu-item key="metric">查看口径</a-menu-item>
                    <a-menu-item key="copy">复制报表</a-menu-item>
                    <a-menu-item key="audit">审计日志</a-menu-item>
                    <a-menu-item key="offline" :disabled="record.status === '已下线'">下线报表</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>

      <div v-else class="report-card-grid">
        <article
          v-for="record in filteredReports"
          :key="record.id"
          class="report-card"
          :class="{ 'report-card--abnormal': record.status === '异常' }"
        >
          <div class="report-card-head">
            <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
            <button class="favorite-button" type="button" @click="toggleFavorite(record)">
              <StarFilled v-if="record.favorite" />
              <StarOutlined v-else />
            </button>
          </div>
          <h3>{{ record.name }}</h3>
          <p>{{ record.description }}</p>
          <div class="card-meta">
            <span>{{ record.domain }}</span>
            <span>{{ record.owner }}</span>
            <span>{{ record.refreshTime }}</span>
          </div>
          <div class="card-trust">
            <strong>可信度 {{ record.trustScore }}</strong>
            <a-progress :percent="record.trustScore" :show-info="false" size="small" />
          </div>
          <a-button block type="primary" @click="openReport(record)">打开报表</a-button>
        </article>
      </div>
    </section>

    <a-drawer
      v-model:open="detailOpen"
      class="report-detail-drawer"
      width="1120"
      :title="activeReport?.name"
    >
      <template v-if="activeReport">
        <section class="detail-summary">
          <div>
            <div class="detail-title-line">
              <h2>{{ activeReport.name }}</h2>
              <a-tag :color="statusColor(activeReport.status)">{{ activeReport.status }}</a-tag>
              <a-tag>{{ activeReport.domain }}</a-tag>
            </div>
            <p>{{ activeReport.description }}</p>
            <div class="detail-meta">
              <span>负责人 {{ activeReport.owner }}</span>
              <span>版本 {{ activeReport.version }}</span>
              <span>数据集 {{ activeReport.datasetName }}</span>
              <span>最近刷新 {{ activeReport.refreshTime }}</span>
            </div>
          </div>
          <div class="detail-score">
            <span>可信度</span>
            <strong>{{ activeReport.trustScore }}</strong>
          </div>
        </section>

        <div class="detail-actions">
          <a-space wrap>
            <a-button @click="toggleFavorite(activeReport)">
              <template #icon><StarOutlined /></template>
              {{ activeReport.favorite ? '取消收藏' : '收藏' }}
            </a-button>
            <a-button @click="openSubscribe(activeReport)">
              <template #icon><BellOutlined /></template>
              订阅
            </a-button>
            <a-button @click="createExportTask(activeReport)">
              <template #icon><DownloadOutlined /></template>
              导出
            </a-button>
            <a-button @click="message.success('分享链接已复制')">
              <template #icon><ShareAltOutlined /></template>
              分享
            </a-button>
            <a-button type="primary" @click="message.success('已进入编辑模式')">
              <template #icon><EditOutlined /></template>
              编辑
            </a-button>
          </a-space>
        </div>

        <a-tabs v-model:active-key="activeWorkbookTab" class="workbook-tabs">
          <a-tab-pane key="overview" tab="总览" />
          <a-tab-pane key="trend" tab="趋势分析" />
          <a-tab-pane key="channel" tab="渠道分布" />
          <a-tab-pane key="agent" tab="坐席绩效" />
          <a-tab-pane key="sla" tab="SLA 明细" />
          <a-tab-pane key="lineage" tab="数据血缘" />
          <a-tab-pane key="subscription" tab="订阅记录" />
        </a-tabs>

        <div class="report-filter-bar">
          <a-select v-model:value="detailFilters.range" size="small">
            <a-select-option value="最近7天">最近7天</a-select-option>
            <a-select-option value="最近30天">最近30天</a-select-option>
            <a-select-option value="本季度">本季度</a-select-option>
          </a-select>
          <a-select v-model:value="detailFilters.tenant" size="small">
            <a-select-option value="全部租户">全部租户</a-select-option>
            <a-select-option value="蓝湖集团">蓝湖集团</a-select-option>
          </a-select>
          <a-select v-model:value="detailFilters.channel" size="small">
            <a-select-option value="全渠道">全渠道</a-select-option>
            <a-select-option value="在线客服">在线客服</a-select-option>
            <a-select-option value="电话">电话</a-select-option>
          </a-select>
          <a-select v-model:value="detailFilters.team" size="small">
            <a-select-option value="全团队">全团队</a-select-option>
            <a-select-option value="在线一组">在线一组</a-select-option>
            <a-select-option value="VIP 专席">VIP 专席</a-select-option>
          </a-select>
          <a-button size="small" type="primary" @click="saveCurrentView">
            <template #icon><FilterOutlined /></template>
            保存视图
          </a-button>
          <a-button size="small" @click="resetDetailFilters">重置</a-button>
        </div>

        <section v-if="activeWorkbookTab !== 'lineage' && activeWorkbookTab !== 'subscription'" class="detail-dashboard">
          <div class="detail-kpis">
            <article v-for="item in detailKpis" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <em :class="item.delta.startsWith('+') ? 'trend-up' : 'trend-down'">{{ item.delta }}</em>
            </article>
          </div>

          <div class="chart-grid">
            <article v-for="chart in visibleCharts" :key="chart.title" class="chart-panel">
              <div class="chart-head">
                <div>
                  <h3>{{ chart.title }}</h3>
                  <span>{{ chart.subtitle }}</span>
                </div>
                <a-dropdown>
                  <a-button size="small" type="text">
                    <template #icon><MoreOutlined /></template>
                  </a-button>
                  <template #overlay>
                    <a-menu @click="handleChartMenuClick($event, chart.metricId)">
                      <a-menu-item key="data">查看数据</a-menu-item>
                      <a-menu-item key="image">下载图片</a-menu-item>
                      <a-menu-item key="metric">查看指标口径</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
              <div class="fake-chart" :class="`fake-chart--${chart.type}`">
                <span v-for="bar in chart.values" :key="bar.label" :style="{ height: `${bar.value}%` }">
                  <i>{{ bar.label }}</i>
                </span>
              </div>
              <div class="chart-legend">
                <span v-for="legend in chart.legends" :key="legend">{{ legend }}</span>
              </div>
            </article>
          </div>

          <a-table
            class="detail-table"
            :columns="detailColumns"
            :data-source="detailRows"
            :pagination="false"
            :scroll="{ x: 940 }"
            row-key="id"
            size="small"
          />
        </section>

        <section v-else-if="activeWorkbookTab === 'lineage'" class="lineage-view">
          <article v-for="item in lineageNodes" :key="item.title">
            <component :is="item.icon" />
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </article>
        </section>

        <a-table
          v-else
          :columns="subscriptionColumns"
          :data-source="subscriptionTasks"
          :pagination="false"
          row-key="id"
          size="small"
        />
      </template>
    </a-drawer>

    <a-modal v-model:open="subscriptionOpen" width="720px" title="订阅配置" @ok="submitSubscription">
      <a-form layout="vertical">
        <a-form-item label="订阅名称">
          <a-input v-model:value="subscriptionForm.name" />
        </a-form-item>
        <a-form-item label="接收范围">
          <a-select v-model:value="subscriptionForm.receivers" mode="multiple" placeholder="选择用户、角色或部门">
            <a-select-option v-for="item in receiverOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
        <div class="form-grid">
          <a-form-item label="发送频率">
            <a-select v-model:value="subscriptionForm.frequency">
              <a-select-option value="每日">每日</a-select-option>
              <a-select-option value="每周">每周</a-select-option>
              <a-select-option value="每月">每月</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="发送时间">
            <a-time-picker v-model:value="subscriptionForm.sendTime" format="HH:mm" value-format="HH:mm" />
          </a-form-item>
          <a-form-item label="文件格式">
            <a-select v-model:value="subscriptionForm.format">
              <a-select-option value="PDF">PDF</a-select-option>
              <a-select-option value="Excel">Excel</a-select-option>
              <a-select-option value="CSV">CSV</a-select-option>
            </a-select>
          </a-form-item>
        </div>
        <a-checkbox v-model:checked="subscriptionForm.fixedFilter">固定当前筛选条件</a-checkbox>
        <a-alert class="form-alert" type="info" show-icon :message="`预计 ${subscriptionForm.receivers.length || 1} 个接收对象，下次发送：明日 ${subscriptionForm.sendTime || '09:00'}`" />
      </a-form>
    </a-modal>

    <a-drawer v-model:open="exportOpen" width="860" title="导出中心">
      <a-table :columns="exportColumns" :data-source="exportTasks" :pagination="false" row-key="id" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="exportStatusColor(record.status)">{{ record.status }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" type="link" :disabled="record.status !== '已完成'">下载</a-button>
              <a-button size="small" type="link" :disabled="record.status !== '失败'" @click="retryExport(record)">重试</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-drawer>

    <a-drawer v-model:open="metricOpen" width="720" :title="activeMetric?.name || '指标口径'">
      <template v-if="activeMetric">
        <a-descriptions bordered :column="1" size="small">
          <a-descriptions-item label="业务定义">{{ activeMetric.definition }}</a-descriptions-item>
          <a-descriptions-item label="计算公式">{{ activeMetric.formula }}</a-descriptions-item>
          <a-descriptions-item label="数据来源">{{ activeMetric.dataset }}</a-descriptions-item>
          <a-descriptions-item label="更新频率">{{ activeMetric.updateFrequency }}</a-descriptions-item>
          <a-descriptions-item label="负责人">{{ activeMetric.owner }}</a-descriptions-item>
          <a-descriptions-item label="引用报表">{{ activeMetric.reportRefs.join('、') }}</a-descriptions-item>
        </a-descriptions>
        <a-divider>治理动作</a-divider>
        <a-space wrap>
          <a-button type="primary" @click="message.success('已发起口径变更申请')">申请变更</a-button>
          <a-button @click="message.success('已通知引用报表负责人')">通知负责人</a-button>
          <a-button danger @click="openMetricConflict">查看冲突</a-button>
        </a-space>
      </template>
    </a-drawer>

    <a-drawer v-model:open="conflictOpen" width="960" title="口径冲突处理">
      <a-alert
        class="conflict-alert"
        type="warning"
        show-icon
        message="AI 检测到 2 个相似指标在 8 张报表中使用不同公式，建议统一为 SLA 标准口径。"
      />
      <a-table :columns="conflictColumns" :data-source="metricConflicts" :pagination="false" row-key="id" size="small" />
      <a-divider>处理方案</a-divider>
      <a-radio-group v-model:value="conflictResolution">
        <a-radio value="standard">选择标准口径并批量更新引用</a-radio>
        <a-radio value="merge">合并指标并保留历史别名</a-radio>
        <a-radio value="skip">暂不处理，仅记录风险</a-radio>
      </a-radio-group>
      <div class="drawer-footer">
        <a-button type="primary" @click="submitConflictResolution">提交审批</a-button>
      </div>
    </a-drawer>

    <a-modal v-model:open="createOpen" width="1040px" title="新建报表向导" @ok="submitCreate">
      <a-steps :current="createStep" size="small" :items="createSteps" />
      <div class="wizard-body">
        <div v-if="createStep === 0" class="template-grid">
          <button
            v-for="item in reportTemplates"
            :key="item"
            class="template-card"
            :class="{ active: createForm.template === item }"
            type="button"
            @click="createForm.template = item"
          >
            <FileSearchOutlined />
            <strong>{{ item }}</strong>
          </button>
        </div>
        <a-form v-else layout="vertical">
          <a-form-item label="报表名称">
            <a-input v-model:value="createForm.name" />
          </a-form-item>
          <a-form-item label="数据集">
            <a-select v-model:value="createForm.dataset">
              <a-select-option v-for="item in datasetOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="指标">
            <a-select v-model:value="createForm.metrics" mode="multiple">
              <a-select-option v-for="item in metricDefinitions" :key="item.id" :value="item.name">{{ item.name }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <template #footer>
        <a-button @click="createStep = Math.max(0, createStep - 1)">上一步</a-button>
        <a-button v-if="createStep < 2" type="primary" @click="createStep += 1">下一步</a-button>
        <a-button v-else type="primary" @click="submitCreate">保存草稿</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { TableColumnsType } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import {
  AppstoreOutlined,
  BarsOutlined,
  BellOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileSearchOutlined,
  FilterOutlined,
  LineChartOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons-vue';

type ReportStatus = '草稿' | '待发布' | '已发布' | '异常' | '已下线';
type ReportDomain = '运营' | 'SLA' | '风险' | '坐席绩效' | '客户' | '渠道' | '自定义';
type ReportType = '仪表盘' | '明细报表' | '透视报表' | '订阅报表';
type ViewMode = 'table' | 'card';
type ExportStatus = '排队中' | '生成中' | '已完成' | '失败';

interface BiReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  domain: ReportDomain;
  owner: string;
  datasetName: string;
  refreshTime: string;
  nextRefresh: string;
  usageCount: number;
  usageTrend: string;
  trustScore: number;
  status: ReportStatus;
  version: string;
  favorite: boolean;
  tags: string[];
  abnormalReason?: string;
}

interface HealthCard {
  key: string;
  label: string;
  value: string;
  delta: string;
  tone: 'blue' | 'cyan' | 'green' | 'amber' | 'red' | 'purple';
  icon: object;
}

interface ShortcutGroup {
  key: 'recommend' | 'recent' | 'favorite' | 'owner' | 'abnormal';
  title: string;
  main: {
    name: string;
    meta: string;
  };
  links: string[];
}

interface ChartPanel {
  title: string;
  subtitle: string;
  type: 'bar' | 'line' | 'stack';
  metricId: string;
  values: Array<{ label: string; value: number }>;
  legends: string[];
}

interface MetricDefinition {
  id: string;
  name: string;
  definition: string;
  formula: string;
  dataset: string;
  owner: string;
  updateFrequency: string;
  reportRefs: string[];
}

interface ExportTask {
  id: string;
  reportName: string;
  initiator: string;
  format: string;
  status: ExportStatus;
  createTime: string;
  finishTime: string;
}

interface SubscriptionTask {
  id: string;
  name: string;
  reportName: string;
  receivers: string;
  frequency: string;
  sendTime: string;
  status: string;
  lastRunTime: string;
}

const loading = ref(false);
const activeDomain = ref('全部');
const viewMode = ref<ViewMode>('table');
const selectedRowKeys = ref<string[]>([]);
const detailOpen = ref(false);
const subscriptionOpen = ref(false);
const exportOpen = ref(false);
const metricOpen = ref(false);
const conflictOpen = ref(false);
const createOpen = ref(false);
const activeReport = ref<BiReport>();
const activeMetric = ref<MetricDefinition>();
const activeWorkbookTab = ref('overview');
const createStep = ref(0);
const conflictResolution = ref('standard');

const query = reactive({
  keyword: '',
  range: undefined,
  domain: undefined as ReportDomain | undefined,
  status: undefined as ReportStatus | undefined,
  owner: undefined as string | undefined,
});

const detailFilters = reactive({
  range: '最近30天',
  tenant: '全部租户',
  channel: '全渠道',
  team: '全团队',
});

const subscriptionForm = reactive({
  name: '客服运营日报订阅',
  receivers: ['客服运营部'],
  frequency: '每日',
  sendTime: '09:00',
  format: 'PDF',
  fixedFilter: true,
});

const createForm = reactive({
  template: 'SLA 履约模板',
  name: '新的 BI 报表',
  dataset: 'ticket_sla_dataset',
  metrics: ['SLA 达成率'],
});

const domainOptions: ReportDomain[] = ['运营', 'SLA', '风险', '坐席绩效', '客户', '渠道', '自定义'];
const domainTabs = ['全部', ...domainOptions];
const statusOptions: ReportStatus[] = ['草稿', '待发布', '已发布', '异常', '已下线'];
const ownerOptions = ['陈沐阳', '谢砚青', '韩书', '林澈', '许知远', '赵明远'];
const receiverOptions = ['客服运营部', 'SLA 管理组', '管理层', '坐席主管', '数据分析师', '风险运营组'];
const datasetOptions = ['ticket_sla_dataset', 'service_operation_dataset', 'agent_performance_dataset', 'customer_risk_dataset'];
const reportTemplates = ['空白报表', 'SLA 履约模板', '运营日报模板', '坐席绩效模板', '风险分析模板'];
const viewOptions = [
  { label: '表格', value: 'table', icon: BarsOutlined },
  { label: '卡片', value: 'card', icon: AppstoreOutlined },
];
const createSteps = [
  { title: '选择模板' },
  { title: '配置数据' },
  { title: '预览发布' },
];

const reports = ref<BiReport[]>([
  {
    id: 'r-001',
    name: 'SLA 履约周报',
    description: '跟踪响应、解决、超时、补救动作和客户等级维度的 SLA 达成情况。',
    type: '仪表盘',
    domain: 'SLA',
    owner: '陈沐阳',
    datasetName: 'ticket_sla_dataset',
    refreshTime: '10 分钟前',
    nextRefresh: '15 分钟后',
    usageCount: 1248,
    usageTrend: '+18%',
    trustScore: 96,
    status: '已发布',
    version: 'v2.8',
    favorite: true,
    tags: ['SLA', '周报', '管理层'],
  },
  {
    id: 'r-002',
    name: '客服运营日报',
    description: '汇总服务量、渠道压力、处理效率、满意度和异常任务闭环。',
    type: '明细报表',
    domain: '运营',
    owner: '谢砚青',
    datasetName: 'service_operation_dataset',
    refreshTime: '22 分钟前',
    nextRefresh: '38 分钟后',
    usageCount: 2190,
    usageTrend: '+11%',
    trustScore: 93,
    status: '已发布',
    version: 'v4.1',
    favorite: false,
    tags: ['日报', '运营', '全渠道'],
  },
  {
    id: 'r-003',
    name: '坐席效率看板',
    description: '查看团队和个人的处理量、首响、解决率、质检分与培训影响。',
    type: '仪表盘',
    domain: '坐席绩效',
    owner: '韩书',
    datasetName: 'agent_performance_dataset',
    refreshTime: '35 分钟前',
    nextRefresh: '25 分钟后',
    usageCount: 986,
    usageTrend: '+7%',
    trustScore: 91,
    status: '已发布',
    version: 'v3.5',
    favorite: true,
    tags: ['坐席', '绩效', '质检'],
  },
  {
    id: 'r-004',
    name: '投诉风险分析',
    description: '识别投诉升级、负面情绪、流失倾向和高价值客户风险。',
    type: '仪表盘',
    domain: '风险',
    owner: '林澈',
    datasetName: 'customer_risk_dataset',
    refreshTime: '刷新失败',
    nextRefresh: '待重试',
    usageCount: 642,
    usageTrend: '-6%',
    trustScore: 74,
    status: '异常',
    version: 'v1.9',
    favorite: false,
    tags: ['风险', '投诉', 'AI 洞察'],
    abnormalReason: '数据集刷新失败',
  },
  {
    id: 'r-005',
    name: '渠道成本趋势',
    description: '按电话、在线、邮件、短信和工单渠道分析服务成本变化。',
    type: '透视报表',
    domain: '渠道',
    owner: '许知远',
    datasetName: 'channel_cost_dataset',
    refreshTime: '1 小时前',
    nextRefresh: '23 分钟后',
    usageCount: 516,
    usageTrend: '+4%',
    trustScore: 88,
    status: '待发布',
    version: 'v1.2',
    favorite: false,
    tags: ['渠道', '成本', '趋势'],
  },
  {
    id: 'r-006',
    name: '客户旅程触点报表',
    description: '串联客户从咨询、处理、回访到满意度的关键触点。',
    type: '订阅报表',
    domain: '客户',
    owner: '赵明远',
    datasetName: 'customer_journey_dataset',
    refreshTime: '2 小时前',
    nextRefresh: '明日 08:00',
    usageCount: 438,
    usageTrend: '+3%',
    trustScore: 90,
    status: '已发布',
    version: 'v2.0',
    favorite: true,
    tags: ['客户', '旅程', '订阅'],
  },
  {
    id: 'r-007',
    name: '首响指标临时报表',
    description: '用于验证首响达成率新口径，暂未发布给业务团队。',
    type: '明细报表',
    domain: '自定义',
    owner: '陈沐阳',
    datasetName: 'ticket_response_dataset',
    refreshTime: '3 小时前',
    nextRefresh: '手动刷新',
    usageCount: 72,
    usageTrend: '-2%',
    trustScore: 82,
    status: '草稿',
    version: 'v0.4',
    favorite: false,
    tags: ['草稿', '口径验证'],
  },
]);

const metricDefinitions: MetricDefinition[] = [
  {
    id: 'm-001',
    name: 'SLA 达成率',
    definition: '在约定响应或解决时限内完成的工单占全部需履约工单的比例。',
    formula: 'SLA 达成率 = SLA 内完成工单数 / 需履约工单数',
    dataset: 'ticket_sla_dataset',
    owner: '陈沐阳',
    updateFrequency: '每 15 分钟',
    reportRefs: ['SLA 履约周报', '客服运营日报', '管理层服务月报'],
  },
  {
    id: 'm-002',
    name: '首次响应率',
    definition: '首次响应在 SLA 内完成的工单占需首次响应工单的比例。',
    formula: '首次响应率 = 首次响应在 SLA 内工单数 / 需首次响应工单数',
    dataset: 'ticket_response_dataset',
    owner: '谢砚青',
    updateFrequency: '每小时',
    reportRefs: ['SLA 履约周报', '首响指标临时报表'],
  },
];

const exportTasks = ref<ExportTask[]>([
  { id: 'ex-001', reportName: 'SLA 履约周报', initiator: '陈沐阳', format: 'PDF', status: '已完成', createTime: '09:10', finishTime: '09:12' },
  { id: 'ex-002', reportName: '客服运营日报', initiator: '订阅任务', format: 'Excel', status: '生成中', createTime: '09:18', finishTime: '-' },
  { id: 'ex-003', reportName: '投诉风险分析', initiator: '林澈', format: 'CSV', status: '失败', createTime: '08:42', finishTime: '08:43' },
]);

const subscriptionTasks: SubscriptionTask[] = [
  { id: 's-001', name: 'SLA 周报订阅', reportName: 'SLA 履约周报', receivers: '管理层、SLA 管理组', frequency: '每周', sendTime: '周一 09:00', status: '正常', lastRunTime: '07-27 09:00' },
  { id: 's-002', name: '客服运营日报', reportName: '客服运营日报', receivers: '客服运营部', frequency: '每日', sendTime: '09:00', status: '正常', lastRunTime: '07-27 09:00' },
  { id: 's-003', name: '风险日报', reportName: '投诉风险分析', receivers: '风险运营组', frequency: '每日', sendTime: '08:30', status: '失败', lastRunTime: '07-27 08:30' },
];

const detailRows = [
  { id: 'd-001', ticketNo: 'TK-20260727-1024', customer: '蓝湖集团', channel: '在线客服', team: '在线一组', sla: '已达成', owner: '周遥', createdAt: '09:12' },
  { id: 'd-002', ticketNo: 'TK-20260727-1041', customer: '南星科技', channel: '电话', team: 'VIP 专席', sla: '即将超时', owner: '许知远', createdAt: '09:28' },
  { id: 'd-003', ticketNo: 'TK-20260727-1088', customer: '云启零售', channel: '邮件', team: '邮件工单组', sla: '已超时', owner: '韩书', createdAt: '10:06' },
];

const metricConflicts = [
  { id: 'c-001', item: '指标名称', metricA: '首次响应率', metricB: '首响达成率' },
  { id: 'c-002', item: '计算公式', metricA: 'SLA 内首次响应 / 需首响工单', metricB: '首次响应小于 5 分钟 / 全部工单' },
  { id: 'c-003', item: '引用报表', metricA: '12 张', metricB: '8 张' },
  { id: 'c-004', item: '负责人', metricA: '陈沐阳', metricB: '谢砚青' },
];

const reportColumns: TableColumnsType<BiReport> = [
  { title: '报表名称', dataIndex: 'name', key: 'name', width: 280, fixed: 'left' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '业务域', dataIndex: 'domain', key: 'domain', width: 100 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 120 },
  { title: '数据集', dataIndex: 'datasetName', key: 'datasetName', width: 170 },
  { title: '最近刷新', dataIndex: 'refreshTime', key: 'refreshTime', width: 120 },
  { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 110, sorter: (a, b) => a.usageCount - b.usageCount },
  { title: '可信度', dataIndex: 'trustScore', key: 'trustScore', width: 130, sorter: (a, b) => a.trustScore - b.trustScore },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'actions', width: 190, fixed: 'right' },
];

const detailColumns = [
  { title: '工单编号', dataIndex: 'ticketNo', key: 'ticketNo', width: 160 },
  { title: '客户', dataIndex: 'customer', key: 'customer', width: 130 },
  { title: '渠道', dataIndex: 'channel', key: 'channel', width: 110 },
  { title: '团队', dataIndex: 'team', key: 'team', width: 130 },
  { title: 'SLA', dataIndex: 'sla', key: 'sla', width: 110 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 110 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110 },
];

const subscriptionColumns = [
  { title: '订阅名称', dataIndex: 'name', key: 'name' },
  { title: '报表', dataIndex: 'reportName', key: 'reportName' },
  { title: '接收人', dataIndex: 'receivers', key: 'receivers' },
  { title: '频率', dataIndex: 'frequency', key: 'frequency' },
  { title: '发送时间', dataIndex: 'sendTime', key: 'sendTime' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '最近执行', dataIndex: 'lastRunTime', key: 'lastRunTime' },
];

const exportColumns = [
  { title: '任务编号', dataIndex: 'id', key: 'id', width: 110 },
  { title: '报表名称', dataIndex: 'reportName', key: 'reportName' },
  { title: '发起人', dataIndex: 'initiator', key: 'initiator', width: 100 },
  { title: '格式', dataIndex: 'format', key: 'format', width: 90 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 100 },
  { title: '完成时间', dataIndex: 'finishTime', key: 'finishTime', width: 100 },
  { title: '操作', key: 'actions', width: 120 },
];

const conflictColumns = [
  { title: '对比项', dataIndex: 'item', key: 'item', width: 140 },
  { title: '指标 A', dataIndex: 'metricA', key: 'metricA' },
  { title: '指标 B', dataIndex: 'metricB', key: 'metricB' },
];

const filteredReports = computed(() => {
  const keyword = query.keyword.trim().toLowerCase();
  return reports.value.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.owner.toLowerCase().includes(keyword) ||
      item.datasetName.toLowerCase().includes(keyword) ||
      item.tags.some((tag) => tag.toLowerCase().includes(keyword));
    const matchTab = activeDomain.value === '全部' || item.domain === activeDomain.value;
    const matchDomain = !query.domain || item.domain === query.domain;
    const matchStatus = !query.status || item.status === query.status;
    const matchOwner = !query.owner || item.owner === query.owner;
    return matchKeyword && matchTab && matchDomain && matchStatus && matchOwner;
  });
});

const healthCards = computed<HealthCard[]>(() => {
  const total = filteredReports.value.length;
  const active = filteredReports.value.filter((item) => item.usageCount > 500).length;
  const abnormal = filteredReports.value.filter((item) => item.status === '异常').length;
  const avgTrust = Math.round(filteredReports.value.reduce((sum, item) => sum + item.trustScore, 0) / Math.max(total, 1));
  return [
    { key: 'total', label: '报表总数', value: String(total), delta: '较上周 +4.2%', tone: 'cyan', icon: FileSearchOutlined },
    { key: 'active', label: '活跃报表', value: String(active), delta: '近 30 天打开', tone: 'green', icon: EyeOutlined },
    { key: 'subscription', label: '订阅任务', value: String(subscriptionTasks.length), delta: '失败 1 个', tone: 'purple', icon: BellOutlined },
    { key: 'export', label: '导出请求', value: String(exportTasks.value.length), delta: '今日任务', tone: 'blue', icon: DownloadOutlined },
    { key: 'conflict', label: '口径冲突', value: '16', delta: '待治理 4 项', tone: 'red', icon: ExclamationCircleOutlined },
    { key: 'freshness', label: '数据新鲜度', value: `${avgTrust}%`, delta: abnormal ? `${abnormal} 张异常` : '全部正常', tone: abnormal ? 'amber' : 'green', icon: SafetyCertificateOutlined },
  ];
});

const shortcutGroups = computed<ShortcutGroup[]>(() => {
  const firstReport = reports.value[0];
  const abnormalReport = reports.value.find((item) => item.status === '异常') ?? firstReport;
  const favoriteReport = reports.value.find((item) => item.favorite) ?? firstReport;
  return [
    { key: 'recommend', title: '推荐报表', main: { name: firstReport.name, meta: `可信度 ${firstReport.trustScore} / ${firstReport.refreshTime}` }, links: ['SLA 管理层', '周会常用'] },
    { key: 'recent', title: '最近使用', main: { name: '客服运营日报', meta: '12 分钟前打开' }, links: ['运营日报', '全渠道'] },
    { key: 'favorite', title: '我收藏的', main: { name: favoriteReport.name, meta: '已收藏 3 张' }, links: ['SLA', '客户旅程'] },
    { key: 'owner', title: '我负责的', main: { name: '首响指标临时报表', meta: '草稿 / 待发布 2 张' }, links: ['口径验证', '待发布'] },
    { key: 'abnormal', title: '异常报表', main: { name: abnormalReport.name, meta: abnormalReport.abnormalReason ?? '口径冲突待处理' }, links: ['立即处理', '查看原因'] },
  ];
});

const activeFilterTags = computed(() => {
  return [query.keyword, query.domain, query.status, query.owner].filter(Boolean) as string[];
});

const detailKpis = computed(() => [
  { label: '工单总量', value: '12,846', delta: '+8.4%' },
  { label: 'SLA 达成率', value: '96.2%', delta: '+2.1%' },
  { label: '首响中位数', value: '42s', delta: '-9.6%' },
  { label: '一次解决率', value: '87.5%', delta: '+3.2%' },
]);

const visibleCharts = computed<ChartPanel[]>(() => {
  if (activeWorkbookTab.value === 'channel') {
    return [
      createChart('渠道服务量分布', '电话、在线、邮件、短信和工单来源', 'bar', 'm-001', [72, 86, 48, 64, 58]),
      createChart('渠道 SLA 趋势', '按渠道跟踪履约波动', 'line', 'm-001', [82, 76, 88, 91, 84]),
    ];
  }
  if (activeWorkbookTab.value === 'agent') {
    return [
      createChart('团队处理效率排行', '按团队统计处理量和解决率', 'bar', 'm-002', [66, 78, 92, 71, 84]),
      createChart('质检分趋势', '质检抽样后按周滚动', 'line', 'm-002', [70, 73, 76, 82, 86]),
    ];
  }
  return [
    createChart('SLA 达成趋势', '最近 30 天履约变化', 'line', 'm-001', [68, 74, 72, 86, 91, 96]),
    createChart('超时原因分布', '按业务原因拆解异常', 'bar', 'm-001', [44, 58, 71, 39, 52]),
    createChart('渠道服务量趋势', '全渠道服务压力走势', 'stack', 'm-002', [52, 64, 78, 61, 88, 74]),
  ];
});

const lineageNodes = computed(() => [
  { title: activeReport.value?.datasetName ?? 'ticket_sla_dataset', description: '数据集每 15 分钟刷新，最近一次刷新成功。', icon: DatabaseOutlined },
  { title: 'SLA 达成率', description: '标准指标，引用 3 张报表，暂无严重冲突。', icon: SafetyCertificateOutlined },
  { title: '刷新任务链路', description: '采集、清洗、指标计算、报表缓存均已完成。', icon: LineChartOutlined },
  { title: '审计记录', description: '最近一次发布由陈沐阳在 07-26 18:20 完成。', icon: CheckCircleOutlined },
]);

function createChart(title: string, subtitle: string, type: ChartPanel['type'], metricId: string, values: number[]): ChartPanel {
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    title,
    subtitle,
    type,
    metricId,
    values: values.map((value, index) => ({ label: labels[index] ?? `项${index + 1}`, value })),
    legends: ['本期', '上期', '目标线'],
  };
}

function loadPortal() {
  loading.value = true;
  window.setTimeout(() => {
    loading.value = false;
  }, 180);
}

function resetQuery() {
  Object.assign(query, {
    keyword: '',
    range: undefined,
    domain: undefined,
    status: undefined,
    owner: undefined,
  });
  activeDomain.value = '全部';
  loadPortal();
}

function removeFilter(tag: string) {
  if (query.keyword === tag) query.keyword = '';
  if (query.domain === tag) query.domain = undefined;
  if (query.status === tag) query.status = undefined;
  if (query.owner === tag) query.owner = undefined;
  loadPortal();
}

function onSelectChange(keys: (string | number)[]) {
  selectedRowKeys.value = keys.map(String);
}

function openReport(record: BiReport) {
  activeReport.value = record;
  activeWorkbookTab.value = 'overview';
  detailOpen.value = true;
}

function toggleFavorite(record: BiReport) {
  record.favorite = !record.favorite;
  message.success(record.favorite ? '已收藏报表' : '已取消收藏');
}

function openSubscribe(record?: BiReport) {
  if (record) {
    activeReport.value = record;
    subscriptionForm.name = `${record.name}订阅`;
  }
  subscriptionOpen.value = true;
}

function submitSubscription() {
  subscriptionOpen.value = false;
  message.success(`订阅已保存，下次发送：明日 ${subscriptionForm.sendTime}`);
}

function createExportTask(record: BiReport) {
  exportTasks.value.unshift({
    id: `ex-${Date.now().toString().slice(-4)}`,
    reportName: record.name,
    initiator: '当前用户',
    format: 'Excel',
    status: '排队中',
    createTime: '刚刚',
    finishTime: '-',
  });
  message.success(`${record.name} 已加入导出队列`);
}

function openExportCenter() {
  exportOpen.value = true;
}

function openSubscriptionCenter() {
  activeWorkbookTab.value = 'subscription';
  if (activeReport.value) {
    detailOpen.value = true;
  } else {
    message.info('请先打开一张报表查看订阅记录');
  }
}

function openCreateWizard() {
  createStep.value = 0;
  createOpen.value = true;
}

function submitCreate() {
  createOpen.value = false;
  reports.value.unshift({
    id: `r-${Date.now()}`,
    name: createForm.name,
    description: `${createForm.template}生成的草稿报表，等待配置图表布局和发布审批。`,
    type: '仪表盘',
    domain: '自定义',
    owner: '陈沐阳',
    datasetName: createForm.dataset,
    refreshTime: '未发布',
    nextRefresh: '手动刷新',
    usageCount: 0,
    usageTrend: '+0%',
    trustScore: 80,
    status: '草稿',
    version: 'v0.1',
    favorite: false,
    tags: ['草稿', createForm.template],
  });
  message.success('报表草稿已创建');
}

function batchSubscribe() {
  subscriptionOpen.value = true;
  message.info(`已选择 ${selectedRowKeys.value.length} 张报表`);
}

function batchExport() {
  selectedRowKeys.value.forEach((id) => {
    const report = reports.value.find((item) => item.id === id);
    if (report) createExportTask(report);
  });
  selectedRowKeys.value = [];
}

function handleShortcut(key: ShortcutGroup['key']) {
  if (key === 'abnormal') {
    query.status = '异常';
    activeDomain.value = '全部';
    loadPortal();
    return;
  }
  if (key === 'favorite') {
    viewMode.value = 'card';
    return;
  }
  const report = reports.value[0];
  if (report) openReport(report);
}

function handleHealthClick(key: string) {
  if (key === 'conflict') {
    openMetricConflict();
    return;
  }
  if (key === 'export') {
    openExportCenter();
    return;
  }
  if (key === 'subscription') {
    openSubscriptionCenter();
    return;
  }
  if (key === 'freshness') {
    query.status = '异常';
    loadPortal();
  }
}

function handleReportMenu(key: string, record: BiReport) {
  if (key === 'metric') {
    activeMetric.value = metricDefinitions[0];
    metricOpen.value = true;
    return;
  }
  if (key === 'offline') {
    record.status = '已下线';
    message.success(`${record.name} 已下线`);
    return;
  }
  message.success(`${record.name}：${key} 操作已记录`);
}

function handleReportMenuClick(info: { key: string | number }, record: BiReport) {
  handleReportMenu(String(info.key), record);
}

function handleChartMenu(key: string, metricId: string) {
  if (key === 'metric') {
    activeMetric.value = metricDefinitions.find((item) => item.id === metricId) ?? metricDefinitions[0];
    metricOpen.value = true;
    return;
  }
  message.success('图表操作已执行');
}

function handleChartMenuClick(info: { key: string | number }, metricId: string) {
  handleChartMenu(String(info.key), metricId);
}

function openMetricConflict() {
  conflictOpen.value = true;
}

function submitConflictResolution() {
  conflictOpen.value = false;
  message.success('口径冲突处理已提交审批');
}

function saveCurrentView() {
  message.success('筛选视图已保存，并加入门户快捷入口');
}

function resetDetailFilters() {
  Object.assign(detailFilters, {
    range: '最近30天',
    tenant: '全部租户',
    channel: '全渠道',
    team: '全团队',
  });
}

function retryExport(record: ExportTask) {
  record.status = '排队中';
  message.success(`${record.reportName} 已重新加入导出队列`);
}

function statusColor(status: ReportStatus) {
  const map: Record<ReportStatus, string> = {
    草稿: 'default',
    待发布: 'blue',
    已发布: 'green',
    异常: 'red',
    已下线: 'default',
  };
  return map[status];
}

function exportStatusColor(status: ExportStatus) {
  const map: Record<ExportStatus, string> = {
    排队中: 'default',
    生成中: 'processing',
    已完成: 'success',
    失败: 'error',
  };
  return map[status];
}
</script>

<style scoped lang="scss">
.bi-portal-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 1180px;
  color: var(--app-text);
}

.bi-toolbar,
.shortcut-section,
.asset-section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.bi-toolbar {
  padding: 16px;
}

.toolbar-head,
.section-title,
.asset-head,
.detail-summary,
.detail-title-line,
.detail-actions,
.chart-head,
.owner-cell,
.asset-actions,
.filter-tags {
  display: flex;
  align-items: center;
}

.toolbar-head,
.section-title,
.asset-head,
.detail-summary,
.chart-head {
  justify-content: space-between;
  gap: 16px;
}

.toolbar-title {
  min-width: 0;
}

.toolbar-title h1,
.section-title h2,
.detail-title-line h2,
.chart-head h3 {
  margin: 0;
  color: var(--app-text);
  font-weight: 700;
}

.toolbar-title h1 {
  font-size: 20px;
}

.section-title h2,
.detail-title-line h2 {
  font-size: 18px;
}

.chart-head h3 {
  font-size: 15px;
}

.toolbar-title p,
.section-title p,
.report-card p,
.detail-summary p,
.chart-head span,
.detail-meta,
.shortcut-meta,
.report-name span {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.toolbar-filters {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 250px 130px 130px 140px auto;
  gap: 10px;
  align-items: center;
  margin-top: 14px;
}

.filter-actions,
.toolbar-actions,
.asset-actions {
  flex: 0 0 auto;
  white-space: nowrap;
}

.filter-tags {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.health-overview {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.metric-card,
.shortcut-card,
.report-card,
.detail-kpis article,
.chart-panel,
.lineage-view article,
.template-card {
  position: relative;
  min-width: 0;
  padding: 14px;
  text-align: left;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
}

.metric-card,
.shortcut-card,
.template-card {
  color: inherit;
  cursor: pointer;
}

.metric-card {
  min-height: 86px;
  overflow: hidden;
}

.metric-card:hover,
.shortcut-card:hover,
.template-card:hover,
.template-card.active {
  border-color: var(--app-primary);
}

.metric-label,
.shortcut-title,
.detail-kpis span {
  display: block;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  color: var(--app-text);
  font-size: 28px;
  line-height: 1;
}

.metric-delta {
  display: block;
  margin-top: 8px;
  font-size: 12px;
}

.metric-icon {
  position: absolute;
  right: 12px;
  bottom: 12px;
  color: currentColor;
  font-size: 24px;
  opacity: 0.28;
}

.metric-card--cyan { color: #22d3ee; }
.metric-card--green { color: #34d399; }
.metric-card--purple { color: #a78bfa; }
.metric-card--blue { color: #60a5fa; }
.metric-card--red { color: #fb7185; }
.metric-card--amber { color: #f59e0b; }

.shortcut-section,
.asset-section {
  padding: 16px;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.shortcut-card {
  min-height: 122px;
  background: var(--app-surface-muted);
}

.shortcut-card--warning {
  border-color: rgba(245, 158, 11, 0.55);
}

.shortcut-card strong {
  display: block;
  min-height: 42px;
  margin-top: 8px;
  color: var(--app-text);
  font-size: 15px;
  line-height: 1.4;
}

.shortcut-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.shortcut-links span {
  padding: 3px 7px;
  color: var(--app-text-secondary);
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 6px;
  font-size: 12px;
}

.asset-head {
  align-items: flex-start;
  margin-bottom: 10px;
}

.asset-head :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.asset-actions {
  gap: 8px;
  padding-top: 4px;
}

.report-name {
  display: grid;
  gap: 4px;
  width: 100%;
  min-width: 0;
  padding: 0;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.report-name strong,
.report-name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-name strong {
  color: var(--app-text);
  font-weight: 700;
}

.report-name:hover strong {
  color: var(--app-primary);
}

.report-tags {
  display: flex;
  gap: 4px;
}

.report-tags :deep(.ant-tag) {
  margin-inline-end: 0;
}

.owner-cell {
  gap: 8px;
}

.trend-cell,
.trust-cell {
  display: grid;
  gap: 4px;
}

.trend-up {
  color: #34d399;
}

.trend-down {
  color: #fb7185;
}

.report-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.report-card {
  display: flex;
  min-height: 230px;
  flex-direction: column;
  gap: 10px;
  background: var(--app-surface-muted);
}

.report-card--abnormal {
  border-color: rgba(251, 113, 133, 0.6);
}

.report-card-head {
  display: flex;
  justify-content: space-between;
}

.favorite-button {
  color: #f59e0b;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.report-card h3 {
  margin: 0;
  color: var(--app-text);
  font-size: 16px;
}

.report-card p {
  flex: 1;
}

.card-meta {
  display: grid;
  gap: 6px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.card-trust {
  display: grid;
  gap: 6px;
}

.detail-summary {
  align-items: flex-start;
  padding: 14px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.detail-title-line {
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.detail-score {
  min-width: 92px;
  padding: 10px;
  text-align: center;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.detail-score span {
  display: block;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.detail-score strong {
  display: block;
  color: #34d399;
  font-size: 30px;
  line-height: 1.2;
}

.detail-actions {
  justify-content: flex-end;
  margin: 12px 0;
}

.workbook-tabs {
  margin-top: 4px;
}

.report-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  margin-bottom: 14px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.detail-dashboard {
  display: grid;
  gap: 14px;
}

.detail-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.detail-kpis article {
  background: var(--app-surface-muted);
}

.detail-kpis strong {
  display: block;
  margin-top: 8px;
  color: var(--app-text);
  font-size: 24px;
  line-height: 1;
}

.detail-kpis em {
  display: block;
  margin-top: 8px;
  font-style: normal;
  font-size: 12px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.chart-panel:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.chart-panel {
  display: grid;
  gap: 12px;
  min-height: 260px;
  background: var(--app-surface-muted);
}

.fake-chart {
  display: flex;
  align-items: end;
  gap: 10px;
  height: 150px;
  padding: 12px;
  background: linear-gradient(180deg, rgba(79, 123, 255, 0.08), rgba(0, 229, 255, 0.03));
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.fake-chart span {
  position: relative;
  flex: 1;
  min-width: 24px;
  background: linear-gradient(180deg, var(--app-primary), var(--app-accent));
  border-radius: 6px 6px 2px 2px;
}

.fake-chart--line span {
  border-radius: 999px 999px 2px 2px;
}

.fake-chart--stack span {
  background: linear-gradient(180deg, #34d399 0 45%, var(--app-primary) 45% 72%, #a78bfa 72%);
}

.fake-chart i {
  position: absolute;
  bottom: -22px;
  left: 50%;
  color: var(--app-text-secondary);
  font-style: normal;
  font-size: 11px;
  transform: translateX(-50%);
}

.chart-legend {
  display: flex;
  gap: 12px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.chart-legend span::before {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 5px;
  background: var(--app-primary);
  border-radius: 999px;
  content: '';
}

.lineage-view {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.lineage-view article {
  min-height: 150px;
  background: var(--app-surface-muted);
}

.lineage-view svg,
.template-card svg {
  color: var(--app-primary);
  font-size: 22px;
}

.lineage-view strong {
  display: block;
  margin-top: 10px;
  color: var(--app-text);
}

.lineage-view p {
  color: var(--app-text-secondary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.form-alert,
.conflict-alert {
  margin-top: 14px;
}

.wizard-body {
  min-height: 280px;
  margin-top: 18px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.template-card {
  display: grid;
  place-items: center;
  min-height: 140px;
  gap: 10px;
}

.drawer-footer {
  margin-top: 20px;
  text-align: right;
}

button {
  font: inherit;
}

@media (max-width: 1360px) {
  .bi-portal-page {
    min-width: 980px;
  }

  .toolbar-filters {
    grid-template-columns: minmax(260px, 1fr) 250px repeat(3, 120px);
  }

  .filter-actions {
    grid-column: 1 / -1;
  }

  .health-overview {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .shortcut-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .report-card-grid,
  .lineage-view {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
