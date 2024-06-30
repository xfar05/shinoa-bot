const { generateWAMessageFromContent } = require('@whiskeysockets/baileys')
const moment = require('moment-timezone');
const { clearAllFiles } = require("@utils/function")
const config = require("@config")
const db = require("@database")

command.functions("hit", async function (msg) {
  const words = []
  for (let i of Object.keys(command.event)) {
    if (i.search(/,/) > -1) {
      for (let j of i.split(",")) {
        if (command.event[i].category != "hidden") words.push(j)
      }
    } else {
      if (command.event[i].category != "hidden") words.push(i)
    }
  }
  if (msg.isCmd) {
    const hit = words.filter((v) => v === msg.command)
    if (hit[0] === msg.command && !msg.command == "") {
      const object = { sender: msg.sender, cmd: msg.command }
      await db.add("hit", object)
    }
  }
})

command.functions("message", async function (msg) {
  const logs = db.get("logs")
  if (!logs[msg.from]) {
    logs[msg.from] = {
      message: [],
      messageCount: 0,
    }
  }
  logs[msg.from].message.push(Date.now())
  logs[msg.from].messageCount += 1
  // reset message statistics if it is more than 2 days old
  if (Date.now() - logs[msg.from].message[0] > 86400000 * 2) logs[msg.from].message.shift()
})

command.functions("editMessage", async function (msg) {
  if (msg.type !== 'editedMessage') return
  const types = Object.keys(msg.message[msg.type].message)[0]
  const message = msg.message[msg.type].message[types][msg.type]
  let quoted
  if (quoted = message[Object.keys(message)]?.contextInfo?.quotedMessage) {
    quoted = { key: msg.key, message: quoted }
  }
  const userJid = conn.user.jid
	const messages = generateWAMessageFromContent(msg.from, message, { userJid, quoted })
	messages.key.fromMe = msg.fromMe
	messages.key.id = msg.key.id
	messages.pushName = msg.pushname
	if (msg.isGroup) messages.key.participant = messages.participant = msg.sender
	conn.ev.emit('messages.upsert', {
	  messages: [messages],
	  type: 'append'
	})
})

command.functions("clear", async function (msg) {
  const clear = setInterval(() => {
    const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
    if (currentTime === '00:00:00') {
      clearAllFiles("./src/tmp")
      clearInterval(clear)
    }
  }, 1000);
})