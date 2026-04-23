import { defineStore } from 'pinia';
import type { Router } from 'vue-router';

import { appSettings } from '@/config';
import { getUserInfoApi, loginApi, logoutApi } from '@/api/auth';
import type { LoginParams, UserInfo } from '@/api/auth';
import { useAppStore } from '@/stores/app';
import { usePermissionStore } from '@/stores/permission';
import { useTabsStore } from '@/stores/tabs';
import { clearRefreshToken, clearToken, getToken, setToken } from '@/utils/token';
import { getStorageItemFromAny, removeStorageItem, setStorageItem } from '@/utils/storage';

interface UserState {
  token: string;
  userInfo: UserInfo | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken(),
    userInfo: getStorageItemFromAny<UserInfo | null>(appSettings.auth.userInfoKey, null) ?? null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    displayName: (state) => state.userInfo?.nickname || state.userInfo?.username || '管理员',
    permissions: (state) => state.userInfo?.permissions ?? [],
    roles: (state) => state.userInfo?.roles ?? [],
  },
  actions: {
    async login(params: LoginParams, remember = true, router?: Router) {
      const { token } = await loginApi(params);
      this.token = token;
      setToken(token, remember);
      await this.fetchUserInfo();
      if (router) {
        await usePermissionStore().ensureDynamicRoutes(router);
      }
    },
    async fetchUserInfo() {
      if (!this.token) {
        return null;
      }

      this.userInfo = await getUserInfoApi();
      setStorageItem(appSettings.auth.userInfoKey, this.userInfo);
      return this.userInfo;
    },
    async logout(router?: Router) {
      if (this.token) {
        await logoutApi().catch(() => undefined);
      }

      this.resetAuth(router);
    },
    resetAuth(router?: Router) {
      this.token = '';
      this.userInfo = null;
      clearToken();
      clearRefreshToken();
      removeStorageItem(appSettings.auth.userInfoKey);
      useTabsStore().clearTabs();
      usePermissionStore().resetDynamicRoutes(router);
      useAppStore().resetKeepAlive();
    },
  },
});
