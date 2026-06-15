import type { Material } from '../types/material'

export function normalizeTags(tags: string[]) {
  const seen = new Set<string>()

  return tags.reduce<string[]>((result, tag) => {
    const normalized = tag.trim()
    if (!normalized || isReferenceValueTag(normalized) || seen.has(normalized)) {
      return result
    }

    seen.add(normalized)
    result.push(normalized)
    return result
  }, [])
}

function isReferenceValueTag(tag: string) {
  return /^参考价值[高中低]$/.test(tag)
}

export function buildMaterialTags(material: Material) {
  return normalizeTags([
    ...material.classification.toolCategory,
    ...material.classification.topicCategory,
    material.classification.contentFormat,
    material.classification.hookType,
  ])
}

export function getMaterialTags(material: Material) {
  return material.tags ? normalizeTags(material.tags) : buildMaterialTags(material)
}

export function withMaterialTags(material: Material) {
  return {
    ...material,
    tags: getMaterialTags(material),
  }
}
