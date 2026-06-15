import { describe, expect, it } from 'vitest'
import { resolveApiBaseUrl } from './api'

describe('resolveApiBaseUrl', () => {
  it('uses the local backend when no environment value is configured', () => {
    expect(resolveApiBaseUrl()).toBe('http://127.0.0.1:8000')
  })

  it('uses a custom backend address without trailing slashes', () => {
    expect(resolveApiBaseUrl(' https://api.example.com/// ')).toBe('https://api.example.com')
  })
})
