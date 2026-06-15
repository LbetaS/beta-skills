# AI 选题素材库

一个用于收集、提取和整理短视频选题的本地 AI 工作台。

你可以粘贴抖音视频链接，系统会依次完成：

1. 获取作品信息和可转写的视频地址。
2. 提取视频中的语音文案。
3. 使用大模型按自定义提示词拆解内容。
4. 将标题、原文案、摘要、结构、标签和个人备注保存到本地素材库。

> 这是本地自部署工具。第三方 API Key、素材数据和个人备注由使用者自己管理。

## 功能

- 抖音视频链接解析
- 视频语音转文字
- 自定义提示词拆解
- 原文案、结构和参考点查看
- 素材搜索和筛选
- 工具与标签自由编辑
- 收藏原因和选题灵感备注
- 浏览器本地保存
- Windows 一键启动和停止

## 技术架构

```text
抖音链接
  ↓
TikHub 获取作品信息和视频直链
  ↓
阿里百炼 Paraformer 转写
  ↓
兼容 OpenAI 格式的大模型分析
  ↓
React 前端展示并保存到 localStorage
```

前端：React、Vite、TypeScript、Tailwind CSS

后端：FastAPI、Python

第三方服务：TikHub、阿里百炼、兼容 OpenAI Chat Completions 的模型服务

## 使用前准备

需要安装：

- Windows 10 或 Windows 11
- [Node.js 22 LTS](https://nodejs.org/)
- Python 3.11 或 Python 3.12

还需要准备自己的：

- TikHub API Key
- 阿里百炼 API Key
- 大模型 API Key、Base URL 和模型名

这些服务可能收费。请在各平台确认价格、余额和接口权限。

## Windows 快速启动

### 第一步：下载项目

可以下载 GitHub 仓库的 ZIP 并解压，也可以使用 Git：

```powershell
git clone 你的仓库地址
cd 项目目录
```

### 第二步：配置密钥

复制配置模板：

```powershell
Copy-Item backend\.env.example backend\.env
```

使用记事本打开 `backend/.env`，填写自己的配置：

```env
TIKHUB_API_KEY=你的 TikHub API Key
ALI_BAILIAN_API_KEY=你的阿里百炼 API Key
LLM_API_KEY=你的大模型 API Key
LLM_BASE_URL=https://你的服务商地址/v1
LLM_MODEL=服务商实际支持的模型名
```

不要照抄示例模型名。模型名必须和服务商控制台显示的名称完全一致。

### 第三步：启动

在项目目录打开 PowerShell：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start.ps1
```

首次启动会安装依赖，需要等待几分钟。

成功标志：

- PowerShell 显示“启动成功”
- 浏览器打开 `http://127.0.0.1:5173/`
- `http://127.0.0.1:8000/` 返回后端状态

### 停止服务

```powershell
.\stop.ps1
```

运行日志保存在 `.run/logs/`。

## 手动启动

### 后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe config_check.py
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

### 前端

另开一个终端：

```powershell
npm install
npm run dev
```

前端默认连接 `http://127.0.0.1:8000`。如需使用其他后端地址，复制根目录 `.env.example` 为 `.env`，修改：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 数据保存

素材数据目前保存在浏览器 `localStorage` 中：

- 不会自动上传到云端
- 清除浏览器网站数据会删除素材
- 更换浏览器或电脑不会自动同步

重要素材请保留原始链接。后续版本可增加导入和导出功能。

## 常见问题

### Failed to fetch

通常是后端没有启动。检查：

1. 浏览器能否打开 `http://127.0.0.1:8000/`
2. `.run/logs/backend.err.log` 是否有报错
3. 8000 端口是否被其他程序占用

### 未配置 TIKHUB_API_KEY

确认已经创建 `backend/.env`，并填写了 TikHub Key。

### TikHub 400、401、402 或 403

- `400`：链接、作品 ID 或接口参数异常
- `401/403`：API Key 无效或没有接口权限
- `402`：余额或套餐不足

### 阿里百炼 FILE_DOWNLOAD_FAILED

阿里百炼无法下载 TikHub 返回的视频地址。可能是视频地址过期、平台限制或临时网络问题，请重新提交或更换作品。

### No available channel for model

模型名不在当前中转服务套餐中。请到服务商控制台复制实际可用的模型名，并更新 `LLM_MODEL`。

### SSL UNEXPECTED_EOF_WHILE_READING

第三方服务或本地网络中断了 HTTPS 连接。后端会自动重试，持续失败时请检查代理、网络和服务商状态。

## 开发和测试

前端测试：

```powershell
npm test
```

前端构建：

```powershell
npm run build
```

后端测试：

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests
```

## 安全说明

- 不要把 `backend/.env` 上传到 GitHub
- 不要在 Issue、截图或聊天记录中公开 API Key
- 如果 Key 曾经公开，请立即在服务商后台撤销并重新生成
- 本项目不会提供或共享任何第三方平台密钥

详细说明见 [SECURITY.md](SECURITY.md)。

## 项目限制

- 当前主要支持抖音作品链接和视频直链
- 平台接口可能变化，无法保证长期稳定
- 转写和分析质量取决于第三方服务
- 本项目与抖音、TikHub、阿里云及模型服务商无官方关联

## 参与贡献

欢迎提交问题和改进，具体流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 开源许可

[MIT License](LICENSE)
