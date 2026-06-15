import { describe, expect, it } from 'vitest'
import { mockMaterials } from '../data/mockMaterials'
import { buildMaterialTags, getMaterialTags, normalizeTags } from './materialTags'

describe('materialTags', () => {
  it('builds display tags from classification fields', () => {
    expect(buildMaterialTags(mockMaterials[0])).toEqual([
      'ChatGPT',
      'AI工作流',
      'AI职场',
      'AI自媒体',
      '教程型',
      '反常识开头',
    ])
  })

  it('removes reference value tags from existing edited tags', () => {
    expect(getMaterialTags({ ...mockMaterials[0], tags: ['ChatGPT', '参考价值高', 'AI提示词'] })).toEqual([
      'ChatGPT',
      'AI提示词',
    ])
  })

  it('trims empty values and removes duplicate tags', () => {
    expect(normalizeTags([' ChatGPT ', '', 'ChatGPT', 'Claude / 文案分析'])).toEqual([
      'ChatGPT',
      'Claude / 文案分析',
    ])
  })

  it('prefers user edited tags when present', () => {
    expect(getMaterialTags({ ...mockMaterials[0], tags: ['可复用'] })).toEqual(['可复用'])
  })
})
