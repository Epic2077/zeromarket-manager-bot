import type { Bot } from "grammy";
import {
  getTelegramSession,
  linkTelegramAccount,
} from "../services/auth.services.js";
import {
  backButton,
  ownerMenuButton,
  userMenuButton,
} from "../keyboards/main-menu.js";

export function registerLinkCommand(bot: Bot) {
  bot.command("link", async (ctx) => {
    const code = ctx.match.trim().toUpperCase();

    if (!code) {
      await ctx.reply(
        "لطفاً کد اتصال خود را وارد کنید.\n\n" +
          "مثال: /link ۱۲۶۳۴۵",
      );
      return;
    }

    const telegramId = String(ctx.from?.id);
    const telegramUsername = ctx.from?.username ?? null;

    try {
      const result = await linkTelegramAccount(
        code,
        telegramId,
        telegramUsername,
      );

      switch (result.result) {
        case "linked":
          {
            let session;
            try {
              session = await getTelegramSession(ctx.from?.id);
            } catch (sessionError) {
              console.error(
                "Telegram account linked, but profile lookup failed:",
                sessionError,
              );
            }

            const welcomeMessage = `✅ ${
              session?.fullName ?? "حساب شما"
            } با موفقیت به خودروجو متصل شد!`;

            await ctx.reply(
              session?.role === "OWNER"
                ? `👑 ${welcomeMessage}`
                : welcomeMessage,
              {
                reply_markup:
                  session?.role === "OWNER"
                    ? ownerMenuButton() && userMenuButton() && backButton()
                    : userMenuButton() && backButton(),
              },
            );
          }
          break;
        case "invalid_or_expired":
          await ctx.reply(
            "❌ کد اتصال نامعتبر یا منقضی شده است.\n\n" +
              "لطفاً از حساب خودروجوی خود یک کد جدید دریافت کنید.",
          );
          break;
        case "already_connected":
          await ctx.reply(
            "⚠️ این حساب تلگرام یا حساب خودروجو قبلاً متصل شده است.",
          );
      }
    } catch (error) {
      console.log("Telegram linking failed:", error);

      await ctx.reply(
        "هنگام اتصال حساب مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
      );
    }
  });
}
