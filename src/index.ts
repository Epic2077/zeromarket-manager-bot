import { bot } from "./bot.js";
import { registerLinkCommand } from "./commands/link.js";
import { registerOwnerMenuCommand } from "./commands/ownerMenu.js";
import { registerStartCommand } from "./commands/start.js";
import { registerTaxonomyMenuCommand } from "./commands/taxonomy.js";

console.log("[startup] Registering bot commands...");
registerStartCommand(bot);
registerLinkCommand(bot);
registerOwnerMenuCommand(bot);
registerTaxonomyMenuCommand(bot);
console.log("[startup] Bot commands registered.");

bot.catch((error) => {
  console.error("[runtime] Unhandled bot error:", error.error);
});

console.log("[startup] Starting Telegram polling...");

try {
  await bot.start({
    onStart: (botInfo) => {
      console.log(
        `[running] Khodroju manager bot started as @${botInfo.username}`,
      );
      console.log("[running] Waiting for Telegram updates...");
    },
  });
} catch (error) {
  console.error("[startup] Failed to start Telegram polling:", error);
  process.exitCode = 1;
}
