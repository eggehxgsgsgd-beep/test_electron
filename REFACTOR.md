# FocusDo 重构路线

目标:把项目改造成**可长期维护、易读、便于学习**的结构。
原则:**先铺安全网,再拆房子**;每步独立提交、可回滚;小文件再上 TS。

> 不动的部分:三进程架构、`shared/todo.ts` 类型契约、数据层的并发/恢复硬骨头、
> "整个 state 替换" 的 IPC 模型、inline-style + theme 约定。这些已经是对的。

## 阶段 A:地基(安全网)

- [x] **A1** 锁定依赖版本:`"latest"` → 当前实际版本的 caret 范围,确保可复现构建
- [x] **A2** 接入 ESLint(flat config)+ Prettier,加 `lint`/`format` 脚本。ESLint 修掉 5 处死代码;
  Prettier 采**渐进式**(配置就位但不重排存量文件——全量重排约 2500 行,churn 过大不划算)。
  剩 8 条 `exhaustive-deps` 告警(刻意手动管依赖,不阻断)
- [x] **A3** 抽离统计纯函数到独立文件并补测试 —— `fd-stats-utils.ts`(7 函数)+ 21 项单测(`fd-stats-utils.test.ts`)

## 阶段 B:拆解 god component(`focusdo-app.jsx` 994 行)

- [x] **B1** 纯展示组件移入展示层:stat 组件 + 纯函数 → 新建 `fd-stats.jsx`;`Sidebar` → `fd-ui.jsx`(`focusdo-app.jsx` 994 → 581 行)
- [x] **B2** 番茄钟计时引擎抽为 `usePomodoro` hook(`fd-use-pomodoro.js`;`focusdo-app.jsx` 581 → 401 行)
- [x] **B3** App 的数据 IPC 收拢到 `useFocusDoData`(含 UI↔后端映射);App 零直接 IPC。
  引擎级 IPC(usePomodoro)与设置弹窗自包含的导出按钮按设计保留。`focusdo-app.jsx` 401 → 279 行

## 阶段 C:renderer 全面 TypeScript 化(叶子优先,逐文件,每个一 commit)

> 复用 `shared/todo.ts` 后端类型 + 新建 `fd-types.ts`(渲染层 UI 类型)。
> `vite-env.d.ts` 已声明 `window.focusDo: FocusDoApi`,IPC 调用自动获类型。
> 已完成:`fd-stats-utils.ts`(随 A3)。

- [x] **C1** 新建 `fd-types.ts`(`UiTask`/`UiSettings`/`UiState`)+ `fd-use-focusdo-data.js → .ts`
- [x] **C-S** 统一前后端设置词汇(= 原 D1):`shared/todo.ts` 改用前端短名(themeKey/focusMin)
  并正式声明 6 个开关项;删除 `settingsForBackend`/`themeToThemeKey` 翻译层、旧键回退、
  `clarity/clear` 错位。`UiSettings` 现为 `FocusSettings` 别名。(系统未上线,无需兼容)
- [ ] **C2** `fd-use-pomodoro.js → .ts`(定义 `Pomo`/`PomoPhase`)
- [ ] **C3** `fd-stats.jsx → .tsx`
- [ ] **C4** `fd-ui.jsx → .tsx`(最大块;定义 `Theme` 类型 + 各组件 props)
- [ ] **C5** `fd-panels.jsx → .tsx`
- [ ] **C6** `fd-insights.jsx → .tsx`
- [ ] **C7** `focusdo-app.jsx → .tsx` + `focusdo-entry.jsx → .ts`

## 阶段 D:可选清理

- [x] **D1** 统一前后端两套设置词汇 —— 已在 C-S 完成(系统未上线,兼容顾虑消失,故提前合并)

## 阶段 E:目录重组(关注点分离,先于 C 做)

> 目标:专业目录结构(PascalCase 组件、去 `fd-` 前缀、`@/` + `@shared` 别名)。
> 暂停 JS→TS(C),先把代码按职责拆进目录。完成后 C 在更小的文件上更易推进。

- [x] **E1** 配 `@/`/`@shared` 别名 + 迁移基础层(`hooks/`、`lib/`、`types.ts`、`components/stats/StatsView`)
- [x] **E2** 拆 `fd-ui.jsx`(1018 行)→ 8 文件:`theme/themes.js`、`components/primitives/{Icon,LottieView,EmptyState}`、
  `components/tasks/TaskListView`、`components/focus/FocusView`、`components/archive/ArchiveView`、`components/layout/Sidebar`
- [x] **E3** 拆 `fd-panels.jsx`(756 行)→ `tasks/DetailPanel` + `settings/{SettingsModal,SettingsControls,tabs/*}`(6 个 Tab)。
  共享小部件下沉为 `SettingsControls`;每个 Tab 独立成文件(独立单元 ≠ 私有零件)。**按指令删除 AboutTab(行为变更)**
- [ ] **E4** 拆 `fd-insights.jsx` → `components/insights/{InsightsListView,InsightFullPage,QuickInsightModal}`
- [ ] **E5** 入口/根组件改名:`focusdo-entry → main.jsx`、`focusdo-app → App.jsx`(更新 index.html)

---

### 注意事项
- ~~别为消除"两套词汇映射"而大改数据形状~~ → 已在 C-S 主动统一:系统未上线、无存量数据需兼容,
  保留翻译层的理由不再成立。`migrateFocusScene`(focusScene 的取值兜底)仍保留,与本次无关。
- 每个 task 单独 commit,完成后停下 review。
