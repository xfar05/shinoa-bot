const { isUrl, fetchBuffer } = require("@utils/function")
const config = require("@config")

command.exec({
  name: "sticker",
  command: ["sticker","stiker","s"],
  category: "convert",
  description: "Create a sticker from image or video\n\nEnter code\n-corp\n-circle\n\nat the end of the sentence"
},
async function (msg) {
  const { from, text, quoted, isMedia, typeCheck } = msg
  if (typeCheck.isQuotedSticker){
    const query = text.split("|");
    const buffer = await quoted.download()
    await msg.reply(buffer, { asSticker: true, author: text ? query[1] ? query[1] : '' : config.packInfo.author, pack: text ? query[0] ? query[0] : '' : config.packInfo.packname })
  } else if (isMedia || quoted.isMedia){
    const buffer = quoted && quoted.isMedia ? await quoted.download() : isMedia ? await msg.download() : 'reply to a sticker or media'
    if (typeof buffer == 'string') return msg.reply(buffer)
    await msg.reply(buffer, { asSticker: true, author: config.packInfo.author, pack: config.packInfo.packname, circle: text.includes('-circle'), keepScale: text.includes('-crop') ? false : true })
  } else if (/(https?:\/\/.*\.(?:png|jpg|jpeg|webp|mov|mp4|webm))/i.test(text)) {
    const buffer = await fetchBuffer(isUrl(text)[0])
    await msg.reply(buffer, { asSticker: true, author: config.packInfo.author, pack: config.packInfo.packname, circle: text.includes('-circle'), keepScale: text.includes('-crop') ? false : true })
  } else {
    msg.reply('reply/send media to sticker')
  }
})