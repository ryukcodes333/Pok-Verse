const { requireOwner } = require("../services/guard");
const { state, save, saveSync, FILE_PATH } = require("../db/store");
const { getTrainer } = require("../db/trainers");
const fs = require("fs");
const path = require("path");

const BACKUP_DIR = path.join(path.dirname(FILE_PATH), "backups");

function resolveUser(args, idx = 0) {
  const mention = args[idx];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}

// ─── !backup ─────────────────────────────────────────────────────────────────
const backup = {
  name: "backup",
  aliases: [],
  category: "Owner",
  description: "Create a backup of the database.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dest = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    fs.copyFileSync(FILE_PATH, dest);
    await message.reply(`✅ Backup created: \`${path.basename(dest)}\``);
  },
};

// ─── !restore ─────────────────────────────────────────────────────────────────
const restore = {
  name: "restore",
  aliases: [],
  category: "Owner",
  description: "Restore the database from the latest backup.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    if (!fs.existsSync(BACKUP_DIR)) return message.reply("❌ No backups directory found.");
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json")).sort();
    if (!files.length) return message.reply("❌ No backups found.");
    const latest = args[0] || files[files.length - 1];
    const src = path.join(BACKUP_DIR, latest);
    if (!fs.existsSync(src)) return message.reply(`❌ Backup \`${latest}\` not found.`);
    fs.copyFileSync(src, FILE_PATH);
    await message.reply(`✅ Restored from backup: \`${latest}\`\n⚠️ Restart the bot to apply the restored data.`);
  },
};

// ─── !savedb ──────────────────────────────────────────────────────────────────
const savedb = {
  name: "savedb",
  aliases: [],
  category: "Owner",
  description: "Force-save the current in-memory state to disk.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    saveSync();
    await message.reply("✅ Database saved to disk.");
  },
};

// ─── !loaddb ──────────────────────────────────────────────────────────────────
const loaddb = {
  name: "loaddb",
  aliases: [],
  category: "Owner",
  description: "Reload the database from disk (restart recommended instead).",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    await message.reply("⚠️ A full in-memory reload requires a bot restart.\nUse `!restart` to apply disk state.");
  },
};

// ─── !exportuser ──────────────────────────────────────────────────────────────
const exportuser = {
  name: "exportuser",
  aliases: [],
  category: "Owner",
  description: "Export a user's data as JSON.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0);
    if (!userId) return message.reply("❌ Usage: `!exportuser @user`");
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ User not registered.");
    const pokemon = Object.values(state.pokemon.byId).filter((p) => p.owner_id === userId);
    const items = Object.values(state.inventory).filter((i) => i.user_id === userId);
    const data = JSON.stringify({ trainer, pokemon, items }, null, 2);
    await message.reply(`📦 **User data for <@${userId}>**\n\`\`\`json\n${data.slice(0, 1800)}\n\`\`\``);
  },
};

// ─── !importuser ──────────────────────────────────────────────────────────────
const importuser = {
  name: "importuser",
  aliases: [],
  category: "Owner",
  description: "Import user data from JSON (paste in next message).",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    await message.reply("⚠️ `!importuser` — send the JSON data in your next message.\n> *(Auto-import not yet implemented — use `!eval` to apply JSON manually.)*");
  },
};

// ─── !optimize ────────────────────────────────────────────────────────────────
const optimize = {
  name: "optimize",
  aliases: [],
  category: "Owner",
  description: "Clean up orphaned data from the database.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    let removed = 0;
    // Remove pokemon with no owner
    for (const [id, poke] of Object.entries(state.pokemon.byId)) {
      if (!state.trainers[poke.owner_id]) {
        delete state.pokemon.byId[id];
        removed++;
      }
    }
    // Remove inventory items with no owner
    for (const [key, item] of Object.entries(state.inventory)) {
      if (!state.trainers[item.user_id]) {
        delete state.inventory[key];
        removed++;
      }
    }
    saveSync();
    await message.reply(`✅ Optimization complete. Removed **${removed}** orphaned records.`);
  },
};

// ─── !cleancache ──────────────────────────────────────────────────────────────
const cleancache = {
  name: "cleancache",
  aliases: [],
  category: "Owner",
  description: "Clear the PokeAPI in-memory cache.",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    const pokeapi = require("../services/pokeapi");
    if (pokeapi.clearCache) {
      pokeapi.clearCache();
      await message.reply("✅ PokeAPI cache cleared.");
    } else {
      await message.reply("⚠️ Cache clear function not exposed — add `clearCache()` to `services/pokeapi.js` if needed.");
    }
  },
};

module.exports = [backup, restore, savedb, loaddb, exportuser, importuser, optimize, cleancache];
