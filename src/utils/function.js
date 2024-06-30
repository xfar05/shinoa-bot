const axios = require("axios");
const util = require("util");
const fs = require("fs");
const path = require("path")
const config = require("@config");
const { logger } = require("@utils/color");

// Inspect object with full depth
exports.format = (...args) => util.inspect(...args, { depth: null });

// Check if a string is a valid URL
exports.isUrl = (url) => {
  return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.#?&/=]*)/, "gi"));
};

// Parse mentions in text
exports.parseMention = async (text) => {
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + "@s.whatsapp.net");
};

// Generate random path with optional extension
exports.generatePath = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext ? ext : ""}`;
};

// Asynchronous sleep function
exports.sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Format uptime in human-readable format
exports.runtime = async () => {
  const uptime = process.uptime();
  const date = new Date(uptime * 1000);
  const days = date.getUTCDate() - 1,
    hours = date.getUTCHours(),
    minutes = date.getUTCMinutes(),
    seconds = date.getUTCSeconds(),
    milliseconds = date.getUTCMilliseconds();
  let segments = [];
  if (days > 0) segments.push(days + " day");
  if (hours > 0) segments.push(hours + " hours");
  if (minutes > 0) segments.push(minutes + " minutes");
  if (seconds > 0) segments.push(seconds + " seconds");
  if (milliseconds > 0) segments.push(milliseconds + " milliseconds");
  return segments.join(", ");
};

// Clear all files in a directory
exports.clearAllFiles = (directory) => {
  try {
    fs.readdirSync(directory).forEach((file) => {
      const filePath = path.join(directory, file);
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    logger.error(error);
  }
};

// Fetch JSON data from URL
exports.fetchJson = async (url, options = {}) => {
  try {
    const response = await axios.get(url, {
      headers: {
        ...(options.headers || {})
      },
      responseType: "json",
      ...options
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching JSON: ${error}`);
    throw error;
  }
};

// Fetch plain text data from URL
exports.fetchText = async (url, options = {}) => {
  try {
    const response = await axios.get(url, {
      headers: {
        ...(options.headers || {})
      },
      responseType: "text",
      ...options
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching text: ${error}`);
    throw error;
  }
};

// Fetch binary data from URL
exports.fetchBuffer = async (url, options = {}) => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        ...(options.headers || {})
      },
      ...options
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching buffer: ${error}`);
    throw error;
  }
};

// Format JSON or object for display
exports.parseResult = async (title, data, option) => {
  let num = 1;
  const isArray = Array.isArray(data);
  let txt = `> \`${title}\`\n\n`;

  if (isArray) {
    for (let item of data) {
      if (option && option.delete) {
        option.delete.forEach((prop) => delete item[prop]);
      }
      if (option && option.no) {
        txt += `${config.style} *No* : ${num}\n`;
        num++;
      }
      for (let [key, value] of Object.entries(item)) {
        if (value !== undefined && value !== null && value !== "") {
          txt += `${config.style} ${key.replace(/\_/g, " ").toTitleCase().bold()} : ${value}\n`;
        }
      }
      if (data.indexOf(item) !== data.length - 1) {
        txt += "-----------------------------\n";
      }
    }
  } else {
    if (option && option.delete) {
      option.delete.forEach((prop) => delete data[prop]);
    }
    if (option && option.no) {
      txt += `${config.style} *No* : ${num}\n`;
      num++;
    }
    for (let [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== "") {
        txt += `${config.style} ${key.replace(/\_/g, " ").toTitleCase().bold()} : ${value}\n`;
      }
    }
  }

  txt += `\n> \`${config.bot.name}\``;
  return txt;
};