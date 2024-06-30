// Define color function to format text with ANSI color codes
function color(text, color) {
  const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m"
  };

  if (!color) {
    return colors.green + text + colors.reset;
  } else if (color.startsWith('#')) {
    // Handling hex colors (not natively supported by ANSI)
    return text;
  } else {
    return colors[color] + text + colors.reset;
  }
}

// Define function to print colored ASCII art with RGB colors
function printColoredAscii(ascii) {
  const resetColor = '\x1b[0m';
  const lines = ascii.split('\n');

  lines.forEach(line => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const color = `\x1b[38;2;${r};${g};${b}m`;
    console.log(color + line + resetColor);
  });
}

// https://fsymbols.com/generators/carty/
// ASCII art to be printed
const asciiArt = `
▒█▀▀▀█ ▒█░▒█ ▀█▀ ▒█▄░▒█ ▒█▀▀▀█ ░█▀▀█ 
░▀▀▀▄▄ ▒█▀▀█ ▒█░ ▒█▒█▒█ ▒█░░▒█ ▒█▄▄█ 
▒█▄▄▄█ ▒█░▒█ ▄█▄ ▒█░░▀█ ▒█▄▄▄█ ▒█░▒█`;

// Logger class with various logging levels
class Logger {
  info(...args) {
    console.log(color('[ INFO ]', 'green'), ...args);
  }

  warn(...args) {
    console.log(color('[ WARNING ]', 'yellow'), ...args);
  }

  register(...args) {
    console.log(color('[ REGISTER CMD ]', 'blue'), ...args);
  }
  
  run(...args) {
    console.log(color('[ RUNNING ]', 'cyan'), ...args);
  }

  success(...args) {
    console.log(color('[ SUCCESS ]', 'green'), ...args);
  }

  error(...args) {
    console.log(color('[ ERROR ]', 'red'), ...args);
  }

  // Start function to clear the console and print the ASCII art
  start() {
    console.clear();
    printColoredAscii(asciiArt);
  }
}

module.exports = {
  color,
  logger: new Logger(),
  printColoredAscii,
  asciiArt
};