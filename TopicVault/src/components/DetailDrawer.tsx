import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bookmark,
  BookOpenText,
  FileText,
  Lightbulb,
  ListTree,
  MessageSquareText,
  NotebookPen,
  Sparkles,
  Tags,
  Target,
  X,
} from 'lucide-react'
import { getMaterialTags } from '../lib/materialTags'
import type { Material } from '../types/material'
import { EditableTags } from './EditableTags'

type DetailDrawerProps = {
  material: Material | null
  onClose: () => void
  onTagsChange: (materialId: string, nextTags: string[]) => void
  onNotesChange: (materialId: string, nextNotes: Material['personalNotes']) => void
}

type SectionId = 'tags' | 'notes' | 'transcript' | 'summary' | 'custom' | 'structure' | 'references'

type SectionTitleProps = {
  icon: ReactNode
  title: string
  description?: string
  testId?: string
}

function SectionTitle({ icon, title, description, testId }: SectionTitleProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        data-testid={testId}
        className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-green/20 bg-brand-green/10 text-brand-green"
      >
        {icon}
      </span>
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>}
      </div>
    </div>
  )
}

function InfoCard({ title, children, icon }: { title: string; children: ReactNode; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-green/10 text-brand-green">
          {icon}
        </span>
        {title}
      </div>
      <div className="text-sm leading-7 text-zinc-300">{children}</div>
    </div>
  )
}

export function DetailDrawer({ material, onClose, onTagsChange, onNotesChange }: DetailDrawerProps) {
  const [activeSectionId, setActiveSectionId] = useState<SectionId>('tags')
  const customSections = material?.analysis.customSections ?? []
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    tags: null,
    notes: null,
    transcript: null,
    summary: null,
    custom: null,
    structure: null,
    references: null,
  })

  const directoryItems = useMemo<Array<{ id: SectionId; label: string; icon: ReactNode }>>(
    () =>
      [
        { id: 'tags', label: '分类标签', icon: <Tags className="h-3.5 w-3.5" /> },
        { id: 'notes', label: '个人备注', icon: <NotebookPen className="h-3.5 w-3.5" /> },
        { id: 'transcript', label: '原始文案', icon: <BookOpenText className="h-3.5 w-3.5" /> },
        { id: 'summary', label: '素材摘要', icon: <MessageSquareText className="h-3.5 w-3.5" /> },
        ...(customSections.length > 0
          ? [{ id: 'custom' as const, label: '提示词结构', icon: <Sparkles className="h-3.5 w-3.5" /> }]
          : []),
        { id: 'structure', label: '文案结构', icon: <ListTree className="h-3.5 w-3.5" /> },
        { id: 'references', label: '参考要点', icon: <Lightbulb className="h-3.5 w-3.5" /> },
      ] satisfies Array<{ id: SectionId; label: string; icon: ReactNode }>,
    [customSections.length],
  )

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const scrollContainer = container

    function updateActiveSection() {
      const containerTop = scrollContainer.getBoundingClientRect().top
      let nextSectionId: SectionId = 'tags'

      for (const item of directoryItems) {
        const element = sectionRefs.current[item.id]
        if (!element) continue

        const offset = element.getBoundingClientRect().top - containerTop
        if (offset <= 120) {
          nextSectionId = item.id
        }
      }

      setActiveSectionId(nextSectionId)
    }

    updateActiveSection()
    scrollContainer.addEventListener('scroll', updateActiveSection, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', updateActiveSection)
  }, [directoryItems, material?.id])

  if (!material) return null

  function scrollToSection(sectionId: SectionId) {
    setActiveSectionId(sectionId)
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5">
      <button className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-label="关闭详情" />
      <aside
        data-testid="detail-panel"
        className="relative flex max-h-[calc(100vh-2rem)] w-[min(1280px,calc(100vw-1.5rem))] max-w-7xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#080c0b] shadow-[0_24px_100px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-5 border-b border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-brand-green">
              <span
                data-testid="detail-title-icon"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-green/25 bg-brand-green/10"
              >
                <FileText className="h-4 w-4" />
              </span>
              素材完整详情
            </div>
            <h2 className="max-w-5xl text-2xl font-semibold leading-9 text-white sm:text-3xl sm:leading-10">
              {material.source.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
              <span>作者：{material.source.author}</span>
              <a
                href={material.source.url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-green transition hover:text-emerald-300"
              >
                视频链接
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
            <nav
              data-testid="detail-section-nav"
              className="sticky top-0 hidden self-start rounded-xl border border-white/10 bg-black/25 p-3 lg:block"
              aria-label="详情目录"
            >
              <p className="mb-2 px-2 text-xs font-semibold text-zinc-500">详情目录</p>
              <div className="space-y-1.5">
                {directoryItems.map((item) => {
                  const isActive = activeSectionId === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-section-id={item.id}
                      data-active={isActive}
                      onClick={() => scrollToSection(item.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
                        isActive
                          ? 'border border-brand-green/30 bg-brand-green/12 text-emerald-200 shadow-[inset_3px_0_0_rgba(47,190,95,0.85)]'
                          : 'border border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-200'
                      }`}
                    >
                      <span className={isActive ? 'text-brand-green' : 'text-zinc-600'}>{item.icon}</span>
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </nav>

            <div className="min-w-0 space-y-5">
              <section
                ref={(node) => {
                  sectionRefs.current.tags = node
                }}
                data-section-id="tags"
                className="scroll-mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"
              >
                <SectionTitle
                  icon={<Tags className="h-4 w-4" />}
                  title="分类标签"
                  description="用于后续搜索和筛选，可手动增删。"
                  testId="detail-tags-icon"
                />
                <EditableTags
                  tags={getMaterialTags(material)}
                  onChange={(nextTags) => onTagsChange(material.id, nextTags)}
                  className="max-w-full"
                />
              </section>

              <section
                ref={(node) => {
                  sectionRefs.current.notes = node
                }}
                data-section-id="notes"
                className="scroll-mt-4 rounded-xl border border-brand-green/15 bg-brand-green/[0.035] p-4 sm:p-5"
              >
                <SectionTitle
                  icon={<NotebookPen className="h-4 w-4" />}
                  title="个人备注"
                  description="记录你收藏这条素材时的判断，方便之后搜索和回看。"
                  testId="detail-notes-icon"
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block rounded-xl border border-white/10 bg-black/20 p-4 transition focus-within:border-brand-green/60 focus-within:bg-black/30">
                    <span className="mb-3 flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-green/20 bg-brand-green/10 text-brand-green">
                        <Bookmark className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">收藏原因</span>
                        <span className="mt-1 block text-xs leading-5 text-zinc-500">这条素材为什么值得留下，后面搜索时会更好判断。</span>
                      </span>
                    </span>
                    <textarea
                      key={`${material.id}-collect-reason`}
                      defaultValue={material.personalNotes?.collectReason ?? ''}
                      placeholder="我为什么收藏它"
                      rows={5}
                      onBlur={(event) =>
                        onNotesChange(material.id, {
                          ...material.personalNotes,
                          collectReason: event.currentTarget.value.trim() || undefined,
                        })
                      }
                      className="min-h-[136px] w-full resize-y rounded-xl border border-white/10 bg-[#050807] px-4 py-3 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-brand-green/70"
                    />
                  </label>
                  <label className="block rounded-xl border border-white/10 bg-black/20 p-4 transition focus-within:border-brand-green/60 focus-within:bg-black/30">
                    <span className="mb-3 flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-green/20 bg-brand-green/10 text-brand-green">
                        <Lightbulb className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">选题灵感</span>
                        <span className="mt-1 block text-xs leading-5 text-zinc-500">记录你看到它时想到的拍摄方向，方便之后直接开拍。</span>
                      </span>
                    </span>
                    <textarea
                      key={`${material.id}-topic-inspiration`}
                      defaultValue={material.personalNotes?.topicInspiration ?? ''}
                      placeholder="记录你看到它时想到的拍摄方向"
                      rows={5}
                      onBlur={(event) =>
                        onNotesChange(material.id, {
                          ...material.personalNotes,
                          topicInspiration: event.currentTarget.value.trim() || undefined,
                        })
                      }
                      className="min-h-[136px] w-full resize-y rounded-xl border border-white/10 bg-[#050807] px-4 py-3 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-brand-green/70"
                    />
                  </label>
                </div>
              </section>

              <section
                ref={(node) => {
                  sectionRefs.current.transcript = node
                }}
                data-section-id="transcript"
                className="scroll-mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"
              >
                <SectionTitle
                  icon={<BookOpenText className="h-4 w-4" />}
                  title="原始文案"
                  description="保留视频正文，方便之后直接回看内容。"
                  testId="detail-transcript-icon"
                />
                <div className="max-h-[320px] overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">{material.rawContent.transcript}</p>
                </div>
              </section>

              <section
                ref={(node) => {
                  sectionRefs.current.summary = node
                }}
                data-section-id="summary"
                className="scroll-mt-4 grid gap-4 lg:grid-cols-2"
              >
                <InfoCard title="一句话总结" icon={<MessageSquareText className="h-4 w-4" />}>
                  {material.analysis.oneSentenceSummary}
                </InfoCard>
                <InfoCard title="核心观点" icon={<Target className="h-4 w-4" />}>
                  {material.analysis.coreArgument}
                </InfoCard>
                <InfoCard title="开头钩子" icon={<Sparkles className="h-4 w-4" />}>
                  {material.analysis.hook}
                </InfoCard>
                <InfoCard title="核心痛点" icon={<Lightbulb className="h-4 w-4" />}>
                  {material.analysis.painPoint}
                </InfoCard>
              </section>

              {customSections.length > 0 && (
                <section
                  ref={(node) => {
                    sectionRefs.current.custom = node
                  }}
                  data-section-id="custom"
                  className="scroll-mt-4 rounded-xl border border-brand-green/20 bg-brand-green/[0.035] p-4 sm:p-5"
                >
                  <SectionTitle
                    icon={<Sparkles className="h-4 w-4" />}
                    title="提示词拆解结构"
                    description="根据提示词页面的拆解要求生成，适合承载你自己的复盘框架。"
                  />
                  <div className="grid gap-3 lg:grid-cols-2">
                    {customSections.map((section) => (
                      <article
                        key={`${section.title}-${section.content}`}
                        className="rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <h4 className="text-sm font-semibold text-emerald-200">{section.title}</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{section.content}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section
                ref={(node) => {
                  sectionRefs.current.structure = node
                }}
                data-section-id="structure"
                className="scroll-mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"
              >
                <SectionTitle icon={<ListTree className="h-4 w-4" />} title="文案结构" />
                <div className="space-y-3">
                  {material.analysis.structure.map((step) => (
                    <div key={step.step} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-zinc-950">
                          {step.step}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{step.name}</h4>
                        <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs text-brand-green">
                          {step.function}
                        </span>
                      </div>
                      <p className="text-sm leading-7 text-zinc-300">{step.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section
                ref={(node) => {
                  sectionRefs.current.references = node
                }}
                data-section-id="references"
                className="scroll-mt-4 grid gap-4 lg:grid-cols-2"
              >
                <InfoCard title="可复用写法" icon={<FileText className="h-4 w-4" />}>
                  <ul className="space-y-2">
                    {material.analysis.replicableMethods.map((method) => (
                      <li key={method}>• {method}</li>
                    ))}
                  </ul>
                </InfoCard>
                <InfoCard title="拍摄参考点" icon={<Lightbulb className="h-4 w-4" />}>
                  <ul className="space-y-2">
                    {material.analysis.rewriteAnglesForMyAccount.map((angle) => (
                      <li key={angle}>• {angle}</li>
                    ))}
                  </ul>
                </InfoCard>
              </section>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
