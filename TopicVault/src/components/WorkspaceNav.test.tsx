import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WorkspaceNav } from './WorkspaceNav'

describe('WorkspaceNav', () => {
  it('uses a compact desktop rail with horizontal nav labels', () => {
    const html = renderToStaticMarkup(<WorkspaceNav activeView="analysis" onChange={() => undefined} />)

    expect(html).toContain('data-testid="workspace-nav"')
    expect(html).toContain('data-testid="workspace-brand"')
    expect(html).toContain('AI选题素材库')
    expect(html).toContain('md:w-60')
    expect(html).toContain('md:flex-row')
    expect(html).toContain('whitespace-nowrap')
    expect(html).toContain('data-testid="nav-prompts"')
    expect(html).not.toContain('md:w-16')
  })
})
