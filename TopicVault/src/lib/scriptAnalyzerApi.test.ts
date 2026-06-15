import { describe, expect, it, vi, afterEach } from 'vitest'
import { API_BASE_URL } from '../constants/api'
import { analyzeScript } from './scriptAnalyzerApi'

describe('scriptAnalyzerApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('posts transcript to the backend analyzer endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        material: {
          id: 'mat-1',
          source: {
            platform: 'douyin',
            url: 'https://www.douyin.com/video/123',
            author: 'AI效率课',
            title: '分析标题',
          },
          rawContent: {
            description: '摘要',
            transcript: '完整文案',
          },
          classification: {
            toolCategory: ['ChatGPT'],
            topicCategory: ['AI工作流'],
            contentFormat: '教程型',
            hookType: '反常识开头',
            referenceValue: '高',
          },
          analysis: {
            oneSentenceSummary: '一句话总结',
            coreArgument: '核心观点',
            targetAudience: 'AI内容博主',
            painPoint: '痛点',
            hook: '钩子',
            structure: [{ step: 1, name: '开头', function: '吸引注意', text: '原文片段' }],
            emotionalCurve: ['好奇'],
            replicableMethods: ['方法'],
            rewriteAnglesForMyAccount: ['拍摄参考点'],
          },
          tags: ['ChatGPT'],
          createdAt: '2026/05/09 12:00',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await analyzeScript({
      url: 'https://www.douyin.com/video/123',
      transcript: '完整文案',
      remark: 'ChatGPT / AI工作流',
      summary: '摘要',
    })

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/analyze-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.douyin.com/video/123',
        transcript: '完整文案',
        remark: 'ChatGPT / AI工作流',
        summary: '摘要',
      }),
    })
    expect(result.material.source.title).toBe('分析标题')
  })
  it('sends the custom system prompt to the backend analyzer endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        material: {
          id: 'mat-1',
          source: { platform: 'douyin', url: 'https://example.com', author: 'author', title: 'title' },
          rawContent: { description: '', transcript: 'transcript' },
          classification: {
            toolCategory: ['Claude'],
            topicCategory: ['AI提示词'],
            contentFormat: '拆解型',
            hookType: '结果开头',
            referenceValue: '高',
          },
          analysis: {
            oneSentenceSummary: 'summary',
            coreArgument: 'argument',
            targetAudience: 'audience',
            painPoint: 'pain',
            hook: 'hook',
            structure: [{ step: 1, name: 'step', function: 'fn', text: 'text' }],
            emotionalCurve: ['curious'],
            replicableMethods: ['method'],
            rewriteAnglesForMyAccount: ['angle'],
          },
          tags: ['Claude'],
          createdAt: '2026/05/09 12:00',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await analyzeScript({
      url: 'https://example.com',
      transcript: 'transcript',
      remark: '',
      customSystemPrompt: '请按 AIDA 框架拆解。',
    })

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/analyze-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        transcript: 'transcript',
        remark: '',
        customSystemPrompt: '请按 AIDA 框架拆解。',
      }),
    })
  })
})
