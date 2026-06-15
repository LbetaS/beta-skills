import { describe, expect, it } from 'vitest'
import { mockMaterials } from '../data/mockMaterials'
import { filterMaterials } from './filterMaterials'

describe('filterMaterials', () => {
  it('filters by tool, editable tag and search text together', () => {
    const result = filterMaterials(mockMaterials, {
      tool: 'ChatGPT',
      tag: 'AI工作流',
      search: '三步',
    })

    expect(result).toHaveLength(1)
    expect(result[0].source.title).toContain('三步工作流')
  })

  it('matches search text against title, core argument and tags', () => {
    const result = filterMaterials(mockMaterials, {
      tool: '全部',
      tag: '全部',
      search: '开头钩子',
    })

    expect(result.map((item) => item.source.author)).toContain('提示词小北')
  })

  it('matches user edited tags in search text and tag dropdown', () => {
    const result = filterMaterials(
      [{ ...mockMaterials[0], tags: ['开头不错', '适合二创'] }],
      {
        tool: '全部',
        tag: '适合二创',
        search: '开头不错',
      },
    )

    expect(result).toHaveLength(1)
  })

  it('matches tool filters against editable tags as well as classification fields', () => {
    const result = filterMaterials(
      [
        {
          ...mockMaterials[0],
          classification: {
            ...mockMaterials[0].classification,
            toolCategory: ['其他AI工具'],
            topicCategory: ['AI自媒体'],
            referenceValue: '中',
          },
          tags: ['ChatGPT', 'AI工作流', '参考价值高'],
        },
      ],
      {
        tool: 'ChatGPT',
        tag: 'AI工作流',
        search: '',
      },
    )

    expect(result).toHaveLength(1)
  })
})
