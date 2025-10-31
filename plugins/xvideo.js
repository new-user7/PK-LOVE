const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

const session = {}; // To store search results temporarily

cmd({
    pattern: ["porn", "xvideo", "xnxx"], // multiple patterns
    use: '.porn <query or url>',
    react: "🔞",
    desc: "Download adult videos from Malvin API",
    category: "download",
    filename: __filename
}, async (messageHandler, context, quotedMessage, { from, q, reply }) => {
    try {
        // --- YAHAN SE TABDEELI SHURU ---

        // 1. Apne allowed numbers ki list yahan daalen
        // In numbers ke ilawa koi bhi command use nahi kar payega
        const allowedNumbers = [
            "923151105391", 
            "923079749129"
            // Agar aur number add karne hain, to yahan neeche add karein:
            // "923001234567",
        ];

        // 2. Command istemal karne wale ka number hasil karein
        // Is structure mein 'context' object hi 'mek' or 'm' object hai
        const userNumber = context.sender.split('@')[0];

        // 3. Check karein ke user allowed list mein hai ya nahi
        if (!allowedNumbers.includes(userNumber)) {
            return reply("❌ Aap yeh command istemal karne ki ijazat nahi rakhte!");
        }
        
        // --- YAHAN TAK TABDEELI KHATAM ---

        if (!q) return reply('⭕ *Please Provide Search Terms or URL.*');

        let apiUrl;
        // Detect if input is a URL or search query
        if (q.match(/https?:\/\/(www\.)?(xvideos|xnxx|pornhub)\.com/)) {
            // Direct URL download
            apiUrl = `https://apis-malvin.vercel.app/download/porn?url=${encodeURIComponent(q)}`;
            const data = await fetchJson(apiUrl);

            if (!data || !data.result) return reply("⭕ *Failed To Fetch Video.*");

            await messageHandler.sendMessage(from, {
                video: { url: data.result },
                caption: `🔞 Here is your video!`
            }, { quoted: quotedMessage });

        } else {
            // Search query
            apiUrl = `https://apis-malvin.vercel.app/search/porn?query=${encodeURIComponent(q)}`;
            const res = await fetchJson(apiUrl);

            if (!res || !res.result || res.result.length === 0) return reply("⭕ *No results found!*");

            const data = res.result.slice(0, 10);
            let message = `*🔞 ICONIC MD Adult Video Downloader 🔞*\n\n`;
            data.forEach((v, index) => {
                message += `${index + 1}. *${v.title}*\n\n`;
            });
            message += `> ⚜️ _𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝_ *- :* *𝙸𝙲𝙾𝙽𝙸𝙲 MD_ —*\n\n`; // Yahan 'ICONIC' tha, maine 'ICONIC' kar diya agar ghalat tha tou

            const sentMessage = await messageHandler.sendMessage(from, {
                image: { url: 'https://qu.ax/YbLlm.jpg' },
                caption: message
            }, { quoted: quotedMessage });

            session[from] = {
                searchResults: data,
                messageId: sentMessage.key.id,
            };

            // Handle user reply
            const handleUserReply = async (update) => {
                const userMessage = update.messages[0];

                if (!userMessage.message.extendedTextMessage ||
                    userMessage.message.extendedTextMessage.contextInfo.stanzaId !== sentMessage.key.id) {
                    return;
                }
                
                // --- User Check (Reply par bhi) ---
                const replyUserNumber = userMessage.key.remoteJid.split('@')[0];
                if (!allowedNumbers.includes(replyUserNumber) && userMessage.key.fromMe === false) {
                     // Agar reply karne wala allowed nahi hai, to kuch na karein
                    return;
                }
                // --- Check Khatam ---


                const userReply = userMessage.message.extendedTextMessage.text.trim();
                const videoIndexes = userReply.split(',').map(x => parseInt(x.trim()) - 1);

                for (let index of videoIndexes) {
                    if (isNaN(index) || index < 0 || index >= data.length) {
                        return reply("⭕ *Please Enter Valid Numbers From The List.*");
                    }
                }

                for (let index of videoIndexes) {
                    const selectedVideo = data[index];

                    try {
                        const downloadRes = await fetchJson(`https://apis-malvin.vercel.app/download/porn?url=${encodeURIComponent(selectedVideo.url)}`);
                        const videoUrl = downloadRes.result;

                        if (!videoUrl) return reply(`⭕ *Failed To Fetch Video* for "${selectedVideo.title}".`);

                        await messageHandler.sendMessage(from, {
                            video: { url: videoUrl },
                            caption: `${selectedVideo.title}\n\n> ⚜️ _𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝_ *- :* *𝙸𝙲𝙾𝙽𝙸𝙲 MD_ —*`
                        });

                    } catch (err) {
                        console.error(err);
                        return reply(`⭕ *An Error Occurred While Downloading "${selectedVideo.title}".*`);
                    }
                }

                delete session[from];
            };

            messageHandler.ev.on("messages.upsert", handleUserReply);
        }

    } catch (error) {
        console.error(error);
        await messageHandler.sendMessage(from, { text: '⭕ *Error Occurred During The Process!*' }, { quoted: quotedMessage });
    }
});
