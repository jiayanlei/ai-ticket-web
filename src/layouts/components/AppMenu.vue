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
  ApartmentOutlined,
  BarChartOutlined,
  BookOutlined,
  CodeOutlined,
  DashboardOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  HomeOutlined,
  MenuOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  RobotOutlined,
  ScheduleOutlined,
  SettingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import { computed, h, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { usePermissionStore } from '@/stores/permission';
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
const permissionStore = usePermissionStore();
const openKeys = ref<string[]>([]);

const iconMap = {
  apartment: ApartmentOutlined,
  'area-chart': BarChartOutlined,
  barChart: BarChartOutlined,
  book: BookOutlined,
  building: ApartmentOutlined,
  code: CodeOutlined,
  'code-sandbox': CodeOutlined,
  dashboard: DashboardOutlined,
  delete: DeleteOutlined,
  'file-search': FileSearchOutlined,
  home: HomeOutlined,
  list: UnorderedListOutlined,
  menu: MenuOutlined,
  plusCircle: PlusCircleOutlined,
  'plus-circle': PlusCircleOutlined,
  profile: ProfileOutlined,
  questionCircle: QuestionCircleOutlined,
  'question-circle': QuestionCircleOutlined,
  read: ReadOutlined,
  robot: RobotOutlined,
  schedule: ScheduleOutlined,
  setting: SettingOutlined,
  settings: SettingOutlined,
  shield: TeamOutlined,
  team: TeamOutlined,
  ticket: ProfileOutlined,
  unorderedList: UnorderedListOutlined,
  'unordered-list': UnorderedListOutlined,
  user: UserOutlined,
};

const menuItems = computed<MenuProps['items']>(() => permissionStore.menus.map(toAntMenuItem));
const selectedKeys = computed(() => findSelectedKeys(permissionStore.menus, route.path));

watch(
  () => route.path,
  (path) => {
    openKeys.value = findAncestorKeys(permissionStore.menus, path);
  },
  { immediate: true },
);

function toAntMenuItem(item: AppMenuItem): NonNullable<MenuProps['items']>[number] {
  const iconKey =
    typeof item.icon === 'string'
      ? item.icon
          .replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
          .replace(/^-/, '')
      : undefined;
  const icon = iconKey ? iconMap[iconKey as keyof typeof iconMap] : undefined;

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
      return [path];
    }
    if (item.children?.length) {
      const childKeys = findSelectedKeys(item.children, path);
      if (childKeys.length) {
        return childKeys;
      }
    }
  }

  return [];
}

function findAncestorKeys(menus: AppMenuItem[], path: string, ancestors: string[] = []): string[] {
  for (const item of menus) {
    const currentAncestors = item.path ? [...ancestors, item.path] : ancestors;

    if (item.path === path) {
      return ancestors;
    }
    if (item.children?.length) {
      const matched = findAncestorKeys(item.children, path, currentAncestors);
      if (matched.length) {
        return matched;
      }
    }
  }

  return [];
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
