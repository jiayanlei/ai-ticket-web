<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">新建工单</h1>
        <p class="page-description">按后端新增工单接口提交，当前不支持附件随工单上传。</p>
      </div>
      <a-button @click="router.back()">返回</a-button>
    </div>

    <a-card :bordered="false">
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical" @finish="submitTicket">
        <a-row :gutter="16">
          <a-col :xs="24" :md="12">
            <a-form-item label="工单标题" name="title">
              <a-input v-model:value="formState.title" placeholder="请输入工单标题" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="优先级" name="priority">
              <a-select v-model:value="formState.priority" placeholder="请选择优先级">
                <a-select-option v-for="item in ticketPriorityOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="来源" name="source">
              <a-input v-model:value="formState.source" placeholder="例如 WEB" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="分类" name="category">
              <a-input v-model:value="formState.category" placeholder="例如 IT、流程异常" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="申请人 ID" name="applicantId">
              <a-input v-model:value="formState.applicantId" placeholder="默认使用当前登录用户 ID" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="申请人姓名" name="applicantName">
              <a-input v-model:value="formState.applicantName" placeholder="默认使用当前登录用户昵称" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="处理人 ID" name="assigneeId">
              <a-input v-model:value="formState.assigneeId" placeholder="请输入处理人 ID" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="处理人姓名" name="assigneeName">
              <a-input v-model:value="formState.assigneeName" placeholder="请输入处理人姓名" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="期望完成时间" name="dueTime">
              <a-date-picker
                v-model:value="formState.dueTime"
                show-time
                value-format="YYYY-MM-DD HH:mm:ss"
                class="full-width"
              />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="问题描述" name="description">
              <a-textarea v-model:value="formState.description" :rows="6" placeholder="请描述问题现象和影响范围" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-space>
          <a-button type="primary" html-type="submit" :loading="submitting">提交</a-button>
          <a-button @click="resetForm">重置</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { createWorkOrderApi } from '@/api/workOrder';
import type { CreateWorkOrderPayload } from '@/api/workOrder';
import { ticketPriorityOptions } from '@/constants/ticket';
import { useUserStore } from '@/stores/user';
import { getErrorMessage } from '@/utils/api-error';

const router = useRouter();
const userStore = useUserStore();
const submitting = ref(false);
const formRef = ref<FormInstance>();
const formState = reactive<CreateWorkOrderPayload>(createEmptyForm());

const rules: Record<string, Rule[]> = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
};

onMounted(() => {
  applyCurrentUser();
});

async function submitTicket() {
  submitting.value = true;

  try {
    await createWorkOrderApi(formState);
    message.success('工单已创建');
    await router.push('/ticket/list');
  } catch (error) {
    message.error(getErrorMessage(error, '创建工单失败'));
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  Object.assign(formState, createEmptyForm());
  applyCurrentUser();
  formRef.value?.clearValidate();
}

function applyCurrentUser() {
  formState.applicantId = userStore.userInfo?.userId || userStore.userInfo?.id;
  formState.applicantName = userStore.displayName;
}

function createEmptyForm(): CreateWorkOrderPayload {
  return {
    title: '',
    description: '',
    priority: 'NORMAL',
    source: 'WEB',
    category: '',
    applicantId: undefined,
    applicantName: '',
    assigneeId: undefined,
    assigneeName: '',
    dueTime: undefined,
  };
}
</script>
