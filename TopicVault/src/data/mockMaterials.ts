import type { Material } from '../types/material'
import { withMaterialTags } from '../lib/materialTags'

const baseMaterials: Material[] = [
  {
    id: 'mat-chatgpt-workflow-001',
    source: {
      platform: 'douyin',
      url: 'https://v.douyin.com/mock-chatgpt-workflow/',
      author: '阿杰AI效率课',
      title: '别再问 ChatGPT 单个问题了，用三步工作流让它直接产出方案',
    },
    rawContent: {
      description: '把 ChatGPT 从问答工具升级成内容生产流水线。',
      transcript:
        '很多人用 ChatGPT 只会问一个问题，所以答案永远很浅。真正高效的做法是先让它扮演岗位，再让它拆任务，最后按交付格式输出。',
    },
    classification: {
      toolCategory: ['ChatGPT'],
      topicCategory: ['AI工作流', 'AI职场', 'AI自媒体'],
      contentFormat: '教程型',
      hookType: '反常识开头',
      referenceValue: '高',
    },
    analysis: {
      oneSentenceSummary: '把 ChatGPT 从问答工具升级为角色澄清、任务拆解、执行清单的内容生产工作流。',
      coreArgument: '好结果不是来自更神奇的提示词，而是把目标、角色和交付格式一次性说清楚。',
      targetAudience: '经常用 ChatGPT 做内容、运营方案或职场汇报的人',
      painPoint: '用户输入太短，模型只能给泛泛建议，后续需要大量返工。',
      hook: '别再问 ChatGPT 单个问题了，这就是你答案永远很浅的原因。',
      structure: [
        {
          step: 1,
          name: '反常识开头',
          function: '制造认知差',
          text: '多数人以为 ChatGPT 不够聪明，其实是提问方式太像搜索框。',
        },
        {
          step: 2,
          name: '问题放大',
          function: '指出普遍误区',
          text: '只问一个问题，会让模型缺少角色、上下文和输出标准。',
        },
        {
          step: 3,
          name: '方法提出',
          function: '给出新工作流',
          text: '先定义角色，再拆任务，最后要求按表格和执行清单输出。',
        },
        {
          step: 4,
          name: '案例演示',
          function: '展示结果',
          text: '用一个小红书选题案例演示，从需求到标题、脚本、发布计划。',
        },
        {
          step: 5,
          name: '行动引导',
          function: '引导收藏',
          text: '提醒观众把这套三步模板存下来，下次直接替换主题。',
        },
      ],
      emotionalCurve: ['好奇', '焦虑', '被说中', '看到方法', '想收藏'],
      replicableMethods: [
        '用“别再...”制造对旧习惯的否定',
        '把抽象技巧包装成三步流程',
        '用一个真实任务演示结果差异',
      ],
      rewriteAnglesForMyAccount: [
        '改成“别再让 AI 直接写脚本了，先让它做选题编辑”',
        '延展为 AI 内容团队 SOP：策划、脚本、标题、复盘四个智能体',
      ],
      customSections: [
        {
          title: '提示词拆解示例',
          content: '这块内容会随着“提示词”页面的拆解要求变化。比如你要求按 AIDA、痛点链路或选题价值拆，模型就会把结果写到这里。',
        },
        {
          title: '入库复盘重点',
          content: '固定信息仍然保留标题、原文案、标签和个人备注；变化的是这里的拆解模块，方便你按自己的选题方法沉淀素材。',
        },
      ],
    },
    createdAt: '2026-05-05 16:42',
  },
  {
    id: 'mat-claude-copy-002',
    source: {
      platform: 'douyin',
      url: 'https://v.douyin.com/mock-claude-copy-analysis/',
      author: '南舟AI文案拆解',
      title: '用 Claude 拆爆款文案，不是让它总结，而是让它反推结构',
    },
    rawContent: {
      description: 'Claude 长文本能力适合做文案结构分析。',
      transcript:
        '如果你只是让 Claude 总结文案，它只会给你一段概括。你要让它标注钩子、转折、证据和行动引导，再反推每一段的作用。',
    },
    classification: {
      toolCategory: ['Claude'],
      topicCategory: ['AI提示词', 'AI自媒体'],
      contentFormat: '拆解型',
      hookType: '方法纠偏',
      referenceValue: '高',
    },
    analysis: {
      oneSentenceSummary: '用 Claude 做爆款文案分析时，关键不是总结内容，而是反推每段承担的传播功能。',
      coreArgument: '文案分析要从“说了什么”切换到“为什么这样说”，才能沉淀可复用结构。',
      targetAudience: '想系统拆解爆款内容的 AI 自媒体创作者',
      painPoint: '收藏了很多爆款，但复用时只学到表层表达，无法迁移到自己的选题。',
      hook: '你用 Claude 拆文案，如果只让它总结，等于浪费了它最强的能力。',
      structure: [
        {
          step: 1,
          name: '错误示范',
          function: '降低观众防备',
          text: '先说大多数人会输入“帮我总结这段文案”。',
        },
        {
          step: 2,
          name: '能力转向',
          function: '建立方法优势',
          text: '强调 Claude 更适合长文本标注、归因和结构反推。',
        },
        {
          step: 3,
          name: '提示词展示',
          function: '给可复制工具',
          text: '要求 Claude 按钩子、冲突、证据、转折、CTA 做表格。',
        },
        {
          step: 4,
          name: '结果对比',
          function: '证明价值',
          text: '展示普通总结与结构拆解输出的差异。',
        },
        {
          step: 5,
          name: '收藏理由',
          function: '强化行动',
          text: '提示观众这套 prompt 可以直接用于自己的素材库。',
        },
      ],
      emotionalCurve: ['共鸣', '被纠偏', '看到差距', '获得模板', '想试用'],
      replicableMethods: [
        '先展示低效用法，再给出高阶用法',
        '把 AI 能力绑定到具体任务场景',
        '用输出对比制造信任',
      ],
      rewriteAnglesForMyAccount: [
        '做一期“Claude 如何帮我拆 100 条 AI 爆款脚本”',
        '把结构拆解 prompt 做成可复制模板，引导评论领取',
      ],
    },
    createdAt: '2026-05-04 10:18',
  },
  {
    id: 'mat-prompt-tutorial-003',
    source: {
      platform: 'douyin',
      url: 'https://v.douyin.com/mock-prompt-tutorial/',
      author: '提示词小北',
      title: '一个万能提示词公式：让 AI 先问你三个问题再开始写',
    },
    rawContent: {
      description: '用追问机制提升 AI 输出质量。',
      transcript:
        '不要一上来就让 AI 写，先让它问你三个澄清问题。比如目标用户是谁，使用场景是什么，最终交付格式是什么。',
    },
    classification: {
      toolCategory: ['ChatGPT', 'Claude', 'Gemini'],
      topicCategory: ['AI提示词', 'AI职场', 'AI编程'],
      contentFormat: '教程型',
      hookType: '开头钩子',
      referenceValue: '中',
    },
    analysis: {
      oneSentenceSummary: '在提示词里加入“先问我三个问题”，可以让 AI 补齐上下文后再输出。',
      coreArgument: '高质量回答来自充分上下文，追问机制比一次性塞长 prompt 更稳定。',
      targetAudience: '刚开始学习 AI 提示词、经常觉得输出不准的用户',
      painPoint: '用户不知道该提供哪些背景，导致 AI 写出来的内容不贴合需求。',
      hook: '这个提示词公式我每天都在用：先别写，先问我三个问题。',
      structure: [
        {
          step: 1,
          name: '场景切入',
          function: '快速建立实用感',
          text: '说自己每天都在用这个公式，暗示已验证。',
        },
        {
          step: 2,
          name: '痛点指出',
          function: '说中用户困惑',
          text: 'AI 输出不准，不一定是模型差，而是缺关键上下文。',
        },
        {
          step: 3,
          name: '公式给出',
          function: '降低学习门槛',
          text: '给出“在开始前，先问我三个澄清问题”的核心句式。',
        },
        {
          step: 4,
          name: '例子演示',
          function: '让观众会用',
          text: '以写周报、做选题、生成代码需求为三个例子。',
        },
        {
          step: 5,
          name: '延展引导',
          function: '激发互动',
          text: '让观众评论自己的使用场景，方便做后续系列。',
        },
      ],
      emotionalCurve: ['被吸引', '发现原因', '理解公式', '觉得简单', '想评论'],
      replicableMethods: [
        '用“我每天都在用”建立经验背书',
        '把提示词压缩成一句可记忆公式',
        '用多场景例子提高泛用感',
      ],
      rewriteAnglesForMyAccount: [
        '改写成“做 AI 选题前，先让模型反问你三个定位问题”',
        '做成提示词系列第一集，后续延展到脚本、封面、标题',
      ],
    },
    createdAt: '2026-05-03 09:26',
  },
]

export const mockMaterials: Material[] = baseMaterials.map(withMaterialTags)
