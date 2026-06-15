import { API_BASE_URL } from '../constants/api'
import type { VideoMetadata } from './videoMetadata'

export type StartVideoLinkProcessingResponse = {
  task_id: string
  message: string
}

export type TaskStatusResponse = {
  status: 'processing' | 'completed' | 'error'
  progress?: number
  message?: string
  script?: string
  summary?: string
  video_metadata?: VideoMetadata | null
  video_metadata_error?: string | null
  error?: string
}

async function parseJsonResponse<T>(response: Response) {
  const data = (await response.json()) as T & { detail?: string; error?: string; message?: string }

  if (!response.ok) {
    throw new Error(data.detail || data.error || data.message || `请求失败：${response.status}`)
  }

  return data
}

export async function startVideoLinkProcessing(url: string) {
  const formData = new FormData()
  formData.append('url', url)
  formData.append('summary_language', 'zh')

  const response = await fetch(`${API_BASE_URL}/api/process-video`, {
    method: 'POST',
    body: formData,
  })

  return parseJsonResponse<StartVideoLinkProcessingResponse>(response)
}

export async function getTaskStatus(taskId: string) {
  const response = await fetch(`${API_BASE_URL}/api/task-status/${taskId}`)

  return parseJsonResponse<TaskStatusResponse>(response)
}
