import { InlineKeyboard } from "grammy";

export const menuCallbacks = {
  user: "menu:user",
  owner: "menu:owner",
  start: "menu:start",
} as const;

export function websiteButton(): InlineKeyboard {
  return new InlineKeyboard().url("باز کردن خودروجو", "https://khodroju.ir");
}

export function userMenuButton(): InlineKeyboard {
  return new InlineKeyboard().text("👤 منوی کاربر", menuCallbacks.user);
}

export function ownerMenuButton(): InlineKeyboard {
  return new InlineKeyboard().text("👑 منوی مالک", menuCallbacks.owner);
}

export function backButton(
  callbackData: string = menuCallbacks.start,
): InlineKeyboard {
  return new InlineKeyboard().text("🔙 بازگشت", callbackData);
}

export function mainMenuKeyboard(
  role: "USER" | "ADMIN" | "OWNER",
): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .url("باز کردن خودروجو", "https://khodroju.ir")
    .row()
    .text("👤 منوی کاربر", menuCallbacks.user);

  if (role === "OWNER") {
    keyboard.text("👑 منوی مالک", menuCallbacks.owner);
  }

  return keyboard;
}
