<template>
  <a-sub-menu v-if="hasChildrenForDisplay" :key="item.key">
    <template v-if="iconComponent" #icon>
      <component :is="iconComponent" />
    </template>

    <template #title>
      <div class="app-menu-node__title" @click.stop="handleToggle">
        <span class="app-menu-node__title-text">{{ menuTitle }}</span>
      </div>
    </template>

    <AppMenuNode
      v-for="child in item.children"
      :key="child.key"
      :item="child"
      :render-children-as-submenu="renderChildrenAsSubmenu"
      @navigate="forwardNavigate"
      @toggle="forwardToggle"
    />
  </a-sub-menu>

  <a-menu-item v-else :key="item.key" @click="handleNavigate">
    <template v-if="iconComponent" #icon>
      <component :is="iconComponent" />
    </template>
    <span>{{ menuTitle }}</span>
  </a-menu-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { getMenuIconComponent } from '@/layouts/components/app-menu-icons';
import type { AppMenuItem } from '@/types/menu';

const props = defineProps<{
  item: AppMenuItem;
  renderChildrenAsSubmenu?: boolean;
}>();

const emit = defineEmits<{
  navigate: [item: AppMenuItem];
  toggle: [item: AppMenuItem];
}>();

const { te, t } = useI18n();
const hasChildren = computed(() => Boolean(props.item.children?.length));
const hasChildrenForDisplay = computed(() => hasChildren.value && props.renderChildrenAsSubmenu !== false);
const iconComponent = computed(() => getMenuIconComponent(props.item.icon));
const menuTitle = computed(() => (props.item.i18nKey && te(props.item.i18nKey) ? t(props.item.i18nKey) : props.item.title));

function handleNavigate() {
  emit('navigate', props.item);
}

function handleToggle() {
  emit('toggle', props.item);
}

function forwardNavigate(item: AppMenuItem) {
  emit('navigate', item);
}

function forwardToggle(item: AppMenuItem) {
  emit('toggle', item);
}
</script>

<style scoped lang="scss">
.app-menu-node__title {
  display: flex;
  align-items: center;
  min-width: 0;
}

.app-menu-node__title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
