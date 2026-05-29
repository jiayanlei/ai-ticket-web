import type { RouteRecordRaw } from 'vue-router';

import BasicLayout from '@/layouts/BasicLayout.vue';
import { LOGIN_PATH } from '@/router/constants';

export const ROOT_ROUTE_NAME = 'Root';
export const CATCH_ALL_ROUTE_NAME = 'CatchAllNotFound';

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: LOGIN_PATH,
    name: 'Login',
    component: () => import('@/views/auth/login/index.vue'),
    meta: {
      title: '登录',
      public: true,
    },
  },
  {
    path: '/',
    name: ROOT_ROUTE_NAME,
    component: BasicLayout,
    meta: {
      title: '首页',
    },
    children: [
      {
        path: '404',
        name: 'NotFound',
        component: () => import('@/views/exception/NotFound.vue'),
        meta: {
          title: '页面不存在',
          hidden: true,
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
    path: '/500',
    name: 'ServerError',
    component: () => import('@/views/exception/ServerError.vue'),
    meta: {
      title: '服务异常',
      public: true,
    },
  },
];

export const catchAllRoute: RouteRecordRaw = {
  path: ':pathMatch(.*)*',
  name: CATCH_ALL_ROUTE_NAME,
  redirect: '/404',
  meta: {
    hidden: true,
  },
};
