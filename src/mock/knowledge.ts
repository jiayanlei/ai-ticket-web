import type { ApiId, PageQuery } from '@/api/types';
import type {
  KnowledgeCanvasNode,
  KnowledgeCanvasProcessStatus,
  KnowledgeCategoryNode,
  KnowledgeDocumentItem,
  KnowledgeDocumentPayload,
  KnowledgeDocumentQueryParams,
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
          { id: 'category-policy-safety', parentId: 'category-policy', title: '安全合规', sort: 4 },
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
          { id: 'category-ticket-quality', parentId: 'category-ticket', title: '质检规则', sort: 4 },
          { id: 'category-ticket-callback', parentId: 'category-ticket', title: '回访闭环', sort: 5 },
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
          { id: 'category-project-data', parentId: 'category-project', title: '指标口径', sort: 4 },
        ],
      },
      {
        id: 'category-ai',
        parentId: 'category-root',
        title: 'AI 知识运营',
        sort: 4,
        children: [
          { id: 'category-ai-prompt', parentId: 'category-ai', title: 'Prompt 模板', sort: 1 },
          { id: 'category-ai-model', parentId: 'category-ai', title: '模型评估', sort: 2 },
          { id: 'category-ai-reply', parentId: 'category-ai', title: '回复建议', sort: 3 },
          { id: 'category-ai-risk', parentId: 'category-ai', title: '风险识别', sort: 4 },
        ],
      },
      {
        id: 'category-training',
        parentId: 'category-root',
        title: '客服培训',
        sort: 5,
        children: [
          { id: 'category-training-new', parentId: 'category-training', title: '新人训练', sort: 1 },
          { id: 'category-training-case', parentId: 'category-training', title: '案例复盘', sort: 2 },
          { id: 'category-training-complaint', parentId: 'category-training', title: '客诉处理', sort: 3 },
          { id: 'category-training-emotion', parentId: 'category-training', title: '情绪安抚', sort: 4 },
        ],
      },
      {
        id: 'category-ops',
        parentId: 'category-root',
        title: '系统运维',
        sort: 6,
        children: [
          { id: 'category-ops-auth', parentId: 'category-ops', title: '登录权限', sort: 1 },
          { id: 'category-ops-sync', parentId: 'category-ops', title: '数据同步', sort: 2 },
          { id: 'category-ops-monitor', parentId: 'category-ops', title: '告警监控', sort: 3 },
          { id: 'category-ops-export', parentId: 'category-ops', title: '报表导出', sort: 4 },
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
  {
    id: 'kb-9',
    categoryId: 'category-policy-safety',
    categoryName: '安全合规',
    title: '员工账号安全与权限申请规范',
    summary: '说明账号开通、权限申请、MFA 绑定和离职回收要求。',
    content: '账号权限申请需经过直属主管和系统管理员审批；敏感菜单权限默认 90 天复核一次。',
    status: 'PUBLISHED',
    tags: ['账号安全', '权限', '合规'],
    version: 'v1.4',
    owner: '林知远',
    viewCount: 382,
    createTime: '2026-02-18 09:30:00',
    updateTime: '2026-06-06 15:40:00',
  },
  {
    id: 'kb-10',
    categoryId: 'category-policy-process',
    categoryName: '流程规范',
    title: '热线值班交接记录填写模板',
    summary: '统一值班交接中的未闭环工单、风险事项和待跟进知识点格式。',
    content: '交接记录必须包含班次、值班人、重点工单、未解决问题、下一班跟进动作和附件地址。',
    status: 'PUBLISHED',
    tags: ['值班', '交接', '流程规范'],
    version: 'v1.2',
    owner: '刘薇',
    viewCount: 247,
    createTime: '2026-03-06 11:10:00',
    updateTime: '2026-06-03 20:10:00',
  },
  {
    id: 'kb-11',
    categoryId: 'category-ticket-quality',
    categoryName: '质检规则',
    title: '客服服务质检评分细则',
    summary: '覆盖首响、问题确认、知识引用、情绪安抚和闭环说明等评分项。',
    content: '质检评分采用 100 分制，知识引用准确性和回访承诺兑现为重点扣分项。',
    status: 'PUBLISHED',
    tags: ['质检', '客服', '评分'],
    version: 'v2.3',
    owner: '宋之言',
    viewCount: 531,
    createTime: '2026-01-22 15:40:00',
    updateTime: '2026-06-05 18:10:00',
  },
  {
    id: 'kb-12',
    categoryId: 'category-ticket-callback',
    categoryName: '回访闭环',
    title: '低分回访闭环处理 SOP',
    summary: '定义满意度低分的识别、二次沟通、复盘和知识沉淀流程。',
    content: '低分回访需在 4 小时内完成首次联系，无法联系时保留 3 次拨打记录并同步主管。',
    status: 'DRAFT',
    tags: ['回访', '低分', 'SOP'],
    version: 'v0.7',
    owner: '张若一',
    viewCount: 88,
    createTime: '2026-05-26 10:00:00',
    updateTime: '2026-06-07 10:28:00',
  },
  {
    id: 'kb-13',
    categoryId: 'category-ticket-upgrade',
    categoryName: '升级流转',
    title: 'VIP 客户来电转派规则',
    summary: '说明 VIP 客户识别、专席转派、主管同步和 SLA 升级规则。',
    content: 'VIP 来电需要保留客户等级、历史工单和当前诉求，转派前必须确认目标队列在线状态。',
    status: 'PUBLISHED',
    tags: ['VIP', '转派', '升级'],
    version: 'v1.8',
    owner: '陈沐阳',
    viewCount: 459,
    createTime: '2026-03-16 13:20:00',
    updateTime: '2026-06-06 16:22:00',
  },
  {
    id: 'kb-14',
    categoryId: 'category-ticket-speech',
    categoryName: '标准话术',
    title: '标准拒绝承诺话术库',
    summary: '用于无法立即给出修复时间、赔付结果或后台数据时的一线回复。',
    content: '坐席需要说明已记录问题、预计反馈节点和可提供的临时方案，避免使用绝对化承诺。',
    status: 'PUBLISHED',
    tags: ['话术', '承诺边界', '客服'],
    version: 'v1.5',
    owner: '李心禾',
    viewCount: 336,
    createTime: '2026-04-12 09:40:00',
    updateTime: '2026-06-01 14:05:00',
  },
  {
    id: 'kb-15',
    categoryId: 'category-project-api',
    categoryName: '接口约定',
    title: '开放接口错误码与排查手册',
    summary: '整理常见 HTTP 状态码、业务错误码和前端提示口径。',
    content: '401 优先排查 token，403 检查权限码，422 检查请求字段，500 需要保留 traceId 后升级。',
    status: 'PUBLISHED',
    tags: ['接口', '错误码', '联调'],
    version: 'v1.1',
    owner: '郑宁',
    viewCount: 294,
    createTime: '2026-04-21 10:20:00',
    updateTime: '2026-06-04 12:30:00',
  },
  {
    id: 'kb-16',
    categoryId: 'category-project-data',
    categoryName: '指标口径',
    title: '数据看板指标口径说明',
    summary: '统一待办、响应、解决、满意度和知识命中率等核心指标定义。',
    content: '知识命中率按已引用知识的有效回复次数除以总回复次数计算，排除测试工单和已删除记录。',
    status: 'DRAFT',
    tags: ['指标', '看板', '数据口径'],
    version: 'v0.6',
    owner: '谢砚青',
    viewCount: 129,
    createTime: '2026-05-18 16:00:00',
    updateTime: '2026-06-07 11:02:00',
  },
  {
    id: 'kb-17',
    categoryId: 'category-project-release',
    categoryName: '发布手册',
    title: '灰度发布前检查清单',
    summary: '列出菜单、权限、mock 开关、环境变量和回滚包的发布前确认项。',
    content: '灰度前需要确认 VITE_USE_MOCK、API baseUrl、动态路由、静态资源版本和回滚目录均已核对。',
    status: 'PUBLISHED',
    tags: ['发布', '灰度', '检查清单'],
    version: 'v1.4',
    owner: '林知远',
    viewCount: 265,
    createTime: '2026-05-09 09:30:00',
    updateTime: '2026-06-03 17:45:00',
  },
  {
    id: 'kb-18',
    categoryId: 'category-ai-prompt',
    categoryName: 'Prompt 模板',
    title: 'AI 助手 Prompt 维护规范',
    summary: '规范 Prompt 命名、版本、适用场景和风险词拦截说明。',
    content: 'Prompt 变更需保留版本号、变更原因、测试样例和回滚文本，不能直接覆盖线上模板。',
    status: 'PUBLISHED',
    tags: ['AI', 'Prompt', '版本'],
    version: 'v2.2',
    owner: '郑宁',
    viewCount: 417,
    createTime: '2026-03-25 15:00:00',
    updateTime: '2026-06-07 09:36:00',
  },
  {
    id: 'kb-19',
    categoryId: 'category-ai-model',
    categoryName: '模型评估',
    title: 'AI 分类置信度复核指南',
    summary: '说明低置信度分类、相似工单召回和人工复核队列的处理方式。',
    content: '分类置信度低于 0.72 时进入人工复核；连续三天低于阈值的分类需要补充训练样本。',
    status: 'PUBLISHED',
    tags: ['AI 分类', '置信度', '复核'],
    version: 'v1.7',
    owner: '宋之言',
    viewCount: 506,
    createTime: '2026-04-02 11:00:00',
    updateTime: '2026-06-06 13:50:00',
  },
  {
    id: 'kb-20',
    categoryId: 'category-ai-reply',
    categoryName: '回复建议',
    title: '自动回复建议审核说明',
    summary: '约束 AI 回复建议进入坐席工作台前的审核与改写规则。',
    content: 'AI 回复建议需引用知识来源、展示置信度，并允许坐席编辑后发送；低置信建议只做内部参考。',
    status: 'DRAFT',
    tags: ['AI 回复', '审核', '坐席'],
    version: 'v0.9',
    owner: '李心禾',
    viewCount: 112,
    createTime: '2026-05-30 14:10:00',
    updateTime: '2026-06-07 08:54:00',
  },
  {
    id: 'kb-21',
    categoryId: 'category-ai-risk',
    categoryName: '风险识别',
    title: '敏感投诉风险标签说明',
    summary: '定义舆情、赔付、服务态度和重复投诉等风险标签的触发规则。',
    content: '命中敏感投诉标签后，工单需要自动升级给主管，并在处理记录中保留触发片段。',
    status: 'PUBLISHED',
    tags: ['风险', '投诉', '标签'],
    version: 'v1.3',
    owner: '陈沐阳',
    viewCount: 348,
    createTime: '2026-04-18 10:30:00',
    updateTime: '2026-06-05 10:18:00',
  },
  {
    id: 'kb-22',
    categoryId: 'category-training-new',
    categoryName: '新人训练',
    title: '新人首周工单录入训练材料',
    summary: '覆盖工单字段、问题复述、附件上传、AI 建议引用等基础训练。',
    content: '新人首周每天至少完成 20 条模拟工单录入，并由带教检查分类、优先级和描述完整性。',
    status: 'PUBLISHED',
    tags: ['新人', '培训', '工单录入'],
    version: 'v1.0',
    owner: '刘薇',
    viewCount: 229,
    createTime: '2026-05-12 09:00:00',
    updateTime: '2026-06-02 10:08:00',
  },
  {
    id: 'kb-23',
    categoryId: 'category-training-case',
    categoryName: '案例复盘',
    title: '典型客诉案例复盘集',
    summary: '沉淀登录权限、账单争议、服务态度和重复投诉的典型处理案例。',
    content: '每个复盘案例包含客户背景、关键节点、错误动作、正确话术和后续知识更新记录。',
    status: 'PUBLISHED',
    tags: ['案例', '客诉', '复盘'],
    version: 'v1.9',
    owner: '宋之言',
    viewCount: 612,
    createTime: '2026-02-14 14:30:00',
    updateTime: '2026-06-06 19:30:00',
  },
  {
    id: 'kb-24',
    categoryId: 'category-training-emotion',
    categoryName: '情绪安抚',
    title: '情绪安抚与升级边界话术',
    summary: '帮助坐席在高情绪沟通中完成安抚、澄清和必要升级。',
    content: '先复述客户诉求，再确认当前可推进动作；涉及赔付、舆情和法律风险时及时升级主管。',
    status: 'PUBLISHED',
    tags: ['情绪安抚', '升级边界', '话术'],
    version: 'v1.6',
    owner: '张若一',
    viewCount: 439,
    createTime: '2026-03-04 16:10:00',
    updateTime: '2026-06-04 16:42:00',
  },
  {
    id: 'kb-25',
    categoryId: 'category-ops-auth',
    categoryName: '登录权限',
    title: '登录失败与 MFA 异常处理手册',
    summary: '梳理密码错误、MFA 丢失、账号冻结和权限缓存异常的处理路径。',
    content: 'MFA 异常需先核验员工身份，再由系统管理员重置绑定；账号冻结需保留审计日志。',
    status: 'PUBLISHED',
    tags: ['登录', 'MFA', '权限'],
    version: 'v1.2',
    owner: '谢砚青',
    viewCount: 318,
    createTime: '2026-04-26 11:20:00',
    updateTime: '2026-06-05 09:48:00',
  },
  {
    id: 'kb-26',
    categoryId: 'category-ops-sync',
    categoryName: '数据同步',
    title: '数据同步延迟排查记录',
    summary: '记录工单、知识、用户权限三类同步延迟的排查经验。',
    content: '同步延迟先看队列积压、重试次数和最近发布时间，再判断是否需要手动补偿。',
    status: 'OFFLINE',
    tags: ['数据同步', '延迟', '队列'],
    version: 'v1.0',
    owner: '郑宁',
    viewCount: 76,
    createTime: '2026-05-03 18:00:00',
    updateTime: '2026-05-29 21:12:00',
  },
  {
    id: 'kb-27',
    categoryId: 'category-ops-monitor',
    categoryName: '告警监控',
    title: '告警订阅与值班通知配置',
    summary: '说明关键告警订阅人、通知渠道、静默窗口和升级规则。',
    content: 'P1 告警必须同时通知值班经理、平台运维部和业务负责人；静默窗口需在发布记录中说明。',
    status: 'PUBLISHED',
    tags: ['告警', '值班', '通知'],
    version: 'v1.5',
    owner: '陈沐阳',
    viewCount: 286,
    createTime: '2026-03-30 09:45:00',
    updateTime: '2026-06-02 22:05:00',
  },
  {
    id: 'kb-28',
    categoryId: 'category-ops-export',
    categoryName: '报表导出',
    title: '报表导出失败兜底方案',
    summary: '定义大数据量导出、字段缺失和权限不足时的一线处理方案。',
    content: '导出超过 5 万行时建议改用异步任务；权限不足需确认当前角色是否具备 export 权限码。',
    status: 'DRAFT',
    tags: ['报表', '导出', '兜底'],
    version: 'v0.8',
    owner: '谢砚青',
    viewCount: 103,
    createTime: '2026-05-24 13:30:00',
    updateTime: '2026-06-07 09:18:00',
  },
];

interface CanvasLeafOptions {
  parentId?: ApiId | null;
  sort?: number;
  summary?: string;
  content?: string;
  tags?: string[];
  updatedAt?: string;
  linkName?: string;
  linkUrl?: string;
}

interface CanvasTopicInput {
  id: string;
  parentId?: ApiId | null;
  title: string;
  sort: number;
  status: KnowledgeCanvasProcessStatus;
  summary: string;
  content: string;
  updatedBy: string;
  updatedAt: string;
  tags: string[];
  children?: KnowledgeCanvasNode[];
  script?: string;
  tip?: string;
  help?: string;
  policy?: string;
  version?: string;
  remark?: string;
  links?: Array<{ name: string; url: string }>;
}

interface CanvasDetailInput extends Omit<CanvasTopicInput, 'sort' | 'children'> {
  steps: string[];
}

function createCanvasLeaf(
  id: string,
  title: string,
  status: KnowledgeCanvasProcessStatus,
  updatedBy: string,
  options: CanvasLeafOptions = {},
): KnowledgeCanvasNode {
  const updatedAt = options.updatedAt ?? '2026-06-05 10:00:00';

  return {
    id,
    parentId: options.parentId ?? 'canvas-ticket',
    title,
    type: 'question',
    sort: options.sort ?? 1,
    status: 'enabled',
    processStatus: status,
    processStatusLabel: canvasStatusLabel(status),
    summary: options.summary ?? `${title} 的知识节点说明`,
    content:
      options.content ??
      `${title}\n- 适用场景：工单、知识库、菜单权限、文档解析等场景\n- 处理要求：保留结构化摘要、责任人和版本信息`,
    script: `${title} 的标准问答脚本`,
    tip: '优先复用现有知识模板与处理规范',
    help: '当前为本地 mock 节点，可在知识库管理页继续编辑。',
    policy: '所有变更先在前端 mock 完整验证，再恢复真实后端联调。',
    tags: options.tags ?? [title, '知识图谱'],
    links: [{ name: options.linkName ?? '关联制度文档', url: options.linkUrl ?? 'https://example.com/mock-knowledge' }],
    versions: [{ version: 'v1.0', updatedAt, updatedBy, status, remark: '迁移到本地 mock 版本' }],
    updatedAt,
    updatedBy,
    children: [],
    summaryGroups: [],
  };
}

function createCanvasTopic(input: CanvasTopicInput): KnowledgeCanvasNode {
  return {
    id: input.id,
    parentId: input.parentId ?? null,
    title: input.title,
    type: 'topic',
    sort: input.sort,
    status: 'enabled',
    processStatus: input.status,
    processStatusLabel: canvasStatusLabel(input.status),
    summary: input.summary,
    content: input.content,
    script: input.script ?? `${input.title}流程脚本`,
    tip: input.tip ?? '点击子节点打开详细流程图',
    help: input.help ?? '可在知识库管理页查看和编辑流程节点',
    policy: input.policy ?? '当前为本地 mock 版本',
    tags: input.tags,
    links: input.links ?? [],
    versions: [
      {
        version: input.version ?? 'v1.0',
        updatedAt: input.updatedAt,
        updatedBy: input.updatedBy,
        status: input.status,
        remark: input.remark ?? '补充流程节点',
      },
    ],
    updatedAt: input.updatedAt,
    updatedBy: input.updatedBy,
    children: input.children ?? [],
    summaryGroups: [],
  };
}

function createCanvasDetail(input: CanvasDetailInput): KnowledgeCanvasNode {
  return createCanvasTopic({
    ...input,
    sort: 1,
    children: input.steps.map((step, index) =>
      createCanvasLeaf(`${input.id}-step-${index + 1}`, step, input.status, input.updatedBy, {
        parentId: input.id,
        sort: index + 1,
        tags: [input.title, step],
        updatedAt: input.updatedAt,
      }),
    ),
  });
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
      createCanvasTopic({
        id: 'canvas-ticket',
        parentId: 'canvas-root',
        title: '工单协同流程',
        sort: 1,
        status: 'published',
        summary: '工单受理、处理、升级、回访的协同节点。',
        content: '包含工单提交、AI 识别、受理、处理、待确认与闭环。',
        tip: '优先查看升级流转和菜单权限场景',
        tags: ['工单', '流程'],
        updatedAt: '2026-05-29 15:00:00',
        updatedBy: '陈沐阳',
        version: 'v1.4',
        remark: '补充菜单权限排查步骤',
        children: [
          createCanvasLeaf('canvas-leaf-auth', '菜单权限异常排查', 'published', '陈沐阳', {
            parentId: 'canvas-ticket',
            sort: 1,
            tags: ['菜单权限', '登录', '缓存'],
          }),
          createCanvasLeaf('canvas-leaf-sla', 'SLA 超时预警处理', 'published', '陈沐阳', {
            parentId: 'canvas-ticket',
            sort: 2,
            tags: ['SLA', '超时', '预警'],
          }),
          createCanvasLeaf('canvas-leaf-vip', 'VIP 客户转派确认', 'published', '刘薇', {
            parentId: 'canvas-ticket',
            sort: 3,
            tags: ['VIP', '转派', '专席'],
          }),
          createCanvasLeaf('canvas-leaf-callback', '低分回访闭环', 'draft', '张若一', {
            parentId: 'canvas-ticket',
            sort: 4,
            tags: ['回访', '满意度', '闭环'],
          }),
        ],
      }),
      createCanvasTopic({
        id: 'canvas-knowledge',
        parentId: 'canvas-root',
        title: '知识运营流程',
        sort: 2,
        status: 'published',
        summary: '文档入库、检索优化、质检复盘与知识补录的运营链路。',
        content: '覆盖文档解析、知识检索、质检发现、缺口补录和版本发布。',
        tags: ['知识库', '运营'],
        updatedAt: '2026-06-04 18:00:00',
        updatedBy: '宋之言',
        version: 'v1.8',
        remark: '扩展知识检索和文档解析分支',
        children: [
          createCanvasLeaf('canvas-leaf-search', '知识检索为空处置', 'draft', '宋之言', {
            parentId: 'canvas-knowledge',
            sort: 1,
            tags: ['知识检索', '分类树'],
          }),
          createCanvasLeaf('canvas-leaf-doc', '文档解析失败回补', 'offline', '刘薇', {
            parentId: 'canvas-knowledge',
            sort: 2,
            tags: ['文档中心', '解析状态'],
          }),
          createCanvasLeaf('canvas-leaf-quality', '质检发现知识缺口', 'published', '宋之言', {
            parentId: 'canvas-knowledge',
            sort: 3,
            tags: ['质检', '知识缺口', '复盘'],
          }),
        ],
      }),
      createCanvasTopic({
        id: 'canvas-ai',
        parentId: 'canvas-root',
        title: 'AI 辅助流程',
        sort: 3,
        status: 'published',
        summary: 'AI 分类、回复建议、风险识别和 Prompt 维护流程。',
        content: '用于串联 AI 助手在工单受理、坐席回复和知识运营中的关键节点。',
        tags: ['AI', '智能辅助'],
        updatedAt: '2026-06-07 09:36:00',
        updatedBy: '郑宁',
        version: 'v2.0',
        remark: '补充模型评估和风险识别节点',
        children: [
          createCanvasLeaf('canvas-leaf-prompt', 'Prompt 模板变更评审', 'published', '郑宁', {
            parentId: 'canvas-ai',
            sort: 1,
            tags: ['Prompt', '评审', '版本'],
          }),
          createCanvasLeaf('canvas-leaf-classify', 'AI 分类低置信复核', 'published', '宋之言', {
            parentId: 'canvas-ai',
            sort: 2,
            tags: ['AI 分类', '置信度', '复核'],
          }),
          createCanvasLeaf('canvas-leaf-reply', 'AI 回复建议审核', 'draft', '李心禾', {
            parentId: 'canvas-ai',
            sort: 3,
            tags: ['AI 回复', '审核', '坐席'],
          }),
          createCanvasLeaf('canvas-leaf-risk', '敏感投诉风险升级', 'published', '陈沐阳', {
            parentId: 'canvas-ai',
            sort: 4,
            tags: ['风险识别', '投诉', '升级'],
          }),
        ],
      }),
      createCanvasTopic({
        id: 'canvas-training',
        parentId: 'canvas-root',
        title: '客服培训流程',
        sort: 4,
        status: 'published',
        summary: '新人训练、案例复盘、客诉处理和情绪安抚的培训主线。',
        content: '帮助坐席从模拟工单、典型案例到真实客诉逐步完成训练闭环。',
        tags: ['培训', '坐席'],
        updatedAt: '2026-06-06 19:30:00',
        updatedBy: '刘薇',
        version: 'v1.3',
        remark: '补充培训知识沉淀流程',
        children: [
          createCanvasLeaf('canvas-leaf-training-new', '新人首周训练', 'published', '刘薇', {
            parentId: 'canvas-training',
            sort: 1,
            tags: ['新人', '训练', '工单录入'],
          }),
          createCanvasLeaf('canvas-leaf-complaint', '典型客诉复盘', 'published', '宋之言', {
            parentId: 'canvas-training',
            sort: 2,
            tags: ['客诉', '案例', '复盘'],
          }),
          createCanvasLeaf('canvas-leaf-emotion', '高情绪用户安抚', 'published', '张若一', {
            parentId: 'canvas-training',
            sort: 3,
            tags: ['情绪安抚', '话术', '升级边界'],
          }),
        ],
      }),
      createCanvasTopic({
        id: 'canvas-ops',
        parentId: 'canvas-root',
        title: '系统运维流程',
        sort: 5,
        status: 'published',
        summary: '登录权限、数据同步、告警监控和报表导出的运维支持流程。',
        content: '用于支撑一线坐席在系统异常场景下快速定位问题并完成升级。',
        tags: ['运维', '系统支持'],
        updatedAt: '2026-06-05 09:48:00',
        updatedBy: '谢砚青',
        version: 'v1.5',
        remark: '补充系统异常兜底节点',
        children: [
          createCanvasLeaf('canvas-leaf-login', '登录失败与 MFA 异常', 'published', '谢砚青', {
            parentId: 'canvas-ops',
            sort: 1,
            tags: ['登录', 'MFA', '权限'],
          }),
          createCanvasLeaf('canvas-leaf-sync', '数据同步延迟处理', 'offline', '郑宁', {
            parentId: 'canvas-ops',
            sort: 2,
            tags: ['数据同步', '延迟', '队列'],
          }),
          createCanvasLeaf('canvas-leaf-monitor', 'P1 告警通知升级', 'published', '陈沐阳', {
            parentId: 'canvas-ops',
            sort: 3,
            tags: ['告警', '值班', 'P1'],
          }),
          createCanvasLeaf('canvas-leaf-export', '报表导出失败兜底', 'draft', '谢砚青', {
            parentId: 'canvas-ops',
            sort: 4,
            tags: ['报表', '导出', '兜底'],
          }),
        ],
      }),
    ],
  },
];

const canvasDetailMap: Record<string, KnowledgeCanvasNode> = {
  'canvas-leaf-auth': createCanvasDetail({
    id: 'canvas-leaf-auth',
    title: '菜单权限异常排查',
    status: 'published',
    summary: '适用于登录成功后菜单缺失、按钮权限错乱、刷新失效等场景。',
    content: '完整排查流程：token -> userInfo -> menu cache -> route register -> button permission。',
    script: '菜单权限异常排查脚本',
    tip: '优先检查 USER_INFO 与 DYNAMIC_MENUS 的缓存一致性。',
    help: '该节点会在知识库管理页以画布形式展示。',
    policy: 'Mock 模式与真实接口需保持字段一致。',
    tags: ['菜单权限', '登录', '缓存'],
    links: [{ name: '菜单管理页', url: 'https://example.com/mock-menu' }],
    updatedAt: '2026-06-06 09:00:00',
    updatedBy: '陈沐阳',
    version: 'v1.2',
    remark: '新增本地 mock 切换检查项',
    steps: ['确认登录 token', '校验用户信息缓存', '重建动态菜单与权限按钮'],
  }),
  'canvas-leaf-sla': createCanvasDetail({
    id: 'canvas-leaf-sla',
    title: 'SLA 超时预警处理',
    status: 'published',
    summary: '适用于工单响应或解决时限临近超时、已超时和批量预警场景。',
    content: '先确认工单优先级和来源，再判断是否需要升级值班经理，最后补齐处理记录和回访计划。',
    tags: ['SLA', '超时', '预警'],
    updatedAt: '2026-06-05 18:30:00',
    updatedBy: '陈沐阳',
    version: 'v1.5',
    remark: '补充批量预警处理路径',
    steps: ['确认 SLA 规则', '识别临期与超时工单', '升级值班经理', '同步处理记录与回访'],
  }),
  'canvas-leaf-vip': createCanvasDetail({
    id: 'canvas-leaf-vip',
    title: 'VIP 客户转派确认',
    status: 'published',
    summary: '适用于 VIP 来电、重点客户投诉和跨团队专席处理场景。',
    content: '转派前确认客户等级、诉求摘要、历史工单和目标队列在线状态，转派后同步主管关注。',
    tags: ['VIP', '转派', '专席'],
    updatedAt: '2026-06-06 16:22:00',
    updatedBy: '刘薇',
    version: 'v1.8',
    remark: '补充目标队列确认要求',
    steps: ['识别客户等级', '补齐诉求摘要', '确认目标队列在线', '完成转派并同步主管'],
  }),
  'canvas-leaf-callback': createCanvasDetail({
    id: 'canvas-leaf-callback',
    title: '低分回访闭环',
    status: 'draft',
    summary: '适用于满意度低分、服务态度投诉和处理结果不满意场景。',
    content: '4 小时内完成首次回访，无法联系时保留多次拨打记录，最终形成复盘和知识更新动作。',
    tags: ['回访', '满意度', '闭环'],
    updatedAt: '2026-06-07 10:28:00',
    updatedBy: '张若一',
    version: 'v0.7',
    remark: '待确认低分回访模板',
    steps: ['拉取低分原因', '完成首次回访', '确认补救动作', '沉淀案例复盘'],
  }),
  'canvas-leaf-search': createCanvasDetail({
    id: 'canvas-leaf-search',
    title: '知识检索为空处置',
    status: 'draft',
    summary: '适用于知识检索没有结果、结果排序异常、文档已上传但未入库等问题。',
    content: '优先核对知识分类树、文档状态、标签与向量解析状态。',
    script: '知识检索排查脚本',
    tip: '检索问题通常与文档状态和分类树同步有关。',
    policy: '前端 mock 会模拟文档状态与树形目录的联动。',
    tags: ['知识检索', '分类树'],
    updatedAt: '2026-06-04 18:00:00',
    updatedBy: '宋之言',
    version: 'v0.8',
    remark: '待补充 FAQ 话术',
    steps: ['确认分类与状态', '检查标签与摘要', '核对向量解析状态', '补录缺失知识'],
  }),
  'canvas-leaf-doc': createCanvasDetail({
    id: 'canvas-leaf-doc',
    title: '文档解析失败回补',
    status: 'offline',
    summary: '适用于文档中心上传失败、解析卡住、结构化摘要缺失等问题。',
    content: '检查上传记录、解析状态、失败原因和二次重试策略。',
    script: '文档解析失败处理脚本',
    tip: '优先确认文件类型、大小、合并单元格与 OCR 引擎状态。',
    policy: '真实接口恢复后保持分页与状态字段一致。',
    tags: ['文档中心', '解析状态'],
    updatedAt: '2026-05-30 14:00:00',
    updatedBy: '刘薇',
    version: 'v1.0',
    remark: '等待新版解析引擎接入',
    steps: ['确认上传记录', '读取失败原因', '触发解析重试', '人工补录关键知识'],
  }),
  'canvas-leaf-quality': createCanvasDetail({
    id: 'canvas-leaf-quality',
    title: '质检发现知识缺口',
    status: 'published',
    summary: '适用于质检评分中发现坐席回复无依据、知识引用错误或 FAQ 缺失的场景。',
    content: '质检记录需要关联原始会话、扣分项、建议知识标题和负责人，知识运营确认后补录。',
    tags: ['质检', '知识缺口', '复盘'],
    updatedAt: '2026-06-05 18:10:00',
    updatedBy: '宋之言',
    version: 'v2.3',
    remark: '补充质检到知识补录闭环',
    steps: ['定位扣分项', '关联原始会话', '创建知识补录任务', '复核发布结果'],
  }),
  'canvas-leaf-prompt': createCanvasDetail({
    id: 'canvas-leaf-prompt',
    title: 'Prompt 模板变更评审',
    status: 'published',
    summary: '适用于 AI 助手 Prompt 模板新增、修改、下线和回滚。',
    content: 'Prompt 变更需要记录版本、适用场景、测试样例、风险词和回滚文本。',
    tags: ['Prompt', '评审', '版本'],
    updatedAt: '2026-06-07 09:36:00',
    updatedBy: '郑宁',
    version: 'v2.2',
    remark: '补充回滚文本要求',
    steps: ['提交变更说明', '补充测试样例', '完成风险词检查', '发布并保留回滚文本'],
  }),
  'canvas-leaf-classify': createCanvasDetail({
    id: 'canvas-leaf-classify',
    title: 'AI 分类低置信复核',
    status: 'published',
    summary: '适用于 AI 自动分类置信度低、分类冲突或相似工单召回异常场景。',
    content: '低于阈值的分类进入人工复核，连续命中低置信时补充训练样本并回看分类口径。',
    tags: ['AI 分类', '置信度', '复核'],
    updatedAt: '2026-06-06 13:50:00',
    updatedBy: '宋之言',
    version: 'v1.7',
    remark: '补充连续低置信处理',
    steps: ['读取分类置信度', '进入人工复核', '补充训练样本', '回看分类口径'],
  }),
  'canvas-leaf-reply': createCanvasDetail({
    id: 'canvas-leaf-reply',
    title: 'AI 回复建议审核',
    status: 'draft',
    summary: '适用于 AI 自动生成回复建议进入坐席工作台前的审核和改写。',
    content: '回复建议需展示知识来源和置信度，低置信结果仅用于内部参考，坐席发送前必须可编辑。',
    tags: ['AI 回复', '审核', '坐席'],
    updatedAt: '2026-06-07 08:54:00',
    updatedBy: '李心禾',
    version: 'v0.9',
    remark: '待确认发送前审核要求',
    steps: ['生成回复建议', '展示引用来源', '坐席编辑确认', '记录采纳结果'],
  }),
  'canvas-leaf-risk': createCanvasDetail({
    id: 'canvas-leaf-risk',
    title: '敏感投诉风险升级',
    status: 'published',
    summary: '适用于舆情、赔付、重复投诉、服务态度等敏感风险识别。',
    content: '命中风险标签后自动升级主管，并在工单处理记录中保留触发片段和处置建议。',
    tags: ['风险识别', '投诉', '升级'],
    updatedAt: '2026-06-05 10:18:00',
    updatedBy: '陈沐阳',
    version: 'v1.3',
    remark: '补充风险触发片段留存',
    steps: ['识别风险标签', '保留触发片段', '升级主管处理', '复盘风险知识'],
  }),
  'canvas-leaf-training-new': createCanvasDetail({
    id: 'canvas-leaf-training-new',
    title: '新人首周训练',
    status: 'published',
    summary: '适用于新人坐席首周模拟工单录入和知识检索训练。',
    content: '每天完成模拟工单录入，带教检查分类、优先级、描述完整性和知识引用准确性。',
    tags: ['新人', '训练', '工单录入'],
    updatedAt: '2026-06-02 10:08:00',
    updatedBy: '刘薇',
    version: 'v1.0',
    remark: '新增新人训练流程',
    steps: ['完成模拟工单', '检查字段完整性', '引用知识答案', '带教复盘评分'],
  }),
  'canvas-leaf-complaint': createCanvasDetail({
    id: 'canvas-leaf-complaint',
    title: '典型客诉复盘',
    status: 'published',
    summary: '适用于登录权限、账单争议、服务态度和重复投诉等典型案例复盘。',
    content: '复盘材料包含客户背景、关键节点、错误动作、正确话术和后续知识更新记录。',
    tags: ['客诉', '案例', '复盘'],
    updatedAt: '2026-06-06 19:30:00',
    updatedBy: '宋之言',
    version: 'v1.9',
    remark: '补充案例复盘模板',
    steps: ['还原客户背景', '标记关键节点', '整理正确话术', '更新知识文档'],
  }),
  'canvas-leaf-emotion': createCanvasDetail({
    id: 'canvas-leaf-emotion',
    title: '高情绪用户安抚',
    status: 'published',
    summary: '适用于高情绪沟通中的诉求复述、节奏控制和必要升级。',
    content: '坐席先复述客户诉求，再说明当前可推进动作；涉及赔付、舆情和法律风险时升级主管。',
    tags: ['情绪安抚', '话术', '升级边界'],
    updatedAt: '2026-06-04 16:42:00',
    updatedBy: '张若一',
    version: 'v1.6',
    remark: '补充升级边界说明',
    steps: ['复述客户诉求', '确认当前动作', '稳定沟通节奏', '必要时升级主管'],
  }),
  'canvas-leaf-login': createCanvasDetail({
    id: 'canvas-leaf-login',
    title: '登录失败与 MFA 异常',
    status: 'published',
    summary: '适用于密码错误、MFA 丢失、账号冻结和权限缓存异常。',
    content: 'MFA 异常先核验员工身份，再由系统管理员重置绑定；账号冻结需保留审计日志。',
    tags: ['登录', 'MFA', '权限'],
    updatedAt: '2026-06-05 09:48:00',
    updatedBy: '谢砚青',
    version: 'v1.2',
    remark: '补充 MFA 重置链路',
    steps: ['核验员工身份', '检查账号状态', '重置 MFA 绑定', '保留审计记录'],
  }),
  'canvas-leaf-sync': createCanvasDetail({
    id: 'canvas-leaf-sync',
    title: '数据同步延迟处理',
    status: 'offline',
    summary: '适用于工单、知识、用户权限三类同步延迟。',
    content: '先看队列积压、重试次数和最近发布时间，再判断是否需要手动补偿。',
    tags: ['数据同步', '延迟', '队列'],
    updatedAt: '2026-05-29 21:12:00',
    updatedBy: '郑宁',
    version: 'v1.0',
    remark: '等待新版同步任务接入',
    steps: ['检查队列积压', '查看重试次数', '核对最近发布时间', '执行手动补偿'],
  }),
  'canvas-leaf-monitor': createCanvasDetail({
    id: 'canvas-leaf-monitor',
    title: 'P1 告警通知升级',
    status: 'published',
    summary: '适用于 P1 告警、核心链路不可用和发布期异常。',
    content: 'P1 告警必须同时通知值班经理、平台运维部和业务负责人，静默窗口需在发布记录中说明。',
    tags: ['告警', '值班', 'P1'],
    updatedAt: '2026-06-02 22:05:00',
    updatedBy: '陈沐阳',
    version: 'v1.5',
    remark: '补充静默窗口说明',
    steps: ['确认告警等级', '通知值班经理', '同步业务负责人', '记录处置结论'],
  }),
  'canvas-leaf-export': createCanvasDetail({
    id: 'canvas-leaf-export',
    title: '报表导出失败兜底',
    status: 'draft',
    summary: '适用于大数据量导出、字段缺失和权限不足。',
    content: '导出超过 5 万行时建议改用异步任务；权限不足需确认当前角色是否具备 export 权限码。',
    tags: ['报表', '导出', '兜底'],
    updatedAt: '2026-06-07 09:18:00',
    updatedBy: '谢砚青',
    version: 'v0.8',
    remark: '待补充异步导出入口',
    steps: ['确认导出范围', '检查权限码', '切换异步任务', '反馈下载结果'],
  }),
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

function countCanvasNodes(nodes: KnowledgeCanvasNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countCanvasNodes(node.children ?? []) + countCanvasNodes(node.summaryGroups ?? []), 0);
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
  return createMockResponse(countCanvasNodes(canvasTreeSeed));
}

export function getMockKnowledgeCanvasNodeDetail(id: ApiId) {
  const key = String(id);
  const detail = canvasDetailMap[key];

  if (!detail) {
    throw new Error(`Knowledge canvas node ${id} not found`);
  }

  return createMockResponse(cloneMock(detail));
}
