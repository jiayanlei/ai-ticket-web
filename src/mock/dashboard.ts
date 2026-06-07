import { createMockResponse } from '@/mock/core';

export function getMockDashboardSummary() {
  return createMockResponse({
    coreMetrics: [
      { key: 'todayTickets', label: '今日工单总量', value: 4268, unit: '件', trend: '+18.6%' },
      { key: 'resolvedRate', label: '24h 解决率', value: 91.2, unit: '%', trend: '+4.1%' },
      { key: 'aiCoverage', label: 'AI 覆盖率', value: 94.1, unit: '%', trend: '+6.0%' },
      { key: 'timeout', label: '超时工单', value: 36, unit: '件', trend: '-8' },
    ],
    sourceDistribution: [
      { name: '电话工单', value: 2146 },
      { name: 'Web 工单', value: 826 },
      { name: '企业微信', value: 548 },
      { name: '人工录入', value: 278 },
    ],
    efficiency: {
      avgFirstResponseMinutes: 11,
      avgResolveHours: 4.8,
      transferRate: 13.2,
      reopenRate: 2.7,
    },
  });
}
