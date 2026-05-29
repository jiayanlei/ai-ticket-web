<template>
  <article class="message-item" :class="`message-item--${messageItem.type}`">
    <header class="message-item__header">
      <span>{{ roleLabelMap[messageItem.type] }}</span>
      <time>{{ messageItem.time }}</time>
    </header>

    <div class="message-item__body">
      <template v-for="(block, index) in markdownBlocks" :key="`${block.type}-${index}`">
        <div v-if="block.type === 'text'" class="message-item__markdown">
          <template v-for="(part, partIndex) in parseTextContent(block.content)" :key="partIndex">
            <h3 v-if="part.type === 'heading' && part.level === 3" v-html="formatInline(part.content)" />
            <h4 v-else-if="part.type === 'heading'" v-html="formatInline(part.content)" />
            <ul v-else-if="part.type === 'list'">
              <li v-for="(item, itemIndex) in part.items" :key="itemIndex" v-html="formatInline(item)" />
            </ul>
            <p v-else v-html="formatInline(part.content)" />
          </template>
        </div>

        <div v-else class="message-item__code">
          <div class="message-item__code-header">
            <span>{{ block.language || 'text' }}</span>
            <a-button size="small" type="text" @click="copyCode(block.content)">复制</a-button>
          </div>
          <pre><code>{{ block.content }}</code></pre>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { message } from 'ant-design-vue';

import type { ChatMessage, ChatMessageType } from '../types';

interface MarkdownCodeBlock {
  type: 'code';
  language: string;
  content: string;
}

interface MarkdownTextBlock {
  type: 'text';
  content: string;
}

type MarkdownBlock = MarkdownCodeBlock | MarkdownTextBlock;

interface TextHeadingPart {
  type: 'heading';
  level: 3 | 4;
  content: string;
}

interface TextListPart {
  type: 'list';
  items: string[];
}

interface TextParagraphPart {
  type: 'paragraph';
  content: string;
}

type TextPart = TextHeadingPart | TextListPart | TextParagraphPart;

const props = defineProps<{
  messageItem: ChatMessage;
}>();

const roleLabelMap: Record<ChatMessageType, string> = {
  user: '用户',
  assistant: 'AI',
  system: '系统',
  log: '日志',
  warning: '风险',
  success: '成功',
  error: '失败',
};

const markdownBlocks = computed(() => parseMarkdown(props.messageItem.content));

function parseMarkdown(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const fenceReg = /```([\w-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceReg.exec(content))) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    blocks.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].replace(/\n$/, ''),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return blocks.filter((block) => block.content.trim());
}

function parseTextContent(content: string): TextPart[] {
  return content
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split('\n').map((line) => line.trim());
      const heading = chunk.match(/^(#{1,4})\s+(.+)$/);

      if (heading) {
        return {
          type: 'heading',
          level: heading[1].length >= 3 ? 4 : 3,
          content: heading[2],
        };
      }

      if (lines.every((line) => /^-\s+/.test(line))) {
        return {
          type: 'list',
          items: lines.map((line) => line.replace(/^-\s+/, '')),
        };
      }

      return {
        type: 'paragraph',
        content: lines.join('\n'),
      };
    });
}

function formatInline(content: string) {
  const escaped = escapeHtml(content);

  return escaped
    .replace(/\[([^\]]+)]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(content: string) {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function copyCode(content: string) {
  await navigator.clipboard.writeText(content);
  message.success('代码块已复制');
}
</script>

<style scoped lang="scss">
.message-item {
  width: min(100%, 900px);
  padding: 13px 15px;
  background: rgb(255 255 255 / 94%);
  border: 1px solid rgb(226 232 240 / 90%);
  border-radius: 12px;
  box-shadow: 0 6px 18px rgb(15 23 42 / 4%);

  &--user {
    align-self: flex-end;
    background: rgb(22 119 255 / 8%);
    border-color: rgb(22 119 255 / 35%);
  }

  &--system,
  &--log {
    background: var(--app-surface-muted);
  }

  &--warning {
    background: rgb(250 173 20 / 10%);
    border-color: rgb(250 173 20 / 42%);
  }

  &--success {
    background: rgb(82 196 26 / 10%);
    border-color: rgb(82 196 26 / 34%);
  }

  &--error {
    background: rgb(255 77 79 / 10%);
    border-color: rgb(255 77 79 / 36%);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 9px;

    span {
      color: #1677ff;
      font-size: 12px;
      font-weight: 700;
    }

    time {
      flex: none;
      color: var(--app-text-secondary);
      font-size: 12px;
    }
  }

  &__body {
    color: var(--app-text);
    font-size: 13px;
    line-height: 1.7;
    word-break: break-word;
  }

  &__markdown {
    :deep(p) {
      margin: 0 0 8px;
    }

    :deep(p:last-child) {
      margin-bottom: 0;
    }

    :deep(h3),
    :deep(h4) {
      margin: 6px 0 8px;
      color: var(--app-text);
      font-size: 14px;
      font-weight: 700;
    }

    :deep(ul) {
      padding-left: 18px;
      margin: 0 0 8px;
    }

    :deep(li) {
      margin: 3px 0;
    }

    :deep(code) {
      padding: 1px 5px;
      color: #0958d9;
      background: rgb(22 119 255 / 10%);
      border-radius: 4px;
    }

    :deep(a) {
      color: #1677ff;
    }
  }

  &__code {
    overflow: hidden;
    margin: 10px 0;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 10px;

    pre {
      max-width: 100%;
      max-height: 320px;
      padding: 14px;
      margin: 0;
      overflow: auto;
    }

    code {
      color: #e2e8f0;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
      font-size: 12px;
      line-height: 1.65;
      white-space: pre;
    }
  }

  &__code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 34px;
    padding: 0 8px 0 12px;
    color: #94a3b8;
    background: #111827;
    border-bottom: 1px solid #1e293b;

    span {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
      font-size: 12px;
    }

    :deep(.ant-btn) {
      color: #bfdbfe;
      border-radius: 8px;
    }
  }
}
</style>
