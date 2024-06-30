const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Jakarta").locale("id");
const { color, logger } = require("@utils/color");
const db = require("@database");

module.exports = async function (msg) {
  try {
    const { key, from, type, isGroup, sender, pushname, message, isBaileys } = msg;

    // Ignore messages from broadcast status and protocol messages
    if (key && !key.fromMe && key.remoteJid === "status@broadcast") return;
    if (type === 'protocolMessage' && message.protocolMessage.type === 0) return;
    if (isBaileys) return;

    // Database operations
    await db.read();
    if (db.data) db.save();

    // Handler function
    command.handlerF(msg)

    // Handler for command
    command.handler(msg, { ...msg }).then(async (data) => {
      if (data.known) {
        const timestamp = color(moment(msg.messageTimestamp * 1000).format("DD/MM/YY HH:mm:ss"), "yellow");
        const commandText = color(`${msg.command} [${msg.args.length}]`, "magenta");

        if (data.pass) {
          if (!isGroup && sender) {
            console.log(color("[  EXEC  ]"), timestamp, commandText, "from", color(pushname, "cyan"));
          } else if (!isGroup) {
            console.log(color("[  EXEC  ]"), timestamp, commandText, "from", color(pushname, "cyan"));
          } else if (isGroup) {
            console.log(color("[  EXEC  ]"), timestamp, commandText, "from", color(pushname, "cyan"), "in", color(msg.groupMetadata.subject, "cyan"));
          }
        } else {
          const errorCommandText = color(`${msg.command} [${msg.args.length}]`, "red");
          if (!isGroup && sender) {
            console.log(color("[  ????  ]"), timestamp, errorCommandText, "from", color(pushname, "cyan"));
          } else if (!isGroup) {
            console.log(color("[  ????  ]"), timestamp, errorCommandText, "from", color(pushname, "cyan"));
          } else if (isGroup) {
            console.log(color("[  ????  ]"), timestamp, errorCommandText, "from", color(pushname, "cyan"), "in", color(msg.groupMetadata.subject, "cyan"));
          }
        }
      }
    })
  } catch (e) {
    if (/(undefined|overlimit)/gi.test(e)) return;
    logger.error(e);
  }
};