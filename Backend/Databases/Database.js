const mongoose = require('mongoose');

// Schemas needed for db
const userSchema = require('../Schema/userSchema');
const chatSchema = require('../Schema/chatSchema');
// const { mongo } = require("mongoose");

// models to interact with database collections
const UserModel = mongoose.model('user', userSchema);
const ChatModel = mongoose.model('chat', chatSchema);

const maxMessages = 5; // TODO set diff value for actual, low value for testing

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
            console.log('Database class mongoURL : ', mongoURI);
            await mongoose.connect(mongoURI);
            console.log('Database class Connected to User MongoDB');
        } catch (err) {
            console.error('Database class MongoDB connection error:', err);
        }
    }

    // Get data for user by username/email (unique)
    async getUser(useremail) {
        try {
            // just return the result directly, null means no user return false redundant
            return await UserModel.findOne({ username: useremail });
        } catch (error) {
            console.error('Error while fetching user:', error);
            throw error; // Re-throw the error to handle it further up the call stack
        }
    }

    // Get user data by google auth id
    async getUserById(id) {
        try {
            return await UserModel.findOne({ userId: id });
        } catch (e) {
            console.log(e);
            throw e;
        }
    }


    // Add a user to Users Database
    async addUser(user) {
        try {
            // if property doesnt exist would be undefined not null
            if (user.password === undefined) {
                user.password = 'Register from Google'; // no user/pw login yet anyway this field is useless
            }
            // these should be undefined anyway on create account
            user.preferences = { commute_method: null };
            user.events = [];
            user.daySchedule = [];

            const newUser = new UserModel(user);
            await newUser.save();
        } catch (e) {
            console.log('addUser error -> ' + e);
            throw e;
        }
    }

    /*
    * Calendar Database calls
    */

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
            const userEvents = await UserModel.findOne({ username }).select('events');
            const coursePattern = /^[A-za-z]{4}\d{3}/;
            let newEvents = [];
            for (let e of events) {
                // test against regex for format xxxx111 (course)
                if (coursePattern.test(e.eventName)) {
                    e.hasChat = true;
                } else {
                    e.hasChat = false;
                }
                let included = false;
                for (let ue of userEvents.events) {
                    if (ue.eventName === e.eventName) included = true; // assuming eventName is unique
                }
                if (!included) newEvents.push(e);
            }

			await UserModel.updateOne(
                { 'username': username },
                { $push: { events: { $each: newEvents } } }
            );
		} catch (e) {
			console.log('Error: ' + e);
            throw e;
		}
	}

    // add day schedule to db
    async addSchedule(username, schedule) {
        try {
            let user = await UserModel.findOne({ username });
            user.daySchedule = schedule;
            await user.save();
        } catch (e) {
            console.log('Error: ' + e);
        }
    }

    async getSchedule(username) {
        try {
            return await UserModel.findOne({ username }).select('daySchedule');
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
            // create chatroom in database if does not exist already
            if (!chatDocument) {
                const document = { chatName: chatName, messages: [] };
                chatDocument = new ChatModel(document);
            }
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