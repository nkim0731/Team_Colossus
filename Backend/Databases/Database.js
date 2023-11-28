const mongoose = require('mongoose');
const deepMerge = require('deepmerge');

// Schemas needed for db
const userSchema = require('../Schema/userSchema');
const chatSchema = require('../Schema/chatSchema');

// models to interact with database collections
const UserModel = mongoose.model('user', userSchema);
const ChatModel = mongoose.model('chat', chatSchema);

const { OAuth2Client } = require('google-auth-library');

const maxMessages = 5; // TODO set diff value for actual, low value for testing

// For loading env variables
const path = require('path');
const envFilePath = path.join(__dirname ,'/../.env');
require('dotenv').config({ path: envFilePath });


const mongoURI = process.env.MONGO_URI;

class Database {
    constructor() {
        this.connect();
        this.authClient = new OAuth2Client();
    }

    // ChatGPT usage: No
    async connect() {
        if (process.env.TESTING === 'false') await mongoose.connect(mongoURI);
        console.log('Database class connected to MongoDB at: ' + mongoURI);
    }

    // Get data for user by username/email (unique)
    // do NOT throw an error on null result (not an error case)
    // ChatGPT usage: Partial
    async getUser(username) {
        return await UserModel.findOne({ username });
    }

    // redundant function and slows down everything by making another query
    // async userExists(useremail) {
    //     let user = await UserModel.findOne({ username: useremail });
    //     if (user == null) {
    //         return false;
    //     }
    //     return true;
    // }

    // Add a new user to Users Database
    // ChatGPT usage: Partial
    async addUser(user) {
        // Ensure the user has a username and password; set defaults if not provided
        // unfeasible path TODO remove and adjust tests
        if (user.username == null) {
            throw new Error("No username provided");
        }

        user.password = user.password || 'Register from Google';
    
        // Set default preferences if not provided
        // should not even be provided in the first place when creating an account
        user.preferences = user.preferences || {
            commute_method: 'Driving',
            preparation_time: '0',
            notification_preferences: {
                morning_alarm: true,
                event_alarm: true,
                event_notification: true,
                traffic_alerts: true,
                weather_alerts: true,
            },
            maxMissedBus: '1',
        };
    
        // Set default values for events and daySchedule if not provided
        user.events = user.events || [];
        user.daySchedule = user.daySchedule || [];

        // no need to try/catch because error thrown here will be caught higher up e.g. in server.js
        const newUser = new UserModel(user);
        await newUser.save();
        return newUser;
    }

    // update preferences for user in database
    // ChatGPT usage: Partial
    async updatePreferences(username, preferences) {
        let userToUpdate = await UserModel.findOne({ username });
        if (!userToUpdate) return false;

        userToUpdate.preferences = deepMerge(userToUpdate.preferences, preferences);
        await userToUpdate.save();
        return true;
    }

    /*
    * Calendar Database calls
    */

    // add events (array) to calendar
    // ChatGPT usage: Partial
    async addEvents(username, events) {
        const user = await UserModel.findOne({ username });
        if (!user) return false;

        const coursePattern = /^[A-Za-z]{4}\d{3}/; // TODO update to relax regex condition
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
            for (let ue of user.events) {
                if (ue.eventName === e.eventName) included = true;
            }
            if (!included) newEvents.push(e);
        }
        user.events = [...user.events, ...newEvents];
        await user.save();
        return true;
	}

    // add day schedule to db
    // ChatGPT usage: Partial
    async addSchedule(username, schedule) {
        let user = await UserModel.findOne({ username });
        if (!user) throw new Error("No such user exists");

        user.daySchedule = schedule;
        await user.save();
    }

    /*
    * Message database calls
    */

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