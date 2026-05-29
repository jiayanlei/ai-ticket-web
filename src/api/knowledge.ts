import type { ApiId, PageQuery, PageResult } from '@/api/types';

export type KnowledgeDocumentStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE';

export interface KnowledgeCategoryNode {
  id: ApiId;
  parentId: ApiId | null;
  title: string;
  sort: number;
  documentCount?: number;
  children?: KnowledgeCategoryNode[];
}

export interface KnowledgeDocumentQueryParams extends PageQuery {
  keyword?: string;
  categoryId?: ApiId;
  status?: KnowledgeDocumentStatus;
}

export interface KnowledgeDocumentItem {
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

export interface KnowledgeDocumentPayload {
  categoryId: ApiId;
  title: string;
  summary: string;
  content: string;
  status: KnowledgeDocumentStatus;
  tags?: string[];
  owner?: string;
}

const mockCategories: KnowledgeCategoryNode[] = [
  {
    id: 'root',
    parentId: null,
    title: '总流程',
    sort: 1,
    children: [
      {
        id: 'hotline',
        parentId: 'root',
        title: '热线业务流程',
        sort: 1,
        children: [
          { id: 'road-network', parentId: 'hotline', title: '高速路网', sort: 1 },
          { id: 'etc-service', parentId: 'hotline', title: 'ETC 服务', sort: 2 },
          { id: 'complaint', parentId: 'hotline', title: '投诉建议', sort: 3 },
        ],
      },
      {
        id: 'ticket-standard',
        parentId: 'root',
        title: '工单知识规范',
        sort: 2,
        children: [
          { id: 'dispatch', parentId: 'ticket-standard', title: '派单规则', sort: 1 },
          { id: 'close-loop', parentId: 'ticket-standard', title: '闭环处理', sort: 2 },
        ],
      },
    ],
  },
];

let mockDocuments: KnowledgeDocumentItem[] = [
  {
    id: 'doc-road-001',
    categoryId: 'road-network',
    categoryName: '高速路网',
    title: '路况咨询标准答复',
    summary: '用于坐席快速识别拥堵、事故、施工等路况咨询场景，并给出标准答复口径。',
    content:
      '1. 先确认用户咨询路段、方向和时间。\n2. 查询实时路况并同步影响范围。\n3. 若存在事故或施工，提醒用户关注绕行建议和预计恢复时间。\n4. 未查询到异常时，说明当前系统暂无拥堵或管制记录。',
    status: 'PUBLISHED',
    tags: ['路况', '热线', '标准话术'],
    version: 'v1.3',
    owner: '知识运营组',
    viewCount: 286,
    createTime: '2026-03-18 09:12:00',
    updateTime: '2026-05-12 14:25:30',
  },
  {
    id: 'doc-road-002',
    categoryId: 'road-network',
    categoryName: '高速路网',
    title: '收费政策咨询处理指引',
    summary: '覆盖客车、货车、专项作业车等常见收费政策咨询的处理方式。',
    content:
      '根据用户车型、入口站、出口站和通行时间核实政策口径。涉及减免政策时，需要同步适用条件、材料要求和线上申诉入口。',
    status: 'PUBLISHED',
    tags: ['收费政策', '通行费'],
    version: 'v2.1',
    owner: '路网服务组',
    viewCount: 194,
    createTime: '2026-02-08 11:20:00',
    updateTime: '2026-05-08 10:18:42',
  },
  {
    id: 'doc-etc-001',
    categoryId: 'etc-service',
    categoryName: 'ETC 服务',
    title: 'ETC 扣费异常排查',
    summary: '定位重复扣费、扣费失败、账单延迟等 ETC 扣费异常问题。',
    content:
      '核实车牌、交易时间、通行站点和扣费渠道。若为账单延迟，说明账单同步周期；若疑似重复扣费，引导用户提交交易截图并创建复核工单。',
    status: 'PUBLISHED',
    tags: ['ETC', '扣费', '异常处理'],
    version: 'v1.8',
    owner: 'ETC 支撑组',
    viewCount: 352,
    createTime: '2026-01-26 15:40:00',
    updateTime: '2026-05-10 16:06:12',
  },
  {
    id: 'doc-etc-002',
    categoryId: 'etc-service',
    categoryName: 'ETC 服务',
    title: 'ETC 黑名单解除说明',
    summary: '说明黑名单原因确认、补缴路径和恢复通行的预计时效。',
    content:
      '先确认黑名单来源和欠费记录。用户完成补缴后，告知系统通常会在指定同步周期内解除限制；若超过时效仍未恢复，转人工复核。',
    status: 'DRAFT',
    tags: ['ETC', '黑名单'],
    version: 'v0.9',
    owner: 'ETC 支撑组',
    viewCount: 73,
    createTime: '2026-04-17 10:22:00',
    updateTime: '2026-05-06 09:55:21',
  },
  {
    id: 'doc-complaint-001',
    categoryId: 'complaint',
    categoryName: '投诉建议',
    title: '服务投诉受理规范',
    summary: '规范投诉信息采集、分类、升级和回访要求。',
    content:
      '投诉受理需记录用户诉求、发生时间、地点、涉事单位和证据材料。重大投诉或舆情风险需立即升级值班主管，并在工单备注中标记风险等级。',
    status: 'PUBLISHED',
    tags: ['投诉', '回访', '升级'],
    version: 'v1.5',
    owner: '质检组',
    viewCount: 168,
    createTime: '2026-03-02 13:30:00',
    updateTime: '2026-05-03 17:12:36',
  },
  {
    id: 'doc-dispatch-001',
    categoryId: 'dispatch',
    categoryName: '派单规则',
    title: '智能派单失败人工兜底规则',
    summary: '当 AI 派单置信度不足或部门匹配失败时，给出人工兜底路径。',
    content:
      '当派单置信度低于阈值时，优先按问题分类匹配责任部门；分类不明确时进入综合受理队列，由值班主管二次确认。',
    status: 'PUBLISHED',
    tags: ['智能派单', '兜底'],
    version: 'v1.0',
    owner: '工单运营组',
    viewCount: 121,
    createTime: '2026-04-01 09:00:00',
    updateTime: '2026-05-01 11:32:14',
  },
  {
    id: 'doc-close-001',
    categoryId: 'close-loop',
    categoryName: '闭环处理',
    title: '工单闭环与回访口径',
    summary: '明确工单处理完成后的闭环确认、用户回访和满意度记录要求。',
    content:
      '处理人完成处置后需补充处理结果、附件和责任部门。涉及用户感知的问题，需要完成回访后再关闭工单。',
    status: 'OFFLINE',
    tags: ['闭环', '回访'],
    version: 'v1.1',
    owner: '工单运营组',
    viewCount: 89,
    createTime: '2026-02-14 16:10:00',
    updateTime: '2026-04-25 14:08:55',
  },
];

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function collectCategoryIds(node: KnowledgeCategoryNode): ApiId[] {
  return [node.id, ...(node.children ?? []).flatMap((child) => collectCategoryIds(child))];
}

function findCategoryById(id: ApiId, nodes = mockCategories): KnowledgeCategoryNode | undefined {
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

function findCategoryName(id: ApiId) {
  return findCategoryById(id)?.title ?? '未分类';
}

function withDocumentCounts(nodes: KnowledgeCategoryNode[]): KnowledgeCategoryNode[] {
  return nodes.map((node) => {
    const currentNode = {
      ...node,
      children: node.children ? withDocumentCounts(node.children) : undefined,
    };
    const categoryIds = collectCategoryIds(currentNode).map(String);

    return {
      ...currentNode,
      documentCount: mockDocuments.filter((item) => categoryIds.includes(String(item.categoryId))).length,
    };
  });
}

function getScopeCategoryIds(categoryId?: ApiId) {
  if (!categoryId) {
    return [];
  }

  const category = findCategoryById(categoryId);
  return category ? collectCategoryIds(category).map(String) : [String(categoryId)];
}

function normalizeTags(tags?: string[]) {
  return Array.from(new Set((tags ?? []).map((item) => item.trim()).filter(Boolean)));
}

// TODO: 接入真实后端时，将下面这些 mock 方法替换为 http 请求即可，页面侧已经按异步 API 使用。
export function getKnowledgeCategoryTreeApi(): Promise<KnowledgeCategoryNode[]> {
  // TODO: 替换为 http.get('/knowledge/categories/tree')。
  return Promise.resolve(clone(withDocumentCounts(mockCategories)));
}

export function getKnowledgeDocumentListApi(
  params: KnowledgeDocumentQueryParams = {},
): Promise<PageResult<KnowledgeDocumentItem>> {
  // TODO: 替换为 http.get('/knowledge/documents', { params: cleanQuery(params) }) 并统一分页结构。
  const pageNum = Number(params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const keyword = params.keyword?.trim().toLowerCase();
  const categoryIds = getScopeCategoryIds(params.categoryId);
  const filtered = mockDocuments
    .filter((item) => {
      const inCategory = !categoryIds.length || categoryIds.includes(String(item.categoryId));
      const inStatus = !params.status || item.status === params.status;
      const text = [item.title, item.summary, item.content, item.categoryName, item.owner, item.tags.join(' ')]
        .join(' ')
        .toLowerCase();
      const inKeyword = !keyword || text.includes(keyword);

      return inCategory && inStatus && inKeyword;
    })
    .sort((prev, next) => next.updateTime.localeCompare(prev.updateTime));
  const start = (pageNum - 1) * pageSize;

  return Promise.resolve({
    records: clone(filtered.slice(start, start + pageSize)),
    total: filtered.length,
    pageNum,
    pageSize,
  });
}

export function getKnowledgeDocumentDetailApi(id: ApiId): Promise<KnowledgeDocumentItem> {
  // TODO: 替换为 http.get(`/knowledge/documents/${id}`)。
  const record = mockDocuments.find((item) => String(item.id) === String(id));

  if (!record) {
    return Promise.reject(new Error('知识文档不存在'));
  }

  return Promise.resolve(clone(record));
}

export function createKnowledgeDocumentApi(payload: KnowledgeDocumentPayload): Promise<ApiId> {
  // TODO: 替换为 http.post('/knowledge/documents', cleanPayload(payload))。
  const now = nowText();
  const id = `mock-doc-${Date.now()}`;
  const document: KnowledgeDocumentItem = {
    id,
    categoryId: payload.categoryId,
    categoryName: findCategoryName(payload.categoryId),
    title: payload.title,
    summary: payload.summary,
    content: payload.content,
    status: payload.status,
    tags: normalizeTags(payload.tags),
    version: 'v1.0',
    owner: payload.owner?.trim() || '当前用户',
    viewCount: 0,
    createTime: now,
    updateTime: now,
  };

  mockDocuments = [document, ...mockDocuments];
  return Promise.resolve(id);
}

export function updateKnowledgeDocumentApi(id: ApiId, payload: KnowledgeDocumentPayload): Promise<void> {
  // TODO: 替换为 http.put(`/knowledge/documents/${id}`, cleanPayload(payload))。
  const index = mockDocuments.findIndex((item) => String(item.id) === String(id));

  if (index === -1) {
    return Promise.reject(new Error('知识文档不存在'));
  }

  mockDocuments[index] = {
    ...mockDocuments[index],
    ...payload,
    categoryName: findCategoryName(payload.categoryId),
    tags: normalizeTags(payload.tags),
    updateTime: nowText(),
  };

  return Promise.resolve();
}

export function deleteKnowledgeDocumentApi(id: ApiId): Promise<void> {
  // TODO: 替换为 http.delete(`/knowledge/documents/${id}`)。
  mockDocuments = mockDocuments.filter((item) => String(item.id) !== String(id));
  return Promise.resolve();
}

export type KnowledgeCanvasNodeType = 'category' | 'topic' | 'question' | 'summary';
export type KnowledgeCanvasProcessStatus = 'published' | 'draft' | 'offline';

export interface KnowledgeCanvasLink {
  name: string;
  url: string;
}

export interface KnowledgeCanvasVersion {
  version: string;
  updatedAt: string;
  updatedBy?: string;
  status?: KnowledgeCanvasProcessStatus;
  remark?: string;
}

export interface KnowledgeCanvasNode {
  id: ApiId;
  parentId?: ApiId | null;
  title: string;
  type: KnowledgeCanvasNodeType;
  isSummary?: boolean;
  relationType?: 'summary';
  summarySourceNodeIds?: ApiId[];
  summarySourceNodes?: Array<Pick<KnowledgeCanvasNode, 'id' | 'title' | 'type'>>;
  sort: number;
  status: CommonCanvasStatus;
  processStatus?: KnowledgeCanvasProcessStatus;
  processStatusLabel?: string;
  summary: string;
  content: string;
  script: string;
  tip: string;
  help: string;
  policy: string;
  tags: string[];
  links: KnowledgeCanvasLink[];
  versions: KnowledgeCanvasVersion[];
  updatedAt: string;
  updatedBy: string;
  children?: KnowledgeCanvasNode[];
  summaryGroups?: KnowledgeCanvasNode[];
}

type CommonCanvasStatus = 'enabled' | 'disabled';

interface CanvasNodeInput {
  id: string;
  title: string;
  type?: KnowledgeCanvasNodeType;
  sort?: number;
  status?: CommonCanvasStatus;
  processStatus?: KnowledgeCanvasProcessStatus;
  updatedAt?: string;
  updatedBy?: string;
  tags?: string[];
  children?: CanvasNodeInput[];
}

const mockKnowledgeCanvasTotal = 467;
const canvasStatusText: Record<KnowledgeCanvasProcessStatus, string> = {
  published: '发布',
  draft: '暂存',
  offline: '下架',
};

function createCanvasNode(input: CanvasNodeInput, parentId: ApiId | null = null, path: string[] = []): KnowledgeCanvasNode {
  const currentPath = [...path, input.title];
  const type = input.type ?? (input.children?.length ? 'topic' : 'question');
  const processStatus = input.processStatus ?? 'published';

  return {
    id: input.id,
    parentId,
    title: input.title,
    type,
    sort: input.sort ?? 0,
    status: input.status ?? 'enabled',
    processStatus,
    processStatusLabel: canvasStatusText[processStatus],
    summary: `${input.title}知识节点，承载流程关系、办理口径和常见问题说明。`,
    content: `当前节点：${input.title}\n路径：${currentPath.join(' / ')}\n可在此维护节点备注、处理说明、超链接和历史版本。`,
    script: `当前节点：${input.title}。请结合所属流程与业务上下文进行答复。`,
    tip: `路径：${currentPath.join(' / ')}`,
    help: `节点类型：${type}；排序：${input.sort ?? 0}。`,
    policy: '当前为迁移阶段 mock 数据，后续可替换为真实知识库流程接口返回。',
    tags: input.tags ?? currentPath.slice(-2),
    links: [],
    versions: [
      {
        version: `v${String(input.sort ?? 1).padStart(2, '0')}`,
        updatedAt: input.updatedAt ?? '2026-05-12 10:00:00',
        updatedBy: input.updatedBy ?? '知识运营组',
        status: processStatus,
        remark: '迁移初始化版本',
      },
    ],
    updatedAt: input.updatedAt ?? '2026-05-12 10:00:00',
    updatedBy: input.updatedBy ?? '知识运营组',
    children: input.children?.map((child, index) =>
      createCanvasNode({ sort: index + 1, ...child }, input.id, currentPath),
    ),
  };
}

const mockKnowledgeCanvasTree: KnowledgeCanvasNode[] = [
  createCanvasNode({
    id: 'process-root',
    title: '总流程',
    type: 'category',
    sort: 1,
    updatedAt: '2024-07-02 16:03:21',
    updatedBy: '梁云飞',
    children: [
      {
        id: 'hotline-flow',
        title: '热线业务流程',
        type: 'topic',
        sort: 1,
        children: [
          { id: 'etc-hall', title: 'ETC营业厅' },
          { id: 'related-phone', title: '相关电话' },
          { id: 'accept-flow', title: '话务受理流程' },
          { id: 'etc-platform', title: 'ETC服务平台' },
          { id: 'etc-discount', title: 'ETC优惠' },
          {
            id: 'road-network',
            title: '高速路网',
            type: 'topic',
            children: [
              { id: 'road-condition', title: '路况咨询' },
              { id: 'toll-policy', title: '收费政策' },
              { id: 'road-industry', title: '路产业务' },
              { id: 'maintenance-green', title: '养护绿化' },
              { id: 'traffic-team', title: '交通枢纽' },
            ],
          },
          { id: 'member-rights', title: '预付费会员权益' },
          { id: 'long-passenger', title: '长途客运' },
          { id: 'city-road', title: '城市道路' },
          { id: 'etc-extend', title: 'ETC延伸服务' },
          { id: 'special-certificate', title: '特殊证件' },
        ],
      },
      {
        id: 'appeal-flow',
        title: '接诉即办业务流程',
        type: 'topic',
        sort: 2,
        children: [
          { id: 'appeal-register', title: '诉求登记' },
          { id: 'appeal-dispatch', title: '分类派发' },
          { id: 'appeal-follow', title: '办理跟进' },
          { id: 'appeal-review', title: '结果回访' },
        ],
      },
      {
        id: 'monitor-flow',
        title: '运行监测业务流程',
        type: 'topic',
        sort: 3,
        children: [
          { id: 'monitor-event', title: '事件监测' },
          { id: 'monitor-warning', title: '预警通知' },
          { id: 'monitor-command', title: '联动处置' },
          { id: 'monitor-report', title: '日报复盘' },
        ],
      },
    ],
  }),
];

function createMockProcessFlow(id: string, title: string, steps: string[]): KnowledgeCanvasNode {
  return createCanvasNode({
    id,
    title,
    type: 'topic',
    tags: [title, '流程图'],
    children: steps.map((step, index) => ({
      id: `${id}-step-${index + 1}`,
      title: step,
      type: 'question',
      sort: index + 1,
      tags: [title, step],
    })),
  });
}

const mockKnowledgeCanvasFlowMap: Record<string, KnowledgeCanvasNode> = {
  'etc-hall': createMockProcessFlow('etc-hall', 'ETC营业厅', [
    '确认办理场景',
    '核验车辆与账户信息',
    '引导营业厅办理材料',
    '同步处理结果',
    '归档知识记录',
  ]),
  'related-phone': createMockProcessFlow('related-phone', '相关电话', [
    '识别来电咨询类型',
    '匹配联系电话清单',
    '说明服务时间与转接口径',
    '记录咨询结果',
  ]),
  'accept-flow': createMockProcessFlow('accept-flow', '话务受理流程', [
    '来电身份核验',
    '记录诉求关键词',
    '判断业务分类',
    '生成受理工单',
    '回告处理路径',
  ]),
  'etc-platform': createMockProcessFlow('etc-platform', 'ETC服务平台', [
    '确认平台入口',
    '定位用户账号问题',
    '引导自助处理',
    '转人工处理异常',
    '反馈平台办理结果',
  ]),
  'road-condition': createMockProcessFlow('road-condition', '路况咨询', [
    '确认咨询路段',
    '查询实时路况',
    '判断拥堵或管制原因',
    '提供绕行建议',
    '记录咨询来源',
  ]),
};

function createDefaultProcessFlow(node: KnowledgeCanvasNode): KnowledgeCanvasNode {
  return createMockProcessFlow(String(node.id), node.title, ['确认诉求', '匹配知识口径', '答复处理方式', '记录处理结果']);
}

function findCanvasNodeById(id: ApiId, nodes = mockKnowledgeCanvasTree): KnowledgeCanvasNode | undefined {
  for (const node of nodes) {
    if (String(node.id) === String(id)) {
      return node;
    }

    const child = findCanvasNodeById(id, node.children ?? []);
    if (child) {
      return child;
    }
    const summary = findCanvasNodeById(id, node.summaryGroups ?? []);
    if (summary) {
      return summary;
    }
  }

  return undefined;
}

// TODO: 接入真实后端时，将下面的画布 mock API 替换为知识节点关系图接口。
export function getKnowledgeCanvasTreeApi(): Promise<KnowledgeCanvasNode[]> {
  // TODO: 替换为 http.get('/knowledge/canvas/tree')。
  return Promise.resolve(clone(mockKnowledgeCanvasTree));
}

export function getKnowledgeCanvasTotalApi(): Promise<number> {
  // TODO: 替换为真实节点统计接口。
  return Promise.resolve(mockKnowledgeCanvasTotal);
}

export function getKnowledgeCanvasNodeDetailApi(id: ApiId): Promise<KnowledgeCanvasNode> {
  // TODO: 替换为 http.get(`/knowledge/canvas/nodes/${id}`)。
  const node = findCanvasNodeById(id);

  if (!node) {
    return Promise.reject(new Error('知识节点不存在'));
  }

  if (node.children?.length) {
    return Promise.reject(new Error('请选择最后一级流程节点'));
  }

  return Promise.resolve(clone(mockKnowledgeCanvasFlowMap[String(id)] ?? createDefaultProcessFlow(node)));
}
