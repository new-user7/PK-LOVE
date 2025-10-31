const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');

// Single fixed emoji (💗)
const categoryEmoji = "💗";

cmd({
    pattern: "menu",
    alias: ["allmenu", "fullmenu"],
    desc: "Dynamic VIP Menu with single heart emoji theme",
    category: "main",
    react: "💗",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const verifiedReply = {
            key: {
                participant: `0@s.whatsapp.net`,
                fromMe: false,
                remoteJid: "status@broadcast"
            },
            message: {
                extendedTextMessage: {
                    text: "Qadeer-AI Official",
                    contextInfo: {
                        mentionedJid: [],
                        verifiedBizName: "Qadeer-AI"
                    }
                }
            }
        };

        // Get categories dynamically
        let categories = [...new Set(Object.values(commands).map(c => c.category || 'Misc'))];
        categories = categories.sort((a, b) => a.localeCompare(b));

        // Header info
        let menuText = `┏━〔 *${config.BOT_NAME}* 〕━┓

┋ *Owner* : *${config.OWNER_NAME}*
┋ *Library* : *DJ Baileys*
┋ *Hosting* : *Heroku*
┋ *Prefix* : [ *${config.PREFIX}* ]
┋ *Version* : *4.0.0*
┋ *Runtime* : *${runtime(process.uptime())}*
┗━━━━━━━━━━━━━━┛
\n`;

        // Category sections
        for (const category of categories) {
            const cmds = Object.values(commands).filter(c => c.category === category);
            if (cmds.length === 0) continue;

            menuText += `╭❮${categoryEmoji}${category.toUpperCase()}${categoryEmoji}❯✦\n`;
            cmds.forEach(c => {
                menuText += `┃»➤  ${c.pattern}\n`;
            });
            menuText += `╰─────────────✦\n\n`;
        }

        // Footer branding
        menuText += `> *© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚀𝙰𝙳𝙴𝙴𝚁 𝙰𝙸 💗*`;

        // Send styled message
        await conn.sendMessage(
            from,
            {
                image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/3tihge.jpg' },
                caption: menuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363299692857279@newsletter',
                        newsletterName: config.BOT_NAME,
                        serverMessageId: 143
                    }
                }
            },
            { quoted: verifiedReply }
        );

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});