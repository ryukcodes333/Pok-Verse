const { Client, GatewayIntentBits, Partials } = require("discord.js");
const http = require("http");
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

http.createServer((req, res) => res.end("OK")).listen(process.env.PORT || 3000, () =>
  logger.info(`Keepalive server listening on port ${process.env.PORT || 3000}`)
);

client.login(config.token);
