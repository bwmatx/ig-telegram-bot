const axios = require("axios");
const cheerio = require("cheerio");

async function downloadFromSnapSave(url) {
  try {
    // STEP 1: submit form
    const res = await axios.post(
      "https://snapsave.app/action.php", // coba endpoint umum
      new URLSearchParams({
        url: url
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://snapsave.app",
          "Referer": "https://snapsave.app/id"
        }
      }
    );

    const html = res.data;

    // STEP 2: parsing hasil
    const $ = cheerio.load(html);

    let links = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("http")) {
        links.push(href);
      }
    });

    return links;

  } catch (err) {
    console.log("Error:", err.message);
    return [];
  }
}

module.exports = { downloadFromSnapSave };