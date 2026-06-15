import { useState } from 'react'
import {
  ArrowUpRight,
  Bookmark,
  FileText,
  Lightbulb,
  ListTree,
  NotebookPen,
  PenLine,
  Repeat2,
  ScrollText,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { getMaterialTags } from '../lib/materialTags'
import { splitVideoTitle } from '../lib/videoTitle'
import type { Material } from '../types/material'
import { EditableTags } from './EditableTags'
import { Tag } from './Tag'

type AnalysisPreviewProps = {
  material: Material | null
  onTagsChange: (materialId: string, nextTags: string[]) => void
  onNotesChange?: (materialId: string, nextNotes: Material['personalNotes']) => void
}

type DetailTab = 'raw' | 'structure' | 'rewrite'

const detailTabs: { id: DetailTab; label: string }[] = [
  { id: 'raw', label: '原文案' },
  { id: 'structure', label: '文案结构' },
  { id: 'rewrite', label: '参考点' },
]

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="surface-card p-4 transition hover:border-white/15 hover:bg-black/25">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-green/15 bg-brand-green/10 text-brand-green">
          {icon}
        </span>
        {title}
      </div>
      <div className="text-sm leading-7 text-zinc-300">{children}</div>
    </div>
  )
}

function InsightCard({
  icon,
  title,
  children,
  testId,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  testId?: string
}) {
  return (
    <div data-testid={testId} className="surface-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="section-icon">
          {icon}
        </span>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InsightRow({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <li
      data-testid={testId}
      className="rounded-lg border border-white/10 bg-white/[0.025] px-4 py-3 text-sm leading-7 text-zinc-300"
    >
      {children}
    </li>
  )
}

export function AnalysisPreview({ material, onTagsChange, onNotesChange = () => undefined }: AnalysisPreviewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('raw')

  if (!material) {
    return (
      <section className="surface-panel border-dashed p-8 text-center">
        <p className="text-sm text-zinc-500">提交链接后，这里会展示最新的视频文案拆解结果。</p>
      </section>
    )
  }

  const videoTitle = splitVideoTitle(material.source.title)
  const customSections = material.analysis.customSections ?? []

  return (
    <section className="surface-panel flex flex-col border-brand-green/20 bg-gradient-to-br from-[#101813] via-[#0d1412] to-[#08100d] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="green">最新分析</Tag>
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">选题素材已入库</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">已提取原文案，并整理成摘要、结构、标签和拍摄参考点。</p>
        </div>
      </div>

      <div data-testid="analysis-title-card" className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-inner shadow-black/20">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-green/80">原视频信息</p>
        <h3 className="max-w-6xl text-2xl font-semibold leading-snug text-white md:text-3xl">{videoTitle.title}</h3>
        {videoTitle.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {videoTitle.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-zinc-400"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
          <span>作者：{material.source.author}</span>
          <a
            href={material.source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand-green transition hover:text-emerald-300"
          >
            视频链接
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div data-testid="analysis-inline-tags" className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
            素材标签
          </h4>
          <p className="mt-1 mb-3 text-xs font-medium text-zinc-500">用于后续搜索和筛选，可手动编辑。</p>
          <EditableTags tags={getMaterialTags(material)} onChange={(nextTags) => onTagsChange(material.id, nextTags)} />
        </div>
      </div>

      <section
        data-testid="analysis-personal-notes"
        className="mb-6 rounded-2xl border border-brand-green/15 bg-brand-green/[0.035] p-4 sm:p-5"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="section-icon mt-0.5">
            <NotebookPen className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-white">个人备注</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">提取完成后直接记录你的判断，素材库和详情会同步保存。</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label
            data-testid="analysis-note-field-reason"
            className="block rounded-xl border border-white/10 bg-black/20 p-4 transition focus-within:border-brand-green/60 focus-within:bg-black/30"
          >
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
              key={`${material.id}-analysis-collect-reason`}
              defaultValue={material.personalNotes?.collectReason ?? ''}
              placeholder="我为什么收藏它"
              rows={4}
              onBlur={(event) =>
                onNotesChange(material.id, {
                  ...material.personalNotes,
                  collectReason: event.currentTarget.value.trim() || undefined,
                })
              }
              className="min-h-[118px] w-full resize-y rounded-xl border border-white/10 bg-[#050807] px-4 py-3 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-brand-green/70"
            />
          </label>
          <label
            data-testid="analysis-note-field-inspiration"
            className="block rounded-xl border border-white/10 bg-black/20 p-4 transition focus-within:border-brand-green/60 focus-within:bg-black/30"
          >
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
              key={`${material.id}-analysis-topic-inspiration`}
              defaultValue={material.personalNotes?.topicInspiration ?? ''}
              placeholder="记录你看到它时想到的拍摄方向"
              rows={4}
              onBlur={(event) =>
                onNotesChange(material.id, {
                  ...material.personalNotes,
                  topicInspiration: event.currentTarget.value.trim() || undefined,
                })
              }
              className="min-h-[118px] w-full resize-y rounded-xl border border-white/10 bg-[#050807] px-4 py-3 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-brand-green/70"
            />
          </label>
        </div>
      </section>

      <div className="mb-3 flex items-start gap-3">
        <span className="section-icon h-9 w-9 rounded-lg">
          <FileText className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">素材摘要</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">以后检索素材时，先看这里快速回忆这条视频讲了什么。</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={<FileText className="h-4 w-4" />} title="一句话总结">
          {material.analysis.oneSentenceSummary}
        </InfoCard>
        <InfoCard icon={<Target className="h-4 w-4" />} title="核心观点">
          {material.analysis.coreArgument}
        </InfoCard>
        <InfoCard icon={<Lightbulb className="h-4 w-4" />} title="开头钩子">
          {material.analysis.hook}
        </InfoCard>
      </div>

      {customSections.length > 0 && (
        <section
          data-testid="analysis-custom-sections"
          className="order-last mt-5 rounded-2xl border border-brand-green/20 bg-brand-green/[0.035] p-4 sm:p-5"
        >
          <div className="mb-4 flex items-start gap-3">
            <span className="section-icon mt-0.5 h-9 w-9 rounded-lg">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">提示词拆解结构</h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                根据提示词页面的拆解要求生成，基础信息、标签和原文案仍保持固定。
              </p>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {customSections.map((section) => (
              <article key={`${section.title}-${section.content}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h4 className="text-sm font-semibold text-emerald-200">{section.title}</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{section.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <div data-testid="analysis-tabs" className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {detailTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-brand-green/45 bg-brand-green/15 text-emerald-200'
                  : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:border-brand-green/35 hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'raw' && (
          <div className="pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
                  <ScrollText className="h-4 w-4" />
                </span>
                原文案
              </div>
              {material.rawContent.description && (
                <span className="hidden max-w-md truncate text-xs text-zinc-500 sm:inline">
                  {material.rawContent.description}
                </span>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-[#050807] p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {material.rawContent.transcript}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="pt-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
                <ListTree className="h-4 w-4" />
              </span>
              文案结构
            </div>
            <div data-testid="structure-timeline" className="space-y-3">
              {material.analysis.structure.map((step) => (
                <div
                  key={step.step}
                  data-testid="structure-step"
                  className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-brand-green/35 sm:grid-cols-[176px_minmax(0,1fr)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-zinc-950">
                      {step.step}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-6 text-white">{step.name}</p>
                      <p className="mt-1 text-xs leading-5 text-brand-green">{step.function}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-zinc-300">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rewrite' && (
          <div data-testid="rewrite-insights-grid" className="grid gap-5 pt-4 xl:grid-cols-2">
            <InsightCard
              testId="rewrite-audience-card"
              icon={<Target className="h-5 w-5" />}
              title="核心痛点"
            >
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-medium text-brand-green">这条素材主要解决的问题</p>
                <p className="mt-2 text-sm leading-7 text-zinc-300">{material.analysis.painPoint}</p>
              </div>
            </InsightCard>

            <InsightCard
              testId="rewrite-emotion-card"
              icon={<TrendingUp className="h-5 w-5" />}
              title="情绪推进"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {material.analysis.emotionalCurve.map((emotion, index) => (
                  <div
                    key={emotion}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        index === 0 ? 'bg-brand-green text-zinc-950' : 'bg-white/[0.06] text-zinc-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-zinc-300">{emotion}</span>
                  </div>
                ))}
              </div>
            </InsightCard>

            <InsightCard
              testId="rewrite-methods-card"
              icon={<Repeat2 className="h-5 w-5" />}
              title="可复用写法"
            >
              <ul className="space-y-3">
                {material.analysis.replicableMethods.map((method) => (
                  <InsightRow key={method} testId="rewrite-method-item">
                    {method}
                  </InsightRow>
                ))}
              </ul>
            </InsightCard>

            <InsightCard
              testId="rewrite-angles-card"
              icon={<PenLine className="h-5 w-5" />}
              title="拍摄参考点"
            >
              <ul className="space-y-3">
                {material.analysis.rewriteAnglesForMyAccount.map((angle) => (
                  <InsightRow key={angle} testId="rewrite-angle-item">
                    {angle}
                  </InsightRow>
                ))}
              </ul>
            </InsightCard>
          </div>
        )}
      </div>

    </section>
  )
}
