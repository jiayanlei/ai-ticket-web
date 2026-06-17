<template>
  <div class="app-tenant-selector">
    <a-select v-model:value="tenant" class="app-tenant-selector__select" popup-class-name="app-header-dropdown">
      <a-select-option value="global">{{ t('header.tenant.global') }}</a-select-option>
      <a-select-option value="apac">{{ t('header.tenant.apac') }}</a-select-option>
      <a-select-option value="emea">{{ t('header.tenant.emea') }}</a-select-option>
    </a-select>

    <a-select
      v-model:value="organization"
      class="app-tenant-selector__select app-tenant-selector__select--wide"
      popup-class-name="app-header-dropdown"
    >
      <a-select-option value="cx">{{ t('header.organization.cx') }}</a-select-option>
      <a-select-option value="call">{{ t('header.organization.call') }}</a-select-option>
      <a-select-option value="after-sales">{{ t('header.organization.afterSales') }}</a-select-option>
    </a-select>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const tenant = ref('global');
const organization = ref('cx');
</script>

<style scoped lang="scss">
.app-tenant-selector {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  white-space: nowrap;

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
}

@media (max-width: 760px) {
  .app-tenant-selector {
    display: none;
  }
}
</style>
