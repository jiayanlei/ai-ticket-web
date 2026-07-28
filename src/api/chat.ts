import type { AiAgentTaskType } from '@/api/aiAgent';
import { http } from '@/utils/http';

export interface ConversationRecordItem {
  id: string;
  sessionId: string;
  title: string;
  taskType: AiAgentTaskType;
  userName: string;
  lastMessage: string;
  status: 'completed' | 'waiting' | 'warning';
  messageCount: number;
  updatedAt: string;
}

export function getConversationRecordListApi(): Promise<ConversationRecordItem[]> {
  return http.get<ConversationRecordItem[], ConversationRecordItem[]>('/ai-agent/conversations');
}
