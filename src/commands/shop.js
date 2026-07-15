const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { SHOP_ITEMS } = require("../data/items");
const config = require("../config");

module.exports = {
  name: "shop",
  aliases: ["store"],
  category: "Items",
  description: "Browse the item shop.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const groups = {
      ball: "🔴 Poke Balls",
      heal: "💊 Healing",
      revive: "💫 Revives",
      candy: "🍬 Candy",
      "evo-stone": "🪨 Evolution Stones",
      friendship: "❤️ Friendship",
      held: "🎒 Held Items",
    };
    const embed = new EmbedBuilder().setTitle("🛒 PokéMart").setColor(config.embedColor);
    for (const [type, label] of Object.entries(groups)) {
      const items = SHOP_ITEMS.filter((i) => i.type === type);
      if (!items.length) continue;
      embed.addFields({
        name: label,
        value: items.map((i) => `**${i.name}** — ${i.price.toLocaleString()} coins`).join("\n"),
      });
    }
    embed.setFooter({ text: "Buy with !buy <item> <amount>  •  Sell with !sell <item> <amount>" });
    await message.reply({ embeds: [embed] });
  },
};
