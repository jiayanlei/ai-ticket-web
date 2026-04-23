<template>
  <a-layout-header class="app-header" :class="{ 'app-header--fixed': appStore.layout.fixedHeader }">
    <div class="app-header__left">
      <a-button v-if="showSiderControl" type="text" class="app-header__trigger" @click="appStore.toggleSidebar">
        <template #icon>
          <MenuFoldOutlined v-if="!appStore.layout.sidebarCollapsed" />
          <MenuUnfoldOutlined v-else />
        </template>
      </a-button>

      <div class="app-header__brand">
        <span v-if="appStore.layout.showLogo" class="app-header__logo">AI</span>
        <span class="app-header__title">{{ envConfig.appTitle }}</span>
      </div>
    </div>

    <AppTopMenu v-if="showTopMenu" />

    <div class="app-header__right">
      <a-tooltip v-if="appSettings.app.showSearch" title="全局搜索">
        <a-button type="text" @click="handleSearch">
          <template #icon>
            <SearchOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-tooltip v-if="appSettings.app.showRefreshButton" title="刷新当前页">
        <a-button type="text" @click="handleRefresh">
          <template #icon>
            <ReloadOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-tooltip v-if="appSettings.app.showFullscreenButton" title="全屏">
        <a-button type="text" @click="toggleFullscreen">
          <template #icon>
            <FullscreenOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-tooltip title="布局设置预留">
        <a-button type="text" @click="settingsOpen = true">
          <template #icon>
            <SettingOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-dropdown trigger="click">
        <button class="app-header__user" type="button">
          <a-avatar size="small">{{ userInitial }}</a-avatar>
          <span class="app-header__username">{{ userStore.displayName }}</span>
        </button>
        <template #overlay>
          <a-menu>
            <a-menu-item key="profile" disabled>用户信息预留</a-menu-item>
            <a-menu-divider />
            <a-menu-item key="logout" @click="handleLogout">退出登录</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>

    <AppLayoutSettings v-model:open="settingsOpen" />
  </a-layout-header>
</template>

<script setup lang="ts">
import {
  FullscreenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { appSettings, envConfig } from '@/config';
import AppLayoutSettings from '@/layouts/components/AppLayoutSettings.vue';
import AppTopMenu from '@/layouts/components/AppTopMenu.vue';
import { LOGIN_PATH } from '@/router/constants';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

const appStore = useAppStore();
const userStore = useUserStore();
const router = useRouter();
const settingsOpen = ref(false);
const showTopMenu = computed(() => ['top', 'mixed'].includes(appStore.layout.menuMode));
const showSiderControl = computed(() => ['side', 'mixed'].includes(appStore.layout.menuMode));
const userInitial = computed(() => userStore.displayName.slice(0, 1));

function handleSearch() {
  message.info('全局搜索能力已通过配置预留');
}

function handleRefresh() {
  router.go(0);
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    return;
  }

  await document.exitFullscreen();
}

async function handleLogout() {
  await userStore.logout(router);
  message.success('已退出登录');
  router.replace(LOGIN_PATH);
}
</script>

<style scoped lang="scss">
.app-header {
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  height: $app-header-height;
  padding: 0 12px;
  line-height: normal;
  background: #ffffff;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);

  &--fixed {
    position: sticky;
    top: 0;
  }

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__left {
    flex: 0 0 auto;
  }

  :deep(.app-top-menu) {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__right {
    flex: 0 0 auto;
    justify-content: flex-end;
    margin-left: auto;
  }

  &__trigger {
    width: 36px;
    height: 36px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    background: #1677ff;
    border-radius: 6px;
  }

  &__title {
    overflow: hidden;
    color: var(--app-text);
    font-size: 16px;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__user {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 180px;
    padding: 4px 6px;
    color: var(--app-text);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 6px;

    &:hover {
      background: var(--app-surface-muted);
    }
  }

  &__username {
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 760px) {
  .app-header {
    &__left {
      flex: 1 1 auto;
    }

    &__right {
      flex: 0 0 auto;
    }

    :deep(.app-top-menu) {
      display: none;
    }
  }
}
</style>
