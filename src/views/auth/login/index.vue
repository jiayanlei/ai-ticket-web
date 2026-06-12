<template>
  <main class="login-page">
    <aside class="login-page__aside">
      <div class="login-page__status">
        <a-tag color="processing">Console Ready</a-tag>
        <a-tag color="success">{{ authModeText }}</a-tag>
      </div>
      <h2>Enterprise AI Customer Service Operating System</h2>
      <p>Operate tickets, calls, omnichannel conversations, AI agents, SLA risk, and enterprise service intelligence from one command center.</p>
    </aside>

    <section class="login-page__panel">
      <div class="login-page__brand">
        <span v-if="appSettings.app.showLogo" class="login-page__logo">AI</span>
        <div>
          <h1>{{ envConfig.appTitle }}</h1>
          <p>Future Enterprise SaaS for AI-native service operations</p>
        </div>
      </div>

      <a-form class="login-page__form" :model="formState" :rules="rules" layout="vertical" @finish="handleLogin">
        <a-form-item label="Account" name="username">
          <a-input v-model:value="formState.username" autocomplete="username" placeholder="Enter account">
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="Password" name="password">
          <a-input-password v-model:value="formState.password" autocomplete="current-password" placeholder="Enter password">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <div class="login-page__options">
          <a-checkbox v-model:checked="remember">Remember this workspace</a-checkbox>
          <a>Forgot password</a>
        </div>

        <a-button block type="primary" html-type="submit" :loading="loading">Sign In</a-button>
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
      message: 'Please enter account',
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: 'Please enter password',
      trigger: 'blur',
    },
    {
      min: 6,
      message: 'Password must contain at least 6 characters',
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
    message.success('Signed in');
    await router.replace(redirectPath.value);
  } catch (error) {
    message.error(getErrorMessage(error, 'Sign in failed. Please try again.'));
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
  background:
    radial-gradient(circle at 16% 12%, rgba(79, 123, 255, 0.24), transparent 30%),
    radial-gradient(circle at 78% 18%, rgba(0, 229, 255, 0.16), transparent 28%),
    #070b14;

  &__panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 56px;
    background: rgba(15, 23, 42, 0.86);
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(22px);
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 36px;

    h1 {
      margin: 0;
      color: #f8fafc;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.3;
    }

    p {
      margin: 6px 0 0;
      color: #94a3b8;
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
    background: linear-gradient(135deg, #4f7bff, #00e5ff);
    border-radius: 8px;
  }

  &__form {
    width: 100%;

    :deep(.ant-form-item-label > label) {
      color: #cbd5e1;
    }

    :deep(.ant-input-affix-wrapper) {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      border-radius: 8px;
    }
  }

  &__options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -4px 0 20px;
    color: #94a3b8;
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
      linear-gradient(135deg, rgb(79 123 255 / 72%), rgb(7 11 20 / 94%)),
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
