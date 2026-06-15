import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mockMaterials } from '../data/mockMaterials'
import type { Material } from '../types/material'
import { MaterialList } from './MaterialList'

describe('MaterialList', () => {
  function renderInteractiveList(onToolsChange: (materialId: string, nextTools: string[]) => void) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    act(() => {
      root.render(
        <MaterialList
          materials={[mockMaterials[0]]}
          highlightedId={null}
          onView={() => undefined}
          onDelete={() => undefined}
          onTagsChange={() => undefined}
          onToolsChange={onToolsChange}
        />,
      )
    })

    return { container, root }
  }

  it('renders materials as a desktop table with detail actions', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={mockMaterials}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
      />,
    )

    expect(html).toContain('<table')
    expect(html).toContain('标题')
    expect(html).toContain('作者')
    expect(html).toContain('标签')
    expect(html).toContain('工具')
    expect(html).toContain('aria-label="查看详情"')
    expect(html).toContain('>详情<')
    expect(html).not.toContain('状态')
    expect(html).not.toContain('已分析')
  })

  it('separates hashtag topics into a small row below the title', () => {
    const materialWithTopics: Material = {
      ...mockMaterials[0],
      id: 'material-with-topics',
      source: {
        ...mockMaterials[0].source,
        title: 'GPT Image 2直接生成可编辑PPT，1分钟学会 #gptimage2 #chatgpt #ai工具',
      },
    }

    const html = renderToStaticMarkup(
      <MaterialList
        materials={[materialWithTopics]}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
      />,
    )

    expect(html).toContain('data-testid="material-title-topics"')
    expect(html).toContain('GPT Image 2直接生成可编辑PPT，1分钟学会')
    expect(html).toContain('#gptimage2')
    expect(html).toContain('#chatgpt')
    expect(html).toContain('#ai工具')
    expect(html).not.toContain('GPT Image 2直接生成可编辑PPT，1分钟学会 #gptimage2')
  })

  it('combines author and created time into one readable meta column', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={[mockMaterials[0]]}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
      />,
    )

    expect(html).toContain('作者 / 时间')
    expect(html).toContain('data-testid="material-meta"')
    expect(html).toContain(mockMaterials[0].source.author)
    expect(html).toContain(mockMaterials[0].createdAt)
    expect(html).not.toContain('data-testid="material-status"')
    expect(html).toContain('data-testid="material-actions"')
    expect(html).toContain('w-[112px]')
    expect(html).toContain('bg-[#070b09]')
  })

  it('fits desktop table within the visible container without horizontal dragging', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={[mockMaterials[0]]}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
      />,
    )

    expect(html).toContain('data-testid="material-table"')
    expect(html).toContain('min-w-0')
    expect(html).not.toContain('min-w-[1280px]')
    expect(html).not.toContain('overflow-x-auto')
  })

  it('keeps the table header visible while scrolling the material library', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={mockMaterials}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
      />,
    )

    expect(html).toContain('<thead class="sticky top-0 z-20 border-b border-brand-green/20')
    expect(html).toContain('backdrop-blur')
    expect(html).toContain('bg-brand-green/80')
  })

  it('pulls the action controls inward by left-aligning the action column', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={[mockMaterials[0]]}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
      />,
    )

    expect(html).toContain('<th class="px-4 py-4 text-left"><span')
    expect(html).toContain('操作</span></th>')
    expect(html).toContain('<div class="flex justify-start"><div data-testid="material-actions"')
  })

  it('renders compact overview stats beside the material library heading', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={mockMaterials}
        overviewStats={{ total: 5, recent: 4, toolCount: 3 }}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
      />,
    )

    expect(html).toContain('data-testid="material-overview"')
    expect(html).toContain('data-testid="overview-total"')
    expect(html).toContain('data-testid="overview-recent"')
    expect(html).toContain('data-testid="overview-tool-count"')
    expect(html).toContain('>5<')
    expect(html).toContain('>4<')
    expect(html).toContain('>3<')
  })

  it('places the filter bar slot below the overview and above the table', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={mockMaterials}
        overviewStats={{ total: 5, recent: 4, toolCount: 3 }}
        filtersSlot={<div data-testid="material-filters-slot">filters</div>}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
      />,
    )

    const overviewIndex = html.indexOf('data-testid="material-overview"')
    const filtersIndex = html.indexOf('data-testid="material-filters-slot"')
    const tableIndex = html.indexOf('data-testid="material-table"')

    expect(overviewIndex).toBeGreaterThan(-1)
    expect(filtersIndex).toBeGreaterThan(overviewIndex)
    expect(tableIndex).toBeGreaterThan(filtersIndex)
  })

  it('allows editing the tool category from the tool column', () => {
    const changes: Array<{ materialId: string; nextTools: string[] }> = []
    const { container, root } = renderInteractiveList((materialId, nextTools) => {
      changes.push({ materialId, nextTools })
    })
    const firstTool = mockMaterials[0].classification.toolCategory[0]

    expect(container.querySelector('[data-testid="material-tools-editor"]')).not.toBeNull()

    act(() => {
      container
        .querySelector<HTMLButtonElement>(`[aria-label="删除标签 ${firstTool}"]`)
        ?.click()
    })

    expect(changes).toEqual([
      {
        materialId: mockMaterials[0].id,
        nextTools: mockMaterials[0].classification.toolCategory.filter((tool) => tool !== firstTool),
      },
    ])

    act(() => {
      root.unmount()
    })
  })

  it('stacks the compact tool editor vertically in the narrow table column', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={[mockMaterials[0]]}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
        onToolsChange={() => undefined}
      />,
    )

    expect(html).toContain('w-[14%]')
    expect(html).toContain('data-testid="material-tools-editor"')
    expect(html).toContain('flex-col')
    expect(html).toContain('items-start')
    expect(html).toContain('[&amp;_span]:min-h-7')
    expect(html).toContain('[&amp;&gt;button]:whitespace-nowrap')
    expect(html).toContain('[&amp;&gt;button]:px-2.5')
    expect(html).toContain('[&amp;&gt;button]:w-fit')
    expect(html).toContain('[&amp;_span]:w-fit')
    expect(html).toContain('[&amp;_span&gt;button]:text-zinc-500')
    expect(html).toContain('[&amp;_input]:w-20')
    expect(html).toContain('[&amp;_input]:min-w-0')
    expect(html).not.toContain('[&amp;_button]:h-7')
  })

  it('renders table tags as a two-column editor with compact input', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={[mockMaterials[0]]}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
        onToolsChange={() => undefined}
      />,
    )

    expect(html).toContain('data-testid="material-tags-editor"')
    expect(html).toContain('grid-cols-2')
    expect(html).toContain('max-w-[292px]')
    expect(html).toContain('[&amp;_span]:w-fit')
    expect(html).toContain('[&amp;_span]:max-w-[132px]')
    expect(html).toContain('[&amp;&gt;button]:w-fit')
    expect(html).toContain('[&amp;_input]:!w-20')
    expect(html).toContain('[&amp;_input]:!min-w-0')
    expect(html).not.toContain('[&amp;_input]:w-32')
  })

  it('uses compact add controls for table editors', () => {
    const html = renderToStaticMarkup(
      <MaterialList
        materials={[mockMaterials[0]]}
        highlightedId={null}
        onView={() => undefined}
        onDelete={() => undefined}
        onTagsChange={() => undefined}
        onToolsChange={() => undefined}
      />,
    )

    expect(html).toContain('>添加<')
    expect(html).toContain('[&amp;&gt;button]:h-7')
    expect(html).not.toContain('添加标签')
  })
})
