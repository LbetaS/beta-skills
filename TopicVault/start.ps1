param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendRoot = Join-Path $ProjectRoot "backend"
$RunRoot = Join-Path $ProjectRoot ".run"
$LogRoot = Join-Path $RunRoot "logs"

function Write-Step([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Wait-ForUrl([string]$Url, [int]$Seconds = 30) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 600
    }
  }
  return $false
}

Set-Location $ProjectRoot
New-Item -ItemType Directory -Force -Path $RunRoot, $LogRoot | Out-Null

$envFile = Join-Path $BackendRoot ".env"
$envExample = Join-Path $BackendRoot ".env.example"
if (-not (Test-Path $envFile)) {
  Copy-Item -LiteralPath $envExample -Destination $envFile
  Write-Host ""
  Write-Host "已创建 backend/.env，请先填写自己的 API Key，然后重新运行 start.ps1。" -ForegroundColor Yellow
  Write-Host "不要把 backend/.env 上传到 GitHub。" -ForegroundColor Yellow
  exit 1
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  throw "未找到 Node.js。请安装 Node.js 22 LTS 后重新运行。"
}

$venvPython = Join-Path $BackendRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
  Write-Step "创建 Python 虚拟环境"
  $pyCommand = Get-Command py -ErrorAction SilentlyContinue
  if ($pyCommand) {
    & $pyCommand.Source -3 -m venv (Join-Path $BackendRoot ".venv")
  } else {
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCommand) {
      throw "未找到 Python。请安装 Python 3.11 或 3.12 后重新运行。"
    }
    & $pythonCommand.Source -m venv (Join-Path $BackendRoot ".venv")
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Python 虚拟环境创建失败。"
  }

  Write-Step "安装后端依赖"
  & $venvPython -m pip install -r (Join-Path $BackendRoot "requirements.txt")
  if ($LASTEXITCODE -ne 0) {
    throw "后端依赖安装失败，请检查网络后重试。"
  }
}

if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
  $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $npmCommand) {
    $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
  }
  if (-not $npmCommand) {
    throw "未找到 npm。请重新安装 Node.js 22 LTS 后再试。"
  }
  Write-Step "安装前端依赖"
  & $npmCommand.Source install
  if ($LASTEXITCODE -ne 0) {
    throw "前端依赖安装失败，请检查网络后重试。"
  }
}

Write-Step "检查 API 配置"
& $venvPython (Join-Path $BackendRoot "config_check.py")
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$stopScript = Join-Path $ProjectRoot "stop.ps1"
if (Test-Path $stopScript) {
  & $stopScript -Quiet
}

Write-Step "启动后端服务"
$backendProcess = Start-Process `
  -FilePath $venvPython `
  -ArgumentList @("-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8000") `
  -WorkingDirectory $BackendRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $LogRoot "backend.out.log") `
  -RedirectStandardError (Join-Path $LogRoot "backend.err.log") `
  -PassThru
Set-Content -LiteralPath (Join-Path $RunRoot "backend.pid") -Value $backendProcess.Id

Write-Step "启动前端服务"
$viteEntry = Join-Path $ProjectRoot "node_modules\vite\bin\vite.js"
$frontendProcess = Start-Process `
  -FilePath $nodeCommand.Source `
  -ArgumentList @($viteEntry, "--host", "127.0.0.1", "--port", "5173") `
  -WorkingDirectory $ProjectRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $LogRoot "frontend.out.log") `
  -RedirectStandardError (Join-Path $LogRoot "frontend.err.log") `
  -PassThru
Set-Content -LiteralPath (Join-Path $RunRoot "frontend.pid") -Value $frontendProcess.Id

$backendReady = Wait-ForUrl "http://127.0.0.1:8000/" 30
$frontendReady = Wait-ForUrl "http://127.0.0.1:5173/" 30
if (-not $backendReady -or -not $frontendReady) {
  Write-Host "服务启动失败，请查看 .run/logs/ 中的日志。" -ForegroundColor Red
  & $stopScript -Quiet
  exit 1
}

Write-Host ""
Write-Host "启动成功" -ForegroundColor Green
Write-Host "前端：http://127.0.0.1:5173/"
Write-Host "后端：http://127.0.0.1:8000/"
Write-Host "停止服务：右键使用 PowerShell 运行 stop.ps1"

if (-not $NoBrowser) {
  Start-Process "http://127.0.0.1:5173/"
}
