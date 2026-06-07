import type { ApiId, PageQuery } from '@/api/types';
import type {
  KnowledgeCanvasNode,
  KnowledgeCanvasProcessStatus,
  KnowledgeCategoryNode,
  KnowledgeDocumentItem,
  KnowledgeDocumentPayload,
  KnowledgeDocumentQueryParams,
  KnowledgeDocumentStatus,
} from '@/api/knowledge';
import { cloneMock, createMockId, createMockResponse, matchesKeyword, nowText, paginateMock, sortByTimeDesc } from '@/mock/core';

const categoriesSeed: KnowledgeCategoryNode[] = [
  {
    id: 'category-root',
    parentId: null,
    title: '企业知识中台',
    sort: 1,
    children: [
      {
        id: 'category-policy',
        parentId: 'category-root',
        title: '制度文档',
        sort: 1,
        children: [
          { id: 'category-policy-process', parentId: 'category-policy', title: '流程规范', sort: 1 },
          { id: 'category-policy-benefit', parentId: 'category-policy', title: '福利政策', sort: 2 },
          { id: 'category-policy-staff', parentId: 'category-policy', title: '员工手册', sort: 3 },
        ],
      },
      {
        id: 'category-ticket',
        parentId: 'category-root',
        title: '工单运营',
        sort: 2,
        children: [
          { id: 'category-ticket-sla', parentId: 'category-ticket', title: 'SLA 规范', sort: 1 },
          { id: 'category-ticket-upgrade', parentId: 'category-ticket', title: '升级流转', sort: 2 },
          { id: 'category-ticket-speech', parentId: 'category-ticket', title: '标准话术', sort: 3 },
        ],
      },
      {
        id: 'category-project',
        parentId: 'category-root',
        title: '项目文档',
        sort: 3,
        children: [
          { id: 'category-project-ai', parentId: 'category-project', title: 'AI 工单平台', sort: 1 },
          { id: 'category-project-api', parentId: 'category-project', title: '接口约定', sort: 2 },
          { id: 'category-project-release', parentId: 'category-project', title: '发布手册', sort: 3 },
        ],
      },
    ],
  },
];

let documentsSeed: KnowledgeDocumentItem[] = [
  {
    id: 'kb-1',
    categoryId: 'category-policy-process',
    categoryName: '流程规范',
    title: '高优工单升级与值班联动规范',
    summary: '明确高优和紧急工单的升级时点、通知对象与闭环要求。',
    content: '1. 工单命中高优规则后，15 分钟内必须确认责任人。\n2. 紧急工单需同步值班经理、平台运维部和知识运营部。\n3. 关闭前需补齐处理摘要、截图和回访结果。',
    status: 'PUBLISHED',
    tags: ['工单', '升级', '流程规范'],
    version: 'v1.6',
    owner: '陈沐阳',
    viewCount: 528,
    createTime: '2026-03-12 09:00:00',
    updateTime: '2026-06-05 11:30:00',
  },
  {
    id: 'kb-2',
    categoryId: 'category-policy-benefit',
    categoryName: '福利政策',
    title: '客服轮班补贴与加班申请说明',
    summary: '说明夜班补贴、节假日值班和加班调休的统一口径。',
    content: '适用于热线、知识运营和值班经理岗位。节假日值班需提前在系统设置页面登记排班。',
    status: 'PUBLISHED',
    tags: ['福利', '排班', '员工手册'],
    version: 'v2.0',
    owner: '刘薇',
    viewCount: 213,
    createTime: '2026-02-20 10:20:00',
    updateTime: '2026-05-18 17:00:00',
  },
  {
    id: 'kb-3',
    categoryId: 'category-policy-staff',
    categoryName: '员工手册',
    title: '一线坐席员工手册（2026版）',
    summary: '覆盖账号安全、沟通规范、工单录入标准和知识沉淀要求。',
    content: '员工手册分为 8 章，包括登录规范、工单字段填写要求、AI 助手使用红线、知识复盘制度。',
    status: 'PUBLISHED',
    tags: ['员工手册', '坐席', '规范'],
    version: 'v6.0',
    owner: '宋之言',
    viewCount: 864,
    createTime: '2026-01-10 09:00:00',
    updateTime: '2026-06-01 09:22:00',
  },
  {
    id: 'kb-4',
    categoryId: 'category-ticket-sla',
    categoryName: 'SLA 规范',
    title: '工单响应与解决 SLA 对照表',
    summary: '列出普通、高优、紧急工单在不同来源下的响应与解决时限。',
    content: '电话和企业微信来源默认走高优模板。超时工单会在首页大屏与待办页同步告警。',
    status: 'PUBLISHED',
    tags: ['SLA', '工单', '时效'],
    version: 'v1.3',
    owner: '陈沐阳',
    viewCount: 406,
    createTime: '2026-03-28 14:00:00',
    updateTime: '2026-05-30 08:40:00',
  },
  {
    id: 'kb-5',
    categoryId: 'category-ticket-upgrade',
    categoryName: '升级流转',
    title: '菜单权限异常升级处置方案',
    summary: '针对登录、菜单、权限缓存错乱的标准排查路径。',
    content: '优先检查 token、用户信息缓存、动态菜单缓存三层是否一致；必要时清理本地缓存并重新拉取权限树。',
    status: 'PUBLISHED',
    tags: ['权限', '菜单', '升级'],
    version: 'v1.1',
    owner: '郑宁',
    viewCount: 298,
    createTime: '2026-04-08 13:00:00',
    updateTime: '2026-06-06 09:14:00',
  },
  {
    id: 'kb-6',
    categoryId: 'category-ticket-speech',
    categoryName: '标准话术',
    title: '知识库检索为空时的应答模板',
    summary: '规范一线坐席在知识尚未覆盖场景下的沟通方式。',
    content: '先确认问题分类和影响范围，再记录工单并承诺回访时限；避免直接承诺修复时间。',
    status: 'DRAFT',
    tags: ['话术', '检索', 'FAQ'],
    version: 'v0.9',
    owner: '张若一',
    viewCount: 57,
    createTime: '2026-05-21 16:00:00',
    updateTime: '2026-06-04 18:15:00',
  },
  {
    id: 'kb-7',
    categoryId: 'category-project-ai',
    categoryName: 'AI 工单平台',
    title: 'AI 工单平台前端重构说明',
    summary: '记录 mock/real 接口切换、菜单权限、工单页面重构的约束。',
    content: '当前阶段统一通过 VITE_USE_MOCK 控制数据源，真实接口代码必须保留在 API 层。',
    status: 'PUBLISHED',
    tags: ['前端', 'mock', '重构'],
    version: 'v1.0',
    owner: '林知远',
    viewCount: 174,
    createTime: '2026-06-07 09:00:00',
    updateTime: '2026-06-07 09:10:00',
  },
  {
    id: 'kb-8',
    categoryId: 'category-project-release',
    categoryName: '发布手册',
    title: '前端构建与回滚手册',
    summary: '介绍 pnpm build、静态资源发布和回滚目录管理。',
    content: '构建前确认 VITE_USE_MOCK 是否关闭，若用于联调环境请同步检查代理配置与 baseApi。',
    status: 'OFFLINE',
    tags: ['发布', '构建', '回滚'],
    version: 'v1.2',
    owner: '谢砚青',
    viewCount: 93,
    createTime: '2026-04-30 10:10:00',
    updateTime: '2026-06-02 19:15:00',
  },
];

function createCanvasLeaf(id: string, title: string, status: KnowledgeCanvasProcessStatus, updatedBy: string): KnowledgeCanvasNode {
  return {
    id,
    parentId: 'canvas-ticket',
    title,
    type: 'question',
    sort: 1,
    status: 'enabled',
    processStatus: status,
    processStatusLabel: canvasStatusLabel(status),
    summary: `${title} 的知识节点说明`,
    content: `${title}\n- 适用场景：工单、知识库、菜单权限、文档解析等场景\n- 处理要求：保留结构化摘要、责任人和版本信息`,
    script: `${title} 的标准问答脚本`,
    tip: '优先复用现有知识模板与处理规范',
    help: '当前为本地 mock 节点，可在知识库管理页继续编辑。',
    policy: '所有变更先在前端 mock 完整验证，再恢复真实后端联调。',
    tags: [title, '知识图谱'],
    links: [{ name: '关联制度文档', url: 'https://example.com/mock-knowledge' }],
    versions: [{ version: 'v1.0', updatedAt: '2026-06-05 10:00:00', updatedBy, status, remark: '迁移到本地 mock 版本' }],
    updatedAt: '2026-06-05 10:00:00',
    updatedBy,
    children: [],
    summaryGroups: [],
  };
}

const canvasTreeSeed: KnowledgeCanvasNode[] = [
  {
    id: 'canvas-root',
    parentId: null,
    title: '热线服务总流程',
    type: 'category',
    sort: 1,
    status: 'enabled',
    processStatus: 'published',
    processStatusLabel: canvasStatusLabel('published'),
    summary: '热线、工单、知识库、AI 助手协同主干流程。',
    content: '从用户发起问题到工单闭环、知识沉淀的完整主链路。',
    script: '热线服务主流程脚本',
    tip: '点击叶子节点可查看详细流程图。',
    help: '树节点用于选择流程，详情节点用于渲染知识图谱。',
    policy: '当前为前端 mock 数据，字段结构与后端知识图谱接口对齐。',
    tags: ['热线', '工单'],
    links: [],
    versions: [{ version: 'v2.1', updatedAt: '2026-06-01 10:00:00', updatedBy: '宋之言', status: 'published', remark: '补充 AI 助手流程' }],
    updatedAt: '2026-06-01 10:00:00',
    updatedBy: '宋之言',
    children: [
      {
        id: 'canvas-ticket',
        parentId: 'canvas-root',
        title: '工单协同流程',
        type: 'topic',
        sort: 1,
        status: 'enabled',
        processStatus: 'published',
        processStatusLabel: canvasStatusLabel('published'),
        summary: '工单受理、处理、升级、回访的协同节点。',
        content: '包含工单提交、AI 识别、受理、处理、待确认与闭环。',
        script: '工单协同主流程',
        tip: '优先查看升级流转和菜单权限场景',
        help: '点击子节点打开详细流程图',
        policy: '当前为本地 mock 版本',
        tags: ['工单', '流程'],
        links: [],
        versions: [{ version: 'v1.4', updatedAt: '2026-05-29 15:00:00', updatedBy: '陈沐阳', status: 'published', remark: '补充菜单权限排查步骤' }],
        updatedAt: '2026-05-29 15:00:00',
        updatedBy: '陈沐阳',
        children: [
          createCanvasLeaf('canvas-leaf-auth', '菜单权限异常排查', 'published', '陈沐阳'),
          createCanvasLeaf('canvas-leaf-search', '知识检索为空处置', 'draft', '宋之言'),
          createCanvasLeaf('canvas-leaf-doc', '文档解析失败回补', 'offline', '刘薇'),
        ],
      },
    ],
  },
];

const canvasDetailMap: Record<string, KnowledgeCanvasNode> = {
  'canvas-leaf-auth': {
    id: 'canvas-leaf-auth',
    parentId: null,
    title: '菜单权限异常排查',
    type: 'topic',
    sort: 1,
    status: 'enabled',
    processStatus: 'published',
    processStatusLabel: canvasStatusLabel('published'),
    summary: '适用于登录成功后菜单缺失、按钮权限错乱、刷新失效等场景。',
    content: '完整排查流程：token -> userInfo -> menu cache -> route register -> button permission。',
    script: '菜单权限异常排查脚本',
    tip: '优先检查 USER_INFO 与 DYNAMIC_MENUS 的缓存一致性。',
    help: '该节点会在知识库管理页以画布形式展示。',
    policy: 'Mock 模式与真实接口需保持字段一致。',
    tags: ['菜单权限', '登录', '缓存'],
    links: [{ name: '菜单管理页', url: 'https://example.com/mock-menu' }],
    versions: [{ version: 'v1.2', updatedAt: '2026-06-06 09:00:00', updatedBy: '陈沐阳', status: 'published', remark: '新增本地 mock 切换检查项' }],
    updatedAt: '2026-06-06 09:00:00',
    updatedBy: '陈沐阳',
    children: [
      createCanvasLeaf('canvas-auth-step-1', '确认登录 token', 'published', '陈沐阳'),
      createCanvasLeaf('canvas-auth-step-2', '校验用户信息缓存', 'published', '陈沐阳'),
      createCanvasLeaf('canvas-auth-step-3', '重建动态菜单与权限按钮', 'published', '陈沐阳'),
    ],
  },
  'canvas-leaf-search': {
    id: 'canvas-leaf-search',
    parentId: null,
    title: '知识检索为空处置',
    type: 'topic',
    sort: 1,
    status: 'enabled',
    processStatus: 'draft',
    processStatusLabel: canvasStatusLabel('draft'),
    summary: '适用于知识检索没有结果、结果排序异常、文档已上传但未入库等问题。',
    content: '优先核对知识分类树、文档状态、标签与向量解析状态。',
    script: '知识检索排查脚本',
    tip: '检索问题通常与文档状态和分类树同步有关。',
    help: '可继续在知识库管理页补充更多流程节点。',
    policy: '前端 mock 会模拟文档状态与树形目录的联动。',
    tags: ['知识检索', '分类树'],
    links: [],
    versions: [{ version: 'v0.8', updatedAt: '2026-06-04 18:00:00', updatedBy: '宋之言', status: 'draft', remark: '待补充 FAQ 话术' }],
    updatedAt: '2026-06-04 18:00:00',
    updatedBy: '宋之言',
    children: [
      createCanvasLeaf('canvas-search-step-1', '确认分类与状态', 'draft', '宋之言'),
      createCanvasLeaf('canvas-search-step-2', '检查标签与摘要', 'draft', '宋之言'),
      createCanvasLeaf('canvas-search-step-3', '补录缺失知识', 'draft', '宋之言'),
    ],
  },
  'canvas-leaf-doc': {
    id: 'canvas-leaf-doc',
    parentId: null,
    title: '文档解析失败回补',
    type: 'topic',
    sort: 1,
    status: 'enabled',
    processStatus: 'offline',
    processStatusLabel: canvasStatusLabel('offline'),
    summary: '适用于文档中心上传失败、解析卡住、结构化摘要缺失等问题。',
    content: '检查上传记录、解析状态、失败原因和二次重试策略。',
    script: '文档解析失败处理脚本',
    tip: '优先确认文件类型、大小、合并单元格与 OCR 引擎状态。',
    help: '当前节点可作为文档中心页面联动示例。',
    policy: '真实接口恢复后保持分页与状态字段一致。',
    tags: ['文档中心', '解析状态'],
    links: [],
    versions: [{ version: 'v1.0', updatedAt: '2026-05-30 14:00:00', updatedBy: '刘薇', status: 'offline', remark: '等待新版解析引擎接入' }],
    updatedAt: '2026-05-30 14:00:00',
    updatedBy: '刘薇',
    children: [
      createCanvasLeaf('canvas-doc-step-1', '确认上传记录', 'offline', '刘薇'),
      createCanvasLeaf('canvas-doc-step-2', '读取失败原因', 'offline', '刘薇'),
      createCanvasLeaf('canvas-doc-step-3', '触发重试与人工补录', 'offline', '刘薇'),
    ],
  },
};

function canvasStatusLabel(status: KnowledgeCanvasProcessStatus) {
  const map: Record<KnowledgeCanvasProcessStatus, string> = {
    published: '发布',
    draft: '暂存',
    offline: '下架',
  };
  return map[status];
}

function collectCategoryIds(node: KnowledgeCategoryNode): ApiId[] {
  return [node.id, ...(node.children ?? []).flatMap((child) => collectCategoryIds(child))];
}

function findCategoryById(id: ApiId, nodes = categoriesSeed): KnowledgeCategoryNode | undefined {
  for (const node of nodes) {
    if (String(node.id) === String(id)) {
      return node;
    }
    const child = findCategoryById(id, node.children ?? []);
    if (child) {
      return child;
    }
  }
  return undefined;
}

function categoryNameById(id: ApiId) {
  return findCategoryById(id)?.title ?? '未分类';
}

function categoryScope(categoryId?: ApiId) {
  if (!categoryId) {
    return [];
  }

  const category = findCategoryById(categoryId);
  return category ? collectCategoryIds(category).map(String) : [String(categoryId)];
}

function withDocumentCounts(nodes: KnowledgeCategoryNode[]): KnowledgeCategoryNode[] {
  return nodes.map((node) => {
    const children = node.children ? withDocumentCounts(node.children) : undefined;
    const ids = collectCategoryIds({ ...node, children }).map(String);
    return {
      ...node,
      children,
      documentCount: documentsSeed.filter((item) => ids.includes(String(item.categoryId))).length,
    };
  });
}

export function getMockKnowledgeCategoryTree() {
  return createMockResponse(withDocumentCounts(cloneMock(categoriesSeed)));
}

export function getMockKnowledgeDocumentList(params: KnowledgeDocumentQueryParams = {}) {
  const scopeIds = categoryScope(params.categoryId);
  const filtered = sortByTimeDesc(
    documentsSeed.filter(
      (item) =>
        (!scopeIds.length || scopeIds.includes(String(item.categoryId))) &&
        (!params.status || item.status === params.status) &&
        matchesKeyword([item.title, item.summary, item.content, item.categoryName, item.owner, item.tags.join(' ')], params.keyword),
    ),
    (item) => item.updateTime,
  );

  return createMockResponse(paginateMock(filtered, params as PageQuery));
}

export function getMockKnowledgeDocumentDetail(id: ApiId) {
  const record = documentsSeed.find((item) => String(item.id) === String(id));

  if (!record) {
    throw new Error(`Knowledge document ${id} not found`);
  }

  return createMockResponse(cloneMock(record));
}

export function createMockKnowledgeDocument(payload: KnowledgeDocumentPayload) {
  const id = createMockId('kb');
  documentsSeed.unshift({
    id,
    categoryId: payload.categoryId,
    categoryName: categoryNameById(payload.categoryId),
    title: payload.title,
    summary: payload.summary,
    content: payload.content,
    status: payload.status,
    tags: [...new Set(payload.tags ?? [])],
    version: 'v1.0',
    owner: payload.owner?.trim() || '当前用户',
    viewCount: 0,
    createTime: nowText(),
    updateTime: nowText(),
  });

  return createMockResponse(id);
}

export function updateMockKnowledgeDocument(id: ApiId, payload: KnowledgeDocumentPayload) {
  documentsSeed = documentsSeed.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          categoryId: payload.categoryId,
          categoryName: categoryNameById(payload.categoryId),
          title: payload.title,
          summary: payload.summary,
          content: payload.content,
          status: payload.status,
          tags: [...new Set(payload.tags ?? [])],
          owner: payload.owner?.trim() || item.owner,
          updateTime: nowText(),
        }
      : item,
  );

  return createMockResponse(true);
}

export function deleteMockKnowledgeDocument(id: ApiId) {
  documentsSeed = documentsSeed.filter((item) => String(item.id) !== String(id));
  return createMockResponse(true);
}

export function getMockKnowledgeCanvasTree() {
  return createMockResponse(cloneMock(canvasTreeSeed));
}

export function getMockKnowledgeCanvasTotal() {
  return createMockResponse(467);
}

export function getMockKnowledgeCanvasNodeDetail(id: ApiId) {
  const key = String(id);
  const detail = canvasDetailMap[key];

  if (!detail) {
    throw new Error(`Knowledge canvas node ${id} not found`);
  }

  return createMockResponse(cloneMock(detail));
}
