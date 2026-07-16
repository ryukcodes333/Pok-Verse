const { requireOwner, requireCoOwner } = require("../services/guard");
const { state, save } = require("../db/store");
const { getTrainer, resetTrainer } = require("../db/trainers");
const { getOwnedPokemon } = require("../db/pokemon");
const config = require("../config");

function resolveUser(args) {
  const mention = args[0];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}

// ─── !userinfo ────────────────────────────────────────────────────────────────
const userinfo = {
  name: "userinfo",
  aliases: [],
  category: "CoOwner",
  description: "View detailed info about a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!userinfo @user`");
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ That user hasn't registered yet.");
    const owned = getOwnedPokemon(userId);
    const isBlacklisted = !!state.blacklisted[userId];
    const isBanned = !!state.banned[userId];
    const isCoOwner = Array.isArray(state.coOwners) && state.coOwners.includes(userId);
    await message.reply(
      `👤 **User Info — <@${userId}>**\n` +
      `> 🆔 Trainer ID: \`${trainer.trainer_id}\`\n` +
      `> 🌍 Region: ${trainer.region}\n` +
      `> 💰 Coins: **${(trainer.coins || 0).toLocaleString()}**\n` +
      `> 🔮 Redeems: **${trainer.redeems || 0}**\n` +
      `> 💎 Gems: **${trainer.gems || 0}**\n` +
      `> 🪙 Tokens: **${trainer.tokens || 0}**\n` +
      `> 🐾 Pokémon: **${owned.length}**\n` +
      `> 🏆 Badges: **${(trainer.badges || []).length}/8**\n` +
      `> ⚔️ Battles: **${trainer.battles_won}W / ${trainer.battles_lost}L**\n` +
      `> 📅 Registered: <t:${Math.floor(trainer.created_at / 1000)}:R>\n` +
      `> 🛡️ Co-Owner: ${isCoOwner ? "✅" : "❌"} | 🚫 Blacklisted: ${isBlacklisted ? "✅" : "❌"} | ⛔ Banned: ${isBanned ? "✅" : "❌"}`
    );
  },
};

// ─── !inventory (admin) ──────────────────────────────────────────────────────
const inventory = {
  name: "inventory",
  aliases: [],
  category: "CoOwner",
  description: "View another user's inventory.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!inventory @user`");
    const items = Object.values(state.inventory)
      .filter((i) => i.user_id === userId && i.quantity > 0);
    if (!items.length) return message.reply(`📦 <@${userId}> has no items.`);
    const list = items.map((i) => `• **${i.item_name}** × ${i.quantity}`).join("\n");
    await message.reply(`🎒 **Inventory of <@${userId}>**\n${list.slice(0, 1900)}`);
  },
};

// ─── !blacklist ───────────────────────────────────────────────────────────────
const blacklist = {
  name: "blacklist",
  aliases: [],
  category: "CoOwner",
  description: "Blacklist a user from using the bot.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!blacklist @user [reason]`");
    const reason = args.slice(1).join(" ") || "No reason provided.";
    state.blacklisted[userId] = { reason, by: message.author.id, at: Date.now() };
    save();
    await message.reply(`🚫 <@${userId}> has been **blacklisted**.\n> Reason: ${reason}`);
  },
};

// ─── !unblacklist ─────────────────────────────────────────────────────────────
const unblacklist = {
  name: "unblacklist",
  aliases: [],
  category: "CoOwner",
  description: "Remove a user from the blacklist.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!unblacklist @user`");
    if (!state.blacklisted[userId]) return message.reply("⚠️ That user is not blacklisted.");
    delete state.blacklisted[userId];
    save();
    await message.reply(`✅ <@${userId}> has been **removed from the blacklist**.`);
  },
};

// ─── !banuser ─────────────────────────────────────────────────────────────────
const banuser = {
  name: "banuser",
  aliases: [],
  category: "Owner",
  description: "Ban a user from the bot (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!banuser @user [reason]`");
    const reason = args.slice(1).join(" ") || "No reason provided.";
    state.banned[userId] = { reason, by: message.author.id, at: Date.now() };
    save();
    await message.reply(`⛔ <@${userId}> has been **banned** from the bot.\n> Reason: ${reason}`);
  },
};

// ─── !unbanuser ───────────────────────────────────────────────────────────────
const unbanuser = {
  name: "unbanuser",
  aliases: [],
  category: "Owner",
  description: "Unban a user (owner only).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!unbanuser @user`");
    if (!state.banned[userId]) return message.reply("⚠️ That user is not banned.");
    delete state.banned[userId];
    save();
    await message.reply(`✅ <@${userId}> has been **unbanned**.`);
  },
};

// ─── !resetuser ───────────────────────────────────────────────────────────────
const resetuser = {
  name: "resetuser",
  aliases: [],
  category: "CoOwner",
  description: "Reset a user's data completely.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args);
    if (!userId) return message.reply("❌ Usage: `!resetuser @user`");
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ That user hasn't registered.");
    // Remove their pokemon
    for (const [id, poke] of Object.entries(state.pokemon.byId)) {
      if (poke.owner_id === userId) delete state.pokemon.byId[id];
    }
    // Remove pokedex entries
    delete state.pokedex[userId];
    resetTrainer(userId);
    save();
    await message.reply(`✅ <@${userId}>'s data has been **fully reset**.`);
  },
};

module.exports = [userinfo, inventory, blacklist, unblacklist, banuser, unbanuser, resetuser];
