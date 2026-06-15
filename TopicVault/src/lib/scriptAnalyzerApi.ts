import { API_BASE_URL } from '../constants/api'
import type { Material } from '../types/material'

export type AnalyzeScriptRequest = {
  url: string
  transcript: string
  remark: string
  summary?: string
  customSystemPrompt?: string
}

export type AnalyzeScriptResponse = {
  material: Material
}

async function parseJsonResponse<T>(response: Response) {
  const data = (await response.json()) as T & { detail?: string; error?: string; message?: string }

  if (!response.ok) {
    throw new Error(data.detail || data.error || data.message || `请求失败：${response.status}`)
  }

  return data
}

export async function analyzeScript(payload: AnalyzeScriptRequest) {
  const response = await fetch(`${API_BASE_URL}/api/analyze-script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseJsonResponse<AnalyzeScriptResponse>(response)
}
