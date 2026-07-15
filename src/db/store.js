// Lightweight JSON file-backed data store. Avoids native dependencies (like
// better-sqlite3) so the bot installs cleanly on any host, including Render's
// build environment, with zero compiled bindings.
//
// NOTE ON PERSISTENCE: this writes to a single JSON file on disk. On most
// Render plans the filesystem is ephemeral and resets on every deploy/restart
// unless you attach a persistent Disk. See README.md "Persistence" section.
const fs = require("fs");
const path = require("path");
const config = require("../config");

const FILE_PATH = config.dbPath.endsWith(".db")
  ? config.dbPath.replace(/\.db$/, ".json")
  : config.dbPath;

const dir = path.dirname(FILE_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function defaultState() {
  return {
    trainers: {},
    pokemon: { nextId: 1, byId: {} },
    pokedex: {},
    inventory: {},
    quests: {},
    market: { nextId: 1, byId: {} },
  };
}

let state;
if (fs.existsSync(FILE_PATH)) {
  try {
    state = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  } catch {
    state = defaultState();
  }
} else {
  state = defaultState();
}
// Backfill any collections added in later versions of the bot.
state = { ...defaultState(), ...state };

let saveScheduled = false;
function save() {
  if (saveScheduled) return;
  saveScheduled = true;
  setImmediate(() => {
    saveScheduled = false;
    fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2));
  });
}

// Flush synchronously (used on process exit signals).
function saveSync() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2));
}

process.on("SIGINT", () => {
  saveSync();
  process.exit(0);
});
process.on("SIGTERM", () => {
  saveSync();
  process.exit(0);
});

module.exports = { state, save, saveSync, FILE_PATH };
