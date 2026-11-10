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
import { ensureOwner, formatOptions } from "../middleware/utils.js";

type PendingAdd =
  | { category: "BRAND" }
  | { category: "FAMILY"; brand: string }
  | { category: "MODEL"; brand: string; family: string };

const pendingAdds = new Map<number, PendingAdd>();

function parseValues(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[,،]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

export function registerTaxonomyMenuCommand(bot: Bot) {
  bot.callbackQuery(ownerMenuCallbacks.taxonomy, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("شما اجازه مدیریت دسته‌بندی‌ها را ندارید.");
      return;
    }

    await ctx.reply("یک دسته‌بندی را برای مدیریت انتخاب کنید:", {
      reply_markup: taxonomyCategoryKeyboard(),
    });
  });

  bot.callbackQuery(/^taxonomy:category:(BRAND|FAMILY|MODEL)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("شما اجازه مدیریت دسته‌بندی‌ها را ندارید.");
      return;
    }

    const category = ctx.match[1] as TelegramTaxonomyCategory;
    if (category === "BRAND") {
      const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
      await ctx.reply(
        formatOptions(
          "برندهای موجود",
          brands.map((brand) => brand.value),
        ),
        {
          reply_markup: addKeyboard("BRAND"),
        },
      );
      return;
    }

    const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
    if (!brands.length) {
      await ctx.reply("ابتدا حداقل یک برند اضافه کنید.", {
        reply_markup: taxonomyCategoryKeyboard(),
      });
      return;
    }

    await ctx.reply(
      category === "FAMILY"
        ? "خانواده‌های موجود بر اساس برند گروه‌بندی شده‌اند. برای مشاهده، یک برند را انتخاب کنید:"
        : "مدل‌های موجود بر اساس برند و خانواده گروه‌بندی شده‌اند. یک برند را انتخاب کنید:",
      {
        reply_markup: optionKeyboard(
          brands,
          category === "FAMILY" ? "family" : "modelBrand",
        ),
      },
    );
  });

  bot.callbackQuery(/^taxonomy:family:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("شما اجازه مدیریت دسته‌بندی‌ها را ندارید.");
      return;
    }

    const parentId = ctx.match[1];
    const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
    const brand = brands.find((option) => option.id === parentId)?.value;
    if (!brand) {
      await ctx.reply("این برند دیگر در دسترس نیست.");
      return;
    }

    const families = await getTelegramTaxonomy(ctx.from.id, "FAMILY", {
      brand,
    });
    await ctx.reply(
      formatOptions(
        `خانواده‌های موجود برای ${brand}`,
        families.map((family) => family.value),
      ),
      { reply_markup: addKeyboard("FAMILY", parentId) },
    );
  });

  bot.callbackQuery(/^taxonomy:model:brand:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("شما اجازه مدیریت دسته‌بندی‌ها را ندارید.");
      return;
    }

    const brandId = ctx.match[1];
    const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
    const brand = brands.find((option) => option.id === brandId)?.value;
    if (!brand) {
      await ctx.reply("این برند دیگر در دسترس نیست.");
      return;
    }

    const families = await getTelegramTaxonomy(ctx.from.id, "FAMILY", {
      brand,
    });
    if (!families.length) {
      await ctx.reply(`ابتدا یک خانواده برای ${brand} اضافه کنید.`, {
        reply_markup: taxonomyCategoryKeyboard(),
      });
      return;
    }

    await ctx.reply(
      `خانواده‌های موجود برای ${brand}. برای مشاهده مدل‌ها یکی را انتخاب کنید:`,
      {
        reply_markup: optionKeyboard(families, "modelFamily"),
      },
    );
  });

  bot.callbackQuery(/^taxonomy:model:family:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!(await ensureOwner(ctx.from.id))) {
      await ctx.reply("شما اجازه مدیریت دسته‌بندی‌ها را ندارید.");
      return;
    }

    const familyId = ctx.match[1];
    const families = await getTelegramTaxonomy(ctx.from.id, "FAMILY");
    const family = families.find((option) => option.id === familyId);
    const brand = (family?.metadata?.brand as string | undefined) ?? "";
    if (!family || !brand) {
      await ctx.reply("این خانواده دیگر در دسترس نیست.");
      return;
    }

    const models = await getTelegramTaxonomy(ctx.from.id, "MODEL", {
      brand,
      family: family.value,
    });
    await ctx.reply(
      formatOptions(
        `مدل‌های موجود برای ${brand} ${family.value}`,
        models.map((model) => model.value),
      ),
      { reply_markup: addKeyboard("MODEL", familyId) },
    );
  });

  bot.callbackQuery(
    /^taxonomy:add:(BRAND|FAMILY|MODEL)(?::(.+))?$/,
    async (ctx) => {
      await ctx.answerCallbackQuery();
      if (!(await ensureOwner(ctx.from.id))) {
        await ctx.reply("شما اجازه مدیریت دسته‌بندی‌ها را ندارید.");
        return;
      }

      const category = ctx.match[1] as TelegramTaxonomyCategory;
      const parentId = ctx.match[2];
      if (category === "BRAND") {
        pendingAdds.set(ctx.from.id, { category });
        await ctx.reply(
          "نام برندها را با کاما جدا کنید.\nمثال: Toyota, Lexus",
          {
            reply_markup: backButton(ownerMenuCallbacks.taxonomy),
          },
        );
        return;
      }

      const brands = await getTelegramTaxonomy(ctx.from.id, "BRAND");
      if (category === "FAMILY" && parentId) {
        const brand = brands.find((option) => option.id === parentId)?.value;
        if (!brand) {
          await ctx.reply("این برند دیگر در دسترس نیست.");
          return;
        }
        pendingAdds.set(ctx.from.id, { category, brand });
        await ctx.reply(
          `نام خانواده‌های ${brand} را با کاما جدا کنید.\nمثال: Camry, Corolla`,
          {
            reply_markup: backButton(ownerMenuCallbacks.taxonomy),
          },
        );
        return;
      }

      if (category === "MODEL" && parentId) {
        const families = await getTelegramTaxonomy(ctx.from.id, "FAMILY");
        const family = families.find((option) => option.id === parentId);
        const brand = (family?.metadata?.brand as string | undefined) ?? "";
        if (!family || !brand) {
          await ctx.reply("این خانواده دیگر در دسترس نیست.");
          return;
        }
        pendingAdds.set(ctx.from.id, { category, brand, family: family.value });
        await ctx.reply(
          `نام مدل‌های ${brand} ${family.value} را با کاما جدا کنید.\nمثال: Camry Hybrid, Camry Sport`,
          { reply_markup: backButton(ownerMenuCallbacks.taxonomy) },
        );
      }
    },
  );

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
      await ctx.reply("لطفاً حداقل یک مقدار را با کاما جدا کرده و ارسال کنید.");
      return;
    }

    try {
      const metadata =
        pending.category === "BRAND"
          ? null
          : pending.category === "FAMILY"
            ? { brand: pending.brand }
            : { brand: pending.brand, family: pending.family };

      const existing = await getTelegramTaxonomy(
        ctx.from.id,
        pending.category,
        pending.category === "BRAND"
          ? {}
          : pending.category === "FAMILY"
            ? { brand: pending.brand }
            : { brand: pending.brand, family: pending.family },
      );
      const existingValues = new Set(
        existing.map((option) => option.value.trim().toLocaleLowerCase()),
      );
      const successful: string[] = [];
      const duplicates: string[] = [];
      const failed: string[] = [];

      for (const value of values) {
        if (existingValues.has(value.toLocaleLowerCase())) {
          duplicates.push(value);
          continue;
        }

        try {
          await addTelegramTaxonomy(
            ctx.from.id,
            pending.category,
            [value],
            metadata,
          );
          successful.push(value);
        } catch (error) {
          console.error(`Could not add taxonomy "${value}":`, error);
          failed.push(value);
        }
      }

      pendingAdds.delete(ctx.from.id);
      const result = [
        successful.length
          ? `✅ با موفقیت اضافه شد:\n${successful
              .map((value) => `• ${value}`)
              .join("\n")}`
          : "",
        duplicates.length
          ? `⚠️ تکراری بود و اضافه نشد:\n${duplicates
              .map((value) => `• ${value}`)
              .join("\n")}`
          : "",
        failed.length
          ? `❌ به دلیل خطا اضافه نشد:\n${failed
              .map((value) => `• ${value}`)
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      await ctx.reply(result || "هیچ مقداری اضافه نشد.", {
        reply_markup: taxonomyCategoryKeyboard(),
      });
    } catch (error) {
      console.error("Telegram taxonomy update failed:", error);
      await ctx.reply(
        "افزودن این موارد انجام نشد. گزارش‌های backend را بررسی کرده و دوباره تلاش کنید.",
      );
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
    .text("➕ افزودن", taxonomyCallbacks.add(category, parentId))
    .row()
    .text("🔙 بازگشت", ownerMenuCallbacks.taxonomy);
}
