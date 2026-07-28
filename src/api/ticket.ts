import type { ApiId } from '@/api/types';
import { cleanPayload } from '@/api/types';
import { http } from '@/utils/http';

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
  return http.post<LifecycleTicketDetail, LifecycleTicketDetail>('/tickets/lifecycle', cleanPayload(data));
}

export function saveTicketDraft(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  return http.post<LifecycleTicketDetail, LifecycleTicketDetail>('/tickets/lifecycle/drafts', cleanPayload(data));
}

export function submitTicket(data: LifecycleTicketPayload): Promise<LifecycleTicketDetail> {
  return http.post<LifecycleTicketDetail, LifecycleTicketDetail>('/tickets/lifecycle/submit', cleanPayload(data));
}

export async function acceptTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus; acceptedTime: string }> {
  return http.patch(`/tickets/lifecycle/${id}/accept`);
}

export async function startProcessTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; startProcessTime: string }> {
  return http.patch(`/tickets/lifecycle/${id}/start-process`);
}

export async function finishProcessTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; finishTime: string }> {
  return http.patch(`/tickets/lifecycle/${id}/finish-process`);
}

export async function confirmTicket(
  id: ApiId,
): Promise<{ id: ApiId; status: LifecycleTicketStatus; completedTime: string; processingDuration: string }> {
  return http.patch(`/tickets/lifecycle/${id}/confirm`);
}

export async function reopenTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  return http.patch(`/tickets/lifecycle/${id}/reopen`);
}

export async function suspendTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  return http.patch(`/tickets/lifecycle/${id}/suspend`);
}

export async function resumeTicket(id: ApiId): Promise<{ id: ApiId; status: LifecycleTicketStatus }> {
  return http.patch(`/tickets/lifecycle/${id}/resume`);
}

export async function transferTicket(
  id: ApiId,
  assignee: { assigneeId?: ApiId; assigneeName?: string },
): Promise<{ id: ApiId; status: LifecycleTicketStatus; assigneeId?: ApiId; assigneeName?: string }> {
  return http.patch(`/tickets/lifecycle/${id}/transfer`, cleanPayload(assignee));
}

export function getTicketDetail(id: ApiId): Promise<LifecycleTicketDetail> {
  return http.get<LifecycleTicketDetail, LifecycleTicketDetail>(`/tickets/lifecycle/${id}`);
}

export function getTicketFlowRecords(id: ApiId): Promise<TicketFlowRecord[]> {
  return http.get<TicketFlowRecord[], TicketFlowRecord[]>(`/tickets/lifecycle/${id}/flow-records`);
}

export function getTicketComments(id: ApiId): Promise<TicketComment[]> {
  return http.get<TicketComment[], TicketComment[]>(`/tickets/lifecycle/${id}/comments`);
}

export function addTicketComment(id: ApiId, content: string): Promise<TicketComment> {
  return http.post<TicketComment, TicketComment>(`/tickets/lifecycle/${id}/comments`, { content });
}

export function getTicketAttachments(id: ApiId): Promise<TicketAttachment[]> {
  return http.get<TicketAttachment[], TicketAttachment[]>(`/tickets/lifecycle/${id}/attachments`);
}

export function getTicketOperationLogs(id: ApiId): Promise<TicketOperationLog[]> {
  return http.get<TicketOperationLog[], TicketOperationLog[]>(`/tickets/lifecycle/${id}/operation-logs`);
}

export function analyzeTicketByAi(data: LifecycleTicketPayload): Promise<TicketAiAnalysis> {
  return http.post<TicketAiAnalysis, TicketAiAnalysis>('/tickets/lifecycle/ai-analysis', cleanPayload(data));
}
