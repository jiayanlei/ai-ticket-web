import { cleanPayload } from '@/api/types';
import { envConfig } from '@/config';
import {
  mockConfirmAiAgentAction,
  mockGetAiAgentProjectStatus,
  mockGetAiAgentRecentLogs,
  mockSendAiAgentMessage,
} from '@/mock/chat';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export type AiAgentTaskType =
  | 'FRONTEND_ERROR'
  | 'BACKEND_API'
  | 'BACKEND_LOG'
  | 'SQL_GENERATE'
  | 'FRONTEND_DEPLOY'
  | 'BACKEND_DEPLOY'
  | 'GIT_CHECK'
  | 'CHANGE_PLAN'
  | 'NORMAL_CHAT';

export type AiAgentRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AiAgentFileOperation = 'CHECK' | 'CREATE' | 'UPDATE' | 'DELETE';
export type AiAgentLogLevel = 'info' | 'success' | 'warning' | 'error';
export type AiAgentMessageRole = 'user' | 'assistant' | 'system' | 'log' | 'warning' | 'success' | 'error';

export interface AiAgentAffectedFile {
  path: string;
  operation: AiAgentFileOperation;
}

export interface AiAgentPlan {
  taskType: string;
  riskLevel: AiAgentRiskLevel;
  scope: string[];
  affectedFiles: AiAgentAffectedFile[];
  steps: string[];
  needConfirm: boolean;
}

export interface AiAgentProjectStatus {
  frontendProject: string;
  backendProject: string;
  branch: string;
  environment: string;
  hasUncommittedChanges: boolean;
  latestCommit: string;
  latestCommitTime?: string;
}

export interface AiAgentMessage {
  id?: string | number;
  role?: AiAgentMessageRole;
  content: string;
  time?: string;
}

export interface AiAgentLog {
  id?: string | number;
  level: AiAgentLogLevel;
  content: string;
  time?: string;
}

export interface AiAgentChatPayload {
  sessionId: string;
  message: string;
  taskType: AiAgentTaskType;
}

export interface AiAgentChatResult {
  sessionId?: string;
  message?: AiAgentMessage;
  reply?: string;
  content?: string;
  plan?: AiAgentPlan;
  logs?: AiAgentLog[];
}

export interface AiAgentConfirmPayload {
  sessionId: string;
  actionType: string;
  confirm: boolean;
}

export interface AiAgentConfirmResult {
  success?: boolean;
  message?: string;
  plan?: AiAgentPlan;
  logs?: AiAgentLog[];
}

export function sendAiAgentMessage(data: AiAgentChatPayload): Promise<AiAgentChatResult> {
  if (envConfig.useMock) {
    return resolveMockResponse(mockSendAiAgentMessage(data), 260);
  }

  return http.post<AiAgentChatResult, AiAgentChatResult>('/ai-agent/chat', cleanPayload(data));
}

export function getAiAgentProjectStatus(): Promise<AiAgentProjectStatus> {
  if (envConfig.useMock) {
    return resolveMockResponse(mockGetAiAgentProjectStatus(), 120);
  }

  return http.get<AiAgentProjectStatus, AiAgentProjectStatus>('/ai-agent/project/status');
}

export function getAiAgentRecentLogs(): Promise<AiAgentLog[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(mockGetAiAgentRecentLogs(), 120);
  }

  return http.get<AiAgentLog[], AiAgentLog[]>('/ai-agent/logs/recent');
}

export function confirmAiAgentAction(data: AiAgentConfirmPayload): Promise<AiAgentConfirmResult> {
  if (envConfig.useMock) {
    return resolveMockResponse(mockConfirmAiAgentAction(data), 200);
  }

  return http.post<AiAgentConfirmResult, AiAgentConfirmResult>('/ai-agent/action/confirm', cleanPayload(data));
}
