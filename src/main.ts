import Antd from 'ant-design-vue';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from '@/App.vue';
import router from '@/router';
import { useAppStore } from '@/stores/app';
import { usePermissionStore } from '@/stores/permission';
import { applyAppSettings } from '@/utils/apply-settings';
import { setupErrorHandler } from '@/utils/error-handler';

import 'ant-design-vue/dist/reset.css';
import '@/styles/index.scss';

const app = createApp(App);
const pinia = createPinia();

applyAppSettings();
setupErrorHandler(app);

app.use(pinia);
app.use(router);
app.use(Antd);

useAppStore(pinia).initialize();
usePermissionStore(pinia).rebuildCachedRoutes(router);

app.mount('#app');
