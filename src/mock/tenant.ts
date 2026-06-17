import type {
  TenantAuditLog,
  TenantDetail,
  TenantItem,
  TenantMember,
  TenantOrganization,
  TenantPayload,
  TenantQueryParams,
  TenantResourceUsage,
  TenantStatus,
} from '@/api/tenant';
import type { ApiId } from '@/api/types';
import { cloneMock, createMockId, createMockResponse, matchesKeyword, nowText, paginateMock, sortByTimeDesc } from '@/mock/core';

const tenantTime = '2026-06-12 09:00:00';

const tenantSeeds: TenantDetail[] = [
  {
    id: 'tenant-global',
    tenantName: '全球企业服务中心',
    tenantCode: 'GLOBAL-CX',
    status: 'ENABLED',
    serviceStatus: 'NORMAL',
    administrator: '林知远',
    administratorEmail: 'admin@example.com',
    defaultOrganization: '集团运营中心',
    enabledModules: ['工单', '呼叫', '在线会话', '知识库', 'AI', '数据分析'],
    organizationCount: 8,
    userCount: 286,
    agentCount: 168,
    aiAgentCount: 12,
    createTime: '2025-01-05 09:00:00',
    updateTime: tenantTime,
    remark: '集团级默认租户，承载跨区域服务运营。',
    settings: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      channels: ['电话', '在线会话', '邮件', '短信'],
      slaPolicy: '企业客户优先 SLA',
      aiEnabled: true,
      knowledgeScope: '集团知识库',
      ticketRule: '按客户等级和渠道自动分派',
    },
    permissions: ['系统管理员', '运营管理员', '坐席主管', '客服坐席', 'AI 运营', '知识管理员', '审计员'],
  },
  {
    id: 'tenant-apac',
    tenantName: '亚太客户成功中心',
    tenantCode: 'APAC-CS',
    status: 'ENABLED',
    serviceStatus: 'WARNING',
    administrator: '陈沐阳',
    administratorEmail: 'ops.manager@example.com',
    defaultOrganization: '亚太客户成功部',
    enabledModules: ['工单', '在线会话', '知识库', '数据分析'],
    organizationCount: 5,
    userCount: 96,
    agentCount: 64,
    aiAgentCount: 5,
    createTime: '2025-03-18 10:30:00',
    updateTime: '2026-06-10 15:20:00',
    remark: '亚太区域服务租户，近期在线会话资源接近阈值。',
    settings: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      channels: ['在线会话', '邮件', '短信'],
      slaPolicy: '区域客户成功 SLA',
      aiEnabled: true,
      knowledgeScope: '亚太业务知识库',
      ticketRule: '按语言和技能组分派',
    },
    permissions: ['运营管理员', '坐席主管', '客服坐席', '知识管理员'],
  },
  {
    id: 'tenant-emea',
    tenantName: '欧洲售后服务中心',
    tenantCode: 'EMEA-SERVICE',
    status: 'FROZEN',
    serviceStatus: 'SUSPENDED',
    administrator: '宋之言',
    administratorEmail: 'knowledge.lead@example.com',
    defaultOrganization: '欧洲售后团队',
    enabledModules: ['工单', '邮件', '知识库'],
    organizationCount: 3,
    userCount: 42,
    agentCount: 28,
    aiAgentCount: 2,
    createTime: '2025-05-09 11:00:00',
    updateTime: '2026-06-09 18:45:00',
    remark: '因权限审计复核暂时冻结。',
    settings: {
      language: 'en-US',
      timezone: 'Europe/Berlin',
      channels: ['邮件', '电话'],
      slaPolicy: '售后服务 SLA',
      aiEnabled: false,
      knowledgeScope: '售后知识库',
      ticketRule: '按产品线分派',
    },
    permissions: ['运营管理员', '客服坐席', '审计员'],
  },
  {
    id: 'tenant-trial',
    tenantName: '新业务试运行租户',
    tenantCode: 'TRIAL-OPS',
    status: 'INITIALIZING',
    serviceStatus: 'WARNING',
    administrator: '郑宁',
    administratorEmail: 'ai.ops@example.com',
    defaultOrganization: '试运行小组',
    enabledModules: ['工单', 'AI', '数据分析'],
    organizationCount: 1,
    userCount: 12,
    agentCount: 6,
    aiAgentCount: 3,
    createTime: '2026-06-12 09:00:00',
    updateTime: '2026-06-12 09:00:00',
    remark: '用于新业务试运行，初始化完成后再开放给一线团队。',
    settings: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      channels: ['工单'],
      slaPolicy: '试运行 SLA',
      aiEnabled: true,
      knowledgeScope: '试运行知识库',
      ticketRule: '默认进入人工审核队列',
    },
    permissions: ['系统管理员', 'AI 运营'],
  },
];

const organizationSeeds: Record<string, TenantOrganization[]> = {
  'tenant-global': [
    { id: 'org-global-1', organizationName: '集团运营中心', leader: '林知远', memberCount: 68, serviceScope: '全渠道调度' },
    { id: 'org-global-2', organizationName: '知识运营部', leader: '宋之言', memberCount: 36, serviceScope: '知识审核与发布' },
    { id: 'org-global-3', organizationName: 'AI 中台组', leader: '郑宁', memberCount: 24, serviceScope: 'AI Agent 与模型路由' },
  ],
  'tenant-apac': [
    { id: 'org-apac-1', organizationName: '亚太客户成功部', leader: '陈沐阳', memberCount: 44, serviceScope: '客户成功' },
    { id: 'org-apac-2', organizationName: '亚太在线会话组', leader: '李心禾', memberCount: 32, serviceScope: '在线会话' },
  ],
  'tenant-emea': [
    { id: 'org-emea-1', organizationName: '欧洲售后团队', leader: '宋之言', memberCount: 28, serviceScope: '售后工单' },
  ],
  'tenant-trial': [
    { id: 'org-trial-1', organizationName: '试运行小组', leader: '郑宁', memberCount: 12, serviceScope: '试点验证' },
  ],
};

const memberSeeds: Record<string, TenantMember[]> = {
  'tenant-global': [
    { id: 'member-global-1', nickname: '林知远', roleName: '系统管理员', department: '平台运维部', accountStatus: 'ACTIVE', lastActiveTime: '2026-06-12 09:42:18' },
    { id: 'member-global-2', nickname: '陈沐阳', roleName: '运营管理员', department: '平台运维部', accountStatus: 'ACTIVE', lastActiveTime: '2026-06-12 08:17:09' },
    { id: 'member-global-3', nickname: '张若一', roleName: '客服坐席', department: '客户成功部', accountStatus: 'ACTIVE', lastActiveTime: '2026-06-11 19:02:55' },
  ],
  'tenant-apac': [
    { id: 'member-apac-1', nickname: '陈沐阳', roleName: '运营管理员', department: '亚太客户成功部', accountStatus: 'ACTIVE', lastActiveTime: '2026-06-10 15:12:10' },
    { id: 'member-apac-2', nickname: '李心禾', roleName: '客服坐席', department: '亚太在线会话组', accountStatus: 'ACTIVE', lastActiveTime: '2026-06-10 14:38:22' },
  ],
  'tenant-emea': [
    { id: 'member-emea-1', nickname: '宋之言', roleName: '审计员', department: '欧洲售后团队', accountStatus: 'ACTIVE', lastActiveTime: '2026-06-09 17:22:05' },
    { id: 'member-emea-2', nickname: '谢砚青', roleName: '客服坐席', department: '欧洲售后团队', accountStatus: 'DISABLED', lastActiveTime: '2026-05-18 20:45:31' },
  ],
  'tenant-trial': [
    { id: 'member-trial-1', nickname: '郑宁', roleName: 'AI 运营', department: '试运行小组', accountStatus: 'ACTIVE', lastActiveTime: '2026-06-12 09:10:00' },
    { id: 'member-trial-2', nickname: '周航', roleName: '运营管理员', department: '试运行小组', accountStatus: 'INVITED', lastActiveTime: '-' },
  ],
};

const resourceSeeds: Record<string, TenantResourceUsage[]> = {
  'tenant-global': [
    { key: 'users', label: '用户数量', used: 286, limit: 500, unit: '人' },
    { key: 'aiAgents', label: 'AI Agent', used: 12, limit: 20, unit: '个' },
    { key: 'knowledge', label: '知识库容量', used: 680, limit: 1000, unit: 'GB' },
    { key: 'apiCalls', label: 'API 调用', used: 760000, limit: 1000000, unit: '次/月' },
  ],
  'tenant-apac': [
    { key: 'users', label: '用户数量', used: 96, limit: 120, unit: '人' },
    { key: 'aiAgents', label: 'AI Agent', used: 5, limit: 8, unit: '个' },
    { key: 'knowledge', label: '知识库容量', used: 240, limit: 300, unit: 'GB' },
    { key: 'apiCalls', label: 'API 调用', used: 210000, limit: 300000, unit: '次/月' },
  ],
  'tenant-emea': [
    { key: 'users', label: '用户数量', used: 42, limit: 80, unit: '人' },
    { key: 'aiAgents', label: 'AI Agent', used: 2, limit: 5, unit: '个' },
    { key: 'knowledge', label: '知识库容量', used: 120, limit: 200, unit: 'GB' },
    { key: 'apiCalls', label: 'API 调用', used: 68000, limit: 120000, unit: '次/月' },
  ],
  'tenant-trial': [
    { key: 'users', label: '用户数量', used: 12, limit: 50, unit: '人' },
    { key: 'aiAgents', label: 'AI Agent', used: 3, limit: 5, unit: '个' },
    { key: 'knowledge', label: '知识库容量', used: 32, limit: 100, unit: 'GB' },
    { key: 'apiCalls', label: 'API 调用', used: 15000, limit: 80000, unit: '次/月' },
  ],
};

const auditSeeds: Record<string, TenantAuditLog[]> = {
  'tenant-global': [
    { id: 'audit-global-1', action: '租户切换', operator: '林知远', target: '全球企业服务中心', result: 'SUCCESS', operateTime: '2026-06-12 09:45:00' },
    { id: 'audit-global-2', action: '权限模板更新', operator: '林知远', target: '运营管理员', result: 'SUCCESS', operateTime: '2026-06-11 16:20:00' },
  ],
  'tenant-apac': [
    { id: 'audit-apac-1', action: '资源预警', operator: '系统', target: '知识库容量', result: 'WARNING', operateTime: '2026-06-10 15:20:00' },
    { id: 'audit-apac-2', action: '成员邀请', operator: '陈沐阳', target: '亚太在线会话组', result: 'SUCCESS', operateTime: '2026-06-09 11:30:00' },
  ],
  'tenant-emea': [
    { id: 'audit-emea-1', action: '冻结租户', operator: '宋之言', target: '欧洲售后服务中心', result: 'WARNING', operateTime: '2026-06-09 18:45:00' },
  ],
  'tenant-trial': [
    { id: 'audit-trial-1', action: '创建租户', operator: '郑宁', target: '新业务试运行租户', result: 'SUCCESS', operateTime: '2026-06-12 09:00:00' },
  ],
};

let mockTenants = cloneMock(tenantSeeds);
const mockOrganizations = cloneMock(organizationSeeds);
const mockMembers = cloneMock(memberSeeds);
const mockResources = cloneMock(resourceSeeds);
const mockAuditLogs = cloneMock(auditSeeds);

export function getMockTenantList(params: TenantQueryParams = {}) {
  const filtered = sortByTimeDesc(
    mockTenants.filter(
      (item) =>
        matchesKeyword([item.tenantName, item.tenantCode, item.administrator], params.keyword) &&
        (!params.status || item.status === params.status) &&
        (!params.serviceStatus || item.serviceStatus === params.serviceStatus),
    ),
    (item) => item.updateTime,
  );

  return createMockResponse(paginateMock(filtered.map(toTenantItem), params));
}

export function getMockTenantDetail(id: ApiId) {
  return createMockResponse(findTenant(id));
}

export function createMockTenant(data: TenantPayload) {
  const id = createMockId('tenant');
  const tenant: TenantDetail = {
    id,
    tenantName: data.tenantName,
    tenantCode: data.tenantCode,
    status: 'INITIALIZING',
    serviceStatus: 'WARNING',
    administrator: data.administrator,
    administratorEmail: data.administratorEmail,
    defaultOrganization: data.defaultOrganization,
    enabledModules: data.enabledModules,
    organizationCount: 1,
    userCount: 1,
    agentCount: 0,
    aiAgentCount: data.enabledModules.includes('AI') ? 1 : 0,
    createTime: nowText(),
    updateTime: nowText(),
    remark: data.remark ?? null,
    settings: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      channels: ['工单'],
      slaPolicy: '默认租户 SLA',
      aiEnabled: data.enabledModules.includes('AI'),
      knowledgeScope: '租户默认知识库',
      ticketRule: '新工单进入默认队列',
    },
    permissions: ['系统管理员'],
  };

  mockTenants.unshift(tenant);
  mockOrganizations[String(id)] = [
    {
      id: createMockId('org'),
      organizationName: data.defaultOrganization,
      leader: data.administrator,
      memberCount: 1,
      serviceScope: '租户初始化',
    },
  ];
  mockMembers[String(id)] = [
    {
      id: createMockId('member'),
      nickname: data.administrator,
      roleName: '系统管理员',
      department: data.defaultOrganization,
      accountStatus: 'INVITED',
      lastActiveTime: '-',
    },
  ];
  mockResources[String(id)] = [
    { key: 'users', label: '用户数量', used: 1, limit: 50, unit: '人' },
    { key: 'aiAgents', label: 'AI Agent', used: tenant.aiAgentCount, limit: 5, unit: '个' },
    { key: 'knowledge', label: '知识库容量', used: 0, limit: 100, unit: 'GB' },
    { key: 'apiCalls', label: 'API 调用', used: 0, limit: 80000, unit: '次/月' },
  ];
  mockAuditLogs[String(id)] = [
    {
      id: createMockId('audit'),
      action: '创建租户',
      operator: data.administrator,
      target: data.tenantName,
      result: 'SUCCESS',
      operateTime: nowText(),
    },
  ];

  return createMockResponse(id);
}

export function updateMockTenant(id: ApiId, data: TenantPayload) {
  findTenant(id);
  mockTenants = mockTenants.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          tenantName: data.tenantName,
          tenantCode: data.tenantCode,
          administrator: data.administrator,
          administratorEmail: data.administratorEmail,
          defaultOrganization: data.defaultOrganization,
          enabledModules: data.enabledModules,
          aiAgentCount: data.enabledModules.includes('AI') ? Math.max(item.aiAgentCount, 1) : item.aiAgentCount,
          remark: data.remark ?? null,
          updateTime: nowText(),
        }
      : item,
  );
  appendAuditLog(id, '更新租户配置', data.administrator, data.tenantName, 'SUCCESS');
  return createMockResponse(true);
}

export function updateMockTenantStatus(id: ApiId, status: TenantStatus) {
  const tenant = findTenant(id);
  mockTenants = mockTenants.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          status,
          serviceStatus: toServiceStatus(status, item.serviceStatus),
          updateTime: nowText(),
        }
      : item,
  );
  appendAuditLog(id, `状态变更为 ${status}`, tenant.administrator, tenant.tenantName, status === 'FROZEN' ? 'WARNING' : 'SUCCESS');
  return createMockResponse(true);
}

export function getMockTenantMembers(id: ApiId) {
  findTenant(id);
  return createMockResponse(mockMembers[String(id)] ?? []);
}

export function getMockTenantOrganizations(id: ApiId) {
  findTenant(id);
  return createMockResponse(mockOrganizations[String(id)] ?? []);
}

export function getMockTenantResources(id: ApiId) {
  findTenant(id);
  return createMockResponse(mockResources[String(id)] ?? []);
}

export function getMockTenantAuditLogs(id: ApiId) {
  findTenant(id);
  return createMockResponse(sortByTimeDesc(mockAuditLogs[String(id)] ?? [], (item) => item.operateTime));
}

function findTenant(id: ApiId) {
  const tenant = mockTenants.find((item) => String(item.id) === String(id));

  if (!tenant) {
    throw new Error(`Tenant ${id} not found`);
  }

  return cloneMock(tenant);
}

function toTenantItem(tenant: TenantDetail): TenantItem {
  const { settings, permissions, ...item } = tenant;
  void settings;
  void permissions;
  return item;
}

function toServiceStatus(status: TenantStatus, current: TenantDetail['serviceStatus']) {
  if (status === 'ENABLED') {
    return current === 'SUSPENDED' ? 'NORMAL' : current;
  }

  if (status === 'FROZEN' || status === 'DISABLED' || status === 'ARCHIVED') {
    return 'SUSPENDED';
  }

  return 'WARNING';
}

function appendAuditLog(id: ApiId, action: string, operator: string, target: string, result: TenantAuditLog['result']) {
  const key = String(id);
  mockAuditLogs[key] = [
    {
      id: createMockId('audit'),
      action,
      operator,
      target,
      result,
      operateTime: nowText(),
    },
    ...(mockAuditLogs[key] ?? []),
  ];
}
