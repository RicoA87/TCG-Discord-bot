// Discord Card Collecting Bot
// This bot allows players to collect, trade, and manage digital trading cards.
// Developed with features including packs, crafting, auctions, leaderboards, and live breaks.

const { Client, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const db = new sqlite3.Database('/app/cards.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

// Bot is ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Basic command to test bot response
client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!ping')) {
        message.reply('Pong! 🏓');
    }
});

// Database setup - Creating tables for storing user data, cards, and packs
db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    image_url TEXT,
    rarity TEXT,
    value INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS user_cards (
    user_id TEXT,
    card_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (card_id) REFERENCES cards (id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS packs (
    name TEXT PRIMARY KEY,
    cost INTEGER,
    rarity_probabilities TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS live_breaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    pack TEXT,
    price INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS live_break_entries (
    user_id TEXT,
    break_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (break_id) REFERENCES live_breaks (id)
)`);

// Economy System: Claim and Check Balance
client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!claim')) {
        const userId = message.author.id;
        
        db.get(`SELECT balance FROM users WHERE user_id = ?`, [userId], (err, row) => {
            if (err) return message.reply('❌ Error accessing balance.');
            
            const amount = 250;
            if (!row) {
                db.run(`INSERT INTO users (user_id, balance) VALUES (?, ?)`, [userId, amount]);
            } else {
                db.run(`UPDATE users SET balance = balance + ? WHERE user_id = ?`, [amount, userId]);
            }
            message.reply(`✅ You have claimed **${amount} coins**! Your balance has been updated.`);
        });
    }
});

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!balance')) {
        const userId = message.author.id;
        
        db.get(`SELECT balance FROM users WHERE user_id = ?`, [userId], (err, row) => {
            if (err) return message.reply('❌ Error accessing balance.');
            
            const balance = row ? row.balance : 0;
            message.reply(`💰 Your current balance is: **${balance} coins**`);
        });
    }
});

// Debugging: Log database queries for bug testing
db.on('trace', (query) => {
    console.log(`Executing Query: ${query}`);
});

// Debugging: Handle unexpected errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Live Breaks System - Join a Break
client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!joinbreak')) {
        const args = message.content.split(' ');
        if (args.length < 2) return message.reply('Usage: !joinbreak <break_name>');
        
        const userId = message.author.id;
        const breakName = args[1];
        
        db.get(`SELECT id, price FROM live_breaks WHERE name = ?`, [breakName], (err, row) => {
            if (err || !row) return message.reply('❌ Live break not found.');
            
            const breakId = row.id;
            const price = row.price;
            
            db.get(`SELECT balance FROM users WHERE user_id = ?`, [userId], (err, userRow) => {
                if (err || !userRow || userRow.balance < price) {
                    return message.reply('❌ You do not have enough coins to join this break.');
                }
                
                db.run(`UPDATE users SET balance = balance - ? WHERE user_id = ?`, [price, userId]);
                db.run(`INSERT INTO live_break_entries (user_id, break_id) VALUES (?, ?)`, [userId, breakId]);
                
                message.reply(`✅ You have successfully joined the live break **${breakName}**!`);
            });
        });
    }
});

// Start the bot
client.login(process.env.TOKEN);
