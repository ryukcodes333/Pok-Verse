const { requireCoOwner } = require("../services/guard");

const COOWNER_PANEL = `## 🛡️ **Co-Owner Panel**

👤 **Users**
┆\`!userinfo\`
┆\`!inventory\`
┆\`!blacklist\`
┆\`!unblacklist\`
┆\`!resetuser\`

────── ⋆⋅☆⋅⋆ ──────

🐾 **Pokémon**
┆\`!givepoke\`
┆\`!removepoke\`
┆\`!healpoke\`

────── ⋆⋅☆⋅⋆ ──────

🎒 **Inventory**
┆\`!giveitem\`
┆\`!removeitem\`
┆\`!clearbag\`
┆\`!addmoney\`
┆\`!takemoney\`
┆\`!settokens\`
┆\`!setgems\`

────── ⋆⋅☆⋅⋆ ──────

🌍 **Spawns**
┆\`!spawn\`
┆\`!spawnshiny\`
┆\`!spawnalpha\`
┆\`!spawnlegendary\`
┆\`!spawnmythical\`
┆\`!forceraid\`

────── ⋆⋅☆⋅⋆ ──────

🎉 **Events**
┆\`!startevent\`
┆\`!endevent\`
┆\`!doublexp\`
┆\`!doublecatch\`
┆\`!boostshiny\`
┆\`!boostlegendary\`
┆\`!giveall\`
┆\`!announcement\`

────── ⋆⋅☆⋅⋆ ──────

🏆 **Gyms & Battles**
┆\`!resetgym\`
┆\`!givebadge\`
┆\`!removebadge\`
┆\`!resetbattle\`
┆\`!forcewin\`
┆\`!forcelose\`

────── ⋆⋅☆⋅⋆ ──────

💰 **Economy**
┆\`!setcoins\`
┆\`!addcoins\`
┆\`!removecoins\`
┆\`!setredeems\`
┆\`!addredeems\`
┆\`!removeredeems\`

────── ⋆⋅☆⋅⋆ ──────

📢 **Management**
┆\`!broadcast\`
┆\`!setstatus\`
┆\`!maintenance on\`
┆\`!maintenance off\`

────── ⋆⋅☆⋅⋆ ──────

🧪 **Utilities**
┆\`!logs\`
┆\`!ping\`
┆\`!uptime\`
┆\`!stats\``;

module.exports = {
  name: "c",
  aliases: [],
  category: "CoOwner",
  description: "Co-Owner panel and commands.",
  async execute(message, args) {
    if (!(await requireCoOwner(message))) return;
    const sub = (args[0] || "").toLowerCase();
    if (sub === "menu") {
      await message.reply(COOWNER_PANEL);
    } else {
      await message.reply(`🛡️ Unknown subcommand. Use \`!c menu\` to view the Co-Owner Panel.`);
    }
  },
};
