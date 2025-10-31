const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "video",
    alias: ["ytmp4", "songv", "ytvv"],
    desc: "Download YouTube videos",
    category: "download",
    react: "📽️",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("📽️ Please provide a YouTube video name or URL!\n\nExample: `.video Zahe muqaddar Huzoor haq se`");

        let url = q;

        // 🔍 If input is not a URL, search YouTube
        if (!q.startsWith('http://') && !q.startsWith('https://')) {
            const search = await yts(q);
            if (!search.videos || search.videos.length === 0) {
                return await reply("❌ No video results found!");
            }
            url = search.videos[0].url;
        }

        // 📸 Send thumbnail & info while downloading
        const searchInfo = await yts(url);
        const videoInfo = searchInfo.videos[0];

        if (videoInfo) {
            await conn.sendMessage(from, {
                image: { url: videoInfo.thumbnail },
                caption: `*‎_𝙸𝙲𝙾𝙽𝙸𝙲-𝙼𝙳 ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ_*
‎*╭───────────────━┈⊷*
‎*│▸ℹ️ ᴛɪᴛʟᴇ:* ${videoInfo.title}
‎*│▸🕘 ᴅᴜʀᴀᴛɪᴏɴ:* ${videoInfo.timestamp}
‎*│▸👁️‍🗨️ ᴠɪᴇᴡs:* ${videoInfo.views} *╰───────────────━┈⊷*`
            }, { quoted: mek });
        }

        // 🎬 Fetch video via API
        const api = `https://jawad-tech.vercel.app/download/ytmp4?url=${encodeURIComponent(url)}&quality=360`;
        const res = await axios.get(api);
        const data = res.data;

        if (!data?.status || !data.result) {
            return await reply("❌ Failed to fetch download link from API!");
        }

        const downloadUrl = data.result;
        const metadata = data.metadata;

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: `‎*𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙸𝙲𝙾𝙽𝙸𝙲-𝙼𝙳*`
        }, { quoted: mek });

        // ✅ React success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in . video:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});