<template>
  <a-menu
    :items="menuItems"
    :open-keys="openKeys"
    :selected-keys="selectedKeys"
    :theme="theme"
    :mode="mode"
    @click="handleMenuClick"
    @open-change="handleOpenChange"
  />
</template>

<script setup lang="ts">
import {
  BarChartOutlined,
  BookOutlined,
  CodeOutlined,
  DashboardOutlined,
  ProfileOutlined,
  RobotOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import { computed, h, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { appMenus } from '@/config/menu';
import type { AppMenuItem } from '@/types/menu';

withDefaults(
  defineProps<{
    mode?: 'inline' | 'horizontal';
    theme?: 'light' | 'dark';
  }>(),
  {
    mode: 'inline',
    theme: 'light',
  },
);

const route = useRoute();
const router = useRouter();
const openKeys = ref<string[]>([]);

const iconMap = {
  BarChartOutlined,
  BookOutlined,
  CodeOutlined,
  DashboardOutlined,
  ProfileOutlined,
  RobotOutlined,
  SettingOutlined,
};

const menuItems = computed<MenuProps['items']>(() => appMenus.map(toAntMenuItem));
const selectedKeys = computed(() => findSelectedKeys(appMenus, route.path));

watch(
  () => route.path,
  (path) => {
    const parentKey = findParentKey(appMenus, path);
    if (parentKey) {
      openKeys.value = [parentKey];
    }
  },
  { immediate: true },
);

function toAntMenuItem(item: AppMenuItem): NonNullable<MenuProps['items']>[number] {
  const icon = typeof item.icon === 'string' ? iconMap[item.icon as keyof typeof iconMap] : item.icon;

  return {
    key: item.path ?? item.key,
    label: item.title,
    title: item.title,
    icon: icon ? () => h(icon) : undefined,
    children: item.children?.map(toAntMenuItem),
  } as NonNullable<MenuProps['items']>[number];
}

function findSelectedKeys(menus: AppMenuItem[], path: string): string[] {
  for (const item of menus) {
    if (item.path === path) {
      return [item.path];
    }
    if (item.children) {
      const childKeys = findSelectedKeys(item.children, path);
      if (childKeys.length) {
        return childKeys;
      }
    }
  }

  return [];
}

function findParentKey(menus: AppMenuItem[], path: string, parentKey?: string): string | undefined {
  for (const item of menus) {
    if (item.path === path) {
      return parentKey;
    }
    if (item.children) {
      const matchedKey = findParentKey(item.children, path, item.key);
      if (matchedKey) {
        return matchedKey;
      }
    }
  }

  return undefined;
}

function handleMenuClick({ key }: { key: string }) {
  if (key.startsWith('/')) {
    router.push(key);
  }
}

function handleOpenChange(keys: (string | number)[]) {
  openKeys.value = keys.map(String);
}
</script>
