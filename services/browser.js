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
      const links = await page.$$eval("a", (els) => 
        els.map(e => e.href).filter(h => h && h.includes("cdn"))
      );
      
      await browser.close();
      
      // Kembalikan link unik
      return [...new Set(links)];

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