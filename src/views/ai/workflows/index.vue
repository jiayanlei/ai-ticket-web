<template>
  <div class="workflow-page">
    <header class="workflow-topbar">
      <div>
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageDescription }}</p>
      </div>
      <a-space wrap>
        <a-button @click="refreshWorkflows">刷新</a-button>
        <a-button @click="openCreate">新建流程</a-button>
        <a-button type="primary" @click="openPublish">发布工作流</a-button>
        <a-button @click="copyWorkflow">复制流程</a-button>
        <a-button @click="focusRunLogs">查看运行日志</a-button>
      </a-space>
    </header>

    <section class="workflow-shell">
      <aside class="workflow-sidebar panel">
        <div class="panel-title">
          <div>
            <h2>流程列表</h2>
            <span>{{ filteredWorkflows.length }} 个流程</span>
          </div>
        </div>

        <a-input
          v-model:value="filters.keyword"
          allow-clear
          placeholder="搜索流程名称、触发场景、节点名称、负责人"
        />

        <div class="workflow-list">
          <button
            v-for="item in filteredWorkflows"
            :key="item.id"
            :class="['workflow-card', { active: item.id === activeWorkflowId }]"
            @click="selectWorkflow(item.id)"
          >
            <div class="workflow-card__head">
              <strong>{{ item.name }}</strong>
              <a-tag :color="workflowStatusColor(item.status)">{{ item.status }}</a-tag>
            </div>
            <p>{{ item.scenario }} · {{ item.trigger }}</p>
            <div class="workflow-card__metrics">
              <span>今日 {{ item.todayRuns }}</span>
              <span>成功率 {{ item.successRate }}%</span>
              <span :class="{ danger: item.exceptionCount > 0 }">异常 {{ item.exceptionCount }}</span>
            </div>
            <div class="workflow-card__foot">
              <span>{{ item.lastRun }}</span>
              <span>{{ item.owner }}</span>
            </div>
          </button>
        </div>
      </aside>

      <main class="workflow-builder panel">
        <div class="builder-toolbar">
          <div>
            <h2>{{ activeWorkflow.name }}</h2>
            <p>{{ activeWorkflow.scenario }} · {{ activeWorkflow.version }} · 灰度 {{ activeWorkflow.grayPercent }}%</p>
          </div>
          <a-space wrap>
            <a-button size="small" @click="addNode">新增节点</a-button>
            <a-button size="small" :disabled="!selectedNode" @click="moveNode('left')">前移</a-button>
            <a-button size="small" :disabled="!selectedNode" @click="moveNode('right')">后移</a-button>
            <a-button size="small" danger :disabled="!selectedNode" @click="deleteNode">删除节点</a-button>
            <a-button size="small" @click="fitCurrentView">适配画布</a-button>
            <a-button size="small" @click="message.success('已完成发布前校验')">发布前校验</a-button>
          </a-space>
        </div>

        <div class="canvas-wrap" @dragover.prevent @drop="handleDrop">
          <VueFlow
            v-model:nodes="flowNodes"
            v-model:edges="flowEdges"
            class="workflow-vue-flow"
            :default-viewport="{ x: 12, y: 12, zoom: 0.78 }"
            :min-zoom="0.35"
            :max-zoom="1.4"
            fit-view-on-init
            connect-on-click
            @node-click="handleNodeClick"
            @node-drag-stop="syncDraggedNode"
            @connect="handleConnect"
            @pane-click="clearSelectedNode"
          >
            <template #node-workflow="nodeProps">
              <div
                :class="[
                  'flow-node',
                  `flow-node--${nodeProps.data.typeKey}`,
                  `flow-node--${nodeProps.data.statusKey}`,
                  { selected: selectedNodeId === nodeProps.id },
                ]"
              >
                <Handle type="target" :position="Position.Left" />
                <span class="node-type">{{ nodeProps.data.type }}</span>
                <strong>{{ nodeProps.data.name }}</strong>
                <small>{{ nodeProps.data.description }}</small>
                <em>{{ nodeProps.data.status }}</em>
                <Handle type="source" :position="Position.Right" />
              </div>
            </template>
          </VueFlow>
        </div>
      </main>

      <aside class="workflow-detail panel">
        <a-tabs v-model:active-key="rightTab" size="small">
          <a-tab-pane key="overview" tab="运行概览">
            <section v-if="!selectedNode" class="detail-section">
              <h3>运行概览</h3>
              <div class="overview-grid">
                <article v-for="item in overviewMetrics" :key="item.label">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </article>
              </div>
            </section>

            <section v-if="!selectedNode" class="detail-section">
              <h3>流程信息</h3>
              <dl class="info-list">
                <div><dt>流程状态</dt><dd><a-tag :color="workflowStatusColor(activeWorkflow.status)">{{ activeWorkflow.status }}</a-tag></dd></div>
                <div><dt>负责人</dt><dd>{{ activeWorkflow.owner }}</dd></div>
                <div><dt>适用场景</dt><dd>{{ activeWorkflow.scenario }}</dd></div>
                <div><dt>当前版本</dt><dd>{{ activeWorkflow.version }}</dd></div>
                <div><dt>最近发布</dt><dd>{{ activeWorkflow.publishAt }}</dd></div>
                <div><dt>灰度比例</dt><dd>{{ activeWorkflow.grayPercent }}%</dd></div>
              </dl>
            </section>

            <section v-else class="detail-section">
              <h3>节点配置</h3>
              <dl class="info-list">
                <div><dt>节点名称</dt><dd>{{ selectedNode.name }}</dd></div>
                <div><dt>节点类型</dt><dd>{{ selectedNode.type }}</dd></div>
                <div><dt>触发条件</dt><dd>{{ selectedNode.condition }}</dd></div>
                <div><dt>输入字段</dt><dd>{{ selectedNode.input }}</dd></div>
                <div><dt>输出结果</dt><dd>{{ selectedNode.output }}</dd></div>
                <div><dt>超时时间</dt><dd>{{ selectedNode.timeout }}</dd></div>
                <div><dt>重试次数</dt><dd>{{ selectedNode.retries }} 次</dd></div>
                <div><dt>失败处理</dt><dd>{{ selectedNode.fallback }}</dd></div>
                <div><dt>人工兜底</dt><dd>{{ selectedNode.manualFallback ? '需要' : '不需要' }}</dd></div>
              </dl>
            </section>

            <section class="detail-section">
              <h3>异常告警</h3>
              <button
                v-for="alert in activeWorkflow.alerts"
                :key="alert.title"
                class="alert-row"
                @click="message.warning(alert.reason)"
              >
                <strong>{{ alert.title }}</strong>
                <span>{{ alert.reason }}</span>
              </button>
            </section>
          </a-tab-pane>

          <a-tab-pane key="logs" tab="运行记录">
            <div class="run-filter">
              <a-select v-model:value="runStatus" allow-clear placeholder="执行状态" size="small">
                <a-select-option value="成功">成功</a-select-option>
                <a-select-option value="失败">失败</a-select-option>
                <a-select-option value="处理中">处理中</a-select-option>
                <a-select-option value="已回滚">已回滚</a-select-option>
              </a-select>
            </div>
            <button v-for="run in filteredRuns" :key="run.id" class="run-row" @click="openRunDetail(run)">
              <div>
                <strong>{{ run.source }}</strong>
                <span>{{ run.time }}</span>
              </div>
              <a-tag :color="runStatusColor(run.status)">{{ run.status }}</a-tag>
              <p>{{ run.hitNode }} · {{ run.duration }} · {{ run.ticket }}</p>
              <small v-if="run.reason">{{ run.reason }}</small>
            </button>
          </a-tab-pane>

          <a-tab-pane key="release" tab="发布管控">
            <section class="detail-section">
              <h3>发布前校验</h3>
              <div v-for="item in validationChecks" :key="item.label" class="check-row">
                <span>{{ item.label }}</span>
                <a-tag :color="item.pass ? 'success' : 'error'">{{ item.pass ? '通过' : '需处理' }}</a-tag>
              </div>
            </section>

            <section class="detail-section">
              <h3>版本记录</h3>
              <div v-for="item in activeWorkflow.releaseHistory" :key="item.version" class="release-row">
                <strong>{{ item.version }}</strong>
                <span>{{ item.action }} · {{ item.operator }}</span>
                <small>{{ item.time }}</small>
              </div>
              <a-space class="release-actions">
                <a-button size="small" @click="message.info('已打开版本对比视图')">版本对比</a-button>
                <a-button size="small" danger @click="rollbackWorkflow">一键回滚</a-button>
                <a-button size="small" @click="disableWorkflow">停用流程</a-button>
              </a-space>
            </section>
          </a-tab-pane>
        </a-tabs>
      </aside>
    </section>

    <a-drawer v-model:open="runDetailOpen" width="520" :title="selectedRun?.source">
      <a-descriptions v-if="selectedRun" bordered :column="1" size="small">
        <a-descriptions-item label="执行时间">{{ selectedRun.time }}</a-descriptions-item>
        <a-descriptions-item label="触发来源">{{ selectedRun.source }}</a-descriptions-item>
        <a-descriptions-item label="执行状态">
          <a-tag :color="runStatusColor(selectedRun.status)">{{ selectedRun.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="命中节点">{{ selectedRun.hitNode }}</a-descriptions-item>
        <a-descriptions-item label="失败原因">{{ selectedRun.reason || '无' }}</a-descriptions-item>
        <a-descriptions-item label="耗时">{{ selectedRun.duration }}</a-descriptions-item>
        <a-descriptions-item label="关联工单 / 会话">{{ selectedRun.ticket }}</a-descriptions-item>
        <a-descriptions-item label="处理闭环">{{ selectedRun.action }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <a-modal v-model:open="publishOpen" title="发布工作流" @ok="confirmPublish">
      <p class="modal-desc">发布前会校验孤立节点、异常兜底、人工接管、重复通知和跨系统动作。</p>
      <div v-for="item in validationChecks" :key="item.label" class="check-row">
        <span>{{ item.label }}</span>
        <a-tag :color="item.pass ? 'success' : 'error'">{{ item.pass ? '通过' : '需处理' }}</a-tag>
      </div>
      <a-divider />
      <a-form layout="vertical">
        <a-form-item label="发布方式">
          <a-radio-group v-model:value="publishForm.mode">
            <a-radio value="gray">灰度发布</a-radio>
            <a-radio value="full">全量发布</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="灰度比例">
          <a-slider v-model:value="publishForm.grayPercent" :min="5" :max="100" :step="5" />
        </a-form-item>
        <a-form-item label="发布审批">
          <a-input v-model:value="publishForm.approver" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="createOpen" title="新建流程" @ok="submitCreate">
      <a-form layout="vertical">
        <a-form-item label="流程名称">
          <a-input v-model:value="createForm.name" />
        </a-form-item>
        <a-form-item label="适用场景">
          <a-select v-model:value="createForm.scenario">
            <a-select-option v-for="item in scenarioOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="负责人">
          <a-input v-model:value="createForm.owner" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { Handle, Position, VueFlow, useVueFlow } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

type WorkflowStatus = '运行中' | '草稿' | '待发布' | '已停用' | '异常';
type WorkflowScenario = '工单分派' | '机器人转人工' | 'SLA 升级' | '知识库补全' | '满意度回访' | '质检复核';
type NodeType = '触发器' | '条件判断' | 'AI 处理' | '人工处理' | '动作执行' | '异常处理';
type NodeTypeKey = 'trigger' | 'condition' | 'ai' | 'human' | 'action' | 'exception';
type NodeStatusKey = 'normal' | 'success' | 'warning' | 'danger' | 'draft';
type RunStatus = '成功' | '失败' | '处理中' | '已回滚';
type FlowPosition = { x: number; y: number };
type WorkflowFlowNode = {
  id: string;
  type: 'workflow';
  position: FlowPosition;
  data: WorkflowNode;
  draggable: boolean;
  selectable: boolean;
  selected?: boolean;
};
type WorkflowFlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: 'smoothstep';
  animated: boolean;
  style: Record<string, string | number>;
  labelBgPadding: [number, number];
  labelBgBorderRadius: number;
  labelBgStyle: Record<string, string>;
};
type FlowConnection = {
  source?: string;
  target?: string;
};
type FlowNodeEvent = {
  node: {
    id: string;
    position: FlowPosition;
  };
};

interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  typeKey: NodeTypeKey;
  status: string;
  statusKey: NodeStatusKey;
  description: string;
  condition: string;
  input: string;
  output: string;
  timeout: string;
  retries: number;
  fallback: string;
  manualFallback: boolean;
  x: number;
  y: number;
}

interface WorkflowEdge {
  from: string;
  to: string;
  label?: string;
}

interface RunRecord {
  id: string;
  time: string;
  source: string;
  status: RunStatus;
  hitNode: string;
  reason: string;
  duration: string;
  ticket: string;
  action: string;
}

interface WorkflowItem {
  id: string;
  name: string;
  status: WorkflowStatus;
  scenario: WorkflowScenario;
  trigger: string;
  lastRun: string;
  todayRuns: number;
  successRate: number;
  exceptionCount: number;
  owner: string;
  version: string;
  publishAt: string;
  grayPercent: number;
  metrics: Array<{ label: string; value: string; trend: string }>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  runs: RunRecord[];
  alerts: Array<{ title: string; reason: string }>;
  releaseHistory: Array<{ version: string; action: string; operator: string; time: string }>;
  validationIssues: string[];
}

const pageTitle = '工作流中心';
const pageDescription = '编排触发器、AI 节点、人工审批、执行记录、发布回滚、异常告警和流程影响指标。';
const scenarioOptions: WorkflowScenario[] = ['工单分派', '机器人转人工', 'SLA 升级', '知识库补全', '满意度回访', '质检复核'];
const nodeTemplates: Array<Pick<WorkflowNode, 'type' | 'typeKey' | 'name' | 'description'>> = [
  { type: '触发器', typeKey: 'trigger', name: '新触发器', description: '配置流程开始条件' },
  { type: '条件判断', typeKey: 'condition', name: '新条件分支', description: '按客户、工单或会话规则分流' },
  { type: 'AI 处理', typeKey: 'ai', name: '新 AI 节点', description: '配置意图、摘要、草稿或风险判断' },
  { type: '人工处理', typeKey: 'human', name: '新人工节点', description: '配置审批、复核或坐席兜底' },
  { type: '动作执行', typeKey: 'action', name: '新动作节点', description: '配置派单、通知、备注或标签更新' },
  { type: '异常处理', typeKey: 'exception', name: '新异常节点', description: '配置重试、告警、回滚或异常工单' },
];
const flowNodes = ref<WorkflowFlowNode[]>([]);
const flowEdges = ref<WorkflowFlowEdge[]>([]);
const { fitView, screenToFlowCoordinate } = useVueFlow();

const workflowList = ref<WorkflowItem[]>([
  {
    id: 'wf-refund-risk',
    name: '退款审批节点异常拦截',
    status: '异常',
    scenario: '质检复核',
    trigger: '退款 / 合同 / 投诉高风险会话',
    lastRun: '3 分钟前',
    todayRuns: 428,
    successRate: 91.2,
    exceptionCount: 12,
    owner: '陈沐阳',
    version: 'v2.8.1',
    publishAt: '2026-06-29 21:30',
    grayPercent: 20,
    metrics: [
      { label: 'AI 节点命中率', value: '87.6%', trend: '+4.8%' },
      { label: '高风险拦截', value: '76', trend: '+12' },
      { label: '节省人工时长', value: '38h', trend: '+6h' },
      { label: '异常告警', value: '12', trend: '需处理' },
    ],
    nodes: [
      node('n1', '高风险回复生成', '触发器', 'trigger', '正常', 'success', '客户命中退款/投诉关键词', 32, 64),
      node('n2', 'AI 风险评分', 'AI 处理', 'ai', '成功', 'success', '识别退款、合同、账号安全风险', 265, 64),
      node('n3', '是否需要人工复核', '条件判断', 'condition', '正常', 'normal', '风险分大于 80 或客户为 VIP', 498, 64),
      node('n4', '主管复核', '人工处理', 'human', '处理中', 'warning', '主管确认回复口径和补偿方案', 498, 242),
      node('n5', '发送回复并写备注', '动作执行', 'action', '正常', 'success', '发送合规回复并写入内部备注', 730, 64),
      node('n6', '异常工单与回滚', '异常处理', 'exception', '异常', 'danger', '失败率超阈值后暂停灰度', 730, 242),
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n5', label: '低风险' },
      { from: 'n3', to: 'n4', label: '高风险' },
      { from: 'n4', to: 'n5' },
      { from: 'n4', to: 'n6', label: '超时/驳回' },
    ],
    runs: runRecords('退款审批节点异常拦截', 'AI 风险评分'),
    alerts: [
      { title: '灰度失败率 8.8%', reason: '超过 5% 阈值，建议暂停灰度并回滚至 v2.7.4。' },
      { title: '主管复核节点拥堵', reason: '过去 30 分钟积压 18 条复核任务。' },
    ],
    releaseHistory: releaseHistory('v2.8.1'),
    validationIssues: ['是否配置异常兜底'],
  },
  {
    id: 'wf-intent-human',
    name: '机器人未命中意图转人工',
    status: '运行中',
    scenario: '机器人转人工',
    trigger: 'AI 未命中意图 / 连续低置信度',
    lastRun: '1 分钟前',
    todayRuns: 1362,
    successRate: 98.4,
    exceptionCount: 3,
    owner: '林知远',
    version: 'v4.3.0',
    publishAt: '2026-06-28 19:10',
    grayPercent: 100,
    metrics: [
      { label: '转人工减少率', value: '23.5%', trend: '+3.1%' },
      { label: 'AI 摘要覆盖', value: '99.1%', trend: '+0.6%' },
      { label: '影响客户数', value: '1,084', trend: '+146' },
      { label: '平均接起时长', value: '34s', trend: '-9s' },
    ],
    nodes: [
      node('n1', '客户消息进入', '触发器', 'trigger', '正常', 'success', '新会话或客户追问进入机器人', 32, 64),
      node('n2', 'AI 意图识别', 'AI 处理', 'ai', '成功', 'success', '识别客户问题和置信度', 265, 64),
      node('n3', '是否低置信度', '条件判断', 'condition', '正常', 'normal', '连续两轮低于 60%', 498, 64),
      node('n4', 'AI 会话摘要', 'AI 处理', 'ai', '成功', 'success', '生成上下文、历史工单和推荐知识', 498, 242),
      node('n5', '转派坐席', '人工处理', 'human', '正常', 'success', '创建转人工任务并同步摘要', 730, 242),
      node('n6', '继续机器人回复', '动作执行', 'action', '正常', 'success', '命中知识后继续自动回复', 730, 64),
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n6', label: '已识别' },
      { from: 'n3', to: 'n4', label: '未命中' },
      { from: 'n4', to: 'n5' },
    ],
    runs: runRecords('机器人未命中意图转人工', '转派坐席'),
    alerts: [{ title: '低置信度问题聚集', reason: '「账单明细导出」近 2 小时出现 37 次未命中。' }],
    releaseHistory: releaseHistory('v4.3.0'),
    validationIssues: [],
  },
  {
    id: 'wf-vip-dispatch',
    name: '高价值客户工单优先分派',
    status: '待发布',
    scenario: '工单分派',
    trigger: '新工单创建',
    lastRun: '18 分钟前',
    todayRuns: 312,
    successRate: 96.8,
    exceptionCount: 1,
    owner: '赵安然',
    version: 'v1.9.0-draft',
    publishAt: '待发布',
    grayPercent: 0,
    metrics: [
      { label: '自动分派工单', value: '284', trend: '+31' },
      { label: 'VIP 响应达标', value: '97.3%', trend: '+2.4%' },
      { label: 'SLA 风险拦截', value: '19', trend: '+5' },
      { label: '节省人工时长', value: '21h', trend: '+2h' },
    ],
    nodes: [
      node('n1', '新工单创建', '触发器', 'trigger', '正常', 'success', '工单从任意渠道创建', 32, 64),
      node('n2', 'AI 工单分类', 'AI 处理', 'ai', '正常', 'success', '识别产品、紧急度和投诉风险', 265, 64),
      node('n3', '是否高价值客户', '条件判断', 'condition', '待配置', 'draft', 'VIP、续约关键客户、投诉风险客户', 498, 64),
      node('n4', '分派高级坐席', '动作执行', 'action', '正常', 'success', '修改优先级并分派给专属队列', 730, 64),
      node('n5', '通知客户经理', '动作执行', 'action', '正常', 'success', '推送企业微信和邮件提醒', 730, 242),
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4', label: '是' },
      { from: 'n3', to: 'n5', label: '投诉风险' },
    ],
    runs: runRecords('高价值客户工单优先分派', '分派高级坐席'),
    alerts: [{ title: '发布前缺少异常兜底', reason: '分派失败后尚未配置转人工或创建异常工单。' }],
    releaseHistory: releaseHistory('v1.9.0-draft'),
    validationIssues: ['是否存在没有出口的条件分支', '是否配置异常兜底'],
  },
  {
    id: 'wf-sla-upgrade',
    name: 'SLA 即将超时自动升级',
    status: '运行中',
    scenario: 'SLA 升级',
    trigger: '距离响应 / 解决时限不足',
    lastRun: '5 分钟前',
    todayRuns: 786,
    successRate: 97.5,
    exceptionCount: 4,
    owner: '周向晚',
    version: 'v3.1.2',
    publishAt: '2026-06-27 18:45',
    grayPercent: 100,
    metrics: [
      { label: 'SLA 风险拦截', value: '142', trend: '+18' },
      { label: '主管升级', value: '36', trend: '+7' },
      { label: '平均执行时长', value: '1.8s', trend: '-0.2s' },
      { label: '影响工单数', value: '691', trend: '+84' },
    ],
    nodes: [
      node('n1', 'SLA 即将超时', '触发器', 'trigger', '正常', 'success', '响应或解决时限剩余 20 分钟', 32, 64),
      node('n2', '是否已有负责人', '条件判断', 'condition', '正常', 'normal', '检查工单 owner 和队列状态', 265, 64),
      node('n3', '发送提醒', '动作执行', 'action', '正常', 'success', '提醒负责人和班组频道', 498, 64),
      node('n4', '升级主管', '人工处理', 'human', '正常', 'success', '超过时限自动升级给主管', 730, 64),
      node('n5', '超时告警', '异常处理', 'exception', '正常', 'success', '记录 SLA 风险和异常工单', 730, 242),
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3', label: '有负责人' },
      { from: 'n3', to: 'n4' },
      { from: 'n2', to: 'n5', label: '无负责人' },
    ],
    runs: runRecords('SLA 即将超时自动升级', '升级主管'),
    alerts: [{ title: '跨系统通知延迟', reason: '邮件网关 P95 延迟升至 2.4s，已自动重试。' }],
    releaseHistory: releaseHistory('v3.1.2'),
    validationIssues: [],
  },
  {
    id: 'wf-kb-gap',
    name: '知识库缺口自动沉淀',
    status: '草稿',
    scenario: '知识库补全',
    trigger: '相似未命中问题聚集',
    lastRun: '未运行',
    todayRuns: 0,
    successRate: 0,
    exceptionCount: 0,
    owner: '孟栀',
    version: 'v0.7.0',
    publishAt: '草稿',
    grayPercent: 0,
    metrics: [
      { label: '知识缺口沉淀', value: '46', trend: '+11' },
      { label: 'AI 知识推荐', value: '82.5%', trend: '+5.2%' },
      { label: '待审核任务', value: '18', trend: '需确认' },
      { label: '影响客户数', value: '392', trend: '+64' },
    ],
    nodes: [
      node('n1', '知识命中率低', '触发器', 'trigger', '待配置', 'draft', '同类问题 24 小时低于 40%', 32, 64),
      node('n2', 'AI 相似问题聚类', 'AI 处理', 'ai', '正常', 'success', '归并未命中问法和会话证据', 265, 64),
      node('n3', '知识运营确认', '人工处理', 'human', '正常', 'success', '审核推荐标题、答案和适用范围', 498, 64),
      node('n4', '创建知识补充任务', '动作执行', 'action', '正常', 'success', '生成待审核知识条目', 730, 64),
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
    ],
    runs: runRecords('知识库缺口自动沉淀', 'AI 相似问题聚类'),
    alerts: [{ title: '草稿未校验', reason: '需补充异常处理节点后再进入发布审批。' }],
    releaseHistory: releaseHistory('v0.7.0'),
    validationIssues: ['是否配置异常兜底', '是否涉及跨系统动作'],
  },
  {
    id: 'wf-sat-review',
    name: '低满意度会话自动复盘',
    status: '运行中',
    scenario: '满意度回访',
    trigger: '客户评分低于阈值',
    lastRun: '9 分钟前',
    todayRuns: 124,
    successRate: 95.9,
    exceptionCount: 2,
    owner: '许嘉宁',
    version: 'v2.2.6',
    publishAt: '2026-06-26 20:00',
    grayPercent: 100,
    metrics: [
      { label: '低分复盘任务', value: '42', trend: '+8' },
      { label: '质检建议覆盖', value: '93.4%', trend: '+1.6%' },
      { label: '客户挽回数', value: '17', trend: '+4' },
      { label: '平均执行时长', value: '2.2s', trend: '-0.1s' },
    ],
    nodes: [
      node('n1', '满意度低于阈值', '触发器', 'trigger', '正常', 'success', '客户评分低于 3 分', 32, 64),
      node('n2', 'AI 会话摘要', 'AI 处理', 'ai', '正常', 'success', '汇总会话、坐席、AI 回复和工单记录', 265, 64),
      node('n3', 'AI 质检打分', 'AI 处理', 'ai', '正常', 'success', '输出质检标签和改进建议', 498, 64),
      node('n4', '创建复盘任务', '动作执行', 'action', '正常', 'success', '关联原会话与负责人', 730, 64),
      node('n5', '客服质检复盘', '人工处理', 'human', '处理中', 'warning', '质检人员确认责任和改进动作', 730, 242),
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' },
    ],
    runs: runRecords('低满意度会话自动复盘', '创建复盘任务'),
    alerts: [{ title: '复盘超时', reason: '2 条复盘任务超过 4 小时未确认。' }],
    releaseHistory: releaseHistory('v2.2.6'),
    validationIssues: [],
  },
]);

const filters = reactive({
  keyword: '',
});
const activeWorkflowId = ref(workflowList.value[0].id);
const selectedNodeId = ref(workflowList.value[0].nodes[1].id);
const rightTab = ref('overview');
const runStatus = ref<RunStatus | undefined>();
const runDetailOpen = ref(false);
const selectedRun = ref<RunRecord>();
const publishOpen = ref(false);
const createOpen = ref(false);
const publishForm = reactive({ mode: 'gray', grayPercent: 20, approver: '运营审批组' });
const createForm = reactive<{ name: string; scenario: WorkflowScenario; owner: string }>({
  name: '',
  scenario: '机器人转人工',
  owner: '陈沐阳',
});

const filteredWorkflows = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  return workflowList.value.filter((item) => {
    const matchKeyword =
      !keyword ||
      [item.name, item.trigger, item.owner, item.scenario, ...item.nodes.map((nodeItem) => nodeItem.name)]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    return matchKeyword;
  });
});

const activeWorkflow = computed(() => {
  return workflowList.value.find((item) => item.id === activeWorkflowId.value) || workflowList.value[0];
});

watch(
  activeWorkflow,
  () => {
    loadFlowElements();
  },
  { immediate: true },
);

const selectedNode = computed(() => {
  return activeWorkflow.value.nodes.find((item) => item.id === selectedNodeId.value);
});

const overviewMetrics = computed(() => [
  { label: '今日执行次数', value: String(activeWorkflow.value.todayRuns) },
  { label: '成功率', value: `${activeWorkflow.value.successRate}%` },
  { label: '失败次数', value: String(Math.max(activeWorkflow.value.exceptionCount, Math.round(activeWorkflow.value.todayRuns * (100 - activeWorkflow.value.successRate) / 100))) },
  { label: '平均执行时长', value: activeWorkflow.value.runs[0]?.duration || '1.9s' },
  { label: '影响工单数', value: activeWorkflow.value.metrics[3]?.value || '0' },
  { label: '节省人工处理时长', value: activeWorkflow.value.metrics.find((item) => item.label.includes('节省'))?.value || '18h' },
]);

const filteredRuns = computed(() => {
  return activeWorkflow.value.runs.filter((item) => !runStatus.value || item.status === runStatus.value);
});

const validationChecks = computed(() => {
  const issues = activeWorkflow.value.validationIssues;
  const hasExceptionNode = activeWorkflow.value.nodes.some((item) => item.typeKey === 'exception');
  return [
    { label: '是否存在孤立节点', pass: !issues.includes('是否存在孤立节点') },
    { label: '是否存在没有出口的条件分支', pass: !issues.includes('是否存在没有出口的条件分支') },
    { label: '是否配置异常兜底', pass: hasExceptionNode && !issues.includes('是否配置异常兜底') },
    { label: '是否配置人工接管策略', pass: activeWorkflow.value.nodes.some((item) => item.manualFallback || item.typeKey === 'human') },
    { label: '是否可能造成重复通知', pass: !issues.includes('是否可能造成重复通知') },
    { label: '是否影响高价值客户', pass: true },
    { label: '是否涉及跨系统动作', pass: !issues.includes('是否涉及跨系统动作') },
  ];
});

function loadFlowElements() {
  flowNodes.value = activeWorkflow.value.nodes.map((item) => toFlowNode(item));
  flowEdges.value = activeWorkflow.value.edges.map((item) => toFlowEdge(item));
  nextTick(() => {
    fitView({ padding: 0.08, duration: 120, maxZoom: 0.82 });
  });
}

function toFlowNode(item: WorkflowNode): WorkflowFlowNode {
  return {
    id: item.id,
    type: 'workflow',
    position: { x: item.x, y: item.y },
    data: item,
    draggable: true,
    selectable: true,
  };
}

function toFlowEdge(item: WorkflowEdge): WorkflowFlowEdge {
  return {
    id: `${item.from}-${item.to}-${item.label || 'edge'}`,
    source: item.from,
    target: item.to,
    label: item.label,
    type: 'smoothstep',
    animated: activeWorkflow.value.status === '运行中',
    style: { stroke: 'rgba(79, 123, 255, .72)', strokeWidth: 2 },
    labelBgPadding: [6, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: 'var(--app-surface)' },
  };
}

function syncFlowData() {
  activeWorkflow.value.nodes.forEach((item) => {
    const flowNode = flowNodes.value.find((nodeItem) => nodeItem.id === item.id);
    if (flowNode) {
      item.x = Math.round(flowNode.position.x);
      item.y = Math.round(flowNode.position.y);
    }
  });
  activeWorkflow.value.edges = flowEdges.value.map((item) => ({
    from: item.source,
    to: item.target,
    label: typeof item.label === 'string' ? item.label : undefined,
  }));
}

function node(
  id: string,
  name: string,
  type: NodeType,
  typeKey: NodeTypeKey,
  status: string,
  statusKey: NodeStatusKey,
  description: string,
  x: number,
  y: number,
): WorkflowNode {
  return {
    id,
    name,
    type,
    typeKey,
    status,
    statusKey,
    description,
    condition: description,
    input: typeKey === 'trigger' ? '客户消息、工单字段、SLA 计时器' : '上游节点输出、客户标签、历史会话',
    output: typeKey === 'ai' ? '置信度、摘要、分类、风险评分' : '节点执行结果与业务状态',
    timeout: typeKey === 'human' ? '4 小时' : '30 秒',
    retries: typeKey === 'exception' ? 3 : 1,
    fallback: typeKey === 'exception' ? '创建异常工单并通知流程负责人' : '失败后进入异常处理节点',
    manualFallback: typeKey === 'human' || typeKey === 'exception',
    x,
    y,
  };
}

function runRecords(flowName: string, nodeName: string): RunRecord[] {
  return [
    {
      id: `${flowName}-r1`,
      time: '2026-06-30 14:26',
      source: '客户会话 C-92831',
      status: '成功',
      hitNode: nodeName,
      reason: '',
      duration: '1.6s',
      ticket: 'TK-20260630-0184',
      action: '已写入执行记录，关联客户上下文和 AI 摘要。',
    },
    {
      id: `${flowName}-r2`,
      time: '2026-06-30 14:18',
      source: '工单 TK-20260630-0172',
      status: '失败',
      hitNode: '异常处理节点',
      reason: '企业微信通知接口超时，已进入重试队列。',
      duration: '5.8s',
      ticket: 'TK-20260630-0172',
      action: '已创建异常工单并通知流程负责人。',
    },
    {
      id: `${flowName}-r3`,
      time: '2026-06-30 14:05',
      source: '灰度版本监控',
      status: '已回滚',
      hitNode: '回滚到上一版本',
      reason: '灰度失败率超过阈值。',
      duration: '2.4s',
      ticket: 'REL-20260630-042',
      action: '已暂停灰度，回滚至上一稳定版本。',
    },
    {
      id: `${flowName}-r4`,
      time: '2026-06-30 13:57',
      source: '客户会话 C-92788',
      status: '处理中',
      hitNode: '人工兜底节点',
      reason: '',
      duration: '进行中',
      ticket: 'TK-20260630-0161',
      action: '等待人工审批后继续执行。',
    },
  ];
}

function releaseHistory(version: string) {
  return [
    { version, action: '灰度发布 20%', operator: '陈沐阳', time: '2026-06-29 21:30' },
    { version: '上一稳定版', action: '全量发布', operator: '运营审批组', time: '2026-06-27 20:10' },
    { version: '审批记录', action: '发布审批通过', operator: '客服运营主管', time: '2026-06-27 19:40' },
  ];
}

function selectWorkflow(id: string) {
  activeWorkflowId.value = id;
  selectedNodeId.value = '';
  runStatus.value = undefined;
  rightTab.value = 'overview';
}

function selectNode(id: string) {
  selectedNodeId.value = id;
  rightTab.value = 'overview';
  flowNodes.value = flowNodes.value.map((item) => ({ ...item, selected: item.id === id }));
}

function refreshWorkflows() {
  message.success('工作流数据已刷新');
}

function openCreate() {
  Object.assign(createForm, { name: '新建 AI 客服自动化流程', scenario: '机器人转人工', owner: '陈沐阳' });
  createOpen.value = true;
}

function submitCreate() {
  if (!createForm.name.trim()) {
    message.warning('请输入流程名称');
    return;
  }
  const id = `wf-${Date.now()}`;
  workflowList.value.unshift({
    id,
    name: createForm.name,
    status: '草稿',
    scenario: createForm.scenario,
    trigger: '待配置触发器',
    lastRun: '未运行',
    todayRuns: 0,
    successRate: 0,
    exceptionCount: 0,
    owner: createForm.owner,
    version: 'v0.1.0',
    publishAt: '草稿',
    grayPercent: 0,
    metrics: [
      { label: '今日执行次数', value: '0', trend: '-' },
      { label: 'AI 节点命中率', value: '0%', trend: '-' },
      { label: '异常告警', value: '0', trend: '-' },
      { label: '节省人工时长', value: '0h', trend: '-' },
    ],
    nodes: [
      node('n1', '待配置触发器', '触发器', 'trigger', '待配置', 'draft', '选择业务触发条件', 32, 64),
      node('n2', 'AI 处理节点', 'AI 处理', 'ai', '待配置', 'draft', '配置意图识别、摘要或风险判断', 265, 64),
    ],
    edges: [{ from: 'n1', to: 'n2' }],
    runs: [],
    alerts: [{ title: '草稿待配置', reason: '请补齐条件分支、异常兜底和人工接管策略。' }],
    releaseHistory: [{ version: 'v0.1.0', action: '草稿保存', operator: createForm.owner, time: '刚刚' }],
    validationIssues: ['是否配置异常兜底'],
  });
  activeWorkflowId.value = id;
  selectedNodeId.value = '';
  createOpen.value = false;
  message.success('流程已创建');
}

function openPublish() {
  publishForm.grayPercent = activeWorkflow.value.grayPercent || 20;
  publishOpen.value = true;
}

function confirmPublish() {
  const failed = validationChecks.value.filter((item) => !item.pass);
  if (failed.length) {
    message.warning(`发布前还有 ${failed.length} 项校验需处理`);
    return;
  }
  activeWorkflow.value.status = '运行中';
  activeWorkflow.value.grayPercent = publishForm.mode === 'full' ? 100 : publishForm.grayPercent;
  activeWorkflow.value.publishAt = '2026-06-30 14:30';
  activeWorkflow.value.releaseHistory.unshift({
    version: activeWorkflow.value.version,
    action: publishForm.mode === 'full' ? '全量发布' : `灰度发布 ${publishForm.grayPercent}%`,
    operator: publishForm.approver,
    time: '刚刚',
  });
  publishOpen.value = false;
  message.success('工作流已提交发布');
}

function copyWorkflow() {
  const copied: WorkflowItem = JSON.parse(JSON.stringify(activeWorkflow.value)) as WorkflowItem;
  copied.id = `wf-copy-${Date.now()}`;
  copied.name = `${activeWorkflow.value.name} 副本`;
  copied.status = '草稿';
  copied.publishAt = '草稿';
  copied.grayPercent = 0;
  workflowList.value.unshift(copied);
  activeWorkflowId.value = copied.id;
  selectedNodeId.value = '';
  message.success('流程副本已创建');
}

function focusRunLogs() {
  rightTab.value = 'logs';
}

function addNode(template = nodeTemplates[4]) {
  const id = `n${Date.now()}`;
  const x = 120 + activeWorkflow.value.nodes.length * 36;
  const y = 120 + activeWorkflow.value.nodes.length * 24;
  activeWorkflow.value.nodes.push(
    node(id, template.name, template.type, template.typeKey, '待配置', 'draft', template.description, x, y),
  );
  flowNodes.value.push(toFlowNode(activeWorkflow.value.nodes[activeWorkflow.value.nodes.length - 1]));
  selectedNodeId.value = id;
  rightTab.value = 'overview';
  nextTick(() => fitView({ padding: 0.08, duration: 120, maxZoom: 0.9 }));
  message.success(`${template.type}已新增，可直接拖拽调整位置`);
}

function deleteNode() {
  if (!selectedNode.value) return;
  activeWorkflow.value.nodes = activeWorkflow.value.nodes.filter((item) => item.id !== selectedNodeId.value);
  activeWorkflow.value.edges = activeWorkflow.value.edges.filter((item) => item.from !== selectedNodeId.value && item.to !== selectedNodeId.value);
  flowNodes.value = flowNodes.value.filter((item) => item.id !== selectedNodeId.value);
  flowEdges.value = flowEdges.value.filter((item) => item.source !== selectedNodeId.value && item.target !== selectedNodeId.value);
  selectedNodeId.value = '';
  message.success('节点已删除');
}

function moveNode(direction: 'left' | 'right') {
  if (!selectedNode.value) return;
  selectedNode.value.x = Math.max(32, Math.min(730, selectedNode.value.x + (direction === 'left' ? -90 : 90)));
  flowNodes.value = flowNodes.value.map((item) =>
    item.id === selectedNodeId.value ? { ...item, position: { x: selectedNode.value?.x || item.position.x, y: selectedNode.value?.y || item.position.y } } : item,
  );
}

function handleNodeClick(event: FlowNodeEvent) {
  selectNode(event.node.id);
}

function syncDraggedNode(event: FlowNodeEvent) {
  const item = activeWorkflow.value.nodes.find((nodeItem) => nodeItem.id === event.node.id);
  if (!item) return;
  item.x = Math.round(event.node.position.x);
  item.y = Math.round(event.node.position.y);
  message.success('节点位置已更新');
}

function handleConnect(connection: FlowConnection) {
  if (!connection.source || !connection.target || connection.source === connection.target) {
    message.warning('请选择两个不同节点进行连线');
    return;
  }
  const exists = activeWorkflow.value.edges.some((item) => item.from === connection.source && item.to === connection.target);
  if (exists) {
    message.info('这两个节点已经存在连线');
    return;
  }
  const edge = { from: connection.source, to: connection.target };
  activeWorkflow.value.edges.push(edge);
  flowEdges.value.push(toFlowEdge(edge));
  message.success('节点连线已创建');
}

function clearSelectedNode() {
  selectedNodeId.value = '';
  flowNodes.value = flowNodes.value.map((item) => ({ ...item, selected: false }));
}

function handleDrop(event: DragEvent) {
  const typeKey = event.dataTransfer?.getData('application/workflow-node-type') as NodeTypeKey | undefined;
  const template = nodeTemplates.find((item) => item.typeKey === typeKey);
  if (!template) return;
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY });
  const id = `n${Date.now()}`;
  activeWorkflow.value.nodes.push(
    node(id, template.name, template.type, template.typeKey, '待配置', 'draft', template.description, position.x, position.y),
  );
  flowNodes.value.push(toFlowNode(activeWorkflow.value.nodes[activeWorkflow.value.nodes.length - 1]));
  selectNode(id);
}

function startNodeDrag(event: DragEvent, typeKey: NodeTypeKey) {
  event.dataTransfer?.setData('application/workflow-node-type', typeKey);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
  }
}

function fitCurrentView() {
  syncFlowData();
  fitView({ padding: 0.08, duration: 180, maxZoom: 0.9 });
}

function rollbackWorkflow() {
  activeWorkflow.value.status = '运行中';
  activeWorkflow.value.grayPercent = 0;
  activeWorkflow.value.releaseHistory.unshift({ version: '上一稳定版', action: '一键回滚', operator: '系统', time: '刚刚' });
  message.success('已回滚至上一稳定版本');
}

function disableWorkflow() {
  activeWorkflow.value.status = '已停用';
  message.success('流程已停用');
}

function openRunDetail(run: RunRecord) {
  selectedRun.value = run;
  runDetailOpen.value = true;
}

function workflowStatusColor(status: WorkflowStatus) {
  const map: Record<WorkflowStatus, string> = {
    运行中: 'success',
    草稿: 'default',
    待发布: 'processing',
    已停用: 'default',
    异常: 'error',
  };
  return map[status];
}

function runStatusColor(status: RunStatus) {
  const map: Record<RunStatus, string> = {
    成功: 'success',
    失败: 'error',
    处理中: 'processing',
    已回滚: 'warning',
  };
  return map[status];
}
</script>

<style scoped lang="scss">
.workflow-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  height: 100%;
  color: var(--app-text);
  overflow: hidden;
}

.workflow-topbar,
.panel {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.workflow-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;

  h1 {
    margin: 0 0 4px;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: var(--app-text-secondary);
    font-weight: 600;
    line-height: 1.7;
  }
}

.workflow-shell {
  display: grid;
  grid-template-columns: 280px minmax(390px, 1fr) 300px;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.panel {
  min-height: 0;
  padding: 14px;
  overflow: auto;
}

.panel-title,
.builder-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 16px;
  }

  p,
  span {
    margin: 4px 0 0;
    color: var(--app-text-secondary);
    font-size: 12px;
  }
}

.workflow-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workflow-list {
  display: grid;
  gap: 10px;
}

.workflow-card {
  display: block;
  width: 100%;
  padding: 12px;
  text-align: left;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  cursor: pointer;
  transition: 0.18s ease;

  &.active {
    border-color: var(--app-primary);
    box-shadow: inset 3px 0 0 var(--app-primary);
  }

  p {
    margin: 8px 0;
    color: var(--app-text-secondary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.workflow-card__head,
.workflow-card__metrics,
.workflow-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.workflow-card__head strong {
  min-width: 0;
  font-size: 14px;
}

.workflow-card__metrics {
  padding: 8px;
  background: var(--app-surface);
  border: 1px solid rgba(79, 123, 255, 0.12);
  border-radius: 6px;

  span {
    color: var(--app-text-secondary);
    font-size: 12px;
  }
}

.workflow-card__foot {
  margin-top: 8px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.danger {
  color: var(--app-danger) !important;
}

.workflow-builder {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.canvas-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background:
    linear-gradient(rgba(79, 123, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 123, 255, 0.08) 1px, transparent 1px),
    var(--app-surface-muted);
  background-size: 28px 28px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.workflow-vue-flow {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: transparent;
  --vf-node-bg: transparent;
  --vf-node-text: var(--app-text);
  --vf-handle: var(--app-primary);
  --vf-connection-path: var(--app-primary);
  --vf-edge-text: var(--app-text-secondary);
}

:deep(.vue-flow__pane) {
  cursor: grab;
}

:deep(.vue-flow__pane.dragging) {
  cursor: grabbing;
}

:deep(.vue-flow__node) {
  border: 0;
  background: transparent;
  box-shadow: none;
}

:deep(.vue-flow__edge-path) {
  stroke-width: 2;
}

:deep(.vue-flow__edge-textbg) {
  fill: var(--app-surface);
}

:deep(.vue-flow__edge-text) {
  fill: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

:deep(.vue-flow__handle) {
  width: 9px;
  height: 9px;
  background: var(--app-primary);
  border: 2px solid var(--app-surface);
}

.flow-node {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 4px;
  width: 190px;
  min-height: 92px;
  padding: 10px;
  text-align: left;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  position: relative;

  &.selected {
    border-color: var(--app-primary);
    box-shadow: 0 0 0 3px rgba(79, 123, 255, 0.16), 0 10px 20px rgba(15, 23, 42, 0.08);
  }

  strong {
    font-size: 14px;
  }

  small {
    color: var(--app-text-secondary);
    font-size: 12px;
    line-height: 1.45;
  }

  em {
    color: var(--app-text-muted);
    font-size: 12px;
    font-style: normal;
  }
}

.node-type {
  width: max-content;
  padding: 2px 7px;
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 700;
  background: var(--app-surface-muted);
  border-radius: 999px;
}

.flow-node--ai {
  border-color: rgba(139, 92, 246, 0.36);
  background: linear-gradient(135deg, rgba(79, 123, 255, 0.12), rgba(139, 92, 246, 0.12)), var(--app-surface);

  .node-type {
    color: #4f46e5;
    background: rgba(79, 123, 255, 0.14);
  }
}

.flow-node--human {
  border-color: rgba(34, 197, 94, 0.34);

  .node-type {
    color: #15803d;
    background: rgba(34, 197, 94, 0.12);
  }
}

.flow-node--exception,
.flow-node--danger {
  border-color: rgba(239, 68, 68, 0.48);

  .node-type,
  em {
    color: var(--app-danger);
  }
}

.flow-node--warning {
  border-color: rgba(245, 158, 11, 0.5);
}

.flow-node--draft {
  border-style: dashed;
}

.workflow-detail {
  .ant-tabs {
    height: 100%;
  }
}

.detail-section {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-size: 14px;
  }
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  article {
    padding: 10px;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-border);
    border-radius: 8px;
  }

  span {
    display: block;
    color: var(--app-text-secondary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 6px;
    font-size: 18px;
  }
}

.info-list {
  display: grid;
  gap: 8px;
  margin: 0;

  div {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--app-border);
  }

  dt {
    color: var(--app-text-secondary);
  }

  dd {
    min-width: 0;
    margin: 0;
    color: var(--app-text);
  }
}

.alert-row,
.run-row {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 8px;
  text-align: left;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  cursor: pointer;

  strong,
  span,
  small,
  p {
    display: block;
  }

  span,
  small,
  p {
    margin: 4px 0 0;
    color: var(--app-text-secondary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.run-filter {
  margin-bottom: 10px;
}

.run-row {
  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
}

.check-row,
.release-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--app-border);
}

.release-row {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);

  small {
    grid-column: 2;
    color: var(--app-text-secondary);
  }
}

.release-actions {
  margin-top: 12px;
}

.modal-desc {
  color: var(--app-text-secondary);
  line-height: 1.6;
}

button {
  font: inherit;
}

@media (max-width: 1360px) {
  .workflow-shell {
    grid-template-columns: 260px minmax(360px, 1fr) 280px;
    gap: 10px;
  }
}

@media (max-width: 980px) {
  .workflow-shell {
    grid-template-columns: 1fr;
    overflow: auto;
  }
}
</style>
