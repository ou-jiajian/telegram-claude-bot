import { Bot, GrammyError } from "grammy";
import Anthropic from "@anthropic-ai/sdk";
import { HttpsProxyAgent } from "https-proxy-agent";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL;
const ANTHROPIC_AUTH_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("错误：请设置 TELEGRAM_BOT_TOKEN 环境变量");
  process.exit(1);
}

console.log("初始化 Bot...");

// 配置代理
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
const botConfig = {};
if (proxyUrl) {
  console.log(`使用代理: ${proxyUrl}`);
  const agent = new HttpsProxyAgent(proxyUrl);
  botConfig.client = {
    baseFetchConfig: {
      agent,
      compress: true,
    }
  };
}

const bot = new Bot(TELEGRAM_BOT_TOKEN, botConfig);

// 初始化 Claude 客户端
let anthropic;
if (ANTHROPIC_BASE_URL && ANTHROPIC_AUTH_TOKEN) {
  console.log("使用 Claude Code 代理认证");
  anthropic = new Anthropic({
    apiKey: ANTHROPIC_AUTH_TOKEN,
    baseURL: ANTHROPIC_BASE_URL
  });
} else {
  console.error("错误：请设置 ANTHROPIC_BASE_URL 或 ANTHROPIC_AUTH_TOKEN");
  process.exit(1);
}

// 存储用户会话历史
const userSessions = new Map();

function getUserSession(userId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, []);
  }
  return userSessions.get(userId);
}

// 处理 /start 命令
bot.command("start", async (ctx) => {
  console.log(`[${new Date().toISOString()}] /start 命令 - 用户: ${ctx.from.id}`);
  await ctx.reply("你好！我是 Claude AI 助手。发送任何消息，我会帮你回答。\n\n使用 /clear 清除对话历史。");
});

// 处理 /clear 命令
bot.command("clear", async (ctx) => {
  console.log(`[${new Date().toISOString()}] /clear 命令 - 用户: ${ctx.from.id}`);
  userSessions.delete(ctx.from.id);
  await ctx.reply("对话历史已清除。");
});

// 处理普通文本消息
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;
  console.log(`[${new Date().toISOString()}] 收到消息 - 用户: ${userId}, 内容: ${userMessage}`);

  try {
    await ctx.replyWithChatAction("typing");

    const session = getUserSession(userId);
    session.push({ role: "user", content: userMessage });

    if (session.length > 20) {
      session.splice(0, session.length - 20);
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: session
    });

    const assistantMessage = response.content[0].text;
    session.push({ role: "assistant", content: assistantMessage });

    if (assistantMessage.length <= 4096) {
      await ctx.reply(assistantMessage);
    } else {
      const chunks = assistantMessage.match(/[\s\S]{1,4000}/g) || [];
      for (const chunk of chunks) {
        await ctx.reply(chunk);
      }
    }
  } catch (error) {
    console.error("处理消息时出错:", error);
    await ctx.reply("抱歉，处理你的消息时出现了错误。请稍后再试。");
  }
});

// 错误处理
bot.catch((err) => {
  console.error(`[${new Date().toISOString()}] Bot 错误:`, err.error);
});

// 优雅关闭
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("正在关闭 Bot...");
  setTimeout(() => process.exit(0), 2000);
  Promise.resolve(bot.stop()).finally(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// 启动 Bot
console.log("启动 Bot...");
(async () => {
  for (let attempt = 1; ; attempt++) {
    try {
      await bot.start({
        onStart: (info) => {
          console.log(`Bot 已启动，轮询中... (@${info.username})`);
        }
      });
      return;
    } catch (err) {
      if (err instanceof GrammyError && err.error_code === 409) {
        const delay = Math.min(1000 * attempt, 15000);
        console.error(`409 冲突，${delay / 1000}秒后重试...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (err instanceof Error && err.message === 'Aborted delay') return;
      console.error("轮询失败:", err);
      return;
    }
  }
})();
