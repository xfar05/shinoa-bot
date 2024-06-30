const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let isRunning = false;

/**
 * Starts a child process to run the specified file.
 * 
 * @param {string} file - The path to the file to be executed.
 */
function start(file) {
  if (isRunning) return;
  isRunning = true;

  const scriptPath = path.join(__dirname, file);
  const args = [scriptPath, ...process.argv.slice(2)];
  
  const childProcess = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  });

  childProcess.on('message', (data) => {
    console.log('[RECEIVED]', data);
    handleChildMessage(data, file, childProcess);
  });

  childProcess.on('exit', (code) => {
    isRunning = false;
    handleChildExit(code, scriptPath, file);
  });
}

/**
 * Handles messages received from the child process.
 * 
 * @param {any} data - The data received from the child process.
 * @param {string} file - The path to the file to be executed.
 * @param {ChildProcess} childProcess - The child process instance.
 */
function handleChildMessage(data, file, childProcess) {
  switch (data) {
    case 'reset':
      childProcess.kill();
      isRunning = false;
      start(file);
      break;
    case 'uptime':
      childProcess.send(process.uptime());
      break;
    default:
      console.warn('Unknown message:', data);
  }
}

/**
 * Handles the exit event of the child process.
 * 
 * @param {number} code - The exit code of the child process.
 * @param {string} scriptPath - The path to the script being watched.
 * @param {string} file - The path to the file to be executed.
 */
function handleChildExit(code, scriptPath, file) {
  console.error('Child process exited with code:', code);

  if (code === 0) return;

  fs.watchFile(scriptPath, () => {
    fs.unwatchFile(scriptPath);
    start(file);
  });
}

// Start the process with the specified file
start('./event/connection.js');