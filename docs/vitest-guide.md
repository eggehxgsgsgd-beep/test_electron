# Vitest 使用指南（FocusDo 项目）

> 写给「被前端配置劝退过」的人。这份文档的第一目标不是罗列 API，而是帮你
> **把「配置」和「写测试」分清楚**，不再被一堆 config 文件淹没。

---

## 0. 先解决「配置恐惧」

前端让人头大的不是某个工具难，而是**职责被拆成了好几个独立工具，每个工具一个配置文件**：

| 配置文件 | 谁的 | 管什么 | 你要不要精通 |
|---|---|---|---|
| `package.json` | npm | 装了哪些包、有哪些命令 | ✅ 要懂（每天用） |
| `tsconfig.json` | TypeScript | 类型怎么检查 | 🟡 懂大意即可 |
| `electron.vite.config.ts` | Vite/electron-vite | 代码怎么打包、转译 | 🟡 懂大意即可 |
| `vitest.config.ts` | Vitest | 测试怎么跑 | 🟡 懂大意即可 |
| `.eslintrc` 之类 | ESLint | 代码风格/低级错误 | ⬜ 抄现成的就行 |

**关键认知:配置文件是「一次性把工具摆好」,抄一遍、理解大意就够了,不用背。
真正要练的肌肉是「测试代码怎么写」——那是你每天写的东西。** 这份文档把
配置部分压到最小(因为本来就该很小),把篇幅留给写法。

### 为什么 Vitest 的配置特别少?

因为它**寄生在 Vite 上**,复用 Vite 已有的转译能力。Vite 已经知道怎么把
TypeScript / JSX / ESM 变成能跑的代码,Vitest 就直接拿来用——**所以你不用
再为「测试时 TS 怎么编译」配一遍**。这就是下面这个配置只有几行的原因。

---

## 1. 我们项目的全部测试配置(就这么多)

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',            // 跑在 Node 里(主进程逻辑,不需要浏览器/DOM)
    include: ['src/**/*.test.ts']   // 哪些文件算测试:src 下所有 .test.ts
  }
})
```

逐行解释:
- `defineConfig`:只是给你类型提示的包装函数,没有魔法,照抄即可。
- `environment: 'node'`:测试运行在什么环境里。我们测的是 `todoStore.ts`(纯
  Node 逻辑,操作 sqlite 文件),所以用 `node`。**以后测 React 组件时**会改用
  `jsdom`(在 Node 里模拟一套浏览器 DOM)。
- `include`:用 glob 模式告诉 Vitest 去哪找测试文件。我们约定测试文件叫
  `xxx.test.ts`,和源码放一起。

> 没了。没有 babel 配置、没有 TS 编译配置、没有一堆 plugin——因为那些 Vite
> 那边已经管好了。

### `package.json` 里的两条命令

```json
"scripts": {
  "test": "vitest run",       // 跑一次就退出(CI、提交前用这个)
  "test:watch": "vitest"      // 监听模式:改文件自动重跑(平时开发用这个)
}
```

用法:
```bash
npm test               # 全部跑一遍
npm run test:watch     # 边写边自动重跑
npm test -- todoStore  # 只跑文件名含 todoStore 的测试
```

---

## 2. 一个测试文件长什么样

测试文件 = 普通的 TS 文件,只是文件名带 `.test.ts`。看我们项目里真实的
`src/main/todoStore.test.ts` 的骨架:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TodoStore } from './todoStore'   // ← 被测对象

let dir: string
let store: TodoStore

beforeEach(async () => {
  // 每个用例跑之前:准备一个全新的、互相隔离的环境
  dir = await mkdtemp(join(tmpdir(), 'focusdo-test-'))
  store = new TodoStore(join(dir, 'focusdo.sqlite'))
})

afterEach(async () => {
  // 每个用例跑之后:清理,避免污染下一个用例
  await rm(dir, { recursive: true, force: true })
})

describe('TodoStore — smoke test', () => {
  it('loads a fresh db with default settings and no tasks', async () => {
    const state = await store.load()
    expect(state.tasks).toEqual([])
    expect(state.settings.focusMinutes).toBe(25)
  })
})
```

你只需要认识 5 个词,就能看懂任何测试文件:

| 工具 | 作用 | 类比 |
|---|---|---|
| `describe(名字, fn)` | **分组**,把相关用例归到一起 | 文件夹 |
| `it(名字, fn)` | **一个用例**,fn 里就是测试内容 | 一道题 |
| `expect(x).toXxx(y)` | **断言**:声明你期望 x 是什么样 | 判分标准 |
| `beforeEach(fn)` | 每个用例**之前**自动跑一次 | 摆好考场 |
| `afterEach(fn)` | 每个用例**之后**自动跑一次 | 收拾考场 |

> `it` 也可以写成 `test`,完全一样,看个人习惯。

---

## 3. 测试的本质:没有魔法

`expect(x).toBe(y)` 看着像黑科技,其实约等于:

```js
function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new Error(`期望 ${expected},实际 ${actual}`)
    }
  }
}
```

**一个测试就是一段普通函数,用「不满足就抛异常」来表达期望。没抛错 = 通过,
抛错 = 失败。** Vitest 干的事就是:找到所有测试文件 → 逐个调用 `it` 的回调
(前后自动插 `beforeEach`/`afterEach`)→ 谁抛错就标红。

---

## 4. 写 `it` 的套路:AAA(准备-执行-断言)

几乎每个用例都是这三段,记住这个结构就不会卡壳:

```ts
it('描述这个用例在验证什么', () => {
  // Arrange 准备:把输入和被测对象准备好
  const a = 2

  // Act 执行:调用你要测的那个东西
  const result = a + 3

  // Assert 断言:验证结果符合期望
  expect(result).toBe(5)
})
```

> 在我们项目里,Arrange 那一步常常被 `beforeEach` 包办了(它已经建好 `store`),
> 所以很多用例体里只剩 Act + Assert。

**用例命名建议**:名字写成「输入/条件 → 期望结果」,比如
`'空白标题不创建任务，也不抛错'`。将来测试报红时,光看名字就知道哪条契约破了。

---

## 5. 三种最常用的写法(项目里都有真实例子)

### 5.1 测同步/异步的返回值

```ts
const state = await store.load()       // 异步:用 await 等结果
expect(state.tasks).toEqual([])        // 再断言
```
被测函数返回 Promise 时,`it` 的回调写成 `async`,用 `await` 拿到结果再断言。

### 5.2 测「应该抛错」——`rejects.toThrow`

```ts
await expect(
  store.updateTask({ id, title: '   ' })   // ← 把「会失败的调用」整个塞进 expect
).rejects.toThrow('标题不能为空')           //   断言它会 reject,且错误信息含这句
```
三个易错点:
1. **不要先 `await` 那个调用**,否则错误会在到达 `expect` 之前就炸出来,测试直接挂掉。要把调用本身交给 `expect`。
2. `.rejects` = 「我期望这个 Promise 被拒绝」。(同步函数抛错则用 `.toThrow()`,不带 `rejects`。)
3. `toThrow('子串')` 顺便验证「抛的是不是对的错」,比只断言「抛了个错」更严谨。

### 5.3 测「不该发生」——断言副作用没出现

有些拒绝是**静默**的(不抛错,只是什么都不做),这时反过来断言「东西没被创建」:

```ts
const state = await store.createTask({ title: '   ' })
expect(state.tasks).toEqual([])   // 验证任务没被建出来
```

### 5.4 故意越过类型检查:`@ts-expect-error`

当你要测**运行时校验**(防的是绕过编译期的脏数据),需要故意传一个 TS 不允许的值:

```ts
// @ts-expect-error 故意传一个不在 Priority 联合类型里的值
await expect(store.updateTask({ id, priority: 'urgent' })).rejects.toThrow('priority')
```
`@ts-expect-error` 会压住**下一行**的类型报错。额外好处:如果哪天那行不再有
类型错误了,`tsc` 会报「unused directive」提醒你删掉——所以它不会被滥用。

---

## 6. 常用断言速查(matcher)

| 写法 | 含义 |
|---|---|
| `toBe(y)` | 严格相等 `===`,用于数字/字符串/布尔 |
| `toEqual(y)` | **深度**相等,用于对象/数组(逐字段比较) |
| `toHaveLength(n)` | 数组或字符串的长度 |
| `toContain(x)` | 数组含某元素 / 字符串含子串 |
| `toBeNull()` / `toBeUndefined()` | 是不是 null / undefined |
| `toBeTruthy()` / `toBeFalsy()` | 真值 / 假值 |
| `toBeGreaterThan(n)` / `toBeLessThan(n)` | 数值比较 |
| `await expect(p).rejects.toThrow(msg)` | 异步调用会抛错(同步用 `expect(fn).toThrow`) |
| `expect(x).not.toBe(y)` | 任何断言前加 `.not` 取反 |

> `toBe` vs `toEqual` 是新手最常踩的:`{a:1}` 和 `{a:1}` 用 `toBe` 会失败
> (两个不同对象,引用不等),要用 `toEqual`。基本类型两个都行。

---

## 7. 进阶:控制时间(后面测「崩溃恢复」会用到)

`todoStore` 里有依赖当前时间的逻辑(比如判断一个中断的专注是否已经「太旧」)。
测这种逻辑不能靠真实时间,要用**假时钟**冻结时间:

```ts
import { vi } from 'vitest'

it('超过 4 小时的中断专注会被判为过期', async () => {
  vi.useFakeTimers()                              // 接管时间
  vi.setSystemTime(new Date('2026-06-02T10:00:00Z'))  // 把「现在」钉死

  // ...制造一个 5 小时前开始的专注快照...

  vi.useRealTimers()                              // 用完一定要还原
})
```
这样测试结果就和「你哪天跑它」无关,稳定可复现。`vi` 还能 mock 函数、模块
(`vi.fn()`、`vi.mock()`),等真用到再展开。

---

## 8. 一页纸记住

```
配置(抄一遍就行,别背):
  vitest.config.ts  → environment + include,几行而已
  package.json      → test / test:watch 两条命令

写测试(要练的肌肉):
  describe / it     → 组织
  beforeEach/After  → 准备 / 清理(保证用例互相隔离)
  expect(...).toXxx → 断言
  AAA 结构          → 准备 → 执行 → 断言
  三种场景:
    返回值      → await 后 toEqual / toBe
    该抛错      → rejects.toThrow(消息)
    不该发生    → 断言副作用没出现
```

**记住那句话**:前端配置多,是因为工具多、各管一段;但每个工具的配置都是
一次性的,抄好了基本不动。别让配置的噪音盖过你真正该练的东西——**写测试本身,
其实就只有这一页纸。**

---

## 附录 A:`async` / `await` 速记

> 这不是 Vitest 的东西,是 JavaScript 语言基础。但测试代码里几乎每个用例都用到
> 它(因为 `todoStore` 的方法都要读写磁盘、天生异步),所以单独记一页。

### A.1 `async` 是什么

`async` 放在函数前面,把它变成**异步函数**,带来两个效果:

```ts
async () => { ... }
```

1. **函数体内可以用 `await`**;
2. **函数的返回值自动变成一个 Promise**(一个「将来才会有结果的值」)。

`await` 是配套的:意思是「**等这个 Promise 出结果,再往下走**」,让异步代码读起来
像同步一样从上到下。

### A.2 为什么测试里到处是 `async`

因为 `store` 的方法都是异步的(返回 Promise),必须 `await` 才能拿到真正的数据:

```ts
const state = await store.load()   // ✅ await 后 state 是数据
expect(state.tasks).toEqual([])

const bad = store.load()           // ❌ 不 await,bad 是 Promise,没有 .tasks
```

既然用例体里要用 `await`,这个用例函数本身就得标 `async`——这就是
`it('...', async () => {...})` 里那个 `async` 的来历。**两者几乎总是成对出现:
碰了异步就 `await`,用了 `await` 回调就 `async`。**

### A.3 关键坑:忘了会「假通过」

`it` 的回调是 `async` 时返回 Promise,**Vitest 会 `await` 它,等里面的异步断言
真的跑完才判定结果**。忘了 `async`/`await` 会出一个很隐蔽的绿色假象:

```ts
// ❌ 回调不是 async、调用也没 await → Vitest 不知道要等 → 瞬间报“通过”(哪怕断言其实失败)
it('空标题应被拒绝', () => {
  expect(store.createTask({ title: '' })).rejects.toThrow()
})

// ✅ async + await,Vitest 才会真的等断言跑完
it('空标题应被拒绝', async () => {
  await expect(store.createTask({ title: '' })).rejects.toThrow()
})
```

### A.4 只有 `async` 函数里才能用 `await` 吗?

**基本是,但有一个例外。** `await` 要么待在 `async` 函数里,要么待在
**ES Module 的顶层**(叫 top-level await,ES2022 引入)。我们项目是 ESM
(`package.json` 有 `"type": "module"`),所以两种写法都合法:

```ts
// 形态 A —— 包在 async 函数里(测试文件就是这种)
it('...', async () => {
  await store.load()
})
```

```js
// 形态 B —— 直接写在模块顶层(scripts/compress-assets.mjs 真实代码,全程没有一个 async)
await mkdir(OUT, { recursive: true })          // 第30行,顶层
for (const t of tasks) {
  const info = await pipeline.toFile(outPath)  // 第50行,for 也在顶层作用域
}
```

能 / 不能直接用 `await` 的地方:

| 场景 | 能否直接用 await |
|---|---|
| `async` 函数体内 | ✅ |
| ES Module 顶层(我们项目) | ✅ top-level await |
| 普通(非 async)函数体内 | ❌ 语法报错 |
| CommonJS 模块(`require`/`module.exports`)顶层 | ❌ |
| 老式 `<script>`(非 `type="module"`)顶层 | ❌ |

> 细节:顶层 await 会让**整个模块的加载**暂停到 Promise 完成(所以
> `compress-assets.mjs` 是串行地「建好目录→逐张压缩」);而 `async` 函数里的
> await 只暂停**那个函数**,不挡别人。

### A.5 一句话记忆

> `await` 要么在 **`async` 函数**里,要么在 **ES Module 顶层**。测试里:碰异步就
> `await`,用 `await` 回调就 `async`——成对出现,忘一个就可能「假通过」。
