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

      <AppTenantSelector v-if="showHeaderTenantSelector" />
    </div>

    <AppTopMenu v-if="showTopMenu" />

    <div class="app-header__right">
      <div class="app-header__command">
        <a-input v-if="appSettings.app.showSearch" class="app-header__search" :placeholder="t('header.searchPlaceholder')">
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>

        <a-tooltip :title="t('header.copilot')">
          <a-button class="app-header__ai" type="text" @click="handleCopilot">
            <template #icon>
              <RobotOutlined />
            </template>
            <span>{{ t('header.copilot') }}</span>
          </a-button>
        </a-tooltip>
      </div>

      <a-dropdown trigger="click" overlay-class-name="app-header-service-menu">
        <a-tooltip :title="t('header.serviceHub')">
          <a-badge :count="serviceHubCount" size="small">
            <a-button type="text">
              <template #icon>
                <BellOutlined />
              </template>
            </a-button>
          </a-badge>
        </a-tooltip>
        <template #overlay>
          <div class="app-header-message-panel">
            <button
              v-for="item in messageList"
              :key="item.titleKey"
              class="app-header-message-panel__item"
              type="button"
              @click="handleSearch"
            >
              <i :class="`app-header-message-panel__severity-dot--${item.color}`"></i>
              <span>
                <strong>{{ t(item.titleKey) }}</strong>
                <small>{{ t(item.descKey) }}</small>
              </span>
            </button>
          </div>
        </template>
      </a-dropdown>

      <a-tooltip v-if="appSettings.app.showRefreshButton" :title="t('common.refresh')">
        <a-button type="text" @click="handleRefresh">
          <template #icon>
            <ReloadOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-tooltip :title="t('header.openCommandScreen')">
        <a-button type="text" @click="openDataScreen">
          <template #icon>
            <DashboardOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-tooltip :title="t('common.layoutSettings')">
        <a-button type="text" @click="settingsOpen = true">
          <template #icon>
            <SettingOutlined />
          </template>
        </a-button>
      </a-tooltip>

      <a-dropdown trigger="click">
        <button class="app-header__user" type="button">
          <span class="app-header__username">{{ userStore.displayName }}</span>
        </button>
        <template #overlay>
          <a-menu>
            <a-menu-item key="profile" disabled>{{ t('common.userCenter') }}</a-menu-item>
            <a-menu-item key="tenant" disabled>{{ t('header.tenantLabel') }}</a-menu-item>
            <a-menu-divider />
            <a-menu-item key="logout" @click="handleLogout">{{ t('common.logout') }}</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>

    <AppLayoutSettings v-model:open="settingsOpen" />
  </a-layout-header>
</template>

<script setup lang="ts">
import {
  BellOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  RobotOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { appSettings, envConfig } from '@/config';
import AppLayoutSettings from '@/layouts/components/AppLayoutSettings.vue';
import AppTenantSelector from '@/layouts/components/AppTenantSelector.vue';
import AppTopMenu from '@/layouts/components/AppTopMenu.vue';
import { LOGIN_PATH } from '@/router/constants';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

const appStore = useAppStore();
const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();
const settingsOpen = ref(false);
const serviceHubCount = 11;
const messageList = [
  { titleKey: 'header.messages.risk.title', descKey: 'header.messages.risk.desc', color: 'danger' },
  { titleKey: 'header.messages.sla.title', descKey: 'header.messages.sla.desc', color: 'warning' },
  { titleKey: 'header.messages.queue.title', descKey: 'header.messages.queue.desc', color: 'normal' },
];
const showTopMenu = computed(() => ['top', 'mixed'].includes(appStore.layout.menuMode));
const showSiderControl = computed(() => ['side', 'mixed'].includes(appStore.layout.menuMode));
const showHeaderBrand = computed(() => appStore.layout.menuMode === 'top');
const showHeaderTenantSelector = computed(() => appStore.layout.menuMode === 'side');

function handleSearch() {
  message.info(t('header.commandReady'));
}

function handleCopilot() {
  message.info(t('header.copilotReady'));
}

function handleRefresh() {
  router.go(0);
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

async function handleLogout() {
  await userStore.logout(router);
  message.success(t('header.loggedOut'));
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
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);

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

  &__command {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
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

  &__search {
    width: min(24vw, 364px);

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
    color: #1d4ed8 !important;
    background: linear-gradient(135deg, rgba(79, 123, 255, 0.16), rgba(0, 229, 255, 0.1)) !important;
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
    max-width: 180px;
    padding: 6px 8px;
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

:global(html.dark) .app-header {
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
}

:global(html.dark) .app-header__ai {
  color: #dbeafe !important;
  background: linear-gradient(135deg, rgba(79, 123, 255, 0.22), rgba(0, 229, 255, 0.1)) !important;
}

:global(.app-header-message-panel) {
  width: 260px;
  padding: 10px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14);
}

:global(.app-header-message-panel__item) {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  gap: 10px;
  width: 100%;
  padding: 10px 8px;
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

:global(.app-header-message-panel__item:hover) {
  background: var(--app-surface-muted);
}

:global(.app-header-message-panel__item span) {
  display: grid;
  gap: 3px;
  min-width: 0;
}

:global(.app-header-message-panel__item strong) {
  overflow: hidden;
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.app-header-message-panel__item small) {
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.app-header-message-panel__item > i) {
  align-self: center;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

:global(.app-header-message-panel__severity-dot--danger) {
  background: #f5222d;
}

:global(.app-header-message-panel__severity-dot--warning) {
  background: #faad14;
}

:global(.app-header-message-panel__severity-dot--normal) {
  background: #52c41a;
}

@media (max-width: 760px) {
  .app-header {
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

@media (min-width: 1600px) {
  .app-header {
    &--side &__right {
      flex: 1 1 0;
      margin-left: 0;
    }

    &--side &__command {
      margin-right: auto;
      margin-left: 216px;
    }
  }
}
</style>
