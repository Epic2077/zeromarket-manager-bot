import "dotenv/config";
import { Bot } from "grammy";

console.log("[startup] Loading Khodroju manager bot...");
console.log(`[startup] Node.js ${process.version}`);
console.log(`[startup] Working directory: ${process.cwd()}`);

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("[startup] TELEGRAM_BOT_TOKEN is missing.");
  throw new Error("TELEGRAM_BOT_TOKEN is not defined in the environment variables.");
}

console.log("[startup] Telegram token loaded.");
console.log(
  `[startup] Backend URL: ${process.env.API_BASE_URL ?? "missing"}`,
);
console.log(
  `[startup] Backend service token: ${
    process.env.BOT_SERVICE_TOKEN ? "loaded" : "missing"
  }`,
);

export const bot = new Bot(token);
console.log("[startup] Bot instance created.");
