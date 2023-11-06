const mongoose = require('mongoose');
const deepMerge = require('deepmerge');

// Schemas needed for db
const userSchema = require('../Schema/userSchema');
const chatSchema = require('../Schema/chatSchema');

// models to interact with database collections
const UserModel = mongoose.model('user', userSchema);
const ChatModel = mongoose.model('chat', chatSchema);

//Import export variables from variables.js
const { isHttps, isTest, test_calendoDB } = require('../variables.js');

const maxMessages = 5; // TODO set diff value for actual, low value for testing

// const mongoURI = 'mongodb://localhost:27017/calendoDB';

var mongoURI = null;
if (isTest) {
    if (test_calendoDB) {
        mongoURI = 'mongodb://localhost:27017/test_calendoDB';
    } else {
        // This URL should be the same as the db connection created in the server.js
        mongoURI = 'mongodb://localhost:27017/cpen321';
    }
} else {
    // For actual project deployment
    mongoURI = 'mongodb://localhost:27017/calendoDB';
}

class Database {
    constructor() {
        this.connect();
    }

    // ChatGPT usage: No
    async connect() {

        
        console.log('Database class mongoURL : ', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('Database class Connected to User MongoDB');
        
    }

    // Get data for user by username/email (unique)
    // ChatGPT usage: Partial
    async getUser(useremail) {
        try {
            // just return the result directly, null means no user return false redundant
            return await UserModel.findOne({ username: useremail });
        } catch (error) {
            console.error('Error while fetching user:', error);
            throw error; // Re-throw the error to handle it further up the call stack
        }
    }

    // Get user data by google auth id (not used)
    // ChatGPT usage: No
    async getUserById(id) {
        try {
            return await UserModel.findOne({ userId: id });
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    // Add a new user to Users Database
    // ChatGPT usage: Partial
    async addUser(user) {
        try {
            if (user.password === undefined) {
                user.password = 'Register from Google'; // no user/pw login yet anyway this field is useless lol
            }
            // default user preferences on account creation
            user.preferences = { 
                commute_method: 'Driving', // default for navigation
                preparation_time: '0',
                notification_preferences: { // all default true
                    morning_alarm: true,
                    event_alarm: true,
                    event_notification: true,
                    traffic_alerts: true,
                    weather_alerts: true,
                },
                maxMissedBus: '1',
            };
            user.events = [];
            user.daySchedule = [];

            const newUser = new UserModel(user);
            await newUser.save();
        } catch (e) {
            console.log('addUser error -> ' + e);
            throw e;
        }
    }


    // Add a user to Users Database
    // ChatGPT usage: Partial
    async updateUser(user) {
        try {
            await UserModel.findOneAndUpdate(
                { username: user.username },
                user,
                { new: true }
                ).then((updatedUser) => {
                    console.log("user is updated : " + updatedUser);
                    return updatedUser;
                });
        } catch (e) {
            console.log('updateUser error -> ' + e);
            throw e;
        }
    }

    // update preferences for user in database
    // ChatGPT usage: Partial
    async updatePreferences(user, preferences) {
        try {
            let userDocument = await UserModel.findOne({ username: user });
            if (!userDocument) throw new Error("No user found");
            userDocument.preferences = deepMerge(userDocument.preferences, preferences);

            await userDocument.save();
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    /*
    * Calendar Database calls
    */

    // get calendar events (this might not be needed anyway since we can get events from user in getUser)
    // ChatGPT usage: Partial
	async getCalendar(username) {
		try {
			return await UserModel.findOne({ username }).select('events');
		} catch (e) {
			console.log('Error: ' + e);
		}
	}

    // add events (array) to calendar
    // ChatGPT usage: Partial
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
                // check if event is already in database
                for (let ue of userEvents.events) {
                    if (ue.eventName === e.eventName) included = true;
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
    // ChatGPT usage: Partial
    async addSchedule(username, schedule) {
        try {
            let user = await UserModel.findOne({ username });
            user.daySchedule = schedule;
            await user.save();
        } catch (e) {
            console.log('Error: ' + e);
        }
    }

    // ChatGPT usage: No
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
    // ChatGPT usage: No
    async getMessages(chatName) {
        try {
            return await ChatModel.findOne({ chatName }).select('messages');
        } catch (e) {
			console.log('Error: ' + e);
		}
    }

    // create room
    // ChatGPT usage: Partial
    async createRoom(chatName) {
        try {
            const newRoom = new ChatModel({ chatName, messages: [] });
            const room = await newRoom.save();
            return room;
        } catch (e) {
			console.log('Error: ' + e);
            throw e;
		}
    }

    // get a chatroom by name
    // ChatGPT usage: No
    async getRoom(chatName) {
        try {
            return await ChatModel.findOne({ chatName });
        } catch (e) {
			console.log('Error: ' + e);
            throw e;
		}
    }

    // add a message (object) to chatroom chatID
    // ChatGPT usage: Partial
    async addMessage(chatName, message) {
        try {
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