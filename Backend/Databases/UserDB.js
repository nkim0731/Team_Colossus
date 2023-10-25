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
// const UserModel = mongoose.model('User', userSchema);

class UserDB {
    constructor() {
        this.db = null;
        this.model = null;
        this.connect();
    }

    async connect() {
        try {
            this.db = await mongoose.createConnection('mongodb://localhost:27017/cpen321'); // can probably rename to 'users'
            this.model = this.db.model('User', userSchema);

            console.log('Connected to User MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
        }
    }

    // Get data for user by username/email (unique)
    async getUser(username) {
        try {
            // return await UserModel.findOne({ username: username });
            return await this.model.findOne({ username: username });
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
            // const newUser = new UserModel(user);
            const newUser = new this.model(user);

            // UserModel.create(user);
            await newUser.save();
        } catch (e) {
            console.log('Error: ' + e);
        }
    }

    // get calendar events
	async getCalendar(username) {
		try {
			return await this.model.findOne({ username }).select('events');
		} catch (e) {
			console.log('Error: ' + e);
		}
	}

    // add events (array) to calendar
    async addEvents(username, events) {
		try {
            // TODO check if event already exists before adding
			await this.model.updateOne(
                { 'username': username },
                { $push: { events: { $each: events } } }
            );
		} catch (e) {
			console.log('Error: ' + e);
		}
	}
}

module.exports = new UserDB();