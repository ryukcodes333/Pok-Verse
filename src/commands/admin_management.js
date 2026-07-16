const { requireOwner, requireCoOwner } = require("../services/guard");
const { state, save } = require("../db/store");
const { ActivityType } = require("discord.js");

// ─── !setstatus ───────────────────────────────────────────────────────────────
const setstatus = {
  name: "setstatus",
  aliases: [],
  category: "CoOwner",
  description: "Set the bot's online status.",
  async execute(message, args, client) {
    if (!(await requireCoOwner(message))) return;
    const status = args[0]?.toLowerCase();
    const valid = ["online", "idle", "dnd", "invisible"];
    if (!valid.includes(status)) {
      return message.reply(`❌ Usage: \`!setstatus <${valid.join("|")}>\``);
    }
    client.user.setStatus(status);
    await message.reply(`✅ Bot status set to **${status}**.`);
  },
};

// ─── !setactivity ─────────────────────────────────────────────────────────────
const setactivity = {
  name: "setactivity",
  aliases: [],
  category: "CoOwner",
  description: "Set the bot's activity/presence.",
  async execute(message, args, client) {
    if (!(await requireCoOwner(message))) return;
    const typeStr = args[0]?.toUpperCase();
    const text = args.slice(1).join(" ");
    const typeMap = {
      PLAYING: ActivityType.Playing,
      WATCHING: ActivityType.Watching,
      LISTENING: ActivityType.Listening,
      COMPETING: ActivityType.Competing,
    };
    if (!typeStr || !typeMap[typeStr] || !text) {
      return message.reply("❌ Usage: `!setactivity <PLAYING|WATCHING|LISTENING|COMPETING> <text>`");
    }
    client.user.setPresence({ activities: [{ name: text, type: typeMap[typeStr] }] });
    await message.reply(`✅ Activity set: **${typeStr} ${text}**`);
  },
};

// ─── !setavatar ───────────────────────────────────────────────────────────────
const setavatar = {
  name: "setavatar",
  aliases: [],
  category: "Owner",
  description: "Set the bot's avatar via image URL.",
  async execute(message, args, client) {
    if (!(await requireOwner(message))) return;
    const url = args[0] || (message.attachments.first()?.url);
    if (!url) return message.reply("❌ Usage: `!setavatar <image url>` or attach an image.");
    try {
      await client.user.setAvatar(url);
      await message.reply("✅ Avatar updated!");
    } catch (err) {
      await message.reply(`❌ Failed to update avatar: ${err.message}`);
    }
  },
};

// ─── !setusername ─────────────────────────────────────────────────────────────
const setusername = {
  name: "setusername",
  aliases: [],
  category: "Owner",
  description: "Change the bot's username.",
  async execute(message, args, client) {
    if (!(await requireOwner(message))) return;
    const name = args.join(" ");
    if (!name) return message.reply("❌ Usage: `!setusername <new name>`");
    try {
      await client.user.setUsername(name);
      await message.reply(`✅ Username changed to **${name}**.`);
    } catch (err) {
      await message.reply(`❌ Failed: ${err.message}`);
    }
  },
};

// ─── !broadcast ───────────────────────────────────────────────────────────────
const broadcast = {
  name: "broadcast",
  aliases: [],
  category: "CoOwner",
  description: "Send a message to all guilds' system/first text channel.",
  async execute(message, args, client) {
    if (!(await requireCoOwner(message))) return;
    const text = args.join(" ");
    if (!text) return message.reply("❌ Usage: `!broadcast <message>`");
    let sent = 0;
    for (const guild of client.guilds.cache.values()) {
      try {
        const channel =
          guild.systemChannel ||
          guild.channels.cache.find((c) => c.isTextBased && c.isTextBased() && c.permissionsFor(guild.members.me)?.has("SendMessages"));
        if (channel) {
          await channel.send(`📢 **Broadcast**\n\n${text}`);
          sent++;
        }
      } catch { /* skip */ }
    }
    await message.reply(`✅ Broadcast sent to **${sent}** server(s).`);
  },
};

// ─── !maintenance ─────────────────────────────────────────────────────────────
const maintenance = {
  name: "maintenance",
  aliases: [],
  category: "CoOwner",
  description: "Toggle maintenance mode (on/off).",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const sub = args[0]?.toLowerCase();
    if (!["on", "off"].includes(sub)) {
      return message.reply("❌ Usage: `!maintenance on` or `!maintenance off`");
    }
    state.maintenance = sub === "on";
    save();
    if (state.maintenance) {
      await message.channel.send("🔧 **Maintenance Mode ON** — Only staff can use the bot right now.");
    } else {
      await message.channel.send("✅ **Maintenance Mode OFF** — The bot is back online for everyone!");
    }
  },
};

module.exports = [setstatus, setactivity, setavatar, setusername, broadcast, maintenance];
