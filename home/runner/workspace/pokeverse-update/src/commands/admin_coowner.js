const { requireOwner, isCoOwner } = require("../services/guard");
const { state, save } = require("../db/store");
const config = require("../config");

function resolveUser(args) {
  const mention = args[0];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}

// ─── !setcoowner ─────────────────────────────────────────────────────────────
const setcoowner = {
  name: "setcoowner",
  aliases: [],
  category: "Owner",
  description: "Add a co-owner (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!setcoowner @user`");
    if (state.coOwners.includes(userId)) return message.reply("⚠️ That user is already a co-owner.");
    state.coOwners.push(userId);
    save();
    await message.reply(`✅ <@${userId}> has been added as a **Co-Owner**.`);
  },
};

// ─── !removecoowner ──────────────────────────────────────────────────────────
const removecoowner = {
  name: "removecoowner",
  aliases: [],
  category: "Owner",
  description: "Remove a co-owner (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!removecoowner @user`");
    const idx = state.coOwners.indexOf(userId);
    if (idx === -1) return message.reply("⚠️ That user is not a co-owner.");
    state.coOwners.splice(idx, 1);
    save();
    await message.reply(`✅ <@${userId}> has been removed as a **Co-Owner**.`);
  },
};

// ─── !coowners ───────────────────────────────────────────────────────────────
const coowners = {
  name: "coowners",
  aliases: [],
  category: "Owner",
  description: "List all co-owners (owner only).",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    if (!state.coOwners.length) return message.reply("📋 No co-owners set.");
    const list = state.coOwners.map((id) => `• <@${id}> (\`${id}\`)`).join("\n");
    await message.reply(`🛡️ **Co-Owners**\n${list}`);
  },
};

// ─── !iscoowner ──────────────────────────────────────────────────────────────
const iscoowner = {
  name: "iscoowner",
  aliases: [],
  category: "Owner",
  description: "Check if a user is a co-owner (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!iscoowner @user`");
    const result = isCoOwner(userId);
    await message.reply(result
      ? `✅ <@${userId}> **is** a Co-Owner.`
      : `❌ <@${userId}> is **not** a Co-Owner.`
    );
  },
};

// ─── !transferownership ──────────────────────────────────────────────────────
const transferownership = {
  name: "transferownership",
  aliases: [],
  category: "Owner",
  description: "Transfer bot ownership to another user (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!transferownership @user`");
    // Update OWNER_ID in process env (runtime only — update .env manually to persist).
    process.env.OWNER_ID = userId;
    config.ownerId = userId;
    await message.reply(
      `👑 Ownership transferred to <@${userId}>.\n⚠️ Update \`OWNER_ID\` in your \`.env\` / environment to make this permanent.`
    );
  },
};

module.exports = [setcoowner, removecoowner, coowners, iscoowner, transferownership];
