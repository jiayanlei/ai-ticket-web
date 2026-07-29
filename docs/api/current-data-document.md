# 当前前端数据文档

> 生成时间：2026-07-28  
> 范围：基于当前 `src/api`、`src/mock`、页面调用关系和已有 `docs/api/module-api-requirements.md` 梳理。本文档用于后端开始接入时对齐数据契约，不包含数据库设计和后端分层建议。

## 1. 当前数据接入现状

### 1.1 技术与开关

- 前端技术栈：Vue 3 + TypeScript + Pinia + Vue Router + Ant Design Vue + Axios。
- 请求封装：`src/utils/http.ts`。
- Mock 开关：`src/config/env.ts` 中 `envConfig.useMock`，读取 `VITE_USE_MOCK` 或 `VITE_APP_USE_MOCK`。
- API 前缀：默认 `VITE_APP_API_PREFIX=/api`。
- 真实接口基础路径：
  - `useProxy=true` 时：baseURL 为 `/api`。
  - `useProxy=false` 时：baseURL 为 `VITE_APP_BASE_API + /api`。

### 1.2 通用响应结构

前端 `http` 支持两种响应：

```ts
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}
```

- 如果后端返回 `ApiResponse`，只有 `code === 200` 会被解包为 `data`。
- 如果后端直接返回业务对象，前端也能直接使用。
- 建议后端统一返回 `ApiResponse<T>`，便于错误处理一致。
- `code === 401` 时前端会清理登录态。

### 1.3 分页结构

```ts
interface PageQuery {
  pageNum?: number;
  pageSize?: number;
}

interface PageResult<T> {
  records: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}
```

当前分页字段使用 `pageNum/pageSize/records/total`，后端优先保持该结构，可减少前端改动。

### 1.4 ID 与时间

- `ApiId = string | number`，当前 mock 大量使用字符串 ID，如 `user-10001`、`role-admin`、`wo-xxx`。
- 时间字段目前是字符串，展示格式以 `YYYY-MM-DD HH:mm:ss` 为主。
- 大整数兼容：前端会把 16 位以上整数解析为字符串，后端若使用雪花 ID，建议直接返回字符串。

## 2. 已封装接口总览

| 模块 | 文件 | 当前状态 | 后端路径 |
| --- | --- | --- | --- |
| 登录鉴权 | `src/api/auth.ts` | 已有真实接口分支 | `/auth/login`、`/auth/logout`、`/auth/me` |
| 工单列表/回收站 | `src/api/workOrder.ts` | 已有真实接口分支 | `/tickets`、`/tickets/recycle-bin`、`/tickets/{id}` |
| 工单全生命周期 | `src/api/ticket.ts` | 目前只走 mock | 暂未接真实 `http` |
| 通用业务记录 | `src/api/business.ts` | 已有真实接口分支 | `/business/records` |
| 用户 | `src/api/user.ts` | 已有真实接口分支 | `/system/users` |
| 角色 | `src/api/role.ts` | 已有真实接口分支 | `/system/roles` |
| 部门 | `src/api/dept.ts` | 已有真实接口分支 | `/system/depts` |
| 菜单/权限 | `src/api/menu.ts` | 已有真实接口分支 | `/system/menus` |
| 系统设置/概览/资产/文化 | `src/api/system.ts` | 已有真实接口分支 | `/system/settings` 等 |
| 租户 | `src/api/tenant.ts` | 已有真实接口分支 | `/tenants` |
| 知识库 | `src/api/knowledge.ts` | 已有真实接口分支 | `/knowledge/*` |
| 文档中心 | `src/api/document.ts` | 已有真实接口分支 | `/documents/*` |
| 文件上传下载 | `src/api/file.ts` | 已有真实接口分支 | `/files/upload` 或自定义 URL |
| AI 助手/Codex 控制台 | `src/api/aiAgent.ts` | 已有真实接口分支 | `/ai-agent/*` |
| 会话记录 | `src/api/chat.ts` | 已有真实接口分支，类型来自 mock | `/ai-agent/conversations` |

## 3. 登录鉴权数据

### 3.1 登录

`POST /auth/login`

请求：

```ts
interface LoginParams {
  username: string;
  password: string;
}
```

返回前端归一化后：

```ts
interface LoginResult {
  id: ApiId;
  userId: ApiId;
  username: string;
  nickname: string;
  tokenName: string;
  tokenValue: string;
  tokenPrefix: string;
  token: string;
  roles: string[];
  permissions: string[];
  email?: string | null;
  mobile?: string | null;
  deptId?: ApiId | null;
  deptName?: string | null;
  status?: 'ENABLED' | 'DISABLED';
  jobNo?: string;
  menus?: MenuItem[];
}
```

后端可返回 `LoginVO`，前端会兼容：

- `tokenName` 默认 `Authorization`
- `tokenPrefix` 默认 `Bearer`
- `token` 使用 `tokenValue`
- `roles/permissions` 缺省为 `[]`

### 3.2 当前用户

`GET /auth/me`

返回同登录结果。

### 3.3 登出

`POST /auth/logout`

返回 `void` 或 `ApiResponse<void>`。

## 4. 工单数据

当前工单分成两套前端模型：

- `WorkOrderItem`：列表、待办、回收站、AI 结果页使用。
- `LifecycleTicketDetail`：新建工单页、服务工单详情侧栏、流程流转使用。

这两套模型字段有重叠但不完全一致，后端接入时建议先保证列表模型，再对齐生命周期接口。

### 4.1 工单列表模型

```ts
type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type TicketStatus = 'NEW' | 'PROCESSING' | 'PENDING' | 'RESOLVED' | 'CLOSED';

interface WorkOrderItem {
  id: ApiId;
  ticketNo: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  lifecycleStatus?: LifecycleTicketStatus;
  source: string | null;
  category: string | null;
  applicantId: ApiId | null;
  applicantName: string | null;
  assigneeId: ApiId | null;
  assigneeName: string | null;
  dueTime: string | null;
  resolvedTime: string | null;
  closedTime: string | null;
  aiSummary: string | null;
  aiRiskLevel: string | null;
  createTime: string;
  updateTime: string;
}
```

列表查询：

`GET /tickets`

参数：

```ts
interface WorkOrderQueryParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  status?: TicketStatus;
  lifecycleStatus?: LifecycleTicketStatus;
  priority?: TicketPriority;
  category?: string;
  assigneeId?: ApiId;
  applicantId?: ApiId;
  slaRisk?: boolean;
}
```

返回：`PageResult<WorkOrderItem>`

其他接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `POST` | `/tickets` | `CreateWorkOrderPayload` | `ApiId` |
| `GET` | `/tickets/recycle-bin` | `WorkOrderQueryParams` | `PageResult<WorkOrderItem>` |
| `GET` | `/tickets/{id}` | - | `WorkOrderItem` |
| `PUT` | `/tickets/{id}` | `UpdateWorkOrderPayload` | `void` |
| `DELETE` | `/tickets/{id}` | - | `void` |
| `PATCH` | `/tickets/{id}/restore` | - | `void` |

创建请求：

```ts
interface CreateWorkOrderPayload {
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
```

更新请求：

```ts
interface UpdateWorkOrderPayload {
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
```

### 4.2 工单生命周期模型

```ts
type LifecycleTicketStatus =
  | 'DRAFT'
  | 'PENDING_ACCEPT'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'PENDING'
  | 'WAIT_CONFIRM'
  | 'COMPLETED'
  | 'CLOSED';

type LifecycleTicketPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
type LifecycleTicketSource =
  | 'SMS'
  | 'EMAIL'
  | 'PHONE'
  | 'ONLINE'
  | 'OTHER'
  | 'WEB'
  | 'APP'
  | 'WECHAT'
  | 'MANUAL';
```

提交/草稿请求：

```ts
interface LifecycleTicketPayload {
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
```

详情：

```ts
interface LifecycleTicketDetail extends LifecycleTicketPayload {
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
```

相关子数据：

```ts
interface TicketAttachment {
  id: ApiId;
  name: string;
  size: string;
  uploader: string;
  uploadTime: string;
}

interface TicketFlowRecord {
  id: ApiId;
  title: string;
  operator: string;
  description: string;
  status: LifecycleTicketStatus;
  time: string;
}

interface TicketComment {
  id: ApiId;
  userName: string;
  content: string;
  time: string;
}

interface TicketOperationLog {
  id: ApiId;
  operator: string;
  action: string;
  beforeStatus: LifecycleTicketStatus | '-';
  afterStatus: LifecycleTicketStatus;
  time: string;
}
```

AI 分析：

```ts
interface TicketAiAnalysis {
  category: string;
  riskLevel: string;
  recommendedDepartment: string;
  recommendedHandler: string;
  estimatedDuration: string;
  similarTickets: Array<{
    ticketNo: string;
    title: string;
    status: string;
    similarity: number;
  }>;
  suggestions: string[];
  summary: string;
}
```

当前生命周期方法只连 mock，尚未定义真实 URL：

| 前端方法 | 含义 | 当前返回 |
| --- | --- | --- |
| `createTicket` | 创建草稿 | `LifecycleTicketDetail` |
| `saveTicketDraft` | 保存草稿 | `LifecycleTicketDetail` |
| `submitTicket` | 提交待受理 | `LifecycleTicketDetail` |
| `acceptTicket` | 受理 | `{ id, status, acceptedTime }` |
| `startProcessTicket` | 开始处理 | `{ id, status, startProcessTime }` |
| `finishProcessTicket` | 处理完成，待确认 | `{ id, status, finishTime }` |
| `confirmTicket` | 用户确认完成 | `{ id, status, completedTime, processingDuration }` |
| `reopenTicket` | 重新打开 | `{ id, status }` |
| `suspendTicket` | 挂起 | `{ id, status }` |
| `resumeTicket` | 恢复处理 | `{ id, status }` |
| `transferTicket` | 转派 | `{ id, status, assigneeId, assigneeName }` |
| `getTicketDetail` | 生命周期详情 | `LifecycleTicketDetail` |
| `getTicketFlowRecords` | 流程记录 | `TicketFlowRecord[]` |
| `getTicketComments` | 评论 | `TicketComment[]` |
| `addTicketComment` | 新增评论 | `TicketComment` |
| `getTicketAttachments` | 附件 | `TicketAttachment[]` |
| `getTicketOperationLogs` | 操作日志 | `TicketOperationLog[]` |
| `analyzeTicketByAi` | AI 预分析 | `TicketAiAnalysis` |

后端接入疑点，需要确认：

- `TicketPriority` 与 `LifecycleTicketPriority` 是否合并：当前一个是 `LOW/NORMAL/HIGH/URGENT`，一个是 `NORMAL/IMPORTANT/URGENT`。
- `TicketStatus` 与 `LifecycleTicketStatus` 是否合并或映射。
- 生命周期真实路径命名，例如 `/tickets/{id}/accept`、`/tickets/{id}/start-process` 是否由后端统一定。
- 附件字段 `size` 当前是展示字符串，上传接口返回的 `size` 是 number，两者是否统一。

## 5. 通用业务记录数据

该模型目前承载很多还未细化后端接口的页面，是前端从 mock 向真实后端迁移的“过渡通用表”。

使用页面包括：

- 客户：`/customers/360`、`/customers/journey`
- 服务：`/service/calls`、`/service/live-chat`
- 全渠道：`/omnichannel/email`、`/omnichannel/inbox`
- 分析：`/analytics/risk`、`/analytics/alerts`、`/analytics/monitoring`、`/analytics/sla`、`/analytics/cockpit`、部分 `operations/performance`
- 系统：`/system/audit`、`/system/management`、`/system/open-platform`、`/system/permissions`
- AI：`/ai/models`

枚举：

```ts
type BusinessRecordStatus = '待处理' | '处理中' | '待审核' | '已完成' | '已暂停' | '已关闭';
type BusinessRecordPriority = '低' | '中' | '高' | '紧急';
```

模型：

```ts
interface BusinessRecord {
  id: ApiId;
  module: string;
  title: string;
  code: string;
  owner: string;
  customer: string;
  channel: string;
  status: BusinessRecordStatus;
  priority: BusinessRecordPriority;
  metric: string;
  risk: string;
  description: string;
  aiSuggestion: string;
  tags: string[];
  timeline: Array<{
    time: string;
    action: string;
    operator: string;
    content: string;
  }>;
  updateTime: string;
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `GET` | `/business/records` | `module`、`keyword`、`status`、`pageNum`、`pageSize` | `PageResult<BusinessRecord>` |
| `GET` | `/business/records/{id}` | - | `BusinessRecord` |
| `POST` | `/business/records` | `BusinessRecordPayload` | `ApiId` |
| `PUT` | `/business/records/{id}` | `BusinessRecordPayload` | `void` |
| `PATCH` | `/business/records/{id}/status` | `{ status }` | `void` |
| `DELETE` | `/business/records/{id}` | - | `void` |

请求体：

```ts
type BusinessRecordPayload = Pick<
  BusinessRecord,
  | 'module'
  | 'title'
  | 'owner'
  | 'customer'
  | 'channel'
  | 'status'
  | 'priority'
  | 'metric'
  | 'risk'
  | 'description'
  | 'aiSuggestion'
> & {
  tags?: string[];
};
```

当前 mock 的 `module` 值主要包括：

- `customers-360`
- `customers-journey`
- `service-calls`
- `service-live-chat`
- `omnichannel-email`
- `omnichannel-inbox`
- `analytics-risk`
- `analytics-alerts`
- `analytics-monitoring`
- `analytics-sla`
- `analytics-cockpit`
- `operations-performance`
- `system-audit`
- `system-management`
- `system-open-platform`
- `system-permissions`
- `ai-models`

注意：这些页面虽然能用通用记录跑通，但业务字段明显不够细。后端如果要分模块精细化，建议逐页替换，不要一次性推翻通用接口。

## 6. 系统管理数据

### 6.1 用户

枚举：

```ts
type CommonStatus = 'ENABLED' | 'DISABLED';
```

模型：

```ts
interface UserItem {
  id: ApiId;
  username: string;
  nickname: string;
  email: string | null;
  mobile: string | null;
  avatar: string | null;
  deptId: ApiId | null;
  status: CommonStatus;
  lastLoginTime: string | null;
  createTime: string;
  updateTime: string;
  jobNo?: string;
  deptName?: string;
  roleCodes?: string[];
  roleNames?: string[];
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `GET` | `/system/users` | `username`、`nickname`、`deptId`、`status`、`pageNum`、`pageSize` | `PageResult<UserItem>` |
| `POST` | `/system/users` | `CreateUserPayload` | `ApiId` |
| `GET` | `/system/users/{id}` | - | `UserItem` |
| `PUT` | `/system/users/{id}` | `UpdateUserPayload` | `void` |
| `DELETE` | `/system/users/{id}` | - | `void` |

创建：

```ts
interface CreateUserPayload {
  username: string;
  password: string;
  nickname: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  deptId?: ApiId;
  status?: CommonStatus;
}
```

更新：

```ts
interface UpdateUserPayload {
  nickname: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  deptId?: ApiId;
  status?: CommonStatus;
}
```

### 6.2 角色

```ts
interface RoleItem {
  id: ApiId;
  roleName: string;
  roleCode: string;
  sortOrder: number;
  status: CommonStatus;
  remark: string | null;
  createTime: string;
  updateTime: string;
}

interface RolePayload {
  roleName: string;
  roleCode: string;
  sortOrder?: number;
  status?: CommonStatus;
  remark?: string;
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `GET` | `/system/roles` | `roleName`、`roleCode`、`status`、`pageNum`、`pageSize` | `PageResult<RoleItem>` |
| `POST` | `/system/roles` | `RolePayload` | `ApiId` |
| `GET` | `/system/roles/{id}` | - | `RoleItem` |
| `PUT` | `/system/roles/{id}` | `RolePayload` | `void` |
| `DELETE` | `/system/roles/{id}` | - | `void` |

### 6.3 部门

```ts
interface DeptItem {
  id: ApiId;
  parentId: ApiId;
  deptName: string;
  deptCode: string;
  leader: string | null;
  phone: string | null;
  email: string | null;
  sortOrder: number;
  status: CommonStatus;
  createTime: string;
  updateTime: string;
}

interface DeptPayload {
  parentId?: ApiId;
  deptName: string;
  deptCode: string;
  leader?: string;
  phone?: string;
  email?: string;
  sortOrder?: number;
  status?: CommonStatus;
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `GET` | `/system/depts` | `deptName`、`deptCode`、`status` | `DeptItem[]` |
| `POST` | `/system/depts` | `DeptPayload` | `ApiId` |
| `GET` | `/system/depts/{id}` | - | `DeptItem` |
| `PUT` | `/system/depts/{id}` | `DeptPayload` | `void` |
| `DELETE` | `/system/depts/{id}` | - | `void` |

### 6.4 菜单/权限

```ts
type MenuType = 'DIR' | 'MENU' | 'BUTTON';

interface MenuItem {
  id: ApiId;
  parentId: ApiId;
  menuName: string;
  i18nKey?: string | null;
  menuType: MenuType;
  path: string | null;
  component: string | null;
  perms: string | null;
  icon: string | null;
  sortOrder: number;
  visible: boolean;
  status: CommonStatus;
  createTime: string;
  updateTime: string;
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `GET` | `/system/menus` | `menuName`、`menuType`、`status` | `MenuItem[]` |
| `POST` | `/system/menus` | `MenuPayload` | `ApiId` |
| `GET` | `/system/menus/{id}` | - | `MenuItem` |
| `PUT` | `/system/menus/{id}` | `MenuPayload` | `void` |
| `DELETE` | `/system/menus/{id}` | - | `void` |

菜单特别注意：

- `menuType='DIR'` 通常用于一级/分组目录。
- `menuType='MENU'` 用于页面路由。
- `menuType='BUTTON'` 用于按钮权限，`path/component` 可为空。
- 动态路由依赖 `path`、`component`、`visible`、`status`。
- 权限码来自 `perms`，登录用户的 `permissions` 也会参与按钮/菜单控制。

## 7. 系统设置、权限概览、团队资产、企业文化

### 7.1 系统设置

```ts
interface SystemSettingItem {
  key: string;
  label: string;
  value: string | number | boolean;
  description: string;
  category: 'general' | 'security' | 'ai' | 'integration';
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `GET` | `/system/settings` | - | `SystemSettingItem[]` |
| `PUT` | `/system/settings` | `Array<{ key: string; value: string \| number \| boolean }>` | `SystemSettingItem[]` |

### 7.2 权限概览

```ts
interface PermissionOverview {
  totalUsers: number;
  enabledUsers: number;
  totalRoles: number;
  enabledRoles: number;
  totalDepartments: number;
  totalPermissions: number;
  recentChanges: string[];
}
```

接口：`GET /system/permission/overview`

### 7.3 团队资产

```ts
interface TeamAssetItem {
  id: ApiId;
  name: string;
  type: 'template' | 'manual' | 'prompt' | 'script';
  owner: string;
  department: string;
  status: 'online' | 'draft' | 'archived';
  updateTime: string;
  usageCount: number;
}
```

接口：`GET /knowledge/assets/team`

### 7.4 企业文化

```ts
interface CultureArticleItem {
  id: ApiId;
  title: string;
  category: string;
  audience: string;
  owner: string;
  publishTime: string;
  summary: string;
}
```

接口：`GET /culture/articles`

## 8. 租户数据

枚举：

```ts
type TenantStatus = 'DRAFT' | 'INITIALIZING' | 'ENABLED' | 'FROZEN' | 'DISABLED' | 'ARCHIVED';
type TenantServiceStatus = 'NORMAL' | 'WARNING' | 'SUSPENDED';
```

列表项：

```ts
interface TenantItem {
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
```

详情：

```ts
interface TenantDetail extends TenantItem {
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
```

创建/更新：

```ts
interface TenantPayload {
  tenantName: string;
  tenantCode: string;
  administrator: string;
  administratorEmail: string;
  defaultOrganization: string;
  enabledModules: string[];
  remark?: string;
}
```

子数据：

```ts
interface TenantOrganization {
  id: ApiId;
  organizationName: string;
  leader: string;
  memberCount: number;
  serviceScope: string;
}

interface TenantMember {
  id: ApiId;
  nickname: string;
  roleName: string;
  department: string;
  accountStatus: 'ACTIVE' | 'INVITED' | 'DISABLED';
  lastActiveTime: string;
}

interface TenantResourceUsage {
  key: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
}

interface TenantAuditLog {
  id: ApiId;
  action: string;
  operator: string;
  target: string;
  result: 'SUCCESS' | 'WARNING';
  operateTime: string;
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `GET` | `/tenants` | `keyword`、`status`、`serviceStatus`、`pageNum`、`pageSize` | `PageResult<TenantItem>` |
| `GET` | `/tenants/{id}` | - | `TenantDetail` |
| `POST` | `/tenants` | `TenantPayload` | `ApiId` |
| `PUT` | `/tenants/{id}` | `TenantPayload` | `void` |
| `PATCH` | `/tenants/{id}/status` | `{ status }` | `void` |
| `GET` | `/tenants/{id}/members` | - | `TenantMember[]` |
| `GET` | `/tenants/{id}/organizations` | - | `TenantOrganization[]` |
| `GET` | `/tenants/{id}/resources` | - | `TenantResourceUsage[]` |
| `GET` | `/tenants/{id}/audit-logs` | - | `TenantAuditLog[]` |

## 9. 知识库数据

### 9.1 分类树

```ts
interface KnowledgeCategoryNode {
  id: ApiId;
  parentId: ApiId | null;
  title: string;
  sort: number;
  documentCount?: number;
  children?: KnowledgeCategoryNode[];
}
```

接口：`GET /knowledge/categories/tree`

### 9.2 知识文档

```ts
type KnowledgeDocumentStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE';

interface KnowledgeDocumentItem {
  id: ApiId;
  categoryId: ApiId;
  categoryName: string;
  title: string;
  summary: string;
  content: string;
  status: KnowledgeDocumentStatus;
  tags: string[];
  version: string;
  owner: string;
  viewCount: number;
  createTime: string;
  updateTime: string;
}

interface KnowledgeDocumentPayload {
  categoryId: ApiId;
  title: string;
  summary: string;
  content: string;
  status: KnowledgeDocumentStatus;
  tags?: string[];
  owner?: string;
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `GET` | `/knowledge/documents` | `keyword`、`categoryId`、`status`、`pageNum`、`pageSize` | `PageResult<KnowledgeDocumentItem>` |
| `GET` | `/knowledge/documents/{id}` | - | `KnowledgeDocumentItem` |
| `POST` | `/knowledge/documents` | `KnowledgeDocumentPayload` | `ApiId` |
| `PUT` | `/knowledge/documents/{id}` | `KnowledgeDocumentPayload` | `void` |
| `DELETE` | `/knowledge/documents/{id}` | - | `void` |

### 9.3 知识图谱/画布

```ts
type KnowledgeCanvasNodeType = 'category' | 'topic' | 'question' | 'summary';
type KnowledgeCanvasProcessStatus = 'published' | 'draft' | 'offline';

interface KnowledgeCanvasNode {
  id: ApiId;
  parentId?: ApiId | null;
  title: string;
  type: KnowledgeCanvasNodeType;
  isSummary?: boolean;
  relationType?: 'summary';
  summarySourceNodeIds?: ApiId[];
  summarySourceNodes?: Array<Pick<KnowledgeCanvasNode, 'id' | 'title' | 'type'>>;
  sort: number;
  status: 'enabled' | 'disabled';
  processStatus?: KnowledgeCanvasProcessStatus;
  processStatusLabel?: string;
  summary: string;
  content: string;
  script: string;
  tip: string;
  help: string;
  policy: string;
  tags: string[];
  links: Array<{ name: string; url: string }>;
  versions: Array<{
    version: string;
    updatedAt: string;
    updatedBy?: string;
    status?: KnowledgeCanvasProcessStatus;
    remark?: string;
  }>;
  updatedAt: string;
  updatedBy: string;
  children?: KnowledgeCanvasNode[];
  summaryGroups?: KnowledgeCanvasNode[];
}
```

接口：

| 方法 | 路径 | 返回 |
| --- | --- | --- |
| `GET` | `/knowledge/canvas/tree` | `KnowledgeCanvasNode[]` |
| `GET` | `/knowledge/canvas/total` | `{ total: number }` |
| `GET` | `/knowledge/canvas/nodes/{id}` | `KnowledgeCanvasNode` |

## 10. 文档中心与文件

### 10.1 文档中心

```ts
interface DocumentCenterItem {
  id: string;
  fileName: string;
  category: string;
  owner: string;
  size: string;
  format: string;
  parseStatus: 'UPLOADING' | 'PARSING' | 'SUCCESS' | 'FAILED';
  updateTime: string;
  summary: string;
}

interface DocumentDirectoryItem {
  key: string;
  title: string;
  description: string;
}

interface CreateDocumentCenterPayload {
  fileName: string;
  category: string;
  owner?: string;
  size?: string;
  format?: string;
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `GET` | `/documents/records` | - | `DocumentCenterItem[]` |
| `GET` | `/documents/directories` | - | `DocumentDirectoryItem[]` |
| `POST` | `/documents/records` | `CreateDocumentCenterPayload` | `DocumentCenterItem` |
| `DELETE` | `/documents/records/{id}` | - | `void` |

### 10.2 文件上传下载

上传：

`POST /files/upload`

请求：`multipart/form-data`，默认字段名 `file`，可通过前端 `options.fieldName` 覆盖。

返回：

```ts
interface UploadFileResult {
  id?: ApiId;
  url?: string;
  fileName?: string;
  originalName?: string;
  size?: number;
  contentType?: string;
}
```

下载：

`GET {url}`，前端按 `Blob` 接收。

## 11. AI 助手/Codex 控制台数据

枚举：

```ts
type AiAgentTaskType =
  | 'FRONTEND_ERROR'
  | 'BACKEND_API'
  | 'BACKEND_LOG'
  | 'SQL_GENERATE'
  | 'FRONTEND_DEPLOY'
  | 'BACKEND_DEPLOY'
  | 'GIT_CHECK'
  | 'CHANGE_PLAN'
  | 'NORMAL_CHAT';

type AiAgentRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type AiAgentFileOperation = 'CHECK' | 'CREATE' | 'UPDATE' | 'DELETE';
type AiAgentLogLevel = 'info' | 'success' | 'warning' | 'error';
type AiAgentMessageRole = 'user' | 'assistant' | 'system' | 'log' | 'warning' | 'success' | 'error';
```

模型：

```ts
interface AiAgentProjectStatus {
  frontendProject: string;
  backendProject: string;
  branch: string;
  environment: string;
  env?: string;
  hasUncommittedChanges: boolean;
  latestCommit: string;
  lastCommit?: string;
  latestCommitTime?: string;
}

interface AiAgentMessage {
  id?: string | number;
  role?: AiAgentMessageRole;
  content: string;
  time?: string;
}

interface AiAgentLog {
  id?: string | number;
  level: AiAgentLogLevel;
  content: string;
  time?: string;
}
```

对话请求：

```ts
interface AiAgentChatPayload {
  sessionId: string;
  message: string;
  taskType: AiAgentTaskType;
}
```

对话返回：

```ts
interface AiAgentChatResult {
  sessionId?: string;
  message?: AiAgentMessage;
  reply?: string;
  content?: string;
  plan?: {
    taskType: string;
    riskLevel: AiAgentRiskLevel;
    scope: string[];
    affectedFiles: Array<{
      path: string;
      operation: AiAgentFileOperation;
      filePath?: string;
      changeType?: AiAgentFileOperation;
    }>;
    steps: string[];
    needConfirm: boolean;
  };
  logs?: AiAgentLog[];
}
```

接口：

| 方法 | 路径 | 请求 | 返回 |
| --- | --- | --- | --- |
| `POST` | `/ai-agent/chat` | `AiAgentChatPayload` | `AiAgentChatResult` |
| `GET` | `/ai-agent/project/status` | - | `AiAgentProjectStatus` |
| `GET` | `/ai-agent/logs/recent` | - | `AiAgentLog[]` 或 `{ logs: string[] \| AiAgentLog[] }` |
| `POST` | `/ai-agent/action/confirm` | `{ sessionId, actionType, confirm }` | `AiAgentConfirmResult` |
| `GET` | `/ai-agent/conversations` | - | `ConversationRecordItem[]` |

会话记录当前类型来自 mock：

```ts
interface ConversationRecordItem {
  id: string;
  sessionId: string;
  title: string;
  taskType: AiAgentTaskType;
  userName: string;
  lastMessage: string;
  status: 'processing' | 'completed' | 'failed';
  messageCount: number;
  updatedAt: string;
}
```

## 12. 页面内静态数据较多的模块

以下页面当前存在大量页面内 `ref([...])` 或 `reactive({...})` 数据，还没有对应 `src/api` 封装。后端接入时建议按业务优先级逐个抽离，不建议一次全量改造。

| 页面 | 当前数据特点 | 后端建议 |
| --- | --- | --- |
| `/dashboard/screen` | 大屏 `mockDashboardData`，包含核心指标、队列、趋势、风险、SLA、分布图，且有定时随机刷新 | 单独设计大屏聚合接口，先返回整屏 DTO |
| `/dashboard/workbench` | 工作台待办/关注任务等页面内数据 | 可先复用工单列表，再补工作台汇总接口 |
| `/analytics/bi` | 报表、导出任务、筛选器、订阅配置多为静态 | 后端需单独报表模型，不建议塞进 `BusinessRecord` |
| `/analytics/operations` | 查询条件、指标和图表偏展示 | 需要运营指标聚合接口 |
| `/ai/prompts` | Prompt 资产、问题卡片、评估指标为静态 | 需要 Prompt 资产、版本、测试运行接口 |
| `/ai/workflows` | 工作流节点/边/发布配置为静态 | 需要工作流定义、节点配置、运行记录接口 |
| `/omnichannel/sms` | 短信任务、模板、发送计划为静态 | 需要短信任务与模板接口 |
| `/operations/agents` | 坐席列表、技能、派单表单为静态 | 需要坐席、技能组、状态变更接口 |
| `/operations/scheduling` | 排班、班次、分组、请假、轮转为静态 | 需要排班域模型，建议单独设计 |
| `/operations/quality` | 质检样本和复核表单为静态 | 需要质检样本、评分、申诉接口 |
| `/operations/training` | 培训任务、课程、进度为静态 | 需要课程、任务、测验结果接口 |
| `/ai-ticket-os` | 配置化导航/模块演示数据 | 偏产品外壳，可等核心业务稳定后接 |

## 13. 当前路由与数据来源

| 路由/页面 | 主要数据来源 |
| --- | --- |
| `/auth/login` | `authApi` |
| `/dashboard/todo` | `workOrderApi` |
| `/dashboard/screen` | 页面内静态大屏数据 |
| `/ticket/create` | `ticketApi` mock-only 生命周期数据 |
| `/ticket/list` | `workOrderApi` + 少量 `ticketApi` 子数据 |
| `/ticket/trash` | `workOrderApi` |
| `/service/tickets` | `workOrderApi` + `ticketApi` mock-only 子数据 |
| `/service/calls` | `businessApi` + 页面内队列数据 |
| `/service/live-chat` | `businessApi` |
| `/omnichannel/email` | `businessApi` |
| `/omnichannel/inbox` | `businessApi` |
| `/omnichannel/sms` | 页面内静态短信任务数据 |
| `/customers/360` | `businessApi` |
| `/customers/journey` | `businessApi` |
| `/knowledge/base` | `knowledgeApi` |
| `/knowledge/manage` | `knowledgeApi` |
| `/knowledge/documents` | `documentApi` + `fileApi` |
| `/knowledge/assets/team` | `systemApi.getTeamAssetListApi` |
| `/culture/company` | `systemApi.getCultureArticleListApi` |
| `/ai/overview` | `workOrderApi` |
| `/ai/result` | `workOrderApi` |
| `/ai/models` | `businessApi` |
| `/ai/prompts` | 页面内静态 Prompt 数据 |
| `/ai/workflows` | 页面内静态工作流数据 |
| `/analytics/risk` | `businessApi` |
| `/analytics/alerts` | `businessApi` |
| `/analytics/monitoring` | `businessApi` |
| `/analytics/sla` | `businessApi` |
| `/analytics/cockpit` | `businessApi` + 页面内指标 |
| `/analytics/bi` | 页面内静态 BI 数据 |
| `/analytics/operations` | 页面内静态运营指标 |
| `/operations/performance` | `businessApi` + 页面内指标 |
| `/operations/agents` | 页面内静态坐席数据 |
| `/operations/scheduling` | 页面内静态排班数据 |
| `/operations/quality` | 页面内静态质检数据 |
| `/operations/training` | 页面内静态培训数据 |
| `/system/users` | `userApi` + `deptApi` |
| `/system/roles` | `roleApi` |
| `/system/depts` | `deptApi` |
| `/system/menus` | `menuApi` |
| `/system/permission` | `menuApi` + `systemApi.getPermissionOverviewApi` |
| `/system/settings` | `systemApi` |
| `/system/tenants` | `tenantApi` |
| `/system/audit` | `businessApi` |
| `/system/management` | `businessApi` |
| `/system/open-platform` | `businessApi` |
| `/system/permissions` | `businessApi` |
| `/console/codex` | `aiAgentApi` |
| `/conversation/records` | `chatApi` |

## 14. 后端优先接入建议

按当前前端依赖和业务闭环，建议顺序：

1. 登录鉴权、当前用户、菜单权限：`auth` + `menu`。
2. 工单列表、详情、创建、更新、删除、回收站：`workOrder`。
3. 工单生命周期动作：补齐 `ticket.ts` 真实接口，统一状态/优先级。
4. 系统基础数据：用户、角色、部门、设置。
5. 租户中心：租户列表、详情、成员、组织、资源、审计。
6. 知识库和文档中心：分类树、文档、图谱、上传。
7. 通用业务记录：让目前依赖 `businessApi` 的页面先从 mock 切到真实数据。
8. 再逐步拆出短信、排班、质检、培训、BI、大屏等独立模型。

## 15. 需要你确认的关键疑点

这些点不确认就直接改后端/前端，后面容易返工：

1. 工单状态是否统一成一套枚举：`TicketStatus` 和 `LifecycleTicketStatus` 当前重复。
2. 工单优先级是否统一：`LOW/NORMAL/HIGH/URGENT` 与 `NORMAL/IMPORTANT/URGENT` 当前重复。
3. 后端是否接受中文枚举：`BusinessRecordStatus`、`BusinessRecordPriority` 当前是中文值。
4. 通用业务记录是否只是临时过渡：如果后端已有明确客户、通话、会话、告警模型，应逐页替换。
5. 菜单是否由后端完全驱动：如果是，`component` 字段必须匹配前端 `src/views` 下的组件路径。
6. 时间格式是否统一为 `YYYY-MM-DD HH:mm:ss`，还是后端返回 ISO 后前端格式化。
7. 文件大小是否统一：文档中心是展示字符串，上传结果是字节数 number。
8. 大屏和分析类页面是否先做聚合 DTO，还是逐个指标拆接口。

