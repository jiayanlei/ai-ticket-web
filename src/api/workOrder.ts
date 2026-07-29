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
export type LegacyTicketStatus = 'NEW' | 'RESOLVED';
export type TicketStatus = LifecycleTicketStatus | LegacyTicketStatus | 'REJECTED';

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

interface TicketOrderDetailResponse {
  ticket?: WorkOrderItem;
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
    params: cleanQuery(normalizeWorkOrderQuery(params)),
  });

  return normalizeWorkOrderPage(page);
}

export function createWorkOrderApi(data: CreateWorkOrderPayload): Promise<ApiId> {
  if (envConfig.useMock) {
    return resolveMockResponse(createMockWorkOrder(data));
  }

  return http.post<ApiId, ApiId>('/tickets', cleanPayload(normalizeWorkOrderPayload(data)));
}

export async function getRecycleWorkOrderListApi(
  params: WorkOrderQueryParams = {},
): Promise<PageResult<WorkOrderItem>> {
  if (envConfig.useMock) {
    const page = await resolveMockResponse(getMockRecycleWorkOrderList(params));
    return normalizePageResult(page);
  }

  const page = await http.get<PageResult<WorkOrderItem>, PageResult<WorkOrderItem>>('/tickets/recycle-bin', {
    params: cleanQuery(normalizeWorkOrderQuery(params)),
  });

  return normalizeWorkOrderPage(page);
}

export async function getWorkOrderDetailApi(id: ApiId): Promise<WorkOrderItem> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockWorkOrderDetail(id));
  }

  const data = await http.get<WorkOrderItem | TicketOrderDetailResponse, WorkOrderItem | TicketOrderDetailResponse>(`/tickets/${id}`);
  return normalizeWorkOrderItem('ticket' in data && data.ticket ? data.ticket : data as WorkOrderItem);
}

export function updateWorkOrderApi(id: ApiId, data: UpdateWorkOrderPayload): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockWorkOrder(id, data)).then(() => undefined);
  }

  return http.put<void, void>(`/tickets/${id}`, cleanPayload(normalizeWorkOrderPayload(data)));
}

export function deleteWorkOrderApi(id: ApiId): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(deleteMockWorkOrder(id)).then(() => undefined);
  }

  return http.delete<void, void>(`/tickets/${id}`);
}

function normalizeWorkOrderQuery(params: WorkOrderQueryParams) {
  const status = params.lifecycleStatus ?? mapLegacyStatus(params.status);
  return {
    ...params,
    status,
    lifecycleStatus: undefined,
  };
}

function normalizeWorkOrderPayload<T extends CreateWorkOrderPayload | UpdateWorkOrderPayload>(data: T): T {
  return {
    ...data,
    priority: mapPriority(data.priority),
    status: 'status' in data ? mapLegacyStatus(data.status) : undefined,
  };
}

function normalizeWorkOrderPage(page: PageResult<WorkOrderItem>): PageResult<WorkOrderItem> {
  const normalizedPage = normalizePageResult(page);
  return {
    ...normalizedPage,
    records: normalizedPage.records.map(normalizeWorkOrderItem),
  };
}

function normalizeWorkOrderItem(item: WorkOrderItem): WorkOrderItem {
  const raw = item as WorkOrderItem & {
    finishTime?: Nullable<string>;
    closeTime?: Nullable<string>;
    expectedFinishTime?: Nullable<string>;
    handlerId?: Nullable<ApiId>;
    handlerName?: Nullable<string>;
  };
  const status = mapLegacyStatus(item.status) ?? 'DRAFT';

  return {
    ...item,
    status,
    lifecycleStatus: item.lifecycleStatus ?? status as LifecycleTicketStatus,
    assigneeId: item.assigneeId ?? raw.handlerId ?? null,
    assigneeName: item.assigneeName ?? raw.handlerName ?? null,
    dueTime: item.dueTime ?? raw.expectedFinishTime ?? null,
    resolvedTime: item.resolvedTime ?? raw.finishTime ?? null,
    closedTime: item.closedTime ?? raw.closeTime ?? null,
  };
}

export function mapLegacyStatus(status?: TicketStatus): TicketStatus | undefined {
  if (status === 'NEW') {
    return 'DRAFT';
  }
  if (status === 'RESOLVED') {
    return 'WAIT_CONFIRM';
  }
  return status;
}

export function mapPriority(priority?: TicketPriority | 'IMPORTANT'): TicketPriority | undefined {
  if (priority === 'IMPORTANT') {
    return 'HIGH';
  }
  return priority;
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
