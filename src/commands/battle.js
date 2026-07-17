// !battle <party index>
// Starts an interactive wild battle against the active encounter in this channel.
// After the battle scene is shown the player uses !wb <1-4> to pick a move each turn.
const { requireRegistered } = require("../services/guard");
const { getEncounter } = require("../services/encounters");
const { getPartySlot, getParty } = require("../db/pokemon");
const { combatantFromRow, combatantFromWild } = require("../services/combatant");
const { getBattle, setBattle } = require("../services/activeBattles");
const { sendBattleScene } = require("../services/battleScene");

module.exports = {
  name: "battle",
  aliases: [],
  category: "Adventure",
  description: "Start an interactive battle against the wild Pokémon: `!battle <party index>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;

    // If a battle is already active, redirect
    const existing = getBattle(message.channel.id);
    if (existing) {
      if (existing.playerUserId !== message.author.id) {
        return message.reply("⚠️ Another trainer's battle is in progress here. Wait for it to end!");
      }
      return message.reply("⚔️ Your battle is already active! Use `!wb <1-4>` to choose a move.");
    }

    const encounter = getEncounter(message.channel.id);
    if (!encounter) {
      return message.reply("🌿 There's no wild Pokémon to battle here. Try `!explore`!");
    }

    // Pick the party member to send out
    const index = Number(args[0]) || 1;
    let slot = getPartySlot(message.author.id, index);
    if (!slot) {
      return message.reply("Usage: `!battle <party index>` — pick a Pokémon from `!party`.");
    }
    if (slot.current_hp <= 0) {
      // Try to find a healthy one automatically
      const party = getParty(message.author.id);
      const healthy = party.find((p) => p.current_hp > 0);
      if (!healthy) return message.reply("💀 All your Pokémon have fainted! Heal up before battling.");
      slot = healthy;
    }

    const playerMon = await combatantFromRow(slot);
    const wildMon = await combatantFromWild(encounter);

    // Register the live battle state
    setBattle(message.channel.id, {
      type: "wild",
      playerUserId: message.author.id,
      playerDbId: slot.id,
      playerMon: { ...playerMon, currentHp: playerMon.currentHp },
      wildMon: { ...wildMon, currentHp: wildMon.currentHp },
      encounter,
    });

    // Show the battle scene — player picks a move with !wb <1-4>
    return sendBattleScene(message.channel, {
      title: `⚔️ Wild Battle! — ${message.author.username}`,
      opponentName: wildMon.name,
      opponentLevel: wildMon.level,
      opponentHp: wildMon.currentHp,
      opponentMaxHp: wildMon.maxHp,
      opponentSprite: encounter.species?.sprite,
      playerName: playerMon.name,
      playerLevel: playerMon.level,
      playerHp: playerMon.currentHp,
      playerMaxHp: playerMon.maxHp,
      playerMoves: playerMon.moves,
      log: `A wild **${wildMon.name}** appeared! Choose your move!`,
      hint: "Use `!wb <1-4>` to attack  •  `!catch` to throw a ball  •  `!run` to flee",
    });
  },
};
