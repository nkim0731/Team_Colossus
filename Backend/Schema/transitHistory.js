const mongoose = require('mongoose');

const transitHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model (assuming you have a User model)
        required: true
    },
    origin: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    transitMode: {
        type: String,
        required: true
    },
    routeDetails: {
        type: Object, // Store route details as an object (you can customize the structure)
        required: true
    },
    actualTimeTaken: {
        type: Number, // Store the actual time taken by the user
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = transitHistorySchema;
