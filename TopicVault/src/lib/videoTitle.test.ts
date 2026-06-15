import { describe, expect, it } from 'vitest'
import { splitVideoTitle } from './videoTitle'

describe('splitVideoTitle', () => {
  it('separates hashtag topics from the visible title', () => {
    expect(splitVideoTitle('GPT Image 2直接生成可编辑PPT，1分钟学会 #gptimage2 #chatgpt #ai工具 #效率神器 #ppt')).toEqual({
      title: 'GPT Image 2直接生成可编辑PPT，1分钟学会',
      topics: ['#gptimage2', '#chatgpt', '#ai工具', '#效率神器', '#ppt'],
    })
  })

  it('keeps the original text as title when there are no hashtag topics', () => {
    expect(splitVideoTitle('大模型竟能生成可编辑PPT？')).toEqual({
      title: '大模型竟能生成可编辑PPT？',
      topics: [],
    })
  })
})
