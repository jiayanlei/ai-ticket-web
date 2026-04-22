import type { RouteRecordRaw } from 'vue-router';

import BasicLayout from '@/layouts/BasicLayout.vue';

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/login/index.vue'),
    meta: {
      title: '登录',
      public: true,
    },
  },
  {
    path: '/',
    name: 'Root',
    component: BasicLayout,
    redirect: '/dashboard/workbench',
    meta: {
      title: '首页',
    },
    children: [
      {
        path: 'dashboard/workbench',
        name: 'DashboardWorkbench',
        component: () => import('@/views/dashboard/workbench/index.vue'),
        meta: {
          title: '工作台首页',
          parentTitle: '工作台',
          keepAlive: true,
        },
      },
      {
        path: 'dashboard/todo',
        name: 'DashboardTodo',
        component: () => import('@/views/dashboard/todo/index.vue'),
        meta: {
          title: '我的待办',
          parentTitle: '工作台',
          keepAlive: true,
        },
      },
      {
        path: 'ticket/list',
        name: 'TicketList',
        component: () => import('@/views/ticket/list/index.vue'),
        meta: {
          title: '工单列表',
          parentTitle: '工单中心',
          keepAlive: true,
        },
      },
      {
        path: 'ticket/create',
        name: 'TicketCreate',
        component: () => import('@/views/ticket/create/index.vue'),
        meta: {
          title: '新建工单',
          parentTitle: '工单中心',
        },
      },
      {
        path: 'ticket/trash',
        name: 'TicketTrash',
        component: () => import('@/views/ticket/trash/index.vue'),
        meta: {
          title: '工单回收站',
          parentTitle: '工单中心',
        },
      },
      {
        path: 'ai/overview',
        name: 'AiOverview',
        component: () => import('@/views/ai/overview/index.vue'),
        meta: {
          title: 'AI 分析总览',
          parentTitle: 'AI 智能分析',
          keepAlive: true,
        },
      },
      {
        path: 'ai/result',
        name: 'AiResult',
        component: () => import('@/views/ai/result/index.vue'),
        meta: {
          title: '智能分析结果',
          parentTitle: 'AI 智能分析',
        },
      },
      {
        path: 'knowledge/documents',
        name: 'KnowledgeDocuments',
        component: () => import('@/views/knowledge/documents/index.vue'),
        meta: {
          title: '知识文档管理',
          parentTitle: '知识库中心',
          keepAlive: true,
        },
      },
      {
        path: 'knowledge/faq',
        name: 'KnowledgeFaq',
        component: () => import('@/views/knowledge/faq/index.vue'),
        meta: {
          title: 'FAQ 管理',
          parentTitle: '知识库中心',
        },
      },
      {
        path: 'analytics/cockpit',
        name: 'AnalyticsCockpit',
        component: () => import('@/views/analytics/cockpit/index.vue'),
        meta: {
          title: '数据驾驶舱',
          parentTitle: '数据分析',
          keepAlive: true,
        },
      },
      {
        path: 'console/codex',
        name: 'CodexConsole',
        component: () => import('@/views/console/codex/index.vue'),
        meta: {
          title: 'Codex 工作台',
          parentTitle: '内置控制台',
          keepAlive: true,
        },
      },
      {
        path: 'system/users',
        name: 'SystemUsers',
        component: () => import('@/views/system/users/index.vue'),
        meta: {
          title: '用户管理',
          parentTitle: '系统管理',
        },
      },
      {
        path: 'system/roles',
        name: 'SystemRoles',
        component: () => import('@/views/system/roles/index.vue'),
        meta: {
          title: '角色管理',
          parentTitle: '系统管理',
        },
      },
      {
        path: 'system/menus',
        name: 'SystemMenus',
        component: () => import('@/views/system/menus/index.vue'),
        meta: {
          title: '菜单管理',
          parentTitle: '系统管理',
        },
      },
    ],
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/exception/Forbidden.vue'),
    meta: {
      title: '无权访问',
      public: true,
    },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/exception/NotFound.vue'),
    meta: {
      title: '页面不存在',
      public: true,
    },
  },
  {
    path: '/500',
    name: 'ServerError',
    component: () => import('@/views/exception/ServerError.vue'),
    meta: {
      title: '服务异常',
      public: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: {
      public: true,
    },
  },
];
