// Requires
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Requires for defined interfaces
const Calendar = require('./Interfaces/Calendar.js');
const Scheduler = require('./Interfaces/Scheduler.js');
const ChatManager = require('./Interfaces/Messaging.js');
const db = require('./Databases/Database.js');

// For loading env variables
require('dotenv').config({ path: `${__dirname}/.env` });

//Import export variables from variables.js
const { isHttps, isTest, test_calendoDB } = require('./variables.js');

const app = express();
app.use(express.json());

var httpsServer = null;
if (isHttps) {
    const options = {
        key: fs.readFileSync('/home/CPEN321_admin/privkey.pem'),
        cert: fs.readFileSync('/home/CPEN321_admin/fullchain.pem'),
    };
    httpsServer = https.createServer(options, app);
}

const server = http.createServer(app); // HTTP server for testing 

const chatManager = new ChatManager(server); // start socketio service for groupchats (change this to HTTPS server TODO)

/*
* API calls and calls to/from frontend go here
*/

// handle signin (and register if first time login) with google account
app.post('/login/google', async (req, res) => {
    const data = req.body;
    try {
        const checkUser = await db.getUser(data.username);
        if (!checkUser) {
            await db.addUser(data); // first time google auth, add to db
            res.status(200).json({ result: 'register' });
        } else {
            res.status(200).json({ result: 'login' });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ result: e });
    }
})

// endpoint set/get preferences for user
app.route('/api/preferences')
.put(async (req, res) => {
    const data = req.body;
    try {
        await db.updatePreferences(data.username, data.preferences);
        res.status(200).json({ result: 'success' });
    } catch (e) {
        res.status(500).json({ result: e });
    }
})
.get(async (req, res) => {
    const username = req.query.user; // ?user=username
    try {
        const user = await db.getUser(username);
        res.status(200).send(user.preferences);
    } catch (e) {
        res.status(500).json({ result: e });
    }
})

/*
* Calendar API calls
*/

// get / add events to calendar
app.route('/api/calendar')
.get(async (req, res) => { // /api/calendar?user=username (or some sort of id, stored as session in frontend)
    const user = req.query.user;
    try {
        const events = await db.getCalendar(user);
        res.status(200).json({ 'events': events }); // send events array
    } catch (e) {
        res.status(500).json({ message: e });
    }
})
.post(async (req, res) => {
    const data = req.body;
    try {
        await db.addEvents(data.username, data.events);
        res.status(200).json({ message: 'Events add successful' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
});

// create day schedule on button press
app.route('/api/calendar/day_schedule')
.post(async (req, res) => {
    const data = req.body; // username, latitude, longitude
    try {
        const user = await db.getUser(data.username);
        const LatLng = `${data.latitude}, ${data.longitude}`;

        const schedule = await Scheduler.createDaySchedule(user.events, LatLng, user.preferences);
        await db.addSchedule(data.username, schedule);
        res.status(200).send(schedule);
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e });
    }
})
.get(async (req, res) => { // ?user=username
    try {
        const schedule = await db.getSchedule(req.query.user);
        res.status(200).send(schedule.daySchedule);
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

/*
* Group chats API calls
*/
app.get('/api/message_history', async (req, res) => {
    const chatName = req.query.chatName; // ?chatName=x 
    try {
        const messages = await db.getMessages(chatName);
        res.status(200).send(messages.messages);
    } catch (e) {
        res.status(500).json({ message: e });
    }
});

app.get('/api/chatrooms', async (req, res) => {
    const username = req.query.user; // ?user=x
    try {
        const calendar = await db.getCalendar(username);
        const courseEvents = calendar.events.filter(e => e.hasChat); // filter for only events with chats
        let myChatrooms = [];
        for (let e of courseEvents) {
            let chatroom = await db.getRoom(e.eventName);
            if (!chatroom) { // room null, not created yet
                chatroom = await db.createRoom(e.eventName);
            }
            myChatrooms.push(chatroom);
        }
        res.status(200).send(myChatrooms);
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

if (isHttps) {
    const port = 8081; // Standard HTTPS port
    
    httpsServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      host = "calendo.westus2.cloudapp.azure.com"

      console.log(`Server is running on https://${host}:${port}`);
    });
} else {
    server.listen(3000, '0.0.0.0', () => console.log(`Server started on localhost port 3000`));
}
