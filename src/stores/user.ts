import { defineStore } from 'pinia';

import { appSettings } from '@/config';
import { getUserInfoApi, loginApi, logoutApi } from '@/api/auth';
import type { LoginParams, UserInfo } from '@/api/auth';
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
    roles: (state) => state.userInfo?.roles ?? [],
  },
  actions: {
    async login(params: LoginParams, remember = true) {
      const { token } = await loginApi(params);
      this.token = token;
      setToken(token, remember);
      await this.fetchUserInfo();
    },
    async fetchUserInfo() {
      if (!this.token) {
        return null;
      }

      this.userInfo = await getUserInfoApi();
      setStorageItem(appSettings.auth.userInfoKey, this.userInfo);
      return this.userInfo;
    },
    async logout() {
      if (this.token) {
        await logoutApi().catch(() => undefined);
      }

      this.resetAuth();
    },
    resetAuth() {
      this.token = '';
      this.userInfo = null;
      clearToken();
      clearRefreshToken();
      removeStorageItem(appSettings.auth.userInfoKey);
    },
  },
});
