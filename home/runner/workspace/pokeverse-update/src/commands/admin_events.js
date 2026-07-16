const { requireOwner, requireCoOwner } = require("../services/guard");
const { state, save } = require("../db/store");
const { getAllTrainers } = require("../db/trainers");
const { getSpecies } = require("../services/pokeapi");

function resolveUser(args, idx = 0) {
  const mention = args[idx];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}

// ─── !startevent ─────────────────────────────────────────────────────────────
const startevent = {
  name: "startevent",
  aliases: [],
  category: "CoOwner",
  description: "Start a named event.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const name = args.join(" ");
    if (!name) return message.reply("❌ Usage: `!startevent <event name>`");
    state.activeEvent = name;
    save();
    await message.channel.send(`🎉 **EVENT STARTED: ${name}**\nGet ready, Trainers!`);
  },
};

// ─── !endevent ────────────────────────────────────────────────────────────────
const endevent = {
  name: "endevent",
  aliases: [],
  category: "CoOwner",
  description: "End the current event.",
  async execute(message) {
    if (!(await requireCoOwner(message))) return;
    if (!state.activeEvent) return message.reply("⚠️ No event is currently active.");
    const name = state.activeEvent;
    state.activeEvent = null;
    state.eventBoosts = { xp: 1, catch: 1, shiny: 1, legendary: 1 };
    save();
    await message.channel.send(`🏁 **Event Ended: ${name}**\nThanks for participating!`);
  },
};

// ─── !doublexp ────────────────────────────────────────────────────────────────
const doublexp = {
  name: "doublexp",
  aliases: [],
  category: "CoOwner",
  description: "Toggle double XP event.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const current = state.eventBoosts.xp || 1;
    state.eventBoosts.xp = current >= 2 ? 1 : 2;
    save();
    await message.channel.send(
      state.eventBoosts.xp >= 2
        ? `⭐ **Double XP Event is now ACTIVE!** All Pokémon gain 2× XP!`
        : `✅ Double XP event ended. XP back to normal.`
    );
  },
};

// ─── !doublecatch ────────────────────────────────────────────────────────────
const doublecatch = {
  name: "doublecatch",
  aliases: [],
  category: "CoOwner",
  description: "Toggle double catch rate event.",
  async execute(message) {
    if (!(await requireCoOwner(message))) return;
    const current = state.eventBoosts.catch || 1;
    state.eventBoosts.catch = current >= 2 ? 1 : 2;
    save();
    await message.channel.send(
      state.eventBoosts.catch >= 2
        ? `🎣 **Double Catch Rate Event is now ACTIVE!** Catch rates doubled!`
        : `✅ Double catch rate event ended.`
    );
  },
};

// ─── !boostshiny ─────────────────────────────────────────────────────────────
const boostshiny = {
  name: "boostshiny",
  aliases: [],
  category: "CoOwner",
  description: "Set shiny rate boost multiplier.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const mult = parseFloat(args[0]) || 2;
    state.eventBoosts.shiny = mult;
    save();
    await message.channel.send(`✨ **Shiny Boost Active!** Shiny rate is now **${mult}×**!`);
  },
};

// ─── !boostlegendary ─────────────────────────────────────────────────────────
const boostlegendary = {
  name: "boostlegendary",
  aliases: [],
  category: "CoOwner",
  description: "Set legendary encounter boost multiplier.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const mult = parseFloat(args[0]) || 2;
    state.eventBoosts.legendary = mult;
    save();
    await message.channel.send(`🌟 **Legendary Boost Active!** Legendary encounter rate is now **${mult}×**!`);
  },
};

// ─── !giveall ─────────────────────────────────────────────────────────────────
const giveall = {
  name: "giveall",
  aliases: [],
  category: "CoOwner",
  description: "Give an item to all registered users.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const qty = parseInt(args[args.length - 1], 10);
    const itemName = args.slice(0, isNaN(qty) ? undefined : -1).join(" ");
    if (!itemName) return message.reply("❌ Usage: `!giveall <item name> [qty]`");
    const amount = isNaN(qty) ? 1 : qty;
    const trainers = getAllTrainers();
    for (const t of trainers) {
      const key = `${t.user_id}:${itemName}`;
      if (!state.inventory[key]) state.inventory[key] = { user_id: t.user_id, item_name: itemName, quantity: 0 };
      state.inventory[key].quantity += amount;
    }
    save();
    await message.channel.send(`🎁 Gave **${amount}x ${itemName}** to all **${trainers.length}** registered trainers!`);
  },
};

// ─── !announcement ────────────────────────────────────────────────────────────
const announcement = {
  name: "announcement",
  aliases: [],
  category: "CoOwner",
  description: "Send an announcement in the current channel.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const text = args.join(" ");
    if (!text) return message.reply("❌ Usage: `!announcement <message>`");
    await message.channel.send(`📢 **ANNOUNCEMENT**\n\n${text}`);
    await message.delete().catch(() => {});
  },
};

module.exports = [startevent, endevent, doublexp, doublecatch, boostshiny, boostlegendary, giveall, announcement];
