// !dev — shows the Developer Panel via DM (owner-only, private by design)
const { requireOwner } = require("../services/guard");

const SECTIONS = [
  `## 👑 **Developer Panel**

⚙️ **Bot**
┆\`!shutdown\`
┆\`!restart\`
┆\`!reload\`
┆\`!eval\`
┆\`!exec\`
┆\`!logs\`
┆\`!ping\`
┆\`!uptime\`
┆\`!stats\`

────── ⋆⋅☆⋅⋆ ──────

🛡️ **Co-Owner Management**
┆\`!setcoowner\`
┆\`!removecoowner\`
┆\`!coowners\`
┆\`!iscoowner\`
┆\`!transferownership\`

────── ⋆⋅☆⋅⋆ ──────

👤 **Users**
┆\`!userinfo\`
┆\`!inventory\`
┆\`!blacklist\`
┆\`!unblacklist\`
┆\`!banuser\`
┆\`!unbanuser\`
┆\`!resetuser\``,

  `────── ⋆⋅☆⋅⋆ ──────

🐾 **Pokémon**
┆\`!givepoke\`
┆\`!removepoke\`
┆\`!editpoke\`
┆\`!clonepoke\`
┆\`!healpoke\`
┆\`!evolve\`
┆\`!devolve\`
┆\`!setlevel\`
┆\`!setexp\`
┆\`!setnature\`
┆\`!setability\`
┆\`!setgender\`
┆\`!setshiny\`
┆\`!setalpha\`
┆\`!setiv\`
┆\`!setev\`
┆\`!setmoves\`
┆\`!learnmove\`
┆\`!forgetmove\`
┆\`!releaseforce\`

────── ⋆⋅☆⋅⋆ ──────

🎒 **Inventory**
┆\`!giveitem\`
┆\`!removeitem\`
┆\`!clearbag\`
┆\`!setmoney\`
┆\`!addmoney\`
┆\`!takemoney\`
┆\`!settokens\`
┆\`!setgems\``,

  `────── ⋆⋅☆⋅⋆ ──────

🌍 **Spawns**
┆\`!spawn\`
┆\`!spawnshiny\`
┆\`!spawnalpha\`
┆\`!spawnlegendary\`
┆\`!spawnmythical\`
┆\`!forceraid\`
┆\`!forceevent\`
┆\`!stopevent\`
┆\`!setspawnrate\`
┆\`!reloadspawns\`

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
┆\`!forcelose\``,

  `────── ⋆⋅☆⋅⋆ ──────

💰 **Economy**
┆\`!setcoins\`
┆\`!addcoins\`
┆\`!removecoins\`
┆\`!setredeems\`
┆\`!addredeems\`
┆\`!removeredeems\`

────── ⋆⋅☆⋅⋆ ──────

📦 **Database**
┆\`!backup\`
┆\`!restore\`
┆\`!savedb\`
┆\`!loaddb\`
┆\`!exportuser\`
┆\`!importuser\`
┆\`!optimize\`
┆\`!cleancache\`

────── ⋆⋅☆⋅⋆ ──────

📢 **Management**
┆\`!setstatus\`
┆\`!setactivity\`
┆\`!setavatar\`
┆\`!setusername\`
┆\`!broadcast\`
┆\`!maintenance on\`
┆\`!maintenance off\`

────── ⋆⋅☆⋅⋆ ──────

🧪 **Debug**
┆\`!sql\`
┆\`!debug\`
┆\`!trace\`
┆\`!errorlog\`
┆\`!testspawn\`
┆\`!testbattle\`
┆\`!testcatch\`
┆\`!fakevote\`

────── ⋆⋅☆⋅⋆ ──────

👑 **God Mode**
┆\`!forcecatch\`
┆\`!forceshiny\`
┆\`!forcecritical\`
┆\`!forceevolve\`
┆\`!resetcooldowns\`
┆\`!wipeuser\`
┆\`!wipedb\`
┆\`!godmode\``,
];

module.exports = {
  name: "dev",
  aliases: [],
  category: "Owner",
  description: "Show the Developer Panel via DM (owner only).",
  async execute(message) {
    if (!(await requireOwner(message))) return;

    // Send each section as a separate DM so none exceed Discord's 2000-char limit.
    // This also keeps the panel private — only the owner sees it.
    try {
      const dm = await message.author.createDM();
      for (const section of SECTIONS) {
        await dm.send(section);
      }
      // Confirm in the channel without revealing any content
      await message.reply("📬 Developer Panel sent to your DMs!").catch(() => {});
    } catch {
      // DMs closed — fall back to channel (still owner-gated)
      for (const section of SECTIONS) {
        await message.channel.send(section);
      }
    }
  },
};
