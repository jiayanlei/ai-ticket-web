import type { ApiId, Nullable, PageQuery, PageResult } from '@/api/types';
import { cleanPayload, cleanQuery, normalizePageResult } from '@/api/types';
import { http } from '@/utils/http';

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketStatus = 'NEW' | 'PROCESSING' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export interface WorkOrderQueryParams extends PageQuery {
  keyword?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assigneeId?: ApiId;
  applicantId?: ApiId;
}

export interface WorkOrderItem {
  id: ApiId;
  ticketNo: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  source: Nullable<string>;
  category: Nullable<string>;
  applicantId: Nullable<ApiId>;
  applicantName: Nullable<string>;
  assigneeId: Nullable<ApiId>;
  assigneeName: Nullable<string>;
  dueTime: Nullable<string>;
  resolvedTime: Nullable<string>;
  closedTime: Nullable<string>;
  aiSummary: Nullable<string>;
  aiRiskLevel: Nullable<string>;
  createTime: string;
  updateTime: string;
}

export interface CreateWorkOrderPayload {
  title: string;
  description: string;
  priority?: TicketPriority;
  source?: string;
  category?: string;
  applicantId?: ApiId;
  applicantName?: string;
  assigneeId?: ApiId;
  assigneeName?: string;
  dueTime?: string;
}

export interface UpdateWorkOrderPayload {
  title: string;
  description: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  source?: string;
  category?: string;
  assigneeId?: ApiId;
  assigneeName?: string;
  dueTime?: string;
  resolvedTime?: string;
  closedTime?: string;
  aiSummary?: string;
  aiRiskLevel?: string;
}

export async function getWorkOrderListApi(params: WorkOrderQueryParams = {}): Promise<PageResult<WorkOrderItem>> {
  const page = await http.get<PageResult<WorkOrderItem>, PageResult<WorkOrderItem>>('/tickets', {
    params: cleanQuery(params),
  });

  return normalizePageResult(page);
}

export function createWorkOrderApi(data: CreateWorkOrderPayload): Promise<ApiId> {
  return http.post<ApiId, ApiId>('/tickets', cleanPayload(data));
}

export async function getRecycleWorkOrderListApi(
  params: WorkOrderQueryParams = {},
): Promise<PageResult<WorkOrderItem>> {
  const page = await http.get<PageResult<WorkOrderItem>, PageResult<WorkOrderItem>>('/tickets/recycle-bin', {
    params: cleanQuery(params),
  });

  return normalizePageResult(page);
}

export function getWorkOrderDetailApi(id: ApiId): Promise<WorkOrderItem> {
  return http.get<WorkOrderItem, WorkOrderItem>(`/tickets/${id}`);
}

export function updateWorkOrderApi(id: ApiId, data: UpdateWorkOrderPayload): Promise<void> {
  return http.put<void, void>(`/tickets/${id}`, cleanPayload(data));
}

export function deleteWorkOrderApi(id: ApiId): Promise<void> {
  return http.delete<void, void>(`/tickets/${id}`);
}

export function restoreWorkOrderApi(id: ApiId): Promise<void> {
  return http.patch<void, void>(`/tickets/${id}/restore`);
}

export function toWorkOrderUpdatePayload(
  item: WorkOrderItem,
  patch: Partial<UpdateWorkOrderPayload> = {},
): UpdateWorkOrderPayload {
  return {
    title: item.title,
    description: item.description,
    priority: item.priority,
    status: item.status,
    source: item.source ?? undefined,
    category: item.category ?? undefined,
    assigneeId: item.assigneeId ?? undefined,
    assigneeName: item.assigneeName ?? undefined,
    dueTime: item.dueTime ?? undefined,
    resolvedTime: item.resolvedTime ?? undefined,
    closedTime: item.closedTime ?? undefined,
    aiSummary: item.aiSummary ?? undefined,
    aiRiskLevel: item.aiRiskLevel ?? undefined,
    ...patch,
  };
}
