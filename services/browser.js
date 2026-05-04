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
    
    // TRY PROVIDER 1: SnapSave
    console.log("Trying SnapSave...");
    await page.goto("https://snapsave.app/id", { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector('input[name="url"]');
    await page.type('input[name="url"]', cleanUrl);
    await page.click('button[type="submit"]');

    try {
      await page.waitForSelector(".download-items", { timeout: 10000 });
      const links = await page.$$eval("a", (els) => 
        els.map(e => e.href).filter(h => h && (h.includes("cdn") || h.includes("snapdownloader")))
      );
      if (links.length > 0) {
        console.log("SnapSave success");
        await browser.close();
        return links;
      }
    } catch (e) {
      console.log("SnapSave failed or timeout, trying next...");
    }

    // TRY PROVIDER 2: SaveVid (successor to SaveIG)
    console.log("Trying SaveVid...");
    await page.goto("https://savevid.net/", { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector('input#s_input');
    await page.type('input#s_input', cleanUrl);
    await page.click('button.btn-default');

    try {
      await page.waitForSelector(".download-items", { timeout: 10000 });
      const links = await page.$$eval("a", (els) => 
        els.map(e => e.href).filter(h => h && h.includes("cdn"))
      );
      if (links.length > 0) {
        console.log("SaveVid success");
        await browser.close();
        return links;
      }
    } catch (e) {
      console.log("SaveVid failed or timeout");
    }

    await browser.close();
    return [];

  } catch (err) {
    console.log("Puppeteer error:", err.message);
    if (browser) await browser.close();
    return [];
  }
}

module.exports = { downloadWithBrowser };