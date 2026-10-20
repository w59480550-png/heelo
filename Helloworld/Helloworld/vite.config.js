import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url));

// 站点是纯静态多页面，每个 .html 都是一个独立入口
const pages = [
  'index',
  'categories',
  'featured',
  'about',
  'detail-1',
  'detail-2',
  'detail-3',
  'detail-4',
];

export default defineConfig({
  // 源码目录直接作为站点根目录，index.html 位于 src/ 下
  root: resolvePath('./src'),
  base: './',
  server: {
    host: true, // 同时监听 0.0.0.0，方便容器/端口转发访问
    port: 5173,
    strictPort: false,
    open: false,
  },
  preview: {
    host: true,
    port: 5174,
  },
  build: {
    outDir: resolvePath('./dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [page, resolvePath(`./src/${page}.html`)])
      ),
    },
  },
});
