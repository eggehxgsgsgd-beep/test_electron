# FocusDo 重构路线

目标:把项目改造成**可长期维护、易读、便于学习**的结构。
原则:**先铺安全网,再拆房子**;每步独立提交、可回滚;小文件再上 TS。

> 不动的部分:三进程架构、`shared/todo.ts` 类型契约、数据层的并发/恢复硬骨头、
> "整个 state 替换" 的 IPC 模型、inline-style + theme 约定。这些已经是对的。

## 阶段 A:地基(安全网)

- [x] **A1** 锁定依赖版本:`"latest"` → 当前实际版本的 caret 范围,确保可复现构建
- [ ] **A2** 接入 ESLint + Prettier,跑全量、修报错,加 `npm run lint`
- [x] **A3** 抽离统计纯函数到独立文件并补测试 —— `fd-stats-utils.ts`(7 函数)+ 21 项单测(`fd-stats-utils.test.ts`)

## 阶段 B:拆解 god component(`focusdo-app.jsx` 994 行)

- [x] **B1** 纯展示组件移入展示层:stat 组件 + 纯函数 → 新建 `fd-stats.jsx`;`Sidebar` → `fd-ui.jsx`(`focusdo-app.jsx` 994 → 581 行)
- [x] **B2** 番茄钟计时引擎抽为 `usePomodoro` hook(`fd-use-pomodoro.js`;`focusdo-app.jsx` 581 → 401 行)
- [x] **B3** App 的数据 IPC 收拢到 `useFocusDoData`(含 UI↔后端映射);App 零直接 IPC。
  引擎级 IPC(usePomodoro)与设置弹窗自包含的导出按钮按设计保留。`focusdo-app.jsx` 401 → 279 行

## 阶段 C:renderer TypeScript 化(逐文件)

- [~] **C1** tsconfig 开 `checkJs`,从纯函数/hook 开始类型化,复用 `shared/todo.ts` 类型
  —— 已起步:`fd-stats-utils.ts` 随 A3 转为 TS(strict 门要求);`checkJs` 尚未开
- [ ] **C2** 依次类型化 `fd-*` 展示组件

## 阶段 D:可选清理(待评估)

- [ ] **D1**(暂缓)统一前后端两套设置词汇 —— 承载兼容旧数据职责,风险 > 收益,前面做完再评估

---

### 注意事项
- 别为消除"两套词汇映射"而大改**数据形状**:那层映射在保护存量数据(`migrateFocusScene`、legacy fallback)。重构只动**结构**,不动**数据契约**。
- 每个 task 单独 commit,完成后停下 review。
