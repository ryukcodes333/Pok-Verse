const fs = require("fs");
const path = require("path");

function loadCommands() {
  const dir = path.join(__dirname, "commands");
  const commands = new Map();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;
    const exported = require(path.join(dir, file));
    // Support both single-command exports and array exports (admin bundles).
    const list = Array.isArray(exported) ? exported : [exported];
    for (const command of list) {
      if (!command?.name || typeof command.execute !== "function") continue;
      commands.set(command.name, command);
      for (const alias of command.aliases || []) {
        commands.set(alias, command);
      }
    }
  }
  return commands;
}

module.exports = { loadCommands };
