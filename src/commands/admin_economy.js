const { requireOwner, requireCoOwner } = require("../services/guard");
const { getTrainer, addCoins, setCoins, addRedeems, setRedeems } = require("../db/trainers");

function resolveUser(args, idx = 0) {
  const mention = args[idx];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}

// ─── !setcoins ────────────────────────────────────────────────────────────────
const setcoins = {
  name: "setcoins",
  aliases: [],
  category: "CoOwner",
  description: "Set a user's coin balance.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!setcoins @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    setCoins(userId, amount);
    await message.reply(`✅ Set <@${userId}>'s coins to **${amount.toLocaleString()}** 💰`);
  },
};

// ─── !addcoins ────────────────────────────────────────────────────────────────
const addcoins = {
  name: "addcoins",
  aliases: [],
  category: "CoOwner",
  description: "Add coins to a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!addcoins @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    addCoins(userId, amount);
    await message.reply(`✅ Added **${amount.toLocaleString()}** coins to <@${userId}>.`);
  },
};

// ─── !removecoins ─────────────────────────────────────────────────────────────
const removecoins = {
  name: "removecoins",
  aliases: [],
  category: "CoOwner",
  description: "Remove coins from a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!removecoins @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    addCoins(userId, -amount);
    await message.reply(`✅ Removed **${amount.toLocaleString()}** coins from <@${userId}>.`);
  },
};

// ─── !setredeems ──────────────────────────────────────────────────────────────
const setredeems = {
  name: "setredeems",
  aliases: [],
  category: "CoOwner",
  description: "Set a user's redeem count.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!setredeems @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    setRedeems(userId, amount);
    await message.reply(`✅ Set <@${userId}>'s redeems to **${amount}** 🔮`);
  },
};

// ─── !addredeems ──────────────────────────────────────────────────────────────
const addredeems = {
  name: "addredeems",
  aliases: [],
  category: "CoOwner",
  description: "Add redeems to a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!addredeems @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    addRedeems(userId, amount);
    await message.reply(`✅ Added **${amount}** redeem(s) to <@${userId}>.`);
  },
};

// ─── !removeredeems ───────────────────────────────────────────────────────────
const removeredeems = {
  name: "removeredeems",
  aliases: [],
  category: "CoOwner",
  description: "Remove redeems from a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!removeredeems @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    addRedeems(userId, -amount);
    await message.reply(`✅ Removed **${amount}** redeem(s) from <@${userId}>.`);
  },
};

module.exports = [setcoins, addcoins, removecoins, setredeems, addredeems, removeredeems];
