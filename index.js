require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const { downloadWithBrowser } = require("./services/browser");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// console.log("TOKEN:", process.env.BOT_TOKEN); // Removed for security
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
  const isInstagramLink = /instagram\.com\/(reel|reels|p|stories|tv)/.test(text);
  if (!isInstagramLink) return;

  bot.sendMessage(chatId, "Sabar Cok!!!");

  try {
    const links = await downloadWithBrowser(text);

    console.log("Hasil links:", links);

    if (links.length === 0) {
      return bot.sendMessage(chatId, "Link tidak ditemukan 😢");
    }

    // Coba urutkan link agar video didahulukan jika itu Reel
    let sortedLinks = [...links];
    const isReel = text.includes("/reel/") || text.includes("/reels/");
    const isPost = text.includes("/p/");
    const isStory = text.includes("/stories/");

    if (isReel) {
      // Prioritaskan link yang mengandung .mp4 atau video
      sortedLinks.sort((a, b) => {
        const aIsVideo = a.includes(".mp4") || a.includes("video");
        const bIsVideo = b.includes(".mp4") || b.includes("video");
        return bIsVideo - aIsVideo;
      });
    } else if (isPost) {
      // Prioritaskan link yang mengandung .jpg/.png atau image
      sortedLinks.sort((a, b) => {
        const aIsImage = a.includes(".jpg") || a.includes(".jpeg") || a.includes("image");
        const bIsImage = b.includes(".jpg") || b.includes(".jpeg") || b.includes("image");
        return bIsImage - aIsImage;
      });
    }

    let success = false;
    for (const videoUrl of sortedLinks) {
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
            caption: "Berhasil diunduh! 🚀"
          });
          success = true;
          break;
        } else if (contentType && contentType.includes("image")) {
          // Jika ini Reel tapi kita malah dapet gambar, coba cari link lain dulu
          if (isReel && sortedLinks.length > 1 && !videoUrl.includes(".mp4")) {
            console.log("Dapat gambar untuk Reel, mencoba link lain untuk mencari video...");
            continue; 
          }
          await bot.sendPhoto(chatId, response.data, {
            caption: "Berhasil diunduh! 🚀"
          });
          success = true;
          break;
        } else {
          await bot.sendDocument(chatId, response.data, {
            caption: "Berhasil diunduh! (Dokumen) 🚀"
          });
          success = true;
          break;
        }

      } catch (downloadErr) {
        console.error("Gagal download dari link ini, mencoba link berikutnya...", downloadErr.message);
        continue;
      }
    }

    if (!success) {
      bot.sendMessage(chatId, "Gagal mengunduh media dari semua link yang tersedia 😢");
    }

  } catch (err) {
    console.error("Error Detail:", err);
    let errorMsg = err.message;
    if (err.code === 'ENOTFOUND') {
        errorMsg = "Server download tidak dapat dijangkau (DNS Error). Coba lagi nanti atau gunakan link lain.";
    }
    bot.sendMessage(chatId, `Terjadi error: ${errorMsg} 😢`);
  }
});