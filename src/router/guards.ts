import type { Router } from 'vue-router';

import { appSettings, envConfig } from '@/config';
import { HOME_PATH, LOGIN_PATH, ROUTE_WHITE_LIST } from '@/router/constants';
import { useUserStore } from '@/stores/user';

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    const userStore = useUserStore();
    const isPublicRoute = Boolean(to.meta.public) || ROUTE_WHITE_LIST.includes(to.path);
    const title = to.meta.title ? `${String(to.meta.title)} - ${envConfig.appTitle}` : envConfig.appTitle;

    document.title = title;

    if (!appSettings.system.enableRouteGuard) {
      return true;
    }

    if (userStore.isLoggedIn && to.path === LOGIN_PATH) {
      return HOME_PATH;
    }

    if (isPublicRoute) {
      return true;
    }

    if (!userStore.isLoggedIn) {
      return {
        path: LOGIN_PATH,
        query: {
          redirect: to.fullPath,
        },
      };
    }

    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo();
      } catch {
        userStore.resetAuth();
        return {
          path: LOGIN_PATH,
          query: {
            redirect: to.fullPath,
          },
        };
      }
    }

    const requiredRoles = to.meta.roles;
    const shouldCheckFrontendPermission =
      appSettings.system.enablePermission && appSettings.auth.permissionMode === 'frontend';

    if (
      shouldCheckFrontendPermission &&
      requiredRoles?.length &&
      !requiredRoles.some((role) => userStore.roles.includes(role))
    ) {
      return '/403';
    }

    return true;
  });
}
