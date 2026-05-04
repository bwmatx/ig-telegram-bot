const puppeteer = require("puppeteer");

async function downloadWithBrowser(url) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  const page = await browser.newPage();
  // set viewport to be sure
  await page.setViewport({ width: 1280, height: 800 });

  try {
    const cleanUrl = url.split("?")[0];
    
    console.log("Mencoba SaveVid...");
    try {
      await page.goto("https://savevid.net/", { waitUntil: "networkidle2", timeout: 30000 });
      await page.waitForSelector('input#s_input');
      await page.type('input#s_input', cleanUrl);
      await page.click('button.btn-default');

      // Tunggu sampai hasil muncul (Thumbnail biasanya muncul duluan)
      await page.waitForSelector(".download-items", { timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000)); // Beri waktu tambahan agar item ter-render

      // Jika ada modal yang menutupi
      try {
        const closeBtn = await page.$(".modal-close, #dlModal .close, .btn-close, #closeModalBtn");
        if (closeBtn) {
          console.log("Menutup modal...");
          await closeBtn.click();
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (e) {}

      // Ambil link secara cerdas: satu link per blok item
      const links = await page.$$eval(".download-items .column, .download-items > div", (blocks) => {
        const result = [];
        blocks.forEach(block => {
          // Hanya proses blok yang berisi tombol download
          const videoBtn = block.querySelector('a[title="Download Video"], a[href*=".mp4"]');
          const photoBtn = block.querySelector('a[title="Download Photo"], a[title="Download Image"], a[href*=".jpg"], a[href*=".jpeg"]');
          
          if (videoBtn) {
            result.push(videoBtn.href);
          } else if (photoBtn) {
            result.push(photoBtn.href);
          }
        });
        return result;
      });
      
      await browser.close();
      
      // Hapus duplikat dan pastikan ada isinya
      const uniqueLinks = [...new Set(links)].filter(l => l && l.startsWith("http") && !l.includes("javascript"));
      console.log(`Berhasil mendapatkan ${uniqueLinks.length} item.`);
      return uniqueLinks;

    } catch (e) {
      console.log("SaveVid error atau timeout:", e.message);
      await browser.close();
      return [];
    }

  } catch (err) {
    console.log("Puppeteer error:", err.message);
    if (browser) await browser.close();
    return [];
  }
}

// TikTok downloader menggunakan tikwm.com API (tidak perlu Puppeteer)
const axios = require("axios");

async function downloadTikTok(url) {
  try {
    console.log("Mencoba TikWM API...");
    const cleanUrl = url.split("?")[0];

    const res = await axios.post(
      "https://www.tikwm.com/api/",
      new URLSearchParams({ url: cleanUrl, hd: 1 }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0"
        },
        timeout: 15000
      }
    );

    const data = res.data?.data;
    if (!data) {
      console.log("TikWM tidak mengembalikan data.");
      return [];
    }

    const results = [];

    // Cek apakah postingan foto/slide (images array)
    if (data.images && data.images.length > 0) {
      for (const imgUrl of data.images) {
        results.push({ url: imgUrl, type: "image" });
      }
    } else if (data.play) {
      // Video tanpa watermark
      results.push({ url: data.play, type: "video" });
    }

    console.log(`TikTok: Berhasil mendapatkan ${results.length} item.`);
    return results;

  } catch (err) {
    console.log("TikWM error:", err.message);
    return [];
  }
}

module.exports = { downloadWithBrowser, downloadTikTok };