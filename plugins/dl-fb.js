const axios = require("axios");
const { cmd } = require("../command");

// Facebook Downloader v1 (basic)
cmd({
  pattern: "fb",
  alias: ["facebook", "fbvideo"],
  react: '📥',
  desc: "Download videos from Facebook (Basic API)",
  category: "download",
  use: ".fb <Facebook video URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const fbUrl = args[0];
    if (!fbUrl || !fbUrl.includes("facebook.com")) {
      return reply('Please provide a valid Facebook video URL. Example: `.fb https://facebook.com/...`');
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // Use your new API endpoint
    const apiUrl = `https://www.dark-yasiya-api.site/download/fbdl2?url=${encodeURIComponent(fbUrl)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || response.data.status !== true) {
      return reply('❌ Unable to fetch the video. Please check the URL and try again.');
    }

    // Extract links from the response
    const sdLink = response.data.result.sdLink;
    const hdLink = response.data.result.hdLink;
    const downloadLink = hdLink || sdLink; // Prefer HD if available
    const quality = hdLink ? "HD" : "SD";

    await reply('Downloading video... Please wait.📥');

    await conn.sendMessage(from, {
      video: { url: downloadLink },
      caption: `> *𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙸𝙲𝙾𝙽𝙸𝙲-𝙼𝙳*`
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('Error:', error);
    reply('❌ Unable to download the video. Please try again later.');
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});