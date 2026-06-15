import { DatabaseZap, FileSearch, LibraryBig, Settings2 } from 'lucide-react'

export type WorkspaceView = 'analysis' | 'library' | 'prompts'

type WorkspaceNavProps = {
  activeView: WorkspaceView
  onChange: (view: WorkspaceView) => void
}

const items: Array<{
  view: WorkspaceView
  label: string
  icon: typeof FileSearch
  testId: string
}> = [
  { view: 'analysis', label: '提取分析', icon: FileSearch, testId: 'nav-analysis' },
  { view: 'library', label: '素材库', icon: LibraryBig, testId: 'nav-library' },
  { view: 'prompts', label: '提示词', icon: Settings2, testId: 'nav-prompts' },
]

export function WorkspaceNav({ activeView, onChange }: WorkspaceNavProps) {
  return (
    <nav
      data-testid="workspace-nav"
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-2xl border border-white/10 bg-[#0b100e]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl md:bottom-auto md:left-6 md:top-7 md:w-60 md:translate-x-0 md:flex-col md:gap-2 md:p-4"
      aria-label="工作区导航"
    >
      <div
        data-testid="workspace-brand"
        className="hidden rounded-2xl border border-brand-green/20 bg-gradient-to-br from-brand-green/[0.11] via-white/[0.035] to-black/20 p-3.5 shadow-inner shadow-white/[0.02] md:flex md:items-center md:gap-3"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-green/35 bg-brand-green/15 shadow-glow">
          <DatabaseZap className="h-5 w-5 text-brand-green" />
        </div>
        <div className="min-w-0">
          <p className="whitespace-nowrap text-base font-semibold leading-tight text-white">AI选题素材库</p>
          <p className="mt-1 truncate text-[11px] text-zinc-400">短视频选题资产工作台</p>
        </div>
      </div>
      <div className="hidden h-px bg-white/10 md:block" />
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeView === item.view

        return (
          <button
            key={item.view}
            data-testid={item.testId}
            type="button"
            onClick={() => onChange(item.view)}
            className={`group flex h-14 min-w-16 flex-col items-center justify-center gap-1 rounded-xl border px-3 text-[11px] font-medium transition md:h-12 md:w-full md:flex-row md:justify-start md:gap-3 md:px-3.5 md:text-sm ${
              isActive
                ? 'border-brand-green/55 bg-brand-green/15 text-emerald-200 shadow-glow'
                : 'border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-200'
            }`}
            aria-pressed={isActive}
            aria-label={item.label}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap leading-none">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
