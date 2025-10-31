const { cmd } = require('../command');
const config = require('../config');
const yts = require('yt-search');
const fetch = require('node-fetch');

cmd({
  pattern: "play3",
  alias: ["mp3", "ytmp3"],
  react: "🎵",
  desc: "Download YouTube MP3 using QADEER API",
  category: "download",
  use: ".play3 <song name or YouTube URL>",
  filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
  try {
    if (!q) return await reply("❌ Please provide a song name or YouTube URL!");

    // 🔍 Search YouTube or get direct URL
    let video;
    if (q.includes("youtube.com") || q.includes("youtu.be")) {
      const videoId = q.split("v=")[1]?.split("&")[0] || q.split("/").pop();
      const search = await yts({ videoId });
      video = search;
    } else {
      const search = await yts(q);
      if (!search.videos.length) return await reply("❌ No results found!");
      video = search.videos[0];
    }

    const { title, url, thumbnail, timestamp, ago, views, author } = video;

    // 🎵 Info Caption
    const caption = `
╭━━━〔🎧 *ICONIC-MD SONG DOWNLOADER* 🎧〕━━━╮
🎵 *Title:* ${title}
🕒 *Duration:* ${timestamp || "Unknown"}
👀 *Views:* ${views || "Unknown"}
📆 *Released:* ${ago || "Unknown"}
👤 *Channel:* ${author?.name || "Unknown"}
🔗 *URL:* ${url}

💬 *Reply with your choice:*
👉 1.1 — *Audio Type* 🎵
👉 1.2 — *Document Type* 📁

╰━━━━━━━━━━━━━━━━━━━━━━━╯
✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙸𝙲𝙾𝙽𝙸𝙲-𝙼𝙳 ✨
`;

    // 📸 Send thumbnail
    const sentMsg = await conn.sendMessage(from, { image: { url: thumbnail }, caption }, { quoted: mek });
    const messageID = sentMsg.key.id;

    await conn.sendMessage(from, { react: { text: '🎶', key: sentMsg.key } });

    // 📨 Listen for user reply
    conn.ev.on('messages.upsert', async (update) => {
      try {
        const msg = update?.messages[0];
        if (!msg?.message) return;

        const body = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const isReply = msg?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;
        if (!isReply || !body) return;

        const choice = body.trim();
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // 🎧 Fetch download URL from your API
        const apiUrl = `https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(url)}`;
        const res = await fetch(apiUrl);
        const json = await res.json();
        const downloadUrl = json?.result?.url || json?.result?.download_url || json?.url;

        if (!downloadUrl) return await reply("❌ Failed to fetch download link from API!");

        if (choice === "1.1") {
          // 🎵 Send audio
          await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            contextInfo: {
              externalAdReply: {
                title,
                body: "🎶 Powered by ICONIC-MD",
                thumbnailUrl: thumbnail,
                sourceUrl: url,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          }, { quoted: mek });

        } else if (choice === "1.2") {
          // 📁 Send document
          await conn.sendMessage(from, {
            document: { url: downloadUrl },
            fileName: `${title}.mp3`,
            mimetype: "audio/mpeg",
            caption: `🎧 *${title}*\n✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙸𝙲𝙾𝙽𝙸𝙲-𝙼𝙳 ✨`
          }, { quoted: mek });
        } else {
          return await reply("❌ Invalid choice! Reply with 1.1 or 1.2.");
        }

        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
        await conn.sendMessage(from, { text: "✅ *Media Upload Successful!*" }, { quoted: mek });

      } catch (err) {
        console.error("Reply Handler Error:", err);
        await reply(`❌ Error while processing your choice!\n${err.message}`);
      }
    });

  } catch (err) {
    console.error("Main Error:", err);
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    await reply(`❌ *An error occurred:* ${err.message}`);
  }
});
