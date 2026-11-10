import type { Bot, Context } from "grammy";
import {
  getTelegramUsers,
  type TelegramBotUser,
} from "../services/auth.services.js";
import { ensureOwner } from "../middleware/utils.js";
import { ownerMenuCallbacks, userMenuKeyboard } from "../keyboards/owner-menu.js";

type UserRequest = "details" | "search";

const pendingRequests = new Map<number, UserRequest>();

function userName(user: TelegramBotUser): string {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || "بدون نام";
}

function formatUser(user: TelegramBotUser): string {
  const username = user.username ? `\nنام کاربری: @${user.username}` : "";
  return `👤 ${userName(user)}\nشناسه چت: ${user.chat_id}${username}`;
}

function formatUsers(users: TelegramBotUser[]): string {
  if (!users.length) return "کاربری پیدا نشد.";
  return users.map((user, index) => `${index + 1}. ${formatUser(user)}`).join("\n\n");
}

async function replyWithUsers(ctx: Context, filters: { fullname?: string; chatId?: string }) {
  const users = await getTelegramUsers(filters);
  await ctx.reply(formatUsers(users), {
    reply_markup: userMenuKeyboard(),
  });
}

export function registerUserMenuCommand(bot: Bot) {
  bot.callbackQuery(ownerMenuCallbacks.users, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("شما اجازه مدیریت کاربران را ندارید.");
      return;
    }

    await ctx.reply("یک گزینه را برای مدیریت کاربران انتخاب کنید:", {
      reply_markup: userMenuKeyboard(),
    });
  });

  bot.callbackQuery(/^owner:users:(all|details|search)(?::[^:]+)?$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("شما اجازه مدیریت کاربران را ندارید.");
      return;
    }

    const action = ctx.match[1] as UserRequest | "all";
    if (action === "all") {
      try {
        await replyWithUsers(ctx, {});
      } catch (error) {
        console.error("Could not load Telegram users:", error);
        await ctx.reply("در حال حاضر امکان دریافت کاربران وجود ندارد.");
      }
      return;
    }

    pendingRequests.set(ctx.from.id, action);
    await ctx.reply(
      action === "details"
        ? "شناسه چت کاربر را ارسال کنید:"
        : "نام یا نام خانوادگی کاربر را ارسال کنید:",
      { reply_markup: { force_reply: true } },
    );
  });

  bot.on("message:text", async (ctx) => {
    const action = pendingRequests.get(ctx.from.id);
    if (!action) return;

    pendingRequests.delete(ctx.from.id);
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("شما اجازه مدیریت کاربران را ندارید.");
      return;
    }

    const value = ctx.message.text.trim();
    if (!value) {
      await ctx.reply("مقدار واردشده نمی‌تواند خالی باشد.");
      return;
    }
    if (action === "details" && !/^-?\d+$/.test(value)) {
      await ctx.reply("شناسه چت باید یک عدد معتبر باشد.");
      return;
    }

    try {
      await replyWithUsers(
        ctx,
        action === "details" ? { chatId: value } : { fullname: value },
      );
    } catch (error) {
      console.error("Could not query Telegram users:", error);
      await ctx.reply("در حال حاضر امکان جستجوی کاربران وجود ندارد.");
    }
  });

}
