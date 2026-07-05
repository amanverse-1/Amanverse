const mongoose = require('mongoose');
const Visitor = require('../models/Visitor');
const TelegramBot = require('node-telegram-bot-api');
const BotClass = TelegramBot.default || TelegramBot;

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let bot = null;
if (botToken) {
  bot = new BotClass(botToken, { polling: false });
}

module.exports = async (req, res) => {
  try {
    const mongoUri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim().replace(/^["']|["']$/g, '') : '';
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const count = await Visitor.countDocuments({ timestamp: { $gte: lastWeek } });
    
    const message = `📈 <b>Weekly Report</b>\n\nVisitors this week: <b>${count}</b>`;
    if (bot && chatId) {
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }
    res.status(200).json({ success: true, message: 'Weekly report sent' });
  } catch (err) {
    console.error('Weekly cron error:', err);
    res.status(500).json({ success: false, error: 'Failed to send report' });
  }
};
