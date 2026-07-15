const { EmbedBuilder } = require("discord.js");
const config = require("../config");
const { typeEmoji } = require("../data/typeEmojis");
const { genderEmoji, ivPercent, xpToNextLevel } = require("./mechanics");

function displayName(pokemonRow, speciesDisplayName) {
  return pokemonRow.nickname || speciesDisplayName;
}

// EXACT layout required for `!party <index>` (and general Pokemon info views).
// Uses setThumbnail (NOT setImage) for the artwork per spec.
function buildPartyDetailEmbed(pokemonRow, species, moveDisplayNames) {
  const name = displayName(pokemonRow, species.displayName);
  const gEmoji = genderEmoji(pokemonRow.gender);
  const types = species.types;
  const type1Line = `> ${typeEmoji(types[0])} ${cap(types[0])}`;
  const type2Line = types[1] ? `\n> ${typeEmoji(types[1])} ${cap(types[1])}` : "";

  const stats = {
    hp: statOf(pokemonRow, species, "hp"),
    attack: statOf(pokemonRow, species, "attack"),
    defense: statOf(pokemonRow, species, "defense"),
    spAttack: statOf(pokemonRow, species, "spAttack"),
    spDefense: statOf(pokemonRow, species, "spDefense"),
    speed: statOf(pokemonRow, species, "speed"),
  };

  const moves = [0, 1, 2, 3].map((i) => moveDisplayNames[i] || "—");
  const circled = ["①", "②", "③", "④"];

  const description = [
    `**#${String(species.id).padStart(3, "0")}** • **Level ${pokemonRow.level}**`,
    ``,
    `🧬 **Nature**`,
    `> ${pokemonRow.nature}`,
    ``,
    `🎯 **Ability**`,
    `> ${cap(pokemonRow.ability)}`,
    ``,
    `❤️ **HP**`,
    `> ${pokemonRow.current_hp} / ${stats.hp}`,
    ``,
    `🌟 **Type**`,
    type1Line + type2Line,
    ``,
    `🎒 **Held Item**`,
    `> ${pokemonRow.held_item || "None"}`,
    ``,
    `📈 **Stats**`,
    `> ❤️ HP: **${stats.hp}**`,
    `> ⚔️ Attack: **${stats.attack}**`,
    `> 🛡️ Defense: **${stats.defense}**`,
    `> ✨ Sp. Atk: **${stats.spAttack}**`,
    `> 🌙 Sp. Def: **${stats.spDefense}**`,
    `> 💨 Speed: **${stats.speed}**`,
    ``,
    `⚔️ **Moves**`,
    ...moves.map((m, i) => `> ${circled[i]} ${cap(m)}`),
    ``,
    `⭐ **Training**`,
    `> 🧬 IV: **${ivPercent(pokemonRow.ivs)}%**`,
    `> ❤️ Friendship: **${pokemonRow.friendship}/255**`,
    `> 📊 XP: **${pokemonRow.xp} / ${xpToNextLevel(pokemonRow.level)}**`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `💡 **Quick Commands**`,
    `• \`!moves ${pokemonRow.party_index || ""}\``,
    `• \`!learn ${pokemonRow.party_index || ""}\``,
    `• \`!nickname ${pokemonRow.party_index || ""}\``,
    `• \`!favorite ${pokemonRow.party_index || ""}\``,
    `• \`!release ${pokemonRow.party_index || ""}\``,
  ].join("\n");

  return new EmbedBuilder()
    .setTitle(`${name} ${gEmoji}`)
    .setDescription(description)
    .setThumbnail(species.sprite)
    .setColor(pokemonRow.is_shiny ? 0xffd700 : config.embedColor);
}

function statOf(pokemonRow, species, key) {
  const { calcAllStats } = require("./mechanics");
  const nature = { up: null, down: null };
  const natures = require("../data/natures");
  const found = natures.getNature(pokemonRow.nature) || nature;
  const stats = calcAllStats({
    baseStats: species.stats,
    ivs: pokemonRow.ivs,
    evs: pokemonRow.evs,
    level: pokemonRow.level,
    nature: found,
  });
  return stats[key];
}

function cap(s) {
  if (!s) return s;
  return String(s)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// EXACT layout required for wild encounters. Uses setImage (normal image),
// not a thumbnail.
function buildWildEncounterEmbed(species, level) {
  const name = species.displayName;
  const primaryType = species.types[0];
  const description = [
    `## ✨ **A wild ${name} appeared!**`,
    ``,
    `🌿 The tall grass begins to shake...`,
    ``,
    `${typeEmoji(primaryType)} **${name}** is watching you carefully.`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `🎯 **Catch it first!**`,
    `> Type \`!catch ${name}\``,
    ``,
    `⏳ **Time Remaining**`,
    `> 5 minutes`,
    ``,
    `💰 **Reward**`,
    `> XP • PokéCoins • Collection Progress`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `💡 *Hint:* The Pokémon's name is **${name}**.`,
  ].join("\n");

  return new EmbedBuilder()
    .setTitle("🌿 Wild Encounter!")
    .setDescription(description)
    .setImage(species.sprite)
    .setFooter({ text: `A Level ${level} ${name} • Kanto Region` })
    .setColor(config.embedColor);
}

// EXACT layout required for registration.
function buildRegistrationEmbed(username, trainerId) {
  const description = [
    `Your Trainer Card has been created successfully.`,
    ``,
    `👤 **Trainer:** ${username}`,
    `🆔 **Trainer ID:** #${trainerId}`,
    `🌍 **Region:** Kanto`,
    `💰 **Starting Coins:** 5,000`,
    `🎒 **Poké Balls:** ×10`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `🎁 **Starter Pokémon**`,
    `Choose your first partner:`,
    ``,
    `🌱 \`!starter Bulbasaur\``,
    `🔥 \`!starter Charmander\``,
    `💧 \`!starter Squirtle\``,
    ``,
    `> Your Pokémon journey begins now!`,
  ].join("\n");

  return new EmbedBuilder()
    .setTitle("🎉 Welcome, Trainer!")
    .setDescription(description)
    .setColor(config.embedColor);
}

module.exports = {
  displayName,
  buildPartyDetailEmbed,
  buildWildEncounterEmbed,
  buildRegistrationEmbed,
  cap,
};
