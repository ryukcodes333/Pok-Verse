const { requireOwner, requireCoOwner } = require("../services/guard");
const { state } = require("../db/store");
const { logger } = require("../lib/logger");
const os = require("os");

const BOT_START = Date.now();

// ─── !ping ───────────────────────────────────────────────────────────────────
const ping = {
  name: "ping",
  aliases: [],
  category: "Owner",
  description: "Check bot latency.",
  async execute(message, _args, client) {
    if (!(await requireCoOwner(message))) return;
    const sent = await message.reply("🏓 Pinging...");
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const wsLatency = Math.round(client.ws.ping);
    await sent.edit(
      `🏓 **Pong!**\n> 📡 Message Latency: **${latency}ms**\n> 💓 WebSocket Latency: **${wsLatency}ms**`
    );
  },
};

// ─── !uptime ─────────────────────────────────────────────────────────────────
const uptime = {
  name: "uptime",
  aliases: [],
  category: "Owner",
  description: "Show bot uptime.",
  async execute(message) {
    if (!(await requireCoOwner(message))) return;
    const ms = Date.now() - BOT_START;
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    await message.reply(
      `⏱️ **Uptime**\n> ${d}d ${h}h ${m}m ${s}s`
    );
  },
};

// ─── !logs ───────────────────────────────────────────────────────────────────
const logs = {
  name: "logs",
  aliases: [],
  category: "Owner",
  description: "Show recent bot logs.",
  async execute(message) {
    if (!(await requireCoOwner(message))) return;
    const recent = (state.logs || []).slice(-20);
    if (!recent.length) {
      return message.reply("📋 No recent logs.");
    }
    const text = recent.map((l) => `[${l.level}] ${l.msg}`).join("\n");
    await message.reply(`📋 **Recent Logs**\n\`\`\`\n${text.slice(0, 1800)}\n\`\`\``);
  },
};

// ─── !eval ───────────────────────────────────────────────────────────────────
const evalCmd = {
  name: "eval",
  aliases: [],
  category: "Owner",
  description: "Evaluate JavaScript (owner only — dangerous).",
  async execute(message, args, client) {
    if (!(await requireOwner(message))) return;
    const code = args.join(" ");
    if (!code) return message.reply("❌ Provide code to evaluate.");
    try {
      // eslint-disable-next-line no-eval
      let result = eval(code);
      if (result instanceof Promise) result = await result;
      const output = String(result).slice(0, 1900);
      await message.reply(`✅ **Result**\n\`\`\`js\n${output}\n\`\`\``);
    } catch (err) {
      await message.reply(`❌ **Error**\n\`\`\`\n${String(err).slice(0, 1900)}\n\`\`\``);
    }
  },
};

// ─── !exec ───────────────────────────────────────────────────────────────────
const exec = {
  name: "exec",
  aliases: [],
  category: "Owner",
  description: "Run a shell command (owner only — dangerous).",
  async execute(message, args) {
    if (!(await requireOwner(message))) return;
    const cmd = args.join(" ");
    if (!cmd) return message.reply("❌ Provide a command to run.");
    const { exec: execShell } = require("child_process");
    execShell(cmd, { timeout: 15000 }, async (err, stdout, stderr) => {
      const out = (stdout || stderr || String(err)).slice(0, 1900);
      await message.reply(`🖥️ **Output**\n\`\`\`\n${out}\n\`\`\``).catch(() => {});
    });
  },
};

// ─── !reload ─────────────────────────────────────────────────────────────────
const reload = {
  name: "reload",
  aliases: [],
  category: "Owner",
  description: "Reload bot commands from disk (owner only).",
  async execute(message, _args, client) {
    if (!(await requireOwner(message))) return;
    try {
      const { loadCommands } = require("../commandLoader");
      // Purge require cache for command files then reload.
      const path = require("path");
      const cmdDir = path.join(__dirname);
      for (const key of Object.keys(require.cache)) {
        if (key.startsWith(cmdDir)) delete require.cache[key];
      }
      const fresh = loadCommands();
      // Update the live commands map in-place.
      client._pokeCommands = fresh;
      await message.reply(`✅ Reloaded **${fresh.size}** commands successfully.`);
    } catch (err) {
      await message.reply(`❌ Reload failed: ${err.message}`);
    }
  },
};

// ─── !restart ────────────────────────────────────────────────────────────────
const restart = {
  name: "restart",
  aliases: [],
  category: "Owner",
  description: "Restart the bot process (owner only).",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    await message.reply("🔄 Restarting bot... BRB!").catch(() => {});
    setTimeout(() => process.exit(0), 1000);
  },
};

// ─── !shutdown ───────────────────────────────────────────────────────────────
const shutdown = {
  name: "shutdown",
  aliases: [],
  category: "Owner",
  description: "Shut down the bot (owner only).",
  async execute(message) {
    if (!(await requireOwner(message))) return;
    await message.reply("💤 Shutting down. Goodbye!").catch(() => {});
    setTimeout(() => process.exit(0), 1000);
  },
};

module.exports = [ping, uptime, logs, evalCmd, exec, reload, restart, shutdown];
