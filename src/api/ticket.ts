import type { ApiId } from '@/api/types';
import {
  addMockTicketComment,
  analyzeMockTicketByAi,
  createLifecycleTicket,
  getMockLifecycleDetail,
  getMockTicketAttachments,
  getMockTicketComments,
  getMockTicketFlowRecords,
  updateLifecycleTicketStatus,
} from '@/mock/ticket';
import { resolveMockResponse } from '@/mock/core';

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

export function createTicket(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  return resolveMockResponse(createLifecycleTicket(data, 'DRAFT'));
}

export function saveTicketDraft(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  return resolveMockResponse(createLifecycleTicket(data, 'DRAFT'));
}

export function submitTicket(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  return resolveMockResponse(createLifecycleTicket(data, 'PENDING_ACCEPT'));
}

export async function acceptTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus; acceptedTime: string }> {
  const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'ACCEPTED', { acceptedTime: new Date().toISOString().slice(0, 19).replace('T', ' ') }));
  return { id: detail.id, status: detail.status, acceptedTime: detail.acceptedTime || detail.updateTime };
}

export async function startProcessTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; startProcessTime: string }> {
  const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PROCESSING', { startProcessTime: new Date().toISOString().slice(0, 19).replace('T', ' ') }));
  return { id: detail.id, status: detail.status, startProcessTime: detail.startProcessTime || detail.updateTime };
}

export async function finishProcessTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; finishTime: string }> {
  const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'WAIT_CONFIRM', { finishTime: new Date().toISOString().slice(0, 19).replace('T', ' ') }));
  return { id: detail.id, status: detail.status, finishTime: detail.finishTime || detail.updateTime };
}

export async function confirmTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; completedTime: string; processingDuration: string }> {
  const detail = await resolveMockResponse(
    updateLifecycleTicketStatus(id, 'COMPLETED', {
      completedTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
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

export async function reopenTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PROCESSING'));
  return { id: detail.id, status: detail.status };
}

export async function suspendTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PENDING'));
  return { id: detail.id, status: detail.status };
}

export async function resumeTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PROCESSING'));
  return { id: detail.id, status: detail.status };
}

export async function transferTicket(
  id: ApiId,
  assignee: { assigneeId?: ApiId; assigneeName?: string },
): Promise<{ id: ApiId; status: LifecycleTicketStatus; assigneeId?: ApiId; assigneeName?: string }> {
  const detail = await resolveMockResponse(updateLifecycleTicketStatus(id, 'PENDING_ACCEPT', assignee));
  return {
    id: detail.id,
    status: detail.status,
    assigneeId: detail.assigneeId,
    assigneeName: detail.assigneeName,
  };
}

export function getTicketDetail(id: ApiId): Promise<LifecycleTicketDetail> {
  return resolveMockResponse(getMockLifecycleDetail(id));
}

export function getTicketFlowRecords(id: ApiId): Promise<TicketFlowRecord[]> {
  return resolveMockResponse(getMockTicketFlowRecords(id));
}

export function getTicketComments(id: ApiId): Promise<TicketComment[]> {
  return resolveMockResponse(getMockTicketComments(id));
}

export function addTicketComment(id: ApiId, content: string): Promise<TicketComment> {
  return resolveMockResponse(addMockTicketComment(id, content));
}

export function getTicketAttachments(id: ApiId): Promise<TicketAttachment[]> {
  return resolveMockResponse(getMockTicketAttachments(id));
}

export function analyzeTicketByAi(data: LifecycleTicketPayload): Promise<TicketAiAnalysis> {
  return resolveMockResponse(analyzeMockTicketByAi(data), 380);
}
