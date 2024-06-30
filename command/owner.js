const { exec } = require('child_process')
const util = require("util")
const config = require("@config")

command.exec({
  name: "restart",
  command: ["restart"],
  category: "owner",
  description: "restarting bot",
}, async function (msg) {
    await msg.reply('~ restarting bot')
    process.send('reset')
 },{ owner: true })
 
command.exec({
   name: "evaluated",
   command: ['>','=>','$'], 
   category: 'hidden',
   param: '<code>', 
   description: 'Execute code',
}, async function (msg) {
  try {
    if (msg.command == '>') {
      let evaled = await eval(msg.text)
      if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
      await msg.reply(evaled)
    } else if (msg.command == '=>') {
      let evaled = await eval(`(async () => { ${msg.text} })()`)
      if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
      await msg.reply(evaled)
    } else if (msg.command == '$') {
      if (!msg.text) return msg.reply('Include a code for the terminal !')
      exec(msg.text, async (err, stdout) => {
        if (err) return msg.reply(util.format(err))
        await msg.reply(stdout)
      })
    }
  } catch(e) {
    msg.reply(util.format(e))
  }
},{
  owner:true
})

command.exec({
  name: "mode",
  command: ["self","public"],
  category: "hidden",
  description: 'To change the Bot Only Owner & Bot or public mode for the user',
}, async function (msg) {
  if (msg.command == 'self'){
    if (config.self === true) return msg.reply('Self Mode has been active before')
    config.self = true
    await msg.reply('~ Self mode active')
  } else if (msg.command == 'public'){
    if (config.self === false) return msg.reply('Public Mode has been active before')
    config.self = false 
    await msg.reply('~ Public mode active')
  }
},{
  owner: true
})