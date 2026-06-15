import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Header } from './Header'

describe('Header', () => {
  it('does not render Feishu sync actions', () => {
    const html = renderToStaticMarkup(<Header />)

    expect(html).toContain('AI选题素材库')
    expect(html).toContain('md:pl-64')
    expect(html).not.toContain('同步到飞书')
    expect(html).not.toContain('飞书')
  })
})
