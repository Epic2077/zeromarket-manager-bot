import { InlineKeyboard } from "grammy";

export const menuCallbacks = {
  user: "menu:user",
  owner: "menu:owner",
  start: "menu:start",
} as const;

export function websiteButton(): InlineKeyboard {
  return new InlineKeyboard().url("Open Khodroju", "https://khodroju.ir");
}

export function userMenuButton(): InlineKeyboard {
  return new InlineKeyboard().text("User Menu", menuCallbacks.user);
}

export function ownerMenuButton(): InlineKeyboard {
  return new InlineKeyboard().text("Owner Menu", menuCallbacks.owner);
}

export function backButton(
  callbackData: string = menuCallbacks.start,
): InlineKeyboard {
  return new InlineKeyboard().text("Back", callbackData);
}

export function mainMenuKeyboard(
  role: "USER" | "ADMIN" | "OWNER",
): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .url("Open Khodroju", "https://khodroju.ir")
    .row()
    .text("👤 User Menu", menuCallbacks.user);

  if (role === "OWNER") {
    keyboard.text("👑 Owner Menu", menuCallbacks.owner);
  }

  return keyboard;
}
