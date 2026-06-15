import { DatabaseZap } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl px-4 py-5 sm:px-6 md:pl-64 lg:px-8 lg:pl-64">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-green/35 bg-brand-green/15 shadow-glow">
            <DatabaseZap className="h-5 w-5 text-brand-green" />
          </div>
          <div>
            <h1 className="text-[26px] font-semibold leading-tight tracking-normal text-white">AI选题素材库</h1>
            <p className="mt-1 text-sm text-zinc-400">把优秀短视频转化为可复用的选题资产</p>
          </div>
        </div>
      </div>
    </header>
  )
}
