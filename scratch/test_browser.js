const { downloadWithBrowser } = require("../services/browser");

async function test() {
    const url = "https://www.instagram.com/reel/DX1__BmgkEq/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==";
    console.log("Testing with URL:", url);
    const links = await downloadWithBrowser(url);
    console.log("Result links:", links);
}

test();
