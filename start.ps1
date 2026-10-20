# 美食之旅 · 一键启动（Windows PowerShell）
#
# 用法（注意 PowerShell 必须加 .\ 前缀）：
#   .\start.ps1
#   .\start.ps1 3000
#
# 若提示「禁止运行脚本」，二选一：
#   powershell -ExecutionPolicy Bypass -File .\start.ps1
#   或先执行： Unblock-File .\start.ps1

param(
    [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

if (Get-Command node -ErrorAction SilentlyContinue) {
    node server.js $Port
    exit $LASTEXITCODE
}

if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host '未检测到 Node.js，改用 Python 静态服务器'
    python -m http.server $Port
    exit $LASTEXITCODE
}

if (Get-Command py -ErrorAction SilentlyContinue) {
    Write-Host '未检测到 Node.js，改用 Python 静态服务器'
    py -m http.server $Port
    exit $LASTEXITCODE
}

Write-Host '未找到 Node.js 或 Python，正在直接打开 index.html …'
Start-Process (Join-Path $PSScriptRoot 'index.html')
