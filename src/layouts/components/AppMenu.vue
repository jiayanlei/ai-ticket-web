<template>
  <a-menu
    :open-keys="menuOpenKeys"
    :selected-keys="selectedKeys"
    :theme="theme"
    :mode="mode"
    :trigger-sub-menu-action="isTopScope ? 'click' : undefined"
    @open-change="handleOpenChange"
  >
    <AppMenuNode
      v-for="item in displayedMenus"
      :key="item.key"
      :item="item"
      :render-children-as-submenu="renderChildrenAsSubmenu"
      @navigate="handleNavigate"
      @toggle="handleToggle"
    />
  </a-menu>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppMenuNode from '@/layouts/components/AppMenuNode.vue';
import { useAppStore } from '@/stores/app';
import { usePermissionStore } from '@/stores/permission';
import type { AppMenuItem } from '@/types/menu';

const props = withDefaults(
  defineProps<{
    mode?: 'inline' | 'horizontal';
    theme?: 'light' | 'dark';
    scope?: 'side' | 'top';
  }>(),
  {
    mode: 'inline',
    theme: 'light',
    scope: 'side',
  },
);

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const permissionStore = usePermissionStore();
const openKeys = ref<string[]>([]);

const isTopScope = computed(() => props.scope === 'top');
const isSideScope = computed(() => props.scope === 'side');
const isMixedMenuMode = computed(() => appStore.layout.menuMode === 'mixed');
const allMenus = computed(() => permissionStore.menus);
const currentRouteRootMenu = computed(() => findRootMenuByPath(allMenus.value, route.path));
const activeRootMenu = computed(
  () =>
    allMenus.value.find((item) => item.key === permissionStore.activeRootMenuKey) ??
    currentRouteRootMenu.value ??
    allMenus.value[0],
);

const displayedMenus = computed(() => {
  if (isTopScope.value) {
    return allMenus.value;
  }

  if (isMixedMenuMode.value) {
    return activeRootMenu.value?.children ?? [];
  }

  return allMenus.value;
});

const renderChildrenAsSubmenu = computed(() => !(isTopScope.value && isMixedMenuMode.value));
const selectedKeys = computed(() => {
  if (isTopScope.value) {
    const topKey = isMixedMenuMode.value
      ? permissionStore.activeRootMenuKey || currentRouteRootMenu.value?.key
      : currentRouteRootMenu.value?.key || permissionStore.activeRootMenuKey;

    return topKey ? [topKey] : [];
  }

  const matchedItem = findSelectedMenuItem(displayedMenus.value, route.path);
  return matchedItem ? [matchedItem.key] : [];
});

const menuOpenKeys = computed(() => (renderChildrenAsSubmenu.value ? openKeys.value : undefined));

watch(
  [() => route.path, allMenus],
  () => {
    const matchedRoot = findRootMenuByPath(allMenus.value, route.path);

    if (matchedRoot) {
      permissionStore.setActiveRootMenuKey(matchedRoot.key);
    }
  },
  { immediate: true, deep: true },
);

watch(
  [() => route.path, displayedMenus],
  () => {
    if (!renderChildrenAsSubmenu.value) {
      return;
    }

    if (isSideScope.value) {
      openKeys.value = findAncestorKeys(displayedMenus.value, route.path);
      return;
    }

    openKeys.value = [];
  },
  { immediate: true, deep: true },
);

function findSelectedMenuItem(menus: AppMenuItem[], path: string): AppMenuItem | undefined {
  for (const item of menus) {
    if (item.path === path) {
      return item;
    }

    if (item.children?.length) {
      const childMatched = findSelectedMenuItem(item.children, path);
      if (childMatched) {
        return childMatched;
      }
    }
  }

  return undefined;
}

function findAncestorKeys(menus: AppMenuItem[], path: string, ancestors: string[] = []): string[] {
  for (const item of menus) {
    const hasChildren = Boolean(item.children?.length);
    const nextAncestors = hasChildren ? [...ancestors, item.key] : ancestors;

    if (item.path === path) {
      return ancestors;
    }

    if (hasChildren) {
      const matched = findAncestorKeys(item.children ?? [], path, nextAncestors);
      if (matched.length) {
        return matched;
      }
    }
  }

  return [];
}

function handleNavigate(item: AppMenuItem) {
  const hasChildren = Boolean(item.children?.length);

  if (isTopScope.value && isMixedMenuMode.value) {
    permissionStore.setActiveRootMenuKey(item.key);

    if (hasChildren) {
      return;
    }
  } else if (hasChildren) {
    return;
  }

  const targetPath = item.path;

  if (!targetPath || targetPath === route.path) {
    return;
  }

  const matchedRoot = findRootMenuByPath(allMenus.value, targetPath);
  if (matchedRoot) {
    permissionStore.setActiveRootMenuKey(matchedRoot.key);
  }

  router.push(targetPath);
}

function handleOpenChange(keys: (string | number)[]) {
  if (!renderChildrenAsSubmenu.value) {
    return;
  }

  openKeys.value = keys.map(String);
}

function handleToggle(item: AppMenuItem) {
  if (!item.children?.length) {
    return;
  }

  if (isTopScope.value && isMixedMenuMode.value) {
    permissionStore.setActiveRootMenuKey(item.key);
    return;
  }

  const currentKeys = new Set(openKeys.value);

  if (currentKeys.has(item.key)) {
    currentKeys.delete(item.key);
  } else if (isTopScope.value) {
    currentKeys.clear();
    currentKeys.add(item.key);
  } else {
    currentKeys.add(item.key);
  }

  openKeys.value = [...currentKeys];
}

function findRootMenuByPath(menus: AppMenuItem[], path: string): AppMenuItem | undefined {
  return menus.find((item) => containsPath(item, path));
}

function containsPath(item: AppMenuItem, path: string): boolean {
  if (item.path === path) {
    return true;
  }

  return Boolean(item.children?.some((child) => containsPath(child, path)));
}
</script>
