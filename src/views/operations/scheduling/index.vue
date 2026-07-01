<template>
  <div class="biz-page biz-page--schedule">
    <main class="schedule-system">
      <header class="schedule-header">
        <div class="schedule-header__title">
          <strong>{{ pageTitle }}</strong>
          <p>{{ pageDescription }}</p>
        </div>
        <span>当前角色：班长 · 已禁用生成排班按钮</span>
      </header>

      <nav class="schedule-tabs" aria-label="排班模块">
        <button
          v-for="tab in moduleTabs"
          :key="tab.key"
          :class="{ active: activeModule === tab.key }"
          type="button"
          @click="activeModule = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <section v-if="activeModule === 'schedule'" class="schedule-board">
        <div class="schedule-filter">
          <div class="filter-row">
            <label>
              <span>部门：</span>
              <a-select v-model:value="scheduleQuery.department" @change="handleScheduleDepartmentChange">
                <a-select-option v-for="item in departmentOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </label>
            <label>
              <span>办公区：</span>
              <a-select v-model:value="scheduleQuery.office">
                <a-select-option v-for="item in officeOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </label>
            <label class="wide-control">
              <span>选择班组：</span>
              <a-select v-model:value="scheduleQuery.group">
                <a-select-option v-for="item in groupOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </label>
            <label>
              <span>时间：</span>
              <a-select v-model:value="scheduleQuery.month">
                <a-select-option v-for="item in monthOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </label>
            <a-button type="primary" @click="loadSchedule">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button :disabled="!canGenerate" @click="generateSchedule">生成排班</a-button>
            <a-button @click="exportSchedule">
              <template #icon><DownloadOutlined /></template>
              导出整月 Excel
            </a-button>
          </div>

          <div class="filter-row">
            <label>
              <span>渠道：</span>
              <a-select v-model:value="scheduleQuery.channel">
                <a-select-option v-for="item in channelOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </label>
            <a-button type="primary" @click="assignChannel">分配渠道</a-button>
            <label>
              <span>批量修改：</span>
              <a-select v-model:value="scheduleQuery.batchAction" placeholder="请选择">
                <a-select-option value="批量改夜班">批量改夜班</a-select-option>
                <a-select-option value="批量改休息">批量改休息</a-select-option>
                <a-select-option value="批量清空渠道">批量清空渠道</a-select-option>
              </a-select>
            </label>
            <a-button type="primary" @click="message.success('已进入班组排班模式')">班组排班</a-button>
            <label class="wide-control">
              <span>倒班类型：</span>
              <a-select v-model:value="scheduleQuery.shiftType">
                <a-select-option v-for="item in shiftTypeOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </label>
            <a-button type="primary" @click="message.success('已进入单人排班模式')">单人排班</a-button>
            <a-button type="primary" @click="message.success('倒班调整已加入待确认列表')">倒班</a-button>
            <div class="shift-legend">
              <span v-for="item in legendItems" :key="item.label"><i :class="item.type"></i>{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="schedule-table-card">
          <div
            ref="rosterTableWrapRef"
            class="roster-table-wrap"
            :class="{ dragging: dragState.dragging }"
            @mousedown="handleTableMouseDown"
            @mousemove="handleTableMouseMove"
            @mouseup="stopTableDrag"
            @mouseleave="stopTableDrag"
            @wheel.prevent="handleTableWheel"
          >
            <table class="roster-table">
              <thead>
                <tr>
                  <th class="fixed-col fixed-name" rowspan="2">姓名</th>
                  <th class="fixed-col fixed-group" rowspan="2">班组</th>
                  <th v-for="day in monthDays" :key="day.date">{{ day.date }}</th>
                </tr>
                <tr>
                  <th v-for="day in monthDays" :key="day.date + day.week">{{ day.week }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(person, rowIndex) in rosterRows" :key="person.name">
                  <td class="fixed-col fixed-name name-cell">{{ person.name }}</td>
                  <td class="fixed-col fixed-group group-cell">{{ person.group }}</td>
                  <td
                    v-for="(day, index) in monthDays"
                    :key="person.name + day.date"
                    :class="['shift-cell', getShiftCell(person, index).type, { selected: isShiftSelected(rowIndex, index), readonly: !day.editable }]"
                    @click="handleShiftClick($event, person.name, day, getShiftCell(person, index), rowIndex, index)"
                    @contextmenu.prevent="openShiftMenu($event, rowIndex, index)"
                    @mousedown.left.stop="startShiftSelection($event, rowIndex, index)"
                    @mouseenter="extendShiftSelection(rowIndex, index)"
                  >
                    {{ getShiftCell(person, index).label }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-if="shiftMenu.visible"
            class="shift-context-menu"
            :style="{ left: shiftMenu.x + 'px', top: shiftMenu.y + 'px' }"
            @click.stop
            @mousedown.stop
          >
            <strong>修改 {{ selectedShiftKeys.length }} 个班次</strong>
            <button v-for="item in shiftActionOptions" :key="item.label" type="button" @click="applyShiftStatus(item)">
              <i :class="item.type"></i>
              {{ item.label }}
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="activeModule === 'group'" class="schedule-board">
        <div class="group-filter">
          <label class="member-search">
            <span>成员名称：</span>
            <a-input v-model:value="query.memberName" allow-clear placeholder="请输入姓名 / 工号" @press-enter="searchGroupMembers" />
          </label>
          <a-button type="primary" @click="searchGroupMembers">
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
          <label>
            <span>部门：</span>
            <a-select v-model:value="query.department">
              <a-select-option v-for="item in departmentFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>办公区：</span>
            <a-select v-model:value="query.office">
              <a-select-option v-for="item in officeFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label class="wide-control">
            <span>排班分组：</span>
            <a-select v-model:value="query.group" @change="handleGroupChange">
              <a-select-option v-for="item in groupOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <div class="current-group">
            当前分组：<strong>{{ query.group }}</strong>
            <span>班制：{{ groupSummary.shiftMode }}</span>
            <span>成员：{{ groupedMembers.length }} 人</span>
          </div>
        </div>

        <div class="group-workspace">
          <section class="member-panel">
            <div class="member-panel__head">
              <h2>未分组成员 <span>{{ filteredUngroupedMembers.length }}</span></h2>
              <a-input v-model:value="leftFilter" allow-clear placeholder="筛选成员" />
            </div>
            <div class="member-list">
              <label
                v-for="member in filteredUngroupedMembers"
                :key="member.id"
                class="member-row"
                :class="{ selected: selectedUngroupedIds.includes(member.id) }"
              >
                <a-checkbox :checked="selectedUngroupedIds.includes(member.id)" @change="toggleMember(selectedUngroupedIds, member.id)" />
                <strong>{{ member.name }}</strong>
                <a-tag>{{ member.tag }}</a-tag>
              </label>
            </div>
          </section>

          <div class="transfer-actions">
            <a-button type="primary" :disabled="!selectedUngroupedIds.length" @click="moveToGrouped">→</a-button>
            <a-button type="primary" :disabled="!selectedGroupedIds.length" @click="moveToUngrouped">←</a-button>
          </div>

          <section class="member-panel">
            <div class="member-panel__head">
              <h2>分组成员 <span>{{ filteredGroupedMembers.length }}</span></h2>
              <a-input v-model:value="rightFilter" allow-clear placeholder="筛选成员" />
            </div>
            <div class="member-list">
              <label
                v-for="member in filteredGroupedMembers"
                :key="member.id"
                class="member-row"
                :class="{ selected: selectedGroupedIds.includes(member.id) }"
              >
                <a-checkbox :checked="selectedGroupedIds.includes(member.id)" @change="toggleMember(selectedGroupedIds, member.id)" />
                <strong>{{ member.name }}</strong>
                <a-tag>{{ member.tag }}</a-tag>
              </label>
            </div>
          </section>

          <aside class="group-info-panel">
            <div class="group-info-head">
              <h2>分组信息</h2>
              <a-button @click="refreshGroupInfo">刷新</a-button>
            </div>
            <div class="group-info-grid">
              <article>
                <span>排班分组</span>
                <strong>{{ query.group }}</strong>
              </article>
              <article>
                <span>班制类型</span>
                <strong>{{ groupSummary.shiftMode }}</strong>
              </article>
              <article>
                <span>所属部门</span>
                <strong>{{ groupSummary.department }}</strong>
              </article>
              <article>
                <span>办公区</span>
                <strong>{{ groupSummary.office }}</strong>
              </article>
              <article>
                <span>未分组成员</span>
                <strong>{{ ungroupedMembers.length }}</strong>
              </article>
              <article>
                <span>已分组成员</span>
                <strong>{{ groupedMembers.length }}</strong>
              </article>
            </div>
          </aside>
        </div>

        <div class="group-footer">
          <a-button @click="undoGroupEdit">撤销返回</a-button>
          <a-space>
            <a-button @click="resetGroupMembers">重置</a-button>
            <a-button type="primary" @click="saveGroupMembers">保存分组</a-button>
          </a-space>
        </div>
      </section>

      <section v-else-if="activeModule === 'shiftType'" class="config-board">
        <div class="config-filter">
          <label>
            <span>部门：</span>
            <a-select v-model:value="shiftTypeQuery.department">
              <a-select-option v-for="item in departmentFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>办公区：</span>
            <a-select v-model:value="shiftTypeQuery.office">
              <a-select-option v-for="item in officeFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>状态：</span>
            <a-select v-model:value="shiftTypeQuery.status">
              <a-select-option value="全部">全部</a-select-option>
              <a-select-option value="启用">启用</a-select-option>
              <a-select-option value="停用">停用</a-select-option>
            </a-select>
          </label>
          <a-button @click="message.success('已刷新倒班类型')">搜索</a-button>
          <a-button type="primary" @click="addShiftType">添加类型</a-button>
        </div>
        <div class="config-table-card">
          <a-table :columns="shiftTypeColumns" :data-source="filteredShiftTypeRows" :pagination="false" row-key="id" size="middle">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'color'">
                <span class="shift-swatch" :style="{ background: record.color }"></span>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="record.status === '启用' ? 'green' : 'default'">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'risk'">
                <a-tag :color="record.risk === '正常' ? 'green' : 'orange'">{{ record.risk }}</a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="previewShiftImpact(record)">影响范围</a-button>
                  <a-button type="link" size="small" @click="toggleShiftType(record)">{{ record.status === '启用' ? '停用' : '启用' }}</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
        <div class="closure-strip">
          <span>班次模板</span>
          <i></i>
          <span>班组周期引用</span>
          <i></i>
          <span>排班表生成</span>
          <i></i>
          <span>冲突校验</span>
          <i></i>
          <span>影响追踪</span>
        </div>
      </section>

      <section v-else-if="activeModule === 'groupType'" class="config-board">
        <div class="config-filter">
          <label>
            <span>部门：</span>
            <a-select v-model:value="groupTypeQuery.department">
              <a-select-option v-for="item in departmentFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>办公区：</span>
            <a-select v-model:value="groupTypeQuery.office">
              <a-select-option v-for="item in officeFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>班组：</span>
            <a-select v-model:value="groupTypeQuery.group">
              <a-select-option value="全部">全部</a-select-option>
              <a-select-option v-for="item in groupOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <a-button @click="message.success('已刷新班组类型')">搜索</a-button>
          <a-button type="primary" @click="addGroupType">添加规则</a-button>
        </div>
        <div class="config-table-card">
          <a-table :columns="groupTypeColumns" :data-source="filteredGroupTypeRows" :pagination="false" row-key="id" size="middle">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'cycle'">
                <span class="cycle-preview">{{ record.cycle }}</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="record.status === '启用' ? 'green' : 'default'">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="previewGroupCycle(record)">周期预览</a-button>
                  <a-button type="link" size="small" @click="applyGroupType(record)">应用到排班</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
        <div class="closure-strip">
          <span>班组规则</span>
          <i></i>
          <span>周期展开</span>
          <i></i>
          <span>绑定班组</span>
          <i></i>
          <span>生成未来排班</span>
          <i></i>
          <span>可回滚</span>
        </div>
      </section>

      <section v-else-if="activeModule === 'leave'" class="config-board">
        <div class="config-filter">
          <label>
            <span>部门：</span>
            <a-select v-model:value="leaveQuery.department">
              <a-select-option v-for="item in departmentFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>办公区：</span>
            <a-select v-model:value="leaveQuery.office">
              <a-select-option v-for="item in officeFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>状态：</span>
            <a-select v-model:value="leaveQuery.status">
              <a-select-option value="全部">全部</a-select-option>
              <a-select-option value="待审批">待审批</a-select-option>
              <a-select-option value="已通过">已通过</a-select-option>
              <a-select-option value="已驳回">已驳回</a-select-option>
            </a-select>
          </label>
          <label class="date-control">
            <span>日期：</span>
            <a-range-picker v-model:value="leaveQuery.range" />
          </label>
          <a-button @click="message.success('已刷新请假记录')">搜索</a-button>
          <a-button type="primary" @click="message.success('请假申请已打开')">新增请假</a-button>
        </div>
        <div class="config-table-card">
          <a-table :columns="leaveColumns" :data-source="filteredLeaveRows" :pagination="false" row-key="id" size="middle">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="leaveStatusColor(record.status)">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'coverage'">
                <a-tag :color="record.coverage === '已补位' ? 'green' : 'orange'">{{ record.coverage }}</a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="approveLeave(record)" :disabled="record.status !== '待审批'">通过</a-button>
                  <a-button type="link" size="small" @click="rejectLeave(record)" :disabled="record.status !== '待审批'">驳回</a-button>
                  <a-button type="link" size="small" @click="createLeaveCoverage(record)">补位</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
        <div class="closure-strip">
          <span>请假申请</span>
          <i></i>
          <span>审批</span>
          <i></i>
          <span>排班回写</span>
          <i></i>
          <span>缺口识别</span>
          <i></i>
          <span>补位跟踪</span>
        </div>
      </section>

      <section v-else-if="activeModule === 'rotation'" class="config-board">
        <div class="config-filter">
          <label>
            <span>部门：</span>
            <a-select v-model:value="rotationQuery.department">
              <a-select-option v-for="item in departmentFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>办公区：</span>
            <a-select v-model:value="rotationQuery.office">
              <a-select-option v-for="item in officeFilterOptions" :key="item" :value="item">{{ item }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>状态：</span>
            <a-select v-model:value="rotationQuery.status">
              <a-select-option value="全部">全部</a-select-option>
              <a-select-option value="待确认">待确认</a-select-option>
              <a-select-option value="已回写">已回写</a-select-option>
              <a-select-option value="已驳回">已驳回</a-select-option>
              <a-select-option value="已回滚">已回滚</a-select-option>
            </a-select>
          </label>
          <label class="date-control">
            <span>日期：</span>
            <a-range-picker v-model:value="rotationQuery.range" />
          </label>
          <a-button @click="message.success('已刷新倒班记录')">搜索</a-button>
          <a-button type="primary" @click="addRotation">新增倒班</a-button>
        </div>
        <div class="config-table-card">
          <a-table :columns="rotationColumns" :data-source="filteredRotationRows" :pagination="false" row-key="id" size="middle">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="rotationStatusColor(record.status)">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'source'">
                <a-tag color="blue">{{ record.source }}</a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="confirmRotation(record)" :disabled="record.status !== '待确认'">确认</a-button>
                  <a-button type="link" size="small" @click="rejectRotation(record)" :disabled="record.status !== '待确认'">驳回</a-button>
                  <a-button type="link" size="small" @click="rollbackRotation(record)" :disabled="record.status !== '已回写'">回滚</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
        <div class="closure-strip">
          <span>调班申请</span>
          <i></i>
          <span>冲突校验</span>
          <i></i>
          <span>确认审批</span>
          <i></i>
          <span>回写排班</span>
          <i></i>
          <span>变更留痕</span>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';

type ModuleKey = 'schedule' | 'group' | 'shiftType' | 'groupType' | 'leave' | 'rotation';
type ShiftType = 'night' | 'channel' | 'leave' | 'rest' | 'normal' | 'empty';

interface ShiftCell {
  label: string;
  type: ShiftType;
}

interface ShiftAction {
  label: string;
  type: ShiftType;
}

interface RosterRow {
  name: string;
  group: string;
  shifts: ShiftCell[];
}

interface MonthDay {
  date: string;
  week: string;
  fullDate: string;
  editable: boolean;
}

interface ShiftSnapshot {
  rowIndex: number;
  colIndex: number;
  shift: ShiftCell;
}

interface LeaveRow {
  id: string;
  type: string;
  name: string;
  department: string;
  group: string;
  office: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: string;
  impactShift: string;
  coverage: string;
  remark: string;
}

interface ShiftTypeRow {
  id: string;
  name: string;
  department: string;
  startTime: string;
  endTime: string;
  duration: string;
  office: string;
  channel: string;
  crossDay: string;
  color: string;
  usedBy: number;
  status: string;
  risk: string;
  remark: string;
}

interface GroupTypeRow {
  id: string;
  name: string;
  effectiveDate: string;
  cycle: string;
  cycleDays: number;
  department: string;
  office: string;
  groupScope: string;
  boundGroups: number;
  workRest: string;
  status: string;
  lastGenerated: string;
}

interface RotationRow {
  id: string;
  name: string;
  department: string;
  office: string;
  group: string;
  date: string;
  fromShift: string;
  targetDate: string;
  targetShift: string;
  reason: string;
  source: string;
  status: string;
  operator: string;
  approver: string;
}

interface MemberItem {
  id: string;
  name: string;
  tag: string;
  department: string;
  office: string;
}

const pageTitle = '排班调度';
const pageDescription = '面向在线客服、客户联络中心、邮件、短信、工单多渠道坐席，完成月度排班、渠道分配、倒班调整、请假展示和排班导出。';
const activeModule = ref<ModuleKey>('schedule');

const moduleTabs: Array<{ key: ModuleKey; label: string }> = [
  { key: 'schedule', label: '排班管理' },
  { key: 'group', label: '班组管理' },
  { key: 'shiftType', label: '倒班类型' },
  { key: 'groupType', label: '班组类型' },
  { key: 'leave', label: '请假管理' },
  { key: 'rotation', label: '倒班管理' },
];
const departmentOptions = ['客户联络中心', '在线客服', '邮件中心', '工单中心'];
const departmentFilterOptions = ['全部', ...departmentOptions];
const officeOptions = ['云栖办公区', '总部办公区', '远端办公区'];
const officeFilterOptions = ['全部', ...officeOptions];
const groupOptions = ['服务保障A班', '服务保障B班', '服务保障C班', '服务保障D班', '总部办公区专员'];
const canGenerate = false;
const scheduleToday = new Date(2026, 5, 30);
const editableScheduleStart = new Date(2026, 5, 30).getTime();
const editableScheduleEnd = new Date(2026, 6, 30).getTime();
const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const monthOptions = buildMonthOptions(new Date(scheduleToday.getFullYear() - 1, scheduleToday.getMonth(), 1), new Date(scheduleToday.getFullYear(), scheduleToday.getMonth() + 1, 1));
const baseChannelOptions = ['交通委值守', '热线接听', '工单回访', '市网格', '首环办', '交委体验单渠道'];
const genericShiftTypes = ['正常', '休息'];
const officeShiftTypes: Record<string, string[]> = {
  云栖办公区: ['云白10', '云中8', '云夜10', '早+晚', '中班', '晚班'],
  总部办公区: ['总白8', '总中8', '总夜10', '早+晚'],
  远端办公区: ['远白8', '远中8', '远夜10'],
};
const legendItems: Array<{ label: string; type: ShiftType }> = [
  { label: '夜班', type: 'night' },
  { label: '渠道', type: 'channel' },
  { label: '请假', type: 'leave' },
  { label: '休息', type: 'rest' },
  { label: '正常', type: 'normal' },
];
const shiftActionOptions: ShiftAction[] = [
  { label: '中班', type: 'channel' },
  { label: '早+晚', type: 'channel' },
  { label: '晚班', type: 'night' },
  { label: '夜班', type: 'night' },
  { label: '请假', type: 'leave' },
  { label: '休息', type: 'rest' },
  { label: '正常', type: 'normal' },
  { label: '清空', type: 'empty' },
];
const rosterTableWrapRef = ref<HTMLDivElement>();
const scheduleQuery = reactive({
  department: '客户联络中心',
  office: '云栖办公区',
  group: '服务保障B班',
  month: '2026年06月',
  channel: '交通委值守',
  batchAction: undefined as string | undefined,
  shiftType: '正常 / 休息 / 夜班',
});
const dragState = reactive({
  dragging: false,
  suppressClick: false,
  startX: 0,
  startY: 0,
  scrollLeft: 0,
  scrollTop: 0,
});
const initialUngroupedMembers: MemberItem[] = [
  { id: 'u-001', name: '沈嘉禾', tag: '客户联络中心', department: '客户联络中心', office: '云栖办公区' },
  { id: 'u-002', name: '林若彤', tag: '客户联络中心', department: '客户联络中心', office: '云栖办公区' },
  { id: 'u-003', name: '周景澄', tag: '服务保障', department: '在线客服', office: '总部办公区' },
  { id: 'u-004', name: '顾安琪', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'u-005', name: '许亦航', tag: '客户联络中心', department: '客户联络中心', office: '远端办公区' },
  { id: 'u-006', name: '秦书言', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'u-007', name: '唐一诺', tag: '服务保障', department: '邮件中心', office: '云栖办公区' },
  { id: 'u-008', name: '贺知远', tag: '云栖办公区', department: '工单中心', office: '云栖办公区' },
  { id: 'u-009', name: '邵明轩', tag: '云栖办公区', department: '客户联络中心', office: '云栖办公区' },
  { id: 'u-010', name: '叶舒宁', tag: '总部办公区', department: '在线客服', office: '总部办公区' },
  { id: 'u-011', name: '傅星澜', tag: '服务保障', department: '客户联络中心', office: '远端办公区' },
  { id: 'u-012', name: '程雨桐', tag: '服务保障', department: '邮件中心', office: '总部办公区' },
  { id: 'u-013', name: '卢启辰', tag: '客户联络中心', department: '客户联络中心', office: '云栖办公区' },
  { id: 'u-014', name: '魏清妍', tag: '服务保障', department: '工单中心', office: '云栖办公区' },
  { id: 'u-015', name: '苏沐阳', tag: '云栖办公区', department: '在线客服', office: '云栖办公区' },
];
const initialGroupedMembers: MemberItem[] = [
  { id: 'g-001', name: '何语晨', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'g-002', name: '马思齐', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'g-003', name: '高芷晴', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'g-004', name: '罗嘉宁', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'g-005', name: '袁泽宇', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'g-006', name: '谭予安', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'g-007', name: '姜念慈', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'g-008', name: '戴云舒', tag: '服务保障', department: '在线客服', office: '云栖办公区' },
  { id: 'g-009', name: '薛承睿', tag: '总部办公区', department: '工单中心', office: '总部办公区' },
  { id: 'g-010', name: '钟昱辰', tag: '客户联络中心', department: '客户联络中心', office: '云栖办公区' },
  { id: 'g-011', name: '方知夏', tag: '客户联络中心', department: '客户联络中心', office: '远端办公区' },
  { id: 'g-012', name: '尹嘉树', tag: '服务保障', department: '在线客服', office: '总部办公区' },
];

const query = reactive({
  memberName: '',
  department: '全部',
  office: '全部',
  group: '服务保障B班',
});
const leftFilter = ref('');
const rightFilter = ref('');
const hasGroupChanges = ref(false);
const ungroupedMembers = ref<MemberItem[]>([...initialUngroupedMembers]);
const groupedMembers = ref<MemberItem[]>([...initialGroupedMembers]);
const selectedUngroupedIds = ref<string[]>(['u-005', 'u-006']);
const selectedGroupedIds = ref<string[]>(['g-001']);
const selectedShiftKeys = ref<string[]>([]);
const shiftUndoStack = ref<ShiftSnapshot[][]>([]);
const shiftTypeQuery = reactive({
  department: '全部',
  office: '全部',
  status: '全部',
});
const groupTypeQuery = reactive({
  department: '全部',
  office: '全部',
  group: '全部',
});
const leaveQuery = reactive({
  department: '全部',
  office: '全部',
  status: '全部',
  range: undefined as unknown,
});
const rotationQuery = reactive({
  department: '全部',
  office: '全部',
  status: '全部',
  range: undefined as unknown,
});
const shiftSelectionState = reactive({
  selecting: false,
  moved: false,
  anchorRow: 0,
  anchorCol: 0,
});
const shiftMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
});
const shiftTypeColumns: TableColumnsType<ShiftTypeRow> = [
  { title: '序号', dataIndex: 'id', key: 'id', width: 76 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 120 },
  { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 120 },
  { title: '时长', dataIndex: 'duration', key: 'duration', width: 90 },
  { title: '跨天', dataIndex: 'crossDay', key: 'crossDay', width: 80 },
  { title: '办公区', dataIndex: 'office', key: 'office', width: 130 },
  { title: '渠道/技能', dataIndex: 'channel', key: 'channel', width: 130 },
  { title: '颜色', dataIndex: 'color', key: 'color', width: 80 },
  { title: '引用', dataIndex: 'usedBy', key: 'usedBy', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '校验', dataIndex: 'risk', key: 'risk', width: 90 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
];
const groupTypeColumns: TableColumnsType<GroupTypeRow> = [
  { title: '序号', dataIndex: 'id', key: 'id', width: 76 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '开始时间', dataIndex: 'effectiveDate', key: 'effectiveDate', width: 150 },
  { title: '排班周期', dataIndex: 'cycle', key: 'cycle', width: 320 },
  { title: '周期天数', dataIndex: 'cycleDays', key: 'cycleDays', width: 100 },
  { title: '部门', dataIndex: 'department', key: 'department', width: 120 },
  { title: '办公区', dataIndex: 'office', key: 'office', width: 130 },
  { title: '适用班组', dataIndex: 'groupScope', key: 'groupScope', width: 150 },
  { title: '绑定数', dataIndex: 'boundGroups', key: 'boundGroups', width: 90 },
  { title: '上休规则', dataIndex: 'workRest', key: 'workRest', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '最近生成', dataIndex: 'lastGenerated', key: 'lastGenerated', width: 150 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
];
const leaveColumns: TableColumnsType<LeaveRow> = [
  { title: '序号', dataIndex: 'id', key: 'id', width: 76 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 110 },
  { title: '用户', dataIndex: 'name', key: 'name', width: 120 },
  { title: '班组', dataIndex: 'group', key: 'group', width: 140 },
  { title: '办公区', dataIndex: 'office', key: 'office', width: 130 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 170 },
  { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 170 },
  { title: '时长', dataIndex: 'duration', key: 'duration', width: 90 },
  { title: '影响班次', dataIndex: 'impactShift', key: 'impactShift', width: 130 },
  { title: '补位', dataIndex: 'coverage', key: 'coverage', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '操作', key: 'action', width: 170, fixed: 'right' },
];
const rotationColumns: TableColumnsType<RotationRow> = [
  { title: '序号', dataIndex: 'id', key: 'id', width: 76 },
  { title: '用户', dataIndex: 'name', key: 'name', width: 120 },
  { title: '班组', dataIndex: 'group', key: 'group', width: 140 },
  { title: '日期', dataIndex: 'date', key: 'date', width: 130 },
  { title: '原班次', dataIndex: 'fromShift', key: 'fromShift', width: 110 },
  { title: '倒班日期', dataIndex: 'targetDate', key: 'targetDate', width: 130 },
  { title: '倒班类型', dataIndex: 'targetShift', key: 'targetShift', width: 110 },
  { title: '原因', dataIndex: 'reason', key: 'reason', width: 130 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 110 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '发起人', dataIndex: 'operator', key: 'operator', width: 110 },
  { title: '审批人', dataIndex: 'approver', key: 'approver', width: 110 },
  { title: '操作', key: 'action', width: 170, fixed: 'right' },
];
const shiftTypeRows = ref<ShiftTypeRow[]>([
  {
    id: 'S-001',
    name: '正常',
    department: '客户联络中心',
    startTime: '08:30',
    endTime: '17:30',
    duration: '9h',
    office: '全部',
    channel: '全渠道',
    crossDay: '否',
    color: '#f8fafc',
    usedBy: 18,
    status: '启用',
    risk: '正常',
    remark: '通用白班，默认参与需求预测和排班生成。',
  },
  {
    id: 'S-002',
    name: '中班',
    department: '在线客服',
    startTime: '14:00',
    endTime: '22:00',
    duration: '8h',
    office: '云栖办公区',
    channel: '在线客服',
    crossDay: '否',
    color: '#e8f5ff',
    usedBy: 12,
    status: '启用',
    risk: '正常',
    remark: '覆盖午后咨询高峰，优先匹配退款、账单技能。',
  },
  {
    id: 'S-003',
    name: '晚班',
    department: '客户联络中心',
    startTime: '18:00',
    endTime: '02:00',
    duration: '8h',
    office: '云栖办公区',
    channel: '投诉/VIP',
    crossDay: '是',
    color: '#fff1e6',
    usedBy: 9,
    status: '启用',
    risk: '需复核',
    remark: '跨天班次，发布前校验连续工作时长。',
  },
  {
    id: 'S-004',
    name: '夜班',
    department: '工单中心',
    startTime: '22:00',
    endTime: '08:00',
    duration: '10h',
    office: '总部办公区',
    channel: '工单中心',
    crossDay: '是',
    color: '#fff1e6',
    usedBy: 6,
    status: '启用',
    risk: '需复核',
    remark: '夜间异常工单兜底，要求技术支持技能。',
  },
  {
    id: 'S-005',
    name: '休息',
    department: '客户联络中心',
    startTime: '00:00',
    endTime: '00:00',
    duration: '0h',
    office: '全部',
    channel: '全渠道',
    crossDay: '否',
    color: '#edf7ed',
    usedBy: 20,
    status: '启用',
    risk: '正常',
    remark: '休息日不计入可用人力。',
  },
  {
    id: 'S-006',
    name: '早+晚',
    department: '客户联络中心',
    startTime: '08:30',
    endTime: '20:30',
    duration: '12h',
    office: '云栖办公区',
    channel: '热线接听',
    crossDay: '否',
    color: '#e8f5ff',
    usedBy: 7,
    status: '停用',
    risk: '需复核',
    remark: '仅用于临时补位，使用前需要班长确认。',
  },
]);
const groupTypeRows = ref<GroupTypeRow[]>([
  {
    id: 'G-001',
    name: '服务保障A班四轮转',
    effectiveDate: '2026-06-30',
    cycle: '休息 / 中班 / 早+晚 / 晚班',
    cycleDays: 4,
    department: '在线客服',
    office: '云栖办公区',
    groupScope: '服务保障A班',
    boundGroups: 1,
    workRest: '3上1休',
    status: '启用',
    lastGenerated: '2026-06-30 09:10',
  },
  {
    id: 'G-002',
    name: '服务保障B班五轮转',
    effectiveDate: '2026-06-30',
    cycle: '中班 / 早+晚 / 晚班 / 休息 / 休息',
    cycleDays: 5,
    department: '客户联络中心',
    office: '云栖办公区',
    groupScope: '服务保障B班',
    boundGroups: 1,
    workRest: '3上2休',
    status: '启用',
    lastGenerated: '2026-06-30 09:12',
  },
  {
    id: 'G-003',
    name: '总部办公区专员固定班',
    effectiveDate: '2026-06-30',
    cycle: '正常 / 正常 / 正常 / 正常 / 正常 / 休息 / 休息',
    cycleDays: 7,
    department: '工单中心',
    office: '总部办公区',
    groupScope: '总部办公区专员',
    boundGroups: 1,
    workRest: '5上2休',
    status: '启用',
    lastGenerated: '2026-06-29 18:40',
  },
  {
    id: 'G-004',
    name: '远端办公区弹性支援',
    effectiveDate: '2026-07-01',
    cycle: '远白8 / 远中8 / 休息 / 远夜10 / 休息',
    cycleDays: 5,
    department: '邮件中心',
    office: '远端办公区',
    groupScope: '服务保障C班',
    boundGroups: 1,
    workRest: '3上2休',
    status: '停用',
    lastGenerated: '-',
  },
]);
const leaveRows = ref<LeaveRow[]>([
  {
    id: 'L-001',
    type: '年假',
    name: '何语晨',
    department: '在线客服',
    group: '服务保障B班',
    office: '云栖办公区',
    status: '已通过',
    startTime: '2026-06-30 05:00',
    endTime: '2026-06-30 16:30',
    duration: '11.5h',
    impactShift: '中班',
    coverage: '待补位',
    remark: '周二午后在线客服预计缺口 3 人。',
  },
  {
    id: 'L-002',
    type: '病假',
    name: '马思齐',
    department: '客户联络中心',
    group: '服务保障C班',
    office: '云栖办公区',
    status: '待审批',
    startTime: '2026-07-21 14:00',
    endTime: '2026-07-21 22:00',
    duration: '8h',
    impactShift: '晚班',
    coverage: '待评估',
    remark: '影响 VIP 与投诉双技能坐席。',
  },
  {
    id: 'L-003',
    type: '事假',
    name: '高芷晴',
    department: '邮件中心',
    group: '服务保障A班',
    office: '远端办公区',
    status: '待审批',
    startTime: '2026-07-08 09:00',
    endTime: '2026-07-08 18:00',
    duration: '9h',
    impactShift: '正常',
    coverage: '待评估',
    remark: '邮件积压风险中等，审批后自动生成补位任务。',
  },
  {
    id: 'L-004',
    type: '调休',
    name: '罗嘉宁',
    department: '工单中心',
    group: '总部办公区专员',
    office: '总部办公区',
    status: '已驳回',
    startTime: '2026-07-02 22:00',
    endTime: '2026-07-03 08:00',
    duration: '10h',
    impactShift: '夜班',
    coverage: '无需补位',
    remark: '夜间技术支持池不足，已驳回。',
  },
]);
const rotationRows = ref<RotationRow[]>([
  {
    id: 'R-001',
    name: '袁泽宇',
    department: '客户联络中心',
    office: '云栖办公区',
    group: '服务保障B班',
    date: '2026-07-02',
    fromShift: '晚班',
    targetDate: '2026-07-04',
    targetShift: '休息',
    reason: '请假联动',
    source: '请假联动',
    status: '待确认',
    operator: '班长',
    approver: '待审批',
  },
  {
    id: 'R-002',
    name: '谭予安',
    department: '在线客服',
    office: '云栖办公区',
    group: '服务保障A班',
    date: '2026-07-05',
    fromShift: '中班',
    targetDate: '2026-07-06',
    targetShift: '早+晚',
    reason: '容量补位',
    source: '缺口建议',
    status: '已回写',
    operator: '排班专员',
    approver: '李主管',
  },
  {
    id: 'R-003',
    name: '姜念慈',
    department: '工单中心',
    office: '总部办公区',
    group: '总部办公区专员',
    date: '2026-07-09',
    fromShift: '夜班',
    targetDate: '2026-07-10',
    targetShift: '正常',
    reason: '手工调整',
    source: '手工调整',
    status: '已驳回',
    operator: '班长',
    approver: '王经理',
  },
]);
const monthDays = computed<MonthDay[]>(() => buildMonthDays(scheduleQuery.month));
const channelOptions = computed(() => {
  if (scheduleQuery.department !== '客户联络中心') return baseChannelOptions;
  return baseChannelOptions.filter((item) => !['市网格', '首环办', '交委体验单渠道'].includes(item));
});
const shiftTypeOptions = computed(() => ['正常 / 休息 / 夜班', ...genericShiftTypes, ...(officeShiftTypes[scheduleQuery.office] || [])]);
const rosterRows = ref<RosterRow[]>([
  { name: '张雨晨', group: '服务保障A班', shifts: buildShiftRow(['休息', '中班', '夜班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '休息']) },
  { name: '闫琦', group: '服务保障B班', shifts: buildShiftRow(['', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '请假', '请假', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '']) },
  { name: '徐俏', group: '服务保障B班', shifts: buildShiftRow(['', '中班', '早+晚', '晚班', '', '', '', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '']) },
  { name: '于艳丽', group: '服务保障B班', shifts: buildShiftRow(['', '中班', '早+晚', '晚班', '', '', '', '', '', '', '', '', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '请假', '请假', '晚班', '', '', '中班', '早+晚', '晚班', '', '']) },
  { name: '朱宇', group: '服务保障C班', shifts: buildShiftRow(['早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚']) },
  { name: '王潇', group: '服务保障C班', shifts: buildShiftRow(['早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚']) },
  { name: '温馨蓉', group: '服务保障C班', shifts: buildShiftRow(['早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚']) },
  { name: '朱丽丽', group: '服务保障D班', shifts: buildShiftRow(['中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班', '早+晚', '晚班', '', '', '中班']) },
  { name: '尤茜', group: '总部办公区专员', shifts: buildShiftRow(['正常', '正常', '休息', '休息', '正常', '正常', '正常', '正常', '正常', '休息', '休息', '正常', '正常', '正常', '正常', '正常', '休息', '休息', '正常', '正常', '正常', '正常', '正常', '休息', '休息', '正常', '正常', '正常', '正常', '正常', '休息']) },
]);
const groupSummary = computed(() => ({
  shiftMode: query.group.includes('B') ? '三班倒' : '两班倒',
  department: query.department === '全部' ? '客户联络中心 / 服务保障' : query.department,
  office: query.office === '全部' ? '云栖办公区' : query.office,
}));
const filteredUngroupedMembers = computed(() => filterMembers(ungroupedMembers.value, leftFilter.value));
const filteredGroupedMembers = computed(() => filterMembers(groupedMembers.value, rightFilter.value));
const filteredShiftTypeRows = computed(() =>
  shiftTypeRows.value.filter((row) => {
    const matchDepartment = matchFilter(row.department, shiftTypeQuery.department);
    const matchOffice = matchFilter(row.office, shiftTypeQuery.office);
    const matchStatus = matchFilter(row.status, shiftTypeQuery.status);
    return matchDepartment && matchOffice && matchStatus;
  }),
);
const filteredGroupTypeRows = computed(() =>
  groupTypeRows.value.filter((row) => {
    const matchDepartment = matchFilter(row.department, groupTypeQuery.department);
    const matchOffice = matchFilter(row.office, groupTypeQuery.office);
    const matchGroup = groupTypeQuery.group === '全部' || row.groupScope === groupTypeQuery.group;
    return matchDepartment && matchOffice && matchGroup;
  }),
);
const filteredLeaveRows = computed(() =>
  leaveRows.value.filter((row) => {
    const matchDepartment = matchFilter(row.department, leaveQuery.department);
    const matchOffice = matchFilter(row.office, leaveQuery.office);
    const matchStatus = matchFilter(row.status, leaveQuery.status);
    const matchRange = matchDateRange(row.startTime, leaveQuery.range);
    return matchDepartment && matchOffice && matchStatus && matchRange;
  }),
);
const filteredRotationRows = computed(() =>
  rotationRows.value.filter((row) => {
    const matchDepartment = matchFilter(row.department, rotationQuery.department);
    const matchOffice = matchFilter(row.office, rotationQuery.office);
    const matchStatus = matchFilter(row.status, rotationQuery.status);
    const matchRange = matchDateRange(row.date, rotationQuery.range);
    return matchDepartment && matchOffice && matchStatus && matchRange;
  }),
);

function matchFilter(value: string, selected: string) {
  return selected === '全部' || value === selected || value === '全部';
}

function getPickerDateKey(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  if (typeof value === 'object' && 'format' in value && typeof value.format === 'function') {
    return value.format('YYYY-MM-DD');
  }
  return '';
}

function matchDateRange(dateText: string, range: unknown) {
  if (!Array.isArray(range) || range.length < 2) return true;
  const start = getPickerDateKey(range[0]);
  const end = getPickerDateKey(range[1]);
  const current = dateText.slice(0, 10);
  if (!start || !end) return true;
  return current >= start && current <= end;
}

function formatMonthOption(date: Date) {
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
}

function buildMonthOptions(start: Date, end: Date) {
  const options: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endTime = new Date(end.getFullYear(), end.getMonth(), 1).getTime();
  while (cursor.getTime() <= endTime) {
    options.push(formatMonthOption(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return options;
}

function parseMonthOption(month: string) {
  const match = month.match(/^(\d{4})年(\d{2})月$/);
  if (!match) return new Date(scheduleToday.getFullYear(), scheduleToday.getMonth(), 1);
  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

function buildMonthDays(month: string): MonthDay[] {
  const firstDay = parseMonthOption(month);
  const totalDays = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
  return Array.from({ length: totalDays }, (_, index) => {
    const day = new Date(firstDay.getFullYear(), firstDay.getMonth(), index + 1);
    const fullDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    return {
      date: `${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
      week: weekLabels[day.getDay()],
      fullDate,
      editable: day.getTime() >= editableScheduleStart && day.getTime() <= editableScheduleEnd,
    };
  });
}

function buildShiftRow(labels: string[]): ShiftCell[] {
  return labels.map((label) => ({ label, type: getShiftType(label) }));
}

function getShiftType(label: string): ShiftType {
  if (!label) return 'empty';
  if (label === '请假') return 'leave';
  if (label === '休息') return 'rest';
  if (label === '正常') return 'normal';
  if (label.includes('晚班') || label.includes('夜')) return 'night';
  return 'channel';
}

function getShiftCell(person: RosterRow, index: number): ShiftCell {
  return person.shifts[index] || { label: '', type: 'empty' };
}

function handleScheduleDepartmentChange() {
  if (!channelOptions.value.includes(scheduleQuery.channel)) {
    scheduleQuery.channel = channelOptions.value[0];
  }
  message.info('已按部门刷新渠道范围');
}

function loadSchedule() {
  message.success('已按当前筛选条件刷新排班表');
}

function generateSchedule() {
  message.info('当前角色无生成排班权限');
}

function exportSchedule() {
  message.success(`将导出：排班表_${scheduleQuery.department}_${scheduleQuery.office}_${scheduleQuery.group}_${scheduleQuery.month}.xlsx`);
}

function assignChannel() {
  message.success(`${scheduleQuery.channel} 已按当前筛选范围进入分配流程`);
}

function getShiftKey(rowIndex: number, colIndex: number) {
  return `${rowIndex}-${colIndex}`;
}

function isShiftSelected(rowIndex: number, colIndex: number) {
  return selectedShiftKeys.value.includes(getShiftKey(rowIndex, colIndex));
}

function isShiftEditable(colIndex: number) {
  return Boolean(monthDays.value[colIndex]?.editable);
}

function showReadonlyShiftMessage() {
  message.warning('只能修改 2026-06-30 至 2026-07-30 的排班');
}

function closeShiftMenu() {
  shiftMenu.visible = false;
}

function setSingleShiftSelection(rowIndex: number, colIndex: number) {
  selectedShiftKeys.value = [getShiftKey(rowIndex, colIndex)];
}

function toggleShiftSelection(rowIndex: number, colIndex: number) {
  if (!isShiftEditable(colIndex)) return;
  const key = getShiftKey(rowIndex, colIndex);
  if (selectedShiftKeys.value.includes(key)) {
    selectedShiftKeys.value = selectedShiftKeys.value.filter((item) => item !== key);
    return;
  }
  selectedShiftKeys.value = [...selectedShiftKeys.value, key];
}

function selectShiftRange(rowIndex: number, colIndex: number) {
  const minRow = Math.min(shiftSelectionState.anchorRow, rowIndex);
  const maxRow = Math.max(shiftSelectionState.anchorRow, rowIndex);
  const minCol = Math.min(shiftSelectionState.anchorCol, colIndex);
  const maxCol = Math.max(shiftSelectionState.anchorCol, colIndex);
  const keys: string[] = [];
  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      if (!isShiftEditable(col)) continue;
      keys.push(getShiftKey(row, col));
    }
  }
  selectedShiftKeys.value = keys;
}

function handleShiftClick(event: MouseEvent, name: string, day: MonthDay, shift: ShiftCell, rowIndex: number, colIndex: number) {
  if (dragState.suppressClick) {
    dragState.suppressClick = false;
    return;
  }
  if (shiftSelectionState.moved) {
    shiftSelectionState.moved = false;
    return;
  }
  closeShiftMenu();
  if (!day.editable) {
    selectedShiftKeys.value = [];
    showReadonlyShiftMessage();
    return;
  }
  if (event.ctrlKey || event.metaKey) {
    toggleShiftSelection(rowIndex, colIndex);
    return;
  }
  setSingleShiftSelection(rowIndex, colIndex);
  if (!shift.label) {
    message.info(`${name} ${day.date} 暂无排班`);
    return;
  }
  message.info(`${name} ${day.date}：${shift.label}`);
}

function startShiftSelection(event: MouseEvent, rowIndex: number, colIndex: number) {
  event.preventDefault();
  closeShiftMenu();
  if (!isShiftEditable(colIndex)) {
    selectedShiftKeys.value = [];
    return;
  }
  if (event.ctrlKey || event.metaKey) return;
  shiftSelectionState.selecting = true;
  shiftSelectionState.moved = false;
  shiftSelectionState.anchorRow = rowIndex;
  shiftSelectionState.anchorCol = colIndex;
  setSingleShiftSelection(rowIndex, colIndex);
}

function extendShiftSelection(rowIndex: number, colIndex: number) {
  if (!shiftSelectionState.selecting || !isShiftEditable(colIndex)) return;
  if (rowIndex !== shiftSelectionState.anchorRow || colIndex !== shiftSelectionState.anchorCol) {
    shiftSelectionState.moved = true;
  }
  selectShiftRange(rowIndex, colIndex);
}

function openShiftMenu(event: MouseEvent, rowIndex: number, colIndex: number) {
  if (!isShiftEditable(colIndex)) {
    selectedShiftKeys.value = [];
    closeShiftMenu();
    showReadonlyShiftMessage();
    return;
  }
  if (!isShiftSelected(rowIndex, colIndex)) {
    setSingleShiftSelection(rowIndex, colIndex);
  }
  shiftSelectionState.selecting = false;
  dragState.dragging = false;
  shiftMenu.visible = true;
  shiftMenu.x = Math.min(event.clientX, window.innerWidth - 148);
  shiftMenu.y = Math.min(event.clientY, window.innerHeight - 286);
}

function applyShiftStatus(action: ShiftAction) {
  const keys = selectedShiftKeys.value.filter((key) => {
    const [, colIndex] = key.split('-').map(Number);
    return isShiftEditable(colIndex);
  });
  if (!keys.length) return;
  const snapshots: ShiftSnapshot[] = [];
  keys.forEach((key) => {
    const [rowIndex, colIndex] = key.split('-').map(Number);
    const row = rosterRows.value[rowIndex];
    if (!row?.shifts[colIndex]) return;
    snapshots.push({
      rowIndex,
      colIndex,
      shift: { ...row.shifts[colIndex] },
    });
    row.shifts[colIndex] = {
      label: action.type === 'empty' ? '' : action.label,
      type: action.type,
    };
  });
  if (snapshots.length) {
    shiftUndoStack.value.push(snapshots);
  }
  closeShiftMenu();
  message.success(`已修改 ${keys.length} 个班次状态`);
}

function undoShiftChange() {
  const snapshots = shiftUndoStack.value.pop();
  if (!snapshots?.length) {
    message.info('暂无可撤销的排班调整');
    return;
  }
  snapshots.forEach((snapshot) => {
    const row = rosterRows.value[snapshot.rowIndex];
    if (!row?.shifts[snapshot.colIndex]) return;
    row.shifts[snapshot.colIndex] = { ...snapshot.shift };
  });
  selectedShiftKeys.value = snapshots.map((snapshot) => getShiftKey(snapshot.rowIndex, snapshot.colIndex));
  closeShiftMenu();
  message.success(`已撤销 ${snapshots.length} 个班次调整`);
}

function handleScheduleShortcut(event: KeyboardEvent) {
  const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';
  if (!isUndo || activeModule.value !== 'schedule') return;
  event.preventDefault();
  undoShiftChange();
}

function handleTableMouseDown(event: MouseEvent) {
  if (event.button !== 0 || !rosterTableWrapRef.value) return;
  closeShiftMenu();
  dragState.dragging = true;
  dragState.suppressClick = false;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.scrollLeft = rosterTableWrapRef.value.scrollLeft;
  dragState.scrollTop = rosterTableWrapRef.value.scrollTop;
}

function handleTableMouseMove(event: MouseEvent) {
  if (!dragState.dragging || !rosterTableWrapRef.value) return;
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    dragState.suppressClick = true;
  }
  rosterTableWrapRef.value.scrollLeft = dragState.scrollLeft - deltaX;
  rosterTableWrapRef.value.scrollTop = dragState.scrollTop - deltaY;
}

function stopTableDrag() {
  dragState.dragging = false;
  shiftSelectionState.selecting = false;
}

function handleTableWheel(event: WheelEvent) {
  if (!rosterTableWrapRef.value) return;
  rosterTableWrapRef.value.scrollLeft += event.deltaX || event.deltaY;
  rosterTableWrapRef.value.scrollTop += event.deltaX ? event.deltaY : 0;
}

function filterMembers(members: MemberItem[], localKeyword: string) {
  const globalKeyword = query.memberName.trim();
  const keyword = localKeyword.trim();
  return members.filter((member) => {
    const matchGlobal = !globalKeyword || member.name.includes(globalKeyword) || member.id.includes(globalKeyword);
    const matchLocal = !keyword || member.name.includes(keyword) || member.tag.includes(keyword);
    const matchDepartment = query.department === '全部' || member.department === query.department;
    const matchOffice = query.office === '全部' || member.office === query.office;
    return matchGlobal && matchLocal && matchDepartment && matchOffice;
  });
}

function toggleMember(selectedIds: string[], id: string) {
  const index = selectedIds.indexOf(id);
  if (index >= 0) {
    selectedIds.splice(index, 1);
    return;
  }
  selectedIds.push(id);
}

function moveToGrouped() {
  const moving = ungroupedMembers.value.filter((member) => selectedUngroupedIds.value.includes(member.id));
  groupedMembers.value = [...groupedMembers.value, ...moving];
  ungroupedMembers.value = ungroupedMembers.value.filter((member) => !selectedUngroupedIds.value.includes(member.id));
  selectedUngroupedIds.value = [];
  hasGroupChanges.value = true;
}

function moveToUngrouped() {
  const moving = groupedMembers.value.filter((member) => selectedGroupedIds.value.includes(member.id));
  ungroupedMembers.value = [...ungroupedMembers.value, ...moving];
  groupedMembers.value = groupedMembers.value.filter((member) => !selectedGroupedIds.value.includes(member.id));
  selectedGroupedIds.value = [];
  hasGroupChanges.value = true;
}

function searchGroupMembers() {
  if (hasGroupChanges.value) {
    message.warning('当前有未保存调整，搜索前请先保存或重置');
    return;
  }
  message.success('已按当前条件刷新成员列表');
}

function handleGroupChange() {
  if (hasGroupChanges.value) {
    message.warning('当前分组有未保存调整，切换分组前请先保存或重置');
    return;
  }
  message.success(`已切换到 ${query.group}`);
}

function refreshGroupInfo() {
  message.success('分组信息已刷新');
}

function resetGroupMembers() {
  ungroupedMembers.value = [...initialUngroupedMembers];
  groupedMembers.value = [...initialGroupedMembers];
  selectedUngroupedIds.value = [];
  selectedGroupedIds.value = [];
  hasGroupChanges.value = false;
  message.success('已恢复到最近一次保存状态');
}

function saveGroupMembers() {
  hasGroupChanges.value = false;
  message.success('保存成功，当前分组成员已更新');
}

function undoGroupEdit() {
  if (hasGroupChanges.value) {
    resetGroupMembers();
    activeModule.value = 'schedule';
    message.info('已撤销本次修改并返回排班管理');
    return;
  }
  activeModule.value = 'schedule';
  message.info('已返回排班管理');
}

function addShiftType() {
  message.info('新增倒班类型会先进入停用状态，完成影响范围校验后再启用');
}

function previewShiftImpact(record: ShiftTypeRow) {
  message.info(`${record.name} 当前被 ${record.usedBy} 个班组周期引用，影响 ${record.channel} 排班生成`);
}

function toggleShiftType(record: ShiftTypeRow) {
  record.status = record.status === '启用' ? '停用' : '启用';
  message.success(`${record.name} 已${record.status}`);
}

function addGroupType() {
  message.info('新增班组类型后可绑定班组并生成未来 30 天排班草稿');
}

function previewGroupCycle(record: GroupTypeRow) {
  message.info(`${record.name}：${record.cycleDays} 天循环，规则为 ${record.cycle}`);
}

function applyGroupType(record: GroupTypeRow) {
  if (record.status !== '启用') {
    message.warning('停用规则不能应用到排班');
    return;
  }
  record.lastGenerated = '2026-06-30 18:00';
  message.success(`${record.groupScope} 已按 ${record.name} 生成待发布排班`);
}

function leaveStatusColor(status: string) {
  if (status === '已通过') return 'green';
  if (status === '已驳回') return 'red';
  return 'orange';
}

function approveLeave(record: LeaveRow) {
  record.status = '已通过';
  record.coverage = '待补位';
  message.success(`${record.name} 请假已通过，已进入缺口补位流程`);
}

function rejectLeave(record: LeaveRow) {
  record.status = '已驳回';
  record.coverage = '无需补位';
  message.success(`${record.name} 请假已驳回，排班保持不变`);
}

function createLeaveCoverage(record: LeaveRow) {
  if (record.status !== '已通过') {
    message.warning('请假通过后才能生成补位');
    return;
  }
  record.coverage = '已补位';
  rotationRows.value.unshift({
    id: `R-${String(rotationRows.value.length + 1).padStart(3, '0')}`,
    name: record.name,
    department: record.department,
    office: record.office,
    group: record.group,
    date: record.startTime.slice(0, 10),
    fromShift: record.impactShift,
    targetDate: record.startTime.slice(0, 10),
    targetShift: '补位班',
    reason: '请假补位',
    source: '请假联动',
    status: '待确认',
    operator: '班长',
    approver: '待审批',
  });
  message.success(`${record.name} 的请假缺口已生成倒班待确认记录`);
}

function rotationStatusColor(status: string) {
  if (status === '已回写') return 'green';
  if (status === '已驳回') return 'red';
  if (status === '已回滚') return 'default';
  return 'orange';
}

function addRotation() {
  rotationRows.value.unshift({
    id: `R-${String(rotationRows.value.length + 1).padStart(3, '0')}`,
    name: '戴云舒',
    department: '在线客服',
    office: '云栖办公区',
    group: '服务保障A班',
    date: '2026-07-11',
    fromShift: '中班',
    targetDate: '2026-07-12',
    targetShift: '休息',
    reason: '手工调整',
    source: '手工调整',
    status: '待确认',
    operator: '排班专员',
    approver: '待审批',
  });
  message.success('已新增一条倒班待确认记录');
}

function confirmRotation(record: RotationRow) {
  record.status = '已回写';
  record.approver = '李主管';
  message.success(`${record.name} 倒班已确认并回写排班表`);
}

function rejectRotation(record: RotationRow) {
  record.status = '已驳回';
  record.approver = '李主管';
  message.success(`${record.name} 倒班已驳回，原排班保持不变`);
}

function rollbackRotation(record: RotationRow) {
  record.status = '已回滚';
  message.success(`${record.name} 倒班已回滚，并保留变更记录`);
}

onMounted(() => {
  window.addEventListener('keydown', handleScheduleShortcut);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleScheduleShortcut);
});
</script>

<style scoped lang="scss">
.biz-page {
  display: flex;
  flex-direction: column;
  min-width: 1180px;
  min-height: 100%;
  color: var(--app-text);
}

.schedule-system {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: #eef7fb;
  border: 1px solid rgba(14, 116, 144, 0.16);
}

.schedule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  background: #d9f0f3;
  border-bottom: 1px solid rgba(14, 116, 144, 0.18);
}

.schedule-header__title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 14px;
}

.schedule-header strong {
  flex: 0 0 auto;
  font-size: 18px;
}

.schedule-header p,
.schedule-header span,
.table-summary p,
.module-tips p {
  margin: 0;
  color: var(--app-text-secondary);
}

.schedule-tabs {
  display: flex;
  align-items: stretch;
  min-height: 48px;
  padding-left: 18px;
  background: rgba(198, 232, 234, 0.9);
  border-bottom: 1px solid rgba(14, 116, 144, 0.18);
}

.schedule-tabs button {
  min-width: 118px;
  padding: 0 18px;
  color: #0f6b8f;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-right: 1px solid rgba(14, 116, 144, 0.08);
}

.schedule-tabs button.active {
  color: var(--app-text);
  background: var(--app-surface);
}

.schedule-board,
.module-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 16px 18px;
  overflow: hidden;
  background: var(--app-surface);
}

.schedule-filter,
.schedule-table-card,
.group-filter,
.member-panel,
.group-info-panel,
.module-panel {
  border: 1px solid var(--app-border);
  border-radius: 4px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
}

.schedule-filter {
  flex: 0 0 auto;
  padding: 14px 18px;
  margin-bottom: 14px;
  background: #ffffff;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.filter-row + .filter-row {
  margin-top: 12px;
}

.filter-row label {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-weight: 600;
  white-space: nowrap;
}

.filter-row label .ant-select {
  width: 150px;
}

.filter-row label.wide-control .ant-select {
  width: 230px;
}

.shift-legend {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  color: var(--app-text-secondary);
  white-space: nowrap;
}

.shift-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.shift-legend i {
  width: 12px;
  height: 12px;
  border: 1px solid transparent;
  border-radius: 3px;
}

.schedule-table-card {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  background: #ffffff;
}

.roster-table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  cursor: grab;
  border: 1px solid #d5e3ea;
}

.roster-table-wrap.dragging {
  cursor: grabbing;
  user-select: none;
}

.roster-table {
  width: max-content;
  min-width: 100%;
  border-spacing: 0;
  border-collapse: separate;
  color: var(--app-text);
  table-layout: fixed;
  user-select: none;
}

.roster-table th,
.roster-table td {
  min-width: 72px;
  height: 42px;
  padding: 0 8px;
  text-align: center;
  white-space: nowrap;
  border-right: 1px solid #d5e3ea;
  border-bottom: 1px solid #d5e3ea;
}

.roster-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 36px;
  color: #0f6b8f;
  font-weight: 700;
  background: #f1f8fb;
}

.roster-table thead tr:nth-child(2) th {
  top: 36px;
  color: var(--app-text-secondary);
  font-weight: 600;
}

.fixed-col {
  position: sticky;
  z-index: 3;
  background: #ffffff;
}

.roster-table th.fixed-col {
  z-index: 4;
  background: #e7f5f8;
}

.fixed-name {
  left: 0;
  min-width: 112px;
  width: 112px;
}

.fixed-group {
  left: 112px;
  min-width: 150px;
  width: 150px;
}

.name-cell,
.group-cell {
  text-align: left;
  font-weight: 700;
}

.group-cell {
  color: var(--app-text-secondary);
}

.shift-cell {
  min-width: 76px;
  cursor: pointer;
  font-weight: 600;
  background: #ffffff;
}

.shift-cell.readonly {
  cursor: not-allowed;
  opacity: 0.72;
}

.shift-cell:hover {
  box-shadow: inset 0 0 0 2px rgba(15, 107, 143, 0.24);
}

.shift-cell.readonly:hover {
  box-shadow: none;
}

.shift-cell.selected {
  position: relative;
  z-index: 1;
  outline: 2px solid #2563eb;
  outline-offset: -2px;
  box-shadow: inset 0 0 0 999px rgba(37, 99, 235, 0.08);
}

.shift-context-menu {
  position: fixed;
  z-index: 20;
  width: 132px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #bfd2e2;
  border-radius: 6px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
}

.shift-context-menu strong {
  display: block;
  padding: 3px 6px 7px;
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.shift-context-menu button {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 30px;
  padding: 0 8px;
  color: var(--app-text);
  font: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.shift-context-menu button:hover {
  background: #eef6ff;
}

.shift-context-menu i {
  width: 10px;
  height: 10px;
  border: 1px solid transparent;
  border-radius: 3px;
}

.night {
  color: #7c2d12;
  background: #fff1e6;
  border-color: #fed7aa !important;
}

.channel {
  color: #0f6b8f;
  background: #e8f5ff;
  border-color: #bae6fd !important;
}

.leave {
  color: #991b1b;
  background: #fff1f2;
  border-color: #fecdd3 !important;
}

.rest {
  color: #166534;
  background: #edf7ed;
  border-color: #bbf7d0 !important;
}

.normal {
  color: #374151;
  background: #f8fafc;
  border-color: #e2e8f0 !important;
}

.empty {
  color: transparent;
  background: #ffffff;
}

.group-filter {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 14px 18px;
  margin-bottom: 14px;
  background: #ffffff;
}

.group-filter label {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-weight: 600;
  white-space: nowrap;
}

.group-filter label .ant-select {
  width: 150px;
}

.group-filter .member-search .ant-input {
  width: 210px;
}

.group-filter label.wide-control .ant-select {
  width: 240px;
}

.current-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  color: var(--app-text-secondary);
  white-space: nowrap;
}

.current-group strong {
  color: #0f6b8f;
}

.current-group span {
  color: var(--app-text-secondary);
}

.group-workspace {
  display: grid;
  grid-template-columns: minmax(300px, 420px) 72px minmax(300px, 420px) minmax(360px, 1fr);
  gap: 18px;
  flex: 1 1 auto;
  min-height: 0;
}

.member-panel,
.group-info-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #ffffff;
}

.member-panel__head,
.group-info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 10px 14px;
  background: #f1f8fb;
  border-bottom: 1px solid #d5e3ea;
}

.member-panel__head h2,
.group-info-head h2 {
  margin: 0;
  font-size: 17px;
}

.member-panel__head h2 span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  margin-left: 6px;
  color: #0f6b8f;
  font-size: 13px;
  background: #dcefff;
  border-radius: 999px;
}

.member-panel__head .ant-input {
  width: 126px;
}

.member-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(213, 227, 234, 0.74);
}

.member-row.selected {
  background: #e8f3ff;
}

.member-row strong {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transfer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
}

.transfer-actions .ant-btn {
  min-width: 44px;
  height: 36px;
  font-size: 18px;
  background: #35a854;
  border-color: #35a854;
}

.group-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 16px;
}

.group-info-grid article {
  min-height: 92px;
  padding: 16px;
  background: #fbfdff;
  border: 1px solid #d5e3ea;
  border-radius: 6px;
}

.group-info-grid span {
  display: block;
  margin-bottom: 12px;
  color: var(--app-text-secondary);
}

.group-info-grid strong {
  display: block;
  font-size: 22px;
}

.group-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  padding: 12px 18px 0;
}

.table-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.table-summary h2 {
  margin: 0 0 4px;
  font-size: 18px;
}

.config-board {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 16px 18px;
  overflow: hidden;
  background: var(--app-surface);
}

.config-filter,
.config-table-card {
  border: 1px solid var(--app-border);
  border-radius: 4px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
}

.config-filter {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 14px 18px;
  margin-bottom: 14px;
  background: #ffffff;
}

.config-filter label {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-weight: 600;
  white-space: nowrap;
}

.config-filter label .ant-select {
  width: 150px;
}

.config-filter .date-control :deep(.ant-picker) {
  width: 236px;
}

.config-table-card {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  background: #ffffff;
}

.config-table-card :deep(.ant-table-wrapper),
.config-table-card :deep(.ant-spin-nested-loading),
.config-table-card :deep(.ant-spin-container),
.config-table-card :deep(.ant-table),
.config-table-card :deep(.ant-table-container) {
  min-height: 100%;
}

.config-table-card :deep(.ant-table-thead > tr > th) {
  color: #0f6b8f;
  font-weight: 700;
  background: #f1f8fb;
}

.config-table-card :deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}

.shift-swatch {
  display: inline-block;
  width: 18px;
  height: 18px;
  vertical-align: middle;
  border: 1px solid #bfd2e2;
  border-radius: 4px;
}

.cycle-preview {
  display: inline-block;
  max-width: 300px;
  overflow: hidden;
  color: #0f6b8f;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.closure-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  min-height: 48px;
  padding: 0 16px;
  margin-top: 14px;
  color: var(--app-text-secondary);
  background: #f6fbfd;
  border: 1px solid #d5e3ea;
  border-radius: 4px;
}

.closure-strip span {
  flex: 0 0 auto;
  font-weight: 600;
  white-space: nowrap;
}

.closure-strip i {
  flex: 0 0 28px;
  height: 1px;
  background: #aac9d6;
}

.module-panel {
  margin: 16px 18px;
  padding: 18px;
  overflow: auto;
  background: #ffffff;
}

.module-tips {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.module-tips article {
  padding: 14px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 6px;
}

.module-tips strong {
  display: block;
  margin-bottom: 8px;
}

@media (max-width: 1360px) {
  .biz-page {
    min-width: 980px;
  }

  .schedule-header,
  .schedule-header__title {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-row,
  .group-filter,
  .config-filter {
    flex-wrap: wrap;
  }

  .shift-legend {
    width: 100%;
    margin-left: 0;
  }

  .current-group {
    width: 100%;
    margin-left: 0;
  }

  .group-workspace {
    grid-template-columns: 1fr;
  }

  .transfer-actions {
    flex-direction: row;
  }

  .module-tips {
    grid-template-columns: 1fr;
  }

  .closure-strip {
    overflow-x: auto;
  }
}
</style>
