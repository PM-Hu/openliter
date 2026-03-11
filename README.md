# openSCIs

<div align="center">

**📚 个人论文管理助手 - AI 驱动的科研文献工具**

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一个轻量级的学术论文管理系统，帮助你高效管理和理解科研文献。

</div>

## ✨ 核心功能

- 📰 **RSS 订阅** - 订阅学术期刊 RSS，自动获取最新论文
- 🤖 **AI 智能摘要** - 一键生成中文论文摘要，快速理解核心内容
- 📁 **分组管理** - 自定义分组，颜色区分，批量管理论文
- 🔍 **全文搜索** - 支持标题、作者、摘要等多维度搜索
- 💾 **本地存储** - 基于 SQLite，无需配置服务器

## 🛠️ 技术栈

- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **数据库**: SQLite + Prisma ORM
- **UI**: shadcn/ui 组件库
- **AI**: OpenAI API (兼容 DeepSeek 等多种服务)

## 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/PM-Hu/openSCIs.git
cd openSCIs

# 2. 安装依赖, 推荐在 conda 环境中安装
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，配置 AI API Key

# 4. 初始化数据库
npx prisma db push

# 5. 启动服务
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 添加论文
```
输入 arXiv 链接 → 点击添加 → 自动解析保存
```

### RSS 订阅
1. 进入「AI简报」页面
2. 点击「🎯 加载预设RSS源」
3. 设置关键词筛选（可选）
4. 点击「👀 预览新论文」获取最新论文

### 生成 AI 摘要
```
论文列表 → 找到目标论文 → 点击「生成AI摘要」
```

### 分组管理
```
左侧边栏 → + 新建分组 → 勾选论文 → 批量分配
```

## 🔧 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npx prisma studio    # 数据库可视化管理
```

## 📁 项目结构

```
openSCIs/
├── prisma/          # 数据库配置
├── src/
│   ├── app/        # Next.js 页面和 API
│   ├── components/ # React 组件
│   └── lib/        # 工具函数
└── package.json
```

## 🗺️ 开发路线

- [x] RSS 订阅和关键词筛选
- [x] AI 摘要生成
- [x] 分组管理和批量操作
- [ ] PDF 在线阅读
- [ ] 笔记和标注
- [ ] 导出 BibTeX

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star！**

Made with pm❤️

</div>
