# openliter

<div align="center">

**📚 个人论文管理助手 - AI 驱动的科研文献工具**

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一个轻量级的学术论文管理系统，帮助你高效管理和理解科研文献。

</div>

## ✨ 功能特性

- 🔗 **自动获取论文信息** - 输入 arXiv 链接，自动解析标题、作者、摘要等元数据
- 📰 **RSS 订阅** - 订阅 arXiv 等学术期刊的 RSS 源，自动获取最新论文，支持关键词筛选
- 💾 **本地数据存储** - 基于 SQLite 的轻量级数据库，无需配置复杂的服务器
- 🤖 **AI 智能摘要** - 一键生成中文论文摘要和研究亮点，快速理解论文核心内容
- 📁 **论文分组管理** - 创建自定义分组，用颜色区分不同研究方向，批量管理论文
- 🔍 **全文搜索** - 支持标题、作者、摘要等多维度搜索
- 🎨 **现代化界面** - 基于 shadcn/ui 的美观响应式设计
- 📱 **响应式布局** - 完美适配桌面和移动设备

## 📸 界面预览
当前还是草包版本，更多功能待完善中...

### 主要功能
- 📋 论文列表展示
- ➕ 快速添加论文
- 📰 RSS 订阅管理
- 📁 分组与分类
- 🤖 AI 摘要生成
- 🔍 实时搜索过滤
- 🗑️ 批量管理论文

## 🛠️ 技术栈

- **前端框架**: [Next.js 15](https://nextjs.org/) (App Router)
- **编程语言**: [TypeScript](https://www.typescriptlang.org/)
- **数据库**: [SQLite](https://www.sqlite.org/) + [Prisma ORM](https://www.prisma.io/)
- **UI 组件**: [shadcn/ui](https://ui.shadcn.com/)
- **样式方案**: [Tailwind CSS](https://tailwindcss.com/)
- **RSS 解析**: [rss-parser](https://www.npmjs.com/package/rss-parser)
- **AI 集成**: OpenAI API (兼容多种 AI 服务)

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 安装步骤

详细的安装说明请查看 [📖 安装文档](INSTALL.md)

简略版：

```bash
# 1. 克隆项目
git clone https://github.com/PM-Hu/openliter.git
cd openliter

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要的配置

# 4. 初始化数据库
npx prisma db push

# 5. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📖 使用说明

### 添加论文

1. 在首页的"添加论文"区域，输入 arXiv 论文链接（如：`https://arxiv.org/abs/2301.07001`）
2. 点击"添加"按钮
3. 系统会自动解析并保存论文信息

### 生成 AI 摘要

1. 在论文列表中找到想要分析的论文
2. 点击"生成AI摘要"按钮
3. 等待 AI 分析完成，摘要将自动保存并显示

### 搜索论文

使用顶部的搜索框，可以搜索：
- 论文标题
- 作者名称
- 摘要内容
- AI 摘要内容

### RSS 订阅（推荐）

1. 点击搜索框右侧的 "📰 RSS" 按钮打开管理面板
2. 点击 "🎯 加载预设RSS源" 快速添加常用 arXiv 分类
3. 设置关键词筛选（可选），如：`deep learning, transformer, neural network`
4. 勾选要刷新的 RSS 源，点击 "🔄 刷新所有RSS"
5. 系统会自动获取最新论文并添加到你的论文库

**支持的 RSS 源：**
- arXiv 各个分类（AI、ML、CV、NLP 等）
- Elsevier、Nature 等期刊 RSS
- 任何标准的 RSS/Atom 订阅源

**详细使用指南：** 查看 [RSS_GUIDE.md](RSS_GUIDE.md)

### 分组管理

1. 点击左侧边栏的 "+ 新建" 按钮创建分组
2. 选择分组颜色和名称
3. 勾选论文后批量分配到分组
4. 点击分组名称快速筛选论文

## 🧪 测试工具

### RSS 测试脚本

项目提供了 RSS 测试工具，用于测试 RSS 源是否可用：

#### 方法一：使用测试脚本（推荐）

```bash
# 1. 确保开发服务器正在运行
npm run dev

# 2. 在另一个终端运行测试脚本
chmod +x test-rss.sh
./test-rss.sh
```

脚本会提示你输入 RSS URL，留空则使用默认的 Elsevier 测试源。

#### 方法二：直接调用 API

```bash
# 测试 arXiv AI RSS 源
curl -X POST "http://localhost:3000/api/rss/test" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://export.arxiv.org/rss/cs.AI"}'

# 测试 Nature 期刊 RSS 源
curl -X POST "http://localhost:3000/api/rss/test" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.nature.com/machintell/rss"}'
```

#### 测试输出说明

测试 API 会返回：
- ✅ RSS 源的基本信息（标题、描述、总数）
- ✅ 前 3 篇论文的详细信息
- ❌ 错误信息（如果解析失败）

**适用场景：**
- 测试自定义 RSS 源是否可用
- 查看 RSS 源返回的数据格式
- 调试 RSS 解析问题

### 数据库管理

```bash
# 启动 Prisma Studio（可视化数据库管理工具）
npx prisma studio

# 重置数据库（⚠️ 会删除所有数据）
npx prisma db push --force-reset
```

## 📁 项目结构

```
openliter/
├── prisma/              # 数据库配置
│   └── schema.prisma   # 数据模型定义
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── api/       # API 路由
│   │   │   ├── add/              # 添加论文
│   │   │   ├── delete/           # 删除论文
│   │   │   ├── papers/           # 获取论文列表
│   │   │   ├── summarize/        # AI 摘要
│   │   │   ├── categories/       # 分组管理
│   │   │   └── rss/             # RSS 订阅
│   │   │       ├── add/         # 添加 RSS 源
│   │   │       ├── delete/      # 删除 RSS 源
│   │   │       ├── refresh/     # 刷新 RSS
│   │   │       ├── sources/     # 获取 RSS 源列表
│   │   │       ├── init/        # 初始化预设 RSS 源
│   │   │       └── test/        # RSS 测试 API
│   │   ├── layout.tsx           # 根布局
│   │   └── page.tsx             # 首页
│   ├── components/     # React 组件
│   │   ├── Toast.tsx            # 消息提示组件
│   │   ├── ConfirmDialog.tsx    # 确认对话框组件
│   │   └── ui/                  # shadcn/ui 组件
│   └── lib/            # 工具函数
├── test-rss.sh         # RSS 测试脚本
├── .env                # 环境变量配置
└── package.json        # 项目配置
```

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📝 开发路线图

- [x] RSS 订阅功能
- [x] 论文分组管理
- [x] 批量操作
- [ ] 支持更多论文来源（CNKI、万方等）
- [ ] PDF 在线阅读
- [ ] 笔记和标注功能
- [ ] 导出文献列表（BibTeX、EndNote）
- [ ] 定时自动刷新 RSS
- [ ] 多用户支持
- [ ] 云端同步

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Prisma](https://www.prisma.io/) - 数据库 ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [rss-parser](https://www.npmjs.com/package/rss-parser) - RSS 解析库

## 📮 联系方式

- 项目主页: [https://github.com/PM-Hu/openliter](https://github.com/PM-Hu/openliter)
- 问题反馈: [GitHub Issues](https://github.com/PM-Hu/openliter/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star！**

Made with ❤️ by openliter team

</div>
