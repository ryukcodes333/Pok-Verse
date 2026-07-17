// Generates a dynamic party card image as a PNG buffer.
// Requires @napi-rs/canvas — install with: npm install @napi-rs/canvas
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

const CARD_W = 700;
const SLOT_H = 110;
const PADDING = 16;
const SLOTS = 6;
const CARD_H = SLOTS * SLOT_H + PADDING * 2;

const TYPE_COLORS = {
  normal: "#9a9a7a", fire: "#f08030", water: "#6890f0", electric: "#f8d030",
  grass: "#78c850", ice: "#98d8d8", fighting: "#c03028", poison: "#a040a0",
  ground: "#e0c068", flying: "#a890f0", psychic: "#f85888", bug: "#a8b820",
  rock: "#b8a038", ghost: "#705898", dragon: "#7038f8", dark: "#705848",
  steel: "#b8b8d0", fairy: "#ee99ac",
};

const TYPE_EMOJIS = {
  normal:"⬜", fire:"🔥", water:"💧", electric:"⚡", grass:"🌿",
  ice:"❄️", fighting:"🥊", poison:"☠️", ground:"🟤", flying:"🪶",
  psychic:"🔮", bug:"🐛", rock:"🪨", ghost:"👻", dragon:"🐉",
  dark:"🌑", steel:"⚙️", fairy:"✨",
};

function typeEmoji(t) { return TYPE_EMOJIS[String(t).toLowerCase()] || "❔"; }
function typeColor(t) { return TYPE_COLORS[String(t).toLowerCase()] || "#7777aa"; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

function hpColor(ratio) {
  if (ratio > 0.5) return "#4caf50";
  if (ratio > 0.2) return "#ff9800";
  return "#f44336";
}

/**
 * Build the party image.
 * @param {Array} slots - array of objects with:
 *   { name, level, currentHp, maxHp, types: string[], spriteUrl: string|null, isShiny, isFavorite }
 *   Unfilled slots can be null.
 * @param {string} trainerName
 * @returns {Buffer} PNG buffer
 */
async function buildPartyImage(slots, trainerName) {
  const canvas = createCanvas(CARD_W, CARD_H);
  const ctx = canvas.getContext("2d");

  // ── Background ──────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, "#1a1a2e");
  bg.addColorStop(1, "#16213e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // ── Header ───────────────────────────────────────────────────────────────
  ctx.fillStyle = "#ff8fab";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(`👥 ${trainerName}'s Party`, PADDING, PADDING + 14);

  // ── Slots ────────────────────────────────────────────────────────────────
  for (let i = 0; i < SLOTS; i++) {
    const slot = slots[i] || null;
    const y = PADDING + 30 + i * SLOT_H;

    // Slot background
    ctx.fillStyle = slot ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)";
    ctx.beginPath();
    ctx.roundRect(PADDING, y + 4, CARD_W - PADDING * 2, SLOT_H - 8, 10);
    ctx.fill();

    // Slot number
    ctx.fillStyle = "#aaaacc";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`${i + 1}.`, PADDING + 10, y + SLOT_H / 2 + 6);

    if (!slot) {
      ctx.fillStyle = "#555577";
      ctx.font = "14px sans-serif";
      ctx.fillText("— empty —", PADDING + 40, y + SLOT_H / 2 + 6);
      continue;
    }

    // ── Sprite ────────────────────────────────────────────────────────────
    const spriteX = PADDING + 36;
    const spriteSize = 80;
    if (slot.spriteUrl) {
      try {
        const img = await loadImage(slot.spriteUrl);
        ctx.drawImage(img, spriteX, y + (SLOT_H - spriteSize) / 2, spriteSize, spriteSize);
      } catch {
        // Draw placeholder pokeball silhouette if sprite fails
        ctx.fillStyle = "#334";
        ctx.beginPath();
        ctx.arc(spriteX + spriteSize / 2, y + SLOT_H / 2, spriteSize / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Text area ────────────────────────────────────────────────────────
    const tx = spriteX + spriteSize + 12;
    const maxTW = CARD_W - tx - PADDING - 12;

    // Name + shiny/fav markers
    const namePrefix = (slot.isShiny ? "✨ " : "") + (slot.isFavorite ? "⭐ " : "");
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px sans-serif";
    ctx.fillText(namePrefix + slot.name, tx, y + 26);

    // Level
    ctx.fillStyle = "#ccccee";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Lv. ${slot.level}`, tx, y + 46);

    // Type badges
    const types = slot.types || ["normal"];
    let typeX = tx + 60;
    ctx.font = "12px sans-serif";
    for (const t of types) {
      const tColor = typeColor(t);
      const label = cap(t);
      const tw = ctx.measureText(label).width + 10;
      // Badge bg
      ctx.fillStyle = tColor + "cc";
      ctx.beginPath();
      ctx.roundRect(typeX, y + 34, tw, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(label, typeX + 5, y + 47);
      typeX += tw + 5;
    }

    // HP bar
    const barY = y + 62;
    const barW = Math.min(maxTW, 220);
    const ratio = slot.maxHp > 0 ? Math.max(0, Math.min(1, slot.currentHp / slot.maxHp)) : 0;
    // Bar track
    ctx.fillStyle = "#333355";
    ctx.beginPath();
    ctx.roundRect(tx, barY, barW, 10, 5);
    ctx.fill();
    // Bar fill
    if (ratio > 0) {
      ctx.fillStyle = hpColor(ratio);
      ctx.beginPath();
      ctx.roundRect(tx, barY, Math.max(6, barW * ratio), 10, 5);
      ctx.fill();
    }
    // HP text
    ctx.fillStyle = "#ccccee";
    ctx.font = "12px sans-serif";
    ctx.fillText(`❤️ ${slot.currentHp}/${slot.maxHp} HP`, tx, barY + 24);
  }

  return canvas.toBuffer("image/png");
}

module.exports = { buildPartyImage };
