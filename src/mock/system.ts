import type { ApiId, CommonStatus } from '@/api/types';
import type { DeptItem, DeptPayload, DeptQueryParams } from '@/api/dept';
import type { RoleItem, RolePayload, RoleQueryParams } from '@/api/role';
import type { CreateUserPayload, UpdateUserPayload, UserItem, UserQueryParams } from '@/api/user';
import { cloneMock, createMockId, createMockResponse, matchesKeyword, nowText, paginateMock, sortByTimeDesc } from '@/mock/core';
import { getMockPermissionCodes } from '@/mock/menu';

export interface MockRoleRecord extends RoleItem {
  permissions: string[];
}

export interface MockUserRecord extends UserItem {
  jobNo: string;
  deptName: string;
  roleIds: ApiId[];
  roleCodes: string[];
  roleNames: string[];
}

export interface SystemSettingItem {
  key: string;
  label: string;
  value: string | number | boolean;
  description: string;
  category: 'general' | 'security' | 'ai' | 'integration';
}

export interface TeamAssetItem {
  id: ApiId;
  name: string;
  type: 'template' | 'manual' | 'prompt' | 'script';
  owner: string;
  department: string;
  status: 'online' | 'draft' | 'archived';
  updateTime: string;
  usageCount: number;
}

export interface CultureArticleItem {
  id: ApiId;
  title: string;
  category: string;
  audience: string;
  owner: string;
  publishTime: string;
  summary: string;
}

const departmentsSeed: DeptItem[] = [
  { id: 'dept-0', parentId: 0, deptName: '集团运营中心', deptCode: 'OPS-GROUP', leader: '周航', phone: '021-68886600', email: 'ops-center@example.com', sortOrder: 1, status: 'ENABLED', createTime: '2025-01-05 09:00:00', updateTime: '2026-05-29 16:00:00' },
  { id: 'dept-1', parentId: 'dept-0', deptName: '平台运维部', deptCode: 'OPS-PLATFORM', leader: '陈斌', phone: '021-68886601', email: 'platform@example.com', sortOrder: 1, status: 'ENABLED', createTime: '2025-01-06 09:00:00', updateTime: '2026-05-31 10:00:00' },
  { id: 'dept-2', parentId: 'dept-0', deptName: '知识运营部', deptCode: 'OPS-KNOWLEDGE', leader: '宋佳', phone: '021-68886602', email: 'knowledge@example.com', sortOrder: 2, status: 'ENABLED', createTime: '2025-01-07 09:00:00', updateTime: '2026-05-30 11:00:00' },
  { id: 'dept-3', parentId: 'dept-0', deptName: '客户成功部', deptCode: 'OPS-CS', leader: '刘薇', phone: '021-68886603', email: 'success@example.com', sortOrder: 3, status: 'ENABLED', createTime: '2025-01-08 09:00:00', updateTime: '2026-05-28 10:00:00' },
  { id: 'dept-4', parentId: 'dept-1', deptName: 'AI 中台组', deptCode: 'OPS-AI', leader: '郑宁', phone: '021-68886604', email: 'ai-center@example.com', sortOrder: 1, status: 'ENABLED', createTime: '2025-01-09 09:00:00', updateTime: '2026-06-01 09:00:00' },
  { id: 'dept-5', parentId: 'dept-1', deptName: '基础架构组', deptCode: 'OPS-INFRA', leader: '谢涛', phone: '021-68886605', email: 'infra@example.com', sortOrder: 2, status: 'ENABLED', createTime: '2025-01-10 09:00:00', updateTime: '2026-05-26 15:00:00' },
  { id: 'dept-6', parentId: 'dept-0', deptName: '流程治理办', deptCode: 'OPS-BPM', leader: '黄莹', phone: '021-68886606', email: 'bpm@example.com', sortOrder: 4, status: 'DISABLED', createTime: '2025-01-11 09:00:00', updateTime: '2026-04-19 15:00:00' },
];

const rolesSeed: MockRoleRecord[] = [
  { id: 'role-admin', roleName: '系统管理员', roleCode: 'admin', sortOrder: 1, status: 'ENABLED', remark: '拥有全量菜单和按钮权限', permissions: ['*', '*:*:*', ...getMockPermissionCodes()], createTime: '2025-01-12 09:00:00', updateTime: '2026-05-31 17:00:00' },
  { id: 'role-ops-manager', roleName: '运维主管', roleCode: 'ops_manager', sortOrder: 2, status: 'ENABLED', remark: '负责工单统筹、升级和调度', permissions: getMockPermissionCodes().filter((permission) => !permission.startsWith('system:audit')), createTime: '2025-01-13 09:00:00', updateTime: '2026-05-30 18:00:00' },
  { id: 'role-knowledge-admin', roleName: '知识库管理员', roleCode: 'knowledge_admin', sortOrder: 3, status: 'ENABLED', remark: '维护知识文档、图谱与文档中心', permissions: getMockPermissionCodes().filter((permission) => permission.startsWith('knowledge') || permission.startsWith('ai:prompt') || permission === 'dashboard:workbench:view'), createTime: '2025-01-14 09:00:00', updateTime: '2026-05-29 18:00:00' },
  { id: 'role-agent', roleName: '客服坐席', roleCode: 'agent', sortOrder: 4, status: 'ENABLED', remark: '处理待办工单和知识检索', permissions: ['dashboard:workbench:view', 'service:ticket:view', 'service:ticket:create', 'service:chat:view', 'customer:360:view', 'knowledge:base:view'], createTime: '2025-01-15 09:00:00', updateTime: '2026-05-28 17:00:00' },
  { id: 'role-auditor', roleName: '审计访客', roleCode: 'auditor', sortOrder: 5, status: 'DISABLED', remark: '只读审计账号', permissions: ['dashboard:workbench:view', 'analytics:cockpit:view', 'analytics:operations:view', 'system:audit:view'], createTime: '2025-01-16 09:00:00', updateTime: '2026-04-22 10:00:00' },
];

const usersSeed: MockUserRecord[] = [
  { id: 'user-10001', username: 'admin', nickname: '林知远', email: 'admin@example.com', mobile: '13800010001', avatar: null, deptId: 'dept-1', deptName: '平台运维部', status: 'ENABLED', lastLoginTime: '2026-06-07 09:42:18', createTime: '2025-02-01 09:00:00', updateTime: '2026-06-07 09:42:18', jobNo: 'EMP0001', roleIds: ['role-admin'], roleCodes: ['admin'], roleNames: ['系统管理员'] },
  { id: 'user-10002', username: 'ops.manager', nickname: '陈沐阳', email: 'ops.manager@example.com', mobile: '13800010002', avatar: null, deptId: 'dept-1', deptName: '平台运维部', status: 'ENABLED', lastLoginTime: '2026-06-07 08:17:09', createTime: '2025-02-03 09:00:00', updateTime: '2026-06-07 08:17:09', jobNo: 'EMP0002', roleIds: ['role-ops-manager'], roleCodes: ['ops_manager'], roleNames: ['运维主管'] },
  { id: 'user-10003', username: 'knowledge.lead', nickname: '宋之言', email: 'knowledge.lead@example.com', mobile: '13800010003', avatar: null, deptId: 'dept-2', deptName: '知识运营部', status: 'ENABLED', lastLoginTime: '2026-06-06 17:35:44', createTime: '2025-02-05 09:00:00', updateTime: '2026-06-06 17:35:44', jobNo: 'EMP0003', roleIds: ['role-knowledge-admin'], roleCodes: ['knowledge_admin'], roleNames: ['知识库管理员'] },
  { id: 'user-10004', username: 'agent.zhang', nickname: '张若一', email: 'agent.zhang@example.com', mobile: '13800010004', avatar: null, deptId: 'dept-3', deptName: '客户成功部', status: 'ENABLED', lastLoginTime: '2026-06-07 09:02:55', createTime: '2025-02-07 09:00:00', updateTime: '2026-06-07 09:02:55', jobNo: 'EMP0004', roleIds: ['role-agent'], roleCodes: ['agent'], roleNames: ['客服坐席'] },
  { id: 'user-10005', username: 'agent.li', nickname: '李心禾', email: 'agent.li@example.com', mobile: '13800010005', avatar: null, deptId: 'dept-3', deptName: '客户成功部', status: 'ENABLED', lastLoginTime: '2026-06-07 08:51:12', createTime: '2025-02-08 09:00:00', updateTime: '2026-06-07 08:51:12', jobNo: 'EMP0005', roleIds: ['role-agent'], roleCodes: ['agent'], roleNames: ['客服坐席'] },
  { id: 'user-10006', username: 'ai.ops', nickname: '郑宁', email: 'ai.ops@example.com', mobile: '13800010006', avatar: null, deptId: 'dept-4', deptName: 'AI 中台组', status: 'ENABLED', lastLoginTime: '2026-06-06 21:16:43', createTime: '2025-02-10 09:00:00', updateTime: '2026-06-06 21:16:43', jobNo: 'EMP0006', roleIds: ['role-ops-manager'], roleCodes: ['ops_manager'], roleNames: ['运维主管'] },
  { id: 'user-10007', username: 'infra.xie', nickname: '谢砚青', email: 'infra.xie@example.com', mobile: '13800010007', avatar: null, deptId: 'dept-5', deptName: '基础架构组', status: 'DISABLED', lastLoginTime: '2026-05-18 20:45:31', createTime: '2025-02-11 09:00:00', updateTime: '2026-05-18 20:45:31', jobNo: 'EMP0007', roleIds: ['role-ops-manager'], roleCodes: ['ops_manager'], roleNames: ['运维主管'] },
];

const settingsSeed: SystemSettingItem[] = [
  { key: 'ticket.sla.response', label: '首次响应 SLA（分钟）', value: 15, description: '新建工单首次响应时限', category: 'general' },
  { key: 'ticket.sla.resolve', label: '普通工单解决 SLA（小时）', value: 24, description: '默认普通优先级工单解决时限', category: 'general' },
  { key: 'auth.session.timeout', label: '登录会话时长（小时）', value: 12, description: '登录后 token 保持有效的默认时长', category: 'security' },
  { key: 'auth.password.weakCheck', label: '启用弱密码校验', value: true, description: '创建或重置账号时启用基础弱密码拦截', category: 'security' },
  { key: 'ai.answer.streaming', label: 'AI 模拟流式输出', value: true, description: '前端开发阶段默认开启问答流式展示', category: 'ai' },
  { key: 'ai.auto.classify', label: 'AI 自动分类', value: true, description: '工单提交后自动生成分类和风险标签', category: 'ai' },
  { key: 'integration.ocr.provider', label: '文档解析引擎', value: 'mock-ocr-v2', description: '文档中心本地 mock 解析引擎标识', category: 'integration' },
  { key: 'integration.notify.channel', label: '通知渠道', value: '企业微信 / 邮件 / 短信', description: '系统消息默认通知出口', category: 'integration' },
];

const teamAssetsSeed: TeamAssetItem[] = [
  { id: 'asset-1', name: '一线坐席标准应答模板', type: 'template', owner: '宋之言', department: '知识运营部', status: 'online', updateTime: '2026-06-05 16:18:00', usageCount: 268 },
  { id: 'asset-2', name: '复杂工单升级判定 Prompt', type: 'prompt', owner: '郑宁', department: 'AI 中台组', status: 'online', updateTime: '2026-06-04 10:32:00', usageCount: 152 },
  { id: 'asset-3', name: '热线值班交接手册', type: 'manual', owner: '刘薇', department: '客户成功部', status: 'draft', updateTime: '2026-06-02 11:05:00', usageCount: 39 },
  { id: 'asset-4', name: '批量回访脚本', type: 'script', owner: '陈沐阳', department: '平台运维部', status: 'archived', updateTime: '2026-05-26 19:20:00', usageCount: 74 },
];

const cultureSeed: CultureArticleItem[] = [
  { id: 'culture-1', title: '客户问题不过夜响应机制', category: '服务原则', audience: '全员', owner: '流程治理办', publishTime: '2026-05-08 09:00:00', summary: '明确热线、工单、知识运营在夜间和节假日的协同交接要求。' },
  { id: 'culture-2', title: '知识即产品：文档共建标准', category: '知识文化', audience: '知识运营 / 一线坐席', owner: '知识运营部', publishTime: '2026-04-21 14:30:00', summary: '沉淀问题复盘、统一口径和版本维护规范，减少重复沟通成本。' },
  { id: 'culture-3', title: 'AI 助手使用红线', category: '合规规范', audience: '全员', owner: 'AI 中台组', publishTime: '2026-03-29 11:45:00', summary: '强调敏感信息脱敏、输出复核和生产变更双人确认原则。' },
];

let mockDepartments = cloneMock(departmentsSeed);
let mockRoles = cloneMock(rolesSeed);
let mockUsers = cloneMock(usersSeed);
let mockSettings = cloneMock(settingsSeed);
const mockTeamAssets = cloneMock(teamAssetsSeed);
const mockCultureArticles = cloneMock(cultureSeed);

export function getMockDeptList(params: DeptQueryParams = {}) {
  const filtered = sortByTimeDesc(
    mockDepartments.filter(
      (item) =>
        matchesKeyword([item.deptName], params.deptName) &&
        matchesKeyword([item.deptCode], params.deptCode) &&
        (!params.status || item.status === params.status),
    ),
    (item) => item.updateTime,
  );

  return createMockResponse(filtered);
}

export function getMockDeptDetail(id: ApiId) {
  return createMockResponse(findDept(id));
}

export function createMockDept(data: DeptPayload) {
  const id = createMockId('dept');
  mockDepartments.push({
    id,
    parentId: data.parentId ?? 0,
    deptName: data.deptName,
    deptCode: data.deptCode,
    leader: data.leader ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    sortOrder: data.sortOrder ?? mockDepartments.length + 1,
    status: data.status ?? 'ENABLED',
    createTime: nowText(),
    updateTime: nowText(),
  });
  return createMockResponse(id);
}

export function updateMockDept(id: ApiId, data: DeptPayload) {
  mockDepartments = mockDepartments.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          parentId: data.parentId ?? item.parentId,
          deptName: data.deptName,
          deptCode: data.deptCode,
          leader: data.leader ?? null,
          phone: data.phone ?? null,
          email: data.email ?? null,
          sortOrder: data.sortOrder ?? item.sortOrder,
          status: data.status ?? item.status,
          updateTime: nowText(),
        }
      : item,
  );
  return createMockResponse(true);
}

export function deleteMockDept(id: ApiId) {
  const blockedIds = new Set([String(id)]);
  let changed = true;

  while (changed) {
    changed = false;
    mockDepartments.forEach((item) => {
      if (!blockedIds.has(String(item.id)) && blockedIds.has(String(item.parentId))) {
        blockedIds.add(String(item.id));
        changed = true;
      }
    });
  }

  mockDepartments = mockDepartments.filter((item) => !blockedIds.has(String(item.id)));
  mockUsers = mockUsers.map((user) =>
    user.deptId && blockedIds.has(String(user.deptId))
      ? { ...user, deptId: null, deptName: '未分配', updateTime: nowText() }
      : user,
  );
  return createMockResponse(true);
}

export function getMockRoleList(params: RoleQueryParams = {}) {
  const filtered = sortByTimeDesc(
    mockRoles.filter(
      (item) =>
        matchesKeyword([item.roleName], params.roleName) &&
        matchesKeyword([item.roleCode], params.roleCode) &&
        (!params.status || item.status === params.status),
    ),
    (item) => item.updateTime,
  );

  return createMockResponse(paginateMock(filtered, params));
}

export function getMockRoleDetail(id: ApiId) {
  return createMockResponse(findRole(id));
}

export function createMockRole(data: RolePayload) {
  const id = createMockId('role');
  mockRoles.push({
    id,
    roleName: data.roleName,
    roleCode: data.roleCode,
    sortOrder: data.sortOrder ?? mockRoles.length + 1,
    status: data.status ?? 'ENABLED',
    remark: data.remark ?? null,
    permissions: [],
    createTime: nowText(),
    updateTime: nowText(),
  });
  return createMockResponse(id);
}

export function updateMockRole(id: ApiId, data: RolePayload) {
  mockRoles = mockRoles.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          roleName: data.roleName,
          roleCode: data.roleCode,
          sortOrder: data.sortOrder ?? item.sortOrder,
          status: data.status ?? item.status,
          remark: data.remark ?? null,
          updateTime: nowText(),
        }
      : item,
  );
  return createMockResponse(true);
}

export function deleteMockRole(id: ApiId) {
  const target = findRole(id);
  mockRoles = mockRoles.filter((item) => String(item.id) !== String(id));
  mockUsers = mockUsers.map((item) =>
    item.roleIds.includes(target.id)
      ? {
          ...item,
          roleIds: item.roleIds.filter((roleId) => String(roleId) !== String(target.id)),
          roleCodes: item.roleCodes.filter((code) => code !== target.roleCode),
          roleNames: item.roleNames.filter((name) => name !== target.roleName),
          updateTime: nowText(),
        }
      : item,
  );
  return createMockResponse(true);
}

export function getMockUserList(params: UserQueryParams = {}) {
  const filtered = sortByTimeDesc(
    mockUsers.filter(
      (item) =>
        matchesKeyword([item.username], params.username) &&
        matchesKeyword([item.nickname], params.nickname) &&
        (!params.deptId || String(item.deptId) === String(params.deptId)) &&
        (!params.status || item.status === params.status),
    ),
    (item) => item.updateTime,
  );

  return createMockResponse(paginateMock(filtered, params));
}

export function getMockUserDetail(id: ApiId) {
  return createMockResponse(findUser(id));
}

export function createMockUser(data: CreateUserPayload) {
  const dept = data.deptId ? findDept(data.deptId) : undefined;
  const defaultRole = mockRoles.find((item) => item.roleCode === 'agent') ?? mockRoles[0];
  const id = createMockId('user');
  mockUsers.unshift({
    id,
    username: data.username,
    nickname: data.nickname,
    email: data.email ?? null,
    mobile: data.mobile ?? null,
    avatar: data.avatar ?? null,
    deptId: data.deptId ?? null,
    deptName: dept?.deptName ?? '未分配',
    status: data.status ?? 'ENABLED',
    lastLoginTime: null,
    createTime: nowText(),
    updateTime: nowText(),
    jobNo: `EMP${String(mockUsers.length + 1).padStart(4, '0')}`,
    roleIds: [defaultRole.id],
    roleCodes: [defaultRole.roleCode],
    roleNames: [defaultRole.roleName],
  });
  return createMockResponse(id);
}

export function updateMockUser(id: ApiId, data: UpdateUserPayload) {
  const dept = data.deptId ? findDept(data.deptId) : undefined;
  mockUsers = mockUsers.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          nickname: data.nickname,
          email: data.email ?? null,
          mobile: data.mobile ?? null,
          avatar: data.avatar ?? null,
          deptId: data.deptId ?? null,
          deptName: dept?.deptName ?? '未分配',
          status: data.status ?? item.status,
          updateTime: nowText(),
        }
      : item,
  );

  return createMockResponse(true);
}

export function deleteMockUser(id: ApiId) {
  mockUsers = mockUsers.filter((item) => String(item.id) !== String(id));
  return createMockResponse(true);
}

export function getMockUserProfile(username = 'admin') {
  const existing = mockUsers.find((item) => item.username === username);

  if (existing) {
    return cloneMock(existing);
  }

  const dept = mockDepartments.find((item) => item.status === 'ENABLED') ?? mockDepartments[0];
  const role = mockRoles.find((item) => item.roleCode === 'agent') ?? mockRoles[0];
  const time = nowText();

  return {
    id: `virtual-${username}`,
    username,
    nickname: username.includes('.') ? username.split('.')[0] : `${username} 用户`,
    email: `${username.replace(/[^\w.-]/g, '') || 'user'}@example.com`,
    mobile: '13900000000',
    avatar: null,
    deptId: dept?.id ?? null,
    deptName: dept?.deptName ?? '客户成功部',
    status: 'ENABLED' as CommonStatus,
    lastLoginTime: time,
    createTime: time,
    updateTime: time,
    jobNo: `V-${username}`.slice(0, 12).toUpperCase(),
    roleIds: [role.id],
    roleCodes: [role.roleCode],
    roleNames: [role.roleName],
  };
}

export function getMockPermissionsByRole(roleCodes: string[]) {
  if (roleCodes.includes('admin')) {
    return ['*', '*:*:*', ...getMockPermissionCodes()];
  }

  const permissions = new Set<string>();
  roleCodes.forEach((roleCode) => {
    const role = mockRoles.find((item) => item.roleCode === roleCode);
    role?.permissions.forEach((permission) => permissions.add(permission));
  });
  return [...permissions];
}

export function getMockSystemSettings() {
  return createMockResponse(cloneMock(mockSettings));
}

export function updateMockSystemSettings(items: Array<Pick<SystemSettingItem, 'key' | 'value'>>) {
  const updates = new Map(items.map((item) => [item.key, item.value]));
  mockSettings = mockSettings.map((item) =>
    updates.has(item.key)
      ? {
          ...item,
          value: updates.get(item.key) as SystemSettingItem['value'],
        }
      : item,
  );

  return createMockResponse(cloneMock(mockSettings));
}

export function getMockPermissionOverview() {
  return createMockResponse({
    totalUsers: mockUsers.length,
    enabledUsers: mockUsers.filter((item) => item.status === 'ENABLED').length,
    totalRoles: mockRoles.length,
    enabledRoles: mockRoles.filter((item) => item.status === 'ENABLED').length,
    totalDepartments: mockDepartments.length,
    totalPermissions: getMockPermissionCodes().length,
    recentChanges: [
      '运维主管角色新增工单导出权限',
      '知识库管理员开放文档导入按钮',
      '禁用流程治理办访客账号的菜单访问权限',
    ],
  });
}

export function getMockTeamAssetList() {
  return createMockResponse(cloneMock(mockTeamAssets));
}

export function getMockCultureArticleList() {
  return createMockResponse(cloneMock(mockCultureArticles));
}

function findDept(id: ApiId) {
  const record = mockDepartments.find((item) => String(item.id) === String(id));

  if (!record) {
    throw new Error(`Department ${id} not found`);
  }

  return cloneMock(record);
}

function findRole(id: ApiId) {
  const record = mockRoles.find((item) => String(item.id) === String(id));

  if (!record) {
    throw new Error(`Role ${id} not found`);
  }

  return cloneMock(record);
}

function findUser(id: ApiId) {
  const record = mockUsers.find((item) => String(item.id) === String(id));

  if (!record) {
    throw new Error(`User ${id} not found`);
  }

  return cloneMock(record);
}
