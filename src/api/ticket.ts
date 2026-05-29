import type { ApiId } from '@/api/types';

export type LifecycleTicketStatus =
  | 'DRAFT'
  | 'PENDING_ACCEPT'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'PENDING'
  | 'WAIT_CONFIRM'
  | 'COMPLETED'
  | 'CLOSED';

export type LifecycleTicketPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type LifecycleTicketSource = 'WEB' | 'APP' | 'PHONE' | 'WECHAT' | 'MANUAL';

export interface TicketAttachment {
  id: ApiId;
  name: string;
  size: string;
  uploader: string;
  uploadTime: string;
}

export interface SimilarTicket {
  ticketNo: string;
  title: string;
  status: string;
  similarity: number;
}

export interface TicketAiAnalysis {
  category: string;
  riskLevel: string;
  recommendedDepartment: string;
  recommendedHandler: string;
  estimatedDuration: string;
  similarTickets: SimilarTicket[];
  suggestions: string[];
  summary: string;
}

export interface LifecycleTicketPayload {
  title: string;
  priority: LifecycleTicketPriority;
  source: LifecycleTicketSource;
  category: string;
  applicantId?: ApiId;
  applicantName?: string;
  assigneeId?: ApiId;
  assigneeName?: string;
  dueTime?: string;
  description: string;
  attachments?: TicketAttachment[];
}

export interface LifecycleTicketDetail extends LifecycleTicketPayload {
  id: ApiId;
  ticketNo: string;
  status: LifecycleTicketStatus;
  createTime: string;
  updateTime: string;
  acceptedTime?: string;
  startProcessTime?: string;
  finishTime?: string;
  completedTime?: string;
  processingDuration?: string;
  aiAnalysis?: TicketAiAnalysis;
}

export interface TicketFlowRecord {
  id: ApiId;
  title: string;
  operator: string;
  description: string;
  status: LifecycleTicketStatus;
  time: string;
}

export interface TicketComment {
  id: ApiId;
  userName: string;
  content: string;
  time: string;
}

export interface TicketOperationLog {
  id: ApiId;
  operator: string;
  action: string;
  beforeStatus: LifecycleTicketStatus | '-';
  afterStatus: LifecycleTicketStatus;
  time: string;
}

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
}

function mockDelay<T>(data: T, delay = 360): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), delay);
  });
}

function createMockTicket(payload: LifecycleTicketPayload, status: LifecycleTicketStatus): LifecycleTicketDetail {
  const now = nowText();

  return {
    ...payload,
    id: `mock-${Date.now()}`,
    ticketNo: `TK${new Date().getFullYear()}${String(Date.now()).slice(-8)}`,
    status,
    createTime: now,
    updateTime: now,
  };
}

export function createTicket(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  return mockDelay(createMockTicket(data, 'DRAFT'));
}

export function saveTicketDraft(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  return mockDelay(createMockTicket(data, 'DRAFT'));
}

export function submitTicket(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  return mockDelay(createMockTicket(data, 'PENDING_ACCEPT'));
}

export function acceptTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus; acceptedTime: string }> {
  return mockDelay({ id, status: 'ACCEPTED', acceptedTime: nowText() });
}

export function startProcessTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; startProcessTime: string }> {
  return mockDelay({ id, status: 'PROCESSING', startProcessTime: nowText() });
}

export function finishProcessTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; finishTime: string }> {
  return mockDelay({ id, status: 'WAIT_CONFIRM', finishTime: nowText() });
}

export function confirmTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; completedTime: string; processingDuration: string }> {
  return mockDelay({
    id,
    status: 'COMPLETED',
    completedTime: nowText(),
    processingDuration: '2小时35分钟',
  });
}

export function reopenTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  return mockDelay({ id, status: 'PROCESSING' });
}

export function suspendTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  return mockDelay({ id, status: 'PENDING' });
}

export function resumeTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  return mockDelay({ id, status: 'PROCESSING' });
}

export function transferTicket(
  id: ApiId,
  assignee: { assigneeId?: ApiId; assigneeName?: string },
): Promise<{ id: ApiId; status: LifecycleTicketStatus; assigneeId?: ApiId; assigneeName?: string }> {
  return mockDelay({ id, status: 'PENDING_ACCEPT', ...assignee });
}

export function getTicketDetail(id: ApiId): Promise<LifecycleTicketDetail> {
  const detail = createMockTicket(
    {
      title: '核心系统登录异常',
      priority: 'IMPORTANT',
      source: 'WEB',
      category: '系统故障',
      applicantId: '10001',
      applicantName: '李雷',
      assigneeId: '20002',
      assigneeName: '张三',
      dueTime: nowText(),
      description: '用户反馈核心系统登录后反复跳转，需要排查登录态与权限链路。',
      attachments: [],
    },
    'PROCESSING',
  );

  return mockDelay({ ...detail, id });
}

export function getTicketFlowRecords(_id: ApiId): Promise<TicketFlowRecord[]> {
  void _id;

  return mockDelay([
    {
      id: 'flow-1',
      title: '提交工单',
      operator: '李雷',
      description: '工单进入待受理队列',
      status: 'PENDING_ACCEPT',
      time: nowText(),
    },
    {
      id: 'flow-2',
      title: 'AI完成分析',
      operator: 'AI助手',
      description: '已识别问题类型、风险等级和推荐处理方案',
      status: 'PENDING_ACCEPT',
      time: nowText(),
    },
    {
      id: 'flow-3',
      title: '张三受理',
      operator: '张三',
      description: '工单已分配到平台运维组',
      status: 'ACCEPTED',
      time: nowText(),
    },
    {
      id: 'flow-4',
      title: '开始处理',
      operator: '张三',
      description: '开始排查登录态异常',
      status: 'PROCESSING',
      time: nowText(),
    },
    {
      id: 'flow-5',
      title: '处理完成',
      operator: '张三',
      description: '等待申请人确认处理结果',
      status: 'WAIT_CONFIRM',
      time: nowText(),
    },
  ]);
}

export function getTicketComments(_id: ApiId): Promise<TicketComment[]> {
  void _id;

  return mockDelay([
    {
      id: 'comment-1',
      userName: '张三',
      content: '已复现问题，正在查看统一认证日志。',
      time: nowText(),
    },
  ]);
}

export function addTicketComment(_id: ApiId, content: string): Promise<TicketComment> {
  void _id;

  return mockDelay({
    id: `comment-${Date.now()}`,
    userName: '管理员',
    content,
    time: nowText(),
  });
}

export function getTicketAttachments(_id: ApiId): Promise<TicketAttachment[]> {
  void _id;

  return mockDelay([
    {
      id: 'attach-1',
      name: '登录异常截图.png',
      size: '486 KB',
      uploader: '李雷',
      uploadTime: nowText(),
    },
    {
      id: 'attach-2',
      name: '浏览器控制台日志.txt',
      size: '32 KB',
      uploader: '李雷',
      uploadTime: nowText(),
    },
  ]);
}

export function analyzeTicketByAi(data: LifecycleTicketPayload): Promise<TicketAiAnalysis> {
  const riskLevel = data.priority === 'URGENT' ? '高风险' : data.priority === 'IMPORTANT' ? '中风险' : '低风险';

  return mockDelay(
    {
      category: data.category || '系统故障',
      riskLevel,
      recommendedDepartment: data.category === '账号权限' ? '账号权限组' : '平台运维部',
      recommendedHandler: data.assigneeName || '张三',
      estimatedDuration: data.priority === 'URGENT' ? '2小时内' : '1个工作日',
      similarTickets: [
        {
          ticketNo: 'TK202605120126',
          title: '核心系统登录后反复跳转',
          status: '已完成',
          similarity: 92,
        },
        {
          ticketNo: 'TK202605110087',
          title: '用户权限同步延迟导致菜单缺失',
          status: '已完成',
          similarity: 86,
        },
      ],
      suggestions: [
        '优先检查统一认证服务登录态刷新记录。',
        '核对申请人账号角色、部门和菜单权限是否同步完成。',
        '如影响多人登录，建议升级为平台级故障并同步值班负责人。',
      ],
      summary: 'AI 判断该问题可能与登录态刷新或账号权限同步有关，建议由平台运维部优先排查认证链路。',
    },
    900,
  );
}
