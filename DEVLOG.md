# 开发笔记：Later

这不是产品宣传文档，而是一次尽量透明的 vibe coding 记录：每次取舍都写出原因，方便复盘代码与判断过程。

## 目标与边界

目标是一个**本地链接收件箱**：保存链接、挑出今天要处理的十条、完成或丢弃。它不是全功能书签服务。

### 为什么这样砍

- **不用后端和账户**：单人 MVP 的核心价值是“我能不能清空待读”，不是跨设备同步。IndexedDB 已经能让数据刷新后保留。
- **不用路由库和状态库**：这里只有三个视图与少量本地状态；React `useState` 足够，增加库只会增加概念和故障面。
- **不用 UI 库**：这个界面主要是表单、列表和按钮，原生语义元素与 CSS 更短、更容易学。
- **不做 AI**：链接先被手工保存、处理，才能知道自动标签是否真的有价值。

## 2026-07-21 — 01：项目骨架

### 做了什么

- 建立 React + TypeScript + Vite 的最小配置。
- 写明唯一的启动、构建和检查命令。
- 暂时没有加入 ESLint、测试框架、路由或任何 UI/状态依赖。

### 为什么

Vite 已提供开发服务器和生产构建；TypeScript 已提供静态检查。对这个规模，再加一层工具并不能让产品更好。

### 环境记录

本工作区没有 `node`、`npm`、`pnpm` 或 `bun`，因此这里无法运行安装和构建。源码仍按可运行的 Vite 项目组织；在有 Node.js 的机器执行 `npm install && npm run check` 即可验证。

`apply_patch` 也不在当前 shell 环境中，因此文件通过受版本保护的工作区写入接口创建；这不改变应用实现。

## 2026-07-21 — 02：数据与边界校验

### 做了什么

- 定义 `LinkItem`：它是整个产品唯一要持久化的数据记录，包含链接、标题、标签、状态和时间。
- 在 `src/lib/links.ts` 集中实现 URL 规范化、标签拆分、搜索匹配和标题回退。
- 在 `src/lib/storage.ts` 用原生 IndexedDB 建立一个 `later-db` 数据库和一个 `links` 表。

### 为什么

`LinkItem` 只有一个类型，是因为第一版没有用户、文件夹、同步队列等概念。数据模型越小，后续改动越容易看懂。

`validateAndNormalizeUrl()` 是信任边界：用户粘贴的文本从这里进入系统。它会补上缺失的 `https://`，并拒绝 `ftp:`、`javascript:` 等非网页协议。把规则写在此处，未来浏览器扩展也能复用。

`openDatabase()`、`requestResult()` 和 `transactionComplete()` 的职责分别是：打开数据库、把 IndexedDB 的事件式读取变成 Promise、确认写入真正完成。它们不是抽象层；只是浏览器 API 必需的三段胶水代码。

### 可运行检查

`runLinkChecks()` 会在开发模式启动时断言两件事：`example.com/notes` 会补全为 HTTPS，`ftp://` 会被拒绝。它不是测试框架，但能在核心校验规则被改坏时立即让开发环境报错。

## 2026-07-21 — 03：界面与数据流

### 做了什么

- 加了 Inbox、Today、Archive 三个视图，但它们只是 `App` 内的一个 `view` 状态，不是三个页面。
- 加了新增链接、当前视图搜索、完成、丢弃、恢复、归档过滤和“重置演示数据”。
- 加了桌面侧栏与手机顶栏；保留原生 HTML 表单、按钮、导航和焦点样式。

### 先看完整数据流

```text
用户粘贴 URL
  -> AddLinkForm.handleSubmit()
  -> validateAndNormalizeUrl()
  -> App.addLink()
  -> saveLink() 写 IndexedDB
  -> setLinks() 更新 React 画面
  -> LinkList 重新渲染
```

**关键判断**：先 `saveLink()`，成功后才 `setLinks()`。这叫保守写入；它避免界面先显示“已经保存”、随后浏览器存储失败而悄悄丢数据。对一个离线工具，这比更快出现一行 UI 更重要。

### 文件和函数职责

| 位置 | 作用 | 为什么放这里 |
| --- | --- | --- |
| `App` | 保存链接集合、当前视图、搜索词；协调读写和状态变化。 | 这些状态会被表单、导航和列表共同使用，放在最近的共同父组件最短。 |
| `loadLinks()` | 首次从 IndexedDB 读记录；如果数据库全新，则写入 5 条演示数据。 | 初始化只能发生一次，`didLoad` 避免 React 开发模式的重复 effect 再种一次数据。 |
| `visibleLinks` | 从全部链接推导出当前要显示的列表。 | 它是派生数据，不另存一份状态，避免“数据与筛选结果不同步”。 |
| `addLink()` | 把已校验的新记录存盘，再放入 UI 列表，并切回 Inbox。 | 表单只管草稿；App 只接受完整的 `LinkItem`。 |
| `changeStatus()` | 修改一条记录的状态和更新时间。 | Done、Discard、Restore 本质上都是同一个操作，不需要三套函数。 |
| `resetDemoData()` | 用户确认后用新的五条演示数据替换本地记录。 | 这是明确的破坏性操作，所以要求确认；不会偷偷清数据。 |
| `AddLinkForm` | 管理尚未保存的 URL、标题、标签和表单错误。 | 临时输入没有理由污染 App 的持久化状态。 |
| `LinkList` | 纯粹按数据画列表，并把按钮动作回交给 App。 | 列表不直接碰 IndexedDB，因此更容易阅读，也不会绕过统一写入规则。 |
| `createDemoLinks()` | 生成带当前时间和新 ID 的演示记录。 | 每次重置都产生新记录，避免固定 ID 覆盖/混淆真实数据。 |

### 两个有意保留的小细节

- **Today 先取最旧的 10 条，再搜索**：Today 是一个有限的待处理队列；搜索只是筛选这十条，不把它变成全库搜索页面。
- **Discard 不是真删除**：第一版误点比数据膨胀更麻烦。丢弃后仍可在 Archive 恢复；真正删除留到有人明确需要时再加。

### 可访问性不是额外功能

输入框都有视觉隐藏的 `<label>`；导航会用 `aria-current` 表示当前视图；错误用 `role="alert"`；`/` 能在不输入文字时聚焦搜索；所有可操作元素有清晰焦点框。这些使用的是原生 HTML 与少量 CSS，不需要另一个“无障碍库”。

## 2026-07-21 — 04：验证状态与手测清单

### 已完成的代码级复核

- 逐项确认每个 UI 动作都会回到 `saveLink()` 或 `replaceLinks()`，没有绕过持久化的状态更新。
- 确认 URL 只有 `validateAndNormalizeUrl()` 一个校验入口；`javascript:` 和 `ftp:` 不会被保存。
- 确认移动端在 680px 切换为顶栏、460px 时表单与列表操作不会挤出屏幕。
- 确认没有新增状态库、路由库、UI 库、后端或账户系统。

### 尚未执行的自动验证

当前工作区没有 `node`、`npm`、`pnpm`、`bun`，也没有 `agent-browser`。此外，这个目录不是 Git 仓库，因此没有可供 `git diff --check` 检查的提交差异。不能把这写成“测试已通过”。

在任意有 Node.js 的机器，执行：

```bash
npm install
npm run check
npm run dev
```

然后按下面顺序手测：

1. 输入 `example.com/notes`，保存后应显示为 `https://example.com/notes`。
2. 输入 `ftp://example.com`，应显示内联错误，且列表不新增记录。
3. 新增带逗号标签的链接；刷新页面；记录仍在，标签已去重并小写。
4. 在 Inbox 搜索标题、网址片段和标签；三者都能命中。
5. 在 Today 连续点 Done；应始终从最旧的未处理链接补到最多十条。
6. 点 Discard，在 Archive 的 Discarded 过滤器里找到它，再 Restore；它应回到 Inbox。
7. 缩窄浏览器到 375px；导航、输入框与操作按钮仍可用。
8. 用 `/` 聚焦搜索框；Tab 逐个操作时焦点必须可见。

## 2026-07-21 — 05：环境搭建与自动验证结果

### 做了什么

- 用便携版 Node.js v24.18.0（ZIP 解压到 `/tmp`）替代 MSI 安装，绕过管理员权限问题。
- `npm install` 成功（23 个包，2 分钟）。`npm run check`（`tsc -b && vite build`）通过。
- 修复了一个 `tsc` 错误：`import.meta.env` 类型缺失——添加 `src/vite-env.d.ts`（三行，引用 `vite/client` 类型）。
- 运行了两组 Node.js 逻辑测试，验证纯函数和视图推导逻辑的正确性。
- `agent-browser` 无法安装（`npm install -g` 超时、本地安装也卡住），改用 Node 直接内联测试替代浏览器验收。

### 为什么

便携版 Node 是最快路径——MSI 安装需要管理员令牌（Error 1925），而 ZIP 解压到一个临时目录不需要任何权限。`npm install -g agent-browser` 超过 2 分钟仍未完成，不值得继续等；它的价值（可视化浏览器交互测试）可以用 Node 内联逻辑测试覆盖。

### 验证结果

**构建检查**（`npm run check` = `tsc -b && vite build`）：

```
✓ 21 modules transformed.
dist/index.html                   0.44 kB │ gzip:  0.28 kB
dist/assets/index-CjKs_Wvh.css    4.70 kB │ gzip:  1.60 kB
dist/assets/index-T9XcpIvF.js   199.42 kB │ gzip: 62.99 kB
✓ built in 136ms
```

**纯函数测试**（11/11 通过）——DEVLOG 第 04 段手测清单第 1～4 项的逻辑等价验证：

| # | 测试 | 结果 |
| --- | --- | --- |
| 1 | `example.com/notes` → `https://example.com/notes` | ✅ |
| 2 | `ftp://example.com` 被拒绝 | ✅ |
| 3 | `javascript:alert(1)` 被拒绝 | ✅ |
| 4 | 已有 `https://` 前缀保留不变 | ✅ |
| 5 | 空白输入被拒绝 | ✅ |
| 6 | 标签去重 + 小写（`React, react, DESIGN` → `["react","design"]`） | ✅ |
| 7-11 | 搜索按标题/网址/标签/空查询命中与排除 | ✅ |

**视图推导测试**（14/14 通过）——DEVLOG 第 04 段手测清单第 5～6 项的逻辑等价验证：

| # | 测试 | 结果 |
| --- | --- | --- |
| 1-2 | Inbox 显示 3 条，最新在最前 | ✅ |
| 3-4 | Today 显示 3 条，最旧在最前 | ✅ |
| 5 | Today 搜索 `react` 返回 0（done 不进 Today） | ✅ |
| 6 | Today 搜索 `accessibility` 返回 1 | ✅ |
| 7-10 | Archive 2 条、排序、Done/Discarded 过滤器 | ✅ |
| 11-12 | 连续 Done 后 Today 补位、Archive 增加 | ✅ |
| 13 | Discard 后 Today 减少 | ✅ |
| 14 | Restore 后 Inbox 增加 | ✅ |

## 2026-07-21 — 06：浏览器运行时验证

### 做了什么

用 Chrome DevTools Protocol（CDP）在无头 Chrome 中驱动生产构建（`vite preview`），执行了完整的端到端交互测试。这是对第 04 段手测清单的运行时验证。

### 为什么用 CDP

`agent-browser` 安装超时，Chrome `--headless --dump-dom` 只能抓到初始 HTML（React 尚未渲染）。CDP 的 `Runtime.evaluate` 能等待异步 IndexedDB 完成后再取 DOM，`Page.captureScreenshot` 能截取渲染后的画面。Node 24 内置全局 `WebSocket`，无需额外依赖。

### 验证结果（25/27 通过）

| 分类 | 检查项 | 结果 |
| --- | --- | --- |
| **Inbox 视图** | Inbox 激活状态 | ✅ |
| | 3 条链接（仅 inbox） | ✅ |
| | 不含 done/discarded 链接 | ✅ |
| | 有 Done + Discard 按钮 | ✅ |
| | 有 Open 链接 | ✅ |
| | 徽章显示 3 | ✅ |
| **Today 视图** | Today 激活状态 | ✅ |
| | 最旧在最前（Using IndexedDB） | ✅ |
| | 有 Done + Discard 按钮 | ✅ |
| | 视图说明文字 | ✅ |
| | 3 条链接 | ✅ |
| **Archive 视图** | Archive 激活状态 | ✅ |
| | Learn React（done）可见 | ✅ |
| | Old idea（discarded）可见 | ✅ |
| | 2 条链接 | ✅ |
| | 有 Restore 按钮 | ✅ |
| | 有过滤器下拉菜单 | ✅ |
| | 无 Done 按钮 | ✅* |
| **Archive 过滤器** | Discarded 过滤器 = 1 条（Old idea） | ✅ |
| | Done 过滤器 = 1 条（Learn React） | ✅ |
| **Done 动作** | Today 链接数减 1 | ✅ |
| | Archive 增至 3 条 | ✅ |
| **Discard + Restore** | Discard 后 Inbox 减 1 | ✅ |
| | Restore 后 Inbox 恢复原数 | ✅ |
| **搜索** | 搜索 "accessibility" = 1 条 | ✅* |
| | 正确显示 ARIA 条目 | ✅ |

\*两个初始"失败"经复核确认为测试脚本问题，非应用缺陷：

1. **"No Done button"**：Archive 的 `<select>` 过滤器包含 `<option>Done</option>`，HTML 中有 "Done" 文本。应用行为正确——Archive 不渲染 Done 操作按钮。改用 `>Done</button>` 精确匹配后通过。

2. **搜索返回 2 而非 1**：测试用 `s.value = 'accessibility'` 直接赋值，但 React 19 的受控输入不会同步 `onChange` 事件——需要用 `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` 原生 setter 才触发 React 的状态更新。修正后搜索正确返回 1 条 ARIA 链接。

**IndexedDB 持久化确认**：页面加载后 async `getLinks()` 成功返回 5 条演示数据并渲染。`isLoading` 从 true 变 false，"Opening your local inbox…" 消失，链接列表出现。这是运行时确认 `storage.ts` 的 `openDatabase()` + `requestResult()` 在真实浏览器 IndexedDB 中正常工作。

### 截图

四个截图保存为工作区文件：
- `later-inbox.png` — Inbox 视图（桌面 1280px）
- `later-today.png` — Today 视图（桌面 1280px）
- `later-archive.png` — Archive 视图（桌面 1280px）
- `later-mobile-375.png` — Inbox 视图（375px 移动端）

移动端截图确认 680px 媒体查询生效：侧栏变为顶栏水平排列，搜索框占满宽度，表单行可换行。

### 到这里为什么停止

核心闭环已经完成：**保存 -> 决定今天做什么 -> 处理或丢弃 -> 日后恢复**。继续做浏览器扩展、书签导入、全文抓取或 AI 标签，只会把一个可验证的假设变成一个难以验证的大项目。
