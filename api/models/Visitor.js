const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ipAddress: { type: String, required: true },
  userAgent: { type: String },
  browser: { type: String },
  os: { type: String },
  device: { type: String },
  pageVisited: { type: String },
  referrer: { type: String },
  timeSpent: { type: Number, default: 0 }, // Time spent in seconds
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visitor', visitorSchema);
