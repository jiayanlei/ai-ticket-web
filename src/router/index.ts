import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';

import { envConfig } from '@/config';
import { setupRouterGuards } from '@/router/guards';
import { constantRoutes } from '@/router/routes';

const createHistory = envConfig.routerHistory === 'hash' ? createWebHashHistory : createWebHistory;

const router = createRouter({
  history: createHistory(envConfig.publicPath),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

setupRouterGuards(router);

export default router;
