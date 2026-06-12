import type { CommonStatus } from '@/api/types';
import type { MenuItem, MenuPayload, MenuQueryParams, MenuType } from '@/api/menu';
import { cloneMock, createMockId, createMockResponse, nowText } from '@/mock/core';

const menuTime = '2026-06-12 09:00:00';

interface MenuSeedInput {
  id: string;
  parentId: string | number;
  menuName: string;
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

const pageComponent = 'ai-ticket-os/index';

const domainSeeds: MenuSeedInput[] = [
  { id: 'm-smart-workspace', parentId: 0, menuName: 'Smart Workspace', menuType: 'DIR', sortOrder: 1, icon: 'dashboard' },
  { id: 'm-service-center', parentId: 0, menuName: 'Service Center', menuType: 'DIR', sortOrder: 2, icon: 'customer-service' },
  { id: 'm-omnichannel-center', parentId: 0, menuName: 'Omnichannel Center', menuType: 'DIR', sortOrder: 3, icon: 'inbox' },
  { id: 'm-agent-operations', parentId: 0, menuName: 'Agent Operations', menuType: 'DIR', sortOrder: 4, icon: 'team' },
  { id: 'm-ai-capability', parentId: 0, menuName: 'AI Capability Center', menuType: 'DIR', sortOrder: 5, icon: 'robot' },
  { id: 'm-customer-center', parentId: 0, menuName: 'Customer Center', menuType: 'DIR', sortOrder: 6, icon: 'user' },
  { id: 'm-knowledge-center', parentId: 0, menuName: 'Knowledge Center', menuType: 'DIR', sortOrder: 7, icon: 'book' },
  { id: 'm-analytics', parentId: 0, menuName: 'Analytics', menuType: 'DIR', sortOrder: 8, icon: 'bar-chart' },
  { id: 'm-system-management', parentId: 0, menuName: 'System Management', menuType: 'DIR', sortOrder: 9, icon: 'setting' },
];

const pageSeedInputs: MenuSeedInput[] = [
  { id: 'm-dashboard-workbench', parentId: 'm-smart-workspace', menuName: 'Dashboard', path: '/dashboard/workbench', perms: 'dashboard:workbench:view', icon: 'dashboard', sortOrder: 1, menuType: 'MENU' },

  { id: 'm-service-tickets', parentId: 'm-service-center', menuName: 'Ticket Center', path: '/service/tickets', perms: 'service:ticket:view', icon: 'ticket', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-service-calls', parentId: 'm-service-center', menuName: 'Call Center', path: '/service/calls', perms: 'service:call:view', icon: 'phone', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-service-live-chat', parentId: 'm-service-center', menuName: 'Live Chat Center', path: '/service/live-chat', perms: 'service:chat:view', icon: 'message', sortOrder: 3, menuType: 'MENU' },

  { id: 'm-omni-email', parentId: 'm-omnichannel-center', menuName: 'Email Center', path: '/omnichannel/email', perms: 'omnichannel:email:view', icon: 'mail', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-omni-sms', parentId: 'm-omnichannel-center', menuName: 'SMS Center', path: '/omnichannel/sms', perms: 'omnichannel:sms:view', icon: 'mobile', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-omni-inbox', parentId: 'm-omnichannel-center', menuName: 'Unified Inbox', path: '/omnichannel/inbox', perms: 'omnichannel:inbox:view', icon: 'inbox', sortOrder: 3, menuType: 'MENU' },

  { id: 'm-ops-agents', parentId: 'm-agent-operations', menuName: 'Agent Center', path: '/operations/agents', perms: 'operations:agent:view', icon: 'team', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-ops-scheduling', parentId: 'm-agent-operations', menuName: 'Workforce Scheduling', path: '/operations/scheduling', perms: 'operations:schedule:view', icon: 'schedule', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-ops-performance', parentId: 'm-agent-operations', menuName: 'Performance Center', path: '/operations/performance', perms: 'operations:performance:view', icon: 'trophy', sortOrder: 3, menuType: 'MENU' },
  { id: 'm-ops-quality', parentId: 'm-agent-operations', menuName: 'AI Quality Inspection', path: '/operations/quality', perms: 'operations:quality:view', icon: 'safety', sortOrder: 4, menuType: 'MENU' },
  { id: 'm-ops-training', parentId: 'm-agent-operations', menuName: 'Training Center', path: '/operations/training', perms: 'operations:training:view', icon: 'read', sortOrder: 5, menuType: 'MENU' },

  { id: 'm-ai-agents', parentId: 'm-ai-capability', menuName: 'AI Agent Center', path: '/ai/agents', perms: 'ai:agent:view', icon: 'robot', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-ai-workflows', parentId: 'm-ai-capability', menuName: 'AI Workflow Center', path: '/ai/workflows', perms: 'ai:workflow:view', icon: 'branches', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-ai-prompts', parentId: 'm-ai-capability', menuName: 'AI Prompt Center', path: '/ai/prompts', perms: 'ai:prompt:view', icon: 'code', sortOrder: 3, menuType: 'MENU' },
  { id: 'm-ai-models', parentId: 'm-ai-capability', menuName: 'AI Model Center', path: '/ai/models', perms: 'ai:model:view', icon: 'experiment', sortOrder: 4, menuType: 'MENU' },

  { id: 'm-customer-360', parentId: 'm-customer-center', menuName: 'Customer 360', path: '/customers/360', perms: 'customer:360:view', icon: 'user', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-customer-journey', parentId: 'm-customer-center', menuName: 'Customer Journey', path: '/customers/journey', perms: 'customer:journey:view', icon: 'deployment-unit', sortOrder: 2, menuType: 'MENU' },

  { id: 'm-knowledge-base', parentId: 'm-knowledge-center', menuName: 'Knowledge Base', path: '/knowledge/base', perms: 'knowledge:base:view', icon: 'book', sortOrder: 1, menuType: 'MENU' },

  { id: 'm-analytics-operations', parentId: 'm-analytics', menuName: 'Operations Analytics', path: '/analytics/operations', perms: 'analytics:operations:view', icon: 'line-chart', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-analytics-bi', parentId: 'm-analytics', menuName: 'BI Reports', path: '/analytics/bi', perms: 'analytics:bi:view', icon: 'bar-chart', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-analytics-cockpit', parentId: 'm-analytics', menuName: 'Data Cockpit', path: '/analytics/cockpit', perms: 'analytics:cockpit:view', icon: 'dashboard', sortOrder: 3, menuType: 'MENU' },
  { id: 'm-analytics-sla', parentId: 'm-analytics', menuName: 'SLA Management', path: '/analytics/sla', perms: 'analytics:sla:view', icon: 'clock', sortOrder: 4, menuType: 'MENU' },
  { id: 'm-analytics-risk', parentId: 'm-analytics', menuName: 'Risk Warning', path: '/analytics/risk', perms: 'analytics:risk:view', icon: 'warning', sortOrder: 5, menuType: 'MENU' },
  { id: 'm-analytics-monitoring', parentId: 'm-analytics', menuName: 'System Monitoring', path: '/analytics/monitoring', perms: 'analytics:monitoring:view', icon: 'monitor', sortOrder: 6, menuType: 'MENU' },
  { id: 'm-analytics-alerts', parentId: 'm-analytics', menuName: 'Alert Center', path: '/analytics/alerts', perms: 'analytics:alert:view', icon: 'alert', sortOrder: 7, menuType: 'MENU' },

  { id: 'm-system-permissions', parentId: 'm-system-management', menuName: 'Permission Center', path: '/system/permissions', perms: 'system:permission:view', icon: 'shield', sortOrder: 1, menuType: 'MENU' },
  { id: 'm-system-audit', parentId: 'm-system-management', menuName: 'Audit Center', path: '/system/audit', perms: 'system:audit:view', icon: 'file-search', sortOrder: 2, menuType: 'MENU' },
  { id: 'm-system-management-page', parentId: 'm-system-management', menuName: 'System Management', path: '/system/management', perms: 'system:management:view', icon: 'setting', sortOrder: 3, menuType: 'MENU' },
  { id: 'm-system-open-platform', parentId: 'm-system-management', menuName: 'Open Platform', path: '/system/open-platform', perms: 'system:open-platform:view', icon: 'api', sortOrder: 4, menuType: 'MENU' },
];

const pageSeeds: MenuSeedInput[] = pageSeedInputs.map((item) => ({
  component: pageComponent,
  ...item,
}));

const compatibilitySeeds: MenuSeedInput[] = [
  { id: 'm-ticket-list-legacy', parentId: 'm-service-center', menuName: 'Legacy Ticket List', path: '/ticket/list', component: 'ticket/list/index', perms: 'service:ticket:view', icon: 'unordered-list', sortOrder: 90, menuType: 'MENU', visible: false },
  { id: 'm-ticket-create-legacy', parentId: 'm-service-center', menuName: 'Legacy Ticket Create', path: '/ticket/create', component: 'ticket/create/index', perms: 'service:ticket:create', icon: 'plus-circle', sortOrder: 91, menuType: 'MENU', visible: false },
  { id: 'm-ticket-trash-legacy', parentId: 'm-service-center', menuName: 'Legacy Ticket Trash', path: '/ticket/trash', component: 'ticket/trash/index', perms: 'service:ticket:delete', icon: 'delete', sortOrder: 92, menuType: 'MENU', visible: false },
];

const actionSeeds: MenuSeedInput[] = [
  { id: 'btn-ticket-create', parentId: 'm-service-tickets', menuName: 'Create Ticket', menuType: 'BUTTON', perms: 'service:ticket:create', sortOrder: 1 },
  { id: 'btn-ticket-update', parentId: 'm-service-tickets', menuName: 'Update Ticket', menuType: 'BUTTON', perms: 'service:ticket:update', sortOrder: 2 },
  { id: 'btn-ticket-approve', parentId: 'm-service-tickets', menuName: 'Approve Ticket', menuType: 'BUTTON', perms: 'service:ticket:approve', sortOrder: 3 },
  { id: 'btn-ticket-export', parentId: 'm-service-tickets', menuName: 'Export Tickets', menuType: 'BUTTON', perms: 'service:ticket:export', sortOrder: 4 },
  { id: 'btn-call-monitor', parentId: 'm-service-calls', menuName: 'Monitor Call', menuType: 'BUTTON', perms: 'service:call:monitor', sortOrder: 1 },
  { id: 'btn-call-barge', parentId: 'm-service-calls', menuName: 'Barge In', menuType: 'BUTTON', perms: 'service:call:barge', sortOrder: 2 },
  { id: 'btn-call-disconnect', parentId: 'm-service-calls', menuName: 'Force Disconnect', menuType: 'BUTTON', perms: 'service:call:disconnect', sortOrder: 3 },
  { id: 'btn-ai-workflow-publish', parentId: 'm-ai-workflows', menuName: 'Publish Workflow', menuType: 'BUTTON', perms: 'ai:workflow:publish', sortOrder: 1 },
  { id: 'btn-ai-model-route', parentId: 'm-ai-models', menuName: 'Update Model Route', menuType: 'BUTTON', perms: 'ai:model:route', sortOrder: 1 },
  { id: 'btn-audit-export', parentId: 'm-system-audit', menuName: 'Export Audit Logs', menuType: 'BUTTON', perms: 'system:audit:export', sortOrder: 1 },
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
