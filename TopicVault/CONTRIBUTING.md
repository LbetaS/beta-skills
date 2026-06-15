# 贡献指南

感谢你愿意改进 AI 选题素材库。

## 提交问题

提交 Issue 前请：

1. 搜索是否已有相同问题。
2. 删除错误信息中的 API Key、Token、Cookie 和个人数据。
3. 写明操作系统、Node.js 版本、Python 版本和复现步骤。
4. 附上必要的日志，但不要上传 `backend/.env`。

## 本地开发

推荐环境：

- Node.js 22 LTS
- Python 3.11 或 3.12

安装前端依赖：

```powershell
npm install
```

安装后端开发依赖：

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
```

## 提交代码前检查

```powershell
npm test
npm run build
backend\.venv\Scripts\python.exe -m pytest backend\tests
```

## Pull Request 要求

- 一次 PR 只解决一个明确问题
- 保留现有数据结构和用户工作流，除非 PR 明确说明迁移方式
- 新功能和错误修复需要相应测试
- 不得提交真实 API Key、生成目录、虚拟环境或用户素材
- UI 修改请提供桌面端和移动端截图

## 代码风格

- 前端使用 TypeScript
- 后端使用 Python 类型标注
- 优先复用现有组件和工具函数
- 避免为简单功能引入大型依赖
