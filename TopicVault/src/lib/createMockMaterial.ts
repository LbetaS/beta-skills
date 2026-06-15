import { mockMaterials } from '../data/mockMaterials'
import type { Material } from '../types/material'
import { withMaterialTags } from './materialTags'

function splitRemark(remark: string) {
  return remark
    .split(/[\/,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatDateTime(date: Date) {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function createMockMaterial(url: string, remark: string): Material {
  const seed = mockMaterials[0]
  const remarkTags = splitRemark(remark)
  const now = new Date()

  return withMaterialTags({
    ...seed,
    id: `mat-${Date.now()}`,
    source: {
      ...seed.source,
      url,
      title: '别再问 ChatGPT 单个问题了，用三步工作流让它直接产出方案',
    },
    classification: {
      ...seed.classification,
      toolCategory: Array.from(new Set([...seed.classification.toolCategory, ...remarkTags])).filter(
        (tag) => ['ChatGPT', 'Claude', 'Gemini', 'Grok', 'Midjourney', 'Cursor', 'Codex'].includes(tag),
      ),
      topicCategory: Array.from(
        new Set([
          ...seed.classification.topicCategory,
          ...remarkTags.filter((tag) => tag.startsWith('AI')),
        ]),
      ),
      referenceValue: remark.includes('中') ? '中' : remark.includes('低') ? '低' : '高',
    },
    createdAt: formatDateTime(now),
  })
}
