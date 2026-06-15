export type ReferenceValue = '高' | '中' | '低'

export type Material = {
  id: string
  source: {
    platform: 'douyin'
    url: string
    author: string
    title: string
  }
  rawContent: {
    description?: string
    transcript: string
  }
  classification: {
    toolCategory: string[]
    topicCategory: string[]
    contentFormat: string
    hookType: string
    referenceValue: ReferenceValue
  }
  tags?: string[]
  personalNotes?: {
    collectReason?: string
    topicInspiration?: string
  }
  analysis: {
    oneSentenceSummary: string
    coreArgument: string
    targetAudience: string
    painPoint: string
    hook: string
    structure: {
      step: number
      name: string
      function: string
      text: string
    }[]
    customSections?: {
      title: string
      content: string
    }[]
    emotionalCurve: string[]
    replicableMethods: string[]
    rewriteAnglesForMyAccount: string[]
  }
  createdAt: string
}

export type Filters = {
  tool: string
  tag: string
  search: string
}
