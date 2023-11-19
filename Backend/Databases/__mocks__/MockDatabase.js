/* Mock database to simulate Database.js */
const deepMerge = require('deepmerge');

const maxMessages = 5; // update this as needed

class MockDatabase {
    constructor() {
        this.users = {};
        this.chats = {};
    }

    async getUser(useremail) {
        if (useremail === 'baduser') throw new Error('Test DB issue'); // simulate error with db (findOne fails for some reason)
        return this.users[useremail] || null;
    }
    
    async addUser(user) {
        if (user.password === undefined) {
            user.password = 'Register from Google';
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

        this.users[user.username] = user;
        return user;
    }

    async updatePreferences(user, preferences) {
        if (!this.users[user.username]) throw new Error("No user found");
        this.users[user.username].preferences = deepMerge(this.users[user.username].preferences, preferences);

        return this.users[user.username];
    }

	async getCalendar(username) {
        return this.users[username].events;
	}

    async addEvents(username, events) {
        const coursePattern = /^[A-Za-z]{4}\d{3}/;
        let newEvents = [];
        for (let e of events) {
            if (coursePattern.test(e.eventName)) {
                e.hasChat = true;
            } else {
                e.hasChat = false;
            }
            let included = false;
            for (let ue of this.users[username].events) {
                if (ue.eventName === e.eventName) included = true;
            }
            if (!included) newEvents.push(e);
        }
        this.users[username].events = [...this.users[username].events, ...newEvents];

        return this.users[username].events;
	}

    async addSchedule(username, schedule) {
        this.users[username].daySchedule = schedule;
        return this.users[username].daySchedule;
    }

    async getSchedule(username) {
        return this.users[username].daySchedule;
    }

    async getMessages(chatName) {
        return this.chats[chatName].messages;
    }

    async createRoom(chatName) {
        const room = { chatName, messages: [] };
        return this.chats[chatName] = room;
    }

    async getRoom(chatName) {
        return this.chats[chatName];
    }

    async addMessage(chatName, message) {
        if (!this.chats[chatName]) {
            this.chats[chatName] = { chatName, messages: [] };
        }
        this.chats[chatName].messages.unshift(message);
        if (this.chats[chatName].messages.length > maxMessages) {
            this.chats[chatName].messages.pop();
        }
        return this.chats[chatName].messages;
    }
}

module.exports = new MockDatabase();