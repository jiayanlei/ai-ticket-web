import { envConfig } from '@/config';
import { getMockConversationRecords, type ConversationRecordItem } from '@/mock/chat';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export type { ConversationRecordItem } from '@/mock/chat';

export function getConversationRecordListApi(): Promise<ConversationRecordItem[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockConversationRecords());
  }

  return http.get<ConversationRecordItem[], ConversationRecordItem[]>('/ai-agent/conversations');
}
