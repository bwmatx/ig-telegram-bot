require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const { downloadWithBrowser } = require("./services/browser");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log("TOKEN:", process.env.BOT_TOKEN);
console.log("Bot berjalan... 🚀");

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  console.log("Pesan masuk:", text);

  // handle /start
  if (text === "/start") {
    return bot.sendMessage(chatId, "Kirim link Instagram langsung ya 🚀");
  }

  // validasi link IG (lebih rapi)
  const isInstagramLink = /instagram\.com\/(reel|p|stories)/.test(text);
  if (!isInstagramLink) return;

  bot.sendMessage(chatId, "⏳ Sedang diproses...");

  try {
    const links = await downloadWithBrowser(text);

    console.log("Hasil links:", links);

    if (links.length === 0) {
      return bot.sendMessage(chatId, "Link tidak ditemukan 😢");
    }

    const videoUrl = links[0];

    const response = await axios.get(videoUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    await bot.sendVideo(chatId, response.data);

  } catch (err) {
    console.log("Error:", err.message);
    bot.sendMessage(chatId, "Terjadi error 😢");
  }
});