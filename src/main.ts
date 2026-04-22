import Antd from 'ant-design-vue';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from '@/App.vue';
import router from '@/router';
import { applyAppSettings } from '@/utils/apply-settings';
import { setupErrorHandler } from '@/utils/error-handler';

import 'ant-design-vue/dist/reset.css';
import '@/styles/index.scss';

const app = createApp(App);

applyAppSettings();
setupErrorHandler(app);

app.use(createPinia());
app.use(router);
app.use(Antd);

app.mount('#app');
