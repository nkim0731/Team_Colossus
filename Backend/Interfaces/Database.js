/*
* Database interface functions
*/
const { MongoClient, ObjectId } = require('mongodb');

class Database {
	constructor() {
		this.db = null;
		this.connect();
	}
	
	async connect() {
		const uri = 'mongodb://localhost:27017';
		const client = new MongoClient(uri);

		try {
			await client.connect();
			this.db = client.db('cpen321'); // database name here
			console.log('Connected to MongoDB');
		} catch(err) {
			console.error('MongoDB connection error:', err);
		}
	}

	// define DB methods
	async addUser(user) {
		try {
			await this.db.collection('users').insertOne(user);
		} catch(e) {
			console.log('Error: ' + e);
		}
	}
}

module.exports = Database;