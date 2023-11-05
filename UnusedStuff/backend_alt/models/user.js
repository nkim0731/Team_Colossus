const mongoose = require('mongoose');

// Connect to your MongoDB database
mongoose.connect('mongodb://localhost/your-database-name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema and Model for user
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  preferences: {
      mode: String,
      preptime: Number,
  },
  events: [mongoose.Schema.Types.Mixed], // Calendar data saved here as events array
});

module.exports = userSchema;
