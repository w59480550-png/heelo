#!/usr/bin/env bash
# 美食之旅 · 一键启动（macOS / Linux）
# 用法: ./start.sh [端口]
set -e

cd "$(dirname "$0")"
PORT="${1:-8080}"

if command -v node >/dev/null 2>&1; then
  exec node server.js "$PORT"
fi

if command -v python3 >/dev/null 2>&1; then
  echo "未检测到 Node.js，改用 Python 静态服务器"
  exec python3 -m http.server "$PORT"
fi

if command -v python >/dev/null 2>&1; then
  echo "未检测到 Node.js，改用 Python 静态服务器"
  exec python -m SimpleHTTPServer "$PORT"
fi

echo "未找到 Node.js 或 Python，请直接双击 index.html 打开（功能完全可用）。"
exit 1
