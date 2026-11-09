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
        "Please provide your linking code. \n\n" + "Example: /link 126345",
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
              session?.fullName ?? "Your"
            } Telegram account has been successfully connected to Khodroju!`;

            await ctx.reply(
              session?.role === "OWNER"
                ? `👑${welcomeMessage}`
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
            "❌ Invalid or expired code. \n\n" +
              "Please generate a new code from your KhodroJu profile.",
          );
          break;
        case "already_connected":
          await ctx.reply(
            "⚠️ This telegram account or Khodroju account is already connected.",
          );
      }
    } catch (error) {
      console.log("Telegram linking failed:", error);

      await ctx.reply(
        "Something went wrong while connecting your account. Please try again.",
      );
    }
  });
}
