import type { Filters, Material } from '../types/material'
import { getMaterialTags } from './materialTags'

export function filterMaterials(materials: Material[], filters: Filters) {
  const keyword = filters.search.trim().toLowerCase()

  return materials.filter((material) => {
    const tags = getMaterialTags(material)
    const toolMatched =
      filters.tool === '全部' ||
      material.classification.toolCategory.includes(filters.tool) ||
      tags.includes(filters.tool)
    const tagMatched = filters.tag === '全部' || tags.includes(filters.tag)
    const searchableText = [
      material.source.title,
      material.source.author,
      material.analysis.coreArgument,
      material.analysis.oneSentenceSummary,
      material.classification.contentFormat,
      material.classification.hookType,
      ...tags,
      ...material.classification.toolCategory,
      ...material.classification.topicCategory,
    ]
      .join(' ')
      .toLowerCase()

    return (
      toolMatched &&
      tagMatched &&
      (!keyword || searchableText.includes(keyword))
    )
  })
}
