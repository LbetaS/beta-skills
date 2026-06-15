import os
import time
from collections.abc import Callable
from typing import Any

import dashscope
import requests
import urllib3
from dashscope.audio.asr import Transcription

from openai_compatible_analyzer import load_env_files


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ProgressCallback = Callable[[int, str], None]


class AliTranscriber:
    def __init__(self, api_key: str | None = None):
        load_env_files()
        self.api_key = (
            api_key
            or os.getenv("ALI_BAILIAN_API_KEY", "").strip()
            or os.getenv("DASHSCOPE_API_KEY", "").strip()
        )

    def _get(self, value: Any, key: str, default=None):
        if isinstance(value, dict):
            return value.get(key, default)
        return getattr(value, key, default)

    def _text_from_payload(self, payload: dict[str, Any]) -> str:
        transcripts = payload.get("transcripts") or []
        texts = [item.get("text", "").strip() for item in transcripts if item.get("text")]
        text = "\n".join(texts).strip()
        if not text:
            raise RuntimeError("阿里百炼转写结果为空")
        return text

    def _format_failed_message(self, status: str, message: str | None = None) -> str:
        detail = (message or "").strip()
        if detail:
            return f"阿里百炼转写任务未成功: {status}. {detail}"
        return f"阿里百炼转写任务未成功: {status}"

    def _fetch_until_finished(
        self,
        task_id: str,
        on_progress: ProgressCallback | None,
        poll_interval: int,
        max_wait_seconds: int,
    ) -> Any:
        started_at = time.monotonic()
        transient_failures = 0

        while True:
            try:
                result_response = Transcription.fetch(task=task_id, api_key=self.api_key)
                transient_failures = 0
            except requests.exceptions.RequestException as error:
                transient_failures += 1
                if transient_failures > 5:
                    raise RuntimeError(
                        "阿里百炼状态查询网络连接不稳定，已重试 5 次仍失败。请稍后重试。"
                    ) from error
                if on_progress:
                    on_progress(
                        45,
                        f"阿里百炼网络连接不稳定，正在自动重试第 {transient_failures} 次...",
                    )
                time.sleep(min(poll_interval * transient_failures, 10))
                continue

            status_code = self._get(result_response, "status_code")
            if status_code != 200:
                raise RuntimeError(self._get(result_response, "message") or "阿里百炼转写任务查询失败")

            output = self._get(result_response, "output", {}) or {}
            task_status = self._get(output, "task_status", "")
            if task_status in {"SUCCEEDED", "COMPLETED", "FAILED", "CANCELED", "UNKNOWN"}:
                return result_response

            elapsed = int(time.monotonic() - started_at)
            if elapsed >= max_wait_seconds:
                raise RuntimeError(
                    f"Ali transcription timeout after {max_wait_seconds} seconds. "
                    "阿里百炼任务仍在处理中，请稍后重试或换一个更短的视频。"
                )

            if on_progress:
                progress = min(90, 40 + int((elapsed / max_wait_seconds) * 45))
                on_progress(progress, f"阿里百炼转写处理中，已等待 {elapsed} 秒...")

            time.sleep(poll_interval)

    def transcribe(
        self,
        video_url: str,
        on_progress: ProgressCallback | None = None,
        poll_interval: int = 5,
        max_wait_seconds: int = 600,
    ) -> str:
        if not self.api_key:
            raise RuntimeError("未配置 ALI_BAILIAN_API_KEY 或 DASHSCOPE_API_KEY")

        dashscope.api_key = self.api_key
        task_response = Transcription.async_call(
            api_key=self.api_key,
            model="paraformer-v2",
            file_urls=[video_url],
            language_hints=["zh", "en"],
        )

        status_code = self._get(task_response, "status_code")
        if status_code != 200:
            raise RuntimeError(self._get(task_response, "message") or "阿里百炼转写任务提交失败")

        output = self._get(task_response, "output", {}) or {}
        task_id = self._get(output, "task_id")
        if not task_id:
            raise RuntimeError("阿里百炼未返回转写任务 ID")

        if on_progress:
            on_progress(40, "阿里百炼任务已创建，正在等待转写结果...")

        result_response = self._fetch_until_finished(
            task_id=task_id,
            on_progress=on_progress,
            poll_interval=poll_interval,
            max_wait_seconds=max_wait_seconds,
        )

        output = self._get(result_response, "output", {}) or {}
        task_status = self._get(output, "task_status", "")
        if task_status and task_status not in {"SUCCEEDED", "COMPLETED"}:
            raise RuntimeError(self._format_failed_message(task_status, self._get(output, "message")))

        results = self._get(output, "results", []) or []
        if not results:
            raise RuntimeError("阿里百炼未返回转写结果")

        first_result = results[0]
        subtask_status = self._get(first_result, "subtask_status", "")
        if subtask_status and subtask_status != "SUCCEEDED":
            raise RuntimeError(self._get(first_result, "message") or f"阿里百炼子任务失败: {subtask_status}")

        transcription_url = self._get(first_result, "transcription_url")
        if not transcription_url:
            raise RuntimeError("阿里百炼未返回转写结果地址")

        transcript_response = requests.get(transcription_url, timeout=60, verify=False)
        transcript_response.raise_for_status()
        return self._text_from_payload(transcript_response.json())
