import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LinkInputCard } from './LinkInputCard'

describe('LinkInputCard', () => {
  it('shows tag remark as placeholder instead of a prefilled value', () => {
    const html = renderToStaticMarkup(
      <LinkInputCard
        url=""
        remark=""
        error=""
        isLoading={false}
        onUrlChange={() => undefined}
        onRemarkChange={() => undefined}
        onSubmit={() => undefined}
      />,
    )

    expect(html).toContain('标签备注')
    expect(html).toContain('自动提取文案、拆解结构并保存到素材库')
    expect(html).toContain('提取并分析入库')
    expect(html).toContain('placeholder="ChatGPT / AI提示词 / 开头不错"')
    expect(html).not.toContain('value="ChatGPT / AI提示词 / 开头不错"')
    expect(html).not.toContain('分类备注')
  })
})
