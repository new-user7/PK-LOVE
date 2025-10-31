const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

const izumi = { baseURL: "https://izumiiiiiiii.dpdns.org" };

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
    throw lastError;
}

async function getIzumiVideoByUrl(youtubeUrl) {
    const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=720`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('Izumi API returned no download link');
}

async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.mp4) {
        return { download: res.data.result.mp4, title: res.data.result.title };
    }
    throw new Error('Okatsu API returned no mp4');
}

cmd({
    pattern: "video2",
    alias: ["ytvideo2", "ytv2", "ytmp2"],
    desc: "Download YouTube video by name or link",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (sock, message, args) => {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            await sock.sendMessage(message.chat, { text: "⚠️ Please type a video name or YouTube link." }, { quoted: message });
            return;
        }

        let videoUrl = "";
        let videoInfo = {};

        if (query.startsWith('http://') || query.startsWith('https://')) {
            videoUrl = query;
        } else {
            const { videos } = await yts(query);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(message.chat, { text: "❌ No videos found!" }, { quoted: message });
                return;
            }
            videoInfo = videos[0];
            videoUrl = videoInfo.url;
        }

        const title = videoInfo.title || "YouTube Video";
        const views = videoInfo.views ? videoInfo.views.toLocaleString() : "N/A";
        const author = videoInfo.author?.name || "Unknown";
        const duration = videoInfo.timestamp || "Unknown";
        const thumb = videoInfo.thumbnail;

        // 🎬 First send info (title, views, etc.)
        await sock.sendMessage(message.chat, {
            image: { url: thumb },
            caption: `🎬 *${title}*\n\n⏱ *Duration:* ${duration}\n👁 *Views:* ${views}\n👤 *Channel:* ${author}`
        }, { quoted: message });

        // 🌀 Try Izumi first, fallback to Okatsu
        let videoData;
        try {
            videoData = await getIzumiVideoByUrl(videoUrl);
        } catch (e1) {
            videoData = await getOkatsuVideoByUrl(videoUrl);
        }

        // 🎞 Then send video only with short caption
        await sock.sendMessage(message.chat, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: `${videoData.title || title}.mp4`,
            caption: `_𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙸𝙲𝙾𝙽𝙸𝙲-𝙼𝙳_`
        }, { quoted: message });

    } catch (error) {
        console.error('[VIDEO CMD ERROR]', error?.message || error);
        await sock.sendMessage(message.chat, { text: `❌ Download failed: ${error?.message || 'Unknown error'}` }, { quoted: message });
    }
});