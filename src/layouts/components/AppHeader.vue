<template>
  <a-layout-header
    class="app-header"
    :class="[`app-header--${appStore.layout.menuMode}`, { 'app-header--fixed': appStore.layout.fixedHeader }]"
  >
    <div class="app-header__left">
      <a-button v-if="showSiderControl" type="text" class="app-header__trigger" @click="appStore.toggleSidebar">
        <template #icon>
          <MenuFoldOutlined v-if="!appStore.layout.sidebarCollapsed" />
          <MenuUnfoldOutlined v-else />
        </template>
      </a-button>

      <div v-if="showHeaderBrand" class="app-header__brand">
        <span v-if="appStore.layout.showLogo" class="app-header__logo">AI</span>
        <span class="app-header__title">{{ envConfig.appTitle }}</span>
      </div>

      <a-select v-model:value="tenant" class="app-header__select" popup-class-name="app-header-dropdown">
        <a-select-option value="global">Global Enterprise</a-select-option>
        <a-select-option value="apac">APAC Support Hub</a-select-option>
        <a-select-option value="emea">EMEA Success Ops</a-select-option>
      </a-select>

      <a-select v-model:value="organization" class="app-header__select app-header__select--wide" popup-class-name="app-header-dropdown">
        <a-select-option value="cx">Customer Experience</a-select-option>
        <a-select-option value="call">Call Center North</a-select-option>
        <a-select-option value="after-sales">After Sales Group</a-select-option>
      </a-select>
    </div>

    <AppTopMenu v-if="showTopMenu" />

    <div class="app-header__right">
      <a-input v-if="appSettings.app.showSearch" class="app-header__search" placeholder="Search tickets, customers, agents, workflows...">
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input>

      <a-tooltip title="AI Copilot">
        <a-button class="app-header__ai" type="text" @click="handleCopilot">
          <template #icon>
            <RobotOutlined />
          </template>
          <span>Copilot</span>
        </a-button>
      </a-tooltip>

      <a-tooltip title="Task Center">
        <a-badge count="12" size="small">
          <a-button type="text" @click="handleSearch">
            <template #icon>
              <CheckSquareOutlined />
            </template>
          </a-button>
        </a-badge>
      </a-tooltip>

      <a-tooltip title="Message Center">
        <a-badge dot>
          <a-button type="text" @click="handleSearch">
            <template #icon>
              <MessageOutlined />
            </template>
          </a-button>
        </a-badge>
      </a-tooltip>

      <a-tooltip title="Notification Center">
        <a-badge count="7" size="small">
          <a-button type="text" @click="handleSearch">
            <template #icon>
              <BellOutlined />
            </template>
          </a-button>
        </a-badge>
      </a-tooltip>

      <a-tooltip title="System Alerts">
        <a-badge count="3" size="small">
          <a-button type="text" danger @click="handleSearch">
            <template #icon>
              <AlertOutlined />
            </template>
          </a-button>
        </a-badge>
      </a-tooltip>

      <a-tooltip title="Language">
        <a-button type="text" @click="handleLanguage">
          <template #icon>
            <GlobalOutlined />
          </template>
          <span class="app-header__compact-text">EN</span>
        </a-button>
      </a-tooltip>

      <a-tooltip title="Theme">
        <a-button type="text" @click="toggleTheme">
          <template #icon>
            <BulbOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-tooltip v-if="appSettings.app.showRefreshButton" title="Refresh">
        <a-button type="text" @click="handleRefresh">
          <template #icon>
            <ReloadOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-tooltip title="Open Command Screen">
        <a-button type="text" @click="openDataScreen">
          <template #icon>
            <DashboardOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-tooltip v-if="appSettings.app.showFullscreenButton" title="Fullscreen">
        <a-button type="text" @click="toggleFullscreen">
          <template #icon>
            <FullscreenOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-tooltip title="Layout Settings">
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
            <a-menu-item key="profile" disabled>User Center</a-menu-item>
            <a-menu-item key="tenant" disabled>Tenant: Global Enterprise</a-menu-item>
            <a-menu-divider />
            <a-menu-item key="logout" @click="handleLogout">Logout</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>

    <AppLayoutSettings v-model:open="settingsOpen" />
  </a-layout-header>
</template>

<script setup lang="ts">
import {
  AlertOutlined,
  BellOutlined,
  BulbOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  FullscreenOutlined,
  GlobalOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  ReloadOutlined,
  RobotOutlined,
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
const tenant = ref('global');
const organization = ref('cx');
const showTopMenu = computed(() => ['top', 'mixed'].includes(appStore.layout.menuMode));
const showSiderControl = computed(() => ['side', 'mixed'].includes(appStore.layout.menuMode));
const showHeaderBrand = computed(() => appStore.layout.menuMode === 'top');
const userInitial = computed(() => userStore.displayName.slice(0, 1));

function handleSearch() {
  message.info('Global command center entry is ready');
}

function handleCopilot() {
  message.info('AI Copilot is monitoring service risk, SLA pressure, and agent capacity');
}

function handleLanguage() {
  message.info('English workspace is active');
}

function handleRefresh() {
  router.go(0);
}

function toggleTheme() {
  appStore.setTheme(appStore.layout.theme === 'dark' ? 'light' : 'dark');
}

async function openDataScreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen().catch(() => undefined);
  }

  router.push({
    path: '/dashboard/screen',
    query: { fullscreen: '1' },
  });
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
  message.success('Logged out');
  router.replace(LOGIN_PATH);
}
</script>

<style scoped lang="scss">
.app-header {
  z-index: 10;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  height: $app-header-height;
  padding: 0 16px;
  line-height: normal;
  overflow: hidden;
  background: var(--app-header-bg);
  backdrop-filter: blur(22px);
  border-bottom: 1px solid var(--app-border);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);

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
    white-space: nowrap;
  }

  &__left {
    flex: 0 0 auto;
  }

  &--top &__left {
    flex-basis: 188px;
  }

  :deep(.app-top-menu) {
    flex: 1 1 0;
    min-width: 0;
  }

  &__right {
    flex: 0 0 auto;
    justify-content: flex-end;
    margin-left: auto;
  }

  :deep(.ant-btn-text) {
    color: var(--app-text-secondary);
  }

  :deep(.ant-btn-text:hover) {
    color: var(--app-text);
    background: var(--app-surface-muted);
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
    background: linear-gradient(135deg, var(--app-primary), var(--app-accent));
    border-radius: 8px;
  }

  &__title {
    overflow: hidden;
    color: var(--app-text);
    font-size: 16px;
    font-weight: 750;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__select {
    width: 148px;

    &--wide {
      width: 176px;
    }

    :deep(.ant-select-selector) {
      color: var(--app-text);
      background: var(--app-surface-muted) !important;
      border-color: var(--app-border) !important;
      border-radius: 8px;
    }
  }

  &__search {
    width: min(34vw, 520px);

    :deep(.ant-input-affix-wrapper),
    :deep(&.ant-input-affix-wrapper) {
      color: var(--app-text);
      background: var(--app-surface-muted);
      border-color: var(--app-border);
      border-radius: 999px;
    }
  }

  &__ai {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #dbeafe !important;
    background: linear-gradient(135deg, rgba(79, 123, 255, 0.22), rgba(0, 229, 255, 0.1)) !important;
    border: 1px solid rgba(79, 123, 255, 0.3);
    border-radius: 999px;
  }

  &__compact-text {
    margin-left: 4px;
    font-size: 12px;
    font-weight: 700;
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
    border-radius: 999px;

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
    &__select,
    &__select--wide,
    &__search,
    &__ai span,
    &__compact-text {
      display: none;
    }

    &__left {
      flex: 0 0 auto;
    }

    &__right {
      flex: 0 0 auto;
    }
  }
}
</style>
