const mongoose = require('mongoose');

// messages schema
const messageSchema = new mongoose.Schema({
    sender: String,
    message: String,
    timeStamp: Date,
});
// const MessageModel = mongoose.model('Message', messageSchema);

class MessageDB {
    constructor() {
        this.db = null;
        this.connect();
    }

    async connect() {
        try {
            this.db = await mongoose.createConnection('mongodb://localhost:27017/messages');
            this.model = this.db.model('Message', messageSchema);

            console.log('Connected to Messages MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
        }
    }
}

module.exports = new MessageDB();