// Requires
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const socketIO = require('socket.io');

// Requires for defined interfaces
const Session = require('./Interfaces/Session.js');
const Calendar = require('./Interfaces/Calendar.js');
const Scheduler = require('./Interfaces/Scheduler.js');

const ChatManager = require('./Interfaces/Messaging.js');
const db = require('./Databases/Database.js');

const app = express();
const server = http.createServer(app);
// const httpsServer = https.createServer(credentials, app);

const chatManager = new ChatManager(server); // start socketio service for groupchats

/*
* API calls and calls to/from frontend go here
*/
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
        res.status(500).json({ message: e });
    }
})

// register a user (also do this with google auth except only on first time)
app.post('/register', async (req, res) => {
    // new account probably also need to input preferences
    let data = req.body; // req.body.username = email if google auth
    try {
        let checkUser = await db.getUser(data.username);
        if (checkUser !== null) {
            res.status(400).json({ message: 'Username/Email already exists' });
        } else {
            await db.addUser(data);
            res.status(200).json({ message: 'Register successful' });
        }
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

/*
* Calendar API calls
*/
app.get('/api/calendar/import', async (req, res) => {
    const token = req.body.token; // users access token from oauth2.0
    try {
        let events = await calendar.importCalendar(token); // import calendar from google with token
        await db.addEvents(req.body.username, events); // update database with imported events
        res.status(200).json({ 'events': events });
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

/*
* Group chats API calls
*/
app.get('/api/message_history', async (req, res) => {
    console.log('getting message history')
    const chatID = req.query.chatName; // ?chatID=x 
    try {
        const messages = await db.getMessages(chatID);
        res.status(200).send(messages);
    } catch (e) {
        res.status(500).json({ message: e });
    }
});

app.get('/api/chatrooms', async (req, res) => {
    try {
        const rooms = await db.getRooms();
        res.status(200).json({ rooms: rooms });
    } catch (e) {
        res.status(500).json({ message: e });
    }
})



/*
User preferences

GET /api/users/:email/preferences
Description : allows the frontend to manage the preferences data of the user. (we shouldnt put email in the URL, so we can use user ID instead)
Return : returns json with fields
    "user_email": "CPEN321@gmail.com",

    "default_commute_method": ["bus", "car"],
    - options are only bus, car, and bicycle, user can choose one or more

    "default_traffic_alerts": true,
    - If the user choses bus and car, this would give them notification about the traffic with/without alarm

    "default_preparation_time": "30 minutes",

    "notification_preferences": {
        "morning_alarm": true,
        - alarm for the first event in calendar in the morning until 12PM, if there is only an event in the evening, it will not alarm
        "event_alarm": true,
        - If this is off, we will not use adaptive alarm system
        "event_notification": true,
        - this is for notification that will be deployed prior to the event such that user arrive to the event on time
        "traffic_alerts": true,
        "weather_alerts": true
        - This will let user know of delays and the condition of the weather for all the day, like if its rainy need an umbrella etc
    },
    - 

    "maxMissedBus" : "1",
    - default number of buses that can be missed, and still arrive destination on time, if the user sets an event as important, then this will be increased by 1

    "home_location": "123 Main St, Your City",
    "school_location": "4566 Main Mall, Vancouver",
    "work_location": "456 Business Ave, Your City",
    "snooze_duration": "10 minutes",
    - We do this for users who cannot wake up to a single alarm,
    "vibration_alert": true
    - option for vibration for alarm and notification
*/


/*
Adaptive Alarm system related API calls

POST /api/users/:email/adalarm/trigger
Description: this returns boolean to let the app know if we should trigger alarm or not
Input: 
    "GPS_location": [
        "latitude": 37.7749, // The latitude of the user's current location
        "longitude": -122.4194 // The longitude of the user's current location
    ]   
    "noise_level": 5
    - measure noise level from the audio from level 1 to 10
    "phone_in_use": true,
Returns: 
    "trigger": true
    "feedback_ID": 1234
    - if the backend thinks its suitable for alarm, trigger alarm


PUT /api/users/:email/adalarm/trigger
Description: this returns boolean to let the app know if we should trigger alarm or not
Input: 
    "feedback_ID" : 1234
    - this links to the return of POST request of the trigger, use the same ID so that backend can learn if it was a good decision or not
    "feedback": true
    - true or false, false means user disliked the alarm
Returns: 
    "sucess": feedback successfully registered.

*/

// Start server
const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => console.log('Server started on port 3000'));
// httpsServer.listen(port, () => console.log('Server started on port ' + port));