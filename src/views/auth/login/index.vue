<template>
  <main class="login-page">
    <aside class="login-page__aside">
      <div class="login-page__status">
        <a-tag color="processing">Console Ready</a-tag>
        <a-tag color="success">{{ authModeText }}</a-tag>
      </div>
      <h2>面向工单运营团队的 AI 分析管理端</h2>
      <p>认证接口、token、用户状态和路由守卫均通过统一配置接入。</p>
    </aside>

    <section class="login-page__panel">
      <div class="login-page__brand">
        <span v-if="appSettings.app.showLogo" class="login-page__logo">AI</span>
        <div>
          <h1>{{ envConfig.appTitle }}</h1>
          <p>统一工单处理、AI 分析和知识库运营入口</p>
        </div>
      </div>

      <a-form class="login-page__form" :model="formState" :rules="rules" layout="vertical" @finish="handleLogin">
        <a-form-item label="账号" name="username">
          <a-input v-model:value="formState.username" autocomplete="username" placeholder="请输入账号">
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="formState.password" autocomplete="current-password" placeholder="请输入密码">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <div class="login-page__options">
          <a-checkbox v-model:checked="remember">记住登录状态</a-checkbox>
          <a>忘记密码</a>
        </div>

        <a-button block type="primary" html-type="submit" :loading="loading">登录</a-button>
      </a-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { appSettings, envConfig } from '@/config';
import { HOME_PATH } from '@/router/constants';
import { useUserStore } from '@/stores/user';
import { getErrorMessage } from '@/utils/api-error';

defineOptions({
  name: 'LoginPage',
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const remember = ref(true);
const authModeText = computed(() => (envConfig.useMock ? 'Mock Auth' : 'API Auth'));
const formState = reactive({
  username: 'admin',
  password: 'admin123',
});

const rules: Record<string, Rule[]> = {
  username: [
    {
      required: true,
      message: '请输入账号',
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: 'blur',
    },
    {
      min: 6,
      message: '密码至少 6 位',
      trigger: 'blur',
    },
  ],
};

const redirectPath = computed(() => {
  return typeof route.query.redirect === 'string' ? route.query.redirect : HOME_PATH;
});

async function handleLogin() {
  loading.value = true;

  try {
    await userStore.login(formState, remember.value, router);
    message.success('登录成功');
    await router.replace(redirectPath.value);
  } catch (error) {
    message.error(getErrorMessage(error, '登录失败，请稍后重试'));
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 460px);
  min-height: 100vh;
  background: #0f172a;

  &__panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 56px;
    background: #ffffff;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 36px;

    h1 {
      margin: 0;
      color: #111827;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.3;
    }

    p {
      margin: 6px 0 0;
      color: #6b7280;
      font-size: 14px;
    }
  }

  &__logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
    background: #1677ff;
    border-radius: 8px;
  }

  &__form {
    width: 100%;
  }

  &__options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -4px 0 20px;
    color: #6b7280;
    font-size: 14px;
  }

  &__aside {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 64px;
    overflow: hidden;
    color: #ffffff;
    background:
      linear-gradient(135deg, rgb(22 119 255 / 82%), rgb(15 23 42 / 94%)),
      url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80') center/cover;

    h2 {
      max-width: 680px;
      margin: 0;
      font-size: 40px;
      font-weight: 760;
      line-height: 1.22;
    }

    p {
      max-width: 560px;
      margin: 18px 0 0;
      color: rgb(255 255 255 / 82%);
      font-size: 16px;
      line-height: 1.8;
    }
  }

  &__status {
    position: absolute;
    top: 32px;
    left: 64px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;

    &__panel {
      min-height: 100vh;
      padding: 36px 24px;
    }

    &__aside {
      display: none;
    }
  }
}
</style>
