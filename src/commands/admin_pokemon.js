// Co-owners can only: givepoke, removepoke, healpoke
// Everything else (set*, edit, clone, devolve, release) requires Owner.
const { requireOwner, requireCoOwner } = require("../services/guard");
const { state, save } = require("../db/store");
const { getTrainer } = require("../db/trainers");
const { getSpecies } = require("../services/pokeapi");
const {
  rollIVs, rollGender, rollAbility, rollShiny, randomNature, calcAllStats, pickMovesForLevel,
} = require("../services/mechanics");

function resolveUser(args, idx = 0) {
  const mention = args[idx];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}
function getUserPokemon(userId) {
  return Object.values(state.pokemon.byId).filter((p) => p.owner_id === userId);
}
function getPokemonByOwnerSlot(userId, slot) {
  const list = getUserPokemon(userId).sort((a, b) => a.id - b.id);
  const idx = parseInt(slot, 10);
  if (isNaN(idx) || idx < 1 || idx > list.length) return null;
  return list[idx - 1];
}

// ── COOWNER ACCESSIBLE ────────────────────────────────────────────────────────

const givepoke = {
  name: "givepoke", aliases: [], category: "CoOwner",
  description: "Give a Pokémon to a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const pokeName = args[1];
    if (!userId || !pokeName) return message.reply("❌ Usage: `!givepoke @user <pokemon> [level]`");
    const level = parseInt(args[2], 10) || 5;
    try {
      const species = await getSpecies(pokeName.toLowerCase());
      const ivs = rollIVs();
      const nature = randomNature();
      const gender = rollGender(species.genderRate);
      const ability = rollAbility(species.abilities);
      const moves = pickMovesForLevel(species.learnset, level);
      const stats = calcAllStats({ baseStats: species.stats, ivs, evs: {}, level, nature });
      const id = state.pokemon.nextId++;
      state.pokemon.byId[String(id)] = {
        id, owner_id: userId,
        species_id: species.id, species_name: species.name,
        nickname: null, level, xp: 0, nature, gender, ability,
        is_shiny: false, is_alpha: false,
        ivs, evs: { hp:0, attack:0, defense:0, spAttack:0, spDefense:0, speed:0 },
        moves, current_hp: stats.hp, max_hp: stats.hp,
        held_item: null, friendship: 70, party_index: null,
      };
      save();
      await message.reply(`✅ Gave **${species.name}** (Lv. ${level}) to <@${userId}>.`);
    } catch {
      await message.reply(`❌ Could not find Pokémon \`${pokeName}\`. Check the spelling.`);
    }
  },
};

const removepoke = {
  name: "removepoke", aliases: [], category: "CoOwner",
  description: "Remove a Pokémon from a user by slot.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const slot = args[1];
    if (!userId || !slot) return message.reply("❌ Usage: `!removepoke @user <slot>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found at that slot.");
    delete state.pokemon.byId[String(poke.id)];
    save();
    await message.reply(`✅ Removed **${poke.species_name}** (slot ${slot}) from <@${userId}>.`);
  },
};

const healpoke = {
  name: "healpoke", aliases: [], category: "CoOwner",
  description: "Fully heal all Pokémon of a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    if (!userId) return message.reply("❌ Usage: `!healpoke @user`");
    const owned = getUserPokemon(userId);
    if (!owned.length) return message.reply("❌ That user has no Pokémon.");
    for (const p of owned) p.current_hp = p.max_hp || 1;
    save();
    await message.reply(`✅ Healed all **${owned.length}** Pokémon of <@${userId}>.`);
  },
};

// ── OWNER ONLY ────────────────────────────────────────────────────────────────

const editpoke = {
  name: "editpoke", aliases: [], category: "Owner",
  description: "Edit a field on a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0);
    const slot = args[1]; const field = args[2]; const value = args[3];
    if (!userId || !slot || !field || value === undefined) return message.reply("❌ Usage: `!editpoke @user <slot> <field> <value>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    const safe = ["nickname","friendship","held_item"];
    if (!safe.includes(field)) return message.reply(`❌ Editable fields: ${safe.join(", ")}`);
    poke[field] = value === "null" ? null : value;
    save();
    await message.reply(`✅ Set **${field}** → \`${value}\` on ${poke.species_name}.`);
  },
};

const clonepoke = {
  name: "clonepoke", aliases: [], category: "Owner",
  description: "Clone a user's Pokémon to another user (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const srcId = resolveUser(args, 0); const slot = args[1]; const dstId = resolveUser(args, 2);
    if (!srcId || !slot || !dstId) return message.reply("❌ Usage: `!clonepoke @source <slot> @target`");
    const poke = getPokemonByOwnerSlot(srcId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    const id = state.pokemon.nextId++;
    state.pokemon.byId[String(id)] = { ...poke, id, owner_id: dstId, party_index: null };
    save();
    await message.reply(`✅ Cloned **${poke.species_name}** from <@${srcId}> → <@${dstId}>.`);
  },
};

const devolve = {
  name: "devolve", aliases: [], category: "Owner",
  description: "Note a de-evolution for a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1];
    if (!userId || !slot) return message.reply("❌ Usage: `!devolve @user <slot>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    await message.reply(`✅ \`!devolve\` noted for **${poke.species_name}**.\n⚠️ Implement de-evolution chain logic or use \`!forceevolve\` to set the pre-evolved species.`);
  },
};

const setlevel = {
  name: "setlevel", aliases: [], category: "Owner",
  description: "Set the level of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const lvl = parseInt(args[2], 10);
    if (!userId || !slot || isNaN(lvl)) return message.reply("❌ Usage: `!setlevel @user <slot> <level>`");
    if (lvl < 1 || lvl > 100) return message.reply("❌ Level must be 1–100.");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    poke.level = lvl; save();
    await message.reply(`✅ Set **${poke.species_name}**'s level to **${lvl}**.`);
  },
};

const setexp = {
  name: "setexp", aliases: [], category: "Owner",
  description: "Set the XP of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const xp = parseInt(args[2], 10);
    if (!userId || !slot || isNaN(xp)) return message.reply("❌ Usage: `!setexp @user <slot> <xp>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    poke.xp = Math.max(0, xp); save();
    await message.reply(`✅ Set **${poke.species_name}**'s XP to **${xp}**.`);
  },
};

const setnature = {
  name: "setnature", aliases: [], category: "Owner",
  description: "Set the nature of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const nature = args[2]?.toLowerCase();
    if (!userId || !slot || !nature) return message.reply("❌ Usage: `!setnature @user <slot> <nature>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    poke.nature = nature; save();
    await message.reply(`✅ Set **${poke.species_name}**'s nature to **${nature}**.`);
  },
};

const setability = {
  name: "setability", aliases: [], category: "Owner",
  description: "Set the ability of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const ability = args.slice(2).join("-").toLowerCase();
    if (!userId || !slot || !ability) return message.reply("❌ Usage: `!setability @user <slot> <ability>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    poke.ability = ability; save();
    await message.reply(`✅ Set **${poke.species_name}**'s ability to **${ability}**.`);
  },
};

const setgender = {
  name: "setgender", aliases: [], category: "Owner",
  description: "Set the gender of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const gender = args[2]?.toLowerCase();
    if (!userId || !slot || !["male","female","genderless"].includes(gender)) return message.reply("❌ Usage: `!setgender @user <slot> <male|female|genderless>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    poke.gender = gender; save();
    await message.reply(`✅ Set **${poke.species_name}**'s gender to **${gender}**.`);
  },
};

const setshiny = {
  name: "setshiny", aliases: [], category: "Owner",
  description: "Toggle shiny status of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const val = args[2]?.toLowerCase();
    if (!userId || !slot || !["true","false","on","off"].includes(val)) return message.reply("❌ Usage: `!setshiny @user <slot> <true|false>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    poke.is_shiny = val === "true" || val === "on"; save();
    await message.reply(`✅ **${poke.species_name}** is ${poke.is_shiny ? "✨ now shiny!" : "no longer shiny."}`);
  },
};

const setalpha = {
  name: "setalpha", aliases: [], category: "Owner",
  description: "Toggle alpha status of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const val = args[2]?.toLowerCase();
    if (!userId || !slot || !["true","false","on","off"].includes(val)) return message.reply("❌ Usage: `!setalpha @user <slot> <true|false>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    poke.is_alpha = val === "true" || val === "on"; save();
    await message.reply(`✅ **${poke.species_name}** is ${poke.is_alpha ? "🔴 now alpha!" : "no longer alpha."}`);
  },
};

const setiv = {
  name: "setiv", aliases: [], category: "Owner",
  description: "Set IVs of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const stat = args[2]?.toLowerCase(); const val = parseInt(args[3], 10);
    const vs = ["hp","attack","defense","spattack","spdefense","speed"];
    if (!userId || !slot || !vs.includes(stat) || isNaN(val)) return message.reply("❌ Usage: `!setiv @user <slot> <stat> <0-31>`");
    if (val < 0 || val > 31) return message.reply("❌ IV must be 0–31.");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    const key = stat === "spattack" ? "spAttack" : stat === "spdefense" ? "spDefense" : stat;
    poke.ivs[key] = val; save();
    await message.reply(`✅ Set **${poke.species_name}**'s ${stat} IV to **${val}**.`);
  },
};

const setev = {
  name: "setev", aliases: [], category: "Owner",
  description: "Set EVs of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const stat = args[2]?.toLowerCase(); const val = parseInt(args[3], 10);
    const vs = ["hp","attack","defense","spattack","spdefense","speed"];
    if (!userId || !slot || !vs.includes(stat) || isNaN(val)) return message.reply("❌ Usage: `!setev @user <slot> <stat> <0-252>`");
    if (val < 0 || val > 252) return message.reply("❌ EV must be 0–252.");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    if (!poke.evs) poke.evs = { hp:0, attack:0, defense:0, spAttack:0, spDefense:0, speed:0 };
    const key = stat === "spattack" ? "spAttack" : stat === "spdefense" ? "spDefense" : stat;
    poke.evs[key] = val; save();
    await message.reply(`✅ Set **${poke.species_name}**'s ${stat} EV to **${val}**.`);
  },
};

const setmoves = {
  name: "setmoves", aliases: [], category: "Owner",
  description: "Set all 4 moves of a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const moves = args.slice(2,6).map((m)=>m.toLowerCase().replace(/_/g,"-"));
    if (!userId || !slot || !moves.length) return message.reply("❌ Usage: `!setmoves @user <slot> <move1> [move2] [move3] [move4]`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    poke.moves = moves.slice(0,4); save();
    await message.reply(`✅ Set moves for **${poke.species_name}**: ${poke.moves.join(", ")}`);
  },
};

const learnmove = {
  name: "learnmove", aliases: [], category: "Owner",
  description: "Add a move to a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const move = args[2]?.toLowerCase().replace(/_/g,"-");
    if (!userId || !slot || !move) return message.reply("❌ Usage: `!learnmove @user <slot> <move>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    if (!poke.moves) poke.moves = [];
    if (poke.moves.length < 4) poke.moves.push(move); else poke.moves[3] = move;
    save();
    await message.reply(`✅ **${poke.species_name}** learned **${move}**!`);
  },
};

const forgetmove = {
  name: "forgetmove", aliases: [], category: "Owner",
  description: "Remove a move from a user's Pokémon (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1]; const move = args[2]?.toLowerCase().replace(/_/g,"-");
    if (!userId || !slot || !move) return message.reply("❌ Usage: `!forgetmove @user <slot> <move>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    const before = (poke.moves||[]).length;
    poke.moves = (poke.moves||[]).filter((m)=>m!==move); save();
    if (poke.moves.length < before) await message.reply(`✅ **${poke.species_name}** forgot **${move}**.`);
    else await message.reply(`⚠️ **${poke.species_name}** doesn't know **${move}**.`);
  },
};

const releaseforce = {
  name: "releaseforce", aliases: [], category: "Owner",
  description: "Force-release a Pokémon from a user (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0); const slot = args[1];
    if (!userId || !slot) return message.reply("❌ Usage: `!releaseforce @user <slot>`");
    const poke = getPokemonByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    delete state.pokemon.byId[String(poke.id)]; save();
    await message.reply(`✅ Force-released **${poke.species_name}** from <@${userId}>.`);
  },
};

module.exports = [
  givepoke, removepoke, healpoke,
  editpoke, clonepoke, devolve,
  setlevel, setexp, setnature, setability, setgender, setshiny, setalpha,
  setiv, setev, setmoves, learnmove, forgetmove, releaseforce,
];
