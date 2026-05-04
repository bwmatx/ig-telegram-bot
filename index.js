require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const { downloadWithBrowser } = require("./services/browser");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// console.log("TOKEN:", process.env.BOT_TOKEN); // Removed for security
console.log("Bot berjalan...");

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  console.log("Pesan masuk:", text);

  // handle /start
  if (text === "/start") {
    return bot.sendMessage(chatId, "Kirim link Instagram");
  }

  // validasi link IG (lebih rapi)
  const isInstagramLink = /instagram\.com\/(reel|reels|p|stories|tv)/.test(text);
  if (!isInstagramLink) return;

  bot.sendMessage(chatId, "Sabar Cok!!!");

  try {
    const links = await downloadWithBrowser(text);

    console.log("Hasil links:", links);

    if (links.length === 0) {
      return bot.sendMessage(chatId, "Link tidak ditemukan");
    }

    const isReel = text.includes("/reel/") || text.includes("/reels/");
    const isPost = text.includes("/p/");
    const isStory = text.includes("/stories/");

    let successCount = 0;
    for (const videoUrl of links) {
      try {
        console.log("Mencoba download dari:", videoUrl);
        const response = await axios.get(videoUrl, {
          responseType: "stream",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            "Referer": "https://savevid.net/"
          },
          timeout: 60000
        });

        const contentType = response.headers["content-type"];
        console.log("Content-Type:", contentType);

        if (contentType && contentType.includes("video")) {
          await bot.sendVideo(chatId, response.data, {
            caption: isReel ? "Berhasil diunduh!" : undefined
          });
          successCount++;
          if (isReel) break; 
        } else if (contentType && contentType.includes("image")) {
          await bot.sendPhoto(chatId, response.data, {
            caption: isPost ? "Berhasil diunduh!" : undefined
          });
          successCount++;
        } else {
          await bot.sendDocument(chatId, response.data, {
            caption: "Berhasil diunduh!"
          });
          successCount++;
          if (isReel) break;
        }

      } catch (downloadErr) {
        console.error("Gagal download dari link ini, mencoba link berikutnya...", downloadErr.message);
        continue;
      }
    }

    if (successCount === 0) {
      bot.sendMessage(chatId, "Gagal mengunduh media dari semua link yang tersedia");
    } else if (isStory || isPost) {
      bot.sendMessage(chatId, `Berhasil mengunduh ${successCount} media!`);
    }

  } catch (err) {
    console.error("Error Detail:", err);
    let errorMsg = err.message;
    if (err.code === 'ENOTFOUND') {
        errorMsg = "Server download tidak dapat dijangkau (DNS Error). Coba lagi nanti atau gunakan link lain.";
    }
    bot.sendMessage(chatId, `Terjadi error: ${errorMsg}`);
  }
});