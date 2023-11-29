const mongoose = require('mongoose');
const deepMerge = require('deepmerge');

const userSchema = require('../Schema/userSchema');
const chatSchema = require('../Schema/chatSchema')

// models to interact with database collections
const UserModel = mongoose.model('user', userSchema);
const ChatModel = mongoose.model('chat', chatSchema);

// loading env variables
const path = require('path');
const envFilePath = path.join(__dirname ,'/../.env');
require('dotenv').config({ path: envFilePath });

const maxMessages = 5; // TODO set diff value for actual, low value for testing
var mongoURI = process.env.MONGO_URI;

class Database {
    constructor() {
        this.connect();
    }

    // ChatGPT usage: No
    async connect() {
        if (process.env.LOCAL_TEST === 'true' || process.env.LOCAL_TEST === 'True') {
            mongoURI = 'mongodb://localhost:27017/test_calendoDB';
        }
        if (process.env.TESTING === 'false' || process.env.TESTING === 'False' ) await mongoose.connect(mongoURI);
        console.log('Database class connected to MongoDB at: ' + mongoURI);
    }

    // Get data for user by username/email (unique)
    // ChatGPT usage: Partial
    async getUser(useremail) {
        if (await this.userExists(useremail) === false) {
            throw new Error("No such user exists");
        }
        let user = await UserModel.findOne({ username: useremail });
        return user;
        return user;
    }

    // Get user data by google auth id (no endpoint calls this)
    // ChatGPT usage: No
    // async getUserById(id) {
    //     if (await this.userExists(useremail) == false) {
    //         throw new Error("No such user exists");
    //     }
    //     let user = await UserModel.findOne({ userId: id });
    //     return user
    // }

    async userExists(useremail) {
        let user = await UserModel.findOne({ username: useremail });
        if (user == null) {
            return false;
        }
        return true;
    }
    
    async verifyUser(id_token, useremail, audience) {
        try {
            const ticket = await this.authClient.verifyIdToken({
                idToken: id_token
            });
            const payload = ticket.getPayload();

            if (payload) {
                let { aud, iss, exp, email } = payload;
        
                if (aud === audience
                    && (iss === 'accounts.google.com' || iss === 'https://accounts.google.com') 
                    && exp > Math.floor(Date.now() / 1000)
                    && email == useremail) 
                {
                    // hd++; 
                    // The ID token is valid and satisfies the criteria
                    console.log("\n id_token verified");
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.log(e);
            throw new Error("Error in verifyUser");
        };
    }

    // Function to update multiple token fields for a user
    async updateUserTokens(userEmail, tokensToUpdate) {
        const validTokens = ['access_token', 'id_token', 'google_token', 'refresh_token', 'expire_time'];

        // Validate token names
        for (const tokenName of Object.keys(tokensToUpdate)) {
            if (!validTokens.includes(tokenName)) {
                throw new Error(`Invalid token name: ${tokenName}`);
            }
        }

        // Check if user exists
        if (await this.userExists(userEmail) === false) {
            throw new Error("No such user exists");
        }

        // Prepare the update object
        const update = {};
        for (const [tokenName, tokenValue] of Object.entries(tokensToUpdate)) {
            update[tokenName] = tokenValue;
        }

        // Update the user document
        const updatedUser = await UserModel.findOneAndUpdate(
            { username: userEmail },
            { $set: update },
            { new: true }
        );

        return updatedUser;
        // Example usage:
        // await database.updateUserTokens('user@example.com', {
        //     access_token: 'newAccessToken',
        //     id_token: 'newIdToken'
        // });
    }

    // Function to get multiple token fields for a user
    async getUserTokens(userEmail, tokenFields) {
        const validTokens = ['access_token', 'id_token', 'google_token', 'refresh_token'];

        // Validate token field names
        for (const tokenField of tokenFields) {
            if (!validTokens.includes(tokenField)) {
                throw new Error(`Invalid token field: ${tokenField}`);
            }
        }

        // Check if user exists
        if (await this.userExists(userEmail) == false) {
            throw new Error("No such user exists");
        }

        // Find the user and select the requested token fields
        const user = await UserModel.findOne({ username: userEmail }).select(tokenFields.join(' '));

        // Extract and return the token fields
        const tokens = {};
        for (const field of tokenFields) {
            tokens[field] = user[field];
        }

        return tokens;
    }

    // Function to update multiple token fields for a user
    async updateUserTokens(userEmail, tokensToUpdate) {
        const validTokens = ['access_token', 'id_token', 'google_token', 'refresh_token', 'expire_time'];

        // Validate token names
        for (const tokenName of Object.keys(tokensToUpdate)) {
            if (!validTokens.includes(tokenName)) {
                throw new Error(`Invalid token name: ${tokenName}`);
            }
        }

        // Check if user exists
        if (await this.userExists(userEmail) === false) {
            throw new Error("No such user exists");
        }

        // Prepare the update object
        const update = {};
        for (const [tokenName, tokenValue] of Object.entries(tokensToUpdate)) {
            update[tokenName] = tokenValue;
        }

        // Update the user document
        const updatedUser = await UserModel.findOneAndUpdate(
            { username: userEmail },
            { $set: update },
            { new: true }
        );

        return updatedUser;
        // Example usage:
        // await database.updateUserTokens('user@example.com', {
        //     access_token: 'newAccessToken',
        //     id_token: 'newIdToken'
        // });
    }

    // Function to get multiple token fields for a user
    async getUserTokens(userEmail, tokenFields) {
        const validTokens = ['access_token', 'id_token', 'google_token', 'refresh_token'];

        // Validate token field names
        for (const tokenField of tokenFields) {
            if (!validTokens.includes(tokenField)) {
                throw new Error(`Invalid token field: ${tokenField}`);
            }
        }

        // Check if user exists
        if (await this.userExists(userEmail) == false) {
            throw new Error("No such user exists");
        }

        // Find the user and select the requested token fields
        const user = await UserModel.findOne({ username: userEmail }).select(tokenFields.join(' '));

        // Extract and return the token fields
        const tokens = {};
        for (const field of tokenFields) {
            tokens[field] = user[field];
        }

        return tokens;
        // Example usage:
        // const userTokens = await database.getUserTokens('user@example.com', ['access_token', 'id_token']);
    }

    // Add a new user to Users Database
    // ChatGPT usage: Partial
    async addUser(user) {
        if (user.username == null) return false;

        user.password = user.password || 'Register from Google';
    
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
        user.events = user.events || [];
        user.daySchedule = user.daySchedule || [];

        const newUser = new UserModel(user);
        await newUser.save();
        return true;
    }

    /**
     * Update preferences for user in database
     * ChatGPT usage: Partial
     * @param {String} username 
     * @param {Object} preferences object with preference field to update
     * @returns true on success, false on no user
     */
    async updatePreferences(username, preferences) {
        let userToUpdate = await UserModel.findOne({ username });
        if (!userToUpdate) return false;

        userToUpdate.preferences = deepMerge(userToUpdate.preferences, preferences);
        await userToUpdate.save();
        return true;
    }

    // get calendar events (this might not be needed anyway since we can get events from user in getUser)
    // ChatGPT usage: Partial
	async getCalendar(username) {
        if (await this.userExists(username) == false) {
            throw new Error("No such user exists");
        }
        return await UserModel.findOne({ username }).select('events');
	}

    // Function to update the calendar events for a user
    async updateCalendar(username, events) {
        // Check if the user exists
        if (await this.userExists(username) === false) {
            throw new Error("No such user exists");
        }

        // Update the events field for the user
        const updatedUser = await UserModel.findOneAndUpdate(
            { username: username },
            { $set: { events: events } },
            { new: true }
        );

        return updatedUser;
    }
	

    // add events (array) to calendar
    // ChatGPT usage: Partial
    async addEvents(username, events) {
        const user = await UserModel.findOne({ username });
        if (!user) return false;

        const coursePattern = /^[A-Z]{4}\d{3}/i;
        let newEvents = [];
        for (let e of events) {
            if (coursePattern.test(e.eventName)) e.hasChat = true;
            else e.hasChat = false;

            let included = false;
            for (let ue of user.events) {
                if (ue.eventName === e.eventName) included = true;
            }
            if (!included) newEvents.push(e);
        }
        user.events = [...user.events, ...newEvents];
        await user.save();
        return true;
	}

    /**
     * Add day schedule created by Scheduler to database
     * ChatGPT usage: Partial
     * @param {String} username 
     * @param {Array} schedule array of events with the optimal route to the event for a day
     * @returns true on success, false on no user
     */
    async addSchedule(username, schedule) {
        let user = await UserModel.findOne({ username });
        if (!user) return false;

        user.daySchedule = schedule;
        await user.save();
        return true;
    }

    /**
     * Create a chat room with name chatName
     * ChatGPT usage: Partial
     * @param {String} chatName 
     * @returns The created chat room
     */
    async createRoom(chatName) {
        const newRoom = new ChatModel({ chatName, messages: [] });
        const room = await newRoom.save();
        return room;
    }

    /**
     * Get a chatroom by name
     * ChatGPT usage: No
     * @param {String} chatName 
     * @returns chatRoom Object with name, and messages array
     */
    async getRoom(chatName) {
        return await ChatModel.findOne({ chatName });
    }

    /**
     * Add a message object to chatroom in database
     * ChatGPT usage: Partial
     * @param {String} chatName 
     * @param {Object} message object with message string, sender, and timestamp
     */
    async addMessage(chatName, message) {
        let chatDocument = await ChatModel.findOne({ chatName });
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