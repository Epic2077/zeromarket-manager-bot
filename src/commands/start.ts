// commands/start.ts

import type { Bot } from "grammy";
import { getTelegramSession } from "../services/auth.services.js";
import {
  mainMenuKeyboard,
  websiteButton,
} from "../keyboards/main-menu.js";

export function registerStartCommand(bot: Bot) {
  bot.command("start", async (ctx) => {
    const telegramId = ctx.from?.id;

    try {
      const session = await getTelegramSession(telegramId);

      if (!session) {
        await ctx.reply(
          "Welcome to Khodroju Management!\n\n" +
            "Your Telegram account isn't linked yet.\n\n" +
            "Log in to your Khodroju account, generate a connection code, " +
            "and send it here using:\n\n" +
            "/link YOUR_CODE",
          { reply_markup: websiteButton() },
        );

        return;
      }

      const roleMessage =
        session.role === "USER"
          ? ""
          : `\n\nRole: ${session.role.toLowerCase()}`;
      await ctx.reply(`Welcome back to Khodroju Management!${roleMessage}`, {
        reply_markup:
          mainMenuKeyboard(session.role),
      });
    } catch (error) {
      console.error("Telegram connection check failed:", error);
      await ctx.reply(
        "I couldn't check your account right now. Please try again later.",
        { reply_markup: websiteButton() },
      );
    }
  });
}
