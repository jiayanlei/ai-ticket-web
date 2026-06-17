<template>
  <a-drawer :open="open" :title="t('layoutSettings.title')" width="320" @close="emit('update:open', false)">
    <div class="layout-settings">
      <div class="layout-settings__group">
        <div class="layout-settings__label">{{ t('layoutSettings.layoutMode') }}</div>
        <a-segmented v-model:value="layoutMode" :options="layoutModeOptions" block />
      </div>

      <div class="layout-settings__group">
        <div class="layout-settings__label">{{ t('layoutSettings.themeMode') }}</div>
        <a-segmented v-model:value="themeMode" :options="themeModeOptions" block />
      </div>

      <div class="layout-settings__group">
        <div class="layout-settings__label">{{ t('layoutSettings.languageMode') }}</div>
        <a-segmented v-model:value="languageMode" :options="languageModeOptions" block />
      </div>

      <div class="layout-settings__group">
        <div class="layout-settings__label">{{ t('layoutSettings.fullscreenMode') }}</div>
        <a-button block @click="toggleFullscreen">
          <template #icon><FullscreenExitOutlined v-if="isFullscreen" /><FullscreenOutlined v-else /></template>
          {{ isFullscreen ? t('common.exitFullscreen') : t('common.enterFullscreen') }}
        </a-button>
      </div>

      <a-divider />

      <a-space direction="vertical" class="layout-settings__switches">
        <a-switch v-model:checked="appStore.layout.showLogo" :checked-children="t('layoutSettings.show')" :un-checked-children="t('layoutSettings.hide')" />
        <span>{{ t('layoutSettings.logo') }}</span>
      </a-space>

      <a-space direction="vertical" class="layout-settings__switches">
        <a-switch v-model:checked="appStore.layout.fixedHeader" :checked-children="t('layoutSettings.fixed')" :un-checked-children="t('layoutSettings.scroll')" />
        <span>{{ t('layoutSettings.fixedHeader') }}</span>
      </a-space>

      <a-space direction="vertical" class="layout-settings__switches">
        <a-switch v-model:checked="appStore.layout.showBreadcrumb" :checked-children="t('layoutSettings.show')" :un-checked-children="t('layoutSettings.hide')" />
        <span>{{ t('layoutSettings.breadcrumb') }}</span>
      </a-space>

      <a-space direction="vertical" class="layout-settings__switches">
        <a-switch v-model:checked="appStore.layout.showTabs" :checked-children="t('layoutSettings.show')" :un-checked-children="t('layoutSettings.hide')" />
        <span>{{ t('layoutSettings.tabs') }}</span>
      </a-space>

      <div class="layout-settings__group">
        <div class="layout-settings__label">{{ t('layoutSettings.contentPadding') }}</div>
        <a-input-number v-model:value="appStore.layout.contentPadding" :min="0" :max="32" addon-after="px" />
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons-vue';
import { useI18n } from 'vue-i18n';

import { appSettings } from '@/config';
import { useAppStore } from '@/stores/app';
import type { LanguageMode, LayoutMode, ThemeMode } from '@/types/layout';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const appStore = useAppStore();
const { t } = useI18n();
const isFullscreen = ref(Boolean(document.fullscreenElement));

const layoutModeOptions = computed(() => [
  { label: t('layoutSettings.side'), value: 'side' },
  { label: t('layoutSettings.top'), value: 'top' },
  { label: t('layoutSettings.mixed'), value: 'mixed' },
]);
const themeModeOptions = computed(() => [
  { label: t('layoutSettings.light'), value: 'light' },
  { label: t('layoutSettings.dark'), value: 'dark' },
]);
const languageModeOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];

const layoutMode = computed({
  get: () => appStore.layout.layoutMode,
  set: (mode: LayoutMode) => {
    appStore.setLayoutMode(mode);
  },
});

const themeMode = computed({
  get: () => appStore.layout.theme,
  set: (theme: ThemeMode) => {
    if (appSettings.system.enableThemeSwitch) {
      appStore.setTheme(theme);
    }
  },
});

const languageMode = computed({
  get: () => appStore.language,
  set: (language: LanguageMode) => {
    appStore.setLanguage(language);
  },
});

function syncFullscreenState() {
  isFullscreen.value = Boolean(document.fullscreenElement);
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    syncFullscreenState();
    return;
  }

  await document.exitFullscreen();
  syncFullscreenState();
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState);
});
</script>

<style scoped lang="scss">
.layout-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__label {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  &__switches {
    width: 100%;

    :deep(.ant-space-item:last-child) {
      color: #4b5563;
    }
  }
}
</style>
