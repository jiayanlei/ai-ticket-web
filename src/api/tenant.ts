import type { ApiId, PageQuery, PageResult } from '@/api/types';
import { cleanPayload, cleanQuery } from '@/api/types';
import { http } from '@/utils/http';

export type TenantStatus = 'DRAFT' | 'INITIALIZING' | 'ENABLED' | 'FROZEN' | 'DISABLED' | 'ARCHIVED';
export type TenantServiceStatus = 'NORMAL' | 'WARNING' | 'SUSPENDED';

export interface TenantQueryParams extends PageQuery {
  keyword?: string;
  status?: TenantStatus;
  serviceStatus?: TenantServiceStatus;
}

export interface TenantItem {
  id: ApiId;
  tenantName: string;
  tenantCode: string;
  status: TenantStatus;
  serviceStatus: TenantServiceStatus;
  administrator: string;
  administratorEmail: string;
  defaultOrganization: string;
  enabledModules: string[];
  organizationCount: number;
  userCount: number;
  agentCount: number;
  aiAgentCount: number;
  createTime: string;
  updateTime: string;
  remark: string | null;
}

export interface TenantPayload {
  tenantName: string;
  tenantCode: string;
  administrator: string;
  administratorEmail: string;
  defaultOrganization: string;
  enabledModules: string[];
  remark?: string;
}

export interface TenantOrganization {
  id: ApiId;
  organizationName: string;
  leader: string;
  memberCount: number;
  serviceScope: string;
}

export interface TenantMember {
  id: ApiId;
  nickname: string;
  roleName: string;
  department: string;
  accountStatus: 'ACTIVE' | 'INVITED' | 'DISABLED';
  lastActiveTime: string;
}

export interface TenantResourceUsage {
  key: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
}

export interface TenantAuditLog {
  id: ApiId;
  action: string;
  operator: string;
  target: string;
  result: 'SUCCESS' | 'WARNING';
  operateTime: string;
}

export interface TenantDetail extends TenantItem {
  settings: {
    language: string;
    timezone: string;
    channels: string[];
    slaPolicy: string;
    aiEnabled: boolean;
    knowledgeScope: string;
    ticketRule: string;
  };
  permissions: string[];
}

export function getTenantListApi(params: TenantQueryParams = {}): Promise<PageResult<TenantItem>> {
  return http.get<PageResult<TenantItem>, PageResult<TenantItem>>('/tenants', {
    params: cleanQuery(params),
  });
}

export function getTenantDetailApi(id: ApiId): Promise<TenantDetail> {
  return http.get<TenantDetail, TenantDetail>(`/tenants/${id}`);
}

export function createTenantApi(data: TenantPayload): Promise<ApiId> {
  return http.post<ApiId, ApiId>('/tenants', cleanPayload(data));
}

export function updateTenantApi(id: ApiId, data: TenantPayload): Promise<void> {
  return http.put<void, void>(`/tenants/${id}`, cleanPayload(data));
}

export function updateTenantStatusApi(id: ApiId, status: TenantStatus): Promise<void> {
  return http.patch<void, void>(`/tenants/${id}/status`, { status });
}

export function getTenantMembersApi(id: ApiId): Promise<TenantMember[]> {
  return http.get<TenantMember[], TenantMember[]>(`/tenants/${id}/members`);
}

export function getTenantOrganizationsApi(id: ApiId): Promise<TenantOrganization[]> {
  return http.get<TenantOrganization[], TenantOrganization[]>(`/tenants/${id}/organizations`);
}

export function getTenantResourcesApi(id: ApiId): Promise<TenantResourceUsage[]> {
  return http.get<TenantResourceUsage[], TenantResourceUsage[]>(`/tenants/${id}/resources`);
}

export function getTenantAuditLogsApi(id: ApiId): Promise<TenantAuditLog[]> {
  return http.get<TenantAuditLog[], TenantAuditLog[]>(`/tenants/${id}/audit-logs`);
}
