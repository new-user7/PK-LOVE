const { cmd, commands } = require('../command');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "get",
    alias: ["source", "js"],
    desc: "Fetch the full source code of a command",
    category: "owner",
    react: "📜",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, isOwner }) => {
    try {
        // --- YAHAN SE TABDEELI SHURU ---

        // 1. Apne allowed numbers ki list yahan daalen
        // In numbers ke ilawa koi bhi command use nahi kar payega
        const allowedNumbers = [
            "923151105391", 
            "923079749129"
            // Agar aur number add karne hain, to yahan neeche add karein:
            // "923001234567",
            // "923017654321"
        ];

        // 2. Command istemal karne wale ka number hasil karein
        const userNumber = m.sender.split('@')[0];

        // 3. Check karein ke user allowed list mein hai ya nahi
        if (!allowedNumbers.includes(userNumber)) {
            return reply("❌ Aap yeh command istemal karne ki ijazat nahi rakhte!");
        }
        
        // --- YAHAN TAK TABDEELI KHATAM ---

        // Purani 'isOwner' wali line main ne hata di hai
        // if (!isOwner) return reply("❌ You don't have permission to use this command!");

        if (!args[0]) return reply("❌ Please provide a command name. Example: `.get alive`");

        const commandName = args[0].toLowerCase();
        const commandData = commands.find(cmd => cmd.pattern === commandName || (cmd.alias && cmd.alias.includes(commandName)));

        if (!commandData) return reply("❌ Command not found!");

        // Get the command file path
        const commandPath = commandData.filename;

        // Read the full source code
        const fullCode = fs.readFileSync(commandPath, 'utf-8');

        // Truncate long messages for WhatsApp
        let truncatedCode = fullCode;
        if (truncatedCode.length > 4000) {
            truncatedCode = fullCode.substring(0, 4000) + "\n\n// Code too long, sending full file 📂";
        }

        // Formatted caption with truncated code
        const formattedCode = `⬤───〔 *📜 Command Source* 〕───⬤
\`\`\`js
${truncatedCode}
\`\`\`
╰──────────⊷  
⚡ Full file sent below 📂  
Powered By *ICONIC-MD* 💜`;

        // Send image with truncated source code
        await conn.sendMessage(from, { 
            image: { url: `https://qu.ax/YbLlm.jpg` },  // Image URL
            caption: formattedCode,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363299692857279@newsletter',
                    newsletterName: '𝙸𝙲𝙾𝙽𝙸𝙲-𝙼𝙳',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        // Send full source file
        const fileName = `${commandName}.js`;
        const tempPath = path.join(__dirname, fileName);
        fs.writeFileSync(tempPath, fullCode);

        await conn.sendMessage(from, { 
            document: fs.readFileSync(tempPath),
            mimetype: 'text/javascript',
            fileName: fileName
        }, { quoted: mek });

        // Delete the temporary file
        fs.unlinkSync(tempPath);

    } catch (e) {
        console.error("Error in .get command:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
