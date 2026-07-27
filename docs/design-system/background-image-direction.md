# AI Ticket OS 背景图设计与还原规范

## 1. 结论

当前项目最适合的背景不是照片、插画或大面积炫光图，而是 **深色企业运营指挥中心的数据拓扑背景**。

推荐风格：

- 名称：Dark Command Data Field
- 气质：企业级、克制、AI 原生、运营指挥中心、实时数据感
- 主视觉：深色底盘 + 低透明网格 + 轻量数据流线 + 局部蓝/青/紫状态光晕 + 极弱噪声纹理
- 目标：让页面看起来有 AI 与实时运营氛围，但不干扰表格、图表、指标、工作队列和操作按钮

如果目标是接近 99% 还原设计稿，建议把“背景图”定义为 **可分层还原的背景系统**，而不是一张整页 PNG。整图导出会在不同分辨率、暗色/浅色主题、内容滚动和压缩后失真；分层方案更容易让 Figma 与前端保持一致。

## 2. 项目场景判断

AI Ticket OS 的产品定位是 Enterprise AI Customer Service Operating System，服务大型客服中心、呼叫中心、售后运营和客户成功团队。现有设计系统强调：

- Dark Mode
- Glassmorphism
- Cyber Tech
- Data Intelligence
- Operation Command Center
- Dense but readable information
- Operational first, decorative second

因此背景图要优先满足三个目标：

1. 保证信息可读性：背景对比必须低，不能压过表格、图表、标签和按钮。
2. 强化运营场景：可出现网格、信号线、节点、实时扫描光，但不要做成营销首页或科幻海报。
3. 支持高保真还原：Figma 中的每一层都要能映射到 CSS、少量纹理图或固定尺寸资源。

不推荐的背景方向：

- 大面积渐变光斑：容易变成通用 AI 模板感。
- 3D 城市、机房、机器人插画：偏营销，不适合后台工作台。
- 照片背景：会影响信息密度和可读性，也难以适配 30 个业务页面。
- 强透视网格或霓虹隧道：过度装饰，容易抢占业务内容。
- 单张整屏背景 PNG：初看接近，实际在响应式、滚动和主题切换中难稳定还原。

## 3. 背景结构

建议使用 6 层结构，从底到顶：

| 层级 | 名称 | 作用 | Figma 做法 | 前端还原 |
| --- | --- | --- | --- | --- |
| 1 | Base | 页面底色 | Solid `#070B14` | `background-color` |
| 2 | Depth Gradient | 深色空间层次 | 大面积线性渐变 | `linear-gradient` |
| 3 | Ambient Glow | 状态光晕 | 蓝/青/紫径向渐变 | `radial-gradient` |
| 4 | Data Grid | 数据网格 | 1px 低透明线条 | `linear-gradient` repeat |
| 5 | Signal Lines | 业务信号流 | 细线、短线、节点 | CSS pseudo element 或 SVG/WebP |
| 6 | Noise / Scan | 质感与压暗 | 极弱噪声、扫描线 | 小尺寸 noise 图或 repeating gradient |

推荐视觉比例：

- Base + Depth Gradient：70%
- Ambient Glow：12%
- Data Grid：8%
- Signal Lines：6%
- Noise / Scan：4%

背景整体必须“看得到，但说不出来具体是什么”。如果用户第一眼注意到背景，说明强度过高。

## 4. Figma 设计参数

### 4.1 画布

- 主画布：`1920 x 1080`
- Header：`72px`
- Sidebar：`280px`
- Tabs：约 `40px`
- Content Padding：`16px`
- 主内容起点参考：`x = 280px`，`y = 112px`

背景设计应覆盖完整画布，但重点纹理不要压在表格文字区域。建议把可见装饰集中在：

- 主内容右上角
- 主内容底部两侧
- Hero 区域右侧
- Sidebar 与主内容交界处的极弱纵向光带

### 4.2 色彩

必须使用现有 token：

| 用途 | 色值 | 建议透明度 |
| --- | --- | --- |
| 页面深底 | `#070B14` | 100% |
| 深色面板基底 | `#0F172A` | 72%-92% |
| Primary Electric Blue | `#4F7BFF` | 4%-18% |
| Secondary Purple | `#8B5CF6` | 3%-14% |
| Accent Cyan | `#00E5FF` | 4%-16% |
| Success | `#22C55E` | 3%-10%，只用于健康状态背景点缀 |
| Warning | `#F59E0B` | 3%-10%，只用于 SLA 风险区 |
| Danger | `#EF4444` | 3%-8%，只用于告警或风险页 |
| Border | `rgba(255,255,255,0.12)` | 面板边界 |
| Glass | `rgba(255,255,255,0.06)` | 玻璃面板 |

### 4.3 推荐图层细节

#### Base

- Fill：`#070B14`
- 不使用纯黑，避免压死玻璃面板层次。

#### Depth Gradient

Figma：

- Linear gradient，角度 `180deg`
- Stop 1：`#0B1220`，100%，位置 0%
- Stop 2：`#070B14`，100%，位置 48%
- Stop 3：`#040711`，100%，位置 100%

CSS：

```scss
linear-gradient(180deg, #0b1220 0%, #070b14 48%, #040711 100%)
```

#### Ambient Glow

建议放 3 个径向光晕：

1. 左上品牌光：中心 `x=120`, `y=48`，颜色 `#4F7BFF`，透明度 18%，扩散 360px。
2. 主内容右上 AI 光：中心 `x=1560`, `y=168`，颜色 `#00E5FF`，透明度 12%，扩散 520px。
3. 右下编排光：中心 `x=1620`, `y=920`，颜色 `#8B5CF6`，透明度 10%，扩散 560px。

注意：不要使用离散圆形光球；光晕必须大、软、低透明，并被内容面板遮住大部分。

#### Data Grid

Figma：

- 横线/竖线：1px
- 间距：`32px`
- 颜色：`rgba(255,255,255,0.035)`
- 主内容区可叠加一层更细网格：间距 `8px`，透明度不超过 `0.015`

CSS：

```scss
linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
background-size: 32px 32px;
```

#### Signal Lines

信号线是最容易破坏还原度的部分，建议遵守：

- 线宽：`1px`
- 颜色：`#00E5FF` 或 `#4F7BFF`
- 透明度：`8%-18%`
- 线段长度：`80px-260px`
- 不要超过 12 条明显线段
- 节点大小：`2px-4px`
- 节点透明度：`20%-45%`
- 不要穿过主要文字密集区

Figma 中可以用 Vector 画线，但如果需要前端高还原，建议将 signal lines 单独导出为透明 WebP/SVG，并固定在主内容背景层。

#### Noise / Scan

推荐做法：

- 使用 `128x128` 或 `256x256` 的透明噪声贴图。
- 不透明度：`2%-4%`
- 混合模式：优先 Normal；避免依赖 Figma 特有混合模式。
- 扫描线间距：`4px`
- 扫描线透明度：`2%-3%`

## 5. 前端还原方案

### 5.1 不建议整图导出

不要把完整 `1920x1080` 背景作为一张图片铺在 `.app-content` 上。原因：

- 内容滚动时背景定位容易漂。
- 低端屏幕或缩放下压缩纹理会糊。
- 暗色和浅色主题需要不同版本。
- 设计稿中玻璃面板和背景叠加关系难用一张图维护。

### 5.2 推荐 CSS 分层

建议新增全局背景类，例如 `.app-command-background` 或挂在 `.basic-layout` / `.app-content` 上。

```scss
html.dark .basic-layout {
  background:
    radial-gradient(circle at 8% 4%, rgba(79, 123, 255, 0.18), transparent 22rem),
    radial-gradient(circle at 82% 14%, rgba(0, 229, 255, 0.12), transparent 32rem),
    radial-gradient(circle at 84% 88%, rgba(139, 92, 246, 0.10), transparent 34rem),
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(180deg, #0b1220 0%, #070b14 48%, #040711 100%);
  background-size:
    auto,
    auto,
    auto,
    32px 32px,
    32px 32px,
    auto;
}
```

如果要更接近 Figma，可以增加两个伪元素：

```scss
.basic-layout::before {
  position: fixed;
  inset: 72px 0 0 280px;
  pointer-events: none;
  content: '';
  background:
    linear-gradient(116deg, transparent 0 18%, rgba(124, 199, 255, 0.08) 18% 18.2%, transparent 18.2% 100%),
    linear-gradient(116deg, transparent 0 64%, rgba(124, 199, 255, 0.07) 64% 64.2%, transparent 64.2% 100%);
  opacity: 0.72;
}

.basic-layout::after {
  position: fixed;
  inset: 0;
  pointer-events: none;
  content: '';
  background: repeating-linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.025) 0,
    rgba(255, 255, 255, 0.025) 1px,
    transparent 1px,
    transparent 4px
  );
  opacity: 0.42;
}
```

### 5.3 面板叠加关系

深色模式下，玻璃面板建议继续使用：

```scss
background:
  linear-gradient(135deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.035)),
  rgba(15, 23, 42, 0.72);
border: 1px solid rgba(255, 255, 255, 0.12);
backdrop-filter: blur(22px);
box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
```

背景图的亮度需要以这套面板为基准调试：面板下方可以有氛围，不能让面板边界失去层次。

## 6. 浅色主题策略

当前部分页面实现为浅色企业后台。浅色主题不建议复用深色数据拓扑背景，应降级为“低饱和浅色数据纸面”：

- Base：`#F4F7FB`
- Ambient：`rgba(79,123,255,0.08)`、`rgba(0,229,255,0.05)`
- Grid：`rgba(15,23,42,0.035)`
- Signal：只保留极少蓝色短线，透明度不超过 8%
- 禁止使用暗色扫描线

浅色主题的背景应该几乎不可见，只为页面增加细微层次。

## 7. Figma 到前端的 99% 还原工作流

1. 在 Figma 中建立 `Background / Command Data Field` 分组。
2. 按 Base、Depth Gradient、Ambient Glow、Data Grid、Signal Lines、Noise / Scan 六层命名。
3. 所有色值使用现有 token，不临时取色。
4. 所有透明度在图层名中标注，例如 `Glow / Cyan / 12% / 520px`。
5. 网格使用固定 `32px` 间距，不手动画偏移线。
6. Signal Lines 如果形状固定，单独导出透明 SVG/WebP；如果只是直线和斜线，优先用 CSS 还原。
7. Noise 单独导出小尺寸透明 PNG/WebP，不放进整图。
8. 前端使用同一套 CSS 数值实现背景，不从截图吸色。
9. 用 `1920x1080` 截图和 Figma 叠图比对：
   - 主背景色误差可接受范围：`±2` RGB
   - 网格位置误差：不超过 `1px`
   - 光晕中心误差：不超过 `12px`
   - 面板边框与背景对比：肉眼可辨但不突兀
10. 再用 `1366x768` 和窄桌面视口检查，不要求逐像素一致，但要求信息层级一致。

## 8. 页面适用范围

强推荐使用完整背景系统的页面：

- Dashboard
- Ticket Center
- AI Agent Center
- AI Workflow Center
- Operations Analytics
- BI Reports
- Data Cockpit
- SLA Management
- Risk Warning
- System Monitoring
- Alert Center

弱化背景的页面：

- System Users
- Roles
- Menus
- Tenants
- Audit
- Knowledge Documents
- FAQ

原因：系统管理和知识编辑类页面更偏表单、表格和文档操作，背景过强会降低效率。

## 9. 生成背景图提示词

如果确实需要生成一张参考背景图，提示词建议：

```text
Dark enterprise AI operations command center background, deep navy black base, subtle 32px data grid, faint cyan and electric blue signal lines, soft radial glow in blue cyan purple, low contrast, no objects, no people, no robot, no city, no text, no logo, no large bokeh orbs, no marketing hero composition, designed for dense SaaS dashboard UI overlay, 1920x1080, crisp, minimal, professional, glassmorphism compatible.
```

负向约束：

```text
no illustration, no photo, no 3D robot, no city skyline, no large glowing spheres, no colorful aurora, no heavy texture, no text, no icons, no futuristic tunnel, no busy circuit board
```

生成图只作为 Figma 参考，不建议直接作为最终页面背景。

## 10. 视觉验收清单

- [ ] 1920x1080 下背景完整覆盖 Header、Sidebar 和主内容区。
- [ ] Header 72px、Sidebar 280px 的结构不被背景打乱。
- [ ] 主内容区域没有明显空洞、糊块或压缩噪点。
- [ ] 表格文字、图表标签、筛选器 placeholder 在背景上清晰可读。
- [ ] 玻璃面板边界清晰，边框不被亮光吞掉。
- [ ] 背景不抢 AI Copilot、SLA 风险、告警和 live status 的视觉优先级。
- [ ] 深色主题有命令中心氛围，浅色主题保持干净。
- [ ] 截图叠图时网格偏移不超过 1px。
- [ ] 光晕不会在不同页面内容下形成误导性的状态色。
- [ ] 不出现营销页、海报、插画或模板化 AI 背景观感。

## 11. 最终建议

采用 **Dark Command Data Field 分层背景系统**。

它和 AI Ticket OS 的深色企业中台、玻璃面板、实时图表、AI 指挥面板最匹配，也最容易在 Figma 与 Vue/SCSS 中稳定复现。若必须追求接近 99% 的设计稿还原，关键不是生成更复杂的背景图，而是把背景拆成可命名、可量化、可复用的图层，并让 Figma 参数与 CSS 参数一一对应。
