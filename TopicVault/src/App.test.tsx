import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it } from 'vitest'
import { mockMaterials } from './data/mockMaterials'
import App from './App'

function renderApp() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(<App />)
  })

  return { container, root }
}

describe('App workspace navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    window.localStorage.clear()
  })

  it('shows the extraction workspace by default', () => {
    const { container, root } = renderApp()

    expect(container.querySelector('[data-testid="app-zoom-root"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="zoom-controls"]')).toBeNull()
    expect(container.querySelector('main')?.className).toContain('md:ml-[17rem]')
    expect(container.querySelector('main')?.className).not.toContain('mx-auto')
    expect(container.querySelector('[data-testid="workspace-nav"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="workspace-brand"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="analysis-workspace"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="library-workspace"]')).toBeNull()

    act(() => {
      root.unmount()
    })
  })

  it('switches to the material library workspace from the left navigation', () => {
    const { container, root } = renderApp()

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="nav-library"]')?.click()
    })

    expect(container.querySelector('[data-testid="analysis-workspace"]')).toBeNull()
    expect(container.querySelector('[data-testid="library-workspace"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="material-table"]')).not.toBeNull()

    act(() => {
      root.unmount()
    })
  })

  it('switches to the prompt settings workspace from the left navigation', () => {
    const { container, root } = renderApp()

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="nav-prompts"]')?.click()
    })

    expect(container.querySelector('[data-testid="analysis-workspace"]')).toBeNull()
    expect(container.querySelector('[data-testid="library-workspace"]')).toBeNull()
    expect(container.querySelector('[data-testid="prompt-workspace"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="custom-system-prompt"]')).not.toBeNull()

    act(() => {
      root.unmount()
    })
  })

  it('zooms the whole workspace with keyboard shortcuts and saves the selected zoom level', () => {
    const { container, root } = renderApp()
    const zoomRoot = container.querySelector<HTMLElement>('[data-testid="app-zoom-root"]')

    expect(zoomRoot?.style.getPropertyValue('--app-zoom')).toBe('1')
    expect(container.querySelector('[data-testid="zoom-controls"]')).toBeNull()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '+', ctrlKey: true }))
    })

    expect(zoomRoot?.style.getPropertyValue('--app-zoom')).toBe('1.1')
    expect(window.localStorage.getItem('ai-video-material-library:app-zoom')).toBe('1.1')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '0', ctrlKey: true }))
    })

    expect(zoomRoot?.style.getPropertyValue('--app-zoom')).toBe('1')
    expect(window.localStorage.getItem('ai-video-material-library:app-zoom')).toBe('1')

    act(() => {
      root.unmount()
    })
  })

  it('hydrates saved older materials with the latest custom decomposition example', () => {
    const legacyMaterial = {
      ...mockMaterials[0],
      analysis: {
        ...mockMaterials[0].analysis,
        customSections: undefined,
      },
    }
    window.localStorage.setItem('ai-video-material-library:materials', JSON.stringify([legacyMaterial]))

    const { container, root } = renderApp()

    expect(container.querySelector('[data-testid="analysis-custom-sections"]')).not.toBeNull()

    act(() => {
      root.unmount()
    })
  })
})
