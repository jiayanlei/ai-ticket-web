<template>
  <Transition name="auth-loader-fade">
    <div v-if="visible" class="auth-loader">
      <div class="auth-loader__panel">
        <div class="auth-loader__core">
          <span class="auth-loader__orb"></span>
          <span class="auth-loader__ring"></span>
        </div>
        <p class="auth-loader__text">{{ text }}</p>
        <div class="auth-loader__status">
          <span :class="{ 'is-success': success }"></span>
          {{ success ? 'Session Linked' : 'Neural Auth Engine' }}
        </div>
        <div class="auth-loader__progress">
          <span></span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineOptions({
  name: 'LoginBootLoader',
});

defineProps<{
  visible: boolean;
  text: string;
  success?: boolean;
}>();
</script>

<style scoped lang="scss">
.auth-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 50% 42%, rgba(55, 149, 255, 0.14), transparent 32%),
    rgba(7, 17, 36, 0.54);
  backdrop-filter: blur(8px);

  &__panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(340px, calc(100vw - 48px));
    padding: 32px 28px 28px;
    color: #eaf4ff;
    background: rgba(10, 25, 50, 0.72);
    border: 1px solid rgba(148, 204, 255, 0.22);
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0, 15, 42, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  &__core {
    position: relative;
    width: 96px;
    height: 96px;
    margin-bottom: 24px;
  }

  &__orb,
  &__ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
  }

  &__orb {
    inset: 31px;
    background:
      radial-gradient(circle at 36% 28%, #ffffff 0 5%, transparent 20%),
      linear-gradient(135deg, #5fd7ff, #226cff);
    box-shadow: 0 0 24px rgba(70, 166, 255, 0.64);
    animation: orbBreathe 1.7s ease-in-out infinite;
  }

  &__ring {
    border: 1px solid rgba(150, 218, 255, 0.28);
    border-top-color: rgba(137, 229, 255, 0.95);
    animation: ringRotate 1.5s linear infinite;

    &::after {
      position: absolute;
      top: -2px;
      left: 50%;
      width: 6px;
      height: 6px;
      content: '';
      background: #c8f6ff;
      border-radius: 50%;
      box-shadow: 0 0 14px rgba(102, 231, 255, 0.8);
    }
  }

  &__text {
    min-height: 24px;
    margin: 0;
    color: #f4fbff;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0;
    text-align: center;
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    color: rgba(220, 240, 255, 0.72);
    font-size: 12px;

    span {
      width: 7px;
      height: 7px;
      background: #5fe3ff;
      border-radius: 50%;
      box-shadow: 0 0 14px rgba(95, 227, 255, 0.86);
      animation: statusBreath 1.2s ease-in-out infinite;

      &.is-success {
        background: #4ade80;
        box-shadow: 0 0 14px rgba(74, 222, 128, 0.9);
      }
    }
  }

  &__progress {
    position: relative;
    width: 100%;
    height: 2px;
    margin-top: 24px;
    overflow: hidden;
    background: rgba(132, 199, 255, 0.16);
    border-radius: 999px;

    span {
      position: absolute;
      inset: 0 auto 0 0;
      width: 42%;
      background: linear-gradient(90deg, transparent, #79e7ff, #2f7dff, transparent);
      border-radius: inherit;
      animation: progressScan 1.45s ease-in-out infinite;
    }
  }
}

.auth-loader-fade-enter-active,
.auth-loader-fade-leave-active {
  transition: opacity 0.22s ease;
}

.auth-loader-fade-enter-from,
.auth-loader-fade-leave-to {
  opacity: 0;
}

@keyframes ringRotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes orbBreathe {
  0%,
  100% {
    transform: scale(0.96);
  }

  50% {
    transform: scale(1.06);
  }
}

@keyframes statusBreath {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@keyframes progressScan {
  0% {
    transform: translateX(-105%);
  }

  100% {
    transform: translateX(250%);
  }
}
</style>
