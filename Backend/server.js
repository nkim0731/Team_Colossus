// Requires
const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Requires for defined interfaces
const Database = require('./Interfaces/Database.js');
const Session = require('./Interfaces/Session.js')
const { initializeSocketIo } = require('./Interfaces/Messaging.js');

const port = 8081;
const app = express();
const server = http.createServer(app);
// const httpsServer = https.createServer(credentials, app);

/*
* API calls and calls to/from frontend go here
*/
let db = new Database();
let login = new Session();

// Testing purposes only, delete later
const clientApp = path.join(__dirname, 'Client');
app.use(express.json())
app.use('/', express.static(clientApp, { extensions: ['html'] }));
// --------------------------------------

// login check for user
app.post('/login', async (req, res) => {
    let data = req.body;
    try {
        let user = await db.getUser(data.username);
        // password check logic
        if (user.password === data.password) {
            // proceed to main calendar application
            login.createSession(res, req.body.username); // create cookie session, might not need
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        } 
    } catch (e) {
        res.status(400).json({ message: e });
    }
})

// register a user
app.post('/register', async (req, res) => {
    // new account probably also need to input preferences
    let data = req.body;
    try {
        await db.addUser(data);
        res.status(200).json({ message: 'Register successful' });
    } catch (e) {
        res.status(400).json({ message: e });
    }
})

// Start server
server.listen(3000, () => console.log('Server started on port 3000'));
// httpsServer.listen(port, () => console.log('Server started on port ' + port));

initializeSocketIo(server);