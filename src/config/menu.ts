import type { AppMenuItem } from '@/types/menu';

export const appMenus: AppMenuItem[] = [
  {
    key: 'dashboard',
    title: '工作台',
    icon: 'DashboardOutlined',
    children: [
      {
        key: 'dashboard-workbench',
        title: '工作台首页',
        path: '/dashboard/workbench',
      },
      {
        key: 'dashboard-todo',
        title: '我的待办',
        path: '/dashboard/todo',
      },
    ],
  },
  {
    key: 'ticket',
    title: '工单中心',
    icon: 'ProfileOutlined',
    children: [
      {
        key: 'ticket-list',
        title: '工单列表',
        path: '/ticket/list',
      },
      {
        key: 'ticket-create',
        title: '新建工单',
        path: '/ticket/create',
      },
      {
        key: 'ticket-trash',
        title: '工单回收站',
        path: '/ticket/trash',
      },
    ],
  },
  {
    key: 'ai',
    title: 'AI 智能分析',
    icon: 'RobotOutlined',
    children: [
      {
        key: 'ai-overview',
        title: 'AI 分析总览',
        path: '/ai/overview',
      },
      {
        key: 'ai-result',
        title: '智能分析结果',
        path: '/ai/result',
      },
    ],
  },
  {
    key: 'knowledge',
    title: '知识库中心',
    icon: 'BookOutlined',
    children: [
      {
        key: 'knowledge-documents',
        title: '知识文档管理',
        path: '/knowledge/documents',
      },
      {
        key: 'knowledge-faq',
        title: 'FAQ 管理',
        path: '/knowledge/faq',
      },
    ],
  },
  {
    key: 'analytics',
    title: '数据分析',
    icon: 'BarChartOutlined',
    children: [
      {
        key: 'analytics-cockpit',
        title: '数据驾驶舱',
        path: '/analytics/cockpit',
      },
    ],
  },
  {
    key: 'console',
    title: '内置控制台',
    icon: 'CodeOutlined',
    children: [
      {
        key: 'console-codex',
        title: 'Codex 工作台',
        path: '/console/codex',
      },
    ],
  },
  {
    key: 'system',
    title: '系统管理',
    icon: 'SettingOutlined',
    children: [
      {
        key: 'system-users',
        title: '用户管理',
        path: '/system/users',
      },
      {
        key: 'system-roles',
        title: '角色管理',
        path: '/system/roles',
      },
      {
        key: 'system-menus',
        title: '菜单管理',
        path: '/system/menus',
      },
    ],
  },
];
