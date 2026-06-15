import type { ReactNode } from 'react'
import { ArrowUpRight, Eye, Trash2 } from 'lucide-react'
import { getMaterialTags } from '../lib/materialTags'
import { splitVideoTitle } from '../lib/videoTitle'
import type { Material } from '../types/material'
import { EditableTags } from './EditableTags'

type MaterialListProps = {
  materials: Material[]
  overviewStats?: {
    total: number
    recent: number
    toolCount: number
  }
  filtersSlot?: ReactNode
  highlightedId: string | null
  onView: (material: Material) => void
  onDelete: (id: string) => void
  onTagsChange: (materialId: string, nextTags: string[]) => void
  onToolsChange?: (materialId: string, nextTools: string[]) => void
}

export function MaterialList({
  materials,
  overviewStats,
  filtersSlot,
  highlightedId,
  onView,
  onDelete,
  onTagsChange,
  onToolsChange = () => undefined,
}: MaterialListProps) {
  function renderTitleBlock(material: Material, titleClassName = 'line-clamp-2 text-base font-semibold leading-6 text-white') {
    const { title, topics } = splitVideoTitle(material.source.title)

    return (
      <>
        <h3 className={titleClassName}>{title}</h3>
        {topics.length > 0 && (
          <div data-testid="material-title-topics" className="mt-2 flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-zinc-400"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </>
    )
  }

  function renderActions(material: Material) {
    return (
      <div
        data-testid="material-actions"
        className="inline-flex w-[112px] shrink-0 items-center justify-center gap-1 rounded-full border border-white/10 bg-[#070b09] p-1 shadow-inner shadow-black/30"
      >
        <button
          onClick={() => onView(material)}
          aria-label="查看详情"
          title="查看详情"
          className="inline-flex h-8 w-[70px] items-center justify-center gap-1 whitespace-nowrap rounded-full bg-brand-green/12 px-2 text-xs font-semibold text-emerald-200 transition hover:bg-brand-green/20 hover:text-white"
        >
          <Eye className="h-3.5 w-3.5 shrink-0" />
          详情
        </button>
        <button
          onClick={() => onDelete(material.id)}
          aria-label="删除素材"
          title="删除素材"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-[1480px] space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">素材库</h2>
          <p className="mt-1 text-sm text-zinc-500">
            用表格快速扫标题、工具、标签和来源信息，共 {materials.length} 条素材
          </p>
        </div>
        {overviewStats && (
          <div
            data-testid="material-overview"
            className="grid w-full grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-brand-panel/80 p-2 lg:w-[380px]"
          >
            <div className="rounded-md bg-black/25 px-3 py-2">
              <p className="text-[11px] text-zinc-500">素材总数</p>
              <p data-testid="overview-total" className="mt-0.5 text-lg font-semibold text-white">
                {overviewStats.total}
              </p>
            </div>
            <div className="rounded-md bg-black/25 px-3 py-2">
              <p className="text-[11px] text-zinc-500">最新素材</p>
              <p data-testid="overview-recent" className="mt-0.5 text-lg font-semibold text-brand-green">
                {overviewStats.recent}
              </p>
            </div>
            <div className="rounded-md bg-black/25 px-3 py-2">
              <p className="text-[11px] text-zinc-500">工具类</p>
              <p data-testid="overview-tool-count" className="mt-0.5 text-lg font-semibold text-white">
                {overviewStats.toolCount}
              </p>
            </div>
          </div>
        )}
      </div>
      {filtersSlot}

      {materials.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-brand-panel p-8 text-center text-sm text-zinc-500">
          当前筛选条件下没有素材。
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-brand-panel shadow-[0_18px_60px_rgba(0,0,0,0.22)] md:block">
            <div className="min-w-0">
              <table data-testid="material-table" className="w-full min-w-0 table-fixed border-collapse">
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[14%]" />
                  <col className="w-[25%]" />
                  <col className="w-[17%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="sticky top-0 z-20 border-b border-brand-green/20 bg-gradient-to-r from-[#17201b] via-[#121a16] to-[#0d1310] text-xs font-semibold text-zinc-300 shadow-[0_10px_28px_rgba(0,0,0,0.28)] backdrop-blur">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-green/80" />
                        标题
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-green/50" />
                        工具
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-green/50" />
                        标签
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-green/50" />
                        作者 / 时间
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-green/50" />
                        操作
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {materials.map((material) => {
                    const tags = getMaterialTags(material)

                    return (
                      <tr
                        key={material.id}
                        className={`align-top transition ${
                          highlightedId === material.id ? 'bg-brand-green/10 shadow-glow' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="px-6 py-5">
                          <div className="min-w-0">
                            {renderTitleBlock(material)}
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
                              {material.analysis.coreArgument}
                            </p>
                            <a
                              href={material.source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-green hover:text-emerald-300"
                            >
                              视频链接
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <div data-testid="material-tools-editor">
                            <EditableTags
                              tags={material.classification.toolCategory}
                              onChange={(nextTools) => onToolsChange(material.id, nextTools)}
                              addLabel="添加"
                              layout="vertical"
                              className="max-w-[120px] [&>button]:h-7 [&>button]:w-fit [&>button]:whitespace-nowrap [&>button]:border-brand-green/25 [&>button]:bg-brand-green/[0.04] [&>button]:px-2.5 [&>button]:text-[11px] [&_input]:min-w-0 [&_input]:w-20 [&_span>button]:text-zinc-500 [&_span]:min-h-7 [&_span]:w-fit [&_span]:max-w-[116px] [&_span]:whitespace-nowrap [&_span]:border-brand-green/20 [&_span]:bg-brand-green/[0.08] [&_span]:px-2.5 [&_span]:py-0.5 [&_span]:text-[11px] [&_span]:text-emerald-200"
                            />
                          </div>
                        </td>
                        <td className="min-w-0 px-4 py-5">
                          <div data-testid="material-tags-editor">
                            <EditableTags
                              tags={tags}
                              onChange={(nextTags) => onTagsChange(material.id, nextTags)}
                              addLabel="添加"
                              layout="two-column"
                              className="max-w-[292px] [&>button]:h-7 [&>button]:w-fit [&>button]:justify-center [&>button]:whitespace-nowrap [&>button]:border-brand-green/25 [&>button]:bg-brand-green/[0.04] [&>button]:px-2.5 [&>button]:text-[11px] [&_input]:!min-w-0 [&_input]:!w-20 [&_span]:min-h-7 [&_span]:w-fit [&_span]:max-w-[132px] [&_span]:justify-between [&_span]:truncate [&_span]:px-2.5 [&_span]:py-0.5 [&_span]:text-[11px] [&_span>button]:shrink-0 [&_span>button]:text-zinc-500"
                            />
                          </div>
                        </td>
                        <td data-testid="material-meta" className="px-4 py-5">
                          <div className="min-w-0 space-y-1.5">
                            <p className="line-clamp-2 break-keep text-sm leading-6 text-zinc-200">
                              {material.source.author}
                            </p>
                            <p className="text-xs leading-5 text-zinc-500">{material.createdAt}</p>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex justify-start">{renderActions(material)}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div data-testid="material-mobile-list" className="grid gap-3 md:hidden">
            {materials.map((material) => (
              <article
                key={material.id}
                className={`rounded-lg border bg-brand-panel p-4 transition ${
                  highlightedId === material.id
                    ? 'border-brand-green/70 shadow-glow'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {renderTitleBlock(material, 'text-base font-semibold leading-6 text-white')}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                  <span>作者：{material.source.author}</span>
                  <span>创建时间：{material.createdAt}</span>
                </div>
                <div data-testid="material-tools-editor" className="mt-4">
                  <p className="mb-2 text-xs font-medium text-zinc-500">工具</p>
                  <EditableTags
                    tags={material.classification.toolCategory}
                    onChange={(nextTools) => onToolsChange(material.id, nextTools)}
                    addLabel="添加"
                    layout="vertical"
                    className="max-w-full [&>button]:h-6 [&>button]:w-fit [&>button]:whitespace-nowrap [&>button]:border-brand-green/25 [&>button]:bg-brand-green/[0.04] [&>button]:px-2 [&>button]:text-[11px] [&_input]:min-w-0 [&_input]:w-20 [&_span>button]:text-zinc-500 [&_span]:min-h-6 [&_span]:w-fit [&_span]:whitespace-nowrap [&_span]:border-brand-green/20 [&_span]:bg-brand-green/[0.08] [&_span]:px-2.5 [&_span]:py-0.5 [&_span]:text-[11px] [&_span]:text-emerald-200"
                  />
                </div>
                <div data-testid="material-tags-editor" className="mt-4">
                  <EditableTags
                    tags={getMaterialTags(material)}
                    onChange={(nextTags) => onTagsChange(material.id, nextTags)}
                    addLabel="添加"
                    layout="two-column"
                    className="max-w-[260px] [&>button]:h-6 [&>button]:w-fit [&>button]:justify-center [&>button]:whitespace-nowrap [&>button]:border-brand-green/25 [&>button]:bg-brand-green/[0.04] [&>button]:px-2 [&>button]:text-[11px] [&_input]:!min-w-0 [&_input]:!w-20 [&_span]:min-h-6 [&_span]:w-fit [&_span]:max-w-[118px] [&_span]:justify-between [&_span]:truncate [&_span]:px-2.5 [&_span]:py-0.5 [&_span]:text-[11px] [&_span>button]:shrink-0 [&_span>button]:text-zinc-500"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <a
                    href={material.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-green hover:text-emerald-300"
                  >
                    视频链接
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  {renderActions(material)}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
