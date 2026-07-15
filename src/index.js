const { Client, GatewayIntentBits, Partials } = require("discord.js");
const config = require("./config");
const { logger } = require("./lib/logger");
const { loadCommands } = require("./commandLoader");
const registerReady = require("./events/ready");
const registerMessageCreate = require("./events/messageCreate");

if (!config.token) {
  logger.error("Missing DISCORD_TOKEN environment variable. Set it in your .env file (see .env.example).");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const commands = loadCommands();
logger.info(`Loaded ${new Set([...commands.values()].map((c) => c.name)).size} commands.`);

registerReady(client);
registerMessageCreate(client, commands);

client.on("error", (err) => logger.error("Client error:", err));
process.on("unhandledRejection", (err) => logger.error("Unhandled rejection:", err));

client.login(config.token);
