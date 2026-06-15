import { CheckCircle2, RotateCcw, Save, Settings2, SlidersHorizontal } from 'lucide-react'

type PromptSettingsPageProps = {
  prompt: string
  defaultPrompt: string
  onChange: (value: string) => void
  onSave: () => void
  onReset: () => void
}

const writingTips = [
  ['明确素材用途', '例如：用于收藏看到的好视频，之后按关键词、标签和原文案检索。'],
  ['指定拆解框架', '例如：内容摘要、核心观点、开头钩子、正文结构、情绪推进。'],
  ['说明输出偏好', '例如：更重视搜索标签、原文依据、可参考点，不需要生成改写稿。'],
  ['保持结构稳定', '避免要求模型输出额外说明，减少素材入库失败。'],
]

export function PromptSettingsPage({
  prompt,
  defaultPrompt,
  onChange,
  onSave,
  onReset,
}: PromptSettingsPageProps) {
  return (
    <section data-testid="prompt-workspace" className="mx-auto max-w-[1280px] space-y-5">
      <div className="surface-panel p-6">
        <div className="flex items-start gap-4">
          <span className="section-icon">
            <SlidersHorizontal size={18} />
          </span>
          <div>
          <p className="text-sm font-medium text-brand-green">文案拆解设置</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">拆解分析提示词</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            设置后，每次提取文案并生成分析时，系统都会带上这段规则，用来统一拆解维度、标签和拍摄参考点。
          </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface-panel p-5">
          <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
                  <Settings2 size={18} />
                </span>
                <h3 className="text-base font-semibold text-white">提示词内容</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                建议写清素材用途、拆解框架、标签规则和不需要的输出内容。保存后，新分析会自动使用。
              </p>
            </div>
            <span
              data-testid="prompt-custom-badge"
              className="inline-flex h-8 w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-green/20 bg-brand-green/10 px-3 text-xs font-medium text-emerald-200 shadow-inner shadow-black/20"
            >
              <SlidersHorizontal size={13} />
              可自定义
            </span>
          </div>
          <textarea
            data-testid="custom-system-prompt"
            value={prompt}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-[440px] w-full resize-y rounded-2xl border border-white/10 bg-[#050807] p-5 text-sm leading-8 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-brand-green/60"
            placeholder={defaultPrompt}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSave}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-green px-5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
            >
              <Save size={17} />
              保存设置
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-5 text-sm text-zinc-300 transition hover:border-brand-green/40 hover:text-brand-green"
            >
              <RotateCcw size={17} />
              恢复默认提示词
            </button>
          </div>
        </section>

        <aside className="surface-panel p-5 xl:self-start">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
              <CheckCircle2 size={18} />
            </span>
            <h3 className="text-base font-semibold text-white">写法参考</h3>
          </div>
          <div className="mt-5 space-y-4">
            {writingTips.map(([title, description], index) => (
              <div key={title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-xs font-semibold text-brand-green">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
