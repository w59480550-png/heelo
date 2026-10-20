@echo off
chcp 65001 >nul
REM 美食之旅 · 一键启动（Windows）
REM 用法: 双击本文件，或 start.bat 8080
cd /d "%~dp0"
set PORT=%~1
if "%PORT%"=="" set PORT=8080

where node >nul 2>nul
if %errorlevel%==0 (
  node server.js %PORT%
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo 未检测到 Node.js，改用 Python 静态服务器
  python -m http.server %PORT%
  goto :eof
)

echo 未找到 Node.js 或 Python，正在直接打开 index.html ...
start "" index.html
