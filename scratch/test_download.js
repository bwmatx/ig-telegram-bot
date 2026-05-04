const { downloadWithBrowser } = require("../services/browser");
const axios = require("axios");
const fs = require("fs");

async function test() {
    const url = "https://www.instagram.com/reel/DX1__BmgkEq/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==";
    console.log("Testing with URL:", url);
    const links = await downloadWithBrowser(url);
    console.log("Result links:", links);

    if (links.length > 0) {
        const videoUrl = links[0];
        console.log("Attempting to download video from:", videoUrl);
        
        try {
            const response = await axios.get(videoUrl, {
                responseType: "stream",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
                    "Referer": "https://snapsave.app/"
                },
                timeout: 30000
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);

            // test pipe to file
            const writer = fs.createWriteStream("scratch/test_video.mp4");
            response.data.pipe(writer);

            writer.on("finish", () => {
                console.log("Download finished successfully!");
                process.exit(0);
            });

            writer.on("error", (err) => {
                console.error("Download error:", err.message);
                process.exit(1);
            });

        } catch (err) {
            console.error("Axios error:", err.message);
            if (err.response) {
                console.error("Status:", err.response.status);
                console.error("Data:", err.response.data);
            }
        }
    } else {
        console.log("No links found.");
    }
}

test();
