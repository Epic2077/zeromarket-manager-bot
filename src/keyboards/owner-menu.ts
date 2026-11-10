import { InlineKeyboard } from "grammy";
import { menuCallbacks } from "./main-menu.js";

export const ownerMenuCallbacks = {
  taxonomy: "owner:taxonomy",
  users: "owner:users",
} as const;

export const taxonomyCallbacks = {
  category: (category: "BRAND" | "FAMILY" | "MODEL") =>
    `taxonomy:category:${category}`,
  family: (brandId: string) => `taxonomy:family:${brandId}`,
  modelBrand: (brandId: string) => `taxonomy:model:brand:${brandId}`,
  modelFamily: (familyId: string) => `taxonomy:model:family:${familyId}`,
  add: (category: "BRAND" | "FAMILY" | "MODEL", parentId?: string) =>
    `taxonomy:add:${category}${parentId ? `:${parentId}` : ""}`,
} as const;

export const userCallbacks = {
  allUsers: "owner:users:all",
  userDetails: (userId: string) => `owner:users:details:${userId}`,
  userSearch: (userName: string) => `owner:users:search:${userName}`,
};

export function taxonomyButton(): InlineKeyboard {
  return new InlineKeyboard().text(
    "📔 مدیریت دسته‌بندی‌ها",
    ownerMenuCallbacks.taxonomy,
  );
}

export function ownerMenuKeyboard(): InlineKeyboard {
  return taxonomyButton()
    .text("👤 مدیریت کاربر", ownerMenuCallbacks.users)
    .row()
    .text("🔙 بازگشت", menuCallbacks.start);
}

export function taxonomyCategoryKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🚗 برندها", taxonomyCallbacks.category("BRAND"))
    .row()
    .text("🚘 خانواده‌ها", taxonomyCallbacks.category("FAMILY"))
    .text("📋 مدل‌ها", taxonomyCallbacks.category("MODEL"))
    .row()
    .text("🔙 بازگشت", menuCallbacks.owner);
}

export function userButton(): InlineKeyboard {
  return new InlineKeyboard().text("👤 مدیریت کاربر", ownerMenuCallbacks.users);
}

export function userMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("همه ی کاربران 👥", userCallbacks.allUsers)
    .row()
    .text("اطلاعات کاربر 📝", userCallbacks.userDetails("details"))
    .row()
    .text("🔍 جستجوی کاربر", userCallbacks.userSearch("search"))
    .row()
    .text("🔙 بازگشت", menuCallbacks.owner);
}
