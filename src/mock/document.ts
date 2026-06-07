import type { UploadFileResult } from '@/api/file';
import { createMockId, createMockResponse } from '@/mock/core';

export interface DocumentCenterItem {
  id: string;
  fileName: string;
  category: string;
  owner: string;
  size: string;
  parseStatus: 'UPLOADING' | 'PARSING' | 'SUCCESS' | 'FAILED';
  updateTime: string;
  summary: string;
}

const documentSeeds: DocumentCenterItem[] = [
  { id: 'doc-center-1', fileName: '2026Q2_工单SLA复盘.pdf', category: '制度文档', owner: '宋之言', size: '2.4 MB', parseStatus: 'SUCCESS', updateTime: '2026-06-06 18:20:00', summary: '已生成 14 段知识摘要并同步到知识库。' },
  { id: 'doc-center-2', fileName: '一线坐席培训手册_v6.docx', category: '员工手册', owner: '刘薇', size: '6.8 MB', parseStatus: 'PARSING', updateTime: '2026-06-07 09:05:00', summary: '正在抽取目录、FAQ 和标准话术。' },
  { id: 'doc-center-3', fileName: '高优工单升级流程.png', category: '流程规范', owner: '陈沐阳', size: '820 KB', parseStatus: 'UPLOADING', updateTime: '2026-06-07 09:21:00', summary: '正在上传原始文件与结构化标注。' },
  { id: 'doc-center-4', fileName: '福利政策常见问答.xlsx', category: '福利政策', owner: '林知远', size: '1.2 MB', parseStatus: 'FAILED', updateTime: '2026-06-05 17:41:00', summary: '表格存在合并单元格异常，建议重新上传。' },
];

export function getMockDocumentCenterList() {
  return createMockResponse(documentSeeds);
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
