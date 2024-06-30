const { default: makeWaSocket, proto, downloadContentFromMessage, getContentType, jidDecode } = require("@whiskeysockets/baileys");
const fs = require("fs");
const FileType = require("file-type");
const { fetchBuffer, parseMention } = require("@utils/function")
const { makeSticker } = require("@utils/sticker")
const config = require("@config");

/**
 * Creates a new WhatsApp socket instance with additional utility methods.
 * @param {Object} store - The store object used for managing contacts and messages.
 * @param {...any} args - Additional arguments for the makeWaSocket function.
 * @returns {Promise<Object>} A promise that resolves to the WhatsApp socket instance.
 */
async function MakeWaSocket(store, ...args) {
  let sock = await makeWaSocket(...args);
  
  // The store maintains the data of the WA connection in memory
  sock.store = store
  
  /**
   * Decodes a JID (Jabber ID).
   * @param {string} jid - The JID to decode.
   * @returns {string} The decoded JID.
   */
  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  /**
   * Converts a path to a buffer.
   * @param {string|Buffer} PATH - The path to the file or a buffer.
   * @returns {Promise<Object>} A promise that resolves to an object containing the buffer, MIME type, and extension.
   */
  sock.toBuffer = async (PATH) => {
    if (!PATH) return { buffer: Buffer.alloc(0), ext: "png", mimetype: "image/png" };
    const buffer = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split(`,`)[1], "base64") : /^https?:\/\//.test(PATH) ? await fetchBuffer(PATH) : fs.existsSync(PATH) ? fs.readFileSync(PATH) : Buffer.alloc(0);
    if (!Buffer.isBuffer(buffer)) throw new Error("Result is not a buffer");
    const file = await FileType.fromBuffer(buffer);
    const fixbuffer = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
    if (!file) throw new Error("Invalid file type");
    return { buffer: fixbuffer, mime: file.mime, ext: file.ext };
  };

  /**
   * Sends a file to a WhatsApp contact or group.
   * @param {string} from - The JID of the recipient.
   * @param {string|Buffer} file - The path to the file or a buffer.
   * @param {Object} quoted - The quoted message object.
   * @param {Object} opt1 - Additional options for the message content.
   * @param {Object} opt2 - Additional options for the message.
   * @returns {Promise<Object>} A promise that resolves to the message object.
   */
  sock.sendFile = async (from, file, quoted, opt1 = {}, opt2 = {}) => {
    const { buffer, mime, ext } = await sock.toBuffer(file);
    let content;
    if (mime.split("/")[1] === "webp") content = { sticker: buffer, ...opt1 };
    else if (mime.split("/")[0] === "image") content = { image: buffer, ...opt1 };
    else if (mime.split("/")[0] === "video") content = { video: buffer, ...opt1 };
    else if (mime.split("/")[0] === "audio") content = { audio: buffer, mimetype: mime, ...opt1 };
    else if (mime.split("/")[0] === "application") content = { document: buffer, mimetype: mime, ...opt1 };
    else throw new Error("Invalid mimetype");
    return await sock.sendMessage(from, content, { quoted, ...opt2 });
  };

  /**
   * Downloads media from a message.
   * @param {Object} message - The message object containing the media.
   * @param {string} [pathFile] - The path to save the downloaded media.
   * @returns {Promise<Buffer|string>} A promise that resolves to the buffer or file path.
   */
  sock.downloadMedia = (message, pathFile) => {
    return new Promise(async (resolve, reject) => {
      const type = Object.keys(message)[0];
      const mimeMap = {
        imageMessage: "image",
        videoMessage: "video",
        stickerMessage: "sticker",
        documentMessage: "document",
        audioMessage: "audio",
      };
      if (!mimeMap[type]) {
        reject("Invalid message type");
        return;
      }
      const messageType = mimeMap[type];
      const stream = await downloadContentFromMessage(message[type], messageType);
      const buffer = [];
      for await (const chunk of stream) {
        buffer.push(chunk);
      }
      if (pathFile) {
        try {
          await fs.promises.writeFile(pathFile, Buffer.concat(buffer));
          resolve(pathFile);
        } catch (error) {
          reject(error);
        }
      } else {
        resolve(Buffer.concat(buffer));
      }
    });
  };

  /**
   * Sends a contact card to a WhatsApp contact or group.
   * @param {string} jid - The JID of the recipient.
   * @param {Array<string|number>} contact - An array of contacts to send.
   * @param {Object} [quoted=false] - The quoted message object.
   * @param {Object} [opts={}] - Additional options for the message.
   * @returns {Promise<Object>} A promise that resolves to the message object.
   */
  sock.sendContact = async (jid, contact, quoted = false, opts = {}) => {
    let list = [];
    for (let i of contact) {
      let num = typeof i === "number" ? i + "@s.whatsapp.net" : i;
      let num2 = typeof i === "number" ? i : i.split("@")[0];
      list.push({ displayName: await sock.getName(num), vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${await sock.getName(num)}\nFN:${await sock.getName(num)}\nitem1.TEL;waid=${num2}:${num2}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` });
    }
    return sock.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list } }, { quoted, ...opts });
  };

  /**
   * Retrieves the name of a contact or group.
   * @param {string} jid - The JID of the contact or group.
   * @param {boolean} [withoutContact=false] - Whether to exclude the contact name.
   * @returns {Promise<string>} A promise that resolves to the name of the contact or group.
   */
  sock.getName = (jid, withoutContact = false) => {
    let id = sock.decodeJid(jid);
    withoutContact = sock.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = await sock.groupMetadata(id) || {};
        resolve(v.name || v.subject || require("awesome-phonenumber")("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
      });
    else v = id === "0@s.whatsapp.net" ? { id, name: "WhatsApp" } : id === sock.decodeJid(sock.user.id) ? sock.user : store.contacts[id] || {};
    return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || "+" + jid.replace("@s.whatsapp.net", "");
  };

  return sock;
}

/**
 * Serializes a message for easier handling.
 * @param {Object} msg - The message object to serialize.
 * @returns {Promise<Object>} A promise that resolves to the serialized message object.
 */
async function serialize(msg) {
  if (msg.key) {
    msg.id = msg.key.id;
    msg.isBaileys = msg.id.startsWith("3EB0") && msg.id.length === 22;
    msg.from = msg.key.remoteJid;
    msg.fromMe = msg.key.fromMe;
    msg.isGroup = msg.from.endsWith("@g.us");
    msg.pushname = msg.pushName;
    msg.sender = msg.isGroup ? conn.decodeJid(msg.key.participant) : msg.fromMe ? conn.decodeJid(conn.user.id) : msg.from;
  }
  msg.botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
  if (msg.message) {
    msg.type = getContentType(msg.message);
    if (["ephemeralMessage", "viewOnceMessage"].includes(msg.type)) {
      msg.message = msg.message[msg.type].message;
      msg.type = getContentType(msg.message);
    }
    msg.body = msg.message?.conversation || msg.message[msg.type]?.text || msg.message[msg.type]?.caption || (msg.type === "listResponseMessage" && msg.message[msg.type]?.singleSelectReply?.selectedRowId) || (msg.type === "buttonsResponseMessage" && msg.message[msg.type]?.selectedButtonId) || (msg.type === "templateButtonReplyMessage" && msg.message[msg.type]?.selectedId) || (msg.type === "interactiveResponseMessage" && JSON.parse(msg.message[msg.type]?.nativeFlowResponseMessage?.paramsJson).id) || "";
    msg.prefix = "";
    const symbolPrefix = command.prefix.exec(msg.body);
    const emojiPrefix = command.prefixEmoji.exec(msg.body);
    if (symbolPrefix) {
      msg.prefix = symbolPrefix[0];
    } else if (emojiPrefix) {
      msg.prefix = emojiPrefix[0];
    }
    msg.args = msg.body.replaceAll(msg.prefix, "").split(" ");
    if (msg.args[0] === "") msg.args.shift();
    msg.command = msg.args.shift() || "";
    msg.text = msg.args.join(" ");
    msg.mentions = msg.message[msg.type]?.contextInfo?.mentionedJid || [];
    msg.expiration = msg.message[msg.type]?.contextInfo?.expiration || 0;
    msg.timestamps = typeof msg.messageTimestamp === 'number' ? msg.messageTimestamp * 1000 : msg.message[msg.type]?.timestampMs * 1000;
    msg.isCmd = msg.body.startsWith(msg.prefix);
  }

  let quoted = (msg.quoted = msg?.message[msg.type]?.contextInfo ? msg?.message[msg.type]?.contextInfo?.quotedMessage : false);
  if (msg.quoted) {
    msg.quoted.type = getContentType(msg.quoted);
    msg.quoted.id = msg.message[msg.type].contextInfo.stanzaId;
    msg.quoted.isBaileys = msg.quoted.id ? msg.quoted.id.startsWith("3EB0") && msg.quoted.id.length === 22 : false;
    msg.quoted.sender = conn.decodeJid(msg.message[msg.type]?.contextInfo?.participant);
    msg.quoted.fromMe = msg.quoted.sender === msg.botNumber;
    msg.quoted.message = msg.message[msg.type]?.contextInfo?.quotedMessage;
    msg.quoted.text = msg.quoted.message[msg.quoted.type]?.text || msg.quoted.message[msg.quoted.type]?.description || msg.quoted.message[msg.quoted.type]?.caption || msg.quoted.message[msg.quoted.type]?.hydratedTemplate?.hydratedContentText || msg.quoted.message[msg.quoted.type] || "";
    msg.quoted.key = {
      id: msg.quoted.id,
      fromMe: msg.quoted.fromMe,
      remoteJid: msg.from,
    };
    msg.quoted.delete = () => conn.sendMessage(msg.from, { delete: { fromMe: msg.quoted.key.fromMe, id: msg.quoted.id, remoteJid: msg.from, participant: msg.quoted.sender } });
    msg.quoted.edit = (text) => conn.sendMessage(msg.from, { edit: msg.quoted.key, text });
    msg.quoted.download = (filename) => conn.downloadMedia(msg.quoted.message, filename);
  } else {
    msg.quoted = false;
  }

  if (msg.type) {
    msg.typeCheck = {};
    msg.typeCheck.isImage = msg.type === "imageMessage";
    msg.typeCheck.isVideo = msg.type === "videoMessage";
    msg.typeCheck.isAudio = msg.type === "audioMessage";
    msg.typeCheck.isSticker = msg.type === "stickerMessage";
    msg.typeCheck.isDocument = msg.type === "documentMessage";
    msg.typeCheck.isContact = msg.type === "contactMessage";
    msg.typeCheck.isLocation = msg.type === "locationMessage";
    if (msg.quoted) {
      msg.typeCheck.isQuotedImage = msg.quoted.type === "imageMessage";
      msg.typeCheck.isQuotedVideo = msg.quoted.type === "videoMessage";
      msg.typeCheck.isQuotedAudio = msg.quoted.type === "audioMessage";
      msg.typeCheck.isQuotedSticker = msg.quoted.type === "stickerMessage";
      msg.typeCheck.isQuotedProduct = msg.quoted.type === "productMessage";
      msg.typeCheck.isQuotedDocument = msg.quoted.type === "documentMessage";
      msg.typeCheck.isQuotedContact = msg.quoted.type === "contactMessage";
      msg.typeCheck.isQuotedLocation = msg.quoted.type === "locationMessage";
    }
  }

  msg.isMedia = msg.typeCheck?.isImage || msg.typeCheck?.isVideo || msg.typeCheck?.isSticker;
  msg.quoted.isMedia = msg.typeCheck?.isQuotedImage || msg.typeCheck?.isQuotedVideo || msg.typeCheck?.isQuotedSticker || msg.typeCheck?.isQuotedProduct;

  msg.groupMetadata = msg.isGroup ? await conn.groupMetadata(msg.from) : null;
  msg.groupName = msg.isGroup ? msg.groupMetadata.subject : null;
  msg.admin = msg.isGroup ? msg.groupMetadata.participants.filter((adm) => adm.admin != null).map((adm) => adm.id) : null;
  msg.isOwner = (msg.sender ? config.owner.number.includes(msg.sender) || msg.botNumber.includes(msg.sender) : false) || false;
  msg.isAdmin = msg.isGroup ? msg.admin.includes(msg.sender) || msg.isOwner : false;
  msg.isBotAdmin = msg.isGroup ? msg.admin.includes(msg.botNumber) : false;

  msg.delete = () => conn.sendMessage(msg.from, { delete: { fromMe: msg.key.fromMe, id: msg.key.id, remoteJid: msg.from, participant: msg.sender } });
  msg.download = (filename) => conn.downloadMedia(msg.message, filename);
  msg.edit = (text) => conn.sendMessage(msg.from, { edit: msg.key, text });
  msg.reply = async (message, opt1 = {}, opt2 = {}) => {
    const prepared = typeof message === "string" ? { text: require("util").format(message) } : message;
    const mentions = opt1.withTag ? (opt1.caption ? parseMention(opt1.caption) : (message ? parseMention(message) : [])) : [];
    if (msg.key.fromMe && opt1.isEdit) {
      return await msg.edit(prepared);
    } else if (Buffer.isBuffer(message) && opt1.asSticker) {
      const sticker = await makeSticker(message, { author: opt1.author || config.packInfo.author, pack: opt1.pack || config.packInfo.packname, circle: opt1.circle || false, keepScale: opt1.keepScale || true })
      return conn.sendFile(opt1.from || msg.from, sticker, opt2.quoted || msg, { ...opt1 }, { ephemeralExpiration: msg.expiration, ...opt2 })
    } else if (Buffer.isBuffer(message)) {
      return conn.sendFile(opt1.from || msg.from, message, opt2.quoted || msg, { mentions, ...opt1 }, { ephemeralExpiration: msg.expiration, ...opt2 });
    }
    return await conn.sendMessage(opt1.from || msg.from, { ...prepared, mentions: opt1.mentions || mentions, ...opt1 }, { quoted: opt2.quoted || msg, ephemeralExpiration: msg.expiration, ...opt2 });
  };
  return msg;
}

module.exports = { serialize, MakeWaSocket };