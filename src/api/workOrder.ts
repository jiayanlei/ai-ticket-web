import type { ApiId, Nullable, PageQuery, PageResult } from '@/api/types';
import { cleanPayload, cleanQuery, normalizePageResult } from '@/api/types';
import { envConfig } from '@/config';
import {
  createMockWorkOrder,
  deleteMockWorkOrder,
  getMockRecycleWorkOrderList,
  getMockWorkOrderDetail,
  getMockWorkOrderList,
  restoreMockWorkOrder,
  updateMockWorkOrder,
} from '@/mock/ticket';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';
import type { LifecycleTicketStatus } from '@/api/ticket';

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketStatus = 'NEW' | 'PROCESSING' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export interface WorkOrderQueryParams extends PageQuery {
  keyword?: string;
  status?: TicketStatus;
  lifecycleStatus?: LifecycleTicketStatus;
  priority?: TicketPriority;
  category?: string;
  assigneeId?: ApiId;
  applicantId?: ApiId;
  slaRisk?: boolean;
}

export interface WorkOrderItem {
  id: ApiId;
  ticketNo: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  lifecycleStatus?: LifecycleTicketStatus;
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
  if (envConfig.useMock) {
    const page = await resolveMockResponse(getMockWorkOrderList(params));
    return normalizePageResult(page);
  }

  const page = await http.get<PageResult<WorkOrderItem>, PageResult<WorkOrderItem>>('/tickets', {
    params: cleanQuery(params),
  });

  return normalizePageResult(page);
}

export function createWorkOrderApi(data: CreateWorkOrderPayload): Promise<ApiId> {
  if (envConfig.useMock) {
    return resolveMockResponse(createMockWorkOrder(data));
  }

  return http.post<ApiId, ApiId>('/tickets', cleanPayload(data));
}

export async function getRecycleWorkOrderListApi(
  params: WorkOrderQueryParams = {},
): Promise<PageResult<WorkOrderItem>> {
  if (envConfig.useMock) {
    const page = await resolveMockResponse(getMockRecycleWorkOrderList(params));
    return normalizePageResult(page);
  }

  const page = await http.get<PageResult<WorkOrderItem>, PageResult<WorkOrderItem>>('/tickets/recycle-bin', {
    params: cleanQuery(params),
  });

  return normalizePageResult(page);
}

export function getWorkOrderDetailApi(id: ApiId): Promise<WorkOrderItem> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockWorkOrderDetail(id));
  }

  return http.get<WorkOrderItem, WorkOrderItem>(`/tickets/${id}`);
}

export function updateWorkOrderApi(id: ApiId, data: UpdateWorkOrderPayload): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockWorkOrder(id, data)).then(() => undefined);
  }

  return http.put<void, void>(`/tickets/${id}`, cleanPayload(data));
}

export function deleteWorkOrderApi(id: ApiId): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(deleteMockWorkOrder(id)).then(() => undefined);
  }

  return http.delete<void, void>(`/tickets/${id}`);
}

export function restoreWorkOrderApi(id: ApiId): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(restoreMockWorkOrder(id)).then(() => undefined);
  }

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
