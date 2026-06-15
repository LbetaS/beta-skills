import threading
import uuid
from typing import Any

from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ali_transcriber import AliTranscriber
from douyin_resolver import DouyinResolver
from openai_compatible_analyzer import OpenAICompatibleScriptAnalyzer


app = FastAPI(title="AI Short Video Transcript API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tasks: dict[str, dict[str, Any]] = {}
tasks_lock = threading.Lock()
resolver = DouyinResolver()
transcriber = AliTranscriber()
analyzer = OpenAICompatibleScriptAnalyzer()


class AnalyzeScriptRequest(BaseModel):
    url: str
    transcript: str
    remark: str = ""
    summary: str = ""
    customSystemPrompt: str = ""


def _update_task(task_id: str, **updates: Any) -> None:
    with tasks_lock:
        tasks[task_id].update(updates)


def _run_transcription(task_id: str, input_url: str, summary_language: str) -> None:
    try:
        _update_task(task_id, status="processing", progress=15, message="正在解析视频直链...")
        video_metadata: dict[str, str] = {}
        try:
            video_metadata = resolver.fetch_video_metadata(input_url)
            if video_metadata:
                _update_task(task_id, video_metadata=video_metadata)
        except Exception as metadata_error:
            _update_task(task_id, video_metadata_error=str(metadata_error))

        media_url = resolver.resolve(input_url)

        _update_task(task_id, status="processing", progress=35, message="正在提交阿里百炼转写任务...")

        def report_ali_progress(progress: int, message: str) -> None:
            _update_task(task_id, status="processing", progress=progress, message=message)

        script = transcriber.transcribe(media_url, on_progress=report_ali_progress)

        preview = script[:160]
        summary = (
            f"已提取 {len(script)} 个字符的原始文案。\n\n{preview}"
            if summary_language == "zh"
            else f"Extracted transcript with {len(script)} characters.\n\n{preview}"
        )

        _update_task(
            task_id,
            status="completed",
            progress=100,
            message="文案提取完成",
            script=script,
            summary=summary,
            error=None,
            resolved_url=media_url,
            video_metadata=video_metadata,
        )
    except Exception as error:
        _update_task(
            task_id,
            status="error",
            progress=100,
            message=f"文案提取失败: {error}",
            error=str(error),
        )


@app.get("/")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "tikhub-ali-video-transcriber"}


@app.post("/api/process-video")
def process_video(
    url: str = Form(default=""),
    summary_language: str = Form(default="zh"),
) -> dict[str, str]:
    input_url = url.strip()
    if not input_url:
        raise HTTPException(status_code=400, detail="请输入抖音链接或视频直链")

    task_id = str(uuid.uuid4())
    with tasks_lock:
        tasks[task_id] = {
            "status": "processing",
            "progress": 5,
            "message": "任务已创建，准备提取文案...",
            "script": None,
            "summary": None,
            "error": None,
            "url": input_url,
            "video_metadata": None,
            "video_metadata_error": None,
        }

    worker = threading.Thread(
        target=_run_transcription,
        args=(task_id, input_url, summary_language),
        daemon=True,
    )
    worker.start()

    return {"task_id": task_id, "message": "任务已创建，正在处理中..."}


@app.get("/api/task-status/{task_id}")
def get_task_status(task_id: str) -> dict[str, Any]:
    with tasks_lock:
        task = tasks.get(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        return task.copy()


@app.post("/api/analyze-script")
def analyze_script(payload: AnalyzeScriptRequest) -> dict[str, Any]:
    input_url = payload.url.strip()
    transcript = payload.transcript.strip()
    if not input_url:
        raise HTTPException(status_code=400, detail="请输入视频链接")
    if not transcript:
        raise HTTPException(status_code=400, detail="文案为空，无法分析")

    try:
        material = analyzer.analyze(
            url=input_url,
            transcript=transcript,
            remark=payload.remark,
            summary=payload.summary,
            custom_system_prompt=payload.customSystemPrompt,
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    return {"material": material}


@app.get("/api/tasks/active")
def active_tasks() -> dict[str, Any]:
    with tasks_lock:
        active = [
            task_id
            for task_id, task in tasks.items()
            if task.get("status") == "processing"
        ]

    return {
        "active_tasks": len(active),
        "processing_urls": len(active),
        "task_ids": active,
    }
