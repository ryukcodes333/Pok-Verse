const TYPE_EMOJIS = {
  normal: "⚪",
  fire: "🔥",
  water: "💧",
  electric: "⚡",
  grass: "🌿",
  ice: "❄️",
  fighting: "👊",
  poison: "☠️",
  ground: "🌍",
  flying: "🕊️",
  psychic: "🔮",
  bug: "🐛",
  rock: "🪨",
  ghost: "👻",
  dragon: "🐉",
  dark: "🌑",
  steel: "⚙️",
  fairy: "✨",
};

function typeEmoji(type) {
  return TYPE_EMOJIS[String(type).toLowerCase()] || "❔";
}

module.exports = { TYPE_EMOJIS, typeEmoji };
