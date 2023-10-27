const mongoose = require('mongoose');

// Schema and Model for event
const eventSchema = new mongoose.Schema({
  calendarId: {
    type: String,
    required: true,
    minlength: 3
  },
  eventId: {
    type: String,
    required: true,
    minlength: 3
  },
  organizer: {
    email: {
      type: String,
      required: true,
      validate: {
        validator: (value) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); // Check if it's a valid email
        },
        message: 'Invalid email format'
      }
    },
    displayName: {
      type: String
    }
  },
  ownerUserId: {
    type: String,
    required: true,
    minlength: 3
  },
  summary: {
    type: String
  },
  description: {
    type: String
  },
  start: {
    dateTime: {
      type: Date,
      required: true
    },
    timeZone: {
      type: String,
      required: true
    }
  },
  end: {
    dateTime: {
      type: Date,
      required: true
    },
    timeZone: {
      type: String,
      required: true
    }
  },
  location: {
    type: String
  }
});

module.exports = mongoose.model('event', eventSchema);
