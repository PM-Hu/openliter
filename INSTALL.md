# openliter 安装指南

本文档将指导你完成 openliter 的完整安装和配置过程。

## 📋 系统要求

### 必需软件

- **Node.js**: 版本 18.0 或更高
  - 下载地址: [https://nodejs.org/](https://nodejs.org/)
  - 推荐使用 LTS 版本

- **包管理器**（任选其一）
  - npm (Node.js 自带)
  - yarn: `npm install -g yarn`
  - pnpm: `npm install -g pnpm`

### 验证安装

打开终端/命令行，运行以下命令验证安装：

```bash
node --version   # 应该显示 v18.0.0 或更高
npm --version    # 应该显示 9.0.0 或更高
```

## 🚀 安装步骤

### 1️⃣ 获取项目代码

#### 方式一：从 GitHub 克隆（推荐）

```bash
git clone https://github.com/PM-Hu/openliter.git
cd openliter
```

#### 方式二：下载 ZIP 压缩包

1. 访问 [https://github.com/PM-Hu/openliter](https://github.com/PM-Hu/openliter)
2. 点击 "Code" → "Download ZIP"
3. 解压到本地目录
4. 在终端中进入项目目录

### 2️⃣ 安装项目依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

这一步会安装以下核心依赖：
- Next.js - React 框架
- Prisma - 数据库 ORM
- React - UI 库
- 其他开发依赖

### 3️⃣ 配置环境变量

#### 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# Linux/Mac
cp .env.example .env

# Windows
copy .env.example .env
```

#### 编辑 `.env` 文件

使用文本编辑器打开 `.env` 文件，配置以下变量：

```env
# 数据库配置（本地 SQLite 文件数据库）
DATABASE_URL="file:./dev.db"

# AI API 配置
# 方式一：使用 DeepSeek（推荐，价格便宜，中文效果好）
OPENAI_API_KEY="your_deepseek_api_key_here"
OPENAI_BASE_URL="https://api.deepseek.com"
OPENAI_MODEL="deepseek-chat"

# 方式二：使用 OpenAI 官方
# OPENAI_API_KEY="your_openai_api_key_here"
# OPENAI_BASE_URL="https://api.openai.com/v1"
# OPENAI_MODEL="gpt-3.5-turbo"

# 方式三：使用其他兼容 OpenAI API 的服务
# OPENAI_API_KEY="your_api_key"
# OPENAI_BASE_URL="your_api_endpoint"
# OPENAI_MODEL="your_model_name"
```

#### 获取 AI API Key

**DeepSeek（推荐）**:
1. 访问 [https://platform.deepseek.com/](https://platform.deepseek.com/)
2. 注册并登录账号
3. 进入 "API Keys" 页面
4. 创建新的 API Key
5. 复制 Key 并粘贴到 `.env` 文件

**OpenAI**:
1. 访问 [https://platform.openai.com/](https://platform.openai.com/)
2. 注册并登录账号
3. 进入 "API keys" 页面
4. 创建新的 API Key
5. 复制 Key 并粘贴到 `.env` 文件

### 4️⃣ 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库并应用 schema
npx prisma db push
```

执行成功后，项目根目录会出现 `prisma/dev.db` 文件，这是你的 SQLite 数据库文件。

### 5️⃣ 启动开发服务器

```bash
# 使用 npm
npm run dev

# 或使用 yarn
yarn dev

# 或使用 pnpm
pnpm dev
```

启动成功后，你会看到类似这样的输出：

```
✓ Ready in 3.2s
○ Local:        http://localhost:3000
```

### 6️⃣ 访问应用

打开浏览器，访问 [http://localhost:3000](http://localhost:3000)

你应该能看到 openliter 的主界面！

## 🧪 测试安装

### 添加第一篇论文

1. 在首页找到"添加论文"区域
2. 输入一个测试用的 arXiv 链接，例如：
   ```
   https://arxiv.org/abs/2301.07041
   ```
3. 点击"添加"按钮
4. 如果成功，论文会出现在下方的列表中

### 生成 AI 摘要

1. 找到刚才添加的论文
2. 点击"生成AI摘要"按钮
3. 等待几秒钟，AI 生成的中文摘要会显示在卡片中

## 🐛 常见问题

### 问题 1: 端口 3000 已被占用

**错误信息**: `Port 3000 is already in use`

**解决方案**:
```bash
# 方式一：杀死占用端口的进程
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F

# 方式二：使用其他端口
npm run dev -- -p 3001
```

### 问题 2: 数据库连接失败

**错误信息**: `Can't reach database server`

**解决方案**:
```bash
# 重新生成 Prisma Client
npx prisma generate

# 重新创建数据库
npx prisma db push

# 检查 .env 文件中的 DATABASE_URL 是否正确
```

### 问题 3: AI API 调用失败

**错误信息**: `API key not found` 或 `Request failed`

**解决方案**:
1. 检查 `.env` 文件中的 API Key 是否正确
2. 确认 API Key 有足够的余额
3. 检查网络连接是否正常
4. 确认 BASE_URL 和 MODEL 配置正确

### 问题 4: npm install 失败

**错误信息**: `EACCES` 或权限错误

**解决方案**:
```bash
# 方式一：清理缓存后重试
npm cache clean --force
npm install

# 方式二：使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

### 问题 5: 添加 arXiv 论文失败

**可能原因**:
1. arXiv 链接格式不正确
2. 网络连接问题
3. arXiv API 暂时不可用

**解决方案**:
1. 确保链接格式为 `https://arxiv.org/abs/xxxx.xxxxx`
2. 检查网络连接
3. 稍后重试

## 🔧 生产环境部署

### 构建生产版本

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

### 使用 PM2 守护进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "openliter" -- start

# 查看日志
pm2 logs openliter

# 设置开机自启
pm2 startup
pm2 save
```

### 部署到 Vercel（推荐）

1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com/)
3. 导入你的 GitHub 仓库
4. 配置环境变量
5. 点击 Deploy

## 📚 下一步

安装完成后，你可以：

1. 阅读 [README.md](README.md) 了解项目功能
2. 查看 [项目结构](#项目结构) 了解代码组织
3. 访问 [GitHub Issues](https://github.com/your-username/openliter/issues) 报告问题

## 💡 开发建议

### 推荐的开发工具

- **代码编辑器**: [VS Code](https://code.visualstudio.com/)
- **数据库管理**: [Prisma Studio](https://www.prisma.io/studio)
  - 启动命令: `npx prisma studio`
- **API 测试**: [Postman](https://www.postman.com/) 或 [curl](https://curl.se/)

### 有用的命令

```bash
# 查看数据库内容（可视化界面）
npx prisma studio

# 格式化代码
npm run lint

# 重置数据库（⚠️ 会删除所有数据）
npx prisma db push --force-reset
```

## 🆘 获取帮助

如果遇到问题：

1. 查看 [常见问题](#常见问题) 部分
2. 搜索 [GitHub Issues](https://github.com/your-username/openliter/issues)
3. 创建新的 Issue 并提供详细的错误信息
4. 加入社区讨论

---

**祝你使用愉快！** 🎉

如有任何问题，欢迎随时提问。
