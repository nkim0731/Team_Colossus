const mongoose = require('mongoose');
const deepMerge = require('deepmerge');

// Schemas needed for db
const userSchema = require('../Schema/userSchema');
const chatSchema = require('../Schema/chatSchema');

// models to interact with database collections
const UserModel = mongoose.model('user', userSchema);
const ChatModel = mongoose.model('chat', chatSchema);

//Import export variables from variables.js
// const { isHttps, isTest, test_calendoDB } = require('../variables.js');

const maxMessages = 5; // TODO set diff value for actual, low value for testing

const mongoURI = 'mongodb://localhost:27017/calendoDB';

// var mongoURI = null;
// if (isTest) {
//     if (test_calendoDB) {
//         mongoURI = 'mongodb://localhost:27017/test_calendoDB';
//     } else {
//         // This URL should be the same as the db connection created in the server.js
//         mongoURI = 'mongodb://localhost:27017/cpen321';
//     }
// } else {
//     // For actual project deployment
//     mongoURI = 'mongodb://localhost:27017/calendoDB';
// }

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
        return await UserModel.findOne({ username: useremail });
    }

    // Get user data by google auth id (not used)
    // ChatGPT usage: No
    async getUserById(id) {
        return await UserModel.findOne({ userId: id });
    }

    // Add a new user to Users Database
    // ChatGPT usage: Partial
    async addUser(user) {
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
    }


    // Add a user to Users Database
    // ChatGPT usage: Partial
    async updateUser(user) {
        return await UserModel.findOneAndUpdate(
            { username: user.username },
            user,
            { new: true }
        );
    }

    // update preferences for user in database
    // ChatGPT usage: Partial
    async updatePreferences(user, preferences) {
        let userDocument = await UserModel.findOne({ username: user });
        if (!userDocument) throw new Error("No user found");
        userDocument.preferences = deepMerge(userDocument.preferences, preferences);

        await userDocument.save();
    }

    /*
    * Calendar Database calls
    */

    // get calendar events (this might not be needed anyway since we can get events from user in getUser)
    // ChatGPT usage: Partial
	async getCalendar(username) {
        return await UserModel.findOne({ username }).select('events');
	}

    // add events (array) to calendar
    // ChatGPT usage: Partial
    async addEvents(username, events) {
        const user = await UserModel.findOne({ username });
        const coursePattern = /^[A-Za-z]{4}\d{3}/;
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
        user.events = [...user.events, ...newEvents];
        await user.save();
		// await UserModel.updateOne(
        //     { username },
        //     { $push: { events: { $each: newEvents } } }
        // );
	}

    // add day schedule to db
    // ChatGPT usage: Partial
    async addSchedule(username, schedule) {
        let user = await UserModel.findOne({ username });
        user.daySchedule = schedule;
        await user.save();
    }

    // ChatGPT usage: No
    async getSchedule(username) {
        return await UserModel.findOne({ username }).select('daySchedule');
    }

    /*
    * Message database calls
    */

    // get all messages associated with the chatroom chatID
    // ChatGPT usage: No
    async getMessages(chatName) {
        return await ChatModel.findOne({ chatName }).select('messages');
    }

    // create room
    // ChatGPT usage: Partial
    async createRoom(chatName) {
        const newRoom = new ChatModel({ chatName, messages: [] });
        const room = await newRoom.save();
        return room;
    }

    // get a chatroom by name
    // ChatGPT usage: No
    async getRoom(chatName) {
        return await ChatModel.findOne({ chatName });
    }

    // add a message (object) to chatroom chatID
    // ChatGPT usage: Partial
    async addMessage(chatName, message) {
        let chatDocument = await ChatModel.findOne({ chatName });
        // create chatroom in database if does not exist already
        if (!chatDocument) {
            const document = { chatName, messages: [] };
            chatDocument = new ChatModel(document);
        }
        chatDocument.messages.unshift(message);
        if (chatDocument.messages.length > maxMessages) {
            chatDocument.messages.pop();
        }
        await chatDocument.save();
    }
}

module.exports = new Database();