const mongoose = require('mongoose');

// Schema and Model for chat
const chatSchema = new mongoose.Schema({
  time: Date,
  content: String
});

module.exports = mongoose.model('chat', chatSchema);
