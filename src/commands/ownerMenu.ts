import { Bot } from "grammy";
import { getTelegramSession } from "../services/auth.services.js";
import {
  mainMenuKeyboard,
  menuCallbacks,
} from "../keyboards/main-menu.js";
import {
  ownerMenuCallbacks,
  ownerMenuKeyboard,
} from "../keyboards/owner-menu.js";

export function registerOwnerMenuCommand(bot: Bot) {
  bot.callbackQuery(menuCallbacks.owner, async (ctx) => {
    await ctx.answerCallbackQuery();

    const session = await getTelegramSession(ctx.from.id);
    if (!session || session.role !== "OWNER") {
      await ctx.reply("شما اجازه دسترسی به منوی مالک را ندارید.");
      return;
    }

    await ctx.reply(
      "به منوی مالک خوش آمدید!\n\nاز این بخش می‌توانید تنظیمات ربات و امور مدیریتی را انجام دهید.",
      { reply_markup: ownerMenuKeyboard() },
    );
  });

  bot.callbackQuery(menuCallbacks.start, async (ctx) => {
    await ctx.answerCallbackQuery();

    const session = await getTelegramSession(ctx.from.id);
    if (!session) {
      await ctx.reply("لطفاً ابتدا حساب تلگرام خود را متصل کنید.");
      return;
    }

    await ctx.reply("منوی اصلی", {
      reply_markup: mainMenuKeyboard(session.role),
    });
  });
}
