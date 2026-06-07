import type { Component } from 'vue';

import {
  ApartmentOutlined,
  BarChartOutlined,
  BookOutlined,
  CodeOutlined,
  DashboardOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  HomeOutlined,
  MenuOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  RobotOutlined,
  ScheduleOutlined,
  SettingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';

const iconMap = {
  apartment: ApartmentOutlined,
  'area-chart': BarChartOutlined,
  barChart: BarChartOutlined,
  book: BookOutlined,
  building: ApartmentOutlined,
  code: CodeOutlined,
  'code-sandbox': CodeOutlined,
  dashboard: DashboardOutlined,
  delete: DeleteOutlined,
  'file-search': FileSearchOutlined,
  home: HomeOutlined,
  list: UnorderedListOutlined,
  menu: MenuOutlined,
  plusCircle: PlusCircleOutlined,
  'plus-circle': PlusCircleOutlined,
  profile: ProfileOutlined,
  questionCircle: QuestionCircleOutlined,
  'question-circle': QuestionCircleOutlined,
  read: ReadOutlined,
  robot: RobotOutlined,
  schedule: ScheduleOutlined,
  setting: SettingOutlined,
  settings: SettingOutlined,
  shield: TeamOutlined,
  team: TeamOutlined,
  ticket: ProfileOutlined,
  unorderedList: UnorderedListOutlined,
  'unordered-list': UnorderedListOutlined,
  user: UserOutlined,
};

export function getMenuIconComponent(icon?: string | Component): Component | undefined {
  if (!icon || typeof icon !== 'string') {
    return icon as Component | undefined;
  }

  const normalized = icon
    .replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
    .replace(/^-/, '');

  return iconMap[normalized as keyof typeof iconMap];
}
