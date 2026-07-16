// Renders a live battle scene embed styled after the uploaded battle screenshot.
// Uses the nature background image (assets/battle_bg.jpg) as the embed image.
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");

const BG_PATH = path.join(__dirname, "../../assets/battle_bg.jpg");

function hpBar(current, max, length = 12) {
  const ratio = Math.max(0, Math.min(1, current / Math.max(1, max)));
  const filled = Math.round(ratio * length);
  const empty = length - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const pct = Math.round(ratio * 100);
  const color = pct > 50 ? "🟩" : pct > 20 ? "🟨" : "🟥";
  return `${color} \`${bar}\` **${current}/${max}**`;
}

function typeEmoji(type) {
  const map = {
    normal:"⬜", fire:"🔥", water:"💧", electric:"⚡", grass:"🌿",
    ice:"❄️", fighting:"🥊", poison:"☠️", ground:"🟤", flying:"🪶",
    psychic:"🔮", bug:"🐛", rock:"🪨", ghost:"👻", dragon:"🐉",
    dark:"🌑", steel:"⚙️", fairy:"✨",
  };
  return map[type?.toLowerCase()] || "❓";
}

function moveList(moves) {
  const nums = ["1️⃣","2️⃣","3️⃣","4️⃣"];
  return moves.map((m, i) => {
    const name = m.displayName || m.name || "???";
    const type = m.type || "normal";
    const pp = m.pp ? ` (PP: ${m.pp})` : "";
    return `${nums[i]} **${name}** ${typeEmoji(type)}${pp}`;
  }).join("\n");
}

/**
 * Sends a battle scene message to the channel.
 * @param {TextChannel} channel
 * @param {object} opts
 *   playerName, playerLevel, playerHp, playerMaxHp, playerMoves, playerSprite
 *   opponentName, opponentLevel, opponentHp, opponentMaxHp, opponentSprite
 *   log - last action string
 *   title - embed title
 *   hint - bottom hint text (e.g. "Use !wb <1-4> to attack | !catch to catch | !run to flee")
 *   color - embed color (default green)
 */
async function sendBattleScene(channel, opts) {
  const {
    playerName, playerLevel, playerHp, playerMaxHp, playerMoves = [], playerSprite,
    opponentName, opponentLevel, opponentHp, opponentMaxHp, opponentSprite,
    log = "", title = "⚔️ Battle!", hint = "Use the battle command to choose a move.",
    color = 0x2ecc71,
  } = opts;

  const desc = [
    `**🆚 ${opponentName}** — Lv. ${opponentLevel}`,
    hpBar(opponentHp, opponentMaxHp),
    ``,
    `**🎒 ${playerName}** — Lv. ${playerLevel}`,
    hpBar(playerHp, playerMaxHp),
    log ? `\n> ${log}` : "",
    ``,
    `**⚔️ Moves:**`,
    playerMoves.length ? moveList(playerMoves) : "_No moves available_",
    ``,
    `> ${hint}`,
  ].filter((l) => l !== undefined).join("\n");

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color);

  if (opponentSprite) embed.setThumbnail(opponentSprite);

  const files = [];
  if (fs.existsSync(BG_PATH)) {
    const attachment = new AttachmentBuilder(BG_PATH, { name: "battle_bg.jpg" });
    embed.setImage("attachment://battle_bg.jpg");
    files.push(attachment);
  }

  return channel.send({ embeds: [embed], files });
}

module.exports = { sendBattleScene, hpBar, typeEmoji, moveList };
