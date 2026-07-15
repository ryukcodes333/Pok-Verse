# 🌸 Pokebot — A Full-Featured Discord Pokémon Bot

A feature-complete, prefix-command Discord Pokémon bot covering catching, battling, trading, economy, and more. Powered by [PokeAPI](https://pokeapi.co/) and backed by a zero-native-dependency JSON data store.

---

## Table of Contents

- [Features](#features)
- [Quick Start (Local)](#quick-start-local)
- [Deploying to Render](#deploying-to-render)
- [Environment Variables](#environment-variables)
- [Persistence — Important!](#persistence--important)
- [Command Reference](#command-reference)
- [Mechanics Overview](#mechanics-overview)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

---

## Features

- **~40 prefix commands** across six categories: Trainer, Pokémon, Adventure, Items, Economy, Community
- **Full catch flow**: explore → wild encounter → battle → catch, with real PokeAPI catch rates
- **Battling**: wild battles, 8 scripted gym leaders, multi-player raid bosses
- **Economy**: PokéCoins, daily rewards, jobs, hunting, fishing, a player-run marketplace
- **Pokémon system**: IVs, natures, abilities (hidden ability roll), gender, shinies (1/4096), evolution
- **Pokedex**, party (up to 6), PC box, nickname, favorite, release
- **Trading**: direct trainer-to-trainer via ✅ reaction confirm
- **Community**: leaderboard, events, daily quests
- All live Pokémon data (sprites, stats, moves, types, learnsets, flavor text) pulled from PokeAPI and cached in-process

---

## Quick Start (Local)

### 1. Clone / unzip
```bash
unzip pokebot.zip
cd discord-bot
```

### 2. Install dependencies
```bash
npm install
```

> **Requires Node.js ≥ 18.** No native compiled modules — installs cleanly on any OS.

### 3. Create your bot application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**
2. Navigate to **Bot** → **Add Bot**
3. Copy the **Token** (you'll need it in step 4)
4. Scroll down and enable **Message Content Intent** (required for prefix commands)
5. Go to **OAuth2 → URL Generator** → check `bot`, then under Bot Permissions check:
   - Read Messages / View Channels
   - Send Messages
   - Embed Links
   - Add Reactions
   - Read Message History
6. Copy the generated URL and visit it to invite the bot to your server

### 4. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
DISCORD_TOKEN=your_bot_token_here
PREFIX=!
```

### 5. Run
```bash
npm start
```

You should see `✅ Logged in as YourBot#0000`. Type `!menu` in your Discord server to begin.

---

## Deploying to Render

Render is the recommended hosting platform for Pokebot.

### Step-by-step

1. **Create a Render account** at [render.com](https://render.com) if you don't have one.

2. **Create a new Web Service** (or Background Worker — both work):
   - Connect your GitHub repo, or use **Deploy from existing code** and upload the unzipped folder
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free tier works fine for a small server; Starter ($7/mo) recommended for 24/7 uptime

3. **Add Environment Variables** under **Environment → Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `DISCORD_TOKEN` | Your bot token from the Developer Portal |
   | `PREFIX` | `!` (or your preferred prefix) |
   | `DB_PATH` | `/data/pokebot.json` ← **only if you add a Disk** (see below) |
   | `SPAWN_CHANNEL_IDS` | Comma-separated channel IDs for auto wild spawns (optional) |
   | `SPAWN_INTERVAL_MINUTES` | How often wild Pokémon auto-spawn (default: `8`) |

4. **Deploy.** Render will install Node, run `npm install`, and start the bot.

5. Type `!menu` in Discord to confirm the bot is online.

> 💡 **Tip:** Set the Render service type to **Background Worker** rather than Web Service — the bot doesn't serve HTTP traffic and a Web Worker avoids the auto-sleep on inactivity on the free plan.

---

## Persistence — Important!

**By default, Render's filesystem is ephemeral.** All data written to disk is wiped on every new deploy or restart. This means trainer data, Pokémon, coins, and progress will be lost when Render restarts the service.

### Option A — Render Persistent Disk (Recommended)

1. In your Render service dashboard, go to **Disks** → **Add Disk**
2. Set the mount path to `/data`
3. Set `DB_PATH` environment variable to `/data/pokebot.json`
4. Redeploy

This mounts a real persistent volume; your JSON data file will survive restarts and deploys.

### Option B — Migrate to PostgreSQL

For larger communities or if you need true ACID guarantees, you can migrate the `src/db/store.js` backing layer to a Postgres client (e.g. `pg` or `@neondatabase/serverless`). Render offers a managed Postgres add-on. The JSON store's collection structure maps cleanly to tables.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | **Yes** | — | Your Discord bot token |
| `PREFIX` | No | `!` | Command prefix |
| `DB_PATH` | No | `data/pokebot.json` (relative to project root) | Path to the JSON data file |
| `SPAWN_CHANNEL_IDS` | No | _(none)_ | Comma-separated channel IDs for automatic wild Pokémon spawns |
| `SPAWN_INTERVAL_MINUTES` | No | `8` | Minutes between automatic wild spawns in listed channels |

---

## Command Reference

### 👤 Trainer
| Command | Description |
|---------|-------------|
| `!register` / `.reg` | Create your Trainer Card and claim your starter |
| `!starter <name>` | Choose Bulbasaur, Charmander, or Squirtle |
| `!profile` | View your Trainer Card |
| `!stats` | Trainer statistics (battles, shinies, win rate…) |
| `!badges` | Gym badge collection |
| `!quests` | Daily quests • `!quests claim` to collect rewards |

### 🐾 Pokémon
| Command | Description |
|---------|-------------|
| `!pokemon <name>` | Look up any Pokémon species via PokeAPI |
| `!party` | View your active party (up to 6) |
| `!party <1-6>` | Full stat / move profile embed for a party slot |
| `!box` | View Pokémon stored in your PC box |
| `!pokedex` | Overall seen/caught progress |
| `!pokedex <name>` | Individual dex entry |
| `!evolve <index>` | Evolve a party Pokémon that meets its requirement |
| `!moves <index>` | Show a Pokémon's four moves |
| `!learn <index> <move>` | Teach a Pokémon a level-up move it's eligible for |
| `!nickname <index> <name>` | Give a Pokémon a nickname |
| `!favorite <index>` | Toggle favorite (protects from release) |
| `!release <index>` | Release a Pokémon back into the wild |

### ⚔️ Adventure
| Command | Description |
|---------|-------------|
| `!explore` / `!wild` | Trigger a wild Pokémon encounter |
| `!catch <name>` | Throw a Poke Ball at the active wild Pokémon |
| `!battle <index>` | Battle the wild Pokémon with a party slot |
| `!gym [leader]` | List gym leaders or challenge one |
| `!raid` | Start a raid boss encounter in this channel |
| `!raid attack <index>` | Hit the active raid boss |

### 🎒 Items
| Command | Description |
|---------|-------------|
| `!bag` | View your item inventory |
| `!shop` | Browse the PokéMart |
| `!buy <item> [qty]` | Buy items with PokéCoins |
| `!sell <item> [qty]` | Sell items for PokéCoins |
| `!use <item> <index>` | Use a heal/revive/candy/stone on a party Pokémon |

### 💰 Economy
| Command | Description |
|---------|-------------|
| `!balance` | Check PokéCoin balance |
| `!daily` | Claim daily reward (24-hour cooldown) |
| `!work` | Earn coins from a random job (1-hour cooldown) |
| `!hunt` | Scavenge for coins or items (45-minute cooldown) |
| `!fish` | Fish for coins or a water-type encounter (30-minute cooldown) |

### 🤝 Community
| Command | Description |
|---------|-------------|
| `!trade @user <index>` | Offer a Pokémon to another trainer (reaction-confirmed) |
| `!market` | Browse the player marketplace |
| `!market list <index> <price>` | List a Pokémon for sale |
| `!market buy <id>` | Buy a listed Pokémon |
| `!market remove <id>` | Remove your own listing |
| `!leaderboard [coins\|battles\|caught]` | Server rankings |
| `!events` | View the current weekly event |
| `!menu` / `!help` | Full command menu |

---

## Mechanics Overview

### Stats
Calculated using the standard Pokémon formula:
- **HP:** `floor((2*base + IV + floor(EV/4)) * level / 100) + level + 10`
- **Other stats:** `floor((floor((2*base + IV + floor(EV/4)) * level / 100) + 5) * nature_modifier)`

### Natures
All 25 natures implemented with ±10% modifiers. Rolled randomly on catch/spawn.

### IVs
6 stats, each 0–31, rolled at random when a Pokémon is obtained. Displayed as a percentage (0–100%) in the party embed.

### Shinies
1-in-4096 chance on every wild catch. Shown in gold embed color with ✨ marker.

### Evolution
Triggers checked: `level-up` (minLevel), `friendship` (minHappiness), `use-item` (stone), `trade`. Use `!evolve <index>` for level/friendship evolutions; `!use <stone> <index>` for stone evolutions.

### Catch Chance
Simplified Gen 3+ formula: `a = (3·maxHP - 2·currentHP) / (3·maxHP) · captureRate · ballBonus`. Shakes test against `(a/255)^0.25`.

### XP Curve
Medium-fast style: `xpForLevel(n) = floor(0.8 · n³)`. Capped at level 100.

### Wild Levels
Scaled by badge count: `min = badgeCount * 5 + 2`, `max = min + 6`.

### Type Effectiveness
Full 18-type chart (Gen VI+) with 0×, ½×, 1×, 2× multipliers.

### Gym Leaders
Eight scripted Kanto leaders (Brock → Giovanni). Each fields a signature Pokémon with live PokeAPI stats. Defeat all 8 for 100% badge completion.

---

## Architecture

```
discord-bot/
├── src/
│   ├── index.js              — Bot entrypoint (client, login, event wiring)
│   ├── commandLoader.js      — Auto-discovers all src/commands/*.js files
│   ├── config.js             — Central config from environment variables
│   ├── commands/             — ~40 command files (one per command)
│   ├── db/
│   │   ├── store.js          — JSON file-backed data store (zero native deps)
│   │   ├── trainers.js       — Trainer CRUD
│   │   ├── pokemon.js        — Pokémon CRUD (party, box, mutations)
│   │   ├── inventory.js      — Item inventory
│   │   ├── pokedex.js        — Seen/caught tracking
│   │   ├── quests.js         — Daily quest system
│   │   └── market.js         — Player marketplace
│   ├── services/
│   │   ├── pokeapi.js        — PokeAPI client with in-memory cache
│   │   ├── mechanics.js      — IVs, stats, XP, catch, natures, damage
│   │   ├── battle.js         — Full 1v1 battle simulator
│   │   ├── combatant.js      — Builds battle-ready combatant from row/instance
│   │   ├── embeds.js         — Embed builders (party detail, wild, registration)
│   │   ├── spawnFactory.js   — Wild encounter pool and instance builder
│   │   ├── encounters.js     — In-memory per-channel encounter store (5-min TTL)
│   │   ├── raids.js          — In-memory raid store
│   │   ├── guard.js          — Registration guard helper
│   │   ├── starters.js       — Starter Pokémon list
│   │   └── cooldown.js       — Cooldown utilities
│   ├── data/
│   │   ├── natures.js        — 25 natures + lookup
│   │   ├── typeChart.js      — Full type effectiveness table
│   │   ├── typeEmojis.js     — Type → emoji mapping
│   │   ├── items.js          — Shop catalog
│   │   ├── gyms.js           — 8 Kanto gym leaders
│   │   └── menu.js           — !menu text
│   ├── events/
│   │   ├── ready.js          — "ready" event handler
│   │   └── messageCreate.js  — Message dispatcher (prefix routing)
│   └── lib/
│       └── logger.js         — Simple console logger
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Data Store
All data is persisted to a single JSON file (default: `data/pokebot.json`). Writes are debounced asynchronously via `setImmediate`. On SIGTERM/SIGINT the store flushes synchronously before exit, so Render's graceful shutdown preserves the last state. On startup the file is read once and kept in-memory for the lifetime of the process.

### PokeAPI Caching
Species data is cached in a `Map` keyed by name for the lifetime of the process. On a typical single-server deployment this covers all Pokémon encountered without re-fetching. On restart the cache is cold again; PokeAPI is rate-limit-friendly and requests complete in ~200ms on first load.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Bot is offline / doesn't respond | Token wrong or expired | Regenerate token in Developer Portal; update `DISCORD_TOKEN` |
| `!catch` / `!battle` commands not working | Message Content Intent disabled | Enable it at Developer Portal → Bot → Privileged Gateway Intents |
| Data lost on Render restart | No persistent Disk | Add a Render Disk at mount path `/data` and set `DB_PATH=/data/pokebot.json` |
| `Cannot find module` on startup | deps not installed | Run `npm install` in the `discord-bot/` directory |
| PokeAPI errors / unknown Pokémon | Network issue or typo | Check spelling; PokeAPI uses lowercase hyphenated slugs (e.g. `mr-mime`) |
| Embed has no thumbnail | Sprite URL returned `null` | Known edge case for some forms; species still works normally |
| Trade reaction never fires | Missing `GuildMessageReactions` intent | Already included; ensure the bot has **Read Message History** permission in that channel |

---

## License

MIT — do whatever you like with this bot. Attribution appreciated but not required.
