import os
from collections.abc import Mapping

from openai_compatible_analyzer import load_env_files


CONFIGURATION_GROUPS = [
    (("TIKHUB_API_KEY",), "TIKHUB_API_KEY"),
    (
        ("ALI_BAILIAN_API_KEY", "DASHSCOPE_API_KEY"),
        "ALI_BAILIAN_API_KEY 或 DASHSCOPE_API_KEY",
    ),
    (("LLM_API_KEY", "OPENAI_API_KEY"), "LLM_API_KEY 或 OPENAI_API_KEY"),
    (
        ("LLM_BASE_URL", "OPENAI_BASE_URL"),
        "LLM_BASE_URL 或 OPENAI_BASE_URL",
    ),
    (("LLM_MODEL", "OPENAI_MODEL"), "LLM_MODEL 或 OPENAI_MODEL"),
]


def find_missing_configuration(env: Mapping[str, str]) -> list[str]:
    missing: list[str] = []
    for names, label in CONFIGURATION_GROUPS:
        if not any(env.get(name, "").strip() for name in names):
            missing.append(label)
    return missing


def main() -> int:
    load_env_files()
    missing = find_missing_configuration(os.environ)
    if missing:
        print("后端配置不完整，请在 backend/.env 中补充：")
        for item in missing:
            print(f"- {item}")
        return 1

    print("后端配置检查通过。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
