const puppeteer = require("puppeteer");

async function downloadWithBrowser(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
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

      // Tunggu sampai hasil muncul
      await page.waitForSelector(".download-items", { timeout: 15000 });
      
      // Ambil link secara cerdas: satu link per blok item
      const links = await page.$$eval(".download-items .col-md-4, .download-items .col-sm-6, .download-items .col-xs-12", (blocks) => {
        const result = [];
        blocks.forEach(block => {
          const videoBtn = block.querySelector('a[title="Download Video"]');
          const photoBtn = block.querySelector('a[title="Download Photo"], a[title="Download Image"]');
          const thumbnailBtn = block.querySelector('a[title="Download Thumbnail"]');
          
          if (videoBtn) {
            result.push(videoBtn.href);
          } else if (photoBtn) {
            result.push(photoBtn.href);
          } else if (thumbnailBtn) {
            // Fallback jika hanya ada thumbnail (jarang terjadi untuk postingan murni foto)
            result.push(thumbnailBtn.href);
          }
        });
        return result;
      });
      
      await browser.close();
      
      // Hapus duplikat dan pastikan ada isinya
      const uniqueLinks = [...new Set(links)].filter(l => l);
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

module.exports = { downloadWithBrowser };