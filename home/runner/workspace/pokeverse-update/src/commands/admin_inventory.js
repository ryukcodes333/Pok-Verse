const { requireOwner, requireCoOwner } = require("../services/guard");
const { state, save } = require("../db/store");
const { getTrainer, addCoins, setCoins, addTokens, setTokens, addGems, setGems } = require("../db/trainers");

function resolveUser(args, idx = 0) {
  const mention = args[idx];
  if (!mention) return null;
  return mention.replace(/[<@!>]/g, "");
}

// ─── !giveitem ────────────────────────────────────────────────────────────────
const giveitem = {
  name: "giveitem",
  aliases: [],
  category: "CoOwner",
  description: "Give an item to a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const qty = parseInt(args[args.length - 1], 10);
    const itemName = args.slice(1, isNaN(qty) ? undefined : -1).join(" ");
    if (!userId || !itemName) return message.reply("❌ Usage: `!giveitem @user <item name> [qty]`");
    const amount = isNaN(qty) ? 1 : qty;
    const key = `${userId}:${itemName}`;
    if (!state.inventory[key]) state.inventory[key] = { user_id: userId, item_name: itemName, quantity: 0 };
    state.inventory[key].quantity += amount;
    save();
    await message.reply(`✅ Gave **${amount}x ${itemName}** to <@${userId}>.`);
  },
};

// ─── !removeitem ─────────────────────────────────────────────────────────────
const removeitem = {
  name: "removeitem",
  aliases: [],
  category: "CoOwner",
  description: "Remove an item from a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const qty = parseInt(args[args.length - 1], 10);
    const itemName = args.slice(1, isNaN(qty) ? undefined : -1).join(" ");
    if (!userId || !itemName) return message.reply("❌ Usage: `!removeitem @user <item name> [qty]`");
    const amount = isNaN(qty) ? 1 : qty;
    const key = `${userId}:${itemName}`;
    if (!state.inventory[key] || state.inventory[key].quantity <= 0) {
      return message.reply(`❌ <@${userId}> doesn't have **${itemName}**.`);
    }
    state.inventory[key].quantity = Math.max(0, state.inventory[key].quantity - amount);
    save();
    await message.reply(`✅ Removed **${amount}x ${itemName}** from <@${userId}>.`);
  },
};

// ─── !clearbag ────────────────────────────────────────────────────────────────
const clearbag = {
  name: "clearbag",
  aliases: [],
  category: "CoOwner",
  description: "Clear all items from a user's bag.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    if (!userId) return message.reply("❌ Usage: `!clearbag @user`");
    for (const key of Object.keys(state.inventory)) {
      if (key.startsWith(`${userId}:`)) delete state.inventory[key];
    }
    save();
    await message.reply(`✅ Cleared <@${userId}>'s bag.`);
  },
};

// ─── !setmoney ────────────────────────────────────────────────────────────────
const setmoney = {
  name: "setmoney",
  aliases: [],
  category: "Owner",
  description: "Set a user's coin balance.",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!setmoney @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    setCoins(userId, amount);
    await message.reply(`✅ Set <@${userId}>'s coins to **${amount.toLocaleString()}**.`);
  },
};

// ─── !addmoney ────────────────────────────────────────────────────────────────
const addmoney = {
  name: "addmoney",
  aliases: [],
  category: "CoOwner",
  description: "Add coins to a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!addmoney @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    addCoins(userId, amount);
    await message.reply(`✅ Added **${amount.toLocaleString()}** coins to <@${userId}>.`);
  },
};

// ─── !takemoney ───────────────────────────────────────────────────────────────
const takemoney = {
  name: "takemoney",
  aliases: [],
  category: "CoOwner",
  description: "Take coins from a user.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!takemoney @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    addCoins(userId, -amount);
    await message.reply(`✅ Took **${amount.toLocaleString()}** coins from <@${userId}>.`);
  },
};

// ─── !settokens ───────────────────────────────────────────────────────────────
const settokens = {
  name: "settokens",
  aliases: [],
  category: "CoOwner",
  description: "Set a user's token balance.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!settokens @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    setTokens(userId, amount);
    await message.reply(`✅ Set <@${userId}>'s tokens to **${amount}**.`);
  },
};

// ─── !setgems ─────────────────────────────────────────────────────────────────
const setgems = {
  name: "setgems",
  aliases: [],
  category: "CoOwner",
  description: "Set a user's gem balance.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const userId = resolveUser(args, 0);
    const amount = parseInt(args[1], 10);
    if (!userId || isNaN(amount)) return message.reply("❌ Usage: `!setgems @user <amount>`");
    if (!getTrainer(userId)) return message.reply("❌ User not registered.");
    setGems(userId, amount);
    await message.reply(`✅ Set <@${userId}>'s gems to **${amount}**.`);
  },
};

module.exports = [giveitem, removeitem, clearbag, setmoney, addmoney, takemoney, settokens, setgems];
