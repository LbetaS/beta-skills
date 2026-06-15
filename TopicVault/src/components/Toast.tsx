import { CheckCircle2 } from 'lucide-react'

type ToastProps = {
  message: string
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-brand-green/30 bg-zinc-950/95 px-4 py-3 text-sm text-zinc-100 shadow-glow backdrop-blur">
      <CheckCircle2 className="h-4 w-4 text-brand-green" />
      {message}
    </div>
  )
}
