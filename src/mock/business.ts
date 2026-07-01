import type { ApiId } from '@/api/types';
import type { BusinessRecord, BusinessRecordPayload, BusinessRecordQueryParams, BusinessRecordStatus } from '@/api/business';
import { cloneMock, createMockId, createMockResponse, matchesKeyword, nowText, paginateMock, sortByTimeDesc } from '@/mock/core';

interface ModuleSeed {
  module: string;
  prefix: string;
  titles: string[];
  channel: string;
  metric: string;
  aiSuggestion: string;
}

const moduleSeeds: ModuleSeed[] = [
  { module: 'service-calls', prefix: 'CALL', titles: ['VIP 客户来电排队超时', '退款咨询需要主管监听', '售后热线情绪升高'], channel: '电话', metric: '-', aiSuggestion: '建议主管开启耳语辅助，并优先接入高价值客户。' },
  { module: 'service-live-chat', prefix: 'CHAT', titles: ['机器人未命中密码重置意图', '多会话需要人工接管', '客户催促处理进度'], channel: '在线客服', metric: '-', aiSuggestion: '建议接管高风险会话，并引用最新密码重置知识。' },
  { module: 'omnichannel-email', prefix: 'MAIL', titles: ['账单争议邮件待审批', '附件缺失需要补充', '退款邮件线程需合并'], channel: '邮件', metric: '-', aiSuggestion: '建议合并重复线程并使用合规模板回复。' },
  { module: 'omnichannel-sms', prefix: 'SMS', titles: ['验证码发送失败重试', '营销短信退订风险', '通知模板待审核'], channel: '短信', metric: '-', aiSuggestion: '建议暂停低互动任务，避开夜间发送窗口。' },
  { module: 'omnichannel-inbox', prefix: 'INBOX', titles: ['跨渠道客户待合并', '重复咨询待去重', '高优消息待分派'], channel: '全渠道', metric: '-', aiSuggestion: '建议按客户和意图聚合后统一指派。' },
  { module: 'operations-agents', prefix: 'AGT', titles: ['坐席负载不均', '技能组覆盖不足', '新人需要辅导'], channel: '坐席运营', metric: '-', aiSuggestion: '建议把退款技能补充到晚班坐席组。' },
  { module: 'operations-scheduling', prefix: 'SCH', titles: ['周五晚高峰缺口', '调班申请待审批', '技能排班冲突'], channel: '排班', metric: '-', aiSuggestion: '建议提前开放售后加班班次。' },
  { module: 'operations-performance', prefix: 'PERF', titles: ['处理时长异常升高', '满意度目标复盘', '团队排名待确认'], channel: '绩效', metric: '-', aiSuggestion: '建议对高时长低风险场景做定向辅导。' },
  { module: 'operations-quality', prefix: 'QA', titles: ['退款话术疑似违规', '质检申诉待审核', '脚本偏离样本'], channel: '质检', metric: '-', aiSuggestion: '建议复核高风险录音并更新质检规则。' },
  { module: 'operations-training', prefix: 'TRN', titles: ['新人课程未完成', '账单争议专项训练', '考试结果待发布'], channel: '培训', metric: '-', aiSuggestion: '建议为低分坐席安排模拟演练。' },
  { module: 'customers-360', prefix: 'CUS', titles: ['高价值客户续约风险', '客户画像待补全', '互动历史需回访'], channel: '客户', metric: '-', aiSuggestion: '建议先回访续约临近且情绪下降的客户。' },
  { module: 'customers-journey', prefix: 'JNY', titles: ['首次升级后重复来访', '触点转化下降', '主动关怀节点缺失'], channel: '旅程', metric: '-', aiSuggestion: '建议在升级后增加主动关怀触点。' },
  { module: 'ai-workflows', prefix: 'WF', titles: ['退款审批节点拥堵', '失败流程待重试', '灰度版本待发布'], channel: 'AI 工作流', metric: '-', aiSuggestion: '建议拆分审批节点并回滚异常版本。' },
  { module: 'ai-prompts', prefix: 'PRM', titles: ['退款提示词评测下降', '变量覆盖不足', '安全护栏触发'], channel: '提示词', metric: '-', aiSuggestion: '建议回滚到上一稳定版本并补充评测集。' },
  { module: 'ai-models', prefix: 'MDL', titles: ['摘要任务成本偏高', '模型路由待调整', '降级策略触发'], channel: '模型', metric: '-', aiSuggestion: '建议低风险摘要路由到低成本模型。' },
  { module: 'analytics-operations', prefix: 'OPS', titles: ['邮件队列积压', '渠道成本波动', '效率指标异常'], channel: '运营分析', metric: '-', aiSuggestion: '建议钻取邮件渠道和账单分类。' },
  { module: 'analytics-bi', prefix: 'BI', titles: ['SLA 指标口径冲突', '订阅报表失败', '导出任务排队'], channel: 'BI', metric: '-', aiSuggestion: '建议统一 SLA 指标口径后重新发布。' },
  { module: 'analytics-sla', prefix: 'SLA', titles: ['高价值客户即将超时', '升级规则待启用', '履约率下降'], channel: 'SLA', metric: '-', aiSuggestion: '建议提前 30 分钟触发预警。' },
  { module: 'analytics-risk', prefix: 'RSK', titles: ['异常租户切换', '投诉升级风险', '流失风险升高'], channel: '风险', metric: '-', aiSuggestion: '建议冻结敏感操作并派单给安全负责人。' },
  { module: 'analytics-monitoring', prefix: 'MON', titles: ['知识检索延迟升高', '队列任务积压', '模型调用失败'], channel: '监控', metric: '-', aiSuggestion: '建议扩容向量检索副本。' },
  { module: 'analytics-alerts', prefix: 'ALT', titles: ['重复 SLA 告警', '严重告警待认领', '通知规则过宽'], channel: '告警', metric: '-', aiSuggestion: '建议合并重复告警并按区域路由。' },
  { module: 'system-permissions', prefix: 'RBAC', titles: ['角色数据范围过宽', '敏感权限待审批', '菜单授权待同步'], channel: '权限', metric: '-', aiSuggestion: '建议把高风险角色收窄到部门级。' },
  { module: 'system-audit', prefix: 'AUD', titles: ['夜间导出异常', 'AI 决策审计待查', '登录风险会话'], channel: '审计', metric: '-', aiSuggestion: '建议复核夜间导出链路。' },
  { module: 'system-management', prefix: 'SYS', titles: ['业务开关待发布', '参数变更需审批', '字典项冲突'], channel: '系统', metric: '-', aiSuggestion: '建议对高风险配置启用双人审批。' },
  { module: 'system-open-platform', prefix: 'API', titles: ['Webhook 失败率升高', 'API 密钥待轮换', '应用配额接近上限'], channel: '开放平台', metric: '-', aiSuggestion: '建议轮换密钥并检查回调地址。' },
  { module: 'dashboard-workbench', prefix: 'DSH', titles: ['今日 SLA 风险聚合', '投诉类工单上升', 'AI 介入建议待确认'], channel: '工作台', metric: '-', aiSuggestion: '建议优先处理投诉上升和技术类时长偏高。' },
  { module: 'analytics-cockpit', prefix: 'CKP', titles: ['大屏核心指标待刷新', '区域服务波动', '风险墙需要升级'], channel: '驾驶舱', metric: '-', aiSuggestion: '建议把 SLA 压力和风险队列提升到首屏。' },
];

const owners = ['陈沐阳', '郑宁', '刘薇', '谢砚青'];
const customers = ['蓝湖集团', '星河科技', '云杉零售', '北辰制造'];
const statuses: BusinessRecordStatus[] = ['待处理', '处理中', '待审核', '已完成'];
const priorities: BusinessRecord['priority'][] = ['中', '高', '紧急', '低'];

const seeds = moduleSeeds.flatMap((seed) =>
  seed.titles.map((title, index) => createRecord(seed, title, index)),
);

let mockBusinessRecords = cloneMock(seeds);

export function getMockBusinessList(params: BusinessRecordQueryParams = {}) {
  const filtered = mockBusinessRecords.filter(
    (item) =>
      (!params.module || item.module === params.module) &&
      (!params.status || item.status === params.status) &&
      matchesKeyword([item.title, item.code, item.owner, item.customer, item.channel], params.keyword),
  );

  return createMockResponse(paginateMock(sortByTimeDesc(filtered, (item) => item.updateTime), params));
}

export function getMockBusinessDetail(id: ApiId) {
  return createMockResponse(findRecord(id));
}

export function createMockBusinessRecord(payload: BusinessRecordPayload) {
  const seed = moduleSeeds.find((item) => item.module === payload.module) ?? moduleSeeds[0];
  const record: BusinessRecord = {
    id: createMockId('biz'),
    module: payload.module,
    title: payload.title,
    code: `${seed.prefix}${Date.now().toString().slice(-8)}`,
    owner: payload.owner,
    customer: payload.customer,
    channel: payload.channel,
    status: payload.status,
    priority: payload.priority,
    metric: payload.metric,
    risk: payload.risk,
    description: payload.description,
    aiSuggestion: payload.aiSuggestion,
    tags: payload.tags ?? ['新建', seed.channel],
    timeline: [createTimeline('创建记录', payload.owner, '业务记录已创建并进入处理队列。')],
    updateTime: nowText(),
  };

  mockBusinessRecords.unshift(record);
  return createMockResponse(record.id);
}

export function updateMockBusinessRecord(id: ApiId, payload: BusinessRecordPayload) {
  findRecord(id);
  mockBusinessRecords = mockBusinessRecords.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          ...payload,
          tags: payload.tags ?? item.tags,
          updateTime: nowText(),
          timeline: [createTimeline('更新信息', payload.owner, '已更新业务记录内容。'), ...item.timeline],
        }
      : item,
  );
  return createMockResponse(true);
}

export function updateMockBusinessStatus(id: ApiId, status: BusinessRecordStatus) {
  const record = findRecord(id);
  mockBusinessRecords = mockBusinessRecords.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          status,
          updateTime: nowText(),
          timeline: [createTimeline('状态变更', item.owner, `状态已调整为 ${status}。`), ...item.timeline],
        }
      : item,
  );
  return createMockResponse({ ...record, status });
}

export function deleteMockBusinessRecord(id: ApiId) {
  findRecord(id);
  mockBusinessRecords = mockBusinessRecords.filter((item) => String(item.id) !== String(id));
  return createMockResponse(true);
}

function createRecord(seed: ModuleSeed, title: string, index: number): BusinessRecord {
  const owner = owners[index % owners.length];
  const status = statuses[index % statuses.length];

  return {
    id: `${seed.module}-${index + 1}`,
    module: seed.module,
    title,
    code: `${seed.prefix}202606${String(index + 1).padStart(4, '0')}`,
    owner,
    customer: customers[index % customers.length],
    channel: seed.channel,
    status,
    priority: priorities[index % priorities.length],
    metric: seed.metric,
    risk: index === 0 ? '高风险' : index === 1 ? '中风险' : '低风险',
    description: `${title}，需要在当前业务工作台内完成分派、处理和复核。`,
    aiSuggestion: seed.aiSuggestion,
    tags: [seed.channel, status, priorities[index % priorities.length]],
    timeline: [
      createTimeline('AI 分析', 'AI 助手', seed.aiSuggestion, -1),
      createTimeline('业务接入', owner, `${seed.channel}记录已进入工作台。`, -2),
    ],
    updateTime: nowText(-index),
  };
}

function createTimeline(action: string, operator: string, content: string, offsetDays = 0) {
  return {
    time: nowText(offsetDays),
    action,
    operator,
    content,
  };
}

function findRecord(id: ApiId) {
  const record = mockBusinessRecords.find((item) => String(item.id) === String(id));

  if (!record) {
    throw new Error(`Business record ${id} not found`);
  }

  return cloneMock(record);
}
