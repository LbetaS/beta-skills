import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mockMaterials } from '../data/mockMaterials'
import type { Material } from '../types/material'
import { AnalysisPreview } from './AnalysisPreview'

function renderPreview() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(<AnalysisPreview material={mockMaterials[0]} onTagsChange={() => undefined} />)
  })

  return { container, root }
}

describe('AnalysisPreview', () => {
  it('explains what the analysis card is for', () => {
    const html = renderToStaticMarkup(<AnalysisPreview material={mockMaterials[0]} onTagsChange={() => undefined} />)

    expect(html).toContain('选题素材已入库')
    expect(html).toContain('已提取原文案，并整理成摘要、结构、标签和拍摄参考点')
    expect(html).toContain('原视频信息')
    expect(html).toContain('素材摘要')
    expect(html).toContain('data-testid="analysis-custom-sections"')
  })

  it('renders the original transcript as the default detail tab', () => {
    const html = renderToStaticMarkup(<AnalysisPreview material={mockMaterials[0]} onTagsChange={() => undefined} />)

    expect(html).toContain('data-testid="analysis-tabs"')
    expect(html).toContain('原文案')
    expect(html).toContain(mockMaterials[0].rawContent.transcript)
  })

  it('renders analysis detail tabs instead of showing every long section at once', () => {
    const html = renderToStaticMarkup(<AnalysisPreview material={mockMaterials[0]} onTagsChange={() => undefined} />)

    expect(html).toContain('文案结构')
    expect(html).toContain('参考点')
    expect(html).not.toContain('data-testid="structure-step"')
    expect(html).not.toContain('xl:grid-cols-5')
    expect(html).not.toContain('改写方向')
  })

  it('does not render reference value as a top badge', () => {
    const html = renderToStaticMarkup(<AnalysisPreview material={mockMaterials[0]} onTagsChange={() => undefined} />)

    expect(html).not.toContain('参考价值')
  })

  it('does not render content format as a top badge and labels the editable tags area', () => {
    const material = {
      ...mockMaterials[0],
      tags: ['Claude', 'AI课程推荐'],
      classification: {
        ...mockMaterials[0].classification,
        contentFormat: '清单型',
      },
    }
    const html = renderToStaticMarkup(<AnalysisPreview material={material} onTagsChange={() => undefined} />)

    expect(html).toContain('素材标签')
    expect(html).not.toContain('清单型')
  })

  it('places editable classification tags inside the title block', () => {
    const html = renderToStaticMarkup(<AnalysisPreview material={mockMaterials[0]} onTagsChange={() => undefined} />)
    const titleIndex = html.indexOf('data-testid="analysis-title-card"')
    const tagsIndex = html.indexOf('data-testid="analysis-inline-tags"')
    const summaryIndex = html.indexOf('一句话总结')

    expect(titleIndex).toBeGreaterThan(-1)
    expect(tagsIndex).toBeGreaterThan(titleIndex)
    expect(tagsIndex).toBeLessThan(summaryIndex)
  })

  it('lets users edit personal notes directly on the extraction page', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const changes: Array<{
      materialId: string
      notes: Material['personalNotes']
    }> = []

    act(() => {
      root.render(
        <AnalysisPreview
          material={mockMaterials[0]}
          onTagsChange={() => undefined}
          onNotesChange={(materialId, notes) => changes.push({ materialId, notes })}
        />,
      )
    })

    const reasonInput = container.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="我为什么收藏它"]',
    )
    const inspirationInput = container.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="记录你看到它时想到的拍摄方向"]',
    )

    expect(container.querySelector('[data-testid="analysis-personal-notes"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="analysis-note-field-reason"] .lucide-bookmark')).not.toBeNull()
    expect(container.querySelector('[data-testid="analysis-note-field-inspiration"] .lucide-lightbulb')).not.toBeNull()
    expect(reasonInput).not.toBeNull()
    expect(inspirationInput).not.toBeNull()

    act(() => {
      reasonInput!.value = '这个选题值得以后拍'
      reasonInput!.dispatchEvent(new Event('input', { bubbles: true }))
      reasonInput!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })

    expect(changes).toContainEqual({
      materialId: mockMaterials[0].id,
      notes: {
        collectReason: '这个选题值得以后拍',
        topicInspiration: undefined,
      },
    })

    act(() => {
      inspirationInput!.value = '可以做成 AI 选题整理工具'
      inspirationInput!.dispatchEvent(new Event('input', { bubbles: true }))
      inspirationInput!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })

    expect(changes).toContainEqual({
      materialId: mockMaterials[0].id,
      notes: {
        collectReason: undefined,
        topicInspiration: '可以做成 AI 选题整理工具',
      },
    })

    act(() => {
      root.unmount()
    })
  })

  it('does not mention Feishu in the tag editing helper text', () => {
    const html = renderToStaticMarkup(<AnalysisPreview material={mockMaterials[0]} onTagsChange={() => undefined} />)

    expect(html).not.toContain('飞书')
  })

  it('uses icon-led cards and separated rows for rewrite insights', () => {
    const { container, root } = renderPreview()
    const rewriteButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '参考点',
    )

    act(() => {
      rewriteButton?.click()
    })

    expect(container.querySelector('[data-testid="rewrite-insights-grid"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="rewrite-audience-card"] .lucide-target')).not.toBeNull()
    expect(container.querySelector('[data-testid="rewrite-emotion-card"] .lucide-trending-up')).not.toBeNull()
    expect(container.querySelector('[data-testid="rewrite-methods-card"] .lucide-repeat-2')).not.toBeNull()
    expect(container.querySelector('[data-testid="rewrite-angles-card"] .lucide-pen-line')).not.toBeNull()
    expect(container.querySelectorAll('[data-testid="rewrite-method-item"]').length).toBeGreaterThan(1)
    expect(container.querySelectorAll('[data-testid="rewrite-angle-item"]').length).toBeGreaterThan(1)

    act(() => {
      root.unmount()
    })
  })

  it('renders custom decomposition sections returned by the model', () => {
    const material = {
      ...mockMaterials[0],
      analysis: {
        ...mockMaterials[0].analysis,
        customSections: [
          { title: 'AIDA 拆解', content: '注意力：先否定旧方法；兴趣：展示三步流程。' },
          { title: '收藏价值', content: '适合之后搜索“工作流”和“提示词模板”时快速回看。' },
        ],
      },
    }

    const html = renderToStaticMarkup(<AnalysisPreview material={material} onTagsChange={() => undefined} />)

    expect(html).toContain('data-testid="analysis-custom-sections"')
    expect(html).toContain('提示词拆解结构')
    expect(html).toContain('AIDA 拆解')
    expect(html).toContain('收藏价值')
    expect(html).toContain('注意力：先否定旧方法；兴趣：展示三步流程。')
  })

  it('places custom decomposition sections at the bottom of the analysis card', () => {
    const html = renderToStaticMarkup(<AnalysisPreview material={mockMaterials[0]} onTagsChange={() => undefined} />)
    const tabsIndex = html.indexOf('data-testid="analysis-tabs"')

    expect(tabsIndex).toBeGreaterThan(-1)
    expect(html).toContain('data-testid="analysis-custom-sections"')
    expect(html).toContain('order-last')
  })

})
