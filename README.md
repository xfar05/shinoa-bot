<div align="center">

<img src="https://cdn.sazumi.moe/file/wlozpj.jpg" border="0" alt="shinoa">

## Shinoa Bot
</div>

This project is a simple WhatsApp bot that uses the Baileys library, Node.js, and JavaScript with type cjs Event emitter.

[![JavaScript](https://img.shields.io/badge/JavaScript-d6cc0f?style=for-the-badge&logo=javascript&logoColor=white)](https://javascript.com) [![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

## Prerequisites

<!-- Installation -->
<b><details><summary>Windows</summary></b>  
<b>Requirements:</b>
* Git [`Click here`](https://git-scm.com/downloads)
* NodeJS [`Click here`](https://nodejs.org/en/download)
* FFmpeg [`Click here`](https://ffmpeg.org/download.html) (opsional)
 
```bash
Add to PATH environment variable
```
</details>

<b><details><summary>Linux</summary></b>
```bash
1. apt update && apt upgrade
2. apt install nodejs -y
3. apt install git -y
4. apt install ffmpeg -y (opsional)
```

<b>Install nvm for custom nodejs version:</b>
```bash
1. curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
2. source ~/.bashrc
3. nvm install node
```
</details>

<b><details><summary>Termux</summary></b>
```bash
1. pkg update && pkg upgrade
2. pkg install nodejs -y
3. pkg install git -y
4. pkg install ffmpeg -y (opsional)
```
</details>

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/xfar05/shinoa-bot.git
    cd shinoa-bot
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Start the bot:

    ```bash
    npm start
    or
    node index.js
    ```

4. Enter your pairing code into the WhatsApp linked device.

## Function/Command Config
- You can see the example command code here [show](https://github.com/xfar05/shinoa-bot/blob/main/command/general.js)
```js
command.exec({
  name: String[],
  command: String[],
  category: String[],
  param: String,
  description: String,
}, async function (msg) {
  // your code
}, {
  owner: Boolean,
  group: Boolean,
  private: Boolean,
  admin: Boolean,
  botadmin: Boolean,
  quoted: Boolean,
  wait: Boolean || String,
  query: Boolean || String,
})
```
- You can see the example function code here [show](https://github.com/xfar05/shinoa-bot/blob/main/command/_function.js)
```js
command.functions(String, async function(msg) {
// your code
})
```

## Usage

- The bot will automatically respond to messages with predetermined replies with prefix symbols, emojis, or without prefixes.
- Configuration file [config](https://github.com/xfar05/shinoa-bot/blob/main/config.js)
- You can customize the bot's response in the [command](https://github.com/xfar05/shinoa-bot/blob/command) file.


## Contributing
Pull requests are welcome. Your contribution is helping me a lot :^)

## Contributors
<a href="https://github.com/xfar05/shinoa-bot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=xfar05/shinoa-bot" />
</a>

Made with [contrib.rocks](https://contrib.rocks).


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
