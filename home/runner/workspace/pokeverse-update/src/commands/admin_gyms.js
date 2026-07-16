const { requireOwner, requireCoOwner } = require("../services/guard");
const { state, save } = require("../db/store");
const { getTrainer, addBadge, removeBadge } = require("../db/trainers");

function resolveUser(args, idx = 0) {
  const mention = args[idx];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}

const BADGE_NAMES = [
  "Boulder Badge", "Cascade Badge", "Thunder Badge", "Rainbow Badge",
  "Soul Badge", "Marsh Badge", "Volcano Badge", "Earth Badge",
];

// ─── !resetgym ────────────────────────────────────────────────────────────────
const resetgym = {
  name: "resetgym",
  aliases: [],
  category: "CoOwner",
  description: "Reset a user's gym progress (clear all badges).",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    if (!userId) return message.reply("❌ Usage: `!resetgym @user`");
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ User not registered.");
    trainer.badges = [];
    save();
    await message.reply(`✅ Reset all gym badges for <@${userId}>.`);
  },
};

// ─── !givebadge ───────────────────────────────────────────────────────────────
const givebadge = {
  name: "givebadge",
  aliases: [],
  category: "CoOwner",
  description: "Give a badge to a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const badgeName = args.slice(1).join(" ");
    if (!userId || !badgeName) {
      return message.reply(`❌ Usage: \`!givebadge @user <badge name>\`\nBadges: ${BADGE_NAMES.join(", ")}`);
    }
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ User not registered.");
    addBadge(userId, badgeName);
    await message.reply(`🏅 Gave **${badgeName}** to <@${userId}>.`);
  },
};

// ─── !removebadge ─────────────────────────────────────────────────────────────
const removebadge = {
  name: "removebadge",
  aliases: [],
  category: "CoOwner",
  description: "Remove a badge from a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const badgeName = args.slice(1).join(" ");
    if (!userId || !badgeName) {
      return message.reply(`❌ Usage: \`!removebadge @user <badge name>\``);
    }
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ User not registered.");
    removeBadge(userId, badgeName);
    await message.reply(`✅ Removed **${badgeName}** from <@${userId}>.`);
  },
};

// ─── !resetbattle ─────────────────────────────────────────────────────────────
const resetbattle = {
  name: "resetbattle",
  aliases: [],
  category: "CoOwner",
  description: "Reset a user's battle stats.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    if (!userId) return message.reply("❌ Usage: `!resetbattle @user`");
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ User not registered.");
    trainer.battles_won = 0;
    trainer.battles_lost = 0;
    save();
    await message.reply(`✅ Reset battle stats for <@${userId}>.`);
  },
};

// ─── !forcewin ────────────────────────────────────────────────────────────────
const forcewin = {
  name: "forcewin",
  aliases: [],
  category: "CoOwner",
  description: "Add a battle win to a user's record.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const count = parseInt(args[1], 10) || 1;
    if (!userId) return message.reply("❌ Usage: `!forcewin @user [count]`");
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ User not registered.");
    trainer.battles_won = (trainer.battles_won || 0) + count;
    save();
    await message.reply(`✅ Added **${count}** win(s) to <@${userId}>'s record.`);
  },
};

// ─── !forcelose ───────────────────────────────────────────────────────────────
const forcelose = {
  name: "forcelose",
  aliases: [],
  category: "CoOwner",
  description: "Add a battle loss to a user's record.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const count = parseInt(args[1], 10) || 1;
    if (!userId) return message.reply("❌ Usage: `!forcelose @user [count]`");
    const trainer = getTrainer(userId);
    if (!trainer) return message.reply("❌ User not registered.");
    trainer.battles_lost = (trainer.battles_lost || 0) + count;
    save();
    await message.reply(`✅ Added **${count}** loss(es) to <@${userId}>'s record.`);
  },
};

module.exports = [resetgym, givebadge, removebadge, resetbattle, forcewin, forcelose];
