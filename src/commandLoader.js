const fs = require("fs");
const path = require("path");

function loadCommands() {
  const dir = path.join(__dirname, "commands");
  const commands = new Map();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;
    const command = require(path.join(dir, file));
    if (!command?.name || typeof command.execute !== "function") continue;
    commands.set(command.name, command);
    for (const alias of command.aliases || []) {
      commands.set(alias, command);
    }
  }
  return commands;
}

module.exports = { loadCommands };
