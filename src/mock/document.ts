import type { UploadFileResult } from '@/api/file';
import { createMockId, createMockResponse } from '@/mock/core';

export interface DocumentCenterItem {
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

export interface DocumentDirectoryItem {
  key: string;
  title: string;
  description: string;
}

export interface CreateDocumentCenterPayload {
  fileName: string;
  category: string;
  owner?: string;
  size?: string;
  format?: string;
}

export const documentDirectories: DocumentDirectoryItem[] = [
  { key: 'all', title: '全部文件', description: '文档中心全部资料' },
  { key: '培训资料', title: '培训资料', description: '新人训练、质检评分、案例复盘' },
  { key: '操作手册', title: '操作手册', description: '坐席操作、系统配置、排查步骤' },
  { key: '业务通知', title: '业务通知', description: '政策调整、流程变更、服务公告' },
  { key: '制度文档', title: '制度文档', description: 'SLA、权限、安全合规制度' },
  { key: '模板文件', title: '模板文件', description: '话术模板、导入模板、报表样例' },
  { key: '归档文件', title: '归档文件', description: '历史复盘与已下线资料' },
];

let documentSeeds: DocumentCenterItem[] = [
  { id: 'doc-center-1', fileName: '2026Q2_工单SLA复盘.pdf', category: '制度文档', owner: '宋之言', size: '2.4 MB', format: 'PDF', parseStatus: 'SUCCESS', updateTime: '2026-06-06 18:20:00', summary: '已生成 14 段知识摘要并同步到知识库。' },
  { id: 'doc-center-2', fileName: '一线坐席培训手册_v6.docx', category: '培训资料', owner: '刘薇', size: '6.8 MB', format: 'DOCX', parseStatus: 'PARSING', updateTime: '2026-06-07 09:05:00', summary: '正在抽取目录、FAQ 和标准话术。' },
  { id: 'doc-center-3', fileName: '高优工单升级流程.png', category: '操作手册', owner: '陈沐阳', size: '820 KB', format: 'PNG', parseStatus: 'UPLOADING', updateTime: '2026-06-07 09:21:00', summary: '正在上传原始文件与结构化标注。' },
  { id: 'doc-center-4', fileName: '福利政策常见问答.xlsx', category: '业务通知', owner: '林知远', size: '1.2 MB', format: 'XLSX', parseStatus: 'FAILED', updateTime: '2026-06-05 17:41:00', summary: '表格存在合并单元格异常，建议重新上传。' },
  { id: 'doc-center-5', fileName: 'VIP客户转派规则_202606.docx', category: '操作手册', owner: '陈沐阳', size: '1.6 MB', format: 'DOCX', parseStatus: 'SUCCESS', updateTime: '2026-06-06 16:22:00', summary: '已抽取 VIP 识别、专席转派和主管同步规则。' },
  { id: 'doc-center-6', fileName: 'AI分类置信度复核样本.csv', category: '模板文件', owner: '郑宁', size: '4.1 MB', format: 'CSV', parseStatus: 'SUCCESS', updateTime: '2026-06-06 13:50:00', summary: '已生成 126 条低置信分类样本并关联复核标签。' },
  { id: 'doc-center-7', fileName: '低分回访SOP草稿.md', category: '操作手册', owner: '张若一', size: '236 KB', format: 'MD', parseStatus: 'PARSING', updateTime: '2026-06-07 10:28:00', summary: '正在拆分回访节点、责任人和复盘字段。' },
  { id: 'doc-center-8', fileName: '账号安全与MFA处理手册.pdf', category: '制度文档', owner: '谢砚青', size: '3.3 MB', format: 'PDF', parseStatus: 'SUCCESS', updateTime: '2026-06-05 09:48:00', summary: '已同步账号开通、权限复核、MFA 重置和审计留痕要求。' },
  { id: 'doc-center-9', fileName: '客服质检评分细则_v2.3.xlsx', category: '培训资料', owner: '宋之言', size: '980 KB', format: 'XLSX', parseStatus: 'SUCCESS', updateTime: '2026-06-05 18:10:00', summary: '已生成评分项、扣分规则和知识缺口标签。' },
  { id: 'doc-center-10', fileName: '报表导出失败案例包.zip', category: '归档文件', owner: '谢砚青', size: '12.5 MB', format: 'ZIP', parseStatus: 'FAILED', updateTime: '2026-06-07 09:18:00', summary: '压缩包内存在空文件，建议拆分后重新上传。' },
  { id: 'doc-center-11', fileName: '高情绪用户沟通录音转写.txt', category: '培训资料', owner: '李心禾', size: '428 KB', format: 'TXT', parseStatus: 'PARSING', updateTime: '2026-06-04 16:42:00', summary: '正在识别安抚话术、升级边界和敏感风险片段。' },
  { id: 'doc-center-12', fileName: '灰度发布前检查清单.pdf', category: '业务通知', owner: '林知远', size: '760 KB', format: 'PDF', parseStatus: 'SUCCESS', updateTime: '2026-06-03 17:45:00', summary: '已同步 mock 开关、API 地址、动态路由和回滚包检查项。' },
];

export function getMockDocumentCenterList() {
  return createMockResponse(documentSeeds);
}

export function getMockDocumentDirectories() {
  return createMockResponse(documentDirectories);
}

export function createMockDocumentCenterItem(payload: CreateDocumentCenterPayload) {
  const record: DocumentCenterItem = {
    id: createMockId('doc-center'),
    fileName: payload.fileName,
    category: payload.category,
    owner: payload.owner ?? '当前用户',
    size: payload.size ?? '0 KB',
    format: payload.format ?? getFileFormat(payload.fileName),
    parseStatus: 'UPLOADING',
    updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    summary: '文件已上传，等待本地 mock 解析。',
  };
  documentSeeds.unshift(record);
  return createMockResponse(record);
}

export function deleteMockDocumentCenterItem(id: string) {
  documentSeeds = documentSeeds.filter((item) => item.id !== id);
  return createMockResponse(undefined);
}

export function mockUploadFile(file: File) {
  return createMockResponse<UploadFileResult>({
    id: createMockId('upload'),
    url: URL.createObjectURL(file),
    fileName: file.name,
    originalName: file.name,
    size: file.size,
    contentType: file.type || 'application/octet-stream',
  });
}

export function mockDownloadFile(url: string) {
  return new Blob([`Mock download generated for ${url}`], { type: 'text/plain;charset=utf-8' });
}

function getFileFormat(fileName: string) {
  const ext = fileName.split('.').pop();
  return ext ? ext.toUpperCase() : 'UNKNOWN';
}
