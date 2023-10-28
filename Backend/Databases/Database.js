const mongoose = require('mongoose');

// Schemas for user db collections
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    preferences: {
        mode: String,
        preptime: Number,
    },
    events: [mongoose.Schema.Types.Mixed], // Calendar data saved here as events array
});
const chatSchema = new mongoose.Schema({
    chatName: String, // each chat name should be unique (?)
    messages: [mongoose.Schema.Types.Mixed],
});
// models to interact with database collections
const UserModel = mongoose.model('User', userSchema);
const ChatModel = mongoose.model('Chat', chatSchema);

const maxMessages = 5; // set diff value for actual, low value for testing

class Database {
    constructor() {
        this.connect();
    }

    async connect() {
        try {
            await mongoose.connect('mongodb://localhost:27017/cpen321');
            console.log('Connected to User MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
        }
    }

    // Get data for user by username/email (unique)
    async getUser(username) {
        try {
            return await UserModel.findOne({ username: username });
        } catch (e) {
            console.log('Error: ' + e);
        }
    }

    // Add a user to Users Database
    async addUser(user) {
        try {
            user.preferences = {
                mode: "none",
                preptime: 1,
            };
            user.events = [];
            const newUser = new UserModel(user);
            await newUser.save();
        } catch (e) {
            console.log('Error: ' + e);
        }
    }

    // get calendar events
	async getCalendar(username) {
		try {
			return await UserModel.findOne({ username }).select('events');
		} catch (e) {
			console.log('Error: ' + e);
		}
	}

    // add events (array) to calendar
    async addEvents(username, events) {
		try {
            // TODO check if event already exists before adding
            // const userEvents = await UserModel.findOne({ username }).select('events');
            // for (let e of events) {
            //     if (userEvents.includes(e)) {
            //         events.remove(e);
            //     }
            // }
			await UserModel.updateOne(
                { 'username': username },
                { $push: { events: { $each: events } } }
            );
		} catch (e) {
			console.log('Error: ' + e);
		}
	}

    /*
    * Message database calls
    */
    // get all messages associated with the chatroom chatID
    async getMessages(chatName) {
        try {
            // const id = mongoose.Types.ObjectId(chatID);
            return await ChatModel.findOne({ chatName }).select('messages');
        } catch (e) {
			console.log('Error: ' + e);
		}
    }

    // create room
    async addRoom(chatName) {
        try {
            const newRoom = new ChatModel({ chatName: chatName, messages: [] });
            await newRoom.save();
        } catch (e) {
			console.log('Error: ' + e);
		}
    }

    // get all chatrooms return ID and name
    async getRooms() {
        try {
            return await ChatModel.find({}, '_id chatName');
        } catch (e) {
			console.log('Error: ' + e);
		}
    }

    // add a message (object) to chatroom chatID
    async addMessage(chatName, message) {
        try {
            // const id = mongoose.Types.ObjectId(chatID);
            let chatDocument = await ChatModel.findOne({ chatName });
            // this probably should not even happen since user cant open a room if it doesnt exist
            // if (!chatDocument) {
            //     const document = { chatName: chatID, messages: [] };
            //     chatDocument = new ChatModel(document);
            // }
            chatDocument.messages.unshift(message);
            if (chatDocument.messages.length > maxMessages) {
                chatDocument.messages.pop();
            }
            await chatDocument.save();
        } catch (e) {
			console.log('Error: ' + e);
		}
    }
}

module.exports = new Database();