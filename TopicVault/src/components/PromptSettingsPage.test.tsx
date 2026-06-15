import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PromptSettingsPage } from './PromptSettingsPage'

describe('PromptSettingsPage', () => {
  it('uses a clear Chinese title for the decomposition prompt editor', () => {
    const html = renderToStaticMarkup(
      <PromptSettingsPage
        prompt=""
        defaultPrompt="默认提示词"
        onChange={() => undefined}
        onSave={() => undefined}
        onReset={() => undefined}
      />,
    )

    expect(html).toContain('拆解分析提示词')
    expect(html).toContain('data-testid="custom-system-prompt"')
    expect(html).not.toContain('拆解分析 System Prompt')
  })

  it('keeps the prompt settings interface in Chinese without English helper text', () => {
    const html = renderToStaticMarkup(
      <PromptSettingsPage
        prompt=""
        defaultPrompt="请按固定结构拆解文案。"
        onChange={() => undefined}
        onSave={() => undefined}
        onReset={() => undefined}
      />,
    )

    expect(html).toContain('提示词内容')
    expect(html).toContain('写法参考')
    expect(html).not.toContain('作用范围')
    expect(html).not.toContain('保存位置')
    expect(html).not.toContain('生效方式')
    expect(html).not.toContain('System')
    expect(html).not.toContain('Prompt')
    expect(html).not.toContain('AIDA')
    expect(html).not.toContain('SOP')
    expect(html).not.toContain('JSON')
  })

  it('renders the customizable prompt badge as a compact non-wrapping status chip', () => {
    const html = renderToStaticMarkup(
      <PromptSettingsPage
        prompt=""
        defaultPrompt="璇锋寜鍥哄畾缁撴瀯鎷嗚В鏂囨銆?"
        onChange={() => undefined}
        onSave={() => undefined}
        onReset={() => undefined}
      />,
    )

    expect(html).toContain('data-testid="prompt-custom-badge"')
    expect(html).toContain('whitespace-nowrap')
    expect(html).toContain('lucide-sliders-horizontal')
    expect(html).not.toContain('rounded-full border border-brand-green/25 bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-green')
  })
})
