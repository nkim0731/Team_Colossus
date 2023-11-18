// Requires
const express = require('express');
// const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Requires for defined interfaces
const Scheduler = require('./Interfaces/Scheduler.js');
const db = require('./Databases/Database.js');

// For loading env variables
const path = require('path');

const envFilePath = path.join(__dirname, '.env');
require('dotenv').config({ path: envFilePath });

//const mongoURI = process.env.MONGODB_URI;

//Import export variables from variables.js
// const { isHttps, isTest, test_calendoDB } = require('./variables.js');

const app = express();
app.use(express.json());

// var httpsServer = null;
// if (isHttps) {
//     const options = {
//         key: fs.readFileSync('/home/CPEN321_admin/privkey.pem'),
//         cert: fs.readFileSync('/home/CPEN321_admin/fullchain.pem'),
//     };
//     httpsServer = https.createServer(options, app);
// }

const options = {
    key: fs.readFileSync('/home/CPEN321_admin/privkey.pem'),
    cert: fs.readFileSync('/home/CPEN321_admin/fullchain.pem'),
};
const httpsServer = https.createServer(options, app);

// const server = http.createServer(app); // HTTP server for testing 

// Start socket io service for group chats
require('./Interfaces/Messaging.js')(httpsServer);


// DO NOT DELETE THIS
// Important header parser middleware for user verification and sign in 
app.use((req, res, next) => {
    // Log a message to indicate that the middleware is running
    console.log('Middleware for extracting access token from the header is running!');

    const id_token = req.headers['id_token'];
    const refresh_token = req.headers['refresh_token'];

    req.id_token = id_token; // Attach the token to the request object
    req.refresh_token = refresh_token; // Attach the token to the request object

    console.log("\nExtracted id_token : " + id_token);
    console.log("Extracted refresh_token : " + refresh_token + "\n");
    if (authHeader) {
        const access_token = authHeader.split(' ')[1];
        const refresh_token = authHeader.split(' ')[2]; 
        req.headerParser.access_token = access_token; // Attach the token to the request object
        req.headerParser.refresh_token = refresh_token; // Attach the token to the request object
        console.log("req.access_token", req.access_token);
    }
    next(); // Continue to the next middleware or route
  });



/*
* API calls and calls to/from frontend go here
*/

// handle signin (and register if first time login) with google account
// ChatGPT usage: Partial
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
// ChatGPT usage: Partial
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
// ChatGPT usage: No
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
// ChatGPT usage: Partial
app.route('/api/calendar')
.get(async (req, res) => { // /api/calendar?user=username
    const useremail = req.query.user;
    const id_token = req.headerParser.id_token;
    try {
        if (!db.verifyUser(id_token, useremail, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
        const events = await db.getCalendar(user);
        res.status(200).send(events.events); // send events array
    } catch (e) {
        res.status(500).json({ message: e });
    }
})
// ChatGPT usage: No
.post(async (req, res) => {
    const data = req.body;
    const useremail = data.username;
    const id_token = req.headerParser.id_token;
    try {
        if (!db.verifyUser(id_token, useremail, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
        await db.addEvents(data.username, data.events);
        res.status(200).json({ message: 'Events add successful' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
});

// get calendar events by a specific day
// ChatGPT usage: Partial
app.get('/api/calendar/by_day', async (req, res) => { // ?user=username&day=date
    const useremail = req.query.user;
    const id_token = req.headerParser.id_token;
    const day = new Date(req.query.day + " 10:10:10");
    try {
        if (!db.verifyUser(id_token, useremail, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
        const calendar = await db.getCalendar(user);
        const dayEvents = calendar.events.filter(e => {
            const eventDate = new Date(e.start);
            return (
                eventDate.getDate() === day.getDate() &&
                eventDate.getMonth() === day.getMonth() &&
                eventDate.getFullYear() === day.getFullYear()
            );
        })
        res.status(200).send(dayEvents);
    } catch (e) {
        res.status(500).json({ message: e });
    }
}) 

// create day schedule on button press
// ChatGPT usage: Partial
app.route('/api/calendar/day_schedule')
.post(async (req, res) => {
    const data = req.body; // username, latitude, longitude
    const id_token = req.headerParser.id_token;
    const useremail = data.username;
    try {
        if (!db.verifyUser(id_token, useremail, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
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
// ChatGPT usage: No
.get(async (req, res) => { // ?user=username
    const useremail = data.username;
    const id_token = req.headerParser.id_token;
    try {
        if (!db.verifyUser(id_token, useremail, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
        const schedule = await db.getSchedule(req.query.user);
        res.status(200).send(schedule.daySchedule);
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e });
    }
    
})

/*
* Group chats API calls
*/
// ChatGPT usage: Partial
app.get('/api/message_history', async (req, res) => {
    const chatName = req.query.chatName; // ?chatName=x 
    try {
        const messages = await db.getMessages(chatName);
        res.status(200).send(messages.messages);
    } catch (e) {
        res.status(500).json({ message: e });
    }
});

// ChatGPT usage: Partial
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
});


const port = 8081; // Standard HTTPS port
const host = "calendo.westus2.cloudapp.azure.com";
    
httpsServer.listen(port, () => { console.log(`Server is running on https://${host}:${port}`); });