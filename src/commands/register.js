const { isRegistered, createTrainer } = require("../db/trainers");
const { buildRegistrationEmbed } = require("../services/embeds");

module.exports = {
  name: "register",
  aliases: ["reg"],
  category: "Trainer",
  description: "Create your Trainer Card and begin your journey.",
  async execute(message) {
    if (isRegistered(message.author.id)) {
      return message.reply("🌸 You already have a Trainer Card! Use `!profile` to view it.");
    }
    const trainer = createTrainer(message.author.id, message.author.username);
    const embed = buildRegistrationEmbed(message.author.username, trainer.trainer_id);
    await message.reply({ embeds: [embed] });
  },
};
