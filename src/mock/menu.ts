import type { CommonStatus } from '@/api/types';
import type { MenuItem, MenuPayload, MenuQueryParams, MenuType } from '@/api/menu';
import { cloneMock, createMockId, createMockResponse, nowText } from '@/mock/core';

const menuTime = '2026-06-12 09:00:00';

interface MenuSeedInput {
  id: string;
  parentId: string | number;
  menuName: string;
  i18nKey?: string;
  menuType: MenuType;
  sortOrder: number;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  visible?: boolean;
  status?: CommonStatus;
}

function createMenuItem(input: MenuSeedInput): MenuItem {
  return {
    id: input.id,
    parentId: input.parentId,
    menuName: input.menuName,
    i18nKey: input.i18nKey ?? null,
    menuType: input.menuType,
    path: input.path ?? null,
    component: input.component ?? null,
    perms: input.perms ?? null,
    icon: input.icon ?? null,
    sortOrder: input.sortOrder,
    visible: input.visible ?? true,
    status: input.status ?? 'ENABLED',
    createTime: menuTime,
    updateTime: menuTime,
  };
}

const domainSeeds: MenuSeedInput[] = [
  { id: 'm-smart-workspace', i18nKey: 'menu.smartWorkspace', parentId: 0, menuName: 'Smart Workspace', menuType: 'DIR', sortOrder: 1, icon: 'dashboard' },
  { id: 'm-service-center', i18nKey: 'menu.serviceCenter', parentId: 0, menuName: 'Service Center', menuType: 'DIR', sortOrder: 2, icon: 'customer-service' },
  { id: 'm-omnichannel-center', i18nKey: 'menu.omnichannelCenter', parentId: 0, menuName: 'Omnichannel Center', menuType: 'DIR', sortOrder: 3, icon: 'inbox' },
  { id: 'm-agent-operations', i18nKey: 'menu.agentOperations', parentId: 0, menuName: 'Agent Operations', menuType: 'DIR', sortOrder: 4, icon: 'team' },
  { id: 'm-ai-capability', i18nKey: 'menu.aiCapability', parentId: 0, menuName: 'AI Capability Center', menuType: 'DIR', sortOrder: 5, icon: 'robot' },
  { id: 'm-customer-center', i18nKey: 'menu.customerCenter', parentId: 0, menuName: 'Customer Center', menuType: 'DIR', sortOrder: 6, icon: 'user' },
  { id: 'm-tenant-center', parentId: 0, menuName: 'Tenant Management', menuType: 'DIR', sortOrder: 7, icon: 'deployment-unit' },
  { id: 'm-knowledge-center', i18nKey: 'menu.knowledgeCenter', parentId: 0, menuName: 'Knowledge Center', menuType: 'DIR', sortOrder: 8, icon: 'book' },
  { id: 'm-analytics', i18nKey: 'menu.analytics', parentId: 0, menuName: 'Analytics', menuType: 'DIR', sortOrder: 9, icon: 'bar-chart' },
  { id: 'm-system-management', i18nKey: 'menu.systemManagement', parentId: 0, menuName: 'System Management', menuType: 'DIR', sortOrder: 10, icon: 'setting' },
];

const pageSeedInputs: MenuSeedInput[] = [
  { id: 'm-dashboard-workbench', i18nKey: 'menu.dashboard', parentId: 'm-smart-workspace', menuName: 'Dashboard', path: '/dashboard/workbench', component: 'dashboard/workbench/index', perms: 'dashboard:workbench:view', icon: 'dashboard', sortOrder: 1, menuType: 'MENU' },

  { id: 'm-service-tickets', i18nKey: 'menu.ticketCenter', parentId: 'm-service-center', menuName: 'Ticket Center', path: '/service/tickets', component: 'service/tickets/index', perms: 'service:ticket:view', icon: 'ticket', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-service-calls', i18nKey: 'menu.callCenter', parentId: 'm-service-center', menuName: 'Call Center', path: '/service/calls', component: 'service/calls/index', perms: 'service:call:view', icon: 'phone', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-service-live-chat', i18nKey: 'menu.liveChatCenter', parentId: 'm-service-center', menuName: 'Live Chat Center', path: '/service/live-chat', component: 'service/live-chat/index', perms: 'service:chat:view', icon: 'message', sortOrder: 3, menuType: 'MENU' },

  { id: 'm-omni-email', i18nKey: 'menu.emailCenter', parentId: 'm-omnichannel-center', menuName: 'Email Center', path: '/omnichannel/email', component: 'omnichannel/email/index', perms: 'omnichannel:email:view', icon: 'mail', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-omni-sms', i18nKey: 'menu.smsCenter', parentId: 'm-omnichannel-center', menuName: 'SMS Center', path: '/omnichannel/sms', component: 'omnichannel/sms/index', perms: 'omnichannel:sms:view', icon: 'mobile', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-omni-inbox', i18nKey: 'menu.unifiedInbox', parentId: 'm-omnichannel-center', menuName: 'Unified Inbox', path: '/omnichannel/inbox', component: 'omnichannel/inbox/index', perms: 'omnichannel:inbox:view', icon: 'inbox', sortOrder: 3, menuType: 'MENU' },

  { id: 'm-ops-agents', i18nKey: 'menu.agentCenter', parentId: 'm-agent-operations', menuName: 'Agent Center', path: '/operations/agents', component: 'operations/agents/index', perms: 'operations:agent:view', icon: 'team', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-ops-scheduling', i18nKey: 'menu.workforceScheduling', parentId: 'm-agent-operations', menuName: 'Workforce Scheduling', path: '/operations/scheduling', component: 'operations/scheduling/index', perms: 'operations:schedule:view', icon: 'schedule', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-ops-performance', i18nKey: 'menu.performanceCenter', parentId: 'm-agent-operations', menuName: 'Performance Center', path: '/operations/performance', component: 'operations/performance/index', perms: 'operations:performance:view', icon: 'trophy', sortOrder: 3, menuType: 'MENU' },
  { id: 'm-ops-quality', i18nKey: 'menu.aiQualityInspection', parentId: 'm-agent-operations', menuName: 'AI Quality Inspection', path: '/operations/quality', component: 'operations/quality/index', perms: 'operations:quality:view', icon: 'safety', sortOrder: 4, menuType: 'MENU' },
  { id: 'm-ops-training', i18nKey: 'menu.trainingCenter', parentId: 'm-agent-operations', menuName: 'Training Center', path: '/operations/training', component: 'operations/training/index', perms: 'operations:training:view', icon: 'read', sortOrder: 5, menuType: 'MENU' },

  { id: 'm-ai-agents', i18nKey: 'menu.aiAgentCenter', parentId: 'm-ai-capability', menuName: 'AI Agent Center', path: '/ai/agents', component: 'ai/agents/index', perms: 'ai:agent:view', icon: 'robot', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-ai-workflows', i18nKey: 'menu.aiWorkflowCenter', parentId: 'm-ai-capability', menuName: 'AI Workflow Center', path: '/ai/workflows', component: 'ai/workflows/index', perms: 'ai:workflow:view', icon: 'branches', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-ai-prompts', i18nKey: 'menu.aiPromptCenter', parentId: 'm-ai-capability', menuName: 'AI Prompt Center', path: '/ai/prompts', component: 'ai/prompts/index', perms: 'ai:prompt:view', icon: 'code', sortOrder: 3, menuType: 'MENU' },
  { id: 'm-ai-models', i18nKey: 'menu.aiModelCenter', parentId: 'm-ai-capability', menuName: 'AI Model Center', path: '/ai/models', component: 'ai/models/index', perms: 'ai:model:view', icon: 'experiment', sortOrder: 4, menuType: 'MENU' },

  { id: 'm-customer-360', i18nKey: 'menu.customer360', parentId: 'm-customer-center', menuName: 'Customer 360', path: '/customers/360', component: 'customers/360/index', perms: 'customer:360:view', icon: 'user', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-customer-journey', i18nKey: 'menu.customerJourney', parentId: 'm-customer-center', menuName: 'Customer Journey', path: '/customers/journey', component: 'customers/journey/index', perms: 'customer:journey:view', icon: 'deployment-unit', sortOrder: 2, menuType: 'MENU' },

  { id: 'm-knowledge-base', i18nKey: 'menu.knowledgeBase', parentId: 'm-knowledge-center', menuName: 'Knowledge Base', path: '/knowledge/base', component: 'knowledge/base/index', perms: 'knowledge:base:view', icon: 'book', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-knowledge-manage', parentId: 'm-knowledge-center', menuName: '知识库管理', path: '/knowledge/manage', component: 'knowledge/manage/index', perms: 'knowledge:document:list', icon: 'read', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-knowledge-documents', parentId: 'm-knowledge-center', menuName: '文档中心', path: '/knowledge/documents', component: 'knowledge/documents/index', perms: 'knowledge:document:list', icon: 'file-search', sortOrder: 3, menuType: 'MENU' },
  { id: 'm-knowledge-faq', parentId: 'm-knowledge-center', menuName: 'FAQ 管理', path: '/knowledge/faq', component: 'knowledge/faq/index', perms: 'knowledge:faq:view', icon: 'question-circle', sortOrder: 4, menuType: 'MENU' },
  { id: 'm-knowledge-legacy', parentId: 'm-knowledge-center', menuName: '旧版知识库入口', path: '/knowledge', component: 'knowledge/base/index', perms: 'knowledge:base:view', icon: 'book', sortOrder: 90, menuType: 'MENU', visible: false },

  { id: 'm-analytics-operations', i18nKey: 'menu.operationsAnalytics', parentId: 'm-analytics', menuName: 'Operations Analytics', path: '/analytics/operations', component: 'analytics/operations/index', perms: 'analytics:operations:view', icon: 'line-chart', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-analytics-bi', i18nKey: 'menu.biReports', parentId: 'm-analytics', menuName: 'BI Reports', path: '/analytics/bi', component: 'analytics/bi/index', perms: 'analytics:bi:view', icon: 'bar-chart', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-analytics-cockpit', i18nKey: 'menu.dataCockpit', parentId: 'm-analytics', menuName: 'Data Cockpit', path: '/analytics/cockpit', component: 'analytics/cockpit/index', perms: 'analytics:cockpit:view', icon: 'dashboard', sortOrder: 3, menuType: 'MENU' },
  { id: 'm-analytics-sla', i18nKey: 'menu.slaManagement', parentId: 'm-analytics', menuName: 'SLA Management', path: '/analytics/sla', component: 'analytics/sla/index', perms: 'analytics:sla:view', icon: 'clock', sortOrder: 4, menuType: 'MENU' },
  { id: 'm-analytics-risk', i18nKey: 'menu.riskWarning', parentId: 'm-analytics', menuName: 'Risk Warning', path: '/analytics/risk', component: 'analytics/risk/index', perms: 'analytics:risk:view', icon: 'warning', sortOrder: 5, menuType: 'MENU' },
  { id: 'm-analytics-monitoring', i18nKey: 'menu.systemMonitoring', parentId: 'm-analytics', menuName: 'System Monitoring', path: '/analytics/monitoring', component: 'analytics/monitoring/index', perms: 'analytics:monitoring:view', icon: 'monitor', sortOrder: 6, menuType: 'MENU' },
  { id: 'm-analytics-alerts', i18nKey: 'menu.alertCenter', parentId: 'm-analytics', menuName: 'Alert Center', path: '/analytics/alerts', component: 'analytics/alerts/index', perms: 'analytics:alert:view', icon: 'alert', sortOrder: 7, menuType: 'MENU' },

  { id: 'm-tenant-center-page', parentId: 'm-tenant-center', menuName: 'Tenant Center', path: '/tenants', component: 'system/tenants/index', perms: 'tenant:center:view', icon: 'deployment-unit', sortOrder: 1, menuType: 'MENU' },

  { id: 'm-system-permissions', i18nKey: 'menu.permissionCenter', parentId: 'm-system-management', menuName: 'Permission Center', path: '/system/permissions', component: 'system/permissions/index', perms: 'system:permission:view', icon: 'shield', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-system-audit', i18nKey: 'menu.auditCenter', parentId: 'm-system-management', menuName: 'Audit Center', path: '/system/audit', component: 'system/audit/index', perms: 'system:audit:view', icon: 'file-search', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-system-management-page', i18nKey: 'menu.systemManagement', parentId: 'm-system-management', menuName: 'System Management', path: '/system/management', component: 'system/management/index', perms: 'system:management:view', icon: 'setting', sortOrder: 3, menuType: 'MENU' },
  { id: 'm-system-open-platform', i18nKey: 'menu.openPlatform', parentId: 'm-system-management', menuName: 'Open Platform', path: '/system/open-platform', component: 'system/open-platform/index', perms: 'system:open-platform:view', icon: 'api', sortOrder: 4, menuType: 'MENU' },
  { id: 'm-system-users', parentId: 'm-system-management', menuName: '用户管理', path: '/system/users', component: 'system/users/index', perms: 'system:user:list', icon: 'user', sortOrder: 5, menuType: 'MENU' },
  { id: 'm-system-roles', parentId: 'm-system-management', menuName: '角色管理', path: '/system/roles', component: 'system/roles/index', perms: 'system:role:list', icon: 'team', sortOrder: 6, menuType: 'MENU' },
  { id: 'm-system-depts', parentId: 'm-system-management', menuName: '部门管理', path: '/system/depts', component: 'system/depts/index', perms: 'system:dept:list', icon: 'apartment', sortOrder: 7, menuType: 'MENU' },
  { id: 'm-system-menus', parentId: 'm-system-management', menuName: '菜单管理', path: '/system/menus', component: 'system/menus/index', perms: 'system:menu:list', icon: 'menu', sortOrder: 8, menuType: 'MENU' },
  { id: 'm-system-settings', parentId: 'm-system-management', menuName: '系统配置', path: '/system/settings', component: 'system/settings/index', perms: 'system:settings:view', icon: 'setting', sortOrder: 9, menuType: 'MENU' },
  { id: 'm-system-permission-legacy', parentId: 'm-system-management', menuName: '用户权限', path: '/system/permission', component: 'system/permission/index', perms: 'system:permission:view', icon: 'shield', sortOrder: 10, menuType: 'MENU' },

  { id: 'm-ai-chat', parentId: 'm-ai-capability', menuName: 'AI 问答', path: '/ai/chat', component: 'console/codex/index', perms: 'ai:assistant:chat', icon: 'robot', sortOrder: 80, menuType: 'MENU' },
  { id: 'm-ai-overview-legacy', parentId: 'm-ai-capability', menuName: 'AI 分析概览', path: '/ai/overview', component: 'ai/overview/index', perms: 'ai:overview:view', icon: 'bar-chart', sortOrder: 81, menuType: 'MENU' },
  { id: 'm-ai-result', parentId: 'm-ai-capability', menuName: 'AI 分析结果', path: '/ai/result', component: 'ai/result/index', perms: 'ai:result:view', icon: 'file-search', sortOrder: 82, menuType: 'MENU' },
  { id: 'm-ai-conversation', parentId: 'm-ai-capability', menuName: '对话记录', path: '/ai/conversation', component: 'conversation/records/index', perms: 'ai:conversation:list', icon: 'profile', sortOrder: 83, menuType: 'MENU' },
];

const pageSeeds: MenuSeedInput[] = pageSeedInputs;

const compatibilitySeeds: MenuSeedInput[] = [
  { id: 'm-ticket-list-legacy', i18nKey: 'menu.legacyTicketList', parentId: 'm-service-center', menuName: 'Legacy Ticket List', path: '/ticket/list', component: 'ticket/list/index', perms: 'service:ticket:view', icon: 'unordered-list', sortOrder: 90, menuType: 'MENU', visible: false },
  { id: 'm-ticket-create-legacy', i18nKey: 'menu.legacyTicketCreate', parentId: 'm-service-center', menuName: 'Legacy Ticket Create', path: '/ticket/create', component: 'ticket/create/index', perms: 'service:ticket:create', icon: 'plus-circle', sortOrder: 91, menuType: 'MENU', visible: false },
  { id: 'm-ticket-trash-legacy', i18nKey: 'menu.legacyTicketTrash', parentId: 'm-service-center', menuName: 'Legacy Ticket Trash', path: '/ticket/trash', component: 'ticket/trash/index', perms: 'service:ticket:delete', icon: 'delete', sortOrder: 92, menuType: 'MENU', visible: false },
];

const actionSeeds: MenuSeedInput[] = [
  { id: 'btn-ticket-create', i18nKey: 'menu.createTicket', parentId: 'm-service-tickets', menuName: 'Create Ticket', menuType: 'BUTTON', perms: 'service:ticket:create', sortOrder: 1 },
  { id: 'btn-ticket-update', i18nKey: 'menu.updateTicket', parentId: 'm-service-tickets', menuName: 'Update Ticket', menuType: 'BUTTON', perms: 'service:ticket:update', sortOrder: 2 },
  { id: 'btn-ticket-approve', i18nKey: 'menu.approveTicket', parentId: 'm-service-tickets', menuName: 'Approve Ticket', menuType: 'BUTTON', perms: 'service:ticket:approve', sortOrder: 3 },
  { id: 'btn-ticket-export', i18nKey: 'menu.exportTickets', parentId: 'm-service-tickets', menuName: 'Export Tickets', menuType: 'BUTTON', perms: 'service:ticket:export', sortOrder: 4 },
  { id: 'btn-call-monitor', i18nKey: 'menu.monitorCall', parentId: 'm-service-calls', menuName: 'Monitor Call', menuType: 'BUTTON', perms: 'service:call:monitor', sortOrder: 1 },
  { id: 'btn-call-barge', i18nKey: 'menu.bargeIn', parentId: 'm-service-calls', menuName: 'Barge In', menuType: 'BUTTON', perms: 'service:call:barge', sortOrder: 2 },
  { id: 'btn-call-disconnect', i18nKey: 'menu.forceDisconnect', parentId: 'm-service-calls', menuName: 'Force Disconnect', menuType: 'BUTTON', perms: 'service:call:disconnect', sortOrder: 3 },
  { id: 'btn-ai-workflow-publish', i18nKey: 'menu.publishWorkflow', parentId: 'm-ai-workflows', menuName: 'Publish Workflow', menuType: 'BUTTON', perms: 'ai:workflow:publish', sortOrder: 1 },
  { id: 'btn-ai-model-route', i18nKey: 'menu.updateModelRoute', parentId: 'm-ai-models', menuName: 'Update Model Route', menuType: 'BUTTON', perms: 'ai:model:route', sortOrder: 1 },
  { id: 'btn-knowledge-create', parentId: 'm-knowledge-manage', menuName: '知识新增', menuType: 'BUTTON', perms: 'knowledge:document:create', sortOrder: 1 },
  { id: 'btn-knowledge-update', parentId: 'm-knowledge-manage', menuName: '知识编辑', menuType: 'BUTTON', perms: 'knowledge:document:update', sortOrder: 2 },
  { id: 'btn-knowledge-delete', parentId: 'm-knowledge-manage', menuName: '知识删除', menuType: 'BUTTON', perms: 'knowledge:document:delete', sortOrder: 3 },
  { id: 'btn-knowledge-publish', parentId: 'm-knowledge-manage', menuName: '知识发布', menuType: 'BUTTON', perms: 'knowledge:document:publish', sortOrder: 4 },
  { id: 'btn-knowledge-offline', parentId: 'm-knowledge-manage', menuName: '知识下架', menuType: 'BUTTON', perms: 'knowledge:document:offline', sortOrder: 5 },
  { id: 'btn-tenant-create', parentId: 'm-tenant-center-page', menuName: 'Create Tenant', menuType: 'BUTTON', perms: 'tenant:center:create', sortOrder: 1 },
  { id: 'btn-tenant-update', parentId: 'm-tenant-center-page', menuName: 'Update Tenant', menuType: 'BUTTON', perms: 'tenant:center:update', sortOrder: 2 },
  { id: 'btn-tenant-status', parentId: 'm-tenant-center-page', menuName: 'Change Tenant Status', menuType: 'BUTTON', perms: 'tenant:center:status', sortOrder: 3 },
  { id: 'btn-tenant-member', parentId: 'm-tenant-center-page', menuName: 'Manage Tenant Members', menuType: 'BUTTON', perms: 'tenant:center:member', sortOrder: 4 },
  { id: 'btn-tenant-permission', parentId: 'm-tenant-center-page', menuName: 'Manage Tenant Permissions', menuType: 'BUTTON', perms: 'tenant:center:permission', sortOrder: 5 },
  { id: 'btn-tenant-audit', parentId: 'm-tenant-center-page', menuName: 'View Tenant Audit', menuType: 'BUTTON', perms: 'tenant:center:audit', sortOrder: 6 },
  { id: 'btn-tenant-export', parentId: 'm-tenant-center-page', menuName: 'Export Tenant Data', menuType: 'BUTTON', perms: 'tenant:center:export', sortOrder: 7 },
  { id: 'btn-audit-export', i18nKey: 'menu.exportAuditLogs', parentId: 'm-system-audit', menuName: 'Export Audit Logs', menuType: 'BUTTON', perms: 'system:audit:export', sortOrder: 1 },
];

const menuSeeds: MenuItem[] = [...domainSeeds, ...pageSeeds, ...compatibilitySeeds, ...actionSeeds].map(createMenuItem);

let mockMenus = cloneMock(menuSeeds);

export function getMockMenuList(params: MenuQueryParams = {}) {
  const menuName = params.menuName?.trim().toLowerCase();
  const filtered = mockMenus.filter((item) => {
    const matchName = !menuName || item.menuName.toLowerCase().includes(menuName);
    const matchType = !params.menuType || item.menuType === params.menuType;
    const matchStatus = !params.status || item.status === params.status;
    return matchName && matchType && matchStatus;
  });

  return createMockResponse(filtered);
}

export function getMockMenuDetail(id: string | number) {
  return createMockResponse(findMenu(id));
}

export function createMockMenu(data: MenuPayload) {
  const id = createMockId('menu');
  const timestamp = nowText();
  mockMenus.unshift(
    createMenuItem({
      id,
      parentId: data.parentId ?? 0,
      menuName: data.menuName,
      menuType: data.menuType,
      path: data.path,
      component: data.component,
      perms: data.perms,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
      visible: data.visible ?? true,
      status: data.status ?? 'ENABLED',
    }),
  );
  mockMenus = mockMenus.map((item) => (item.id === id ? { ...item, createTime: timestamp, updateTime: timestamp } : item));
  return createMockResponse(id);
}

export function updateMockMenu(id: string | number, data: MenuPayload) {
  findMenu(id);
  mockMenus = mockMenus.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          parentId: data.parentId ?? item.parentId,
          menuName: data.menuName,
          menuType: data.menuType,
          path: data.path ?? null,
          component: data.component ?? null,
          perms: data.perms ?? null,
          icon: data.icon ?? null,
          sortOrder: data.sortOrder ?? item.sortOrder,
          visible: data.visible ?? item.visible,
          status: data.status ?? item.status,
          updateTime: nowText(),
        }
      : item,
  );
  return createMockResponse(true);
}

export function deleteMockMenu(id: string | number) {
  const blockedIds = new Set([String(id)]);
  let changed = true;

  while (changed) {
    changed = false;
    mockMenus.forEach((item) => {
      if (!blockedIds.has(String(item.id)) && blockedIds.has(String(item.parentId))) {
        blockedIds.add(String(item.id));
        changed = true;
      }
    });
  }

  mockMenus = mockMenus.filter((item) => !blockedIds.has(String(item.id)));
  return createMockResponse(true);
}

export function getMockMenus() {
  return cloneMock(mockMenus);
}

export function getMockPermissionCodes() {
  return cloneMock(
    mockMenus
      .filter((item) => item.perms)
      .map((item) => item.perms as string),
  );
}

function findMenu(id: string | number) {
  const record = mockMenus.find((item) => String(item.id) === String(id));

  if (!record) {
    throw new Error(`Menu ${id} not found`);
  }

  return cloneMock(record);
}
