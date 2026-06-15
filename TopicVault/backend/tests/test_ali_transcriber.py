from types import SimpleNamespace

import ali_transcriber
import openai_compatible_analyzer
from ali_transcriber import AliTranscriber


def test_transcriber_polls_async_task_and_downloads_text(monkeypatch):
    calls = {}
    fetch_responses = [
        {
            "status_code": 200,
            "output": {
                "task_status": "RUNNING",
                "task_metrics": {"TOTAL": 1, "SUCCEEDED": 0, "FAILED": 0},
            },
        },
        {
            "status_code": 200,
            "output": {
                "task_status": "SUCCEEDED",
                "results": [
                    {
                        "subtask_status": "SUCCEEDED",
                        "transcription_url": "https://example.com/result.json",
                    }
                ],
            },
        },
    ]

    class FakeTranscription:
        @staticmethod
        def async_call(**kwargs):
            calls["async_call"] = kwargs
            return SimpleNamespace(status_code=200, output=SimpleNamespace(task_id="task-001"))

        @staticmethod
        def fetch(task, **kwargs):
            calls.setdefault("fetch", []).append({"task": task, **kwargs})
            return fetch_responses.pop(0)

    class FakeTranscriptResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"transcripts": [{"text": "first paragraph"}, {"text": "second paragraph"}]}

    monkeypatch.setattr(ali_transcriber, "Transcription", FakeTranscription)
    monkeypatch.setattr(ali_transcriber.time, "sleep", lambda seconds: None)
    monkeypatch.setattr(
        ali_transcriber.requests,
        "get",
        lambda url, timeout, verify: FakeTranscriptResponse(),
    )

    progress_events = []
    text = AliTranscriber(api_key="ali-key").transcribe(
        "https://example.com/video.mp4",
        on_progress=lambda progress, message: progress_events.append((progress, message)),
        poll_interval=1,
    )

    assert text == "first paragraph\nsecond paragraph"
    assert calls["async_call"]["api_key"] == "ali-key"
    assert calls["async_call"]["model"] == "paraformer-v2"
    assert calls["async_call"]["file_urls"] == ["https://example.com/video.mp4"]
    assert calls["fetch"][0]["task"] == "task-001"
    assert progress_events


def test_transcriber_reports_failed_task_message(monkeypatch):
    class FakeTranscription:
        @staticmethod
        def async_call(**kwargs):
            return {"status_code": 200, "output": {"task_id": "task-002"}}

        @staticmethod
        def fetch(task, **kwargs):
            return {
                "status_code": 200,
                "output": {
                    "task_status": "FAILED",
                    "message": "DECODE_ERROR",
                    "results": [],
                },
            }

    monkeypatch.setattr(ali_transcriber, "Transcription", FakeTranscription)

    with pytest_raises_runtime("DECODE_ERROR"):
        AliTranscriber(api_key="ali-key").transcribe("https://example.com/bad.mp4")


def test_transcriber_loads_ali_key_from_env_file(monkeypatch, tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text("ALI_BAILIAN_API_KEY=ali-key-from-env-file\n", encoding="utf-8")

    monkeypatch.delenv("ALI_BAILIAN_API_KEY", raising=False)
    monkeypatch.delenv("DASHSCOPE_API_KEY", raising=False)
    monkeypatch.setattr(openai_compatible_analyzer, "ENV_FILE_CANDIDATES", [env_file])

    transcriber = AliTranscriber()

    assert transcriber.api_key == "ali-key-from-env-file"


def test_transcriber_retries_transient_ssl_fetch_errors(monkeypatch):
    calls = {"fetch_count": 0}

    class FakeTranscription:
        @staticmethod
        def async_call(**kwargs):
            return {"status_code": 200, "output": {"task_id": "task-retry"}}

        @staticmethod
        def fetch(task, **kwargs):
            calls["fetch_count"] += 1
            if calls["fetch_count"] == 1:
                raise ali_transcriber.requests.exceptions.SSLError("SSL EOF")
            return {
                "status_code": 200,
                "output": {
                    "task_status": "SUCCEEDED",
                    "results": [
                        {
                            "subtask_status": "SUCCEEDED",
                            "transcription_url": "https://example.com/result.json",
                        }
                    ],
                },
            }

    class FakeTranscriptResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"transcripts": [{"text": "retry succeeded"}]}

    monkeypatch.setattr(ali_transcriber, "Transcription", FakeTranscription)
    monkeypatch.setattr(ali_transcriber.time, "sleep", lambda seconds: None)
    monkeypatch.setattr(
        ali_transcriber.requests,
        "get",
        lambda url, timeout, verify: FakeTranscriptResponse(),
    )

    progress_events = []
    text = AliTranscriber(api_key="ali-key").transcribe(
        "https://example.com/video.mp4",
        on_progress=lambda progress, message: progress_events.append((progress, message)),
        poll_interval=1,
    )

    assert text == "retry succeeded"
    assert calls["fetch_count"] == 2
    assert any("网络连接不稳定" in message for _, message in progress_events)


def test_transcriber_times_out_when_ali_task_keeps_running(monkeypatch):
    class FakeTranscription:
        @staticmethod
        def async_call(**kwargs):
            return {"status_code": 200, "output": {"task_id": "task-timeout"}}

        @staticmethod
        def fetch(task, **kwargs):
            return {
                "status_code": 200,
                "output": {
                    "task_status": "RUNNING",
                    "task_metrics": {"TOTAL": 1, "SUCCEEDED": 0, "FAILED": 0},
                },
            }

    monkeypatch.setattr(ali_transcriber, "Transcription", FakeTranscription)
    monkeypatch.setattr(ali_transcriber.time, "sleep", lambda seconds: None)
    times = iter([0, 31])
    monkeypatch.setattr(ali_transcriber.time, "monotonic", lambda: next(times))

    with pytest_raises_runtime("timeout"):
        AliTranscriber(api_key="ali-key").transcribe(
            "https://example.com/slow.mp4",
            poll_interval=1,
            max_wait_seconds=30,
        )


class pytest_raises_runtime:
    def __init__(self, expected: str):
        self.expected = expected

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        assert exc_type is RuntimeError
        assert self.expected in str(exc_value)
        return True
