<div align="center">

# 🧰 Beta Skills

#### 贝塔自己在用的 AI 内容生产工具，都放在这里

[![Projects](https://img.shields.io/badge/Projects-2-10B981?style=for-the-badge)](#projects)
[![Local First](https://img.shields.io/badge/Local--First-Yes-3B82F6?style=for-the-badge)](#security)
[![License](https://img.shields.io/badge/License-MIT-8B5CF6?style=for-the-badge)](#license)

![Node.js](https://img.shields.io/badge/Node.js-Tools-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-Workspace-61DAFB?style=flat-square&logo=react&logoColor=111827)
![Python](https://img.shields.io/badge/Python-Backend-3776AB?style=flat-square&logo=python&logoColor=white)

</div>

都是在自己项目里跑通了一段时间，确实省事，才搬出来开源的。没什么花活，就是几个挺实用的东西。

目前有两个工具：一个负责把值得研究的短视频沉淀成选题素材，一个负责把写好的长文排成可以直接发布的图片。

---

<a id="projects"></a>

## 📋 项目目录

| 项目 | 一句话说明 | 适合谁 |
|---|---|---|
| 🖋️ [**InkPages**](#inkpages) | 把中文长文自动分页，排版并批量导出竖版 PNG | 公众号、小红书和内容创作者 |
| 🗂️ [**TopicVault**](#topicvault) | 从短视频链接提取文案、AI 拆解内容并沉淀选题素材 | 需要长期积累选题和案例的人 |

---

## 📦 下载方式

克隆整个工具合集：

```bash
git clone https://github.com/LbetaS/beta-skills.git
cd beta-skills
```

两个项目相互独立。进入对应目录后，按照该项目自己的 README 安装和运行即可。

---

## ✨ 项目介绍

<table>
<tr><td>

<a id="inkpages"></a>

### 🖋️ InkPages（长文转图片）

> *“文章写完只是第一步，真正费时间的是一页页调字号、间距、配图和分页。”*

InkPages 是一个离线运行的中文长文排版工具。把文章粘进去，它会自动分页成适合社交媒体发布的竖版图片，并在浏览器里实时预览。

**它能做什么**

- 将长文章自动分页为竖版图片
- 自定义标题、作者、头像、页脚和画布尺寸
- 支持加粗、列表、Markdown 标题和代码块
- 插入图片并保持原始宽高比
- 调整字号、行距、边距和配色
- 一次批量导出全部页面 PNG
- 自动把正文草稿保存在浏览器本地

**它适合**

- 把公众号长文拆成小红书图文
- 制作知识卡片、教程长图和社交媒体图文
- 不想把文章和图片上传到在线排版网站的人

**快速启动**

需要 Node.js 18 或更高版本：

```bash
cd InkPages
npm start
```

浏览器打开 `http://localhost:4174`。

→ [查看 InkPages 完整说明](./InkPages/README.md)

</td></tr>
</table>

<table>
<tr><td>

<a id="topicvault"></a>

### 🗂️ TopicVault（AI 选题素材库）

> *“收藏一个视频很容易，难的是过几天还能记得它为什么值得收藏。”*

TopicVault 是一个本地运行的 AI 选题素材工作台。粘贴短视频链接后，它可以获取作品信息、提取语音文案，再用大模型按照你的提示词拆解内容，最后把原文、结构、标签、参考点和个人灵感保存在素材库里。

**它能做什么**

- 解析抖音作品链接和视频信息
- 使用语音模型把视频转成文字
- 使用自定义提示词拆解内容结构
- 保存标题、原文、摘要、标签和参考点
- 记录“为什么收藏”和自己的选题灵感
- 按关键词、工具和标签搜索筛选
- 在浏览器本地保存素材数据

**它适合**

- 长期收集短视频选题和爆款案例
- 想把“刷到一个好内容”变成可复用素材的人
- 需要建立个人内容研究和选题工作流的创作者

**使用前准备**

TopicVault 需要 Node.js 22、Python 3.11 或 3.12，以及使用者自己的：

- TikHub API Key
- 阿里百炼 API Key
- 兼容 OpenAI Chat Completions 的模型服务

第三方服务可能产生费用，请先确认接口权限、余额和计费方式。

Windows 用户可以进入项目目录后运行：

```powershell
cd TopicVault
Set-ExecutionPolicy -Scope Process Bypass
.\start.ps1
```

→ [查看 TopicVault 完整说明](./TopicVault/README.md)

</td></tr>
</table>

---

## 🔄 我的内容工作流

这两个工具解决的是内容生产前后两个阶段的问题：

```text
看到值得研究的视频
        ↓
TopicVault 提取文案、AI 拆解、记录灵感
        ↓
形成选题并完成内容创作
        ↓
InkPages 自动分页、调整排版、导出图片
        ↓
发布到公众号、小红书或其他内容平台
```

TopicVault 负责让好内容不再停留在收藏夹里，InkPages 负责让写完的内容更快变成可以发布的成品。

---

<a id="security"></a>

## 🔐 数据与安全

- 两个工具都以本地运行和本地数据为主。
- InkPages 不需要外部 API，不会上传文章和图片。
- TopicVault 的素材目前保存在浏览器 `localStorage` 中，不会自动云同步。
- TopicVault 使用的 API Key 只应保存在本地 `.env` 文件中。
- 不要把 `.env`、API Key、Token、Cookie、个人素材或转写原文提交到 GitHub。
- 清除浏览器网站数据可能删除本地草稿或素材，重要内容请保留原始文件和链接。

TopicVault 依赖第三方平台接口。平台规则、接口可用性和费用可能发生变化，本项目与抖音、TikHub、阿里云及模型服务商没有官方关联。

---

## 🌟 关于

我是贝塔，平时关注 AI 内容生产、短视频选题、图文排版和个人素材库。

这个仓库里的工具都来自我自己的实际需求：先把流程跑通，确认确实能省时间，再整理成别人也能使用的开源项目。

如果这些工具对你有帮助，可以点一个 ⭐。遇到问题或有改进建议，欢迎提交 Issue。

---

<a id="license"></a>

## 📄 开源许可

两个子项目均使用 MIT License：

- [InkPages License](./InkPages/LICENSE)
- [TopicVault License](./TopicVault/LICENSE)

InkPages 内置的 Noto Serif SC 字体使用 SIL Open Font License 1.1，详见 [第三方资源说明](./InkPages/THIRD_PARTY_NOTICES.md)。

<div align="center">

Made by [@LbetaS](https://github.com/LbetaS)

</div>
