const puppeteer = require("puppeteer");

async function downloadWithBrowser(url) {
  const browser = await puppeteer.launch({
    headless: true, // nanti bisa false kalau mau lihat browsernya
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://snapsave.app/id", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // isi input
    await page.type('input[name="url"]', url);

    // klik tombol download
    await page.click('button[type="submit"]');

    // tunggu hasil muncul
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ambil semua link
    const allLinks = await page.$$eval("a", els => els.map(e => e.href));

    console.log("ALL LINKS:", allLinks);

    // ambil semua link
    const links = await page.$$eval("a", (elements) =>
        elements
            .map((el) => el.href)
            .filter(
            (href) =>
                href &&
                href.includes("rapidcdn")
            )
);

    await browser.close();

    return links;

  } catch (err) {
    console.log("Puppeteer error:", err.message);
    await browser.close();
    return [];
  }
}

module.exports = { downloadWithBrowser };