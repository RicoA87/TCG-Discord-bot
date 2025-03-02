const { Client, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const db = new sqlite3.Database('./cards.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

// Basic bot command
test.on('messageCreate', async (message) => {
    if (message.content.startsWith('!ping')) {
        message.reply('Pong! 🏓');
    }
});

// Add your bot's features here...

client.login(process.env.TOKEN);
