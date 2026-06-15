from config_check import find_missing_configuration


def test_complete_configuration_has_no_missing_items():
    env = {
        "TIKHUB_API_KEY": "tikhub-key",
        "ALI_BAILIAN_API_KEY": "ali-key",
        "LLM_API_KEY": "llm-key",
        "LLM_BASE_URL": "https://relay.example.com/v1",
        "LLM_MODEL": "model-name",
    }

    assert find_missing_configuration(env) == []


def test_configuration_accepts_supported_aliases():
    env = {
        "TIKHUB_API_KEY": "tikhub-key",
        "DASHSCOPE_API_KEY": "ali-key",
        "OPENAI_API_KEY": "llm-key",
        "OPENAI_BASE_URL": "https://relay.example.com/v1",
        "OPENAI_MODEL": "model-name",
    }

    assert find_missing_configuration(env) == []


def test_missing_configuration_lists_each_required_group():
    assert find_missing_configuration({}) == [
        "TIKHUB_API_KEY",
        "ALI_BAILIAN_API_KEY 或 DASHSCOPE_API_KEY",
        "LLM_API_KEY 或 OPENAI_API_KEY",
        "LLM_BASE_URL 或 OPENAI_BASE_URL",
        "LLM_MODEL 或 OPENAI_MODEL",
    ]
