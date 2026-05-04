require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error("ERROR: BOT_TOKEN tidak ditemukan di .env");
    process.exit(1);
}

const bot = new TelegramBot(token);

async function testConnection() {
    try {
        const me = await bot.getMe();
        console.log("Koneksi Berhasil! ✅");
        console.log("Nama Bot:", me.first_name);
        console.log("Username Bot: @", me.username);
        process.exit(0);
    } catch (err) {
        console.error("Koneksi Gagal! ❌");
        console.error("Error Detail:", err.message);
        process.exit(1);
    }
}

testConnection();
