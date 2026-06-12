import type { ApiId } from '@/api/types';
import type {
  LifecycleTicketDetail,
  LifecycleTicketPayload,
  LifecycleTicketPriority,
  LifecycleTicketSource,
  LifecycleTicketStatus,
  TicketAiAnalysis,
  TicketAttachment,
  TicketComment,
  TicketFlowRecord,
  TicketOperationLog,
} from '@/api/ticket';
import type {
  CreateWorkOrderPayload,
  TicketPriority,
  TicketStatus,
  UpdateWorkOrderPayload,
  WorkOrderItem,
  WorkOrderQueryParams,
} from '@/api/workOrder';
import { cloneMock, createMockId, createMockResponse, matchesKeyword, nowText, paginateMock, sortByTimeDesc } from '@/mock/core';

interface MockWorkOrderRecord extends WorkOrderItem {
  deleted: boolean;
  lifecycleStatus: LifecycleTicketStatus;
  attachments: TicketAttachment[];
  comments: TicketComment[];
  flowRecords: TicketFlowRecord[];
  operationLogs: TicketOperationLog[];
  acceptedTime?: string;
  startProcessTime?: string;
  finishTime?: string;
  completedTime?: string;
  processingDuration?: string;
}

function toTicketStatus(lifecycleStatus: LifecycleTicketStatus): TicketStatus {
  switch (lifecycleStatus) {
    case 'PROCESSING':
      return 'PROCESSING';
    case 'PENDING':
      return 'PENDING';
    case 'WAIT_CONFIRM':
    case 'COMPLETED':
      return 'RESOLVED';
    case 'CLOSED':
      return 'CLOSED';
    default:
      return 'NEW';
  }
}

function toLifecyclePriority(priority: TicketPriority): LifecycleTicketPriority {
  if (priority === 'HIGH' || priority === 'URGENT') {
    return priority === 'URGENT' ? 'URGENT' : 'IMPORTANT';
  }

  return 'NORMAL';
}

function toWorkOrderPriority(priority: LifecycleTicketPriority): TicketPriority {
  if (priority === 'URGENT') {
    return 'URGENT';
  }

  if (priority === 'IMPORTANT') {
    return 'HIGH';
  }

  return 'NORMAL';
}

function createAiSummary(record: Pick<MockWorkOrderRecord, 'category' | 'priority' | 'title' | 'source'>) {
  const risk = record.priority === 'URGENT' ? 'URGENT' : record.priority === 'HIGH' ? 'HIGH' : 'MEDIUM';
  const department = record.category?.includes('权限') ? '平台运维部 / IAM 小组' : record.category?.includes('知识') ? '知识运营部' : '平台运维部';

  return {
    aiSummary: `AI 判断该工单属于“${record.category || '综合问题'}”场景，建议由 ${department} 优先跟进。`,
    aiRiskLevel: risk,
  };
}

function createFlowRecords(applicantName: string, assigneeName: string, lifecycleStatus: LifecycleTicketStatus) {
  const timeline: TicketFlowRecord[] = [
    { id: createMockId('flow'), title: '提交工单', operator: applicantName, description: '工单已进入待受理队列。', status: 'PENDING_ACCEPT', time: nowText(-3) },
    { id: createMockId('flow'), title: 'AI 识别', operator: 'AI 助手', description: '自动完成分类、风险和指派建议。', status: 'PENDING_ACCEPT', time: nowText(-3) },
  ];

  if (['ACCEPTED', 'PROCESSING', 'PENDING', 'WAIT_CONFIRM', 'COMPLETED', 'CLOSED'].includes(lifecycleStatus)) {
    timeline.push({
      id: createMockId('flow'),
      title: '人工受理',
      operator: assigneeName,
      description: '处理人已接单并确认问题范围。',
      status: 'ACCEPTED',
      time: nowText(-2),
    });
  }

  if (['PROCESSING', 'PENDING', 'WAIT_CONFIRM', 'COMPLETED', 'CLOSED'].includes(lifecycleStatus)) {
    timeline.push({
      id: createMockId('flow'),
      title: '进入处理',
      operator: assigneeName,
      description: '开始排查问题、补充日志与截图。',
      status: 'PROCESSING',
      time: nowText(-1),
    });
  }

  if (['WAIT_CONFIRM', 'COMPLETED', 'CLOSED'].includes(lifecycleStatus)) {
    timeline.push({
      id: createMockId('flow'),
      title: '待确认',
      operator: assigneeName,
      description: '处理方案已执行，等待申请人确认。',
      status: 'WAIT_CONFIRM',
      time: nowText(),
    });
  }

  return timeline;
}

function createOperationLogs(flowRecords: TicketFlowRecord[]) {
  return flowRecords.map((item, index): TicketOperationLog => {
    const beforeStatus: TicketOperationLog['beforeStatus'] = index === 0 ? '-' : flowRecords[index - 1].status;

    return {
      id: createMockId('log'),
      operator: item.operator,
      action: item.title,
      beforeStatus,
      afterStatus: item.status,
      time: item.time,
    };
  });
}

function createAttachments(applicantName: string) {
  return [
    { id: createMockId('att'), name: '问题截图.png', size: '486 KB', uploader: applicantName, uploadTime: nowText(-1) },
    { id: createMockId('att'), name: '浏览器控制台日志.txt', size: '32 KB', uploader: applicantName, uploadTime: nowText(-1) },
  ];
}

function createComments(applicantName: string, assigneeName: string) {
  return [
    { id: createMockId('comment'), userName: assigneeName, content: '已收到工单，正在核对系统日志与菜单权限同步链路。', time: nowText(-1) },
    { id: createMockId('comment'), userName: applicantName, content: '补充说明：该问题主要出现在早高峰登录时段。', time: nowText() },
  ];
}

function createRecord(input: {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  priority: TicketPriority;
  lifecycleStatus: LifecycleTicketStatus;
  source: string;
  category: string;
  applicantName: string;
  assigneeName: string;
  dueTime: string;
  deleted?: boolean;
  createTime: string;
  updateTime: string;
}): MockWorkOrderRecord {
  const flowRecords = createFlowRecords(input.applicantName, input.assigneeName, input.lifecycleStatus);
  const ai = createAiSummary(input);

  return {
    id: input.id,
    ticketNo: input.ticketNo,
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: toTicketStatus(input.lifecycleStatus),
    source: input.source,
    category: input.category,
    applicantId: `app-${input.id}`,
    applicantName: input.applicantName,
    assigneeId: `asg-${input.id}`,
    assigneeName: input.assigneeName,
    dueTime: input.dueTime,
    resolvedTime: ['WAIT_CONFIRM', 'COMPLETED', 'CLOSED'].includes(input.lifecycleStatus) ? input.updateTime : null,
    closedTime: input.lifecycleStatus === 'CLOSED' ? input.updateTime : null,
    aiSummary: ai.aiSummary,
    aiRiskLevel: ai.aiRiskLevel,
    createTime: input.createTime,
    updateTime: input.updateTime,
    deleted: Boolean(input.deleted),
    lifecycleStatus: input.lifecycleStatus,
    attachments: createAttachments(input.applicantName),
    comments: createComments(input.applicantName, input.assigneeName),
    flowRecords,
    operationLogs: createOperationLogs(flowRecords),
    acceptedTime: ['ACCEPTED', 'PROCESSING', 'PENDING', 'WAIT_CONFIRM', 'COMPLETED', 'CLOSED'].includes(input.lifecycleStatus) ? input.createTime : undefined,
    startProcessTime: ['PROCESSING', 'PENDING', 'WAIT_CONFIRM', 'COMPLETED', 'CLOSED'].includes(input.lifecycleStatus) ? input.updateTime : undefined,
    finishTime: ['WAIT_CONFIRM', 'COMPLETED', 'CLOSED'].includes(input.lifecycleStatus) ? input.updateTime : undefined,
    completedTime: ['COMPLETED', 'CLOSED'].includes(input.lifecycleStatus) ? input.updateTime : undefined,
    processingDuration: ['COMPLETED', 'CLOSED'].includes(input.lifecycleStatus) ? '3小时20分钟' : undefined,
  };
}

const workOrderSeeds: MockWorkOrderRecord[] = [
  createRecord({ id: 'wo-1', ticketNo: 'TK202606070001', title: '统一登录后首页菜单缺失', description: '用户登录后只显示空白页，刷新后菜单树未正常渲染。', priority: 'URGENT', lifecycleStatus: 'PROCESSING', source: 'WEB', category: '账号权限', applicantName: '林知远', assigneeName: '陈沐阳', dueTime: '2026-06-07 18:00:00', createTime: '2026-06-07 08:20:00', updateTime: '2026-06-07 09:05:00' }),
  createRecord({ id: 'wo-2', ticketNo: 'TK202606070002', title: '知识库检索结果为空', description: '关键词搜索“员工手册”没有返回文档，但文档中心里可以看到原文。', priority: 'HIGH', lifecycleStatus: 'WAIT_CONFIRM', source: 'PHONE', category: '知识库', applicantName: '宋之言', assigneeName: '郑宁', dueTime: '2026-06-07 20:00:00', createTime: '2026-06-07 07:50:00', updateTime: '2026-06-07 08:48:00' }),
  createRecord({ id: 'wo-3', ticketNo: 'TK202606070003', title: '对话记录页筛选条件失效', description: '切换任务类型后列表没有重新过滤，仍显示上一次查询结果。', priority: 'NORMAL', lifecycleStatus: 'PENDING_ACCEPT', source: 'WEB', category: '对话记录', applicantName: '郑宁', assigneeName: '刘薇', dueTime: '2026-06-08 12:00:00', createTime: '2026-06-07 09:12:00', updateTime: '2026-06-07 09:12:00' }),
  createRecord({ id: 'wo-4', ticketNo: 'TK202606070004', title: '大屏趋势图数据抖动', description: '首页大屏刷新时图表会闪烁，怀疑数据结构重复创建导致。', priority: 'HIGH', lifecycleStatus: 'PROCESSING', source: 'WECHAT', category: '数据可视化', applicantName: '谢砚青', assigneeName: '郑宁', dueTime: '2026-06-07 22:00:00', createTime: '2026-06-07 06:40:00', updateTime: '2026-06-07 08:36:00' }),
  createRecord({ id: 'wo-5', ticketNo: 'TK202606070005', title: '部门树新增后未排序', description: '新增部门成功后，树表格展示顺序没有按照 sortOrder 刷新。', priority: 'NORMAL', lifecycleStatus: 'ACCEPTED', source: 'MANUAL', category: '组织架构', applicantName: '黄莹', assigneeName: '陈沐阳', dueTime: '2026-06-08 18:00:00', createTime: '2026-06-07 08:01:00', updateTime: '2026-06-07 08:20:00' }),
  createRecord({ id: 'wo-6', ticketNo: 'TK202606070006', title: '文档解析卡在处理中', description: '上传 xlsx 后解析状态长时间停留在 parsing。', priority: 'HIGH', lifecycleStatus: 'PENDING', source: 'APP', category: '文档中心', applicantName: '宋之言', assigneeName: '刘薇', dueTime: '2026-06-08 10:00:00', createTime: '2026-06-07 05:30:00', updateTime: '2026-06-07 07:45:00' }),
  createRecord({ id: 'wo-7', ticketNo: 'TK202606060087', title: 'AI 问答返回内容缺少换行', description: '生成的 Markdown 在消息项内被压成一段，阅读体验较差。', priority: 'NORMAL', lifecycleStatus: 'COMPLETED', source: 'WEB', category: 'AI问答', applicantName: '张若一', assigneeName: '郑宁', dueTime: '2026-06-06 18:00:00', createTime: '2026-06-06 11:20:00', updateTime: '2026-06-06 15:40:00' }),
  createRecord({ id: 'wo-8', ticketNo: 'TK202606060088', title: '菜单权限缓存未清理', description: '退出再登录不同账号后，仍然看到上一个账号的菜单缓存。', priority: 'URGENT', lifecycleStatus: 'CLOSED', source: 'PHONE', category: '账号权限', applicantName: '林知远', assigneeName: '陈沐阳', dueTime: '2026-06-06 17:00:00', createTime: '2026-06-06 09:15:00', updateTime: '2026-06-06 12:10:00' }),
  createRecord({ id: 'wo-9', ticketNo: 'TK202606050121', title: '系统设置保存后未即时生效', description: '切换 AI 流式开关后，需要刷新页面才能看到效果。', priority: 'HIGH', lifecycleStatus: 'PROCESSING', source: 'WECHAT', category: '系统设置', applicantName: '郑宁', assigneeName: '谢砚青', dueTime: '2026-06-07 19:00:00', createTime: '2026-06-05 16:45:00', updateTime: '2026-06-07 09:18:00' }),
  createRecord({ id: 'wo-10', ticketNo: 'TK202606040055', title: '回收站恢复后状态异常', description: '恢复后的工单状态被错误置为 CLOSED。', priority: 'NORMAL', lifecycleStatus: 'PENDING_ACCEPT', source: 'MANUAL', category: '工单流程', applicantName: '刘薇', assigneeName: '陈沐阳', dueTime: '2026-06-08 09:00:00', createTime: '2026-06-04 12:00:00', updateTime: '2026-06-07 09:16:00', deleted: true }),
];

let mockWorkOrders = cloneMock(workOrderSeeds);

export function getMockWorkOrderList(params: WorkOrderQueryParams = {}) {
  const filtered = filterWorkOrders(params, false);
  return createMockResponse(paginateMock(filtered, params));
}

export function getMockRecycleWorkOrderList(params: WorkOrderQueryParams = {}) {
  const filtered = filterWorkOrders(params, true);
  return createMockResponse(paginateMock(filtered, params));
}

export function getMockWorkOrderDetail(id: ApiId) {
  return createMockResponse(toWorkOrderItem(findWorkOrder(id)));
}

export function createMockWorkOrder(data: CreateWorkOrderPayload) {
  const record = createRecord({
    id: createMockId('wo'),
    ticketNo: `TK${new Date().getFullYear()}${String(Date.now()).slice(-8)}`,
    title: data.title,
    description: data.description,
    priority: data.priority ?? 'NORMAL',
    lifecycleStatus: 'PENDING_ACCEPT',
    source: data.source ?? 'WEB',
    category: data.category ?? '综合问题',
    applicantName: data.applicantName ?? '当前用户',
    assigneeName: data.assigneeName ?? '待分派',
    dueTime: data.dueTime ?? nowText(1),
    createTime: nowText(),
    updateTime: nowText(),
  });

  mockWorkOrders.unshift(record);
  return createMockResponse(record.id);
}

export function updateMockWorkOrder(id: ApiId, data: UpdateWorkOrderPayload) {
  findWorkOrder(id);
  mockWorkOrders = mockWorkOrders.map((item) => {
    if (String(item.id) !== String(id)) {
      return item;
    }

    const nextLifecycleStatus = data.status ? toLifecycleStatus(data.status) : item.lifecycleStatus;
    const ai = data.aiSummary || data.aiRiskLevel ? { aiSummary: data.aiSummary ?? item.aiSummary, aiRiskLevel: data.aiRiskLevel ?? item.aiRiskLevel } : createAiSummary({ ...item, category: data.category ?? item.category, priority: data.priority ?? item.priority, title: data.title, source: data.source ?? item.source });

    return {
      ...item,
      title: data.title,
      description: data.description,
      priority: data.priority ?? item.priority,
      status: data.status ?? item.status,
      lifecycleStatus: nextLifecycleStatus,
      source: data.source ?? item.source,
      category: data.category ?? item.category,
      assigneeId: data.assigneeId ?? item.assigneeId,
      assigneeName: data.assigneeName ?? item.assigneeName,
      dueTime: data.dueTime ?? item.dueTime,
      resolvedTime: data.resolvedTime ?? item.resolvedTime,
      closedTime: data.closedTime ?? item.closedTime,
      aiSummary: ai.aiSummary,
      aiRiskLevel: ai.aiRiskLevel,
      updateTime: nowText(),
    };
  });

  return createMockResponse(true);
}

export function deleteMockWorkOrder(id: ApiId) {
  mockWorkOrders = mockWorkOrders.map((item) => (String(item.id) === String(id) ? { ...item, deleted: true, updateTime: nowText() } : item));
  return createMockResponse(true);
}

export function restoreMockWorkOrder(id: ApiId) {
  mockWorkOrders = mockWorkOrders.map((item) => (String(item.id) === String(id) ? { ...item, deleted: false, updateTime: nowText() } : item));
  return createMockResponse(true);
}

export function createLifecycleTicket(data: LifecycleTicketPayload, lifecycleStatus: LifecycleTicketStatus) {
  const record = createRecord({
    id: createMockId('wo'),
    ticketNo: `TK${new Date().getFullYear()}${String(Date.now()).slice(-8)}`,
    title: data.title,
    description: data.description,
    priority: toWorkOrderPriority(data.priority),
    lifecycleStatus,
    source: data.source,
    category: data.category,
    applicantName: data.applicantName || '当前用户',
    assigneeName: data.assigneeName || '待分派',
    dueTime: data.dueTime || nowText(1),
    createTime: nowText(),
    updateTime: nowText(),
  });

  record.attachments = cloneMock(data.attachments ?? []);
  mockWorkOrders.unshift(record);
  return createMockResponse(toLifecycleDetail(record));
}

export function updateLifecycleTicketStatus(id: ApiId, lifecycleStatus: LifecycleTicketStatus, patch: Partial<MockWorkOrderRecord> = {}) {
  const current = findWorkOrder(id);
  const updated = {
    ...current,
    ...patch,
    lifecycleStatus,
    status: toTicketStatus(lifecycleStatus),
    updateTime: nowText(),
  };

  updated.flowRecords = [
    {
      id: createMockId('flow'),
      title: patch.assigneeName ? `转派给 ${patch.assigneeName}` : lifecycleStatusLabel(lifecycleStatus),
      operator: patch.assigneeName || current.assigneeName || '当前用户',
      description: `工单状态更新为 ${lifecycleStatusLabel(lifecycleStatus)}。`,
      status: lifecycleStatus,
      time: nowText(),
    },
    ...current.flowRecords,
  ];
  updated.operationLogs = [
    {
      id: createMockId('log'),
      operator: patch.assigneeName || current.assigneeName || '当前用户',
      action: patch.assigneeName ? '转派工单' : lifecycleStatusLabel(lifecycleStatus),
      beforeStatus: current.lifecycleStatus,
      afterStatus: lifecycleStatus,
      time: nowText(),
    },
    ...current.operationLogs,
  ];

  mockWorkOrders = mockWorkOrders.map((item) => (String(item.id) === String(id) ? updated : item));
  return createMockResponse(toLifecycleDetail(updated));
}

export function getMockLifecycleDetail(id: ApiId) {
  return createMockResponse(toLifecycleDetail(findWorkOrder(id)));
}

export function getMockTicketFlowRecords(id: ApiId) {
  return createMockResponse(findWorkOrder(id).flowRecords);
}

export function getMockTicketComments(id: ApiId) {
  return createMockResponse(findWorkOrder(id).comments);
}

export function addMockTicketComment(id: ApiId, content: string) {
  const record = findWorkOrder(id);
  const comment: TicketComment = {
    id: createMockId('comment'),
    userName: record.assigneeName || '当前用户',
    content,
    time: nowText(),
  };

  mockWorkOrders = mockWorkOrders.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          comments: [comment, ...item.comments],
          updateTime: nowText(),
        }
      : item,
  );

  return createMockResponse(comment);
}

export function getMockTicketAttachments(id: ApiId) {
  return createMockResponse(findWorkOrder(id).attachments);
}

export function getMockTicketOperationLogs(id: ApiId) {
  return createMockResponse(findWorkOrder(id).operationLogs);
}

export function analyzeMockTicketByAi(data: LifecycleTicketPayload) {
  const riskLevel = data.priority === 'URGENT' ? '高风险' : data.priority === 'IMPORTANT' ? '中风险' : '低风险';

  return createMockResponse<TicketAiAnalysis>({
    category: data.category || '综合问题',
    riskLevel,
    recommendedDepartment: data.category?.includes('知识') ? '知识运营部' : data.category?.includes('权限') ? '平台运维部 / IAM 小组' : '平台运维部',
    recommendedHandler: data.assigneeName || '陈沐阳',
    estimatedDuration: data.priority === 'URGENT' ? '2小时内' : '1个工作日',
    similarTickets: [
      { ticketNo: 'TK202606010031', title: '登录成功但菜单为空', status: '已完成', similarity: 94 },
      { ticketNo: 'TK202605290114', title: '知识检索结果不一致', status: '已完成', similarity: 88 },
    ],
    suggestions: ['优先校验鉴权缓存和菜单树结构是否一致。', '确认当前页面依赖字段在 mock 和真实接口下保持同构。', '如影响多个部门，请同步升级为平台级问题并记录回滚方案。'],
    summary: 'AI 判断该问题与前端数据结构切换、权限缓存或知识解析状态相关，建议先保证 mock 数据完整闭环再继续重构页面。',
  });
}

function filterWorkOrders(params: WorkOrderQueryParams, deleted: boolean) {
  return sortByTimeDesc(
    mockWorkOrders.filter(
      (item) =>
        item.deleted === deleted &&
        matchesKeyword([item.ticketNo, item.title, item.description, item.category, item.applicantName, item.assigneeName], params.keyword) &&
        (!params.status || item.status === params.status) &&
        (!params.priority || item.priority === params.priority) &&
        (!params.category || item.category === params.category) &&
        (!params.assigneeId || String(item.assigneeId) === String(params.assigneeId)) &&
        (!params.applicantId || String(item.applicantId) === String(params.applicantId)),
    ),
    (item) => item.updateTime,
  ).map(toWorkOrderItem);
}

function lifecycleStatusLabel(status: LifecycleTicketStatus) {
  const labels: Record<LifecycleTicketStatus, string> = {
    DRAFT: '草稿',
    PENDING_ACCEPT: '待受理',
    ACCEPTED: '已受理',
    PROCESSING: '处理中',
    PENDING: '挂起',
    WAIT_CONFIRM: '待确认',
    COMPLETED: '已完成',
    CLOSED: '已关闭',
  };

  return labels[status];
}

function toLifecycleStatus(status: TicketStatus): LifecycleTicketStatus {
  switch (status) {
    case 'PROCESSING':
      return 'PROCESSING';
    case 'PENDING':
      return 'PENDING';
    case 'RESOLVED':
      return 'WAIT_CONFIRM';
    case 'CLOSED':
      return 'CLOSED';
    default:
      return 'PENDING_ACCEPT';
  }
}

function findWorkOrder(id: ApiId) {
  const record = mockWorkOrders.find((item) => String(item.id) === String(id));

  if (!record) {
    throw new Error(`Work order ${id} not found`);
  }

  return cloneMock(record);
}

function toWorkOrderItem(record: MockWorkOrderRecord): WorkOrderItem {
  const { deleted, lifecycleStatus, attachments, comments, flowRecords, operationLogs, acceptedTime, startProcessTime, finishTime, completedTime, processingDuration, ...rest } = record;
  void deleted;
  void lifecycleStatus;
  void attachments;
  void comments;
  void flowRecords;
  void operationLogs;
  void acceptedTime;
  void startProcessTime;
  void finishTime;
  void completedTime;
  void processingDuration;
  return rest;
}

function toLifecycleDetail(record: MockWorkOrderRecord): LifecycleTicketDetail {
  return {
    id: record.id,
    ticketNo: record.ticketNo,
    status: record.lifecycleStatus,
    title: record.title,
    priority: toLifecyclePriority(record.priority),
    source: (record.source as LifecycleTicketSource) || 'WEB',
    category: record.category || '综合问题',
    applicantId: record.applicantId || undefined,
    applicantName: record.applicantName || undefined,
    assigneeId: record.assigneeId || undefined,
    assigneeName: record.assigneeName || undefined,
    dueTime: record.dueTime || undefined,
    description: record.description,
    attachments: cloneMock(record.attachments),
    createTime: record.createTime,
    updateTime: record.updateTime,
    acceptedTime: record.acceptedTime,
    startProcessTime: record.startProcessTime,
    finishTime: record.finishTime,
    completedTime: record.completedTime,
    processingDuration: record.processingDuration,
    aiAnalysis: analyzeMockTicketByAi({
      title: record.title,
      priority: toLifecyclePriority(record.priority),
      source: (record.source as LifecycleTicketSource) || 'WEB',
      category: record.category || '综合问题',
      applicantId: record.applicantId || undefined,
      applicantName: record.applicantName || undefined,
      assigneeId: record.assigneeId || undefined,
      assigneeName: record.assigneeName || undefined,
      dueTime: record.dueTime || undefined,
      description: record.description,
      attachments: cloneMock(record.attachments),
    }).data,
  };
}
