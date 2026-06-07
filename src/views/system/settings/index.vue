<template>
  <div class="page-view settings-page">
    <a-card
      v-for="group in groupedSettings"
      :key="group.key"
      :title="group.title"
      :bordered="false"
      :loading="loading"
    >
      <a-form layout="vertical">
        <a-row :gutter="[16, 0]">
          <a-col v-for="item in group.items" :key="item.key" :xs="24" :lg="12">
            <a-form-item :label="item.label" :help="item.description">
              <a-switch
                v-if="typeof item.value === 'boolean'"
                v-model:checked="item.value"
                checked-children="开启"
                un-checked-children="关闭"
              />
              <a-input-number
                v-else-if="typeof item.value === 'number'"
                v-model:value="item.value"
                :min="0"
                class="full-width"
              />
              <a-input v-else v-model:value="item.value" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <div class="settings-page__actions">
      <a-button type="primary" :loading="saving" @click="submitSettings">保存配置</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import { computed, ref } from 'vue';

import { getSystemSettingsApi, updateSystemSettingsApi } from '@/api/system';
import type { SystemSettingItem } from '@/api/system';
import { getErrorMessage } from '@/utils/api-error';

const loading = ref(false);
const saving = ref(false);
const settings = ref<SystemSettingItem[]>([]);

const groupTitleMap: Record<SystemSettingItem['category'], string> = {
  general: '基础配置',
  security: '安全策略',
  ai: 'AI 配置',
  integration: '集成配置',
};

const groupedSettings = computed(() =>
  Object.entries(groupTitleMap).map(([key, title]) => ({
    key,
    title,
    items: settings.value.filter((item) => item.category === key),
  })),
);

void loadSettings();

async function loadSettings() {
  loading.value = true;

  try {
    settings.value = await getSystemSettingsApi();
  } catch (error) {
    message.error(getErrorMessage(error, '系统配置加载失败'));
  } finally {
    loading.value = false;
  }
}

async function submitSettings() {
  saving.value = true;

  try {
    settings.value = await updateSystemSettingsApi(
      settings.value.map((item) => ({
        key: item.key,
        value: item.value,
      })),
    );
    message.success('系统配置已保存');
  } catch (error) {
    message.error(getErrorMessage(error, '系统配置保存失败'));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.settings-page {
  display: grid;
  gap: 16px;

  &__actions {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
