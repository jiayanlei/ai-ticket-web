import type {
  AiAgentLogLevel,
  AiAgentMessageRole,
  AiAgentPlan,
  AiAgentProjectStatus,
  AiAgentTaskType,
} from '@/api/aiAgent';

export type ChatMessageType = AiAgentMessageRole;
export type ActionPlan = AiAgentPlan;
export type ProjectStatus = AiAgentProjectStatus;

export interface QuickTask {
  key: string;
  title: string;
  description: string;
  icon: string;
  taskType: AiAgentTaskType;
  prompt: string;
}

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  time: string;
}

export interface ExecutionLogItem {
  id: string;
  level: AiAgentLogLevel;
  content: string;
  time: string;
}

export interface RecentSession {
  id: string;
  title: string;
  taskType: AiAgentTaskType;
  messages: ChatMessage[];
  plan: ActionPlan;
  logs: ExecutionLogItem[];
}
