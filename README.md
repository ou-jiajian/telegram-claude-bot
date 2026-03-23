# Telegram Claude Bot

本地运行的 Telegram 机器人，使用 Claude API 提供 AI 对话功能。支持连接到不同的 Claude Code 实例。

## 功能特性

- 💬 支持多轮对话（自动保存会话历史，最多 20 轮）
- 🧠 使用 Claude Sonnet 4.6 模型
- 🔄 支持长消息自动分段发送
- 🗑️ 使用 `/clear` 清除对话历史
- 🌐 支持代理访问 Telegram API
- 🔌 可连接到不同的 Claude Code 实例
- ⚡ 简单易部署

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/ou-jiajian/telegram-claude-bot.git
cd telegram-claude-bot
```

### 2. 安装依赖

```bash
npm install
```

### 3. 创建 Telegram Bot

1. 在 Telegram 中找到 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 创建新 bot
3. 按提示设置 bot 名称和用户名
4. 获取 bot token（格式：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 4. 配置环境变量

编辑 `.env` 文件：

```env
TELEGRAM_BOT_TOKEN=你的_Bot_Token
```

### 5. 运行 Bot

#### 方式一：使用 Claude Code 代理（推荐）

在 Claude Code 窗口中运行：

```bash
npm start
```

Bot 会自动使用当前 Claude Code 实例的认证。

#### 方式二：使用 Anthropic API Key

1. 从 [Anthropic Console](https://console.anthropic.com/) 获取 API Key
2. 在 `.env` 文件中添加：

```env
ANTHROPIC_API_KEY=你的_API_Key
```

3. 运行：

```bash
npm start
```

### 6. 停止 Bot

#### 直接运行时

在运行 bot 的终端窗口中按 `Ctrl+C` 即可停止。

#### 使用 PM2 时

```bash
pm2 stop telegram-bot
```

如果需要完全删除 PM2 进程：

```bash
pm2 delete telegram-bot
```

## 使用说明

在 Telegram 中找到你的 bot，发送消息即可开始对话。

**可用命令：**
- `/start` - 开始使用
- `/clear` - 清除对话历史

## 连接到不同的 Claude Code 实例

如果你同时打开了多个 Claude Code 窗口，想让 bot 连接到特定的窗口：

1. 停止当前运行的 bot（Ctrl+C）
2. 在目标 Claude Code 窗口中运行：
   ```bash
   cd /path/to/telegram-claude-bot && npm start
   ```

Bot 会连接到该窗口的 Claude 实例。

## 代理配置

如果你的网络环境需要代理访问 Telegram API，bot 会自动使用系统代理环境变量：

- `HTTP_PROXY`
- `HTTPS_PROXY`
- `http_proxy`
- `https_proxy`

## 技术栈

- [grammy](https://grammy.dev/) - Telegram Bot 框架
- [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) - Claude API SDK
- [https-proxy-agent](https://github.com/TooTallNate/proxy-agents) - 代理支持
- Node.js 20+

## 项目结构

```
telegram-claude-bot/
├── index.js          # Bot 主程序
├── package.json      # 项目配置
├── .env             # 环境变量配置
└── README.md        # 项目文档
```

## 注意事项

- 会话历史存储在内存中，重启后会丢失
- 生产环境建议使用数据库存储会话
- 注意 API 调用费用
- 保护好你的 API 密钥和 Bot Token，不要提交到 Git
- 同一时间只能运行一个 bot 实例（Telegram 限制）

## 部署建议

### 本地运行

```bash
npm start
```

### 使用 PM2 保持运行

```bash
npm install -g pm2
pm2 start index.js --name telegram-bot
pm2 save
pm2 startup
```

### Docker 部署

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["node", "index.js"]
```

构建并运行：

```bash
docker build -t telegram-claude-bot .
docker run -d --env-file .env telegram-claude-bot
```

## 常见问题

### Q: Bot 无法接收消息？

A: 检查以下几点：
1. 网络是否需要代理？设置代理环境变量
2. Bot Token 是否正确？
3. 是否有其他实例在运行？（会导致 409 冲突）

### Q: 如何切换连接的 Claude Code 实例？

A: 停止当前 bot，在目标 Claude Code 窗口中重新启动 bot。

### Q: 会话历史保存多久？

A: 当前版本保存最近 20 轮对话，重启后清空。

## 开发

开发模式（自动重启）：

```bash
npm run dev
```

## License

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 致谢

- [grammy](https://grammy.dev/) - 优秀的 Telegram Bot 框架
- [Anthropic](https://www.anthropic.com/) - Claude API
