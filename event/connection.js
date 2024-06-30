require('module-alias/register');
require('@utils/proto')
const {
  useMultiFileAuthState,
  DisconnectReason,
  makeInMemoryStore,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  proto,
  Browsers,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const Pino = require("pino");
const NodeCache = require("node-cache");
const fs = require("fs");
const path = require("path");
const { parsePhoneNumber } = require("libphonenumber-js");

const config = require("@config");
const { logger } = require("@utils/color");
const Command = require("@event/event");
const { serialize, MakeWaSocket } = require("@event/serialize");

// Initialize command
globalThis.command = new Command();

// External map to store retry counts of messages when decryption/encryption fails
const msgRetryCounterCache = new NodeCache();

// The store maintains the data of the WA connection in memory
const store = makeInMemoryStore({ logger: Pino({ level: "fatal" }).child({ level: "fatal" }) });

const start = {
  connect: async () => {
    logger.start();
    start.readCommand();

    let { version } = await fetchLatestBaileysVersion();
    let { state, saveCreds } = await useMultiFileAuthState(config.session);

    globalThis.conn = await MakeWaSocket(store, {
      logger: Pino({ level: "fatal" }).child({ level: "fatal" }),
      printQRInTerminal: false,
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
      },
      browser: Browsers.ubuntu("Chrome"),
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      retryRequestDelayMs: 10,
      transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 10 },
      maxMsgRetryCount: 15,
  		appStateMacVerification: {
  		  patch: true,
  			snapshot: true,
  		},
      getMessage: async (key) => {
        if (store) {
          let jid = jidNormalizedUser(key.remoteJid);
          let msg = await store.loadMessage(jid, key.id);
          return msg?.message || "";
        }
        return proto.Message.fromObject({});
      },
      defaultQueryTimeoutMs: undefined,
      msgRetryCounterCache,
    });

    // Pairing code for web clients
    if (!conn.authState.creds.registered) {
      let phoneNumber;
      if (config.bot.number) {
        phoneNumber = config.bot.number.replace(/[^0-9]/g, "");
        setTimeout(async () => {
          let code = await conn.requestPairingCode(phoneNumber);
          code = code?.match(/.{1,4}/g)?.join("-") || code;
          logger.info(`Your Pairing Code: ${code}`);
        }, 3000);
      }
    }

    // Connection update
    conn.ev.on('connection.update', async (update) => {
      const { lastDisconnect, connection } = update;
      switch (connection) {
        case 'connecting':
          logger.info('Connecting to server...');
          break;
        case 'open':
          logger.success('Bot connected successfully.');
          await start.event();
          break;
        case 'close':
          const disconnectError = new Boom(lastDisconnect?.error);
          const statusCode = disconnectError?.output?.statusCode;
          handleDisconnection(statusCode, disconnectError);
          break;
        default:
          break;
      }
    });

    function handleDisconnection(statusCode, disconnectError) {
      switch (statusCode) {
        case DisconnectReason.loggedOut:
          logger.error(`Device logged out. Please delete ${config.session} and scan again.`);
          process.exit(1);
          break;
        case DisconnectReason.timedOut:
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
          logger.error('Connection timed out or closed. Reconnecting...');
          process.send('reset');
          break;
        case DisconnectReason.multideviceMismatch:
          logger.error('Multi-device mismatch. Please scan again.');
          process.exit(0);
          break;
        case DisconnectReason.connectionReplaced:
          logger.error('Connection replaced. Another new session opened. Please close the current session first.');
          process.exit(1);
          break;
        case DisconnectReason.badSession:
          logger.error(`Bad session file. Please delete ${config.session} and scan again.`);
          process.send('reset');
          break;
        case DisconnectReason.restartRequired:
          logger.error('Restart required. Restarting...');
          process.send('reset');
          break;
        default:
          logger.error(`Unknown disconnect reason: ${statusCode} | ${disconnectError.message}`);
          process.send('reset');
          break;
      }
    }

    // Credentials update
    conn.ev.on("creds.update", async () => {
      await saveCreds();
    });

    // Bind store
    store.bind(conn.ev);
  },
  event: async () => {
    // Handle incoming messages
    conn.ev.on("messages.upsert", async ({ messages, type }) => {
      if (!messages[0].message) return;
      const msg = await serialize(messages[0], conn);
      require("@event/handler")(msg);
    });

    // Handle contacts update
    conn.ev.on('contacts.update', update => {
      for (let contact of update) {
        let id = jidNormalizedUser(contact.id);
        if (store && store.contacts) store.contacts[id] = { ...(store.contacts?.[id] || {}), ...(contact || {}) };
      }
    });

    // Handle contacts upsert
    conn.ev.on('contacts.upsert', update => {
      for (let contact of update) {
        let id = jidNormalizedUser(contact.id);
        if (store && store.contacts) store.contacts[id] = { ...(contact || {}), isContact: true };
      }
    });
    
    // Handle groups update
    conn.ev.on('groups.update', updates => {
  		for (const update of updates) {
  			const id = update.id;
  			if (store.groupMetadata[id]) store.groupMetadata[id] = { ...(store.groupMetadata[id] || {}), ...(update || {}) };
  		}
    });
  },
  readCommand: async () => {
    let commandFolder = path.resolve(__dirname, "..", "command");
    let commandFilter = (filename) => /\.js$/.test(filename);
    command.filename = {};
    for (let filename of fs.readdirSync(commandFolder).filter(commandFilter)) {
      try {
        command.filename[filename] = require(path.join(commandFolder, filename));
      } catch (e) {
        logger.error(e);
        delete command.filename[filename];
      }
    }
  },
  reloadCommand: async (_event, filename) => {
    let commandFolder = path.resolve(__dirname, '..', 'command');
    let commandFilter = (filename) => /\.js$/.test(filename);
    if (commandFilter(filename)) {
      let dir = path.join(commandFolder, filename);
      if (dir in require.cache) {
        delete require.cache[dir];
        if (fs.existsSync(dir)) {
          logger.info(`Re-require command '${filename}'`);
        } else {
          logger.warn(`Deleted command '${filename}'`);
          return delete command.filename[filename];
        }
      } else {
        logger.info(`Requiring new command '${filename}'`);
      }
      try {
        fs.readFileSync(dir, 'utf-8');
        command.filename[filename] = require(dir);
      } catch (e) {
        logger.error(`Error while loading '${filename}':\n${e}`);
      } finally {
        command.filename = Object.fromEntries(Object.entries(command.filename).sort(([a], [b]) => a.localeCompare(b)));
      }
    }
  },
};

// Start the connection
start.connect().catch((e) => logger.error(e));

// Reload file after save
Object.freeze(start.reloadCommand);
fs.watch(path.resolve(__dirname, "..", "command"), start.reloadCommand);

// ytta ygy uraaaa
for (let error of ['unhandledRejection', 'uncaughtException']) {
  process.on(error, function (err) {
    logger.error(err)
  })
}