const mongoose = require('mongoose');

// Schemas needed for db
const userSchema = require('../Schema/userSchema');
const chatSchema = require('../Schema/chatSchema');
const { mongo } = require("mongoose");

// models to interact with database collections
const UserModel = mongoose.model('user', userSchema);
const ChatModel = mongoose.model('chat', chatSchema);

const maxMessages = 5; // set diff value for actual, low value for testing

//isTest switch from main file
var isTest = true;
isTest = require('../server.js').isTest;
isTest = true;

var mongoURI = null;
if (isTest) {
    // This URL should be the same as the db connection created in the server.js
    // mongoURI = 'mongodb://localhost:27017/test_calendoDB';
    mongoURI = 'mongodb://localhost:27017/cpen321'; // charles db name
} else {
    // For actual project deployment
    mongoURI = 'mongodb://localhost:27017/calendoDB';
}

class Database {
    constructor() {
        this.connect();
    }

    async connect() {
        try {
            console.log('mongoURL : ', mongoURI);
            await mongoose.connect(mongoURI);
            console.log('Connected to User MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
        }
    }

    // // Get data for user by username/email (unique)
    // async getUser(username) {
    //     try {
    //         return await UserModel.findOne({ username: username });
    //     } catch (e) {
    //         console.log('Error: ' + e);
    //     }
    // }

    // Get data for user by username/email (unique)
    async getUser(username) {
        try {
            const user = await UserModel.findOne({ username });

            if (!user) {
                return false;
            } else {
                return user;
            }
        } catch (error) {
            console.error('Error while fetching user:', error);
            throw error; // Re-throw the error to handle it further up the call stack
        }
    }


    // Add a user to Users Database
    async addUser(user) {
        try {
            if (user.preferences == null) {
                user.preferences = {
                    commute_method: null
                };
            }
            if (user.events == null) {
                user.events = [];
            }
            console.log('user before mongodb add : ', user);
            const newUser = new UserModel(user);
            let result = await newUser.save();
            return result;
        } catch (e) {
            console.log('addUser error -> ' + e);
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