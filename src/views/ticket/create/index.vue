<template>
  <div class="page-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">新建工单</h1>
        <p class="page-description">预留基础表单结构，后续可接入客户、分类、附件和 AI 推荐面板。</p>
      </div>
    </div>

    <a-card :bordered="false">
      <a-form :model="formState" layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :md="12">
            <a-form-item label="工单标题" name="title">
              <a-input v-model:value="formState.title" placeholder="请输入工单标题" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="优先级" name="priority">
              <a-select v-model:value="formState.priority" placeholder="请选择优先级">
                <a-select-option value="high">高</a-select-option>
                <a-select-option value="medium">中</a-select-option>
                <a-select-option value="low">低</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="问题描述" name="description">
              <a-textarea v-model:value="formState.description" :rows="6" placeholder="请描述问题现象和影响范围" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-space>
          <a-button type="primary">提交</a-button>
          <a-button>保存草稿</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const formState = reactive({
  title: '',
  priority: undefined as string | undefined,
  description: '',
});
</script>
