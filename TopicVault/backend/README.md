# 后端服务

FastAPI 后端负责处理视频链接、转写文案和调用大模型分析。

## 接口

```text
GET  /
POST /api/process-video
GET  /api/task-status/{task_id}
POST /api/analyze-script
GET  /api/tasks/active
```

## 配置

复制模板：

```powershell
Copy-Item .env.example .env
```

填写：

```env
TIKHUB_API_KEY=
ALI_BAILIAN_API_KEY=
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

运行配置检查：

```powershell
.\.venv\Scripts\python.exe config_check.py
```

配置检查只判断必需字段是否存在，不会验证余额、模型权限或第三方服务状态。

## 安装和启动

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

成功后访问：

```text
http://127.0.0.1:8000/
```

## 测试

安装开发依赖：

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

运行：

```powershell
.\.venv\Scripts\python.exe -m pytest tests
```
