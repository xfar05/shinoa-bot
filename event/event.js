const config = require("@config");
const path = require("path");
const fs = require("fs");

/**
 * Command class to handle events and commands with options and execution functions.
 */
class Command {
  constructor() {
    this.event = {};
    this.function = {};
    this.prefix = /^[°•π÷×¶∆£¢€¥®™✓_|~!?@#%^&.\/\\©^]/;
    this.prefixEmoji = /\p{RGI_Emoji}/v;
  }

  /**
   * Registers an event with an execute function and options.
   * @param {Object} event - The event object with the name and command details.
   * @param {Function} [execute=() => {}] - The function to execute when the event is triggered.
   * @param {Object} [option={}] - Additional options for the event.
   */
  exec(event, execute = () => {}, option = {}) {
    if (!event.name || !event.command) {
        return;
    }
    if (!event.category) {
        const fileName = __filename.split('/').pop().replace('.js', '');
        event.category = fileName;
    }
    this.event[event.name] = { ...event, ...option, enable: true, execute };
  }


  /**
   * Handles incoming messages to check for registered events and executes them.
   * @param {Object} msg - The message object containing the command and other details.
   * @param {...any} args - Additional arguments for the execute function.
   * @returns {Promise<Object>} A promise that resolves to the event details or pass status.
   */
  handler(msg, ...args) {
    return new Promise(async (resolve, reject) => {
      let body = msg.command.toLowerCase();
      try {
        for (let eventName in this.event) {
          let { command: cmd, param, enable, execute, ...option } = this.event[eventName];
          let isCmd = cmd instanceof RegExp ? cmd.test(body) : Array.isArray(cmd) ? cmd.includes(body) : cmd === body;
          let isPrefEmojiCmd = this.prefixEmoji.exec(body);
          if (isCmd || isPrefEmojiCmd) {
            if (config.self && !msg.isOwner) return;
            else if (!msg.isOwner && option?.owner) return msg.reply(config.msg.owner);
            else if (!msg.isGroup && option?.group) return msg.reply(config.msg.group);
            else if (msg.isGroup && option?.private) return msg.reply(config.msg.private);
            else if (!msg.isAdmin && option?.admin) return msg.reply(config.msg.admin);
            else if (!msg.isBotAdmin && option?.botadmin) return msg.reply(config.msg.botadmin);
            else if (!msg.text.length > 0 && option?.query) return msg.reply(typeof option.query === "string" ? option.query : `Please fill in the ${param ? param : ""} parameters\nInstructions : ${msg.prefix}${body} ${param ? param : ""}`);
            else if (!msg.quoted && option?.quoted) return msg.reply("Please reply message...");
            else if (typeof option?.wait === "string" || option?.wait) await msg.reply(typeof option?.wait === "string" ? option.wait : config.msg.wait);
            if (enable) {
              resolve({ pass: true, known: true, name: eventName, data: this.event[eventName] });
              execute.call(this, ...args);
            }
            return;
          }
        }
      } catch (e) {
        reject(e)
      }
      if (this.prefix.test(body) || this.prefixEmoji.test(body)) resolve({ pass: true, known: false });
      else resolve({ pass: false, known: false });
    });
  }

  /**
   * Registers a function to be executed for a specific event name.
   * @param {string} eventName - The name of the event.
   * @param {Function} [execute=() => {}] - The function to execute.
   * @param {Object} [option={}] - Additional options for the function.
   */
  functions(eventName, execute = () => {}, option = {}) {
    if (!eventName) {
        return;
    }
    this.function[eventName] = { eventName, execute, ...option };
  }

  /**
   * Handles functions execution.
   * @param {...any} args - Arguments for the function execution.
   * @returns {Promise<void>} A promise that resolves when all functions have been executed.
   */
  handlerF(...args) {
    return new Promise(async (resolve, reject) => {
      for (let eventName in this.function) {
        try {
          let { execute } = this.function[eventName];
          execute.call(this, ...args);
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  /**
   * Enables or disables a specific event.
   * @param {string} [name=""] - The name of the event.
   * @param {boolean} [bool=true] - The boolean value to enable or disable the event.
   * @returns {boolean} The updated enable status of the event.
   */
  enable(name = "", bool = true) {
    if (!this.event[name]) return false;
    else this.event[name].enabled = bool;
    return bool;
  }
}

module.exports = Command;