import { InlineKeyboard, type Bot } from "grammy";
import {
  addTelegramTaxonomy,
  getTelegramSession,
  getTelegramTaxonomy,
  type TelegramTaxonomyCategory,
} from "../services/auth.services.js";
import {
  ownerMenuCallbacks,
  taxonomyCallbacks,
  taxonomyCategoryKeyboard,
} from "../keyboards/owner-menu.js";
import { backButton } from "../keyboards/main-menu.js";

type PendingAdd =
  | { category: "BRAND" }
  | { category: "FAMILY"; brand: string }
  | { category: "MODEL"; brand: string; family: string };

const pendingAdds = new Map<number, PendingAdd>();

function parseValues(text: string): string[] {
  return [...new Set(text.split(",").map((value) => value.trim()).filter(Boolean))];
}

async function ensureOwner(telegramId: number) {
  const session = await getTelegramSession(telegramId);
  return session?.role === "OWNER" && session.status === "ACTIVE";
}

export function registerTaxonomyMenuCommand(bot: Bot) {
  bot.callbackQuery(ownerMenuCallbacks.taxonomy, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("You are not authorized to manage taxonomy.");
      return;
    }

    await ctx.reply("Choose a taxonomy to manage:", {
      reply_markup: taxonomyCategoryKeyboard(),
    });
  });

  bot.callbackQuery(/^taxonomy:category:(BRAND|FAMILY|MODEL)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("You are not authorized to manage taxonomy.");
      return;
    }

    const category = ctx.match[1] as TelegramTaxonomyCategory;
    if (category === "BRAND") {
      const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
      await ctx.reply(formatOptions("Existing brands", brands.map((brand) => brand.value)), {
        reply_markup: addKeyboard("BRAND"),
      });
      return;
    }

    const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
    if (!brands.length) {
      await ctx.reply("Add at least one brand first.", {
        reply_markup: taxonomyCategoryKeyboard(),
      });
      return;
    }

    await ctx.reply(
      category === "FAMILY"
        ? "Existing families are grouped by brand. Choose a brand to view them:"
        : "Existing models are grouped by brand and family. Choose a brand:",
      { reply_markup: optionKeyboard(brands, category === "FAMILY" ? "family" : "modelBrand") },
    );
  });

  bot.callbackQuery(/^taxonomy:family:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("You are not authorized to manage taxonomy.");
      return;
    }

    const parentId = ctx.match[1];
    const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
    const brand = brands.find((option) => option.id === parentId)?.value;
    if (!brand) {
      await ctx.reply("That brand is no longer available.");
      return;
    }

    const families = await getTelegramTaxonomy(ctx.from.id, "FAMILY", { brand });
    await ctx.reply(
      formatOptions(`Existing families for ${brand}`, families.map((family) => family.value)),
      { reply_markup: addKeyboard("FAMILY", parentId) },
    );
  });

  bot.callbackQuery(/^taxonomy:model:brand:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("You are not authorized to manage taxonomy.");
      return;
    }

    const brandId = ctx.match[1];
    const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
    const brand = brands.find((option) => option.id === brandId)?.value;
    if (!brand) {
      await ctx.reply("That brand is no longer available.");
      return;
    }

    const families = await getTelegramTaxonomy(ctx.from.id, "FAMILY", { brand });
    if (!families.length) {
      await ctx.reply(`Add a family under ${brand} first.`, {
        reply_markup: taxonomyCategoryKeyboard(),
      });
      return;
    }

    await ctx.reply(`Existing families for ${brand}. Choose one to view its models:`, {
      reply_markup: optionKeyboard(families, "modelFamily"),
    });
  });

  bot.callbackQuery(/^taxonomy:model:family:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("You are not authorized to manage taxonomy.");
      return;
    }

    const familyId = ctx.match[1];
    const families = await getTelegramTaxonomy(ctx.from.id, "FAMILY");
    const family = families.find((option) => option.id === familyId);
    const brand = (family?.metadata?.brand as string | undefined) ?? "";
    if (!family || !brand) {
      await ctx.reply("That family is no longer available.");
      return;
    }

    const models = await getTelegramTaxonomy(ctx.from.id, "MODEL", {
      brand,
      family: family.value,
    });
    await ctx.reply(
      formatOptions(
        `Existing models for ${brand} ${family.value}`,
        models.map((model) => model.value),
      ),
      { reply_markup: addKeyboard("MODEL", familyId) },
    );
  });

  bot.callbackQuery(/^taxonomy:add:(BRAND|FAMILY|MODEL)(?::(.+))?$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("You are not authorized to manage taxonomy.");
      return;
    }

    const category = ctx.match[1] as TelegramTaxonomyCategory;
    const parentId = ctx.match[2];
    if (category === "BRAND") {
      pendingAdds.set(ctx.from.id, { category });
      await ctx.reply("Send brand names separated by commas.\nExample: Toyota, Lexus", {
        reply_markup: backButton(ownerMenuCallbacks.taxonomy),
      });
      return;
    }

    const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
    if (category === "FAMILY" && parentId) {
      const brand = brands.find((option) => option.id === parentId)?.value;
      if (!brand) {
        await ctx.reply("That brand is no longer available.");
        return;
      }
      pendingAdds.set(ctx.from.id, { category, brand });
      await ctx.reply(`Send families for ${brand}, separated by commas.\nExample: Camry, Corolla`, {
        reply_markup: backButton(ownerMenuCallbacks.taxonomy),
      });
      return;
    }

    if (category === "MODEL" && parentId) {
      const families = await getTelegramTaxonomy(ctx.from.id, "FAMILY");
      const family = families.find((option) => option.id === parentId);
      const brand = (family?.metadata?.brand as string | undefined) ?? "";
      if (!family || !brand) {
        await ctx.reply("That family is no longer available.");
        return;
      }
      pendingAdds.set(ctx.from.id, { category, brand, family: family.value });
      await ctx.reply(
        `Send models for ${brand} ${family.value}, separated by commas.\nExample: Camry Hybrid, Camry Sport`,
        { reply_markup: backButton(ownerMenuCallbacks.taxonomy) },
      );
    }
  });

  bot.on("message:text", async (ctx, next) => {
    const pending = pendingAdds.get(ctx.from.id);
    if (!pending) {
      await next();
      return;
    }

    if (ctx.message.text.startsWith("/")) {
      await next();
      return;
    }

    const values = parseValues(ctx.message.text);
    if (!values.length) {
      await ctx.reply("Please send at least one value, separated by commas.");
      return;
    }

    try {
      const metadata =
        pending.category === "BRAND"
          ? null
          : pending.category === "FAMILY"
            ? { brand: pending.brand }
            : { brand: pending.brand, family: pending.family };

      await addTelegramTaxonomy(ctx.from.id, pending.category, values, metadata);
      pendingAdds.delete(ctx.from.id);
      await ctx.reply(
        `Added ${values.length} ${pending.category.toLowerCase()} option(s) successfully.`,
        { reply_markup: taxonomyCategoryKeyboard() },
      );
    } catch (error) {
      console.error("Telegram taxonomy update failed:", error);
      await ctx.reply("Could not add these taxonomy values. Check the backend logs and try again.");
    }
  });
}

function optionKeyboard(
  options: { id: string; value: string }[],
  type: "family" | "modelBrand" | "modelFamily",
) {
  const keyboard = options.reduce(
    (result, option) =>
      result.row().text(option.value, taxonomyCallbacks[type](option.id)),
    backButton(ownerMenuCallbacks.taxonomy),
  );
  return keyboard;
}

function addKeyboard(
  category: "BRAND" | "FAMILY" | "MODEL",
  parentId?: string,
) {
  return new InlineKeyboard()
    .text("➕ Add", taxonomyCallbacks.add(category, parentId))
    .row()
    .text("Back", ownerMenuCallbacks.taxonomy);
}

function formatOptions(title: string, values: string[]) {
  return `${title}:\n\n${values.length ? values.map((value) => `• ${value}`).join("\n") : "No entries yet."}`;
}
