import type { RouteRecordRaw } from 'vue-router';

import BasicLayout from '@/layouts/BasicLayout.vue';
import { HOME_PATH, LOGIN_PATH } from '@/router/constants';

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
    name: 'Root',
    component: BasicLayout,
    redirect: HOME_PATH,
    meta: {
      title: '首页',
    },
    children: [],
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
