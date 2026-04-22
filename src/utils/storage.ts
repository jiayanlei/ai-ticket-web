import { appSettings } from '@/config';
import type { StorageType } from '@/config';

type StorageValue = string | number | boolean | object | null;

const memoryStorage = new Map<string, string>();

function canUseWebStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getWebStorage(type: StorageType): Storage | undefined {
  if (!canUseWebStorage()) {
    return undefined;
  }

  return type === 'session' ? window.sessionStorage : window.localStorage;
}

function serialize(value: StorageValue) {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function deserialize<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export function buildStorageKey(key: string) {
  const prefix = appSettings.cache.cachePrefix;
  return key.startsWith(prefix) ? key : `${prefix}${key}`;
}

export function getActiveStorageType(): StorageType {
  return appSettings.auth.storageType;
}

export function getStorageItem<T>(key: string, defaultValue?: T, storageType = getActiveStorageType()): T | undefined {
  const storageKey = buildStorageKey(key);
  const storage = getWebStorage(storageType);
  const value = storage ? storage.getItem(storageKey) : memoryStorage.get(storageKey);

  if (value === null || value === undefined) {
    return defaultValue;
  }

  return deserialize<T>(value);
}

export function getStorageItemFromAny<T>(key: string, defaultValue?: T): T | undefined {
  const localValue = getStorageItem<T>(key, undefined, 'local');

  if (localValue !== undefined) {
    return localValue;
  }

  return getStorageItem<T>(key, defaultValue, 'session');
}

export function setStorageItem<T extends StorageValue>(key: string, value: T, storageType = getActiveStorageType()) {
  const storageKey = buildStorageKey(key);
  const storage = getWebStorage(storageType);
  const serializedValue = serialize(value);

  if (storage) {
    storage.setItem(storageKey, serializedValue);
    return;
  }

  memoryStorage.set(storageKey, serializedValue);
}

export function removeStorageItem(key: string, storageType?: StorageType) {
  const storageKey = buildStorageKey(key);
  const targetTypes: StorageType[] = storageType ? [storageType] : ['local', 'session'];

  targetTypes.forEach((type) => {
    getWebStorage(type)?.removeItem(storageKey);
  });

  memoryStorage.delete(storageKey);
}
