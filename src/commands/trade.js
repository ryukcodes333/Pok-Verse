const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { isRegistered } = require("../db/trainers");
const { getPartySlot, getOwnedPokemon, getPokemonById, updatePokemon, nextFreePartyIndex } = require("../db/pokemon");
const { getSpecies } = require("../services/pokeapi");
const config = require("../config");

module.exports = {
  name: "trade",
  aliases: [],
  category: "Community",
  description: "Offer a Pokemon to another trainer: `!trade @user <your party index>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const target = message.mentions.users.first();
    if (!target) return message.reply("Usage: `!trade @user <party index>`");
    if (target.id === message.author.id) return message.reply("❌ You can't trade with yourself!");
    if (!isRegistered(target.id)) return message.reply(`❌ **${target.username}** hasn't registered yet.`);

    const indexArg = args.find((a) => !a.startsWith("<@") && !Number.isNaN(Number(a)));
    const index = Number(indexArg);
    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply("❔ That party index doesn't exist. Check `!party`.");

    const targetOwned = getOwnedPokemon(target.id);
    if (targetOwned.length >= 6 + 999) {
      // effectively unlimited box space; keep for clarity if limits change later
    }

    const species = await getSpecies(slot.species_id);
    const confirmMsg = await message.reply(
      `🤝 **${message.author.username}** wants to trade **${slot.nickname || species.displayName}** (Lv.${slot.level}) to **${target.username}**.\n${target.username}, react with ✅ within 60 seconds to accept.`
    );
    await confirmMsg.react("✅");
    await confirmMsg.react("❌");

    try {
      const collected = await confirmMsg.awaitReactions({
        filter: (reaction, user) => user.id === target.id && ["✅", "❌"].includes(reaction.emoji.name),
        max: 1,
        time: 60000,
        errors: ["time"],
      });
      const reaction = collected.first();
      if (reaction.emoji.name === "❌") {
        return message.channel.send(`❌ **${target.username}** declined the trade.`);
      }
      const newIndex = nextFreePartyIndex(target.id);
      updatePokemon(slot.id, { owner_id: target.id, party_index: newIndex, is_favorite: 0 });
      const embed = new EmbedBuilder()
        .setTitle("🤝 Trade complete!")
        .setDescription(`**${species.displayName}** now belongs to **${target.username}**${newIndex ? ` (party slot ${newIndex})` : " (sent to their PC box)"}!`)
        .setThumbnail(species.sprite)
        .setColor(config.embedColor);
      await message.channel.send({ embeds: [embed] });
    } catch {
      await message.channel.send(`⏳ Trade offer to **${target.username}** expired.`);
    }
  },
};
