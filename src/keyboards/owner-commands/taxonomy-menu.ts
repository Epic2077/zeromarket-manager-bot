import { InlineKeyboard } from "grammy";

export const taxonomyMenuCallbacks = {
  brands: "taxonomy:brands",
  families: "taxonomy:families",
  models: "taxonomy:models",
} as const;

export function brandsButton(): InlineKeyboard {
  return new InlineKeyboard().text("🚗 Brand", taxonomyMenuCallbacks.brands);
}
