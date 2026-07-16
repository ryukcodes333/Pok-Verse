const { requireOwner, requireCoOwner } = require("../services/guard");
const { state, save } = require("../db/store");
const { setEncounter } = require("../services/encounters");
const { buildWildInstance, WILD_POOL } = require("../services/spawnFactory");
const { getSpecies } = require("../services/pokeapi");
const { rollWildLevel } = require("../services/mechanics");
const { startRaid } = require("../services/raids");

// Legendary & mythical pools
const LEGENDARY_POOL = [
  "articuno","zapdos","moltres","mewtwo","raikou","entei","suicune",
  "lugia","ho-oh","regirock","regice","registeel","latias","latios",
  "kyogre","groudon","rayquaza","uxie","mesprit","azelf","dialga",
  "palkia","heatran","regigigas","giratina","cresselia","cobalion",
  "terrakion","virizion","tornadus","thundurus","reshiram","zekrom",
  "landorus","kyurem","xerneas","yveltal","zygarde","tapu-koko",
  "tapu-lele","tapu-bulu","tapu-fini","solgaleo","lunala","necrozma",
];
const MYTHICAL_POOL = [
  "mew","celebi","jirachi","deoxys","phione","manaphy","darkrai",
  "shaymin","arceus","victini","keldeo","meloetta","genesect",
  "diancie","hoopa","volcanion","magearna","marshadow","zeraora",
  "meltan","melmetal","zarude",
];

async function spawnPokemon(message, speciesName, overrides = {}) {
  let species;
  try {
    species = await getSpecies(speciesName);
  } catch {
    await message.reply(`❌ Could not fetch Pokémon \`${speciesName}\`. Check spelling.`);
    return;
  }
  const level = overrides.level || rollWildLevel(0);
  const instance = buildWildInstance(species, level);
  Object.assign(instance, overrides);
  setEncounter(message.channel.id, { ...instance, channelId: message.channel.id });
  const shinyTag = instance.isShiny ? " ✨ **SHINY**" : "";
  const alphaTag = instance.isAlpha ? " 🔴 **ALPHA**" : "";
  await message.channel.send(
    `🌿 A wild${shinyTag}${alphaTag} **${species.name.charAt(0).toUpperCase() + species.name.slice(1)}** (Lv. ${level}) appeared!\n` +
    `> Use \`!catch\` to catch it!`
  );
}

// ─── !spawn ───────────────────────────────────────────────────────────────────
const spawn = {
  name: "spawn",
  aliases: [],
  category: "CoOwner",
  description: "Force-spawn a Pokémon.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const name = args[0] || WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
    await spawnPokemon(message, name.toLowerCase());
  },
};

// ─── !spawnshiny ──────────────────────────────────────────────────────────────
const spawnshiny = {
  name: "spawnshiny",
  aliases: [],
  category: "CoOwner",
  description: "Force-spawn a shiny Pokémon.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const name = args[0] || WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
    await spawnPokemon(message, name.toLowerCase(), { isShiny: true });
  },
};

// ─── !spawnalpha ──────────────────────────────────────────────────────────────
const spawnalpha = {
  name: "spawnalpha",
  aliases: [],
  category: "CoOwner",
  description: "Force-spawn an alpha Pokémon.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const name = args[0] || WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
    await spawnPokemon(message, name.toLowerCase(), { isAlpha: true, level: 60 });
  },
};

// ─── !spawnlegendary ─────────────────────────────────────────────────────────
const spawnlegendary = {
  name: "spawnlegendary",
  aliases: [],
  category: "CoOwner",
  description: "Force-spawn a legendary Pokémon.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const name = args[0] || LEGENDARY_POOL[Math.floor(Math.random() * LEGENDARY_POOL.length)];
    await spawnPokemon(message, name.toLowerCase(), { level: 70 });
  },
};

// ─── !spawnmythical ───────────────────────────────────────────────────────────
const spawnmythical = {
  name: "spawnmythical",
  aliases: [],
  category: "CoOwner",
  description: "Force-spawn a mythical Pokémon.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const name = args[0] || MYTHICAL_POOL[Math.floor(Math.random() * MYTHICAL_POOL.length)];
    await spawnPokemon(message, name.toLowerCase(), { level: 50 });
  },
};

// ─── !forceraid ───────────────────────────────────────────────────────────────
const forceraid = {
  name: "forceraid",
  aliases: [],
  category: "CoOwner",
  description: "Force-start a raid with a specific Pokémon.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const name = args[0] || LEGENDARY_POOL[Math.floor(Math.random() * LEGENDARY_POOL.length)];
    let species;
    try { species = await getSpecies(name.toLowerCase()); }
    catch { return message.reply(`❌ Could not fetch \`${name}\`.`); }
    const level = 80;
    const instance = buildWildInstance(species, level);
    startRaid(message.channel.id, { ...instance, hp: instance.stats.hp * 5, maxHp: instance.stats.hp * 5 });
    await message.channel.send(
      `⚔️ **RAID BOSS APPEARED!**\n> 🔴 **${species.name.charAt(0).toUpperCase() + species.name.slice(1)}** (Lv. ${level}) is challenging all trainers!\n> Use \`!raid\` to join the fight!`
    );
  },
};

// ─── !forceevent ─────────────────────────────────────────────────────────────
const forceevent = {
  name: "forceevent",
  aliases: [],
  category: "Owner",
  description: "Force-trigger a named event.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const name = args.join(" ") || "Special Event";
    state.activeEvent = name;
    save();
    await message.reply(`🎉 Force-started event: **${name}**`);
  },
};

// ─── !stopevent ───────────────────────────────────────────────────────────────
const stopevent = {
  name: "stopevent",
  aliases: [],
  category: "Owner",
  description: "Stop the currently running event.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    if (!state.activeEvent) return message.reply("⚠️ No event is currently active.");
    const name = state.activeEvent;
    state.activeEvent = null;
    save();
    await message.reply(`✅ Stopped event: **${name}**`);
  },
};

// ─── !setspawnrate ────────────────────────────────────────────────────────────
const setspawnrate = {
  name: "setspawnrate",
  aliases: [],
  category: "Owner",
  description: "Set the global spawn rate multiplier.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const rate = parseFloat(args[0]);
    if (isNaN(rate) || rate <= 0) return message.reply("❌ Usage: `!setspawnrate <multiplier>` (e.g. `2` = double rate)");
    state.spawnRate = rate;
    save();
    await message.reply(`✅ Spawn rate set to **${rate}x**.`);
  },
};

// ─── !reloadspawns ────────────────────────────────────────────────────────────
const reloadspawns = {
  name: "reloadspawns",
  aliases: [],
  category: "Owner",
  description: "Reload spawn configuration from disk.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    // Purge cached pokeapi data to force fresh fetches.
    const pokeapi = require("../services/pokeapi");
    if (pokeapi.clearCache) pokeapi.clearCache();
    await message.reply("✅ Spawn data cache cleared — next spawns will fetch fresh data.");
  },
};

module.exports = [
  spawn, spawnshiny, spawnalpha, spawnlegendary, spawnmythical,
  forceraid, forceevent, stopevent, setspawnrate, reloadspawns,
];
