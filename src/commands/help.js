const { MENU_TEXT } = require("../data/menu");

module.exports = {
  name: "help",
  aliases: [],
  category: "Community",
  description: "Show the full command menu.",
  async execute(message) {
    await message.reply(MENU_TEXT);
  },
};
