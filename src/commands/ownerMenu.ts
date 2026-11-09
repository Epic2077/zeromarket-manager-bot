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
      await ctx.reply("You are not authorized to open the owner menu.");
      return;
    }

    await ctx.reply(
      "Welcome to the Owner Menu! Here you can manage your bot settings and perform administrative tasks.",
      { reply_markup: ownerMenuKeyboard() },
    );
  });

  bot.callbackQuery(menuCallbacks.start, async (ctx) => {
    await ctx.answerCallbackQuery();

    const session = await getTelegramSession(ctx.from.id);
    if (!session) {
      await ctx.reply("Please link your Telegram account first.");
      return;
    }

    await ctx.reply("Main menu", {
      reply_markup: mainMenuKeyboard(session.role),
    });
  });
}
