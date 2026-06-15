import os
import time
from pathlib import Path
from typing import Any

import requests

from ali_analyzer import AliScriptAnalyzer


DEFAULT_OPENAI_COMPATIBLE_MODEL = "gpt-4o-mini"
BACKEND_ROOT = Path(__file__).resolve().parent
ENV_FILE_CANDIDATES = [BACKEND_ROOT / ".env", BACKEND_ROOT.parent / ".env"]


def load_env_files() -> None:
    for env_file in ENV_FILE_CANDIDATES:
        if not env_file.exists():
            continue
        for line in env_file.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            key = key.strip().lstrip("\ufeff")
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


class OpenAICompatibleScriptAnalyzer(AliScriptAnalyzer):
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout: int = 90,
        max_attempts: int = 3,
    ):
        load_env_files()
        super().__init__(api_key="placeholder", model=model)
        self.api_key = (
            api_key
            or os.getenv("LLM_API_KEY", "").strip()
            or os.getenv("OPENAI_API_KEY", "").strip()
        )
        self.base_url = (
            base_url
            if base_url is not None
            else os.getenv("LLM_BASE_URL", "").strip() or os.getenv("OPENAI_BASE_URL", "").strip()
        )
        self.model = (
            model
            or os.getenv("LLM_MODEL", "").strip()
            or os.getenv("OPENAI_MODEL", "").strip()
            or DEFAULT_OPENAI_COMPATIBLE_MODEL
        )
        self.timeout = timeout
        self.max_attempts = max_attempts

    def analyze(
        self,
        url: str,
        transcript: str,
        remark: str = "",
        summary: str = "",
        custom_system_prompt: str = "",
    ) -> dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("未配置 LLM_API_KEY 或 OPENAI_API_KEY")
        if not self.base_url:
            raise RuntimeError("未配置 LLM_BASE_URL 或 OPENAI_BASE_URL")

        clean_transcript = transcript.strip()
        if not clean_transcript:
            raise RuntimeError("文案为空，无法进行 AI 分析")

        response = self._post_chat_completion(
            {
                "model": self.model,
                "messages": self._build_messages(
                    url,
                    clean_transcript,
                    remark,
                    summary,
                    custom_system_prompt,
                ),
                "temperature": 0.2,
                "max_tokens": 3000,
            }
        )

        if not response.ok:
            raise RuntimeError(self._error_message(response))

        try:
            payload = response.json()
        except ValueError as error:
            raise RuntimeError(f"中转大模型返回内容不是合法 JSON 响应: {error}") from error

        content = self._extract_content(payload)
        parsed = self._parse_json(content)
        return self._to_material(url, clean_transcript, parsed)

    def _post_chat_completion(self, payload: dict[str, Any]) -> requests.Response:
        last_error: requests.exceptions.RequestException | None = None
        for attempt in range(1, self.max_attempts + 1):
            try:
                return requests.post(
                    self._chat_completions_url(),
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=self.timeout,
                )
            except (
                requests.exceptions.SSLError,
                requests.exceptions.ConnectionError,
                requests.exceptions.ReadTimeout,
                requests.exceptions.Timeout,
            ) as error:
                last_error = error
                if attempt >= self.max_attempts:
                    break
                time.sleep(min(attempt * 2, 6))

        raise RuntimeError(
            "中转大模型网络连接不稳定，已自动重试 "
            f"{self.max_attempts} 次仍失败。请检查 nowcoding.ai 服务状态、网络或代理后再试。"
            f"原始错误: {last_error}"
        ) from last_error

    def _chat_completions_url(self) -> str:
        normalized = self.base_url.strip().rstrip("/")
        if normalized.endswith("/chat/completions"):
            return normalized
        return f"{normalized}/chat/completions"

    def _extract_content(self, response: Any) -> str:
        choices = self._get(response, "choices", []) or []
        if choices:
            message = self._get(choices[0], "message", {}) or {}
            content = self._get(message, "content", "")
            if content:
                return str(content)

        raise RuntimeError("中转大模型未返回文案分析内容")

    def _error_message(self, response: requests.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            payload = {}

        error = payload.get("error") if isinstance(payload, dict) else None
        if isinstance(error, dict):
            message = error.get("message")
            if message:
                return f"中转大模型调用失败: {message}"

        detail = response.text.strip()
        if detail:
            return f"中转大模型调用失败: HTTP {response.status_code} {detail}"

        return f"中转大模型调用失败: HTTP {response.status_code}"
