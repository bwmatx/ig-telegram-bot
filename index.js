require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const { downloadWithBrowser } = require("./services/browser");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// console.log("TOKEN:", process.env.BOT_TOKEN); // Removed for security
console.log("Bot berjalan...");

const mediaCache = {};

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith("slide_")) {
    const parts = data.split("_");
    const cacheId = parts[1];
    const index = parts[2];

    const cache = mediaCache[cacheId];
    if (!cache) {
      return bot.sendMessage(chatId, "Cache sudah kadaluarsa. Silakan kirim link lagi.");
    }

    bot.answerCallbackQuery(query.id, { text: "Memproses..." });

    if (index === "all") {
      await sendMediaLinks(chatId, cache.links, cache.url);
    } else {
      const selectedIndex = parseInt(index);
      await sendMediaLinks(chatId, [cache.links[selectedIndex]], cache.url);
    }
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;
  console.log("Pesan masuk:", text);

  // handle /start
  if (text === "/start") {
    return bot.sendMessage(chatId, "Kirim link Instagram langsung ya");
  }

  // validasi link IG
  const isInstagramLink = /instagram\.com\/(reel|reels|p|stories|tv)/.test(text);
  if (!isInstagramLink) return;

  bot.sendMessage(chatId, "Sabar Cok!!!");

  try {
    const links = await downloadWithBrowser(text);
    console.log("Hasil links:", links);

    if (links.length === 0) {
      return bot.sendMessage(chatId, "Link tidak ditemukan");
    }

    if (links.length > 1) {
      const cacheId = Math.random().toString(36).substring(7);
      mediaCache[cacheId] = { links, url: text };

      // Buat tombol slide
      const buttons = [];
      for (let i = 0; i < links.length; i++) {
        buttons.push({ text: `Slide ${i + 1}`, callback_data: `slide_${cacheId}_${i}` });
      }
      
      // Susun tombol (maks 3 per baris)
      const rows = [];
      for (let i = 0; i < buttons.length; i += 3) {
        rows.push(buttons.slice(i, i + 3));
      }
      rows.push([{ text: "Download Semua", callback_data: `slide_${cacheId}_all` }]);

      return bot.sendMessage(chatId, `Ditemukan ${links.length} media. Mau download yang mana?`, {
        reply_markup: { inline_keyboard: rows }
      });
    } else {
      await sendMediaLinks(chatId, links, text);
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

// Helper function untuk mengirim media
async function sendMediaLinks(chatId, links, originalText) {
    const isReel = originalText.includes("/reel/") || originalText.includes("/reels/");
    const isPost = originalText.includes("/p/");
    const isStory = originalText.includes("/stories/");

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
        if (contentType && contentType.includes("video")) {
          await bot.sendVideo(chatId, response.data);
          successCount++;
          if (isReel) break; 
        } else if (contentType && contentType.includes("image")) {
          await bot.sendPhoto(chatId, response.data);
          successCount++;
        } else {
          await bot.sendDocument(chatId, response.data);
          successCount++;
          if (isReel) break;
        }
      } catch (e) {
        console.error("Download link error:", e.message);
      }
    }

    if (successCount === 0) {
      bot.sendMessage(chatId, "Gagal mengunduh media");
    }
}