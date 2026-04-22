import { createRouter, createWebHistory } from 'vue-router';

import { setupRouterGuards } from '@/router/guards';
import { constantRoutes } from '@/router/routes';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

setupRouterGuards(router);

export default router;
