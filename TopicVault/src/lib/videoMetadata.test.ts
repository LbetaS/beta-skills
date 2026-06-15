import { describe, expect, it } from 'vitest'
import { mockMaterials } from '../data/mockMaterials'
import { applyVideoMetadataToMaterial } from './videoMetadata'

describe('applyVideoMetadataToMaterial', () => {
  it('uses TikHub video description as the visible material title and raw description', () => {
    const material = mockMaterials[0]

    const result = applyVideoMetadataToMaterial(material, {
      aweme_id: '7617120761456156773',
      description: 'GPT Image 2直接生成可编辑PPT，1分钟学会 #ai工具 #ppt',
      author: '北乔',
      title: '大模型办公流曝光',
    })

    expect(result.source.title).toBe('GPT Image 2直接生成可编辑PPT，1分钟学会 #ai工具 #ppt')
    expect(result.source.author).toBe('北乔')
    expect(result.rawContent.description).toBe('GPT Image 2直接生成可编辑PPT，1分钟学会 #ai工具 #ppt')
  })

  it('keeps model output when TikHub metadata is empty', () => {
    const material = mockMaterials[0]

    const result = applyVideoMetadataToMaterial(material, {})

    expect(result).toBe(material)
  })
})
