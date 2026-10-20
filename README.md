# 美食之旅 · Foodie Journal 🍜

一个**零依赖、可离线运行**的中文菜谱单页应用：12 道经典菜品、9 个菜系分类、全文搜索、收藏与评分（本地存储）、明暗主题与响应式布局。

> 纯 HTML + CSS + 原生 JavaScript，没有构建步骤、没有 npm 依赖、没有外链图片，双击 `index.html` 就能用。

---

## 快速开始

### macOS / Linux

```bash
./start.sh              # 默认 http://localhost:8080
./start.sh 3000         # 指定端口

# 或直接用自带服务器
node server.js
PORT=3000 node server.js
```

### Windows

```bat
:: CMD（或直接双击 start.bat）
start.bat
start.bat 3000
```

```powershell
# PowerShell：当前目录的可执行文件必须加 .\ 前缀
.\start.bat 3000
.\start.ps1 3000
```

### 任何系统：零依赖静态服务器

```bash
python3 -m http.server 8080     # 有 Python 就行
```

### 最省事：直接双击 index.html

hash 路由与 localStorage 都能用，无需任何服务器。

`server.js` 是一个 100 行的零依赖静态服务器：正确的 MIME 类型、`404` 友好页面、目录穿越防护、端口被占用时自动顺延端口。

也可以直接部署到 GitHub Pages / Vercel / Netlify 等任意静态托管，无需任何配置。


---

## 功能一览

| 模块 | 说明 |
| --- | --- |
| 🏠 首页 | Hero 首屏、数据概览、菜系磁贴、本周高分推荐 |
| 🧭 分类浏览 | 9 个菜系分类，胶囊筛选 + 结果计数 |
| 🔍 全文搜索 | 命中菜名、描述、食材、菜系与标签；支持 `#/search/<关键词>` 直接分享 |
| ↕️ 排序 | 评分 / 人气 / 用时 / 难度，选择结果记入 localStorage |
| 📖 详情页 | 渐变主题头图、食材勾选清单、分步做法、小贴士、相关推荐 |
| ♥ 收藏 | 卡片右上角一键收藏，页头角标计数，独立收藏页 |
| ⭐ 评分评价 | 5 星评分 + 文字评论，按时间倒序展示 |
| 🌗 明暗主题 | 跟随系统 `prefers-color-scheme`，可手动切换并记忆 |
| 📱 响应式 | 1080 / 900 / 760 / 460 四档断点，手机端折叠菜单 |
| ⌨️ 快捷键 | `/` 或 `Ctrl/Cmd + K` 聚焦搜索，`Esc` 关闭菜单 |
| ♿ 可访问性 | 语义化标签、`aria-*` 状态、跳转链接、`prefers-reduced-motion` 降级、打印样式 |

---

## 目录结构

```
.
├── index.html          # 页面骨架：头部导航 / main / 页脚 / toast 容器
├── css/
│   └── styles.css      # 设计令牌 + 组件样式（明暗两套主题）
├── js/
│   ├── data.js         # 12 道菜谱数据与分类元数据
│   └── app.js          # hash 路由、渲染、搜索筛选、收藏评分、主题
├── server.js           # 零依赖本地启动服务器
├── start.sh            # macOS / Linux 一键启动
├── start.bat           # Windows 一键启动（CMD / 双击）
├── start.ps1           # Windows PowerShell 一键启动
└── README.md
```

### 数据格式（新增一道菜）

在 `js/data.js` 的 `DISHES` 数组中追加一个对象即可，页面会自动出现在列表、分类与搜索结果中：

```js
{
  id: 13,                       // 唯一数字 id，详情页路由为 #/dish/13
  name: '扬州炒饭',
  category: '苏菜',              // 必须存在于 CATEGORIES
  emoji: '🍚',
  gradient: ['#ffd97d', '#d98c2b'],  // 卡片 / 详情头图渐变
  tagline: '一句话卖点',
  description: '两句话介绍',
  rating: 4.5,
  reviews: 128,                 // 展示用的“多少人做过”
  minutes: 20,
  difficulty: '简单',            // 简单 | 中等 | 较难
  spice: 0,                     // 0-5
  servings: '2 人',
  tags: ['快手', '家常'],
  ingredients: ['米饭 400g', '鸡蛋 2 个'],
  steps: ['热锅下油…', '翻炒均匀…'],
  tip: '隔夜饭更松散。'
}
```

### 本地存储键

| Key | 内容 |
| --- | --- |
| `foodie:favorites` | 收藏的菜品 id 数组 |
| `foodie:reviews` | `{ [dishId]: [{ stars, comment, at }] }` |
| `foodie:theme` | `light` / `dark` |
| `foodie:sort` | 上次选择的排序方式 |

所有数据只存在浏览器本地，不上传任何服务器；清除站点数据即可重置。

---

## 本次重构修复了什么

原始版本 `Helloworld/Helloworld/src/` 下的代码无法运行，主要问题与处理方式：

| 原始问题 | 处理 |
| --- | --- |
| `script.js` 中 HTML 直接裸露在模板字符串外、引号不匹配、`herf=` 拼写错误 | 全部重写为可执行模板字符串，链接改为 hash 路由 |
| `foodDate` / `foos` / `food` 变量名不一致，`if(!food)` 逻辑写反 | 统一为 `DISHES` 数据源与 `getDish()` 查询，修正判空逻辑 |
| `document.querySelector('main')..innerHTML` 语法错误 | 重写渲染管线 `render()` |
| CSS 颜色缺少 `#`（`color: 333`、`background: f9f9f9`）、`padding: 1 rem` 带空格、`@media(...;)` 非法分号 | 全量重写样式表，并通过 `csstree-validator` 校验 |
| `index.html` 引用了不存在的 `js/main.js`、`categories.html`、`featured.html`、`about.html`、`images/*.jpg` | 改为单页 hash 路由，配图用「渐变 + emoji」生成，彻底消除 404 |
| 只有 1 条菜品数据，无搜索、无筛选、无收藏 | 扩充到 12 道菜 / 9 个菜系，补齐搜索、排序、收藏、评分、主题等能力 |

---

## 常见问题

**PowerShell 提示「无法将 start.bat 项识别为 cmdlet…」**

PowerShell 默认不搜索当前目录，必须加 `.\` 前缀：

```powershell
.\start.bat 3000
# 或
cmd /c start.bat 3000
# 或使用原生脚本
.\start.ps1 3000
```

**PowerShell 提示「因为在此系统上禁止运行脚本」**

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
# 或
Unblock-File .\start.ps1
```

**提示端口被占用**

换一个端口即可（`node server.js 3000`），脚本也会自动尝试下一个端口。

**双击 index.html 就能用吗？**

可以。本项目使用 hash 路由，不依赖服务端，图片也全部由 CSS 渐变生成，因此通过 `file://` 打开同样完整可用。

---

## 兼容性

Chrome / Edge / Firefox / Safari 最近两个大版本。使用了 `:has()`、`backdrop-filter`、CSS 自定义属性等现代特性；不支持 `IntersectionObserver` 的旧环境会自动跳过入场动画，功能不受影响。

## License

MIT
