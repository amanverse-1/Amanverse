require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const BotClass = TelegramBot.default || TelegramBot;
const requestIp = require('request-ip');
const useragent = require('useragent');
const fs = require('fs');
const path = require('path');

// Models
const Visitor = require('./models/Visitor');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestIp.mw());

const mongoUri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim().replace(/^["']|["']$/g, '') : '';
console.log("URI is:", JSON.stringify(mongoUri));

// Auth Router & Middleware
const authRouter = require('./auth');
const authMiddleware = require('./middleware/auth');
app.use('/api/auth', authRouter);

// MongoDB Connection Logic for Serverless
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }
  if (!mongoUri) {
    console.error("CRITICAL ERROR: MONGODB_URI is empty or undefined!");
    throw new Error("MONGODB_URI is empty or undefined!");
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    }).then((mongoose) => {
      console.log('MongoDB Connected successfully.');
      return mongoose;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    throw e; 
  }
  return cached.conn;
};

// Middleware to ensure DB connection before handling any request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    // Agar DB connect nahi hua, toh 500 status code bhej do instead of timing out
    res.status(500).json({ success: false, error: 'Database connection failed', details: error.message });
  }
});

// Telegram Bot Setup
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

let bot = null;
if (botToken) {
  bot = new BotClass(botToken, { polling: false });
}

const sendTelegramMessage = async (message) => {
  if (bot && chatId) {
    try {
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Telegram send error:', error);
    }
  }
};

// Helper to save to local JSON
const saveToJson = (filename, data) => {
  try {
    const dataPath = path.join(__dirname, '../data', filename);
    let existingData = [];
    if (fs.existsSync(dataPath)) {
      existingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    existingData.push({ ...data, timestamp: new Date() });
    fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
  } catch (err) {
    // Fail silently on Vercel or if file cannot be written
    console.log('Could not write to JSON (expected on Vercel):', err.message);
  }
};

// ==========================================
// API ROUTES
// ==========================================

// 1. Visitor Tracking Endpoint
app.post('/api/track', async (req, res) => {
  try {
    const ipAddress = req.clientIp || 'Unknown';
    const agentString = req.headers['user-agent'];
    const agent = useragent.parse(agentString);
    const { pageVisited, referrer, timeSpent } = req.body;

    const visitorData = {
      ipAddress,
      userAgent: agentString,
      browser: agent.family + ' ' + agent.major,
      os: agent.os.family + ' ' + agent.os.major,
      device: agent.device.family,
      pageVisited,
      referrer,
      timeSpent: timeSpent || 0
    };

    const visitor = new Visitor(visitorData);
    await visitor.save();
    
    // Save to local JSON backup
    saveToJson('visitors.json', visitorData);

    res.status(200).json({ success: true, message: 'Visitor tracked.' });
  } catch (error) {
    console.error('Error tracking visitor:', error);
    res.status(500).json({ success: false, error: 'Failed to track visitor.' });
  }
});

// 2. Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const messageData = { name, email, message };
    const newMessage = new Message(messageData);
    await newMessage.save();

    // Save to local JSON backup
    saveToJson('messages.json', messageData);

    // Send real-time Telegram alert
    const alertText = `🔔 <b>New Contact Message!</b>\n\n<b>Name:</b> ${name}\n<b>Email:</b> ${email}\n<b>Message:</b>\n${message}`;
    await sendTelegramMessage(alertText);

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ success: false, error: 'Failed to save message.' });
  }
});

// 3. Dashboard Stats Endpoint (Protected)
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const totalMessages = await Message.countDocuments();
    
    const recentVisitors = await Visitor.find().sort({ timestamp: -1 }).limit(10);
    const recentMessages = await Message.find().sort({ timestamp: -1 }).limit(10);

    // Grouping by Date for charts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const visitorsLast7Days = await Visitor.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalVisitors,
        totalMessages,
        recentVisitors,
        recentMessages,
        visitorsLast7Days
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats.', details: error.message, stack: error.stack });
  }
});

// 4. Telegram Webhook Endpoint for Interactive Bot Commands
app.post('/api/telegram-webhook', async (req, res) => {
  try {
    const message = req.body.message;
    if (message && message.text) {
      const text = message.text.toLowerCase();
      const chatId = message.chat.id;

      // Allow only the authorized chat ID to ask for stats
      if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) {
        return res.status(200).send('Unauthorized chat');
      }

      if (text.includes('visitor') || text.includes('stats') || text.includes('total')) {
        const totalVisitors = await Visitor.countDocuments();
        const totalMessages = await Message.countDocuments();
        const responseText = `🤖 <b>Live Portfolio Stats</b>\n\n👁️ Total Visitors: <b>${totalVisitors}</b>\n💬 Total Messages: <b>${totalMessages}</b>`;
        
        if (bot) {
          await bot.sendMessage(chatId, responseText, { parse_mode: 'HTML' });
        }
      }
    }
    // Always respond with 200 so Telegram knows we received the webhook
    res.status(200).send('OK');
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).send('Error');
  }
});

// 5. Endpoint to configure Telegram Webhook
app.get('/api/set-webhook', async (req, res) => {
  try {
    if (!bot) return res.status(400).send('Bot not configured');
    // Get the host from the request (will be your Vercel domain in production)
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const webhookUrl = `${protocol}://${host}/api/telegram-webhook`;
    
    await bot.setWebHook(webhookUrl);
    res.status(200).json({ success: true, message: `Webhook set to ${webhookUrl}` });
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to set webhook' });
  }
});

// Export for Vercel Serverless
module.exports = app;
