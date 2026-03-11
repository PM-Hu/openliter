# openSCIs 安装指南

## 📋 系统要求

- Node.js 18+
- npm / yarn / pnpm

## 🚀 安装步骤

### 1. 获取项目

```bash
git clone https://github.com/PM-Hu/openSCIs.git
cd openSCIs
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env`，配置 AI API：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# AI API（推荐 DeepSeek）
OPENAI_API_KEY="your_api_key"
OPENAI_BASE_URL="https://api.deepseek.com"
OPENAI_MODEL="deepseek-chat"
```

**获取 API Key：**
- DeepSeek: [https://platform.deepseek.com/](https://platform.deepseek.com/)
- OpenAI: [https://platform.openai.com/](https://platform.openai.com/)

### 4. 初始化数据库

```bash
npx prisma db push
```

### 5. 启动服务

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 🧪 测试安装

添加测试论文：
```
https://arxiv.org/abs/2301.07041
```

生成 AI 摘要验证 API 配置。

## 🐛 常见问题

**端口 3000 被占用？**
```bash
npm run dev -- -p 3001
```

**数据库连接失败？**
```bash
npx prisma generate
npx prisma db push
```

**npm install 失败？**
```bash
npm cache clean --force
npm install --registry=https://registry.npmmirror.com
```

## 🚀 生产部署

### 构建运行
```bash
npm run build
npm start
```

### 使用 PM2
```bash
npm install -g pm2
pm2 start npm --name "openSCIs" -- start
pm2 save
```

### 部署到 Vercel
1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量
4. 部署

## 🔧 有用命令

```bash
npx prisma studio    # 数据库管理界面
npm run lint         # 代码检查
```

## 📚 更多文档

- [README.md](README.md) - 项目介绍
- [GitHub Issues](https://github.com/PM-Hu/openSCIs/issues) - 问题反馈

---

祝你使用愉快！🎉
