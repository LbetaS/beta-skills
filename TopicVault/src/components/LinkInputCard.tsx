import { Link2, Loader2, Sparkles } from 'lucide-react'

type LinkInputCardProps = {
  url: string
  remark: string
  error: string
  isLoading: boolean
  progress?: number
  statusMessage?: string
  onUrlChange: (value: string) => void
  onRemarkChange: (value: string) => void
  onSubmit: () => void
}

export function LinkInputCard({
  url,
  remark,
  error,
  isLoading,
  progress,
  statusMessage,
  onUrlChange,
  onRemarkChange,
  onSubmit,
}: LinkInputCardProps) {
  const visibleProgress =
    typeof progress === 'number'
      ? Math.round(Math.min(Math.max(progress <= 1 && progress > 0 ? progress * 100 : progress, 0), 100))
      : null

  return (
    <section className="surface-panel p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="section-icon">
          <Link2 className="h-5 w-5" />
        </span>
        <div>
        <h2 className="text-xl font-semibold text-white">链接输入</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">粘贴短视频链接，自动提取文案、拆解结构并保存到素材库。</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px_auto] lg:items-end">
        <label className="space-y-2">
          <span className="text-sm text-zinc-300">抖音视频链接</span>
          <input
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="请输入抖音视频链接"
            className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-brand-green/60"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-zinc-300">标签备注</span>
          <input
            value={remark}
            onChange={(event) => onRemarkChange(event.target.value)}
            placeholder="ChatGPT / AI提示词 / 开头不错"
            className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-brand-green/60"
          />
        </label>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-green px-5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isLoading ? '入库中...' : '提取并分析入库'}
        </button>
      </div>
      {isLoading && (statusMessage || visibleProgress !== null) && (
        <div className="mt-4 rounded-lg border border-brand-green/20 bg-brand-green/5 p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-zinc-300">{statusMessage || '任务处理中...'}</span>
            {visibleProgress !== null && <span className="text-brand-green">{visibleProgress}%</span>}
          </div>
          {visibleProgress !== null && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-brand-green transition-all"
                style={{ width: `${visibleProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  )
}
