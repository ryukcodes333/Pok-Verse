const { requireOwner } = require("../services/guard");
const { state } = require("../db/store");
const { buildWildInstance, WILD_POOL } = require("../services/spawnFactory");
const { getSpecies } = require("../services/pokeapi");
const { rollWildLevel } = require("../services/mechanics");
const os = require("os");

function resolveUser(args, idx = 0) {
  const mention = args[idx];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}

// ─── !sql ─────────────────────────────────────────────────────────────────────
const sql = {
  name: "sql",
  aliases: [],
  category: "Owner",
  description: "Query the JSON store with a JS expression (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const expr = args.join(" ");
    if (!expr) return message.reply("❌ Usage: `!sql <js expression>` (e.g. `Object.keys(state.trainers).length`)");
    try {
      // eslint-disable-next-line no-eval
      const result = eval(`(function(state){return ${expr}})(state)`);
      const out = JSON.stringify(result, null, 2).slice(0, 1800);
      await message.reply(`\`\`\`json\n${out}\n\`\`\``);
    } catch (err) {
      await message.reply(`❌ Error: ${err.message}`);
    }
  },
};

// ─── !debug ───────────────────────────────────────────────────────────────────
const debug = {
  name: "debug",
  aliases: [],
  category: "Owner",
  description: "Show bot debug info (memory, state counts).",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    const mem = process.memoryUsage();
    const toMB = (b) => (b / 1024 / 1024).toFixed(1);
    const trainerCount = Object.keys(state.trainers).length;
    const pokeCount = Object.keys(state.pokemon.byId).length;
    const marketCount = Object.keys(state.market?.byId || {}).length;
    await message.reply(
      `🧪 **Debug Info**\n` +
      `> 💾 RSS: **${toMB(mem.rss)} MB** | Heap: **${toMB(mem.heapUsed)}/${toMB(mem.heapTotal)} MB**\n` +
      `> 🌍 Platform: \`${os.platform()}\` | Node: \`${process.version}\`\n` +
      `> 👥 Trainers: **${trainerCount}** | 🐾 Pokémon: **${pokeCount}** | 📦 Market: **${marketCount}**\n` +
      `> 🛡️ Co-Owners: **${state.coOwners.length}** | 🚫 Blacklisted: **${Object.keys(state.blacklisted).length}**\n` +
      `> 🔧 Maintenance: **${state.maintenance ? "ON" : "OFF"}** | 🎉 Event: **${state.activeEvent || "None"}**`
    );
  },
};

// ─── !trace ───────────────────────────────────────────────────────────────────
const trace = {
  name: "trace",
  aliases: [],
  category: "Owner",
  description: "Show process and event loop trace info.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    await message.reply(
      `🔍 **Trace**\n` +
      `> PID: \`${process.pid}\`\n` +
      `> Uptime: **${d}d ${h}h ${m}m ${s}s**\n` +
      `> Node: \`${process.version}\`\n` +
      `> CPU: \`${os.cpus()[0]?.model || "Unknown"}\`\n` +
      `> Load: \`${os.loadavg().map((l) => l.toFixed(2)).join(", ")}\``
    );
  },
};

// ─── !errorlog ────────────────────────────────────────────────────────────────
const errorlog = {
  name: "errorlog",
  aliases: [],
  category: "Owner",
  description: "Show recent error-level log entries.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    const errors = (state.logs || []).filter((l) => l.level === "ERROR").slice(-15);
    if (!errors.length) return message.reply("✅ No recent errors in the log.");
    const text = errors.map((l) => `[${l.at}] ${l.msg}`).join("\n");
    await message.reply(`❌ **Error Log**\n\`\`\`\n${text.slice(0, 1800)}\n\`\`\``);
  },
};

// ─── !testspawn ───────────────────────────────────────────────────────────────
const testspawn = {
  name: "testspawn",
  aliases: [],
  category: "Owner",
  description: "Test the spawn system without an actual encounter.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const name = args[0] || WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
    try {
      const species = await getSpecies(name.toLowerCase());
      const instance = buildWildInstance(species, rollWildLevel(0));
      await message.reply(
        `🧪 **Spawn Test** *(not a real encounter)*\n` +
        `> Species: **${species.name}**\n> Level: **${instance.level}**\n> Shiny: **${instance.isShiny}**\n` +
        `> Nature: **${instance.nature}**\n> Ability: **${instance.ability}**\n> Moves: ${instance.moves.join(", ")}`
      );
    } catch {
      await message.reply(`❌ Could not fetch \`${name}\`.`);
    }
  },
};

// ─── !testbattle ──────────────────────────────────────────────────────────────
const testbattle = {
  name: "testbattle",
  aliases: [],
  category: "Owner",
  description: "Simulate a battle damage calc.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    await message.reply(
      `🧪 **Battle Test**\n` +
      `> Damage formula: \`((2×Level/5+2)×Power×Atk/Def)/50+2\`\n` +
      `> Use \`!eval\` to run specific damage calcs against live data.`
    );
  },
};

// ─── !testcatch ───────────────────────────────────────────────────────────────
const testcatch = {
  name: "testcatch",
  aliases: [],
  category: "Owner",
  description: "Simulate catch rate calculation.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const name = args[0] || "pidgey";
    try {
      const species = await getSpecies(name.toLowerCase());
      const rate = species.captureRate || 45;
      const chance = Math.min(100, ((rate / 255) * 100)).toFixed(1);
      await message.reply(
        `🧪 **Catch Rate Test: ${species.name}**\n` +
        `> Capture Rate: **${rate}/255**\n> Pokéball chance: **~${chance}%**`
      );
    } catch {
      await message.reply(`❌ Could not fetch \`${name}\`.`);
    }
  },
};

// ─── !fakevote ────────────────────────────────────────────────────────────────
const fakevote = {
  name: "fakevote",
  aliases: [],
  category: "Owner",
  description: "Simulate a vote webhook trigger for testing.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    await message.reply(
      `🧪 **Fake Vote Triggered** *(test mode)*\n` +
      `> Simulated vote from \`${message.author.tag}\`.\n` +
      `> Wire up your vote webhook handler to consume this event.`
    );
  },
};

module.exports = [sql, debug, trace, errorlog, testspawn, testbattle, testcatch, fakevote];
