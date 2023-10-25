// Requires
const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Requires for defined interfaces
const Database = require('./Interfaces/Database.js');
const Session = require('./Interfaces/Session.js');
const Calendar = require('./Interfaces/Calendar.js');
const { initializeSocketIo } = require('./Interfaces/Messaging.js');

const UserDB = require('./Databases/UserDB.js');
const MessageDB = require('./Databases/MessageDB.js');

const port = 8081;
const app = express();
const server = http.createServer(app);
// const httpsServer = https.createServer(credentials, app);

/*
* API calls and calls to/from frontend go here
*/
// let db = new Database();
let login = new Session();
let calendar = new Calendar();

// Testing purposes only, delete later
const clientApp = path.join(__dirname, 'Client');
app.use(express.json())
app.use('/', express.static(clientApp, { extensions: ['html'] }));
// --------------------------------------

// login check for user
app.post('/login', async (req, res) => {
    let data = req.body;
    try {
        let user = await UserDB.getUser(data.username);
        // password check logic
        if (user.password === data.password) {
            // proceed to main calendar application
            login.createSession(res, req.body.username); // create cookie session, might not need
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        } 
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

// register a user (also do this with google auth except only on first time)
app.post('/register', async (req, res) => {
    // new account probably also need to input preferences
    let data = req.body; // req.body.username = email if google auth
    try {
        let checkUser = await UserDB.getUser(data.username);
        if (checkUser !== null) {
            res.status(400).json({ message: 'Username/Email already exists' });
        } else {
            await UserDB.addUser(data);
            res.status(200).json({ message: 'Register successful' });
        }
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

// import calendar and update calendar database
app.get('/api/calendar/import', async (req, res) => {
    const token = req.body.token; // users access token from oauth2.0
    try {
        let events = await calendar.importCalendar(token); // import calendar from google with token
        await UserDB.addEvents(req.body.username, events); // update database with imported events
        res.status(200).json({ 'events': events });
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

// Start server
server.listen(3000, () => console.log('Server started on port 3000'));
// httpsServer.listen(port, () => console.log('Server started on port ' + port));

initializeSocketIo(server);