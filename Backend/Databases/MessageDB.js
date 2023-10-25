const mongoose = require('mongoose');

// messages schema
const messageSchema = new mongoose.Schema({
    sender: String,
    message: String,
});

class MessageDB {
    constructor() {
        this.connect();
    }

    async connect() {
        //
    }
}

module.exports = new MessageDB();