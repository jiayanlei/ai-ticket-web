import type { ApiId, PageQuery, PageResult } from '@/api/types';
import { cleanPayload, cleanQuery } from '@/api/types';
import { envConfig } from '@/config';
import {
  createMockTenant,
  getMockTenantAuditLogs,
  getMockTenantDetail,
  getMockTenantList,
  getMockTenantMembers,
  getMockTenantOrganizations,
  getMockTenantResources,
  updateMockTenant,
  updateMockTenantStatus,
} from '@/mock/tenant';
import { resolveMockResponse } from '@/mock/core';
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
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTenantList(params));
  }

  return http.get<PageResult<TenantItem>, PageResult<TenantItem>>('/tenants', {
    params: cleanQuery(params),
  });
}

export function getTenantDetailApi(id: ApiId): Promise<TenantDetail> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTenantDetail(id));
  }

  return http.get<TenantDetail, TenantDetail>(`/tenants/${id}`);
}

export function createTenantApi(data: TenantPayload): Promise<ApiId> {
  if (envConfig.useMock) {
    return resolveMockResponse(createMockTenant(data));
  }

  return http.post<ApiId, ApiId>('/tenants', cleanPayload(data));
}

export function updateTenantApi(id: ApiId, data: TenantPayload): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockTenant(id, data)).then(() => undefined);
  }

  return http.put<void, void>(`/tenants/${id}`, cleanPayload(data));
}

export function updateTenantStatusApi(id: ApiId, status: TenantStatus): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockTenantStatus(id, status)).then(() => undefined);
  }

  return http.patch<void, void>(`/tenants/${id}/status`, { status });
}

export function getTenantMembersApi(id: ApiId): Promise<TenantMember[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTenantMembers(id));
  }

  return http.get<TenantMember[], TenantMember[]>(`/tenants/${id}/members`);
}

export function getTenantOrganizationsApi(id: ApiId): Promise<TenantOrganization[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTenantOrganizations(id));
  }

  return http.get<TenantOrganization[], TenantOrganization[]>(`/tenants/${id}/organizations`);
}

export function getTenantResourcesApi(id: ApiId): Promise<TenantResourceUsage[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTenantResources(id));
  }

  return http.get<TenantResourceUsage[], TenantResourceUsage[]>(`/tenants/${id}/resources`);
}

export function getTenantAuditLogsApi(id: ApiId): Promise<TenantAuditLog[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTenantAuditLogs(id));
  }

  return http.get<TenantAuditLog[], TenantAuditLog[]>(`/tenants/${id}/audit-logs`);
}
