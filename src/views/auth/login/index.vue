<template>
  <main class="login-page">
    <LoginBootLoader :visible="bootLoading || authLoading" :text="loaderText" :success="authSuccess" />

    <aside class="login-page__aside" aria-label="AI intelligent operations visual area">
      <div class="login-page__soft-light"></div>
      <div class="login-page__line-texture"></div>

      <div class="login-page__status">
        <span>AI Analysis</span>
        <span>Knowledge Base</span>
        <span>Ticket Operations</span>
      </div>

      <div class="login-page__brand-orb" aria-hidden="true">
        <span></span>
      </div>

      <div class="login-page__intro">
        <h2>AI 智能工单运营中枢</h2>
        <p>统一接入工单、知识库与 AI 分析能力，构建稳定、高效、可追踪的服务运营入口。</p>
      </div>

      <div class="login-page__feature-panel">
        <span>Secure Access</span>
        <strong>AI Service Operation Console</strong>
        <p>面向客服、运营与知识管理团队的统一工作入口。</p>
      </div>
    </aside>

    <section class="login-page__panel">
      <div class="login-page__mobile-bg" aria-hidden="true"></div>
      <div class="login-card">
        <div class="login-card__brand">
          <span v-if="appSettings.app.showLogo" class="login-card__logo">AI</span>
          <div>
            <h1>AI 智能工单分析系统</h1>
            <p>工单处理 · AI 分析 · 知识库运营入口</p>
          </div>
        </div>

        <a-alert
          v-if="errorText"
          class="login-card__error"
          type="error"
          show-icon
          :message="errorText"
          closable
          @close="errorText = ''"
        />

        <a-form class="login-card__form" :model="formState" :rules="rules" layout="vertical" @finish="handleLogin">
          <a-form-item label="账号" name="username">
            <a-input
              v-model:value="formState.username"
              autocomplete="username"
              placeholder="请输入账号"
              size="large"
              @change="errorText = ''"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item label="密码" name="password">
            <a-input-password
              v-model:value="formState.password"
              autocomplete="current-password"
              placeholder="请输入密码"
              size="large"
              @change="errorText = ''"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>

          <div class="login-card__options">
            <a-checkbox v-model:checked="remember">记住登录状态</a-checkbox>
            <a>忘记密码</a>
          </div>

          <a-button block type="primary" html-type="submit" size="large" :loading="authLoading" :disabled="bootLoading">
            {{ authLoading ? '正在认证...' : '进入智能运营台' }}
          </a-button>
        </a-form>

        <div class="login-card__system">
          <span><i></i>Console Ready</span>
          <span><i></i>API Auth</span>
          <span><i></i>Token Guard</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue';
import type { Rule } from 'ant-design-vue/es/form';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { appSettings } from '@/config';
import { HOME_PATH } from '@/router/constants';
import { useUserStore } from '@/stores/user';
import { getErrorMessage } from '@/utils/api-error';
import LoginBootLoader from './components/LoginBootLoader.vue';

defineOptions({
  name: 'LoginPage',
});

const bootTexts = [
  '正在初始化 AI 工单中枢...',
  '正在加载知识库索引...',
  '正在建立安全会话...',
];
const authTexts = ['正在校验账号权限...', '正在加载知识库索引...', '正在建立安全会话...'];

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const bootLoading = ref(true);
const authLoading = ref(false);
const authSuccess = ref(false);
const loaderText = ref(bootTexts[0]);
const errorText = ref('');
const remember = ref(true);
let bootTimer: number | undefined;
let textTimer: number | undefined;

const formState = reactive({
  username: 'admin',
  password: 'admin123',
});

const rules: Record<string, Rule[]> = {
  username: [
    {
      required: true,
      message: '请输入账号。',
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: '请输入密码。',
      trigger: 'blur',
    },
  ],
};

const redirectPath = computed(() => {
  return typeof route.query.redirect === 'string' ? route.query.redirect : HOME_PATH;
});

onMounted(() => {
  startLoaderText(bootTexts);
  bootTimer = window.setTimeout(() => {
    bootLoading.value = false;
    stopLoaderText();
  }, 800);
});

onBeforeUnmount(() => {
  window.clearTimeout(bootTimer);
  stopLoaderText();
});

async function handleLogin() {
  errorText.value = '';
  authSuccess.value = false;
  authLoading.value = true;
  startLoaderText(authTexts);

  try {
    await userStore.login(formState, remember.value, router);
    authSuccess.value = true;
    loaderText.value = '认证完成，正在进入工作台...';
    await wait(500);
    await router.replace(redirectPath.value);
  } catch (error) {
    errorText.value = getErrorMessage(error, '登录失败，请确认账号密码后重试。');
  } finally {
    authLoading.value = false;
    stopLoaderText();
  }
}

function startLoaderText(texts: string[]) {
  let index = 0;
  loaderText.value = texts[index];
  stopLoaderText();
  textTimer = window.setInterval(() => {
    index = (index + 1) % texts.length;
    loaderText.value = texts[index];
  }, 520);
}

function stopLoaderText() {
  if (textTimer) {
    window.clearInterval(textTimer);
    textTimer = undefined;
  }
}

function wait(duration: number) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}
</script>

<style scoped lang="scss">
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 520px);
  min-height: 100vh;
  overflow: hidden;
  color: #0f172a;
  background:
    radial-gradient(circle at 78% 18%, rgba(53, 151, 255, 0.16), transparent 30%),
    linear-gradient(135deg, #071224 0%, #f6f9ff 46%, #eef5ff 100%);

  &__aside {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
    padding: 56px 64px;
    overflow: hidden;
    color: #ffffff;
    background:
      radial-gradient(circle at 22% 20%, rgba(55, 137, 255, 0.24), transparent 30%),
      radial-gradient(circle at 86% 78%, rgba(24, 212, 255, 0.1), transparent 34%),
      linear-gradient(142deg, #061631 0%, #071f45 52%, #031024 100%);
  }

  &__soft-light,
  &__line-texture {
    position: absolute;
    pointer-events: none;
  }

  &__soft-light {
    top: 14%;
    right: 10%;
    width: 360px;
    height: 360px;
    background: radial-gradient(circle, rgba(67, 140, 255, 0.24), rgba(67, 140, 255, 0.05) 48%, transparent 70%);
    border-radius: 50%;
    filter: blur(2px);
  }

  &__line-texture {
    inset: 0;
    background:
      linear-gradient(116deg, transparent 0 18%, rgba(124, 199, 255, 0.08) 18% 18.3%, transparent 18.3% 100%),
      linear-gradient(116deg, transparent 0 64%, rgba(124, 199, 255, 0.07) 64% 64.3%, transparent 64.3% 100%),
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 96px);
    opacity: 0.72;
  }

  &__status {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    span {
      padding: 7px 12px;
      color: rgba(222, 244, 255, 0.88);
      font-size: 12px;
      background: rgba(72, 147, 255, 0.12);
      border: 1px solid rgba(129, 211, 255, 0.24);
      border-radius: 999px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
  }

  &__brand-orb {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(46vw, 360px);
    height: min(46vw, 360px);
    margin: auto;
    border: 1px solid rgba(151, 214, 255, 0.18);
    border-radius: 50%;
    box-shadow: inset 0 0 80px rgba(31, 107, 255, 0.08), 0 24px 90px rgba(0, 11, 35, 0.2);

    &::before,
    &::after {
      position: absolute;
      content: '';
      border-radius: 50%;
    }

    &::before {
      inset: 48px;
      border: 1px solid rgba(151, 214, 255, 0.12);
    }

    &::after {
      inset: 96px;
      background: linear-gradient(135deg, rgba(36, 118, 255, 0.72), rgba(48, 214, 255, 0.42));
      box-shadow: 0 0 44px rgba(47, 156, 255, 0.24);
    }

    span {
      position: absolute;
      width: 62%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(178, 228, 255, 0.58), transparent);
      transform: rotate(-22deg);
    }
  }

  &__intro {
    position: relative;
    z-index: 3;
    max-width: 640px;

    h2 {
      margin: 0;
      color: #f7fbff;
      font-size: 42px;
      font-weight: 800;
      line-height: 1.22;
      letter-spacing: 0;
    }

    p {
      margin: 18px 0 0;
      color: rgba(226, 242, 255, 0.8);
      font-size: 16px;
      line-height: 1.8;
    }
  }

  &__feature-panel {
    position: relative;
    z-index: 3;
    max-width: 440px;
    padding: 18px 20px;
    margin-top: 28px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(185, 223, 255, 0.16);
    border-radius: 16px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);

    span {
      color: #83d6ff;
      font-size: 12px;
      font-weight: 700;
    }

    strong {
      display: block;
      margin-top: 8px;
      color: #ffffff;
      font-size: 16px;
      line-height: 1.4;
    }

    p {
      margin: 6px 0 0;
      color: rgba(226, 242, 255, 0.72);
      font-size: 13px;
      line-height: 1.6;
    }
  }

  &__panel {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 48px;
    background:
      radial-gradient(circle at 58% 18%, rgba(54, 147, 255, 0.16), transparent 28%),
      linear-gradient(180deg, rgba(247, 251, 255, 0.92), rgba(235, 243, 255, 0.96));
  }

  &__mobile-bg {
    position: absolute;
    inset: 0;
    display: none;
    background:
      radial-gradient(circle at 18% 18%, rgba(46, 144, 255, 0.14), transparent 32%),
      linear-gradient(135deg, #edf5ff 0%, #f8fbff 100%);
  }
}

.login-card {
  position: relative;
  z-index: 2;
  width: min(100%, 386px);
  padding: 34px 32px 28px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 22px;
  box-shadow: 0 24px 70px rgba(25, 64, 112, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(22px);

  &::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: '';
    border: 1px solid rgba(74, 154, 255, 0.14);
    border-radius: inherit;
  }

  &__brand {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 28px;

    h1 {
      margin: 0;
      color: #10203d;
      font-size: 22px;
      font-weight: 800;
      line-height: 1.3;
      letter-spacing: 0;
    }

    p {
      margin: 7px 0 0;
      color: #64748b;
      font-size: 13px;
      line-height: 1.45;
    }
  }

  &__logo {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    color: #ffffff;
    font-size: 17px;
    font-weight: 900;
    background: linear-gradient(135deg, #1c72ff, #28d7ff);
    border-radius: 12px;
    box-shadow: 0 12px 28px rgba(28, 114, 255, 0.32), 0 0 24px rgba(40, 215, 255, 0.26);
  }

  &__error {
    margin-bottom: 18px;
    border-radius: 10px;
  }

  &__form {
    :deep(.ant-form-item) {
      margin-bottom: 18px;
    }

    :deep(.ant-form-item-label) {
      padding-bottom: 7px;
    }

    :deep(.ant-form-item-label > label) {
      height: auto;
      color: #334155;
      font-size: 13px;
      font-weight: 700;
    }

    :deep(.ant-input-affix-wrapper) {
      height: 46px;
      color: #0f172a;
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid rgba(148, 163, 184, 0.34);
      border-radius: 10px;
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    }

    :deep(.ant-input-affix-wrapper-focused),
    :deep(.ant-input-affix-wrapper:focus-within) {
      border-color: #237dff;
      box-shadow: 0 0 0 3px rgba(35, 125, 255, 0.14), 0 12px 30px rgba(35, 125, 255, 0.12);
    }

    :deep(.ant-input),
    :deep(.ant-input-password input) {
      font-size: 14px;
      background: transparent;
    }

    :deep(.ant-input-prefix) {
      margin-right: 10px;
      color: #4387ff;
    }

    :deep(.ant-form-item-explain-error) {
      padding-top: 3px;
      color: #dc2626;
      font-size: 12px;
    }

    :deep(.ant-btn-primary) {
      height: 46px;
      margin-top: 2px;
      font-weight: 800;
      background: linear-gradient(135deg, #1769ff, #28c9ff);
      border: 0;
      border-radius: 12px;
      box-shadow: 0 14px 28px rgba(23, 105, 255, 0.28), 0 0 22px rgba(40, 201, 255, 0.18);
      transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
    }

    :deep(.ant-btn-primary:not(:disabled):hover) {
      filter: brightness(1.04);
      box-shadow: 0 18px 34px rgba(23, 105, 255, 0.34), 0 0 30px rgba(40, 201, 255, 0.24);
      transform: translateY(-1px);
    }
  }

  &__options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -2px 0 20px;
    color: #64748b;
    font-size: 13px;

    :deep(.ant-checkbox-wrapper) {
      color: #64748b;
      font-size: 13px;
    }

    a {
      color: #2563eb;
    }
  }

  &__system {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    justify-content: center;
    margin-top: 22px;
    color: #607089;
    font-size: 11px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    i {
      width: 7px;
      height: 7px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.7);
      animation: statusPulse 1.6s ease-in-out infinite;
    }
  }
}

@media (max-width: 1080px) {
  .login-page {
    grid-template-columns: minmax(0, 1fr) minmax(390px, 480px);

    &__aside {
      padding: 44px;
    }

    &__intro {
      h2 {
        font-size: 34px;
      }
    }
  }
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
    background: #eef5ff;

    &__aside {
      display: none;
    }

    &__panel {
      padding: 28px 18px;
      background: transparent;
    }

    &__mobile-bg {
      display: block;
    }
  }

  .login-card {
    padding: 30px 24px 24px;

    &__brand {
      h1 {
        font-size: 20px;
      }
    }
  }
}

@media (max-width: 420px) {
  .login-card {
    border-radius: 18px;

    &__brand {
      align-items: flex-start;

      p {
        font-size: 12px;
      }
    }

    &__options {
      align-items: flex-start;
      gap: 10px;
      flex-direction: column;
    }
  }
}

@keyframes statusPulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.92);
  }

  50% {
    opacity: 1;
    transform: scale(1.12);
  }
}
</style>
