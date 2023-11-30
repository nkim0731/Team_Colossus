const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const Scheduler = require('./Interfaces/Scheduler.js');
const GoogleCalendar = require('./Interfaces/GoogleCalendar.js');
const db = require('./Databases/Database.js');

const envFilePath = path.join(__dirname, '.env');
require('dotenv').config({ path: envFilePath });

const app = express();
app.use(express.json());

// const options = {
//     key: fs.readFileSync('/home/CPEN321_admin/privkey.pem'),
//     cert: fs.readFileSync('/home/CPEN321_admin/fullchain.pem'),
// };
// const httpsServer = https.createServer(options, app);
const server = http.createServer(app); // HTTP server for testing 

// Start socket io service for group chats
// require('./Interfaces/Messaging.js')(httpsServer);
require('./Interfaces/Messaging.js')(server);

// handle signin (and register if first time login) with google account
// ChatGPT usage: Partial
app.post('/login/google', async (req, res) => {
    const data = req.body;
    try {
        const user = await db.getUser(data.username);
        if (!user) {
            const addResult = await db.addUser(data);
            if (!addResult) return res.status(404).json({ error: "Tried to add null user" });

            res.status(200).json({ result: 'register' });
        } else {
            res.status(200).json({ result: 'login' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
})

// endpoint to import google calendar
app.post('/api/calendar/import', async (req, res) => {
    const username = req.body.username;
    const authCode = req.body.auth_code;
    const calendarInstance = new GoogleCalendar();
    try {
        const events = await calendarInstance.getCalendarEvents(authCode);
        await db.addEvents(username, events);
        res.status(200).json({ result: 'success' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// endpoint set/get preferences for user
app.route('/api/preferences')
// ChatGPT usage: No
.get(async (req, res) => {
    const username = req.query.user; 
    try {
        const user = await db.getUser(username);
        if (!user) return res.status(404).json({ error: "No such user exists" });

        res.status(200).send(user.preferences);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
})
// ChatGPT usage: No
.put(async (req, res) => {
    const data = req.body;
    try {
        const updateResult = await db.updatePreferences(data.username, data.preferences);
        if (!updateResult) return res.status(404).json({ error: "No such user exists" });

        res.status(200).json({ result: 'success' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// add events to the users calendar events array
// ChatGPT usage: Partial
app.post('/api/calendar', async (req, res) => {
    const data = req.body;
    try {
        const eventAddResult = await db.addEvents(data.username, data.events);
        if (!eventAddResult) return res.status(404).json({ message: 'No user for username: ' + data.username });
        
        res.status(200).json({ message: 'Events add successful' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// get calendar events by a specific day
// ChatGPT usage: Partial
app.get('/api/calendar/by_day', async (req, res) => { // ?user=username&day=date
    const username = req.query.user;
    const day = new Date(req.query.day + " 10:10:10");
    try {
        const user = await db.getUser(username);
        if (!user) return res.status(404).json({ message: 'No user for username: ' + username });

        const dayEvents = user.events.filter(e => {
            const eventDate = new Date(e.start);
            return (
                eventDate.getDate() === day.getDate() &&
                eventDate.getMonth() === day.getMonth() &&
                eventDate.getFullYear() === day.getFullYear()
            );
        })
        res.status(200).send(dayEvents);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}) 

// create day schedule on button press
app.route('/api/calendar/day_schedule')
// ChatGPT usage: Partial
.post(async (req, res) => {
    const data = req.body; // username, latitude, longitude
    try {
        const user = await db.getUser(data.username);
        if (!user) return res.status(404).json({ message: 'No user for username: ' + data.username });

        const LatLng = `${data.latitude}, ${data.longitude}`;

        const schedule = await Scheduler.createDaySchedule(user.events, LatLng, user.preferences);
        await db.addSchedule(data.username, schedule);
        res.status(200).send(schedule);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
})
// ChatGPT usage: No
.get(async (req, res) => { // ?user=username
    try {
        const user = await db.getUser(req.query.user);
        if (!user) return res.status(404).json({ message: 'No user for username: ' + data.username });

        res.status(200).send(user.daySchedule);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
    
})

// ChatGPT usage: Partial
app.get('/api/message_history', async (req, res) => {
    const chatName = req.query.chatName; // ?chatName=x 
    try {
        const room = await db.getRoom(chatName);
        res.status(200).send(room.messages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ChatGPT usage: Partial
app.get('/api/chatrooms', async (req, res) => {
    const username = req.query.user; // ?user=x
    try {
        const user = await db.getUser(username);
        const courseEvents = user.events.filter(e => e.hasChat);
        let myChatrooms = [];
        for (let e of courseEvents) {
            let chatroom = await db.getRoom(e.eventName);
            if (!chatroom) {
                chatroom = await db.createRoom(e.eventName);
            }
            myChatrooms.push(chatroom);
        }
        res.status(200).send(myChatrooms);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const port = 8081; // Standard HTTPS port
const host = "calendo.westus2.cloudapp.azure.com";
    
// httpsServer.listen(port, () => { console.log(`Server is running on https://${host}:${port}`); });
server.listen(3000, () => console.log('Server started on port 3000'));

module.exports = server;