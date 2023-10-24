/*
* Database interface functions
*/
const { MongoClient, ObjectId } = require('mongodb');

class Database {
	constructor() {
		this.userDb = null;
		this.messagesDb = null;
		// this.calendarDb = null;
		this.connect();
	}
	
	async connect() {
		const uri = 'mongodb://localhost:27017';
		const client = new MongoClient(uri);

		try {
			await client.connect();
			this.userDb = client.db('cpen321'); // probably should rename to "users"
			this.messagesDb = client.db('messages');
			// this.calendarDb = client.db('calendar');

			console.log('Connected to MongoDB');
		} catch (err) {
			console.error('MongoDB connection error:', err);
		}
	}

	/*
	* Define DB methods below, call in server.js with db.methodName(parameters)
	*/

	// Get data for user by username/email (unique)
	async getUser(username) {
		try {
			let result = await this.userDb.collection('users').findOne({ "username": username });
			return result;
		} catch (e) {
			console.log('Error: ' + e);
		}
	}

	// Add a user to Users Database and associated calendar to calendars collection
	async addUser(user) {
		try {
			user.preferences = { // default values user preferences
				'mode': "none", // prefered mode of transport (none, walk, car, public transit)
				'preptime': 1, // time needed to prepare (hours)
			}
			let calendarObj = {
				'username': user.username, // if google auth register, username = email
				'events': [],
			}
			await this.userDb.collection('users').insertOne(user);
			await this.userDb.collection('calendars').insertOne(calendarObj);
		} catch (e) {
			console.log('Error: ' + e);
		}
	}

	// get calendar events
	async getCalendar(username) {
		try {
			let calendar = await this.userDb.collection('calendars').findOne({ "username": username });
			return calendar;
		} catch (e) {
			console.log('Error: ' + e);
		}
	}

	// add events (array) to calendar
	async addEvents(username, events) {
		try {
			let calendar = await this.userDb.collection('calendars').findOne({ "username": username });

			// TODO check if event already exists before adding
			await this.userDb.collection('calendars').updateOne(
				{"username": username},
				{$set: {"events": [...calendar.events, ...events]} },
			);
		} catch (e) {
			console.log('Error: ' + e);
		}
	}
}

module.exports = Database;