param(
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RunRoot = Join-Path $ProjectRoot ".run"

function Stop-RecordedProcess(
  [string]$Name,
  [string]$ExpectedCommand
) {
  $pidFile = Join-Path $RunRoot "$Name.pid"
  if (-not (Test-Path $pidFile)) {
    return
  }

  $processId = 0
  if (-not [int]::TryParse((Get-Content -LiteralPath $pidFile -Raw).Trim(), [ref]$processId)) {
    Remove-Item -LiteralPath $pidFile -Force
    return
  }

  $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
  if ($processInfo -and $processInfo.CommandLine -like "*$ExpectedCommand*") {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    if (-not $Quiet) {
      Write-Host "已停止 $Name 服务。" -ForegroundColor Green
    }
  } elseif ($processInfo -and -not $Quiet) {
    Write-Host "PID $processId 已被其他程序使用，未执行停止操作。" -ForegroundColor Yellow
  }

  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

Stop-RecordedProcess "frontend" "vite"
Stop-RecordedProcess "backend" "uvicorn"

if (-not $Quiet) {
  Write-Host "项目服务已停止。"
}
