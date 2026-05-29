<template>
  <div class="knowledge-base-page">
    <aside class="knowledge-sidebar">
      <div class="knowledge-sidebar__header">
        <div class="knowledge-sidebar__icon">
          <BookOutlined />
        </div>
        <div class="knowledge-sidebar__title">
          <strong>流程目录</strong>
          <span>知识库流程内容</span>
        </div>
      </div>

      <a-input
        v-model:value="keyword"
        allow-clear
        class="knowledge-sidebar__search"
        placeholder="搜索节点"
        @press-enter="locateFirstMatchedNode"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input>

      <div class="knowledge-sidebar__meta">
        <span>共 {{ totalNodeCount }} 个节点</span>
        <div>
          <a @click="expandAllTree">展开全部</a>
          <a-divider type="vertical" />
          <a @click="collapseAllTree">收起全部</a>
        </div>
      </div>

      <a-spin :spinning="loading">
        <a-tree
          v-if="treeDataSource.length"
          v-model:expanded-keys="expandedKeys"
          :selected-keys="selectedTreeKeys"
          :tree-data="treeDataSource"
          block-node
          class="knowledge-tree"
          @select="handleTreeSelect"
        >
          <template #title="{ title, nodeType, nodeCount, isLeaf }">
            <span class="knowledge-tree__node" :class="[`is-${nodeType}`, isLeaf ? 'is-leaf' : 'is-parent']">
              <FileTextOutlined v-if="isLeaf" />
              <FolderOpenOutlined v-else />
              <span class="knowledge-tree__title">{{ title }}</span>
              <span v-if="nodeCount" class="knowledge-tree__count">{{ nodeCount }}</span>
            </span>
          </template>
        </a-tree>
        <a-empty v-else description="暂无知识节点" />
      </a-spin>
    </aside>

    <main class="knowledge-canvas">
      <div class="canvas-toolbar">
        <div class="process-meta">
          <span>当前流程</span>
          <strong>{{ selectedRoot?.title || '未选择流程' }}</strong>
          <em>只读查看</em>
        </div>

        <div class="canvas-toolbar__actions">
          <a-input
            v-model:value="keyword"
            allow-clear
            class="canvas-toolbar__search"
            placeholder="搜索节点"
            @press-enter="locateFirstMatchedNode"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
          <button type="button" @click="reloadPage">
            <ReloadOutlined />
            <span>刷新</span>
          </button>
        </div>
      </div>

      <section
        ref="canvasBodyRef"
        class="canvas-body"
        :class="{ 'canvas-body--dragging': viewport.isDragging }"
        @mousedown="startCanvasDrag"
        @wheel="handleCanvasWheel"
      >
        <div class="canvas-dots"></div>
        <div v-if="!selectedRoot" class="canvas-empty">
          <a-empty description="请选择左侧最后一级目录查看流程图" />
        </div>

        <div v-else class="canvas-inner" :style="canvasInnerStyle">
          <svg class="canvas-lines" :width="layoutSize.width" :height="layoutSize.height">
            <path
              v-for="connector in layoutConnectors"
              :key="connector.id"
              :d="getConnectorPath(connector)"
              fill="none"
              stroke="rgba(22, 119, 255, 0.36)"
              stroke-width="2"
            />
          </svg>

          <article
            v-for="item in layoutNodes"
            :key="item.id"
            class="canvas-node"
            :class="{
              'canvas-node--root': item.depth === 0,
              'canvas-node--active': String(item.id) === String(activeNodeId),
              'canvas-node--summary': item.node.isSummary,
            }"
            :style="getNodeStyle(item)"
            @click.stop="openDetail(item.node)"
          >
            <div class="canvas-node__icon">{{ item.node.isSummary ? 'Σ' : '文' }}</div>
            <div class="canvas-node__main">
              <div class="canvas-node__title">{{ item.node.title }}</div>
              <div v-if="item.node.isSummary" class="canvas-node__summary">
                {{ item.node.summarySourceNodeIds?.length || 0 }} 个来源节点
              </div>
            </div>
          </article>
        </div>

        <div class="canvas-badge">
          <span>Canvas</span>
          <strong>只读</strong>
        </div>

        <div class="zoom-bar">
          <button type="button" title="搜索节点" @click="locateFirstMatchedNode"><SearchOutlined /></button>
          <button type="button" title="适应画布" @click="resetCanvas"><AimOutlined /></button>
          <button type="button" title="缩小" @click="zoomCanvas(-ZOOM_STEP)"><MinusOutlined /></button>
          <span>{{ scalePercent }}%</span>
          <button type="button" title="放大" @click="zoomCanvas(ZOOM_STEP)"><PlusOutlined /></button>
        </div>
      </section>
    </main>

    <a-drawer v-model:open="detailOpen" title="节点详情" width="520">
      <a-empty v-if="!detailNode" description="暂无节点详情" />
      <div v-else class="node-detail">
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="节点标题">{{ detailNode.title }}</a-descriptions-item>
          <a-descriptions-item label="节点类型">{{ getNodeTypeLabel(detailNode.type) }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ detailNode.updatedAt || '-' }}</a-descriptions-item>
          <a-descriptions-item label="标签">
            <a-space v-if="detailNode.tags.length" :size="4" wrap>
              <a-tag v-for="tag in detailNode.tags" :key="tag">{{ tag }}</a-tag>
            </a-space>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="节点说明">{{ detailNode.summary || '-' }}</a-descriptions-item>
        </a-descriptions>

        <section class="node-detail__section">
          <h3>富文本内容</h3>
          <div class="node-detail__content">{{ detailNode.content || '暂无内容' }}</div>
        </section>

        <section v-if="detailNode.links.length" class="node-detail__section">
          <h3>外链</h3>
          <a-list size="small" :data-source="detailNode.links">
            <template #renderItem="{ item }">
              <a-list-item>
                <a :href="item.url" target="_blank" rel="noreferrer">
                  <LinkOutlined />
                  {{ item.name }}
                </a>
              </a-list-item>
            </template>
          </a-list>
        </section>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  AimOutlined,
  BookOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';

import {
  getKnowledgeCanvasNodeDetailApi,
  getKnowledgeCanvasTotalApi,
  getKnowledgeCanvasTreeApi,
  type KnowledgeCanvasNode,
  type KnowledgeCanvasNodeType,
} from '@/api/knowledge';
import type { ApiId } from '@/api/types';
import { getErrorMessage } from '@/utils/api-error';

interface KnowledgeTreeDataNode {
  key: string;
  title: string;
  nodeType: KnowledgeCanvasNodeType;
  nodeCount: number;
  isLeaf: boolean;
  children?: KnowledgeTreeDataNode[];
}

interface LayoutNode {
  id: string;
  node: KnowledgeCanvasNode;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutConnector {
  id: string;
  parent: LayoutNode;
  child: LayoutNode;
}

interface CanvasViewport {
  scale: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  startTranslateX: number;
  startTranslateY: number;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 58;
const ROOT_WIDTH = 194;
const ROOT_HEIGHT = 62;
const HORIZONTAL_GAP = 74;
const VERTICAL_GAP = 14;
const MIN_CANVAS_SCALE = 0.5;
const MAX_CANVAS_SCALE = 2;
const ZOOM_STEP = 0.05;

const loading = ref(false);
const totalNodeCount = ref(0);
const treeData = ref<KnowledgeCanvasNode[]>([]);
const canvasData = ref<KnowledgeCanvasNode[]>([]);
const selectedRootId = ref('');
const activeNodeId = ref('');
const keyword = ref('');
const expandedKeys = ref<string[]>([]);
const detailOpen = ref(false);
const detailNode = ref<KnowledgeCanvasNode>();
const canvasBodyRef = ref<HTMLElement>();
const viewport = reactive<CanvasViewport>({
  scale: 1,
  translateX: 0,
  translateY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  startTranslateX: 0,
  startTranslateY: 0,
});

const selectedRoot = computed(() => canvasData.value[0]);
const selectedTreeKeys = computed(() => (selectedRootId.value ? [selectedRootId.value] : []));
const scalePercent = computed(() => Math.round(viewport.scale * 100));
const treeDataSource = computed(() => toTreeNodes(filterTree(treeData.value, keyword.value)));

const layoutResult = computed(() => {
  if (!selectedRoot.value) {
    return {
      nodes: [] as LayoutNode[],
      connectors: [] as LayoutConnector[],
      width: 1,
      height: 1,
    };
  }

  const record = layoutNode(selectedRoot.value, 0, 72, 44);
  const nodeMap = new Map(record.nodes.map((item) => [String(item.id), item]));
  const connectors: LayoutConnector[] = [];

  record.nodes.forEach((item) => {
    getVisibleChildren(item.node).forEach((child) => {
      const childLayout = nodeMap.get(String(child.id));
      if (childLayout) {
        connectors.push({
          id: `${item.id}-${childLayout.id}`,
          parent: item,
          child: childLayout,
        });
      }
    });
  });

  return {
    nodes: record.nodes,
    connectors,
    width: Math.max(...record.nodes.map((item) => item.x + item.width), 800) + 120,
    height: Math.max(...record.nodes.map((item) => item.y + item.height), 420) + 120,
  };
});
const layoutNodes = computed(() => layoutResult.value.nodes);
const layoutConnectors = computed(() => layoutResult.value.connectors);
const layoutSize = computed(() => ({
  width: layoutResult.value.width,
  height: layoutResult.value.height,
}));
const canvasInnerStyle = computed<CSSProperties>(() => ({
  width: `${layoutSize.value.width}px`,
  height: `${layoutSize.value.height}px`,
  transform: `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.scale})`,
  transformOrigin: '0 0',
}));

onMounted(async () => {
  await reloadPage();
});

onUnmounted(() => {
  stopCanvasDrag();
});

watch(keyword, (value) => {
  if (value) {
    expandedKeys.value = collectTreeKeys(treeDataSource.value);
  }
});

async function reloadPage() {
  loading.value = true;

  try {
    const [tree, count] = await Promise.all([getKnowledgeCanvasTreeApi(), getKnowledgeCanvasTotalApi()]);
    treeData.value = tree;
    totalNodeCount.value = count;
    expandedKeys.value = collectTreeKeys(toTreeNodes(tree)).slice(0, 3);

    if (selectedRootId.value) {
      const selectedLeaf = findNodeById(tree, selectedRootId.value);
      if (selectedLeaf && isLeafNode(selectedLeaf)) {
        await selectCanvasRoot(selectedLeaf);
      } else {
        clearCanvasData(true);
      }
    }
  } catch (error) {
    message.error(getErrorMessage(error, '知识库加载失败'));
  } finally {
    loading.value = false;
  }
}

async function selectCanvasRoot(node: KnowledgeCanvasNode) {
  if (!isLeafNode(node)) {
    toggleTreeExpanded(node.id);
    return;
  }

  selectedRootId.value = String(node.id);

  try {
    const canvasNode = await getKnowledgeCanvasNodeDetailApi(node.id);
    canvasData.value = canvasNode ? [canvasNode] : [];
    activeNodeId.value = canvasNode ? String(canvasNode.id) : '';
  } catch (error) {
    clearCanvasData();
    message.error(getErrorMessage(error, '流程数据加载失败'));
  } finally {
    resetCanvas();
  }
}

function handleTreeSelect(keys: Array<string | number>, info?: { node?: { key?: string | number } }) {
  const nextId = keys[0] ?? info?.node?.key;
  const node = nextId ? findNodeById(treeData.value, nextId) : undefined;
  if (!node) {
    return;
  }

  if (!isLeafNode(node)) {
    toggleTreeExpanded(node.id);
    return;
  }

  void selectCanvasRoot(node);
}

function toggleTreeExpanded(id: ApiId) {
  const key = String(id);
  expandedKeys.value = expandedKeys.value.includes(key)
    ? expandedKeys.value.filter((item) => item !== key)
    : [...expandedKeys.value, key];
}

function clearCanvasData(clearSelection = false) {
  if (clearSelection) {
    selectedRootId.value = '';
  }
  canvasData.value = [];
  activeNodeId.value = '';
  detailNode.value = undefined;
  detailOpen.value = false;
}

function expandAllTree() {
  expandedKeys.value = collectTreeKeys(toTreeNodes(treeData.value));
}

function collapseAllTree() {
  expandedKeys.value = [];
}

function locateFirstMatchedNode() {
  const value = keyword.value.trim().toLowerCase();
  if (!value) {
    message.warning('请输入要搜索的节点名称');
    return;
  }

  const matchedCanvasNode = flattenNodes(canvasData.value).find((item) => isMatchedNode(item, value));
  if (matchedCanvasNode) {
    openDetail(matchedCanvasNode);
    return;
  }

  const matchedTreeNode = flattenNodes(treeData.value).find((item) => isMatchedNode(item, value));
  const leafNode = matchedTreeNode && (isLeafNode(matchedTreeNode) ? matchedTreeNode : findFirstLeafNode([matchedTreeNode]));

  if (!leafNode) {
    message.warning('未找到匹配节点');
    return;
  }

  expandedKeys.value = Array.from(new Set([...expandedKeys.value, ...getAncestorKeys(treeData.value, leafNode.id)]));
  void selectCanvasRoot(leafNode);
}

function openDetail(node?: KnowledgeCanvasNode) {
  if (!node) {
    return;
  }
  activeNodeId.value = String(node.id);
  detailNode.value = clone(node);
  detailOpen.value = true;
}

function zoomCanvas(step: number, origin?: { clientX: number; clientY: number }) {
  setCanvasScale(viewport.scale + step, origin);
}

function setCanvasScale(nextScale: number, origin?: { clientX: number; clientY: number }) {
  const scale = normalizeCanvasScale(nextScale);
  if (scale === viewport.scale) {
    return;
  }

  const zoomOrigin = getCanvasZoomOrigin(origin);
  const ratio = scale / viewport.scale;
  viewport.translateX = roundCanvasValue(zoomOrigin.x - (zoomOrigin.x - viewport.translateX) * ratio);
  viewport.translateY = roundCanvasValue(zoomOrigin.y - (zoomOrigin.y - viewport.translateY) * ratio);
  viewport.scale = scale;
}

function normalizeCanvasScale(scale: number) {
  return roundCanvasValue(Math.min(MAX_CANVAS_SCALE, Math.max(MIN_CANVAS_SCALE, scale)));
}

function roundCanvasValue(value: number) {
  return Number(value.toFixed(2));
}

function getCanvasZoomOrigin(origin?: { clientX: number; clientY: number }) {
  const rect = canvasBodyRef.value?.getBoundingClientRect();
  if (!rect) {
    return { x: 0, y: 0 };
  }

  if (origin) {
    return {
      x: origin.clientX - rect.left,
      y: origin.clientY - rect.top,
    };
  }

  return {
    x: rect.width / 2,
    y: rect.height / 2,
  };
}

function resetCanvas() {
  viewport.scale = 1;
  viewport.translateX = 0;
  viewport.translateY = 0;
}

function handleCanvasWheel(event: WheelEvent) {
  if (event.metaKey || event.ctrlKey) {
    event.preventDefault();
    zoomCanvas(event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP, event);
    return;
  }

  if (!event.deltaX && !event.deltaY) {
    return;
  }

  event.preventDefault();
  viewport.translateX = roundCanvasValue(viewport.translateX - event.deltaX);
  viewport.translateY = roundCanvasValue(viewport.translateY - event.deltaY);
}

function startCanvasDrag(event: MouseEvent) {
  if (event.button !== 0 || !canStartCanvasDrag(event)) {
    return;
  }

  viewport.isDragging = true;
  viewport.dragStartX = event.clientX;
  viewport.dragStartY = event.clientY;
  viewport.startTranslateX = viewport.translateX;
  viewport.startTranslateY = viewport.translateY;
  window.addEventListener('mousemove', handleCanvasDrag);
  window.addEventListener('mouseup', stopCanvasDrag);
  document.body.style.cursor = 'grabbing';
  event.preventDefault();
}

function canStartCanvasDrag(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return !target.closest('.canvas-node, .zoom-bar, .canvas-badge, button, a, input, textarea, [role="button"]');
}

function handleCanvasDrag(event: MouseEvent) {
  if (!viewport.isDragging) {
    return;
  }

  viewport.translateX = roundCanvasValue(viewport.startTranslateX + event.clientX - viewport.dragStartX);
  viewport.translateY = roundCanvasValue(viewport.startTranslateY + event.clientY - viewport.dragStartY);
  event.preventDefault();
}

function stopCanvasDrag() {
  if (!viewport.isDragging) {
    return;
  }

  viewport.isDragging = false;
  window.removeEventListener('mousemove', handleCanvasDrag);
  window.removeEventListener('mouseup', stopCanvasDrag);
  document.body.style.cursor = '';
}

function layoutNode(node: KnowledgeCanvasNode, depth: number, x: number, top: number): { nodes: LayoutNode[]; height: number } {
  const width = depth === 0 ? ROOT_WIDTH : NODE_WIDTH;
  const height = depth === 0 ? ROOT_HEIGHT : NODE_HEIGHT;
  const children = getVisibleChildren(node);
  const childX = x + width + HORIZONTAL_GAP;
  const childRecords: Array<{ nodes: LayoutNode[]; height: number }> = [];
  let childTop = top;
  let childrenHeight = 0;

  children.forEach((child, index) => {
    const record = layoutNode(child, depth + 1, childX, childTop);
    childRecords.push(record);
    childrenHeight += record.height;
    if (index < children.length - 1) {
      childrenHeight += VERTICAL_GAP;
    }
    childTop += record.height + VERTICAL_GAP;
  });

  const blockHeight = Math.max(height, childrenHeight || height);
  const nodeLayout: LayoutNode = {
    id: String(node.id),
    node,
    depth,
    x,
    y: top + (blockHeight - height) / 2,
    width,
    height,
  };
  const offset = childrenHeight && blockHeight > childrenHeight ? (blockHeight - childrenHeight) / 2 : 0;
  const nodes = [nodeLayout];

  childRecords.forEach((record) => {
    if (offset) {
      record.nodes.forEach((item) => {
        item.y += offset;
      });
    }
    nodes.push(...record.nodes);
  });

  return {
    nodes,
    height: blockHeight,
  };
}

function getVisibleChildren(node: KnowledgeCanvasNode) {
  return [...(node.children ?? []), ...(node.summaryGroups ?? [])];
}

function getNodeStyle(item: LayoutNode): CSSProperties {
  return {
    width: `${item.width}px`,
    height: `${item.height}px`,
    transform: `translate(${item.x}px, ${item.y}px)`,
  };
}

function getConnectorPath(connector: LayoutConnector) {
  const startX = connector.parent.x + connector.parent.width;
  const startY = connector.parent.y + connector.parent.height / 2;
  const endX = connector.child.x;
  const endY = connector.child.y + connector.child.height / 2;
  const middleX = startX + (endX - startX) * 0.48;
  return `M ${startX} ${startY} C ${middleX} ${startY}, ${middleX} ${endY}, ${endX} ${endY}`;
}

function toTreeNodes(nodes: KnowledgeCanvasNode[]): KnowledgeTreeDataNode[] {
  return nodes
    .slice()
    .sort((prev, next) => prev.sort - next.sort)
    .map((node) => {
      const children = node.children?.length ? toTreeNodes(node.children) : undefined;

      return {
        key: String(node.id),
        title: node.title,
        nodeType: node.type,
        nodeCount: node.children?.length ?? 0,
        isLeaf: !children?.length,
        children,
      };
    });
}

function filterTree(nodes: KnowledgeCanvasNode[], value: string): KnowledgeCanvasNode[] {
  const searchText = value.trim().toLowerCase();
  if (!searchText) {
    return nodes;
  }

  return nodes.reduce<KnowledgeCanvasNode[]>((result, node) => {
    const children = filterTree(node.children ?? [], value);
    const matched = isMatchedNode(node, searchText);

    if (matched) {
      result.push({
        ...node,
        children: node.children ?? [],
      });
    } else if (children.length) {
      result.push({
        ...node,
        children,
      });
    }
    return result;
  }, []);
}

function isMatchedNode(node: KnowledgeCanvasNode, searchText: string) {
  return [node.title, node.summary, node.content, node.tags.join(' ')].join(' ').toLowerCase().includes(searchText);
}

function collectTreeKeys(nodes: KnowledgeTreeDataNode[]): string[] {
  return nodes.flatMap((node) => [node.key, ...collectTreeKeys(node.children ?? [])]);
}

function flattenNodes(nodes: KnowledgeCanvasNode[]): KnowledgeCanvasNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children ?? []), ...flattenNodes(node.summaryGroups ?? [])]);
}

function isLeafNode(node: KnowledgeCanvasNode) {
  return !node.children?.length;
}

function findFirstLeafNode(nodes: KnowledgeCanvasNode[]): KnowledgeCanvasNode | undefined {
  for (const node of nodes) {
    if (isLeafNode(node)) {
      return node;
    }

    const leaf = findFirstLeafNode(node.children ?? []);
    if (leaf) {
      return leaf;
    }
  }

  return undefined;
}

function getAncestorKeys(nodes: KnowledgeCanvasNode[], id: ApiId, parents: string[] = []): string[] {
  for (const node of nodes) {
    if (String(node.id) === String(id)) {
      return parents;
    }
    const found = getAncestorKeys(node.children ?? [], id, [...parents, String(node.id)]);
    if (found.length) {
      return found;
    }
  }
  return [];
}

function findNodeById(nodes: KnowledgeCanvasNode[], id?: ApiId): KnowledgeCanvasNode | undefined {
  if (!id) {
    return undefined;
  }

  for (const node of nodes) {
    if (String(node.id) === String(id)) {
      return node;
    }
    const child = findNodeById(node.children ?? [], id);
    if (child) {
      return child;
    }
    const summary = findNodeById(node.summaryGroups ?? [], id);
    if (summary) {
      return summary;
    }
  }
  return undefined;
}

function getNodeTypeLabel(type: KnowledgeCanvasNodeType) {
  const labelMap: Record<KnowledgeCanvasNodeType, string> = {
    category: '流程',
    topic: '主题',
    question: '节点',
    summary: '概要',
  };
  return labelMap[type] ?? '节点';
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}
</script>

<style scoped lang="scss">
.knowledge-base-page {
  --knowledge-primary: #1677ff;
  --knowledge-primary-strong: #0958d9;
  --knowledge-primary-soft: #eaf4ff;
  --knowledge-primary-softer: #f5f9ff;
  --knowledge-bg: linear-gradient(135deg, #e8f3ff 0%, #f8fbff 46%, #eef7ff 100%);
  --knowledge-surface: rgb(255 255 255 / 94%);
  --knowledge-surface-solid: #ffffff;
  --knowledge-border: #d8e8ff;
  --knowledge-text: #20314d;
  --knowledge-text-muted: #64748b;
  --knowledge-text-light: #90a4bd;
  --knowledge-control-text: #355176;
  --knowledge-control-disabled: #b7c7dc;
  --knowledge-canvas-bg: #f4f9ff;
  --knowledge-dot: #c9ddf8;
  --knowledge-node-icon: #426b99;
  --knowledge-node-icon-bg: #eef6ff;
  --knowledge-shadow: 0 10px 28px rgb(22 119 255 / 9%);

  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  min-height: calc(100vh - 116px);
  padding: 16px;
  color: var(--knowledge-text);
  background: var(--knowledge-bg);
  border: 1px solid var(--knowledge-border);
  border-radius: 12px;
}

.knowledge-sidebar,
.knowledge-canvas {
  min-height: 0;
  overflow: hidden;
  background: var(--knowledge-surface);
  border: 1px solid var(--knowledge-border);
  border-radius: 12px;
  box-shadow: var(--knowledge-shadow);
}

.knowledge-sidebar {
  display: flex;
  flex-direction: column;
  padding: 14px;

  &__header {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 14px;
  }

  &__icon {
    display: grid;
    width: 38px;
    height: 38px;
    color: #fff;
    background: linear-gradient(135deg, var(--knowledge-primary), #69b1ff);
    border-radius: 10px;
    place-items: center;
  }

  &__title {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    strong {
      color: var(--knowledge-text);
      font-size: 15px;
    }

    span {
      color: var(--knowledge-text-muted);
      font-size: 12px;
    }
  }

  &__search {
    margin-bottom: 12px;
    background: var(--knowledge-primary-softer);
    border-color: var(--knowledge-border);
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    color: var(--knowledge-text-muted);
    font-size: 12px;

    a {
      color: var(--knowledge-primary);
    }
  }
}

.knowledge-tree {
  flex: 1;
  min-height: 0;
  overflow: auto;

  :deep(.ant-tree-treenode) {
    width: 100%;
    padding: 2px 0;
  }

  :deep(.ant-tree-node-content-wrapper) {
    flex: 1;
    min-width: 0;
  }

  :deep(.ant-tree-node-selected) {
    color: var(--knowledge-primary-strong);
    background: var(--knowledge-primary-soft);
    box-shadow: inset 3px 0 0 var(--knowledge-primary);
  }
}

.knowledge-tree__node {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-width: 0;
  color: var(--knowledge-text);

  &.is-parent {
    color: var(--knowledge-text-muted);
  }
}

.knowledge-tree__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-tree__count {
  flex: none;
  min-width: 22px;
  padding: 0 7px;
  color: var(--knowledge-primary);
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  background: var(--knowledge-primary-soft);
  border-radius: 999px;
}

.knowledge-canvas {
  display: flex;
  flex-direction: column;
}

.canvas-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  min-height: 68px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--knowledge-border);
}

.canvas-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  button {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    height: 32px;
    padding: 0 12px;
    color: var(--knowledge-control-text);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 8px;

    &:hover {
      color: var(--knowledge-primary-strong);
      background: var(--knowledge-primary-soft);
    }
  }
}

.canvas-toolbar__search {
  width: 240px;
  background: var(--knowledge-primary-softer);
  border-color: var(--knowledge-border);
}

.process-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;

  span {
    color: var(--knowledge-text-light);
    font-size: 12px;
  }

  strong {
    max-width: 420px;
    overflow: hidden;
    color: var(--knowledge-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    padding: 2px 8px;
    color: var(--knowledge-primary-strong);
    font-size: 12px;
    font-style: normal;
    background: var(--knowledge-primary-soft);
    border-radius: 999px;
  }
}

.canvas-body {
  position: relative;
  flex: 1;
  min-height: 620px;
  overflow: hidden;
  background: var(--knowledge-canvas-bg);

  &--dragging {
    cursor: grabbing;
    user-select: none;
  }
}

.canvas-dots {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(var(--knowledge-dot) 1px, transparent 1px);
  background-size: 24px 24px;
}

.canvas-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.canvas-inner {
  position: absolute;
  inset: 0 auto auto 0;
  transition: transform 0.16s ease;
}

.canvas-lines {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.canvas-node {
  position: absolute;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  background: var(--knowledge-surface-solid);
  border: 1px solid var(--knowledge-border);
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(15 78 148 / 9%);
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;

  &:hover,
  &--active {
    border-color: var(--knowledge-primary);
    box-shadow: 0 12px 26px rgb(22 119 255 / 16%);
  }

  &--root {
    color: #fff;
    background: linear-gradient(135deg, var(--knowledge-primary-strong), #69b1ff);
    border-color: transparent;

    .canvas-node__icon {
      color: var(--knowledge-primary-strong);
      background: #fff;
      border-color: transparent;
    }

    .canvas-node__summary {
      color: rgb(255 255 255 / 78%);
    }
  }

  &--summary {
    border-style: dashed;
  }
}

.canvas-node__icon {
  display: grid;
  flex: none;
  width: 34px;
  height: 34px;
  color: var(--knowledge-node-icon);
  background: var(--knowledge-node-icon-bg);
  border: 1px solid var(--knowledge-border);
  border-radius: 9px;
  place-items: center;
}

.canvas-node__main {
  min-width: 0;
}

.canvas-node__title {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-node__summary {
  margin-top: 3px;
  overflow: hidden;
  color: var(--knowledge-text-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-badge {
  position: absolute;
  top: 16px;
  right: 18px;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  color: var(--knowledge-text-muted);
  background: var(--knowledge-surface);
  border: 1px solid var(--knowledge-border);
  border-radius: 999px;

  strong {
    color: var(--knowledge-primary-strong);
    font-size: 12px;
  }
}

.zoom-bar {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 7px;
  background: var(--knowledge-surface);
  border: 1px solid var(--knowledge-border);
  border-radius: 999px;
  box-shadow: var(--knowledge-shadow);

  button {
    display: inline-flex;
    flex: 0 0 30px;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    margin: 0;
    padding: 0;
    overflow: hidden;
    color: var(--knowledge-control-text);
    font: inherit;
    line-height: 1;
    cursor: pointer;
    appearance: none;
    background: transparent;
    border: 0;
    border-radius: 50%;
    -webkit-tap-highlight-color: transparent;

    :deep(.anticon) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      line-height: 1;
    }

    :deep(svg) {
      display: block;
    }

    &:hover {
      color: var(--knowledge-primary-strong);
      background: var(--knowledge-primary-soft);
    }
  }

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 30px;
    color: var(--knowledge-text);
    font-size: 12px;
    line-height: 1;
    text-align: center;
  }
}

.node-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.node-detail__section {
  h3 {
    margin: 0 0 8px;
    color: var(--knowledge-text);
    font-size: 14px;
  }
}

.node-detail__content {
  min-height: 110px;
  padding: 12px;
  color: var(--knowledge-text);
  line-height: 1.7;
  white-space: pre-line;
  background: var(--knowledge-primary-softer);
  border: 1px solid var(--knowledge-border);
  border-radius: 10px;
}

:global(html.dark) .knowledge-base-page {
  --knowledge-primary: #69b1ff;
  --knowledge-primary-strong: #1677ff;
  --knowledge-primary-soft: rgb(22 119 255 / 16%);
  --knowledge-primary-softer: #101d31;
  --knowledge-bg: linear-gradient(135deg, #0d1b2f 0%, #111827 52%, #0b223d 100%);
  --knowledge-surface: rgb(17 24 39 / 92%);
  --knowledge-surface-solid: #172033;
  --knowledge-border: #254366;
  --knowledge-text: #e5eefb;
  --knowledge-text-muted: #9fb4cc;
  --knowledge-text-light: #7890aa;
  --knowledge-control-text: #b7d8ff;
  --knowledge-control-disabled: #56718f;
  --knowledge-canvas-bg: #0f1d31;
  --knowledge-dot: rgb(105 177 255 / 22%);
  --knowledge-node-icon: #b7d8ff;
  --knowledge-node-icon-bg: rgb(22 119 255 / 16%);
  --knowledge-shadow: 0 10px 28px rgb(0 0 0 / 24%);
}

@media (max-width: 1180px) {
  .knowledge-base-page {
    grid-template-columns: 260px minmax(0, 1fr);
  }

  .canvas-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 900px) {
  .knowledge-base-page {
    grid-template-columns: 1fr;
  }

  .knowledge-sidebar {
    min-height: 320px;
  }

  .canvas-toolbar__search {
    width: min(100%, 260px);
  }
}
</style>
