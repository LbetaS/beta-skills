import type { Material } from '../types/material'

export type VideoMetadata = {
  aweme_id?: string
  description?: string
  author?: string
  title?: string
}

function clean(value?: string) {
  return value?.trim() ?? ''
}

export function applyVideoMetadataToMaterial(material: Material, metadata?: VideoMetadata | null): Material {
  const description = clean(metadata?.description)
  const author = clean(metadata?.author)
  const fallbackTitle = clean(metadata?.title)

  if (!description && !author && !fallbackTitle) {
    return material
  }

  return {
    ...material,
    source: {
      ...material.source,
      title: description || fallbackTitle || material.source.title,
      author: author || material.source.author,
    },
    rawContent: {
      ...material.rawContent,
      description: description || material.rawContent.description,
    },
  }
}
