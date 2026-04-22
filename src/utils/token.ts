import { appSettings } from '@/config';
import { getStorageItemFromAny, removeStorageItem, setStorageItem } from '@/utils/storage';

const { tokenKey, refreshTokenKey } = appSettings.auth;

export function getToken(): string {
  return getStorageItemFromAny<string>(tokenKey, '') ?? '';
}

export function setToken(token: string, remember = true) {
  clearToken();

  const storageType = appSettings.auth.storageType === 'session' || !remember ? 'session' : 'local';
  setStorageItem(tokenKey, token, storageType);
}

export function clearToken() {
  removeStorageItem(tokenKey);
}

export function getRefreshToken(): string {
  return getStorageItemFromAny<string>(refreshTokenKey, '') ?? '';
}

export function setRefreshToken(token: string, remember = true) {
  clearRefreshToken();

  const storageType = appSettings.auth.storageType === 'session' || !remember ? 'session' : 'local';
  setStorageItem(refreshTokenKey, token, storageType);
}

export function clearRefreshToken() {
  removeStorageItem(refreshTokenKey);
}
