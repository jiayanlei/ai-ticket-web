import type { ApiId } from '@/api/types';
import { cleanPayload } from '@/api/types';
import { envConfig } from '@/config';
import {
  addMockTicketComment,
  analyzeMockTicketByAi,
  createLifecycleTicket,
  getMockLifecycleDetail,
  getMockTicketAttachments,
  getMockTicketComments,
  getMockTicketFlowRecords,
  getMockTicketOperationLogs,
  updateLifecycleTicketStatus,
} from '@/mock/ticket';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export type LifecycleTicketStatus =
  | 'DRAFT'
  | 'PENDING_ACCEPT'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'PENDING'
  | 'WAIT_CONFIRM'
  | 'COMPLETED'
  | 'CLOSED'
  | 'REJECTED';

export type LifecycleTicketPriority = 'LOW' | 'NORMAL' | 'IMPORTANT' | 'HIGH' | 'URGENT';
export type LifecycleTicketSource =
  | 'SMS'
  | 'EMAIL'
  | 'PHONE'
  | 'ONLINE'
  | 'OTHER'
  | 'WEB'
  | 'APP'
  | 'WECHAT'
  | 'MANUAL';

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
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerLevel?: string;
  applicantId?: ApiId;
  applicantName?: string;
  assigneeId?: ApiId;
  assigneeName?: string;
  ownerDepartment?: string;
  dueTime?: string;
  contactTime?: string;
  serviceProduct?: string;
  customerRequirement?: string;
  impactScope?: string;
  expectedResult?: string;
  urgencyReason?: string;
  callbackRequired?: boolean;
  ccEmails?: string;
  tags?: string[];
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

interface TicketOrderVO {
  id: ApiId;
  ticketNo: string;
  title: string;
  description: string;
  status: LifecycleTicketStatus;
  priority: LifecycleTicketPriority;
  source?: string | null;
  category?: string | null;
  applicantId?: ApiId | null;
  applicantName?: string | null;
  handlerId?: ApiId | null;
  handlerName?: string | null;
  assigneeId?: ApiId | null;
  assigneeName?: string | null;
  expectedFinishTime?: string | null;
  dueTime?: string | null;
  acceptTime?: string | null;
  acceptedTime?: string | null;
  startProcessTime?: string | null;
  finishTime?: string | null;
  closeTime?: string | null;
  completedTime?: string | null;
  aiCategory?: string | null;
  aiRiskLevel?: string | null;
  aiRecommendDept?: string | null;
  aiRecommendHandler?: string | null;
  aiEstimatedTime?: string | null;
  aiSummary?: string | null;
  aiSuggestion?: string | null;
  createTime: string;
  updateTime: string;
}

interface TicketOrderDetailResponse {
  ticket: TicketOrderVO;
  flowRecords?: TicketFlowRecordVO[];
  comments?: TicketCommentVO[];
  attachments?: TicketAttachmentVO[];
  aiAnalysis?: TicketAiAnalysisVO | null;
}

interface TicketFlowRecordVO {
  id: ApiId;
  operatorName?: string | null;
  action?: string | null;
  actionName?: string | null;
  beforeStatus?: LifecycleTicketStatus | null;
  afterStatus?: LifecycleTicketStatus | null;
  remark?: string | null;
  createTime?: string | null;
}

interface TicketCommentVO {
  id: ApiId;
  userName?: string | null;
  content: string;
  createTime?: string | null;
}

interface TicketAttachmentVO {
  id: ApiId;
  fileName?: string | null;
  fileSize?: number | string | null;
  uploadUserName?: string | null;
  createTime?: string | null;
}

interface TicketAiAnalysisVO {
  aiCategory?: string | null;
  aiRiskLevel?: string | null;
  aiRecommendDept?: string | null;
  aiRecommendHandler?: string | null;
  aiEstimatedTime?: string | null;
  aiSummary?: string | null;
  aiSuggestion?: string | null;
}

interface TicketActionResult {
  id: ApiId;
  status: LifecycleTicketStatus;
  assigneeId?: ApiId | null;
  assigneeName?: string | null;
  acceptedTime?: string | null;
  startProcessTime?: string | null;
  finishTime?: string | null;
  completedTime?: string | null;
  updateTime?: string | null;
}

export function createTicket(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  if (envConfig.useMock) {
    return resolveMockResponse(createLifecycleTicket(data, 'DRAFT'));
  }

  return createDraftAndLoad(data);
}

export function saveTicketDraft(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  if (envConfig.useMock) {
    return resolveMockResponse(createLifecycleTicket(data, 'DRAFT'));
  }

  return createDraftAndLoad(data);
}

export async function submitTicket(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  if (envConfig.useMock) {
    return resolveMockResponse(createLifecycleTicket(data, 'PENDING_ACCEPT'));
  }

  const detail = await createDraftAndLoad(data);
  await http.post<TicketActionResult, TicketActionResult>(`/tickets/${detail.id}/submit`, {});
  return getTicketDetail(detail.id);
}

export async function acceptTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus; acceptedTime: string }> {
  if (envConfig.useMock) {
    const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'ACCEPTED', { acceptedTime: nowText() }));
    return { id: detail.id, status: detail.status, acceptedTime: detail.acceptedTime || detail.updateTime };
  }

  const result = await http.post<TicketActionResult, TicketActionResult>(`/tickets/${id}/accept`, {});
  return { id: result.id, status: result.status, acceptedTime: result.acceptedTime || result.updateTime || nowText() };
}

export async function startProcessTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; startProcessTime: string }> {
  if (envConfig.useMock) {
    const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PROCESSING', { startProcessTime: nowText() }));
    return { id: detail.id, status: detail.status, startProcessTime: detail.startProcessTime || detail.updateTime };
  }

  const result = await http.post<TicketActionResult, TicketActionResult>(`/tickets/${id}/start-process`, {});
  return { id: result.id, status: result.status, startProcessTime: result.startProcessTime || result.updateTime || nowText() };
}

export async function finishProcessTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; finishTime: string }> {
  if (envConfig.useMock) {
    const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'WAIT_CONFIRM', { finishTime: nowText() }));
    return { id: detail.id, status: detail.status, finishTime: detail.finishTime || detail.updateTime };
  }

  const result = await http.post<TicketActionResult, TicketActionResult>(`/tickets/${id}/finish`, {});
  return { id: result.id, status: result.status, finishTime: result.finishTime || result.updateTime || nowText() };
}

export async function confirmTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; completedTime: string; processingDuration: string }> {
  if (envConfig.useMock) {
    const detail = await resolveMockResponse(
      updateLifecycleTicketStatus(id, 'COMPLETED', {
        completedTime: nowText(),
        processingDuration: '3小时20分钟',
      }),
    );

    return {
      id: detail.id,
      status: detail.status,
      completedTime: detail.completedTime || detail.updateTime,
      processingDuration: detail.processingDuration || '3小时20分钟',
    };
  }

  const result = await http.post<TicketActionResult, TicketActionResult>(`/tickets/${id}/confirm`, {});
  return {
    id: result.id,
    status: result.status,
    completedTime: result.completedTime || result.updateTime || nowText(),
    processingDuration: '',
  };
}

export async function reopenTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  if (envConfig.useMock) {
    const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PROCESSING'));
    return { id: detail.id, status: detail.status };
  }

  const result = await http.post<TicketActionResult, TicketActionResult>(`/tickets/${id}/reopen`, {});
  return { id: result.id, status: result.status };
}

export async function suspendTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  if (envConfig.useMock) {
    const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PENDING'));
    return { id: detail.id, status: detail.status };
  }

  const result = await http.post<TicketActionResult, TicketActionResult>(`/tickets/${id}/suspend`, {});
  return { id: result.id, status: result.status };
}

export async function resumeTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  if (envConfig.useMock) {
    const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PROCESSING'));
    return { id: detail.id, status: detail.status };
  }

  const result = await http.post<TicketActionResult, TicketActionResult>(`/tickets/${id}/resume`, {});
  return { id: result.id, status: result.status };
}

export async function transferTicket(
  id: ApiId,
  assignee: { assigneeId?: ApiId; assigneeName?: string },
): Promise<{ id: ApiId; status: LifecycleTicketStatus; assigneeId?: ApiId; assigneeName?: string }> {
  if (envConfig.useMock) {
    const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PENDING_ACCEPT', assignee));
    return {
      id: detail.id,
      status: detail.status,
      assigneeId: detail.assigneeId,
      assigneeName: detail.assigneeName,
    };
  }

  const result = await http.post<TicketActionResult, TicketActionResult>(`/tickets/${id}/transfer`, {
    handlerId: assignee.assigneeId,
    handlerName: assignee.assigneeName,
  });
  return {
    id: result.id,
    status: result.status,
    assigneeId: result.assigneeId ?? assignee.assigneeId,
    assigneeName: result.assigneeName ?? assignee.assigneeName,
  };
}

export async function getTicketDetail(id: ApiId): Promise<LifecycleTicketDetail> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockLifecycleDetail(id));
  }

  const data = await http.get<TicketOrderDetailResponse, TicketOrderDetailResponse>(`/tickets/${id}`);
  return normalizeLifecycleDetail(data);
}

export async function getTicketFlowRecords(id: ApiId): Promise<TicketFlowRecord[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTicketFlowRecords(id));
  }

  const records = await http.get<TicketFlowRecordVO[], TicketFlowRecordVO[]>(`/tickets/${id}/flow-records`);
  return records.map(normalizeFlowRecord);
}

export async function getTicketComments(id: ApiId): Promise<TicketComment[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTicketComments(id));
  }

  const comments = await http.get<TicketCommentVO[], TicketCommentVO[]>(`/tickets/${id}/comments`);
  return comments.map(normalizeComment);
}

export async function addTicketComment(id: ApiId, content: string): Promise<TicketComment> {
  if (envConfig.useMock) {
    return resolveMockResponse(addMockTicketComment(id, content));
  }

  const commentId = await http.post<ApiId, ApiId>(`/tickets/${id}/comments`, { content });
  return {
    id: commentId,
    userName: '',
    content,
    time: nowText(),
  };
}

export async function getTicketAttachments(id: ApiId): Promise<TicketAttachment[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTicketAttachments(id));
  }

  const attachments = await http.get<TicketAttachmentVO[], TicketAttachmentVO[]>(`/tickets/${id}/attachments`);
  return attachments.map(normalizeAttachment);
}

export async function getTicketOperationLogs(id: ApiId): Promise<TicketOperationLog[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTicketOperationLogs(id));
  }

  const records = await getTicketFlowRecords(id);
  return records.map((record) => ({
    id: record.id,
    operator: record.operator,
    action: record.title,
    beforeStatus: '-',
    afterStatus: record.status,
    time: record.time,
  }));
}

export async function analyzeTicketByAi(data: LifecycleTicketPayload): Promise<TicketAiAnalysis> {
  if (envConfig.useMock) {
    return resolveMockResponse(analyzeMockTicketByAi(data), 380);
  }

  const id = (data as LifecycleTicketPayload & { id?: ApiId }).id;
  if (!id) {
    return resolveMockResponse(analyzeMockTicketByAi(data), 120);
  }

  const result = await http.post<TicketAiAnalysisVO, TicketAiAnalysisVO>(`/tickets/${id}/ai/analyze`);
  return normalizeAiAnalysis(result);
}

async function createDraftAndLoad(data: LifecycleTicketPayload) {
  const id = await http.post<ApiId, ApiId>('/tickets/draft', cleanPayload(toTicketPayload(data)));
  return getTicketDetail(id);
}

function toTicketPayload(data: LifecycleTicketPayload) {
  return {
    title: data.title,
    description: data.description || data.customerRequirement || data.title,
    priority: normalizePriority(data.priority),
    source: data.source,
    category: data.category,
    applicantId: data.applicantId,
    applicantName: data.applicantName || data.customerName,
    handlerId: data.assigneeId,
    handlerName: data.assigneeName,
    expectedFinishTime: data.dueTime,
  };
}

function normalizeLifecycleDetail(data: TicketOrderDetailResponse): LifecycleTicketDetail {
  const ticket = data.ticket;
  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    source: (ticket.source || 'WEB') as LifecycleTicketSource,
    category: ticket.category || '',
    applicantId: ticket.applicantId ?? undefined,
    applicantName: ticket.applicantName ?? undefined,
    assigneeId: ticket.assigneeId ?? ticket.handlerId ?? undefined,
    assigneeName: ticket.assigneeName ?? ticket.handlerName ?? undefined,
    dueTime: ticket.dueTime ?? ticket.expectedFinishTime ?? undefined,
    status: ticket.status,
    createTime: ticket.createTime,
    updateTime: ticket.updateTime,
    acceptedTime: ticket.acceptedTime ?? ticket.acceptTime ?? undefined,
    startProcessTime: ticket.startProcessTime ?? undefined,
    finishTime: ticket.finishTime ?? undefined,
    completedTime: ticket.completedTime ?? ticket.closeTime ?? undefined,
    aiAnalysis: data.aiAnalysis ? normalizeAiAnalysis(data.aiAnalysis) : normalizeAiAnalysis(ticket),
  };
}

function normalizeFlowRecord(record: TicketFlowRecordVO): TicketFlowRecord {
  return {
    id: record.id,
    title: record.actionName || record.action || '-',
    operator: record.operatorName || '-',
    description: record.remark || '',
    status: record.afterStatus || 'DRAFT',
    time: record.createTime || '',
  };
}

function normalizeComment(comment: TicketCommentVO): TicketComment {
  return {
    id: comment.id,
    userName: comment.userName || '',
    content: comment.content,
    time: comment.createTime || '',
  };
}

function normalizeAttachment(attachment: TicketAttachmentVO): TicketAttachment {
  return {
    id: attachment.id,
    name: attachment.fileName || '',
    size: formatFileSize(attachment.fileSize),
    uploader: attachment.uploadUserName || '',
    uploadTime: attachment.createTime || '',
  };
}

function normalizeAiAnalysis(data: TicketAiAnalysisVO | TicketOrderVO): TicketAiAnalysis {
  const suggestion = data.aiSuggestion || '';
  return {
    category: data.aiCategory || '',
    riskLevel: data.aiRiskLevel || '',
    recommendedDepartment: data.aiRecommendDept || '',
    recommendedHandler: data.aiRecommendHandler || '',
    estimatedDuration: data.aiEstimatedTime || '',
    similarTickets: [],
    suggestions: suggestion ? [suggestion] : [],
    summary: data.aiSummary || '',
  };
}

function normalizePriority(priority?: LifecycleTicketPriority): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' {
  if (priority === 'IMPORTANT') {
    return 'HIGH';
  }
  return priority || 'NORMAL';
}

function formatFileSize(size?: number | string | null) {
  const value = Number(size ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  if (value < 1024) {
    return `${value}B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)}KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)}MB`;
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
