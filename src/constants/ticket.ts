import type { TicketPriority, TicketStatus } from '@/api/workOrder';

export const ticketStatusOptions: { label: string; value: TicketStatus; color: string }[] = [
  { label: '新建', value: 'NEW', color: 'orange' },
  { label: '处理中', value: 'PROCESSING', color: 'blue' },
  { label: '挂起', value: 'PENDING', color: 'gold' },
  { label: '已解决', value: 'RESOLVED', color: 'green' },
  { label: '已关闭', value: 'CLOSED', color: 'default' },
];

export const ticketPriorityOptions: { label: string; value: TicketPriority; color: string }[] = [
  { label: '低', value: 'LOW', color: 'green' },
  { label: '普通', value: 'NORMAL', color: 'blue' },
  { label: '高', value: 'HIGH', color: 'orange' },
  { label: '紧急', value: 'URGENT', color: 'red' },
];

export function getTicketStatusMeta(status?: string) {
  return ticketStatusOptions.find((item) => item.value === status) ?? { label: status || '-', color: 'default' };
}

export function getTicketPriorityMeta(priority?: string) {
  return ticketPriorityOptions.find((item) => item.value === priority) ?? { label: priority || '-', color: 'default' };
}
