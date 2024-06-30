const moment = require('moment-timezone');
const db = require("@database")
const config = require("@config")
const { runtime } = require("@utils/function")

command.exec({
  name: "help",
  command: ["help","menu"],
  param: "<cmd name>",
  category: "general",
  description: "To see the list of all commands and see the details of the command",
}, async function (msg) {
  const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
  let greetingMessage = '';
  if (currentTime < '06:00:00') {
    greetingMessage = `Ohayō *${msg.pushname}* 🙌🏻`;
  } else if (currentTime < '11:00:00') {
    greetingMessage = `Ohayō *${msg.pushname}* 🙌🏻`;
  } else if (currentTime < '15:00:00') {
    greetingMessage = `Kon'nichiwa *${msg.pushname}* 🙌🏻`;
  } else if (currentTime < '18:00:00') {
    greetingMessage = `Kon'nichiwa *${msg.pushname}* 🙌🏻`;
  } else if (currentTime < '19:00:00') {
    greetingMessage = `Konbanwa *${msg.pushname}* 🙌🏻`;
  } else if (currentTime < '23:59:00') {
    greetingMessage = `Oyasuminasai *${msg.pushname}* 🙌🏻`;
  }
  
  if (msg.text) {
    const commands = Object.values(command.event).find(cm => cm.command && cm.command.includes(msg.text.toLowerCase()));
    if (!commands || (commands.category === "owner" && !msg.isOwner)) {
      await msg.reply("No command found");
    } else {
      const data = [`*「 HELPER 」*\n`];
      if (Array.isArray(commands.command)) data.push(`• Alias : ${commands.command.join(', ')}`);
      if (commands.category) data.push(`• Category : ${commands.category}`);
      if (commands.description) data.push(`• Description : ${commands.description}`);
      if (commands.param) data.push(`• Params : ${msg.prefix}${msg.text.toLowerCase()} ${commands.param}\n\n*「 MARK IN PARAMS 」*\n\n<> = it must be filled\n[] = does not have to be filled\n... = and so on\n| = or`);
      if (data.length === 1) {
        await msg.reply("No command detail");
      } else {
        await msg.reply(data.join('\n'));
      }
    }
  } else {
    const data = [];
    for (let i of Object.keys(command.event)) {
      if (i.includes(',')) {
        for (let j of i.split(',')) {
          if (command.event[i].category !== 'hidden') {
            data.push({ name: j + ` ${command.event[i].param ? command.event[i].param : ''}`, tag: command.event[i].category });
          }
        }
      } else {
        if (command.event[i].category !== 'hidden') {
          data.push({ name: i + ` ${command.event[i].param ? command.event[i].param : ''}`, tag: command.event[i].category });
        }
      }
    }
    
    const mapTag = data.map((mek) => mek.tag);
    const sortTag = [...new Set(mapTag)].sort();
    const totalFeatures = Object.values(command.event).filter(feature => feature.category !== 'hidden').length; 
    let menu = `${greetingMessage}\n📬 You need help? The following is a list of the commands needed :\n\n> *Total Command* : ${totalFeatures}\n`;
    
    for (let tag of sortTag) {
      menu += `\n` + "📃 `" + `${tag.toUpperCase()}` + "`" + `\n`;
      const filteredTags = data.filter((mek) => mek.tag === tag);
      const listCmd = filteredTags.map((mek) => mek.name).sort();
      for (let j = 0; j < listCmd.length; j++) {
        menu += (j === listCmd.length - 1) ? `└ ${msg.prefix}${listCmd[j]}\n` : `├ ${msg.prefix}${listCmd[j]}\n`;
      }
    }
    await msg.reply(menu + `\n> © ${config.bot.name} || api.xfar.net`, {
      contextInfo: {
        externalAdReply: {  
          title: config.bot.name.toUpperCase(),
          body: `bots make things easier for you with existing features`,
          thumbnailUrl: `https://cdn.sazumi.moe/file/wlozpj.jpg`,
          sourceUrl: `https://github.com/xfar05/shinoa-bot`,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: msg })
  }
})

command.exec({
  name: "dashboard",
  command: ["dashboard","statistic"],
  category: "general",
  description: "displays the bot data dashboard"
},
async function (msg) {
  const currentTime = Date.now();
  const hitbotData = db.get('hit');
  const logsData = db.get('logs');

  // Helper function to get unique commands and their hit counts
  const getCommandHits = (data, sender = null) => {
    const filteredData = sender ? data.filter(entry => entry.sender === sender) : data;
    const uniqueCmds = [...new Set(filteredData.map(entry => entry.cmd))];
    return uniqueCmds.map(cmd => ({
      cmd,
      hit: filteredData.filter(entry => entry.cmd === cmd).length
    })).sort((a, b) => b.hit - a.hit);
  };

  // Get global and user-specific command hits
  const globalHits = getCommandHits(hitbotData);
  const userHits = getCommandHits(hitbotData, msg.sender);

  // Helper function to generate hit text
  const generateHitText = (hits, prefix) => {
    return hits.slice(0, 6).map(hit => `› ${prefix}${hit.cmd} : ${hit.hit}`).join('\n');
  };

  // Message statistics calculation
  const messages = Object.values(logsData).reduce((acc, value) => acc.concat(value.message), []);
  const timeIntervals = [
    { label: 'last 30 seconds', duration: 30000 },
    { label: 'last 10 minutes', duration: 600000 },
    { label: 'last 1 hour', duration: 3600000 },
    { label: 'last 6 hours', duration: 21600000 },
    { label: 'last 12 hours', duration: 43200000 },
    { label: 'last 1 day', duration: 86400000 },
  ];

  const messageStats = timeIntervals.map(interval => ({
    label: interval.label,
    count: messages.filter(messageTime => currentTime - messageTime < interval.duration).length
  }));

  const messageStatsText = messageStats.map(stat => `› ${stat.label}: ${stat.count} pesan`).join('\n');

  // Construct the final text
  const dashboardText = `> ${config.style} *HIT BOT*
› Global : ${hitbotData.length}
› User : ${userHits.length}

> ${config.style} *MOST COMMAND GLOBAL*
${generateHitText(globalHits, msg.prefix)}

> ${config.style} *MOST COMMAND USER*
${generateHitText(userHits, msg.prefix)}

> ${config.style} *STATISTIK PESAN*
${messageStatsText}`.trim();

  msg.reply(dashboardText);
});

command.exec({
  name: "ping",
  command: "ping",
  category: "general",
  description: "this description"
},
async function (msg) {
  await msg.reply(`~ *Ping :* ${(Date.now() - new Date(msg.messageTimestamp * 1000)) / 1000} Second`);
})

command.exec({
  name: "runtime",
  command: "runtime",
  category: "general"
},
async function (msg) {
  msg.reply(await runtime())
})

command.exec({
  name: "owner",
  command: ["owner","contact"],
  category: "general"
},
async function (msg) {
  await conn.sendContact(msg.from, config.owner.number, msg, { ephemeralExpiration: msg.expiration }).then(async(quoted) => {
    await msg.reply("that is my owner's whatsapp number", { quoted })
  })
})