const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getPartySlot, getOwnedPokemon, getPokemonById, updatePokemon, nextFreePartyIndex } = require("../db/pokemon");
const { listMarket, createListing, getListing, removeListing } = require("../db/market");
const { getTrainer, addCoins } = require("../db/trainers");
const { getSpecies } = require("../services/pokeapi");
const config = require("../config");

module.exports = {
  name: "market",
  aliases: ["marketplace"],
  category: "Community",
  description: "Player marketplace: `!market`, `!market list <index> <price>`, `!market buy <id>`, `!market remove <id>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const sub = args[0];

    if (sub === "list") {
      const index = Number(args[1]);
      const price = Number(args[2]);
      if (!index || !price || price <= 0) return message.reply("Usage: `!market list <party index> <price>`");
      const owned = getOwnedPokemon(message.author.id);
      const slot = owned.find((p) => p.party_index === index);
      if (!slot) return message.reply("❔ That party index doesn't exist.");
      const listing = createListing(message.author.id, slot.id, price);
      updatePokemon(slot.id, { party_index: null });
      return message.reply(`📤 Listed **#${slot.id}** for **${price.toLocaleString()}** coins as listing **#${listing.id}**.`);
    }

    if (sub === "buy") {
      const id = Number(args[1]);
      const listing = getListing(id);
      if (!listing) return message.reply("❔ No listing with that ID.");
      if (listing.seller_id === message.author.id) return message.reply("❌ You can't buy your own listing.");
      const buyer = getTrainer(message.author.id);
      if (buyer.coins < listing.price) return message.reply(`💰 You need **${listing.price.toLocaleString()}** coins.`);
      const pokemon = getPokemonById(listing.pokemon_id);
      if (!pokemon) {
        removeListing(id);
        return message.reply("❔ That Pokemon no longer exists.");
      }
      addCoins(message.author.id, -listing.price);
      addCoins(listing.seller_id, listing.price);
      const newIndex = nextFreePartyIndex(message.author.id);
      updatePokemon(pokemon.id, { owner_id: message.author.id, party_index: newIndex });
      removeListing(id);
      const species = await getSpecies(pokemon.species_id);
      return message.reply(`🛒 Bought **${pokemon.nickname || species.displayName}** for **${listing.price.toLocaleString()}** coins!`);
    }

    if (sub === "remove") {
      const id = Number(args[1]);
      const listing = getListing(id);
      if (!listing || listing.seller_id !== message.author.id) return message.reply("❔ No listing of yours with that ID.");
      const pokemon = getPokemonById(listing.pokemon_id);
      if (pokemon) {
        const newIndex = nextFreePartyIndex(message.author.id);
        updatePokemon(pokemon.id, { party_index: newIndex });
      }
      removeListing(id);
      return message.reply(`📥 Listing **#${id}** removed and returned to your collection.`);
    }

    const listings = listMarket();
    if (!listings.length) return message.reply("🤝 The market is empty right now. List a Pokemon with `!market list <index> <price>`.");
    const lines = await Promise.all(
      listings.slice(0, 20).map(async (l) => {
        const pokemon = getPokemonById(l.pokemon_id);
        if (!pokemon) return null;
        const species = await getSpecies(pokemon.species_id);
        return `**#${l.id}** — ${pokemon.nickname || species.displayName} (Lv.${pokemon.level}) — ${l.price.toLocaleString()} coins — seller <@${l.seller_id}>`;
      })
    );
    const embed = new EmbedBuilder()
      .setTitle("🤝 Trainer Marketplace")
      .setDescription(lines.filter(Boolean).join("\n") || "No active listings.")
      .setFooter({ text: "!market buy <id>  •  !market list <index> <price>  •  !market remove <id>" })
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
