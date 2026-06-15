import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { AnalysisPreview } from './components/AnalysisPreview'
import { DetailDrawer } from './components/DetailDrawer'
import { FiltersBar } from './components/FiltersBar'
import { LinkInputCard } from './components/LinkInputCard'
import { MaterialList } from './components/MaterialList'
import { PromptSettingsPage } from './components/PromptSettingsPage'
import { Toast } from './components/Toast'
import { WorkspaceNav, type WorkspaceView } from './components/WorkspaceNav'
import { mockMaterials } from './data/mockMaterials'
import { filterMaterials } from './lib/filterMaterials'
import { getMaterialTags, normalizeTags, withMaterialTags } from './lib/materialTags'
import { analyzeScript } from './lib/scriptAnalyzerApi'
import { applyVideoMetadataToMaterial } from './lib/videoMetadata'
import { getTaskStatus, startVideoLinkProcessing } from './lib/videoLinkTranscriberApi'
import type { Filters, Material } from './types/material'

const MATERIALS_STORAGE_KEY = 'ai-video-material-library:materials'
const ANALYSIS_SYSTEM_PROMPT_STORAGE_KEY = 'ai-video-material-library:analysis-system-prompt'
const APP_ZOOM_STORAGE_KEY = 'ai-video-material-library:app-zoom'
const POLLING_INTERVAL_MS = 2000
const ZOOM_LEVELS = [0.8, 0.9, 1, 1.1, 1.2]
const DEFAULT_ZOOM = 1
const mockMaterialById = new Map(mockMaterials.map((material) => [material.id, material]))
const DEFAULT_ANALYSIS_SYSTEM_PROMPT =
  '请把短视频文案整理成可检索的选题素材，重点关注内容摘要、核心观点、开头钩子、文案结构、情绪推进、可复用写法、标签分类和拍摄参考点。不要输出发布时间、适合什么账号参考、为什么值得收藏。输出必须保持可被程序读取的结构化格式，不要输出额外说明。'

type LinkExtractionState = {
  taskId?: string
  progress?: number
  message?: string
}

function loadInitialMaterials() {
  try {
    const savedMaterials = window.localStorage.getItem(MATERIALS_STORAGE_KEY)
    if (!savedMaterials) {
      return mockMaterials
    }

    const parsed = JSON.parse(savedMaterials) as Material[]
    if (!Array.isArray(parsed)) {
      return mockMaterials
    }

    return parsed.map((material) => {
      const hydratedMaterial = withMaterialTags(material)
      const latestMock = mockMaterialById.get(hydratedMaterial.id)

      if (hydratedMaterial.analysis.customSections?.length || !latestMock?.analysis.customSections?.length) {
        return hydratedMaterial
      }

      return {
        ...hydratedMaterial,
        analysis: {
          ...hydratedMaterial.analysis,
          customSections: latestMock.analysis.customSections,
        },
      }
    })
  } catch {
    return mockMaterials
  }
}

function loadInitialZoom() {
  const savedZoom = Number(window.localStorage.getItem(APP_ZOOM_STORAGE_KEY))
  return ZOOM_LEVELS.includes(savedZoom) ? savedZoom : DEFAULT_ZOOM
}

function App() {
  const [materials, setMaterials] = useState<Material[]>(loadInitialMaterials)
  const [appZoom, setAppZoom] = useState(loadInitialZoom)
  const [activeView, setActiveView] = useState<WorkspaceView>('analysis')
  const [analysisSystemPrompt, setAnalysisSystemPrompt] = useState(
    () => window.localStorage.getItem(ANALYSIS_SYSTEM_PROMPT_STORAGE_KEY) || DEFAULT_ANALYSIS_SYSTEM_PROMPT,
  )
  const [latestMaterialId, setLatestMaterialId] = useState<string | null>(() => loadInitialMaterials()[0]?.id ?? null)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    tool: '全部',
    tag: '全部',
    search: '',
  })
  const [url, setUrl] = useState('')
  const [remark, setRemark] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [extractionState, setExtractionState] = useState<LinkExtractionState | null>(null)
  const [toast, setToast] = useState('')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const filteredMaterials = useMemo(() => filterMaterials(materials, filters), [materials, filters])
  const tagOptions = useMemo(
    () => ['全部', ...Array.from(new Set(materials.flatMap((material) => getMaterialTags(material)))).sort()],
    [materials],
  )
  const latestMaterial = useMemo(
    () => materials.find((material) => material.id === latestMaterialId) ?? null,
    [latestMaterialId, materials],
  )
  const selectedMaterial = useMemo(
    () => materials.find((material) => material.id === selectedMaterialId) ?? null,
    [materials, selectedMaterialId],
  )
  const overviewStats = useMemo(
    () => ({
      total: materials.length,
      recent: materials.slice(0, 7).length,
      toolCount: new Set(materials.flatMap((item) => item.classification.toolCategory)).size,
    }),
    [materials],
  )

  useEffect(() => {
    window.localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials))
  }, [materials])

  useEffect(() => {
    window.localStorage.setItem(APP_ZOOM_STORAGE_KEY, String(appZoom))
  }, [appZoom])

  useEffect(() => {
    function handleZoomShortcut(event: KeyboardEvent) {
      if (!event.ctrlKey && !event.metaKey) {
        return
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        updateZoom(1)
      }
      if (event.key === '-') {
        event.preventDefault()
        updateZoom(-1)
      }
      if (event.key === '0') {
        event.preventDefault()
        setAppZoom(DEFAULT_ZOOM)
      }
    }

    window.addEventListener('keydown', handleZoomShortcut)
    return () => window.removeEventListener('keydown', handleZoomShortcut)
  }, [])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
  }

  async function handleAnalyze() {
    if (!url.trim()) {
      setError('请输入抖音视频链接')
      return
    }

    const inputUrl = url.trim()

    setError('')
    setIsLoading(true)
    setExtractionState({ progress: 0, message: '正在创建链接提取任务...' })

    try {
      const task = await startVideoLinkProcessing(inputUrl)
      setExtractionState({
        taskId: task.task_id,
        progress: 0,
        message: task.message || '任务已创建，正在处理中...',
      })

      let isCompleted = false

      while (!isCompleted) {
        await wait(POLLING_INTERVAL_MS)
        const status = await getTaskStatus(task.task_id)

        if (status.status === 'processing') {
          setExtractionState({
            taskId: task.task_id,
            progress: status.progress,
            message: status.message || '正在提取视频文案...',
          })
          continue
        }

        if (status.status === 'error') {
          throw new Error(status.error || status.message || '视频文案提取失败')
        }

        setExtractionState({
          taskId: task.task_id,
          progress: 96,
          message: '文案已提取，正在调用大模型拆解分析...',
        })

        const analysisResult = await analyzeScript({
          url: inputUrl,
          transcript: status.script || '',
          remark,
          summary: status.summary,
          customSystemPrompt: analysisSystemPrompt,
        })
        const materialWithTranscript: Material = withMaterialTags(
          applyVideoMetadataToMaterial(analysisResult.material, status.video_metadata),
        )

        setExtractionState({
          taskId: task.task_id,
          progress: status.progress ?? 100,
          message: status.message || '文案提取完成',
        })
        setMaterials((current) => [materialWithTranscript, ...current])
        setLatestMaterialId(materialWithTranscript.id)
        setHighlightedId(materialWithTranscript.id)
        setUrl('')
        showToast('已提取并分析入库')
        window.setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
        window.setTimeout(() => setHighlightedId(null), 3200)
        isCompleted = true
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '视频文案提取失败')
    } finally {
      setIsLoading(false)
      setExtractionState(null)
    }
  }

  function handleDelete(id: string) {
    const target = materials.find((item) => item.id === id)
    if (!target) return

    const confirmed = window.confirm(`确认删除素材「${target.source.title}」吗？`)
    if (!confirmed) return

    setMaterials((current) => current.filter((item) => item.id !== id))
    if (latestMaterialId === id) {
      setLatestMaterialId(null)
    }
    if (selectedMaterialId === id) {
      setSelectedMaterialId(null)
    }
    showToast('素材已删除')
  }

  function handleTagsChange(materialId: string, nextTags: string[]) {
    setMaterials((current) =>
      current.map((material) =>
        material.id === materialId ? { ...material, tags: normalizeTags(nextTags) } : material,
      ),
    )
  }

  function handleToolsChange(materialId: string, nextTools: string[]) {
    setMaterials((current) =>
      current.map((material) =>
        material.id === materialId
          ? {
              ...material,
              classification: {
                ...material.classification,
                toolCategory: normalizeTags(nextTools),
              },
            }
          : material,
      ),
    )
  }

  function handleNotesChange(materialId: string, nextNotes: Material['personalNotes']) {
    setMaterials((current) =>
      current.map((material) =>
        material.id === materialId
          ? {
              ...material,
              personalNotes: {
                ...material.personalNotes,
                ...nextNotes,
              },
            }
          : material,
      ),
    )
  }

  function handleSaveAnalysisPrompt() {
    window.localStorage.setItem(ANALYSIS_SYSTEM_PROMPT_STORAGE_KEY, analysisSystemPrompt)
    showToast('提示词已保存')
  }

  function handleResetAnalysisPrompt() {
    setAnalysisSystemPrompt(DEFAULT_ANALYSIS_SYSTEM_PROMPT)
    window.localStorage.setItem(ANALYSIS_SYSTEM_PROMPT_STORAGE_KEY, DEFAULT_ANALYSIS_SYSTEM_PROMPT)
    showToast('已恢复默认提示词')
  }

  function updateZoom(direction: -1 | 1) {
    setAppZoom((current) => {
      const currentIndex = ZOOM_LEVELS.indexOf(current)
      const nextIndex = Math.min(Math.max(currentIndex + direction, 0), ZOOM_LEVELS.length - 1)
      return ZOOM_LEVELS[nextIndex]
    })
  }

  return (
    <div
      data-testid="app-zoom-root"
      className="app-zoom-root min-h-screen bg-[#050706] text-zinc-100"
      style={{ '--app-zoom': appZoom } as CSSProperties}
    >
      <WorkspaceNav activeView={activeView} onChange={setActiveView} />
      {toast && <Toast message={toast} />}

      <main className="max-w-none space-y-7 px-4 py-5 pb-24 sm:px-6 md:ml-[17rem] md:px-6 md:py-7 lg:px-8">
        {activeView === 'analysis' && (
          <section data-testid="analysis-workspace" className="space-y-6">
            <LinkInputCard
              url={url}
              remark={remark}
              error={error}
              isLoading={isLoading}
              progress={extractionState?.progress}
              statusMessage={extractionState?.message}
              onUrlChange={setUrl}
              onRemarkChange={setRemark}
              onSubmit={handleAnalyze}
            />
            <div ref={previewRef}>
              <AnalysisPreview
                material={latestMaterial}
                onTagsChange={handleTagsChange}
                onNotesChange={handleNotesChange}
              />
            </div>
          </section>
        )}

        {activeView === 'library' && (
          <section data-testid="library-workspace">
            <MaterialList
              materials={filteredMaterials}
              overviewStats={overviewStats}
              filtersSlot={<FiltersBar filters={filters} tagOptions={tagOptions} onChange={setFilters} />}
              highlightedId={highlightedId}
              onView={(material) => setSelectedMaterialId(material.id)}
              onDelete={handleDelete}
              onTagsChange={handleTagsChange}
              onToolsChange={handleToolsChange}
            />
          </section>
        )}

        {activeView === 'prompts' && (
          <PromptSettingsPage
            prompt={analysisSystemPrompt}
            defaultPrompt={DEFAULT_ANALYSIS_SYSTEM_PROMPT}
            onChange={setAnalysisSystemPrompt}
            onSave={handleSaveAnalysisPrompt}
            onReset={handleResetAnalysisPrompt}
          />
        )}
      </main>

      <DetailDrawer
        material={selectedMaterial}
        onClose={() => setSelectedMaterialId(null)}
        onTagsChange={handleTagsChange}
        onNotesChange={handleNotesChange}
      />
    </div>
  )
}

export default App
