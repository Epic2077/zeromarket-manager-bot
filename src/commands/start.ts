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
          "به مدیریت خودروجو خوش آمدید!\n\n" +
            "حساب تلگرام شما هنوز متصل نشده است.\n\n" +
            "وارد حساب خودروجوی خود شوید، یک کد اتصال دریافت کنید " +
            "و آن را با دستور زیر ارسال کنید:\n\n" +
            "/link کد_اتصال",
          { reply_markup: websiteButton() },
        );

        return;
      }

      const roleMessage =
        session.role === "USER"
          ? ""
          : `\n\nنقش: ${session.role === "OWNER" ? "مالک" : "مدیر"}`;
      await ctx.reply(`به مدیریت خودروجو خوش آمدید!${roleMessage}`, {
        reply_markup:
          mainMenuKeyboard(session.role),
      });
    } catch (error) {
      console.error("Telegram connection check failed:", error);
      await ctx.reply(
        "در حال حاضر امکان بررسی حساب شما وجود ندارد. لطفاً بعداً دوباره تلاش کنید.",
        { reply_markup: websiteButton() },
      );
    }
  });
}
