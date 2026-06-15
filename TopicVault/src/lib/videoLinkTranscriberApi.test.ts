import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '../constants/api'
import { getTaskStatus, startVideoLinkProcessing } from './videoLinkTranscriberApi'

describe('videoLinkTranscriberApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts a link-only processing task with url and summary language', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ task_id: 'task-1', message: '任务已创建，正在处理中...' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await startVideoLinkProcessing('https://www.youtube.com/watch?v=demo')

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/process-video`, {
      method: 'POST',
      body: expect.any(FormData),
    })

    const body = fetchMock.mock.calls[0][1].body as FormData
    expect(body.get('url')).toBe('https://www.youtube.com/watch?v=demo')
    expect(body.get('summary_language')).toBe('zh')
    expect(body.has('file')).toBe(false)
    expect(result.task_id).toBe('task-1')
  })

  it('gets task status by task id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'completed',
        script: '完整文案',
        summary: '中文摘要',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getTaskStatus('task-1')

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/task-status/task-1`)
    expect(result.status).toBe('completed')
  })
})
