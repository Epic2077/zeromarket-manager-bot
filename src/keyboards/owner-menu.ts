import { InlineKeyboard } from "grammy";
import { menuCallbacks } from "./main-menu.js";

export const ownerMenuCallbacks = {
  taxonomy: "owner:taxonomy",
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

export function taxonomyButton(): InlineKeyboard {
  return new InlineKeyboard().text("📔 مدیریت دسته‌بندی‌ها", ownerMenuCallbacks.taxonomy);
}

export function ownerMenuKeyboard(): InlineKeyboard {
  return taxonomyButton().row().text("🔙 بازگشت", menuCallbacks.start);
}

export function taxonomyCategoryKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🚗 برندها", taxonomyCallbacks.category("BRAND"))
    .row()
    .text("🚘 خانواده‌ها", taxonomyCallbacks.category("FAMILY"))
    .row()
    .text("📋 مدل‌ها", taxonomyCallbacks.category("MODEL"))
    .row()
    .text("🔙 بازگشت", ownerMenuCallbacks.taxonomy);
}
