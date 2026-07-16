const { requireOwner } = require("../services/guard");
const { state, save, saveSync } = require("../db/store");
const { getTrainer, addCoins } = require("../db/trainers");
const { getSpecies } = require("../services/pokeapi");
const { buildWildInstance } = require("../services/spawnFactory");
const { setEncounter } = require("../services/encounters");

function resolveUser(args, idx = 0) {
  const mention = args[idx];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}
function getUserPokemon(userId) {
  return Object.values(state.pokemon.byId).filter((p) => p.owner_id === userId);
}
function getByOwnerSlot(userId, slot) {
  const list = getUserPokemon(userId).sort((a, b) => a.id - b.id);
  const idx = parseInt(slot, 10);
  return isNaN(idx) || idx < 1 ? null : list[idx - 1] || null;
}

// ─── !forcecatch ──────────────────────────────────────────────────────────────
const forcecatch = {
  name: "forcecatch",
  aliases: [],
  category: "Owner",
  description: "Force-add the active wild Pokémon to a user's collection.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const { getEncounter, clearEncounter } = require("../services/encounters");
    const encounter = getEncounter(message.channel.id);
    if (!encounter) return message.reply("⚠️ No active wild encounter in this channel.");
    const targetId = resolveUser(args, 0) || message.author.id;
    const id = state.pokemon.nextId++;
    state.pokemon.byId[String(id)] = {
      id, owner_id: targetId,
      species_id: encounter.species.id, species_name: encounter.species.name,
      nickname: null, level: encounter.level, xp: 0,
      nature: encounter.nature, gender: encounter.gender, ability: encounter.ability,
      is_shiny: encounter.isShiny || false, is_alpha: encounter.isAlpha || false,
      ivs: encounter.ivs, evs: { hp:0, attack:0, defense:0, spAttack:0, spDefense:0, speed:0 },
      moves: encounter.moves, current_hp: encounter.maxHp, max_hp: encounter.maxHp,
      held_item: null, friendship: 70, party_index: null,
    };
    clearEncounter(message.channel.id);
    save();
    await message.reply(`✅ Force-caught **${encounter.species.name}** for <@${targetId}>.`);
  },
};

// ─── !forceshiny ──────────────────────────────────────────────────────────────
const forceshiny = {
  name: "forceshiny",
  aliases: [],
  category: "Owner",
  description: "Make a user's next catch shiny (or toggle all to shiny).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0);
    const slot = args[1];
    if (!userId || !slot) return message.reply("❌ Usage: `!forceshiny @user <slot>`");
    const poke = getByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    poke.is_shiny = true;
    save();
    await message.reply(`✨ Force-made **${poke.species_name}** (slot ${slot}) shiny for <@${userId}>.`);
  },
};

// ─── !forcecritical ───────────────────────────────────────────────────────────
const forcecritical = {
  name: "forcecritical",
  aliases: [],
  category: "Owner",
  description: "Toggle guaranteed critical hits in battles (global flag).",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    state.godMode.forceCrit = !state.godMode.forceCrit;
    save();
    await message.reply(
      state.godMode.forceCrit
        ? "⚡ **Force Critical Mode ON** — All battle hits are now critical!"
        : "✅ Force Critical Mode OFF."
    );
  },
};

// ─── !forceevolve ─────────────────────────────────────────────────────────────
const forceevolve = {
  name: "forceevolve",
  aliases: [],
  category: "Owner",
  description: "Force-evolve a user's Pokémon to a target species.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0);
    const slot = args[1];
    const targetSpecies = args[2]?.toLowerCase();
    if (!userId || !slot || !targetSpecies) {
      return message.reply("❌ Usage: `!forceevolve @user <slot> <target species>`");
    }
    const poke = getByOwnerSlot(userId, slot);
    if (!poke) return message.reply("❌ Pokémon not found.");
    let species;
    try { species = await getSpecies(targetSpecies); }
    catch { return message.reply(`❌ Unknown species \`${targetSpecies}\`.`); }
    const old = poke.species_name;
    poke.species_id = species.id;
    poke.species_name = species.name;
    save();
    await message.reply(`✅ Force-evolved <@${userId}>'s **${old}** → **${species.name}**!`);
  },
};

// ─── !resetcooldowns ──────────────────────────────────────────────────────────
const resetcooldowns = {
  name: "resetcooldowns",
  aliases: [],
  category: "Owner",
  description: "Reset all cooldowns for a user (daily, work, hunt, fish).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0);
    if (!userId) return message.reply("❌ Usage: `!resetcooldowns @user`");
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ User not registered.");
    trainer.last_daily = 0;
    trainer.last_work = 0;
    trainer.last_hunt = 0;
    trainer.last_fish = 0;
    save();
    await message.reply(`✅ All cooldowns reset for <@${userId}>.`);
  },
};

// ─── !wipeuser ────────────────────────────────────────────────────────────────
const wipeuser = {
  name: "wipeuser",
  aliases: [],
  category: "Owner",
  description: "Completely wipe a user from the database (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0);
    if (!userId) return message.reply("❌ Usage: `!wipeuser @user`");
    // Wipe all data
    delete state.trainers[userId];
    delete state.pokedex[userId];
    delete state.quests[userId];
    for (const [id, poke] of Object.entries(state.pokemon.byId)) {
      if (poke.owner_id === userId) delete state.pokemon.byId[id];
    }
    for (const key of Object.keys(state.inventory)) {
      if (key.startsWith(`${userId}:`)) delete state.inventory[key];
    }
    for (const [id, listing] of Object.entries(state.market?.byId || {})) {
      if (listing.seller_id === userId) delete state.market.byId[id];
    }
    // Remove from co-owners / blacklist / ban
    state.coOwners = state.coOwners.filter((id) => id !== userId);
    delete state.blacklisted[userId];
    delete state.banned[userId];
    saveSync();
    await message.reply(`🗑️ <@${userId}> has been **completely wiped** from the database.`);
  },
};

// ─── !wipedb ──────────────────────────────────────────────────────────────────
const wipedb = {
  name: "wipedb",
  aliases: [],
  category: "Owner",
  description: "⚠️ WIPE THE ENTIRE DATABASE. Requires confirmation.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    if (args[0] !== "CONFIRM") {
      return message.reply(
        `⚠️ **DANGER ZONE** — This will delete ALL trainer, Pokémon, and economy data.\n` +
        `> Type \`!wipedb CONFIRM\` to proceed. **This cannot be undone.**`
      );
    }
    const { defaultState } = require("../db/store");
    // Reset state in-place
    const fresh = {
      trainers: {}, pokemon: { nextId: 1, byId: {} },
      pokedex: {}, inventory: {}, quests: {}, market: { nextId: 1, byId: {} },
      coOwners: state.coOwners, // preserve staff list
      blacklisted: {}, banned: {}, maintenance: false,
      activeEvent: null, eventBoosts: { xp:1, catch:1, shiny:1, legendary:1 },
      spawnRate: 1, godMode: {}, logs: [],
    };
    Object.assign(state, fresh);
    saveSync();
    await message.reply("💥 **Database wiped.** All trainer data has been deleted. Staff list preserved.");
  },
};

// ─── !godmode ─────────────────────────────────────────────────────────────────
const godmode = {
  name: "godmode",
  aliases: [],
  category: "Owner",
  description: "Toggle god mode for a user (instant catch, no faint).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0) || message.author.id;
    if (!state.godMode) state.godMode = {};
    state.godMode[userId] = !state.godMode[userId];
    save();
    await message.reply(
      state.godMode[userId]
        ? `👑 **God Mode ON** for <@${userId}> — instant catch, no faint.`
        : `✅ God Mode OFF for <@${userId}>.`
    );
  },
};

module.exports = [forcecatch, forceshiny, forcecritical, forceevolve, resetcooldowns, wipeuser, wipedb, godmode];
