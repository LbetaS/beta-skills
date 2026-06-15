import json
import os
import re
from datetime import datetime
from typing import Any

import dashscope
from dashscope import Generation


DEFAULT_ANALYSIS_MODEL = "qwen-plus"


class AliScriptAnalyzer:
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = (
            api_key
            or os.getenv("ALI_BAILIAN_API_KEY", "").strip()
            or os.getenv("DASHSCOPE_API_KEY", "").strip()
        )
        self.model = model or os.getenv("ALI_ANALYSIS_MODEL", DEFAULT_ANALYSIS_MODEL).strip()

    def analyze(
        self,
        url: str,
        transcript: str,
        remark: str = "",
        summary: str = "",
        custom_system_prompt: str = "",
    ) -> dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("未配置 ALI_BAILIAN_API_KEY 或 DASHSCOPE_API_KEY")

        clean_transcript = transcript.strip()
        if not clean_transcript:
            raise RuntimeError("文案为空，无法进行 AI 分析")

        dashscope.api_key = self.api_key
        response = Generation.call(
            api_key=self.api_key,
            model=self.model,
            messages=self._build_messages(url, clean_transcript, remark, summary, custom_system_prompt),
            result_format="message",
            temperature=0.2,
            max_tokens=3000,
        )

        status_code = self._get(response, "status_code")
        if status_code != 200:
            raise RuntimeError(self._get(response, "message") or "阿里百炼文案分析失败")

        content = self._extract_content(response)
        payload = self._parse_json(content)
        return self._to_material(url, clean_transcript, payload)

    def _build_messages(
        self,
        url: str,
        transcript: str,
        remark: str,
        summary: str,
        custom_system_prompt: str = "",
    ) -> list[dict[str, str]]:
        schema = {
            "title": "视频标题，中文，不能空",
            "author": "作者名，不知道就写 待补充",
            "description": "原文案摘要，1-2 句",
            "classification": {
                "toolCategory": ["ChatGPT/Claude/Gemini/Grok/Midjourney/Cursor/Codex/其他AI工具"],
                "topicCategory": ["AI提示词/AI工作流/AI工具推荐/AI自媒体/AI职场/AI编程/AI绘画/AI视频"],
                "contentFormat": "教程型/观点型/案例型/清单型/测评型",
                "hookType": "反常识开头/痛点开头/结果开头/提问开头/故事开头",
                "referenceValue": "高/中/低",
            },
            "analysis": {
                "oneSentenceSummary": "一句话总结",
                "coreArgument": "核心观点",
                "targetAudience": "兼容字段，可写空字符串",
                "painPoint": "这条素材主要指出或解决的问题",
                "hook": "开头钩子",
                "structure": [
                    {"step": 1, "name": "结构步骤名", "function": "这一步的传播功能", "text": "对应原文片段"}
                ],
                "emotionalCurve": ["好奇", "焦虑", "被说中", "看到方法", "想收藏"],
                "replicableMethods": ["可复用写法 1"],
                "rewriteAnglesForMyAccount": ["拍摄参考点 1，不生成改写稿"],
                "customSections": [
                    {"title": "提示词拆解结构", "content": "按用户提示词生成的拆解内容"}
                ],
            },
            "tags": ["用于前端展示和搜索的标签"],
        }

        user_prompt = f"""
请把下面短视频原文案拆解成“AI 短视频选题素材库”的结构化素材。

要求：
1. 只输出合法 JSON，不要 Markdown，不要解释。
2. 必须严格包含示例 schema 的所有字段。
3. structure 至少 4 步，最多 6 步。
4. tags 合并工具、主题、内容形式、钩子类型和用户备注关键词，例如：ChatGPT、AI工作流、教程型、开头不错。
5. 分析目标是“入库后方便搜索和回忆”，不要输出发布时间、适合什么账号参考、为什么值得收藏，也不要生成完整改写稿。
6. rewriteAnglesForMyAccount 字段保留为兼容字段，但内容请写成“拍摄参考点”，只说明以后拍摄时可参考哪里。

视频链接：{url}
用户备注：{remark or "无"}
提取摘要：{summary or "无"}

JSON schema 示例：
{json.dumps(schema, ensure_ascii=False)}

原文案：
{transcript[:12000]}
""".strip()

        system_prompt = (
            "你是资深短视频选题素材整理专家，擅长把原文案拆成可检索、可回忆、可复盘的选题资产。"
        )
        clean_custom_system_prompt = custom_system_prompt.strip()
        if clean_custom_system_prompt:
            system_prompt = (
                f"{system_prompt}\n\n"
                "以下是用户自定义的拆解架构提示词，必须作为 System Prompt 级别的分析规则执行：\n"
                f"{clean_custom_system_prompt}"
            )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    def _extract_content(self, response: Any) -> str:
        output = self._get(response, "output", {}) or {}
        choices = self._get(output, "choices", []) or []
        if choices:
            message = self._get(choices[0], "message", {}) or {}
            content = self._get(message, "content", "")
            if content:
                return str(content)

        text = self._get(output, "text", "")
        if text:
            return str(text)

        raise RuntimeError("阿里百炼未返回文案分析内容")

    def _parse_json(self, content: str) -> dict[str, Any]:
        cleaned = content.strip()
        fenced = re.search(r"```(?:json)?\s*(.*?)```", cleaned, re.DOTALL | re.IGNORECASE)
        if fenced:
            cleaned = fenced.group(1).strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as error:
            raise RuntimeError(f"阿里百炼返回内容不是合法 JSON: {error}") from error

        if not isinstance(parsed, dict):
            raise RuntimeError("阿里百炼返回 JSON 不是对象")
        return parsed

    def _to_material(self, url: str, transcript: str, payload: dict[str, Any]) -> dict[str, Any]:
        classification = payload.get("classification") if isinstance(payload.get("classification"), dict) else {}
        analysis = payload.get("analysis") if isinstance(payload.get("analysis"), dict) else {}

        material = {
            "id": f"mat-{int(datetime.now().timestamp() * 1000)}",
            "source": {
                "platform": "douyin",
                "url": url,
                "author": self._string(payload.get("author"), "待补充"),
                "title": self._string(payload.get("title"), "未命名短视频素材"),
            },
            "rawContent": {
                "description": self._string(payload.get("description"), ""),
                "transcript": transcript,
            },
            "classification": {
                "toolCategory": self._string_list(classification.get("toolCategory"), ["其他AI工具"]),
                "topicCategory": self._string_list(classification.get("topicCategory"), ["AI自媒体"]),
                "contentFormat": self._string(classification.get("contentFormat"), "教程型"),
                "hookType": self._string(classification.get("hookType"), "痛点开头"),
                "referenceValue": self._reference_value(classification.get("referenceValue")),
            },
            "analysis": {
                "oneSentenceSummary": self._string(analysis.get("oneSentenceSummary"), "暂无总结"),
                "coreArgument": self._string(analysis.get("coreArgument"), "暂无核心观点"),
                "targetAudience": self._string(analysis.get("targetAudience"), ""),
                "painPoint": self._string(analysis.get("painPoint"), "缺少可复用的内容拆解方法"),
                "hook": self._string(analysis.get("hook"), "暂无开头钩子"),
                "structure": self._structure(analysis.get("structure")),
                "emotionalCurve": self._string_list(analysis.get("emotionalCurve"), ["好奇", "被说中", "想收藏"]),
                "replicableMethods": self._string_list(analysis.get("replicableMethods"), ["提炼开头、结构和行动引导"]),
                "rewriteAnglesForMyAccount": self._string_list(
                    analysis.get("rewriteAnglesForMyAccount"),
                    ["记录这条素材可参考的开头、结构或表达方式"],
                ),
                "customSections": self._custom_sections(analysis.get("customSections")),
            },
            "tags": self._tag_list(payload.get("tags")),
            "createdAt": datetime.now().strftime("%Y/%m/%d %H:%M"),
        }

        if not material["tags"]:
            material["tags"] = self._default_tags(material["classification"])

        return material

    def _structure(self, value: Any) -> list[dict[str, Any]]:
        if not isinstance(value, list):
            return [
                {"step": 1, "name": "开头钩子", "function": "吸引注意", "text": "提炼原文开头"},
                {"step": 2, "name": "问题放大", "function": "制造共鸣", "text": "指出用户痛点"},
                {"step": 3, "name": "方法提出", "function": "给出解决思路", "text": "提出可执行方法"},
                {"step": 4, "name": "行动引导", "function": "促进收藏或评论", "text": "引导用户行动"},
            ]

        result = []
        for index, item in enumerate(value[:6], start=1):
            if not isinstance(item, dict):
                continue
            result.append(
                {
                    "step": int(item.get("step") or index),
                    "name": self._string(item.get("name"), f"步骤 {index}"),
                    "function": self._string(item.get("function"), "承接内容推进"),
                    "text": self._string(item.get("text"), ""),
                }
            )

        return result or self._structure(None)

    def _custom_sections(self, value: Any) -> list[dict[str, str]]:
        if not isinstance(value, list):
            return []

        result = []
        for item in value[:6]:
            if not isinstance(item, dict):
                continue
            title = self._string(item.get("title"), "")
            content = self._string(item.get("content"), "")
            if not title or not content:
                continue
            result.append({"title": title, "content": content})

        return result

    def _default_tags(self, classification: dict[str, Any]) -> list[str]:
        return self._dedupe(
            [
                *classification["toolCategory"],
                *classification["topicCategory"],
                classification["contentFormat"],
                classification["hookType"],
            ]
        )

    def _string(self, value: Any, fallback: str) -> str:
        if isinstance(value, str) and value.strip():
            return value.strip()
        return fallback

    def _string_list(self, value: Any, fallback: list[str]) -> list[str]:
        if not isinstance(value, list):
            return fallback
        return self._dedupe([item.strip() for item in value if isinstance(item, str) and item.strip()]) or fallback

    def _tag_list(self, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return self._dedupe(
            [
                item.strip()
                for item in value
                if isinstance(item, str) and item.strip() and not re.fullmatch(r"参考价值[高中低]", item.strip())
            ]
        )

    def _reference_value(self, value: Any) -> str:
        normalized = self._string(value, "高")
        return normalized if normalized in {"高", "中", "低"} else "高"

    def _dedupe(self, values: list[str]) -> list[str]:
        seen = set()
        result = []
        for value in values:
            if value in seen:
                continue
            seen.add(value)
            result.append(value)
        return result

    def _get(self, value: Any, key: str, default=None):
        if isinstance(value, dict):
            return value.get(key, default)
        return getattr(value, key, default)
