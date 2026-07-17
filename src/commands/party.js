const { AttachmentBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getParty, getPartySlot } = require("../db/pokemon");
const { getSpecies, getMove } = require("../services/pokeapi");
const { buildPartyDetailEmbed, cap } = require("../services/embeds");
const { buildPartyImage } = require("../services/partyImage");
const { calcAllStats } = require("../services/mechanics");
const { getNature } = require("../data/natures");
const { typeEmoji } = require("../data/typeEmojis");
const config = require("../config");

/**
 * Build the plain-text caption that matches the requested layout exactly.
 */
async function buildPartyCaption(party) {
  const lines = ["# 👥 Your Party\n"];
  for (let i = 1; i <= 6; i++) {
    const p = party.find((x) => x.party_index === i);
    if (!p) {
      lines.push(`\`${i}.\` *(empty)*\n`);
      continue;
    }
    let species;
    try { species = await getSpecies(p.species_id); } catch { species = null; }

    const nature = getNature(p.nature) || { up: null, down: null };
    const stats = species
      ? calcAllStats({ baseStats: species.stats, ivs: p.ivs, evs: p.evs, level: p.level, nature })
      : { hp: p.current_hp };
    const maxHp = stats.hp;
    const displayName = p.nickname || (species ? species.displayName : p.species_name);
    const types = species ? species.types : [];
    const typeStr = types.length
      ? types.map((t) => `${typeEmoji(t)} ${cap(t)}`).join(" | ")
      : "—";

    lines.push(
      `\`${i}.\` **${displayName}**\n` +
      `> Lv. \`${p.level}\`\n` +
      `> ❤️ \`${p.current_hp}/${maxHp}\`\n` +
      `> 🌟 ${typeStr}\n`
    );
  }
  return lines.join("\n");
}

module.exports = {
  name: "party",
  aliases: ["team"],
  category: "Pokemon",
  description: "View your party as an image (`!party`), or full details (`!party <index>`).",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const party = getParty(message.author.id);

    if (!party.length) {
      return message.reply("🐾 Your party is empty! Catch some Pokémon with `!explore` and `!catch`.");
    }

    // ── !party <index> — full detail embed ───────────────────────────────
    if (args.length) {
      const index = Number(args[0]);
      const slot = getPartySlot(message.author.id, index);
      if (!slot) return message.reply(`❔ No Pokémon in party slot **${index}**. Use \`!party\` to see your team.`);
      const species = await getSpecies(slot.species_id);
      const moveNames = await Promise.all(
        slot.moves.map(async (m) => {
          try { const move = await getMove(m); return move.displayName; }
          catch { return cap(m); }
        })
      );
      const embed = buildPartyDetailEmbed(slot, species, moveNames);
      return message.reply({ embeds: [embed] });
    }

    // ── !party — generate image + caption ────────────────────────────────
    // Build slot data for the image
    const imageSlots = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const p = party.find((x) => x.party_index === i + 1);
        if (!p) return null;
        let species = null;
        try { species = await getSpecies(p.species_id); } catch { /* ignore */ }

        const nature = getNature(p.nature) || { up: null, down: null };
        const stats = species
          ? calcAllStats({ baseStats: species.stats, ivs: p.ivs, evs: p.evs, level: p.level, nature })
          : { hp: p.current_hp };

        return {
          name: p.nickname || (species ? species.displayName : p.species_name),
          level: p.level,
          currentHp: p.current_hp,
          maxHp: stats.hp,
          types: species ? species.types : [],
          spriteUrl: species ? species.sprite : null,
          isShiny: !!p.is_shiny,
          isFavorite: !!p.is_favorite,
        };
      })
    );

    // Build caption text
    const caption = await buildPartyCaption(party);

    // Generate the party image
    let imgBuffer;
    try {
      imgBuffer = await buildPartyImage(imageSlots, message.author.username);
    } catch (err) {
      // If canvas fails, fall back to caption-only
      return message.reply(caption);
    }

    const attachment = new AttachmentBuilder(imgBuffer, { name: "party.png" });
    await message.reply({ content: caption, files: [attachment] });
  },
};
