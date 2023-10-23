/*
* Database interface functions
*/
const { MongoClient, ObjectId } = require('mongodb');

class Database {
	constructor() {
		this.db = null;
		this.messagesDb = null;
		this.connect();
	}
	
	async connect() {
		const uri = 'mongodb://localhost:27017';
		const client = new MongoClient(uri);

		try {
			await client.connect();
			this.db = client.db('cpen321'); // database name here, can probably rename
			this.messagesDb = client.db('messages');

			console.log('Connected to MongoDB');
		} catch (err) {
			console.error('MongoDB connection error:', err);
		}
	}

	/*
	* Define DB methods below, call in server.js with db.methodName(parameters)
	*/

	// Get data for user by username (unique)
	async getUser(username) {
		try {
			let result = await this.db.collection('users').findOne({ "username": username });
			return result;
		} catch (e) {
			console.log('Error: ' + e);
			return null;
		}
	}

	// Add a user to Users Database
	async addUser(user) {
		try {
			this.db.collection('users').insertOne(user);
		} catch (e) {
			console.log('Error: ' + e);
		}
	}
}

module.exports = Database;