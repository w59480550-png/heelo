#!/usr/bin/env node
/**
 * 美食之旅 · 本地启动服务器
 * 零依赖静态服务器：node server.js [端口]
 *
 * 用法：
 *   node server.js          # 默认 http://localhost:8080
 *   node server.js 3000     # 指定端口
 *   PORT=3000 node server.js
 *
 * 端口被占用时会自动尝试下一个端口（最多 10 次）。
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BASE_PORT = Number(process.env.PORT || process.argv[2] || 8080);
const MAX_TRIES = 10;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache'
  }, headers || {}));
  res.end(body);
}

function notFound(res) {
  send(res, 404, [
    '<!DOCTYPE html>',
    '<html lang="zh-CN"><head><meta charset="utf-8"><title>404 · 美食之旅</title>',
    '<style>body{font-family:system-ui,"PingFang SC","Microsoft YaHei",sans-serif;',
    'display:grid;place-items:center;min-height:100vh;margin:0;background:#fbf7f2;color:#1b1512}',
    'main{text-align:center}h1{font-size:3rem;margin:0 0 .5rem}p{color:#8b7d74}',
    'a{display:inline-block;margin-top:1rem;padding:.6rem 1.2rem;border-radius:999px;',
    'background:#e2542c;color:#fff;text-decoration:none}</style></head>',
    '<body><main><h1>🍳 404</h1><p>这个文件不存在，也许它被端走了。</p>',
    '<a href="/">回到首页</a></main></body></html>'
  ].join(''), { 'Content-Type': 'text/html; charset=utf-8' });
}

const server = http.createServer(function (req, res) {
  let pathname;

  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (err) {
    return send(res, 400, 'Bad Request');
  }

  // 目录请求补 index.html
  if (pathname === '' || pathname.endsWith('/')) pathname += 'index.html';

  const filePath = path.join(ROOT, path.normalize(pathname));

  // 防目录穿越：必须仍在项目根目录内
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, 'Forbidden');
  }

  fs.stat(filePath, function (err, stat) {
    if (err || !stat.isFile()) return notFound(res);

    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });

    if (req.method === 'HEAD') return res.end();

    fs.createReadStream(filePath)
      .on('error', function () {
        res.destroy();
      })
      .pipe(res);
  });
});

let port = BASE_PORT;
let tries = 0;

server.on('error', function (err) {
  if (err.code === 'EADDRINUSE' && tries < MAX_TRIES) {
    tries += 1;
    port += 1;
    console.log('端口 ' + (port - 1) + ' 被占用，尝试 ' + port + ' …');
    server.listen(port);
    return;
  }
  console.error('启动失败：' + err.message);
  process.exit(1);
});

server.on('listening', function () {
  console.log('');
  console.log('  🍜  美食之旅已启动');
  console.log('  ➜  本地访问: http://localhost:' + port);
  console.log('  ➜  按 Ctrl + C 停止');
  console.log('');
});

server.listen(port);
