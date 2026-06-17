<template>
  <div class="knowledge-canvas-page">
    <aside class="knowledge-sidebar">
      <div class="knowledge-sidebar__header">
        <div class="knowledge-sidebar__icon">
          <BookOutlined />
        </div>
        <div class="knowledge-sidebar__title">
          <strong>流程目录</strong>
          <span>知识节点关系图</span>
        </div>
        <a-button type="text" size="small" title="收起目录">
          <MenuFoldOutlined />
        </a-button>
      </div>

      <a-input
        v-model:value="keyword"
        allow-clear
        class="knowledge-sidebar__search"
        placeholder="搜索"
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
        <div class="canvas-toolbar__group">
          <button v-for="item in nodeActions" :key="item.label" type="button" :disabled="item.disabled" @click="item.handler">
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <div class="canvas-toolbar__status">
          <div class="process-meta">
            <span>流程状态</span>
            <strong>{{ selectedRoot?.title || '未加载流程' }}</strong>
            <em>{{ processStatusLabel }}</em>
          </div>
          <button type="button" @click="setProcessStatus('published')">
            <SendOutlined />
            <span>发布</span>
          </button>
          <button type="button" @click="setProcessStatus('draft')">
            <CheckOutlined />
            <span>暂存</span>
          </button>
          <button type="button" @click="setProcessStatus('offline')">
            <DownloadOutlined />
            <span>下架</span>
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
          <a-empty description="暂无流程数据" />
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
              'canvas-node--selected': selectedNodeIds.includes(String(item.id)),
              'canvas-node--summary': item.node.isSummary,
            }"
            :style="getNodeStyle(item)"
            @click="handleNodeClick(item.node, $event)"
            @dblclick="openDetail(item.node)"
          >
            <div class="canvas-node__icon">{{ item.node.isSummary ? 'Σ' : '文' }}</div>
            <div class="canvas-node__title">{{ item.node.title }}</div>
            <div v-if="item.node.isSummary" class="canvas-node__summary">
              {{ item.node.summarySourceNodeIds?.length || 0 }} 个来源节点
            </div>
            <div class="canvas-node__actions">
              <button v-if="item.node.children?.length" type="button" title="展开/折叠节点" @click.stop="toggleCanvasCollapse(item.node)">
                <RightOutlined v-if="isCanvasCollapsed(item.node.id)" />
                <DownOutlined v-else />
              </button>
              <button type="button" title="新增子节点" @click.stop="openAddNode(item.node)">
                <PlusOutlined />
              </button>
              <button type="button" title="节点详情" @click.stop="openDetail(item.node)">
                <CommentOutlined />
              </button>
            </div>
          </article>
        </div>

        <aside class="right-panel">
          <button type="button" :disabled="!canUndo" @click="undo">
            <UndoOutlined />
            <span>回退</span>
          </button>
          <button type="button" :disabled="!canRedo" @click="redo">
            <RedoOutlined />
            <span>前进</span>
          </button>
          <button type="button" @click="reloadPage">
            <ReloadOutlined />
            <span>刷新</span>
          </button>
          <a-divider />
          <button type="button" @click="zoomCanvas(ZOOM_STEP)">
            <PlusOutlined />
            <span>放大</span>
          </button>
          <button type="button" @click="zoomCanvas(-ZOOM_STEP)">
            <MinusOutlined />
            <span>缩小</span>
          </button>
          <button type="button" @click="resetCanvas">
            <CompressOutlined />
            <span>适应</span>
          </button>
        </aside>

        <div class="canvas-badge">
          <span>Canvas</span>
          <strong>正式版</strong>
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

    <a-drawer v-model:open="detailOpen" width="520">
      <template #title>
        <div v-if="detailNode" class="node-detail-title">
          <strong>{{ getDetailTitle(detailNode) }}</strong>
          <span>更新时间 {{ detailNode.updatedAt || '-' }}</span>
        </div>
        <span v-else>节点详情</span>
      </template>
      <a-empty v-if="!detailNode" description="暂无节点详情" />
      <div v-else class="node-detail">
        <div class="node-detail__content rich-text-content" v-html="formatRichText(detailNode.content)"></div>
        <section v-if="detailNode.links.length" class="node-detail__links">
          <strong>关联制度文档</strong>
          <a v-for="link in detailNode.links" :key="link.url" :href="link.url" target="_blank" rel="noreferrer">
            {{ link.name }}
          </a>
        </section>
      </div>
    </a-drawer>

    <a-drawer v-model:open="historyOpen" title="历史记录" width="460">
      <a-empty v-if="!activeNode?.versions.length" description="暂无历史记录" />
      <a-timeline v-else>
        <a-timeline-item v-for="item in activeNode.versions" :key="`${item.version}-${item.updatedAt}`">
          <strong>{{ item.version }}</strong>
          <p>{{ item.remark || '节点更新' }}</p>
          <span>{{ item.updatedAt }} {{ item.updatedBy || '' }}</span>
        </a-timeline-item>
      </a-timeline>
    </a-drawer>

    <a-modal
      v-model:open="nodeModalOpen"
      :title="nodeFormMode === 'add' ? '新增节点' : '编辑节点'"
      destroy-on-close
      width="720px"
      @ok="submitNodeForm"
    >
      <a-form layout="vertical">
        <a-form-item label="节点名称" required>
          <a-input v-model:value="nodeForm.title" placeholder="请输入节点名称" />
        </a-form-item>
        <a-form-item>
          <div class="rich-editor">
            <Toolbar class="rich-editor__toolbar" :editor="editorRef" :default-config="toolbarConfig" mode="simple" />
            <Editor
              v-model="nodeForm.content"
              class="rich-editor__body"
              :default-config="editorConfig"
              mode="simple"
              @on-created="handleEditorCreated"
            />
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="linkModalOpen" title="添加超链接" destroy-on-close width="520px" @ok="submitLinkForm">
      <a-form layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model:value="linkForm.name" placeholder="请输入超链接名称" />
        </a-form-item>
        <a-form-item label="链接地址" required>
          <a-input v-model:value="linkForm.url" placeholder="https://example.com" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="moveModalOpen" title="移动节点" destroy-on-close width="520px" @ok="submitMoveNode">
      <a-form layout="vertical">
        <a-form-item label="当前节点">
          <a-input :value="activeNode?.title" disabled />
        </a-form-item>
        <a-form-item label="移动到父节点" required>
          <a-tree-select
            v-model:value="moveTargetParentId"
            :tree-data="moveTargetTree"
            placeholder="请选择新的父节点"
            tree-default-expand-all
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import {
  AimOutlined,
  BookOutlined,
  CheckOutlined,
  CommentOutlined,
  CompressOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  LinkOutlined,
  MenuFoldOutlined,
  MinusOutlined,
  PlusOutlined,
  RedoOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
  SendOutlined,
  UndoOutlined,
} from '@ant-design/icons-vue';

import {
  getKnowledgeCanvasNodeDetailApi,
  getKnowledgeCanvasTotalApi,
  getKnowledgeCanvasTreeApi,
  type KnowledgeCanvasNode,
  type KnowledgeCanvasNodeType,
  type KnowledgeCanvasProcessStatus,
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

interface MoveTargetTreeNode {
  key: string;
  title: string;
  value: string;
  disabled?: boolean;
  children?: MoveTargetTreeNode[];
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

interface HistoryRecord {
  label: string;
  before: CanvasSnapshot;
  after: CanvasSnapshot;
}

interface CanvasSnapshot {
  canvasData: KnowledgeCanvasNode[];
  selectedRootId: string;
  activeNodeId: string;
  collapsedCanvasKeys: string[];
  viewport: {
    scale: number;
    translateX: number;
    translateY: number;
  };
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

interface NodeLocation {
  node: KnowledgeCanvasNode;
  parent?: KnowledgeCanvasNode;
  siblings: KnowledgeCanvasNode[];
  index: number;
}

const NODE_WIDTH = 260;
const NODE_HEIGHT = 58;
const ROOT_WIDTH = 248;
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
const collapsedCanvasKeys = ref<string[]>([]);
const detailOpen = ref(false);
const historyOpen = ref(false);
const nodeModalOpen = ref(false);
const linkModalOpen = ref(false);
const moveModalOpen = ref(false);
const nodeFormMode = ref<'add' | 'edit'>('add');
const nodeFormParentId = ref('');
const editingNodeId = ref('');
const moveTargetParentId = ref<string>();
const detailNode = ref<KnowledgeCanvasNode>();
const editorRef = ref<IDomEditor>();
const selectedNodeIds = ref<string[]>([]);
const undoStack = ref<HistoryRecord[]>([]);
const redoStack = ref<HistoryRecord[]>([]);
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
const nodeForm = reactive({
  title: '',
  content: '',
});
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video', 'insertImage', 'uploadImage', 'insertTable', 'codeBlock', 'fullScreen'],
};
const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入节点备注，支持标题、列表、加粗和链接',
  MENU_CONF: {
    uploadImage: {
      disabled: true,
    },
  },
};
const linkForm = reactive({
  name: '',
  url: '',
});

const selectedRoot = computed(() => canvasData.value[0]);
const activeNode = computed(() => {
  const scope = selectedRoot.value ? [selectedRoot.value] : canvasData.value;
  return findNodeById(scope, activeNodeId.value) ?? selectedRoot.value;
});
const selectedTreeKeys = computed(() => (selectedRootId.value ? [selectedRootId.value] : []));
const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);
const scalePercent = computed(() => Math.round(viewport.scale * 100));
const processStatusLabel = computed(() => selectedRoot.value?.processStatusLabel || '发布');
const treeDataSource = computed(() => toTreeNodes(filterTree(treeData.value, keyword.value)));
const moveTargetTree = computed(() => toMoveTargetTree(canvasData.value, activeNode.value));

const nodeActions = computed(() => {
  const disabled = !activeNode.value;
  const activeSummary = Boolean(activeNode.value?.isSummary);
  return [
    { label: '新增节点', icon: PlusOutlined, disabled, handler: () => openAddNode(activeNode.value) },
    { label: '编辑节点', icon: EditOutlined, disabled, handler: () => openEditNode(activeNode.value) },
    { label: '删除节点', icon: DeleteOutlined, disabled, handler: () => confirmDeleteNode(activeNode.value) },
    { label: '节点备注', icon: FileTextOutlined, disabled, handler: () => openEditNode(activeNode.value) },
    { label: '历史记录', icon: HistoryOutlined, disabled, handler: () => (historyOpen.value = true) },
    { label: '添加超链接', icon: LinkOutlined, disabled, handler: () => openLinkModal(activeNode.value) },
    {
      label: activeSummary ? '删除概要' : '创建概要',
      icon: activeSummary ? DeleteOutlined : LinkOutlined,
      disabled: disabled || (!activeSummary && selectedNodeIds.value.length < 2),
      handler: () => (activeSummary ? deleteSummaryNode(activeNode.value) : createSummaryNode()),
    },
    { label: '移动节点', icon: FolderOpenOutlined, disabled: disabled || activeSummary, handler: () => openMoveNode(activeNode.value) },
    {
      label: activeNode.value && isCanvasCollapsed(activeNode.value.id) ? '展开节点' : '折叠节点',
      icon: DownOutlined,
      disabled: disabled || !activeNode.value?.children?.length,
      handler: () => activeNode.value && toggleCanvasCollapse(activeNode.value),
    },
    { label: '搜索节点', icon: SearchOutlined, disabled: false, handler: locateFirstMatchedNode },
  ];
});

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
  destroyEditor();
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
    message.error(getErrorMessage(error, '知识画布加载失败'));
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
  selectedNodeIds.value = [];

  try {
    const canvasNode = await getKnowledgeCanvasNodeDetailApi(node.id);
    canvasData.value = canvasNode ? [canvasNode] : [];
    activeNodeId.value = canvasNode ? String(canvasNode.id) : '';
    collapsedCanvasKeys.value = (canvasNode?.children ?? []).filter((child) => child.children?.length).map((child) => String(child.id));
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
  if (node) {
    void selectCanvasRoot(node);
  }
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
  selectedNodeIds.value = [];
  collapsedCanvasKeys.value = [];
}

function setActiveNode(node?: KnowledgeCanvasNode) {
  if (node) {
    activeNodeId.value = String(node.id);
  }
}

function handleNodeClick(node: KnowledgeCanvasNode, event: MouseEvent) {
  setActiveNode(node);

  if (event.ctrlKey || event.metaKey) {
    if (node.isSummary) {
      selectedNodeIds.value = [];
      message.warning('概要节点不能作为概要来源');
      return;
    }

    const id = String(node.id);
    selectedNodeIds.value = selectedNodeIds.value.includes(id)
      ? selectedNodeIds.value.filter((item) => item !== id)
      : [...selectedNodeIds.value, id];
    return;
  }

  selectedNodeIds.value = node.isSummary ? [] : [String(node.id)];
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

  const matchedNode = flattenNodes(treeData.value).find((item) =>
    [item.title, item.summary, item.tags.join(' ')].join(' ').toLowerCase().includes(value),
  );
  const node = matchedNode && (isLeafNode(matchedNode) ? matchedNode : findFirstLeafNode([matchedNode]));

  if (!node) {
    message.warning('未找到匹配节点');
    return;
  }

  expandedKeys.value = Array.from(new Set([...expandedKeys.value, ...getAncestorKeys(treeData.value, node.id)]));
  void selectCanvasRoot(node);
}

function openAddNode(parent?: KnowledgeCanvasNode) {
  if (!parent) {
    return;
  }
  nodeFormMode.value = 'add';
  nodeFormParentId.value = String(parent.id);
  editingNodeId.value = '';
  nodeForm.title = '';
  nodeForm.content = '';
  nodeModalOpen.value = true;
}

function openEditNode(node?: KnowledgeCanvasNode) {
  if (!node) {
    return;
  }
  nodeFormMode.value = 'edit';
  editingNodeId.value = String(node.id);
  nodeFormParentId.value = '';
  nodeForm.title = node.title;
  nodeForm.content = node.content;
  nodeModalOpen.value = true;
}

function submitNodeForm() {
  const title = nodeForm.title.trim();
  const content = normalizeRichText(nodeForm.content);
  if (!title) {
    message.warning('请输入节点名称');
    return;
  }

  if (nodeFormMode.value === 'add') {
    runWithHistory('新增节点', () => {
      const parent = findNodeById(canvasData.value, nodeFormParentId.value);
      if (!parent) {
        return;
      }
      const node = createLocalNode(title, parent.id, content);
      parent.children = [...(parent.children ?? []), node];
      activeNodeId.value = String(node.id);
      collapsedCanvasKeys.value = collapsedCanvasKeys.value.filter((id) => id !== String(parent.id));
    });
    message.success('节点已新增');
  } else {
    runWithHistory('编辑节点', () => {
      const node = findNodeById(canvasData.value, editingNodeId.value);
      if (!node) {
        return;
      }
      node.title = title;
      node.summary = `${title}知识节点。`;
      node.content = content || node.content;
      node.updatedAt = nowText();
      node.updatedBy = '当前用户';
      node.versions = [createVersion('编辑节点'), ...node.versions];
    });
    message.success('节点已更新');
  }

  nodeModalOpen.value = false;
}

function confirmDeleteNode(node?: KnowledgeCanvasNode) {
  if (!node) {
    return;
  }
  if (node.isSummary) {
    deleteSummaryNode(node);
    return;
  }
  if (String(node.id) === String(selectedRoot.value?.id)) {
    message.warning('根节点不能删除');
    return;
  }

  Modal.confirm({
    title: '删除节点',
    content: `确认删除节点“${node.title}”吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      runWithHistory('删除节点', () => {
        removeNodeById(canvasData.value, node.id);
        const nextNode = selectedRoot.value;
        if (nextNode) {
          activeNodeId.value = String(nextNode.id);
        }
        selectedNodeIds.value = [];
      });
      message.success('节点已删除');
    },
  });
}

function createSummaryNode() {
  const root = selectedRoot.value;
  if (!root) {
    message.warning('请先选择一个目录节点');
    return;
  }

  const targetIds = Array.from(new Set(selectedNodeIds.value.filter(Boolean)));
  if (targetIds.length < 2) {
    message.warning('请至少选择两个节点生成概要');
    return;
  }

  const locations = targetIds.map((id) => findNodeLocation([root], id));
  if (locations.some((item) => !item)) {
    message.warning('选中节点不在当前画布范围内');
    return;
  }

  const validLocations = locations as NodeLocation[];
  const firstParentId = validLocations[0]?.parent?.id;
  const hasSameParent = validLocations.every((item) => String(item.parent?.id) === String(firstParentId));
  if (!firstParentId || !hasSameParent) {
    message.warning('概要节点仅支持同一父级下的多个节点');
    return;
  }

  const selectedIdSet = new Set(targetIds);
  const selectedNodes = validLocations.map((item) => item.node);
  if (selectedNodes.some((node) => hasDescendant(node, selectedIdSet))) {
    message.warning('请不要同时选择父子节点生成概要');
    return;
  }
  if (selectedNodes.some((node) => node.isSummary)) {
    message.warning('概要节点不能作为概要来源');
    return;
  }

  const parentId = firstParentId;
  runWithHistory('创建概要', () => {
    const parent = findNodeById(canvasData.value, parentId);
    if (!parent) {
      return;
    }

    const sourceNodes = selectedNodes.map((node) => ({
      id: node.id,
      title: node.title,
      type: node.type,
    }));
    const now = nowText();
    const summaryNode: KnowledgeCanvasNode = {
      id: `summary-${Date.now()}`,
      parentId: parent.id,
      title: `概要（${sourceNodes.length}项）`,
      type: 'summary',
      isSummary: true,
      relationType: 'summary',
      sort: (parent.summaryGroups?.length ?? 0) + 1,
      status: 'enabled',
      processStatus: 'draft',
      processStatusLabel: '暂存',
      summary: `由 ${sourceNodes.map((node) => node.title).join('、')} 生成的概要节点。`,
      content: sourceNodes.map((node) => node.title).join('、'),
      script: '',
      tip: '概要节点用于汇总当前父级下的多个知识节点。',
      help: '',
      policy: '',
      tags: ['概要'],
      links: [],
      versions: [createVersion('创建概要节点')],
      updatedAt: now,
      updatedBy: '当前用户',
      summarySourceNodeIds: sourceNodes.map((node) => node.id),
      summarySourceNodes: sourceNodes,
      children: [],
      summaryGroups: [],
    };

    parent.summaryGroups = [...(parent.summaryGroups ?? []), summaryNode];
    activeNodeId.value = String(summaryNode.id);
    selectedNodeIds.value = [];
    collapsedCanvasKeys.value = collapsedCanvasKeys.value.filter((id) => id !== String(parent.id));
  });
  message.success('概要节点已创建');
}

function deleteSummaryNode(node?: KnowledgeCanvasNode) {
  if (!node?.isSummary) {
    message.warning('请选择概要节点');
    return;
  }

  Modal.confirm({
    title: '删除概要',
    content: `确认删除概要“${node.title}”吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      const parentId = findNodeLocation(canvasData.value, node.id)?.parent?.id;
      runWithHistory('删除概要', () => {
        removeNodeById(canvasData.value, node.id);
        const nextNode = (parentId ? findNodeById(canvasData.value, parentId) : undefined) ?? selectedRoot.value;
        if (nextNode) {
          activeNodeId.value = String(nextNode.id);
        }
        selectedNodeIds.value = [];
        collapsedCanvasKeys.value = collapsedCanvasKeys.value.filter((id) => id !== String(node.id));
      });
      message.success('概要节点已删除');
    },
  });
}

function openMoveNode(node?: KnowledgeCanvasNode) {
  if (!node) {
    return;
  }
  if (!node.parentId) {
    message.warning('根节点不能移动');
    return;
  }
  if (node.isSummary) {
    message.warning('概要节点暂不支持移动');
    return;
  }

  moveTargetParentId.value = String(node.parentId);
  moveModalOpen.value = true;
}

function submitMoveNode() {
  const movingNode = activeNode.value;
  const targetParentId = moveTargetParentId.value;

  if (!movingNode || !targetParentId) {
    message.warning('请选择要移动到的父节点');
    return;
  }
  if (!movingNode.parentId) {
    message.warning('根节点不能移动');
    return;
  }
  if (String(movingNode.parentId) === String(targetParentId)) {
    message.warning('当前节点已经在该父节点下');
    return;
  }

  const targetParent = findNodeById(canvasData.value, targetParentId);
  if (!targetParent) {
    message.warning('目标父节点不存在');
    return;
  }
  if (hasDescendant(movingNode, new Set([String(targetParent.id)]))) {
    message.warning('不能移动到自身或子节点下');
    return;
  }

  runWithHistory('移动节点', () => {
    const location = findNodeLocation(canvasData.value, movingNode.id);
    const parent = findNodeById(canvasData.value, targetParentId);
    if (!location || !parent) {
      return;
    }

    const [node] = location.siblings.splice(location.index, 1);
    location.siblings.forEach((item, index) => {
      item.sort = index + 1;
    });
    node.parentId = parent.id;
    node.sort = (parent.children?.length ?? 0) + 1;
    node.updatedAt = nowText();
    node.updatedBy = '当前用户';
    node.versions = [createVersion('移动节点'), ...node.versions];
    parent.children = [...(parent.children ?? []), node];
    activeNodeId.value = String(node.id);
    selectedNodeIds.value = [];
    collapsedCanvasKeys.value = collapsedCanvasKeys.value.filter((id) => id !== String(parent.id));
  });

  moveModalOpen.value = false;
  moveTargetParentId.value = undefined;
  message.success('节点已移动');
}

function openDetail(node?: KnowledgeCanvasNode) {
  if (!node) {
    return;
  }
  detailNode.value = clone(node);
  detailOpen.value = true;
  setActiveNode(node);
}

function openLinkModal(node?: KnowledgeCanvasNode) {
  if (!node) {
    return;
  }
  const link = node.links[0];
  linkForm.name = link?.name ?? '';
  linkForm.url = link?.url ?? '';
  linkModalOpen.value = true;
}

function submitLinkForm() {
  const name = linkForm.name.trim();
  const url = normalizeLink(linkForm.url);
  if (!name || !url) {
    message.warning('请填写完整的超链接名称和地址');
    return;
  }

  runWithHistory('添加超链接', () => {
    const node = activeNode.value ? findNodeById(canvasData.value, activeNode.value.id) : undefined;
    if (!node) {
      return;
    }
    node.links = [{ name, url }];
    node.versions = [createVersion('添加超链接'), ...node.versions];
  });
  linkModalOpen.value = false;
  message.success('超链接已保存');
}

function setProcessStatus(status: KnowledgeCanvasProcessStatus) {
  if (!selectedRoot.value) {
    return;
  }

  runWithHistory('修改流程状态', () => {
    const node = findNodeById(canvasData.value, selectedRoot.value?.id);
    if (!node) {
      return;
    }
    node.processStatus = status;
    node.processStatusLabel = status === 'published' ? '发布' : status === 'offline' ? '下架' : '暂存';
    node.updatedAt = nowText();
    node.updatedBy = '当前用户';
    node.versions = [createVersion(`流程${node.processStatusLabel}`), ...node.versions];
  });
  message.success(`流程已${status === 'published' ? '发布' : status === 'offline' ? '下架' : '暂存'}`);
}

function toggleCanvasCollapse(node: KnowledgeCanvasNode) {
  const id = String(node.id);
  if (isCanvasCollapsed(id)) {
    collapsedCanvasKeys.value = collapsedCanvasKeys.value.filter((item) => item !== id);
    return;
  }
  collapsedCanvasKeys.value = [...collapsedCanvasKeys.value, id];
}

function isCanvasCollapsed(id: ApiId) {
  return collapsedCanvasKeys.value.includes(String(id));
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

  return !target.closest('.canvas-node, .right-panel, .zoom-bar, .canvas-badge, .rich-editor, button, a, input, textarea, [role="button"]');
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

function undo() {
  const record = undoStack.value[undoStack.value.length - 1];
  if (!record) {
    return;
  }
  undoStack.value = undoStack.value.slice(0, -1);
  redoStack.value = [...redoStack.value, record];
  applySnapshot(record.before);
  message.success(`已回退：${record.label}`);
}

function redo() {
  const record = redoStack.value[redoStack.value.length - 1];
  if (!record) {
    return;
  }
  redoStack.value = redoStack.value.slice(0, -1);
  undoStack.value = [...undoStack.value, record];
  applySnapshot(record.after);
  message.success(`已前进：${record.label}`);
}

function runWithHistory(label: string, mutator: () => void) {
  const before = captureSnapshot();
  mutator();
  const after = captureSnapshot();
  undoStack.value = [...undoStack.value, { label, before, after }].slice(-30);
  redoStack.value = [];
}

function captureSnapshot(): CanvasSnapshot {
  return {
    canvasData: clone(canvasData.value),
    selectedRootId: selectedRootId.value,
    activeNodeId: activeNodeId.value,
    collapsedCanvasKeys: clone(collapsedCanvasKeys.value),
    viewport: {
      scale: viewport.scale,
      translateX: viewport.translateX,
      translateY: viewport.translateY,
    },
  };
}

function applySnapshot(snapshot: CanvasSnapshot) {
  canvasData.value = clone(snapshot.canvasData);
  selectedRootId.value = snapshot.selectedRootId;
  activeNodeId.value = snapshot.activeNodeId;
  collapsedCanvasKeys.value = clone(snapshot.collapsedCanvasKeys);
  selectedNodeIds.value = [];
  viewport.scale = snapshot.viewport.scale;
  viewport.translateX = snapshot.viewport.translateX;
  viewport.translateY = snapshot.viewport.translateY;
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
  if (isCanvasCollapsed(node.id)) {
    return [];
  }
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

function toMoveTargetTree(nodes: KnowledgeCanvasNode[], movingNode?: KnowledgeCanvasNode): MoveTargetTreeNode[] {
  return nodes
    .filter((node) => !node.isSummary)
    .slice()
    .sort((prev, next) => prev.sort - next.sort)
    .map((node) => {
      const disabled = movingNode
        ? String(node.id) === String(movingNode.id) || hasDescendant(movingNode, new Set([String(node.id)]))
        : false;

      return {
        key: String(node.id),
        title: node.title,
        value: String(node.id),
        disabled,
        children: node.children?.length ? toMoveTargetTree(node.children, movingNode) : undefined,
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
    const matched = [node.title, node.summary, node.tags.join(' ')].join(' ').toLowerCase().includes(searchText);

    if (matched || children.length) {
      result.push({
        ...node,
        children,
      });
    }
    return result;
  }, []);
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
    const summaryFound = getAncestorKeys(node.summaryGroups ?? [], id, [...parents, String(node.id)]);
    if (summaryFound.length) {
      return summaryFound;
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

function removeNodeById(nodes: KnowledgeCanvasNode[], id: ApiId): boolean {
  const index = nodes.findIndex((node) => String(node.id) === String(id));
  if (index >= 0) {
    nodes.splice(index, 1);
    return true;
  }

  return nodes.some((node) => {
    if (node.children?.length && removeNodeById(node.children, id)) {
      return true;
    }
    if (node.summaryGroups?.length && removeNodeById(node.summaryGroups, id)) {
      return true;
    }
    return false;
  });
}

function findNodeLocation(nodes: KnowledgeCanvasNode[], id: ApiId, parent?: KnowledgeCanvasNode): NodeLocation | undefined {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (String(node.id) === String(id)) {
      return {
        node,
        parent,
        siblings: nodes,
        index,
      };
    }

    const child = findNodeLocation(node.children ?? [], id, node);
    if (child) {
      return child;
    }
    const summary = findNodeLocation(node.summaryGroups ?? [], id, node);
    if (summary) {
      return summary;
    }
  }

  return undefined;
}

function hasDescendant(node: KnowledgeCanvasNode, targetIds: Set<string>): boolean {
  const children = [...(node.children ?? []), ...(node.summaryGroups ?? [])];
  return children.some((child) => targetIds.has(String(child.id)) || hasDescendant(child, targetIds));
}

function createLocalNode(title: string, parentId: ApiId, content: string): KnowledgeCanvasNode {
  const now = nowText();
  return {
    id: `local-node-${Date.now()}`,
    parentId,
    title,
    type: 'question',
    sort: Date.now(),
    status: 'enabled',
    processStatus: 'draft',
    processStatusLabel: '暂存',
    summary: `${title}知识节点。`,
    content: content || `<p>当前节点：${escapeHtml(title)}</p>`,
    script: `当前节点：${title}。`,
    tip: '本地新增节点',
    help: '迁移阶段本地 mock 节点。',
    policy: '后续接入真实接口后由后端保存。',
    tags: ['本地新增'],
    links: [],
    versions: [createVersion('新增节点')],
    updatedAt: now,
    updatedBy: '当前用户',
    children: [],
    summaryGroups: [],
  };
}

function handleEditorCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

function destroyEditor() {
  const editor = editorRef.value;
  if (!editor) {
    return;
  }

  editor.destroy();
  editorRef.value = undefined;
}

function normalizeRichText(value: string) {
  const text = stripHtml(value).trim();
  return text ? value.trim() : '';
}

function formatRichText(value: string) {
  if (!value.trim()) {
    return '<p>暂无备注</p>';
  }

  if (/<[a-z][\s\S]*>/i.test(value)) {
    return value;
  }

  return value
    .split(/\n+/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

function getDetailTitle(node: KnowledgeCanvasNode) {
  return `${node.title}详情 - ${node.processStatusLabel || '发布'}`;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createVersion(remark: string) {
  return {
    version: `v${Date.now()}`,
    updatedAt: nowText(),
    updatedBy: '当前用户',
    status: 'draft' as KnowledgeCanvasProcessStatus,
    remark,
  };
}

function normalizeLink(url: string) {
  const value = url.trim();
  if (!value) {
    return '';
  }
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}
</script>

<style scoped lang="scss">
.knowledge-canvas-page {
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
  grid-template-columns: 258px minmax(0, 1fr);
  gap: 14px;
  min-width: 0;
  height: 100%;
  min-height: 0;
  padding: 10px;
  overflow: hidden;
  color: var(--knowledge-text);
  background: var(--knowledge-bg);
  border: 1px solid var(--knowledge-border);
  border-radius: 14px;
}

.knowledge-sidebar,
.knowledge-canvas {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--knowledge-surface);
  border: 1px solid var(--knowledge-border);
  border-radius: 14px;
  box-shadow: var(--knowledge-shadow);
}

.knowledge-sidebar {
  display: flex;
  flex-direction: column;
  padding: 14px 12px;

  &__header {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 16px;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    color: #ffffff;
    background: linear-gradient(135deg, var(--knowledge-primary), #69b1ff);
    border-radius: 9px;
  }

  &__title {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    strong {
      font-size: 17px;
      color: var(--knowledge-text);
    }

    span {
      margin-top: 2px;
      font-size: 12px;
      color: var(--knowledge-text-muted);
    }
  }

  &__search {
    margin-bottom: 14px;

    :deep(.ant-input-affix-wrapper) {
      height: 42px;
      background: var(--knowledge-primary-softer);
      border-color: var(--knowledge-border);
      border-radius: 8px;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 12px;
    color: var(--knowledge-text-muted);

    a {
      color: var(--knowledge-primary);
      cursor: pointer;
    }
  }
}

.knowledge-tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: transparent;

  :deep(.ant-tree) {
    background: transparent;
  }

  :deep(.ant-tree-node-content-wrapper) {
    min-width: 0;
    border-radius: 10px;
  }

  :deep(.ant-tree-node-selected) {
    color: var(--knowledge-primary-strong);
    background: var(--knowledge-primary-soft);
    box-shadow: inset 3px 0 0 var(--knowledge-primary);
  }

  &__node {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    min-width: 0;
    color: var(--knowledge-text);

    &.is-parent {
      font-weight: 600;
      color: var(--knowledge-text-muted);
      cursor: default;
    }

    &.is-leaf {
      cursor: pointer;

      &:hover {
        color: var(--knowledge-primary-strong);
      }
    }
  }

  &__title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__count {
    padding: 1px 7px;
    font-size: 12px;
    color: var(--knowledge-primary);
    background: var(--knowledge-primary-soft);
    border-radius: 999px;
  }
}

.knowledge-canvas {
  display: flex;
  flex-direction: column;
}

.canvas-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 8px 14px 8px 18px;
  background: rgb(248 251 255 / 92%);
  border-bottom: 1px solid var(--knowledge-border);

  &__group,
  &__status {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  button {
    display: inline-flex;
    flex-direction: column;
    gap: 3px;
    align-items: center;
    justify-content: center;
    min-width: 54px;
    height: 42px;
    padding: 4px 8px;
    color: var(--knowledge-control-text);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 8px;

    &:hover:not(:disabled) {
      color: var(--knowledge-primary-strong);
      background: var(--knowledge-primary-soft);
    }

    &:disabled {
      color: var(--knowledge-control-disabled);
      cursor: not-allowed;
    }

    span {
      font-size: 12px;
      white-space: nowrap;
    }
  }
}

.process-meta {
  display: flex;
  flex-direction: column;
  min-width: 112px;
  padding: 6px 12px;
  background: var(--knowledge-primary-softer);
  border: 1px solid var(--knowledge-border);
  border-radius: 9px;

  span {
    font-size: 12px;
    color: var(--knowledge-text-light);
  }

  strong {
    max-width: 100px;
    overflow: hidden;
    font-size: 13px;
    color: var(--knowledge-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    position: absolute;
    align-self: flex-end;
    padding: 0 7px;
    font-size: 12px;
    font-style: normal;
    color: var(--knowledge-primary-strong);
    background: var(--knowledge-primary-soft);
    border-radius: 999px;
  }
}

.canvas-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  cursor: grab;
  background: var(--knowledge-canvas-bg);

  &--dragging {
    cursor: grabbing;
    user-select: none;

    .canvas-inner,
    .canvas-node {
      cursor: grabbing;
    }

    .canvas-inner {
      transition: none;
    }
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
  position: relative;
  min-width: 100%;
  min-height: 100%;
  transition: transform 0.18s ease;
  will-change: transform;
}

.canvas-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.canvas-node {
  position: absolute;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  background: var(--knowledge-surface-solid);
  border: 1px solid var(--knowledge-border);
  border-radius: 16px;
  box-shadow: 0 8px 20px rgb(42 111 196 / 10%);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &--root {
    color: #ffffff;
    background: linear-gradient(135deg, var(--knowledge-primary-strong), #69b1ff);
    border-color: #69b1ff;
    border-radius: 30px;
    box-shadow: 0 14px 28px rgb(22 119 255 / 22%);

    .canvas-node__icon,
    .canvas-node__actions button {
      color: var(--knowledge-primary-strong);
      background: rgb(255 255 255 / 86%);
      border-color: rgb(255 255 255 / 42%);
    }
  }

  &--active {
    box-shadow:
      0 10px 24px rgb(22 119 255 / 18%),
      0 0 0 3px rgb(22 119 255 / 12%);
  }

  &--selected {
    border-color: var(--knowledge-primary);
    box-shadow:
      0 10px 24px rgb(22 119 255 / 18%),
      0 0 0 3px rgb(22 119 255 / 16%);
  }

  &--summary {
    border-style: dashed;

    .canvas-node__icon {
      color: var(--knowledge-primary-strong);
      background: var(--knowledge-primary-soft);
    }
  }

  &__icon,
  &__actions button {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: var(--knowledge-node-icon);
    background: var(--knowledge-node-icon-bg);
    border: 1px solid var(--knowledge-border);
    border-radius: 50%;
  }

  &__title {
    flex: 1;
    min-width: 6em;
    overflow: hidden;
    font-weight: 600;
    color: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__summary {
    flex-shrink: 0;
    padding: 2px 6px;
    font-size: 12px;
    color: var(--knowledge-primary-strong);
    background: var(--knowledge-primary-soft);
    border-radius: 999px;
  }

  &__actions {
    display: flex;
    gap: 4px;
    margin-left: auto;

    button {
      width: 22px;
      height: 22px;
      padding: 0;
      cursor: pointer;
    }
  }
}

.right-panel {
  position: absolute;
  top: 184px;
  right: 18px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 84px;
  padding: 10px 8px;
  cursor: default;
  background: var(--knowledge-surface);
  border: 1px solid var(--knowledge-border);
  border-radius: 16px;
  box-shadow: 0 10px 22px rgb(42 111 196 / 12%);

  button {
    display: inline-flex;
    flex-direction: column;
    gap: 3px;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    color: var(--knowledge-control-text);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 10px;

    &:hover:not(:disabled) {
      color: var(--knowledge-primary-strong);
      background: var(--knowledge-primary-soft);
    }

    &:disabled {
      color: var(--knowledge-control-disabled);
      cursor: not-allowed;
    }
  }

  :deep(.ant-divider) {
    margin: 4px 0;
  }
}

.canvas-badge,
.zoom-bar {
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  cursor: default;
  background: var(--knowledge-surface);
  border: 1px solid var(--knowledge-border);
  border-radius: 10px;
  box-shadow: 0 8px 18px rgb(42 111 196 / 10%);
}

.canvas-badge {
  bottom: 18px;
  left: 24px;
  gap: 8px;
  padding: 10px 14px;
  color: var(--knowledge-primary-strong);

  span {
    font-weight: 700;
  }
}

.zoom-bar {
  right: 24px;
  bottom: 18px;
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgb(42 111 196 / 14%);

  button {
    flex: 0 0 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    margin: 0;
    padding: 0;
    line-height: 1;
    color: var(--knowledge-control-text);
    cursor: pointer;
    appearance: none;
    touch-action: manipulation;
    background: transparent;
    border: 0;
    border-radius: 8px;
    outline: none;
    box-shadow: none;
    transition:
      color 0.18s ease,
      background 0.18s ease;
    -webkit-tap-highlight-color: transparent;

    &:focus {
      background: transparent;
      box-shadow: none;
    }

    &:focus-visible,
    &:active {
      color: var(--knowledge-primary-strong);
      background: var(--knowledge-primary-soft);
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        color: var(--knowledge-primary-strong);
        background: var(--knowledge-primary-soft);
      }
    }

    :deep(.anticon) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      font-size: 16px;
      line-height: 1;
    }

    :deep(svg) {
      display: block;
      width: 1em;
      height: 1em;
    }
  }

  > span {
    min-width: 46px;
    font-size: 12px;
    color: var(--knowledge-control-text);
    text-align: center;
  }
}

.node-detail-title {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;

  strong {
    min-width: 0;
    overflow: hidden;
    font-size: 16px;
    color: var(--knowledge-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 400;
    color: var(--knowledge-text-muted);
  }
}

.node-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__content {
    padding: 14px;
    line-height: 1.8;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-border);
    border-radius: 8px;
  }

  &__links {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 2px;

    strong {
      font-size: 13px;
      color: var(--knowledge-text);
    }

    a {
      color: var(--knowledge-primary);
    }
  }
}

.rich-editor {
  overflow: hidden;
  background: var(--knowledge-surface-solid);
  border: 1px solid var(--knowledge-border);
  border-radius: 10px;

  &__toolbar {
    border-bottom: 1px solid var(--knowledge-border);
  }

  &__body {
    min-height: 220px;

    :deep(.w-e-text-container) {
      min-height: 220px;
    }
  }
}

.rich-text-content {
  :deep(p) {
    margin: 0 0 8px;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
    margin: 8px 0;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 10px 0 8px;
    color: var(--knowledge-text);
  }

  :deep(a) {
    color: var(--knowledge-primary);
  }
}

:global(html.dark) .knowledge-canvas-page {
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

  color: var(--app-text);

  .knowledge-sidebar,
  .knowledge-canvas,
  .canvas-toolbar {
    background: var(--knowledge-surface);
    border-color: var(--knowledge-border);
  }

  .canvas-body {
    background: var(--knowledge-canvas-bg);
    border-color: var(--knowledge-border);
  }

  .canvas-dots {
    background-image: radial-gradient(var(--knowledge-dot) 1px, transparent 1px);
  }

  .canvas-node {
    color: var(--knowledge-text);
    background: var(--knowledge-surface-solid);
    border-color: var(--knowledge-border);
  }

  .canvas-node--root {
    color: #ffffff;
    background: linear-gradient(135deg, #0958d9, #1677ff);
  }

  .right-panel,
  .canvas-badge,
  .zoom-bar {
    background: var(--knowledge-surface);
    border-color: var(--knowledge-border);
  }
}

@media (max-width: 1180px) {
  .knowledge-canvas-page {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .canvas-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 760px) {
  .knowledge-canvas-page {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }

  .knowledge-sidebar {
    min-height: 320px;
  }

  .knowledge-canvas {
    min-height: 620px;
  }

  .right-panel {
    display: none;
  }
}
</style>
