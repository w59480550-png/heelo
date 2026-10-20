# heelo

Repository for uploaded code

## 目录结构

```
Helloworld/Helloworld/
  package.json               # Vite 脚手架（dev / build / preview 脚本）
  vite.config.js             # root=src、多页面入口、端口 5173 / 5174
  src/                       # 站点源码根目录
    index.html               # 首页（横幅 + 本周热门推荐）
    categories.html          # 美食分类
    featured.html            # 本周推荐（按评分排序）
    about.html               # 关于我们
    detail-1.html ~ detail-4.html  # 美食详情页（食材、步骤、评分表单）
    styles.css               # 全站样式
    script.js                # 数据 + 路由 + 页面渲染（以 ES module 方式加载）
    public/images/           # 菜品图片（Vite publicDir，原样拷贝到产物根目录）
  dist/                      # vite build 产物（已 gitignore）
```

## 如何运行（Vite）

```bash
cd Helloworld/Helloworld
npm install        # 首次运行安装 vite

npm run dev        # 开发服务器，带 HMR，默认 http://localhost:5173/
npm run serve      # 同上，但监听 0.0.0.0（容器 / 端口转发场景）
npm run build      # 生产构建，输出到 Helloworld/Helloworld/dist
npm run preview    # 预览构建产物，默认 http://localhost:5174/
```

启动后直接用浏览器访问 `http://localhost:5173/index.html` 即可（访问 `/` 也会打开首页）。

> 说明：站点是纯静态多页面，所有页面都在 `vite.config.js` 的 `rollupOptions.input` 中登记，`npm run build` 才会把 8 个 HTML 全部产出。
> 页面里的 `<script type="module" src="script.js">` 让 Vite 能打包 / 热更新脚本；样式通过 `styles.css` 直接引用。

## 运行效果

截图见 `docs/screenshots/`：

| 页面 | 截图 |
| --- | --- |
| 修复前（原样运行） | ![修复前](docs/screenshots/01-before.png) |
| 首页 | ![首页](docs/screenshots/02-home.png) |
| 美食分类 | ![美食分类](docs/screenshots/03-categories.png) |
| 本周推荐 | ![本周推荐](docs/screenshots/04-featured.png) |
| 美食详情 | ![美食详情](docs/screenshots/05-detail.png) |
| 移动端首页 | ![移动端首页](docs/screenshots/06-home-mobile.png) |

## 已修复的问题（相对上传版本）

**HTML**
- `<script src="js/main.js">` 指向不存在的文件（实际脚本是 `script.js`）→ 改为 `script.js`，并加上 `type="module"` 以便 Vite 打包与热更新。
- 补齐导航里引用但缺失的页面：`categories.html`、`featured.html`、`about.html`、`detail-1~4.html`。

**JS (`script.js`)**
- 所有模板字符串缺少反引号 `` ` ``，`<section class = "banner" >` 等 HTML 直接写在 JS 里 → 语法错误，整个脚本无法执行。
- 模板字符串里的标签没有加引号（`<section`、`<h1>`、`<div>`、`<img>`、`<li>` 等）且用了 `</search>` 这种错误闭合标签。
- `const name = document.querySelector('main')` 声明了 `name` 却使用 `main`（未定义）→ 改为 `main`。
- `.map(...)` 拼接后 `join(")` 是非法字符串 → 改为 `join("")`。
- 数据变量名 `foodDate` 与 `foos` 不一致，`if(!food)` 判断写反（导致详情页永远不渲染）→ 统一为 `food`，并把“找不到”的分支改成真正的兜底提示。
- 卡片链接写成 `herf="detail-${id}.html"=class="read-more"` → 改为 `href` + `class`。
- 路由里调用了不存在的 `loadCategoriesPage()` → 补充实现（按分类分组渲染）；同时补充 `loadFeaturedPage()`。
- 原本只有 1 条菜品数据，`slice(0,3)` 只能生成 1 张卡片 → 补充到 4 条数据。

**CSS (`styles.css`)**
- 颜色漏写 `#`：`color: 333`、`background: f9f9f9`、`background: FF7F50`、`background: 8B4513` 等 → 全部补上 `#`。
- `padding: 1 rem 2 rem` 中间有空格，不是合法长度 → 改为 `1rem 2rem`。
- `@media(min-width: 768px;)` / `@media(max-width: 768px;)` 括号内多了分号 → 媒体查询失效，改为 `@media (min-width: 768px)`。
- 补上 JS 生成的 `banner` / `featured` / `page-title` / `category-section` / `food-category` / `food-rating` 以及详情页表单、页脚的样式。

**资源**
- 缺失 `images/hotpot.jpg` 等图片（原路径会 404）→ 新增 4 张 SVG 占位图，放到 `src/public/images/`（Vite 会原样拷贝到构建产物），后续替换成真实照片即可。

## 备注

- 详情页通过文件名路由（`detail-<id>.html`），新增菜品时需要同时新增对应 HTML，并在 `vite.config.js` 的 `rollupOptions.input` 里登记。
- 评分表单目前只做前端提示（`alert`），未接入后端存储。
