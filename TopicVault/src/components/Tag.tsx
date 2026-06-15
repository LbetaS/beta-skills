type TagProps = {
  children: React.ReactNode
  tone?: 'green' | 'gray' | 'yellow' | 'outline'
}

export function Tag({ children, tone = 'gray' }: TagProps) {
  const toneClass = {
    green: 'border-brand-green/35 bg-brand-green/15 text-emerald-200',
    gray: 'border-white/10 bg-white/[0.06] text-zinc-300',
    yellow: 'border-yellow-400/25 bg-yellow-400/10 text-yellow-200',
    outline: 'border-brand-green/30 bg-transparent text-brand-green',
  }[tone]

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  )
}
