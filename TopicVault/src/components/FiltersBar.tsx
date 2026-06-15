import { Search } from 'lucide-react'
import { toolOptions } from '../constants/filters'
import type { Filters } from '../types/material'

type FiltersBarProps = {
  filters: Filters
  tagOptions: string[]
  onChange: (filters: Filters) => void
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none transition focus:border-brand-green/60"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-zinc-950">
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FiltersBar({ filters, tagOptions, onChange }: FiltersBarProps) {
  return (
    <div className="surface-panel p-4">
      <div className="grid gap-3 xl:grid-cols-[220px_260px_1fr]">
        <SelectField
          label="按工具筛选"
          value={filters.tool}
          options={toolOptions}
          onChange={(tool) => onChange({ ...filters, tool })}
        />
        <SelectField
          label="按标签筛选"
          value={filters.tag}
          options={tagOptions}
          onChange={(tag) => onChange({ ...filters, tag })}
        />
        <label className="space-y-2">
          <span className="text-xs text-zinc-500">搜索</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              value={filters.search}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              placeholder="搜索标题、核心观点、标签"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-brand-green/60"
            />
          </div>
        </label>
      </div>
    </div>
  )
}
