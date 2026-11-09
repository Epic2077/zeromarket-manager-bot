import { bot } from "./bot.js";
import { registerLinkCommand } from "./commands/link.js";
import { registerOwnerMenuCommand } from "./commands/ownerMenu.js";
import { registerStartCommand } from "./commands/start.js";
import { registerTaxonomyMenuCommand } from "./commands/taxonomy.js";

registerStartCommand(bot);
registerLinkCommand(bot);
registerOwnerMenuCommand(bot);
registerTaxonomyMenuCommand(bot);

bot.catch((error) => {
  console.error("Unhandled bot error:", error.error);
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Khodroju manager bot started as @${botInfo.username}`);
  },
});
