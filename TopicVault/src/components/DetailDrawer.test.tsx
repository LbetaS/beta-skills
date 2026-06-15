import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mockMaterials } from '../data/mockMaterials'
import type { Material } from '../types/material'
import { DetailDrawer } from './DetailDrawer'

describe('DetailDrawer', () => {
  it('renders a wide centered detail panel with section icons', () => {
    const html = renderToStaticMarkup(
      <DetailDrawer
        material={mockMaterials[0]}
        onClose={() => undefined}
        onTagsChange={() => undefined}
        onNotesChange={() => undefined}
      />,
    )

    expect(html).toContain('data-testid="detail-panel"')
    expect(html).toContain('max-w-7xl')
    expect(html).toContain('data-testid="detail-title-icon"')
    expect(html).toContain('data-testid="detail-tags-icon"')
    expect(html).toContain('data-testid="detail-notes-icon"')
    expect(html).toContain('data-testid="detail-transcript-icon"')
    expect(html).not.toContain('absolute right-0 top-0')
    expect(html).not.toContain('max-w-2xl')
  })

  it('renders a sticky section directory for navigating detail sections', () => {
    const html = renderToStaticMarkup(
      <DetailDrawer
        material={mockMaterials[0]}
        onClose={() => undefined}
        onTagsChange={() => undefined}
        onNotesChange={() => undefined}
      />,
    )

    expect(html).toContain('data-testid="detail-section-nav"')
    expect(html).toContain('sticky top-0')
    expect(html).toContain('data-section-id="tags"')
    expect(html).toContain('data-section-id="notes"')
    expect(html).toContain('data-section-id="transcript"')
    expect(html).toContain('data-section-id="summary"')
    expect(html).toContain('data-section-id="structure"')
    expect(html).toContain('data-section-id="references"')
    expect(html).toContain('data-active="true"')
  })

  it('shows custom decomposition sections in the detail panel directory and content', () => {
    const material = {
      ...mockMaterials[0],
      analysis: {
        ...mockMaterials[0].analysis,
        customSections: [
          { title: '选题拆解', content: '这条素材适合按“旧方法失效 -> 新流程”来收藏。' },
          { title: '复盘重点', content: '重点看开头如何快速制造认知差。' },
        ],
      },
    }

    const html = renderToStaticMarkup(
      <DetailDrawer
        material={material}
        onClose={() => undefined}
        onTagsChange={() => undefined}
        onNotesChange={() => undefined}
      />,
    )

    expect(html).toContain('data-section-id="custom"')
    expect(html).toContain('提示词拆解结构')
    expect(html).toContain('选题拆解')
    expect(html).toContain('复盘重点')
  })

  it('lets users edit personal collection notes for a material', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const changes: Array<{
      materialId: string
      notes: Material['personalNotes']
    }> = []

    act(() => {
      root.render(
        <DetailDrawer
          material={mockMaterials[0]}
          onClose={() => undefined}
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

    expect(reasonInput).not.toBeNull()
    expect(inspirationInput).not.toBeNull()

    act(() => {
      reasonInput!.value = '这个开头很适合做一期选题'
      reasonInput!.dispatchEvent(new Event('input', { bubbles: true }))
      reasonInput!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })

    expect(changes).toContainEqual({
      materialId: mockMaterials[0].id,
      notes: {
        collectReason: '这个开头很适合做一期选题',
        topicInspiration: undefined,
      },
    })

    act(() => {
      inspirationInput!.value = '可以做成 AI 工具收藏夹选题'
      inspirationInput!.dispatchEvent(new Event('input', { bubbles: true }))
      inspirationInput!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })

    expect(changes).toContainEqual({
      materialId: mockMaterials[0].id,
      notes: {
        collectReason: undefined,
        topicInspiration: '可以做成 AI 工具收藏夹选题',
      },
    })

    act(() => {
      root.unmount()
    })
  })
})
