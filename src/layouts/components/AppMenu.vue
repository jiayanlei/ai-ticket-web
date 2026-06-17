<template>
  <a-menu
    class="app-menu"
    :class="{ 'app-menu--side': isSideScope }"
    :open-keys="menuOpenKeys"
    :selected-keys="selectedKeys"
    :theme="theme"
    :mode="mode"
    :disabled-overflow="isTopScope"
    :inline-indent="isSideScope ? 18 : 24"
    :motion="menuMotion"
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
const menuMotion = computed(() => (isSideScope.value ? { css: false } : undefined));
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
  { immediate: true },
);

watch(
  [() => route.path, displayedMenus],
  () => {
    if (!renderChildrenAsSubmenu.value) {
      return;
    }

    if (isSideScope.value) {
      setOpenKeys(findAncestorKeys(displayedMenus.value, route.path));
      return;
    }

    setOpenKeys([]);
  },
  { immediate: true },
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

  setOpenKeys(keys.map(String));
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

  setOpenKeys([...currentKeys]);
}

function setOpenKeys(keys: string[]) {
  if (isSameKeys(openKeys.value, keys)) {
    return;
  }

  openKeys.value = keys;
}

function isSameKeys(currentKeys: string[], nextKeys: string[]) {
  return currentKeys.length === nextKeys.length && currentKeys.every((key, index) => key === nextKeys[index]);
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

<style scoped lang="scss">
.app-menu--side {
  :deep(.ant-menu-item),
  :deep(.ant-menu-submenu-title) {
    transition:
      background-color 0.24s ease,
      color 0.24s ease,
      transform 0.24s ease;
  }

  :deep(.ant-menu-item:active),
  :deep(.ant-menu-submenu-title:active) {
    transform: translateX(2px);
  }

  :deep(.ant-menu-item-selected),
  :deep(.ant-menu-submenu-open > .ant-menu-submenu-title) {
    animation: menu-echo 0.48s ease-out;
  }
}

@keyframes menu-echo {
  0% {
    box-shadow:
      inset 3px 0 0 var(--app-primary),
      0 0 0 0 rgba(79, 123, 255, 0.24);
    transform: translateX(0);
  }

  42% {
    box-shadow:
      inset 3px 0 0 var(--app-primary),
      0 0 0 6px rgba(79, 123, 255, 0);
    transform: translateX(3px);
  }

  100% {
    box-shadow:
      inset 3px 0 0 var(--app-primary),
      0 0 0 0 rgba(79, 123, 255, 0);
    transform: translateX(0);
  }
}
</style>
