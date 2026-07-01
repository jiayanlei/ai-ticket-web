<template>
  <div class="biz-page biz-page--training">
    <header class="training-toolbar">
      <div class="toolbar-intro">
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageDescription }}</p>
      </div>

      <div class="toolbar-filters">
        <a-input
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索任务、坐席、来源、关联业务"
          @press-enter="loadData"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select v-model:value="query.team" allow-clear placeholder="团队" @change="loadData">
          <a-select-option v-for="item in teamOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.courseType" allow-clear placeholder="课程类型" @change="loadData">
          <a-select-option v-for="item in courseTypeOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.status" allow-clear placeholder="任务状态" @change="loadData">
          <a-select-option v-for="item in taskStatusOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-select v-model:value="query.owner" allow-clear placeholder="负责人" @change="loadData">
          <a-select-option v-for="item in ownerOptions" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-space class="toolbar-actions">
          <a-button type="primary" :loading="loading" @click="loadData">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button :loading="loading" @click="loadData">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
          <a-button @click="startTraining">
            <template #icon><PlayCircleOutlined /></template>
            开始培训
          </a-button>
          <a-button type="primary" @click="openCreate">
            <template #icon><PlusOutlined /></template>
            创建任务
          </a-button>
        </a-space>
      </div>
    </header>

    <main class="training-workbench">
      <section class="task-table-section">
        <div class="section-heading">
          <div>
            <h2>培训任务闭环</h2>
            <p>从质检、绩效、投诉、工单和坐席技能识别缺口，跟踪学习、测评、辅导和指标改善。</p>
          </div>
          <div class="closure-steps">
            <span v-for="item in closureSteps" :key="item">{{ item }}</span>
          </div>
        </div>

        <a-table
          class="training-table"
          :columns="taskColumns"
          :data-source="filteredTasks"
          :loading="loading"
          :pagination="false"
          :row-selection="rowSelection"
          :scroll="{ x: 1560, y: 'calc(100vh - 372px)' }"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'task'">
              <button
                class="task-cell"
                :class="{ active: activeTask?.id === record.id }"
                type="button"
                @click="openDetail(record)"
              >
                <strong>{{ record.title }}</strong>
                <span>{{ record.code }} · {{ record.courseType }}</span>
              </button>
            </template>
            <template v-else-if="column.key === 'targets'">
              <div class="compact-cell">
                <strong>{{ record.targets }}</strong>
                <span>{{ record.team }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'source'">
              <a-tag :color="sourceColor(record.source)">{{ record.source }}</a-tag>
            </template>
            <template v-else-if="column.key === 'links'">
              <div class="tag-list">
                <a-tag v-for="item in record.linkedBusiness" :key="item" color="blue">{{ item }}</a-tag>
              </div>
            </template>
            <template v-else-if="column.key === 'priority'">
              <a-tag :color="priorityColor(record.priority)">{{ record.priority }}</a-tag>
            </template>
            <template v-else-if="column.key === 'progress'">
              <div class="progress-cell">
                <a-progress :percent="record.progress" :status="progressStatus(record)" size="small" />
              </div>
            </template>
            <template v-else-if="column.key === 'assessment'">
              <a-tag :color="assessmentColor(record.assessment)">{{ record.assessment }}</a-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-badge :status="statusBadge(record.status)" :text="record.status" />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button size="small" type="link" @click="openDetail(record)">详情</a-button>
                <a-button size="small" type="link" @click="createRetraining(record)">复训</a-button>
                <a-button size="small" type="link" @click="toggleArchive(record)">
                  {{ record.status === '已归档' ? '取消归档' : '归档' }}
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </section>
    </main>

    <a-drawer
      v-model:open="detailOpen"
      width="760"
      :title="activeTask?.title"
      destroy-on-close
    >
      <div v-if="activeTask" class="training-detail">
        <section class="detail-summary">
          <div>
            <strong>{{ activeTask.code }}</strong>
            <p>{{ activeTask.sourceReason }}</p>
          </div>
          <a-tag :color="priorityColor(activeTask.priority)">{{ activeTask.priority }}</a-tag>
        </section>

        <section class="detail-block">
          <div class="detail-title">
            <h3>能力缺口</h3>
            <span>谁需要培训、为什么培训</span>
          </div>
          <div class="gap-tags">
            <a-tag v-for="item in activeTask.capabilityGaps" :key="item" color="orange">{{ item }}</a-tag>
          </div>
        </section>

        <section class="detail-block">
          <div class="detail-title">
            <h3>课程资料</h3>
            <span>学什么、关联哪些资料</span>
          </div>
          <div class="resource-list">
            <article v-for="item in activeTask.materials" :key="item.title">
              <a-tag color="blue">{{ item.type }}</a-tag>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.source }}</p>
              </div>
            </article>
          </div>
        </section>

        <section class="detail-block">
          <div class="detail-title">
            <h3>学习执行</h3>
            <span>学到什么程度</span>
          </div>
          <a-table
            class="detail-inner-table"
            :columns="learnerColumns"
            :data-source="activeTask.learners"
            :pagination="false"
            row-key="name"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'progress'">
                <a-progress :percent="record.progress" size="small" />
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="learnerStatusColor(record.status)">{{ record.status }}</a-tag>
              </template>
            </template>
          </a-table>
        </section>

        <section class="detail-block">
          <div class="detail-title">
            <h3>考试测评</h3>
            <span>考试、实操、主管确认</span>
          </div>
          <div class="assessment-list">
            <article v-for="item in activeTask.examResults" :key="item.name">
              <div>
                <strong>{{ item.name }}</strong>
                <p>{{ item.score }} · {{ item.reviewer }}</p>
              </div>
              <a-tag :color="assessmentColor(item.result)">{{ item.result }}</a-tag>
            </article>
          </div>
        </section>

        <section class="detail-block">
          <div class="detail-title">
            <h3>结果评估</h3>
            <span>培训前后指标变化</span>
          </div>
          <div class="metric-change-grid">
            <article v-for="item in activeTask.metricChanges" :key="item.name">
              <span>{{ item.name }}</span>
              <strong>{{ item.before }} → {{ item.after }}</strong>
              <small :class="{ positive: item.trend === '改善', negative: item.trend === '恶化' }">
                {{ item.trend }}
              </small>
            </article>
          </div>
        </section>

        <section class="detail-block">
          <div class="detail-title">
            <h3>复训与辅导</h3>
            <span>谁负责、下一步动作</span>
          </div>
          <div class="coaching-list">
            <article v-for="item in activeTask.coachingRecords" :key="item.time + item.owner">
              <strong>{{ item.owner }}</strong>
              <p>{{ item.content }}</p>
              <span>{{ item.time }}</span>
            </article>
          </div>
        </section>

        <section class="detail-block">
          <div class="detail-title">
            <h3>业务联动</h3>
            <span>质检、绩效、工单、会话闭环</span>
          </div>
          <div class="linked-records">
            <article v-for="item in activeTask.linkedRecords" :key="item.code">
              <a-tag>{{ item.module }}</a-tag>
              <strong>{{ item.code }}</strong>
              <span>{{ item.summary }}</span>
            </article>
          </div>
        </section>

        <section class="detail-block">
          <div class="detail-title">
            <h3>处理时间线</h3>
            <span>过程留痕与结果归档</span>
          </div>
          <a-timeline>
            <a-timeline-item v-for="item in activeTask.timeline" :key="item.time + item.action">
              <strong>{{ item.action }}</strong>
              <p>{{ item.content }}</p>
              <small>{{ item.operator }} / {{ item.time }}</small>
            </a-timeline-item>
          </a-timeline>
          <div class="archive-line">
            <a-tag v-for="item in activeTask.archiveRecords" :key="item" color="green">{{ item }}</a-tag>
          </div>
        </section>
      </div>
    </a-drawer>

    <a-modal
      v-model:open="createOpen"
      class="training-create-modal"
      title="创建培训任务"
      width="860px"
      @ok="submitCreate"
    >
      <a-form layout="vertical" class="training-create-form">
        <section class="form-section">
          <h3>任务信息</h3>
          <div class="form-grid">
            <a-form-item label="培训任务名称">
              <a-input v-model:value="createForm.title" placeholder="例如：退款争议话术专项训练" />
            </a-form-item>
            <a-form-item label="需求来源">
              <a-select v-model:value="createForm.source">
                <a-select-option v-for="item in sourceOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="培训对象 / 坐席">
              <a-input v-model:value="createForm.targets" placeholder="例如：在线一组 6 人 / 王嘉宁、唐书瑶" />
            </a-form-item>
            <a-form-item label="团队">
              <a-select v-model:value="createForm.team">
                <a-select-option v-for="item in teamOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="课程类型">
              <a-select v-model:value="createForm.courseType">
                <a-select-option v-for="item in courseTypeOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="优先级">
              <a-select v-model:value="createForm.priority">
                <a-select-option v-for="item in priorityOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </a-form-item>
          </div>
        </section>

        <section class="form-section">
          <h3>责任与联动</h3>
          <div class="form-grid">
            <a-form-item label="负责人部门">
              <a-select v-model:value="createForm.ownerDept" @change="handleOwnerDeptChange">
                <a-select-option v-for="item in ownerDeptOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="负责人">
              <a-select v-model:value="createForm.owner" placeholder="请选择负责人">
                <a-select-option v-for="item in availableOwners" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="截止时间">
              <a-input v-model:value="createForm.deadline" placeholder="例如：06-30 18:00" />
            </a-form-item>
            <a-form-item label="关联业务记录">
              <a-select
                v-model:value="createForm.linkedBusiness"
                mode="tags"
                placeholder="例如：QA-40618、TIC-73042"
              >
                <a-select-option v-for="item in linkedBusinessOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </a-form-item>
          </div>
        </section>

        <section class="form-section">
          <h3>课程与测评</h3>
          <div class="form-grid">
            <a-form-item label="培训目标">
              <a-textarea v-model:value="createForm.goal" :rows="3" placeholder="说明本次培训要改善的能力或指标" />
            </a-form-item>
            <a-form-item label="考试或测评要求">
              <a-textarea v-model:value="createForm.assessmentRequirement" :rows="3" placeholder="例如：考试 80 分通过，主管确认 3 条实操样本" />
            </a-form-item>
            <a-form-item label="课程资料 / 附件上传">
              <a-select
                v-model:value="createForm.materials"
                mode="tags"
                placeholder="关联知识库、话术、流程、案例或附件名称"
              >
                <a-select-option v-for="item in materialOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="备注说明">
              <a-textarea v-model:value="createForm.description" :rows="3" placeholder="补充业务背景、复训要求或归档说明" />
            </a-form-item>
          </div>
        </section>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';

type DemandSource = '质检扣分' | '绩效异常' | '投诉记录' | '工单失败' | '技能缺口';
type Priority = '低' | '中' | '高' | '紧急';
type TaskStatus = '待学习' | '学习中' | '待测评' | '待辅导' | '复训中' | '已归档';
type AssessmentResult = '未测评' | '通过' | '未通过' | '主管确认中' | '待发布';
type LearnerStatus = '未开始' | '学习中' | '待考试' | '已完成' | '需辅导';

interface TrainingMaterial {
  type: '知识库' | '标准话术' | '业务流程' | '风险案例' | '考试题库';
  title: string;
  source: string;
}

interface LearnerProgress {
  name: string;
  team: string;
  progress: number;
  status: LearnerStatus;
  feedback: string;
}

interface ExamResult {
  name: string;
  score: string;
  reviewer: string;
  result: AssessmentResult;
}

interface CoachingRecord {
  time: string;
  owner: string;
  content: string;
}

interface MetricChange {
  name: string;
  before: string;
  after: string;
  trend: '改善' | '持平' | '恶化';
}

interface LinkedRecord {
  module: string;
  code: string;
  summary: string;
}

interface TimelineItem {
  time: string;
  action: string;
  operator: string;
  content: string;
}

interface TrainingTask {
  id: string;
  code: string;
  title: string;
  targets: string;
  team: string;
  source: DemandSource;
  sourceReason: string;
  linkedBusiness: string[];
  priority: Priority;
  owner: string;
  deadline: string;
  progress: number;
  assessment: AssessmentResult;
  status: TaskStatus;
  previousStatus?: Exclude<TaskStatus, '已归档'>;
  courseType: string;
  capabilityGaps: string[];
  materials: TrainingMaterial[];
  learners: LearnerProgress[];
  examResults: ExamResult[];
  coachingRecords: CoachingRecord[];
  metricChanges: MetricChange[];
  linkedRecords: LinkedRecord[];
  timeline: TimelineItem[];
  archiveRecords: string[];
}

const pageTitle = '培训中心';
const pageDescription = '面向客服培训运营，串联能力缺口、培训任务、课程资料、考试测评、复训辅导和业务指标改善。';
const loading = ref(false);
const detailOpen = ref(false);
const createOpen = ref(false);
const activeTask = ref<TrainingTask>();
const selectedTaskIds = ref<string[]>([]);

const query = reactive({
  keyword: '',
  team: undefined as string | undefined,
  courseType: undefined as string | undefined,
  status: undefined as TaskStatus | undefined,
  owner: undefined as string | undefined,
});

const createForm = reactive({
  title: '',
  targets: '',
  team: '在线一组',
  source: '质检扣分' as DemandSource,
  courseType: '话术专项',
  priority: '高' as Priority,
  ownerDept: '培训运营部',
  owner: '培训运营 王珂',
  deadline: '',
  linkedBusiness: [] as string[],
  goal: '',
  materials: [] as string[],
  assessmentRequirement: '',
  description: '',
});

const closureSteps = ['缺口识别', '任务生成', '资料匹配', '学习执行', '考试测评', '结果评估', '复训辅导', '归档联动'];
const teamOptions = ['在线一组', '客户联络中心', '邮件工单组', 'VIP 专席', '短信运营组'];
const courseTypeOptions = ['新人训练', '话术专项', '流程规范', '风险合规', '实操演练'];
const taskStatusOptions: TaskStatus[] = ['待学习', '学习中', '待测评', '待辅导', '复训中', '已归档'];
const ownerOptions = ['培训运营 王珂', '质检主管 刘婧', '组长 许言', '绩效运营 韩书'];
const sourceOptions: DemandSource[] = ['质检扣分', '绩效异常', '投诉记录', '工单失败', '技能缺口'];
const priorityOptions: Priority[] = ['低', '中', '高', '紧急'];
const ownerDeptMap: Record<string, string[]> = {
  培训运营部: ['培训运营 王珂', '培训运营 林澈'],
  质检管理部: ['质检主管 刘婧', '质检专员 宋之言'],
  坐席运营部: ['组长 许言', '组长 赵明远'],
  绩效运营部: ['绩效运营 韩书', '绩效分析 陈沐阳'],
};
const ownerDeptOptions = Object.keys(ownerDeptMap);
const linkedBusinessOptions = ['QA-40618', 'PERF-W25-呼叫', 'TIC-73042', 'CALL-88921', 'SMS-11830', 'SKILL-NEW-06'];
const materialOptions = [
  '退款争议安抚与解释话术 v3',
  '跨团队工单转派流程图',
  '新人首周训练手册',
  '短信风险提示缺失案例集',
  '工单转派实操测评',
  '风险合规复训测评',
];
const availableOwners = computed(() => ownerDeptMap[createForm.ownerDept] ?? []);
const rowSelection = computed<TableProps['rowSelection']>(() => ({
  selectedRowKeys: selectedTaskIds.value,
  preserveSelectedRowKeys: false,
  onChange: (keys) => {
    selectedTaskIds.value = keys.map(String);
    const selected = tasks.value.find((item) => item.id === selectedTaskIds.value[0]);
    if (selected) activeTask.value = selected;
  },
}));

const taskColumns = [
  { title: '培训任务', dataIndex: 'title', key: 'task', width: 270, fixed: 'left' },
  { title: '培训对象', dataIndex: 'targets', key: 'targets', width: 170 },
  { title: '需求来源', dataIndex: 'source', key: 'source', width: 110 },
  { title: '关联业务', dataIndex: 'linkedBusiness', key: 'links', width: 230 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 90 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 130 },
  { title: '截止时间', dataIndex: 'deadline', key: 'deadline', width: 120 },
  { title: '完成进度', dataIndex: 'progress', key: 'progress', width: 150 },
  { title: '测评结果', dataIndex: 'assessment', key: 'assessment', width: 110 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '操作', key: 'action', width: 170, fixed: 'right' },
];

const learnerColumns = [
  { title: '坐席', dataIndex: 'name', key: 'name', width: 110 },
  { title: '团队', dataIndex: 'team', key: 'team', width: 120 },
  { title: '进度', dataIndex: 'progress', key: 'progress', width: 160 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '学习反馈', dataIndex: 'feedback', key: 'feedback', width: 180 },
];

const tasks = ref<TrainingTask[]>([
  {
    id: 'trn-001',
    code: 'TRN-202606-001',
    title: '退款争议低满意度专项训练',
    targets: '客户联络中心 8 人',
    team: '客户联络中心',
    source: '投诉记录',
    sourceReason: '近 7 天退款争议投诉率升至 2.4%，低满意度通话集中在解释不完整和升级边界不清。',
    linkedBusiness: ['投诉记录', '通话录音', '质检样本'],
    priority: '紧急',
    owner: '质检主管 刘婧',
    deadline: '06-26 18:00',
    progress: 62,
    assessment: '主管确认中',
    status: '待辅导',
    courseType: '话术专项',
    capabilityGaps: ['退款政策解释', '高情绪安抚', '升级边界', '风险提示'],
    materials: [
      { type: '标准话术', title: '退款争议安抚与解释话术 v3', source: '知识中心 / 话术库' },
      { type: '风险案例', title: '高情绪用户投诉复盘 12 例', source: 'AI 质检 / 投诉记录' },
      { type: '考试题库', title: '退款政策与升级边界测评', source: '培训题库' },
    ],
    learners: [
      { name: '王嘉宁', team: '客户联络中心', progress: 80, status: '需辅导', feedback: '实操未通过' },
      { name: '唐书瑶', team: '客户联络中心', progress: 70, status: '待考试', feedback: '已完成课程' },
      { name: '林知夏', team: 'VIP 专席', progress: 55, status: '学习中', feedback: '待提交演练' },
    ],
    examResults: [
      { name: '王嘉宁', score: '72 分 / 实操未通过', reviewer: '主管刘婧确认中', result: '未通过' },
      { name: '唐书瑶', score: '88 分 / 待实操', reviewer: '培训运营王珂', result: '主管确认中' },
    ],
    coachingRecords: [
      { time: '06-23 14:20', owner: '主管 刘婧', content: '安排 30 分钟录音复盘，重点纠正退款预期管理和升级边界。' },
      { time: '06-24 10:00', owner: '培训运营 王珂', content: '未通过坐席进入二次演练，复核 3 条低满意度通话。' },
    ],
    metricChanges: [
      { name: '质检分', before: '82', after: '88', trend: '改善' },
      { name: '满意度', before: '84.3%', after: '89.6%', trend: '改善' },
      { name: '投诉率', before: '2.4%', after: '1.6%', trend: '改善' },
      { name: '一次解决率', before: '76.5%', after: '81.2%', trend: '改善' },
    ],
    linkedRecords: [
      { module: 'AI 质检', code: 'QA-40618', summary: '退款争议话术扣分样本 15 条' },
      { module: '绩效中心', code: 'PERF-W25-呼叫', summary: '满意度低于团队目标 7.7 个百分点' },
      { module: '客户联络中心', code: 'CALL-88921', summary: '用户要求升级主管，录音已标注' },
    ],
    timeline: [
      { time: '06-21 09:30', action: '识别缺口', operator: 'AI 质检', content: '从低满意度通话中识别退款解释和风险提示缺口。' },
      { time: '06-21 11:00', action: '生成任务', operator: '培训运营 王珂', content: '匹配话术、案例和考试题库，生成专项训练。' },
      { time: '06-23 14:20', action: '主管辅导', operator: '刘婧', content: '对未通过坐席安排实操复盘和二次确认。' },
    ],
    archiveRecords: ['学习记录', '考试结果', '辅导记录', '能力变化'],
  },
  {
    id: 'trn-002',
    code: 'TRN-202606-002',
    title: '工单 SLA 与跨团队转派训练',
    targets: '邮件工单组 6 人',
    team: '邮件工单组',
    source: '工单失败',
    sourceReason: '工单超时率达到 9.2%，失败工单集中在跨团队转派、SLA 计时和补充信息缺失。',
    linkedBusiness: ['工单记录', 'SLA 异常', '绩效异常'],
    priority: '高',
    owner: '组长 许言',
    deadline: '06-28 12:00',
    progress: 38,
    assessment: '未测评',
    status: '学习中',
    courseType: '流程规范',
    capabilityGaps: ['SLA 规则', '工单补充信息', '跨团队转派', '结案标准'],
    materials: [
      { type: '业务流程', title: '跨团队工单转派流程图', source: '知识中心 / 流程库' },
      { type: '知识库', title: 'SLA 计时规则与例外场景', source: '知识中心 / 工单规则' },
      { type: '考试题库', title: '工单转派实操测评', source: '培训题库' },
    ],
    learners: [
      { name: '赵一鸣', team: '邮件工单组', progress: 45, status: '学习中', feedback: '待完成流程演练' },
      { name: '周予安', team: '邮件工单组', progress: 30, status: '学习中', feedback: '已阅读规则' },
      { name: '宋梨', team: '邮件工单组', progress: 25, status: '学习中', feedback: '待提交反馈' },
    ],
    examResults: [
      { name: '赵一鸣', score: '待考试', reviewer: '组长许言', result: '未测评' },
      { name: '周予安', score: '待考试', reviewer: '组长许言', result: '未测评' },
    ],
    coachingRecords: [
      { time: '06-22 17:10', owner: '组长 许言', content: '补充 6 条跨团队转派样例，要求坐席按真实工单演练。' },
    ],
    metricChanges: [
      { name: '超时率', before: '9.2%', after: '7.8%', trend: '改善' },
      { name: '首响时长', before: '26 分', after: '19 分', trend: '改善' },
      { name: '解决率', before: '72.8%', after: '75.1%', trend: '改善' },
      { name: '质检分', before: '79', after: '82', trend: '改善' },
    ],
    linkedRecords: [
      { module: '工单中心', code: 'TIC-73042', summary: '跨团队转派后无人跟进导致超时' },
      { module: '绩效中心', code: 'PERF-W25-工单', summary: '首响和解决率低于团队目标' },
    ],
    timeline: [
      { time: '06-22 09:00', action: '识别缺口', operator: 'SLA 监控', content: '发现邮件工单组跨团队工单超时集中。' },
      { time: '06-22 10:30', action: '资料匹配', operator: '组长 许言', content: '关联流程、SLA 规则和失败工单样本。' },
    ],
    archiveRecords: ['学习记录', '流程演练记录', '能力变化'],
  },
  {
    id: 'trn-003',
    code: 'TRN-202606-003',
    title: '新人首周全渠道接待训练',
    targets: '新坐席 12 人',
    team: '在线一组',
    source: '技能缺口',
    sourceReason: '新人技能盘点显示在线客服、邮件和短信模板使用不熟，需完成基础接待和工单录入训练。',
    linkedBusiness: ['坐席技能', '知识库', '会话记录'],
    priority: '中',
    owner: '培训运营 王珂',
    deadline: '06-30 18:00',
    progress: 84,
    assessment: '通过',
    status: '待测评',
    courseType: '新人训练',
    capabilityGaps: ['全渠道接待', '快捷回复', '工单录入', '知识检索'],
    materials: [
      { type: '知识库', title: '新人首周训练手册', source: '知识中心 / 客服培训' },
      { type: '标准话术', title: '在线客服高频问题快捷回复', source: '话术库 / 在线客服' },
      { type: '业务流程', title: '会话转工单操作规范', source: '流程库 / 工单中心' },
    ],
    learners: [
      { name: '陆清宁', team: '在线一组', progress: 100, status: '已完成', feedback: '希望增加模拟客户' },
      { name: '陈亦然', team: '在线一组', progress: 92, status: '待考试', feedback: '已完成课程' },
      { name: '沈舒', team: '在线一组', progress: 76, status: '待考试', feedback: '工单录入需练习' },
    ],
    examResults: [
      { name: '陆清宁', score: '91 分 / 实操通过', reviewer: '培训运营王珂', result: '通过' },
      { name: '陈亦然', score: '86 分 / 待主管确认', reviewer: '组长许言', result: '主管确认中' },
    ],
    coachingRecords: [
      { time: '06-20 16:00', owner: '培训运营 王珂', content: '收集新人反馈，补充 4 个在线客服模拟题。' },
    ],
    metricChanges: [
      { name: '知识命中率', before: '68%', after: '86%', trend: '改善' },
      { name: '工单录入完整率', before: '72%', after: '91%', trend: '改善' },
      { name: '首响时长', before: '42 秒', after: '24 秒', trend: '改善' },
      { name: '质检分', before: '80', after: '88', trend: '改善' },
    ],
    linkedRecords: [
      { module: '坐席中心', code: 'SKILL-NEW-06', summary: '新人技能盘点结果' },
      { module: '知识中心', code: 'KB-TRAIN-001', summary: '新人首周训练资料已发布' },
    ],
    timeline: [
      { time: '06-17 09:00', action: '任务生成', operator: '培训运营 王珂', content: '根据新人入职计划生成训练任务。' },
      { time: '06-20 18:00', action: '阶段测评', operator: '组长 许言', content: '完成在线客服和工单录入实操检查。' },
    ],
    archiveRecords: ['学习记录', '考试结果', '新人能力画像'],
  },
  {
    id: 'trn-004',
    code: 'TRN-202606-004',
    title: '短信转人工风险话术复训',
    targets: '短信运营组 5 人',
    team: '短信运营组',
    source: '质检扣分',
    sourceReason: '短信质检抽样发现风险提示缺失，转人工前未充分解释业务边界。',
    linkedBusiness: ['短信记录', 'AI 质检', '风险案例'],
    priority: '高',
    owner: '绩效运营 韩书',
    deadline: '06-27 20:00',
    progress: 18,
    assessment: '未通过',
    status: '复训中',
    courseType: '风险合规',
    capabilityGaps: ['风险提示', '自动回复边界', '转人工说明', '敏感词规避'],
    materials: [
      { type: '风险案例', title: '短信风险提示缺失案例集', source: 'AI 质检 / 短信中心' },
      { type: '标准话术', title: '转人工前置说明话术', source: '话术库 / 短信' },
      { type: '考试题库', title: '风险合规复训测评', source: '培训题库' },
    ],
    learners: [
      { name: '宋梨', team: '短信运营组', progress: 20, status: '需辅导', feedback: '首次测评未通过' },
      { name: '孟予白', team: '短信运营组', progress: 15, status: '学习中', feedback: '待完成案例复盘' },
    ],
    examResults: [
      { name: '宋梨', score: '68 分 / 未通过', reviewer: '绩效运营韩书', result: '未通过' },
    ],
    coachingRecords: [
      { time: '06-23 11:40', owner: '绩效运营 韩书', content: '由主管带看 5 条短信转人工样本，复训后重新测评。' },
    ],
    metricChanges: [
      { name: '质检分', before: '76', after: '76', trend: '持平' },
      { name: '转人工率', before: '18.6%', after: '18.2%', trend: '持平' },
      { name: '风险扣分', before: '4 项', after: '4 项', trend: '持平' },
      { name: '投诉率', before: '0.9%', after: '1.1%', trend: '恶化' },
    ],
    linkedRecords: [
      { module: '短信中心', code: 'SMS-11830', summary: '转人工前未提示处理时效' },
      { module: 'AI 质检', code: 'QA-SMS-229', summary: '风险提示缺失扣分样本 9 条' },
    ],
    timeline: [
      { time: '06-22 15:10', action: '测评未通过', operator: '培训题库', content: '风险合规题得分低于 80 分。' },
      { time: '06-23 11:40', action: '生成复训', operator: '绩效运营 韩书', content: '自动生成复训和主管辅导任务。' },
    ],
    archiveRecords: ['考试结果', '复训记录', '辅导记录'],
  },
]);

const filteredTasks = computed(() => {
  const keyword = query.keyword.trim().toLowerCase();
  return tasks.value.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      item.targets.toLowerCase().includes(keyword) ||
      item.source.toLowerCase().includes(keyword) ||
      item.linkedBusiness.join(' ').toLowerCase().includes(keyword);
    const matchTeam = !query.team || item.team === query.team;
    const matchType = !query.courseType || item.courseType === query.courseType;
    const matchStatus = !query.status || item.status === query.status;
    const matchOwner = !query.owner || item.owner === query.owner;
    return matchKeyword && matchTeam && matchType && matchStatus && matchOwner;
  });
});

function loadData() {
  loading.value = true;
  window.setTimeout(() => {
    loading.value = false;
    syncSelectedTasks();
    activeTask.value = filteredTasks.value.find((item) => item.id === activeTask.value?.id) ?? filteredTasks.value[0] ?? tasks.value[0];
  }, 240);
}

function openDetail(record: TrainingTask) {
  activeTask.value = record;
  detailOpen.value = true;
}

function startTraining() {
  const selectedTasks = tasks.value.filter((item) => selectedTaskIds.value.includes(item.id));
  if (!selectedTasks.length) {
    message.warning('请先选择需要开始培训的任务');
    return;
  }

  selectedTasks.forEach((task) => {
    activeTask.value = task;
    if (task.status === '已归档') task.status = task.previousStatus ?? '待学习';
    if (task.status === '待学习') task.status = '学习中';
    if (task.progress < 10) task.progress = 10;
  });
  syncSelectedTasks();
  message.success(`${selectedTasks.length} 个培训任务已进入学习执行`);
}

function openCreate() {
  Object.assign(createForm, {
    title: '',
    targets: '',
    team: '在线一组',
    source: '质检扣分' as DemandSource,
    courseType: '话术专项',
    priority: '高' as Priority,
    ownerDept: '培训运营部',
    owner: '培训运营 王珂',
    deadline: '',
    linkedBusiness: [],
    goal: '',
    materials: [],
    assessmentRequirement: '',
    description: '',
  });
  createOpen.value = true;
}

function submitCreate() {
  if (!createForm.title.trim()) {
    message.warning('请输入培训任务');
    return;
  }
  if (!createForm.targets.trim()) {
    message.warning('请输入培训对象');
    return;
  }
  if (!createForm.owner) {
    message.warning('请选择负责人');
    return;
  }

  const newTask: TrainingTask = {
    id: `trn-${Date.now()}`,
    code: `TRN-NEW-${tasks.value.length + 1}`,
    title: createForm.title,
    targets: createForm.targets,
    team: createForm.team,
    source: createForm.source,
    sourceReason: createForm.goal || createForm.description || '由运营手动创建，待补充具体能力缺口和关联业务样本。',
    linkedBusiness: createForm.linkedBusiness.length ? [...createForm.linkedBusiness] : ['待关联业务'],
    priority: createForm.priority,
    owner: createForm.owner,
    deadline: createForm.deadline || '待确认',
    progress: 0,
    assessment: '未测评',
    status: '待学习',
    courseType: createForm.courseType,
    capabilityGaps: [createForm.goal || '待确认能力缺口'],
    materials: buildMaterials(createForm.materials),
    learners: [
      { name: createForm.targets, team: createForm.team, progress: 0, status: '未开始', feedback: '待开始学习' },
    ],
    examResults: [
      { name: createForm.targets, score: createForm.assessmentRequirement || '未考试', reviewer: createForm.owner, result: '未测评' },
    ],
    coachingRecords: [
      { time: '待安排', owner: createForm.owner, content: '根据学习和测评结果决定是否生成主管辅导。' },
    ],
    metricChanges: [
      { name: '质检分', before: '待采集', after: '待评估', trend: '持平' },
      { name: '满意度', before: '待采集', after: '待评估', trend: '持平' },
      { name: '解决率', before: '待采集', after: '待评估', trend: '持平' },
      { name: '处理效率', before: '待采集', after: '待评估', trend: '持平' },
    ],
    linkedRecords: [
      ...(createForm.linkedBusiness.length
        ? createForm.linkedBusiness.map((code) => ({ module: '业务联动', code, summary: '创建任务时关联的业务记录。' }))
        : [{ module: '业务联动', code: '待关联', summary: '可关联质检样本、绩效异常、工单或会话记录。' }]),
    ],
    timeline: [
      { time: '刚刚', action: '创建任务', operator: createForm.owner, content: '培训任务已创建，等待资料匹配和学习执行。' },
    ],
    archiveRecords: ['待归档'],
  };

  tasks.value.unshift(newTask);
  activeTask.value = newTask;
  selectedTaskIds.value = [newTask.id];
  createOpen.value = false;
  message.success('培训任务已创建');
}

function createRetraining(record: TrainingTask) {
  activeTask.value = record;
  if (record.status === '已归档') record.previousStatus = '复训中';
  record.status = '复训中';
  record.assessment = record.assessment === '通过' ? '主管确认中' : record.assessment;
  syncSelectedTasks();
  message.success(`${record.title} 已生成复训/辅导任务`);
}

function toggleArchive(record: TrainingTask) {
  activeTask.value = record;
  if (record.status === '已归档') {
    record.status = record.previousStatus ?? '待学习';
    record.previousStatus = undefined;
    message.success(`${record.title} 已取消归档`);
  } else {
    record.previousStatus = record.status;
    record.status = '已归档';
    message.success(`${record.title} 的学习、测评和辅导记录已归档`);
  }
  syncSelectedTasks();
}

function handleOwnerDeptChange() {
  createForm.owner = availableOwners.value[0] ?? '';
}

function syncSelectedTasks() {
  const visibleIds = new Set(filteredTasks.value.map((item) => item.id));
  selectedTaskIds.value = selectedTaskIds.value.filter((id) => visibleIds.has(id));
}

function buildMaterials(materials: string[]): TrainingMaterial[] {
  if (!materials.length) {
    return [
      { type: '知识库', title: '待匹配课程资料', source: '知识中心' },
      { type: '考试题库', title: '待生成测评题目', source: '培训题库' },
    ];
  }

  return materials.map((title) => ({
    type: inferMaterialType(title),
    title,
    source: '创建任务 / 课程资料',
  }));
}

function inferMaterialType(title: string): TrainingMaterial['type'] {
  if (title.includes('话术')) return '标准话术';
  if (title.includes('流程')) return '业务流程';
  if (title.includes('案例') || title.includes('风险')) return '风险案例';
  if (title.includes('测评') || title.includes('题')) return '考试题库';
  return '知识库';
}

function sourceColor(source: DemandSource) {
  const map: Record<DemandSource, string> = {
    质检扣分: 'red',
    绩效异常: 'orange',
    投诉记录: 'volcano',
    工单失败: 'blue',
    技能缺口: 'purple',
  };
  return map[source];
}

function priorityColor(priority: Priority) {
  const map: Record<Priority, string> = {
    低: 'default',
    中: 'blue',
    高: 'orange',
    紧急: 'red',
  };
  return map[priority];
}

function assessmentColor(result: AssessmentResult) {
  const map: Record<AssessmentResult, string> = {
    未测评: 'default',
    通过: 'green',
    未通过: 'red',
    主管确认中: 'orange',
    待发布: 'blue',
  };
  return map[result];
}

function learnerStatusColor(status: LearnerStatus) {
  const map: Record<LearnerStatus, string> = {
    未开始: 'default',
    学习中: 'processing',
    待考试: 'blue',
    已完成: 'green',
    需辅导: 'red',
  };
  return map[status];
}

function statusBadge(status: TaskStatus) {
  const map: Record<TaskStatus, 'default' | 'processing' | 'success' | 'warning' | 'error'> = {
    待学习: 'default',
    学习中: 'processing',
    待测评: 'warning',
    待辅导: 'warning',
    复训中: 'error',
    已归档: 'success',
  };
  return map[status];
}

function progressStatus(record: TrainingTask) {
  if (record.assessment === '未通过') return 'exception';
  if (record.progress >= 100 || record.status === '已归档') return 'success';
  return 'active';
}

activeTask.value = tasks.value[0];
</script>

<style scoped lang="scss">
.biz-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 152px);
  min-height: 0;
  min-width: 1180px;
  overflow: hidden;
  color: var(--app-text);
}

.training-toolbar,
.task-table-section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.training-toolbar {
  flex: 0 0 auto;
  padding: 14px 16px;
}

.toolbar-intro {
  display: flex;
  align-items: baseline;
  gap: 14px;
  min-width: 0;
  margin-bottom: 12px;
}

.toolbar-intro h1,
.section-heading h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 18px;
  font-weight: 700;
}

.toolbar-intro p,
.section-heading p,
.detail-summary p,
.resource-list p,
.assessment-list p,
.coaching-list p,
.training-detail small,
.detail-title span {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.toolbar-filters {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 140px 150px 140px 140px auto;
  gap: 10px;
  align-items: center;
}

.toolbar-actions {
  justify-content: flex-end;
  white-space: nowrap;
}

.training-workbench {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.task-table-section {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  padding: 14px;
  overflow: hidden;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.closure-steps {
  display: flex;
  max-width: 620px;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.closure-steps span {
  padding: 5px 8px;
  color: var(--app-text-secondary);
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
}

.training-table {
  min-height: 0;
}

.task-cell {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
  padding: 0;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.task-cell strong,
.compact-cell strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-cell span,
.compact-cell span {
  overflow: hidden;
  color: var(--app-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-cell.active strong {
  color: var(--app-primary);
}

.compact-cell {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-list :deep(.ant-tag),
.gap-tags :deep(.ant-tag),
.archive-line :deep(.ant-tag) {
  margin-inline-end: 0;
}

.progress-cell {
  min-width: 120px;
}

.training-detail {
  display: grid;
  gap: 12px;
  padding-bottom: 16px;
  max-width: 100%;
  overflow-x: hidden;
}

.detail-summary,
.detail-block {
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.detail-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 12px;
  background: var(--app-surface-muted);
}

.detail-block {
  padding: 12px;
  background: var(--app-surface);
}

.detail-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.detail-title h3 {
  margin: 0;
  color: var(--app-text);
  font-size: 15px;
}

.gap-tags,
.archive-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.resource-list,
.assessment-list,
.coaching-list,
.linked-records {
  display: grid;
  gap: 8px;
}

.resource-list article,
.assessment-list article,
.coaching-list article,
.linked-records article {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.detail-inner-table {
  max-width: 100%;
  overflow: hidden;
}

.detail-inner-table :deep(.ant-table-container),
.detail-inner-table :deep(.ant-table-content) {
  overflow-x: hidden !important;
}

.detail-inner-table :deep(.ant-table) {
  table-layout: fixed;
}

.detail-inner-table :deep(.ant-table-cell) {
  white-space: normal;
  word-break: break-word;
}

.resource-list article > div,
.assessment-list article > div {
  min-width: 0;
  flex: 1;
}

.assessment-list article,
.linked-records article {
  justify-content: space-between;
}

.coaching-list article {
  display: grid;
}

.coaching-list span {
  color: var(--app-text-muted);
  font-size: 12px;
}

.linked-records strong,
.linked-records span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.linked-records span {
  flex: 1;
  color: var(--app-text-secondary);
}

.metric-change-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.metric-change-grid article {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.metric-change-grid span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.metric-change-grid strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.training-create-form {
  display: grid;
  max-height: min(78vh, 760px);
  gap: 14px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.form-section {
  padding: 12px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.form-section h3 {
  margin: 0 0 12px;
  color: var(--app-text);
  font-size: 15px;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.form-grid :deep(.ant-form-item) {
  min-width: 0;
  margin-bottom: 14px;
}

.form-grid :deep(.ant-select),
.form-grid :deep(.ant-input),
.form-grid :deep(.ant-input-affix-wrapper),
.form-grid :deep(.ant-input-textarea) {
  max-width: 100%;
}

:deep(.training-create-modal .ant-modal-body),
:deep(.ant-drawer-body) {
  overflow-x: hidden;
}

:deep(.training-create-modal) {
  top: 48px;
}

.positive {
  color: #16a34a;
}

.negative {
  color: #dc2626;
}

button {
  font: inherit;
}

:deep(.ant-table-wrapper),
:deep(.ant-spin-nested-loading),
:deep(.ant-spin-container),
:deep(.ant-table),
:deep(.ant-table-container) {
  min-height: 0;
}

@media (max-width: 1360px) {
  .biz-page {
    min-width: 980px;
  }

  .toolbar-filters {
    grid-template-columns: minmax(220px, 1fr) repeat(4, 140px);
  }

  .toolbar-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }

  .section-heading {
    flex-direction: column;
  }

  .closure-steps {
    justify-content: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
