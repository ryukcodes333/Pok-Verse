const { MENU_TEXT } = require("../data/menu");

module.exports = {
  name: "menu",
  aliases: [],
  category: "General",
  description: "Show the full command menu.",
  async execute(message) {
    await message.reply(MENU_TEXT);
  },
};
