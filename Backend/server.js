// Requires
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

// Requires for defined interfaces
const Session = require('./Interfaces/Session.js');
const Calendar = require('./Interfaces/Calendar.js');
const Scheduler = require('./Interfaces/Scheduler.js');

const ChatManager = require('./Interfaces/Messaging.js');
const db = require('./Databases/Database.js');

const app = express();
var isHttps = false;

if (isHttps) {

    // Load the SSL/TLS certificate and private key
    const privateKey = fs.readFileSync('keys/ssl/key.pem', 'utf8');
    const certificate = fs.readFileSync('keys/ssl/cert.pem', 'utf8');
    const credentials = { key: privateKey, cert: certificate };

    const httpsServer = https.createServer(credentials, app);
}

const server = http.createServer(app); // HTTP server for testing 

const chatManager = new ChatManager(server); // start socketio service for groupchats change this to HTTPS once implemented

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




//Universal mongoDB instantiation and other help code (used by So)
var isTest = true;
exports.isTest = isTest;

var mongoURI = null
if (isTest) {
  mongoURI = 'mongodb://localhost:27017/test_calendoDB';
} else {
  // For actual project deployment
  mongoURI = 'mongodb://localhost:27017/calendoDB';
}

// Create connection for calendoDB
// This URL should be the same as the db connection created in the Database.js
const testDB = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Store data in app.locals
app.locals.mongoDB = testDB;


app.get('/', async (req, res) => {
    res.send('Hello, World');
});


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
    // if (isTest) {console.log('req.body : ', req.body);}
    // if (isTest) {console.log('data.username : ', data.username);}

    try {
        let checkUser = await db.getUser(data.username);
        if (checkUser !== false) {
            res.status(400).json({ message: 'Username/Email already exists' });
            console.log(checkUser);
        } else {
            console.log('/register : adding a new user');
            result = await db.addUser(data);
            res.status(200).json(result);
        }
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

/*
* Calendar API calls
*/

// import events to calendar array using oauth2.0 token
app.post('/api/calendar/import', async (req, res) => {
    const data = req.body; // oauth2.0 token, username
    try {
        let events = await calendar.importCalendar(data.token);
        await db.addEvents(data.username, events); // update database with imported events
        events = await db.getCalendar(data.username);
        res.status(200).json({ 'events': events }); // send updated events to reload frontend
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

// get / add events to calendar
app.route('/api/calendar')
.get(async (req, res) => { // /api/calendar?user=username (or some sort of id, stored as session in frontend)
    const user = req.query.user; // or can use login.getUser(login.parseCookies(req)['cpen321-session'])
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
    const data = req.body; // needs username, location (origin), and preferences
    try {
        const calendar = db.getCalendar(data.username);
        const schedule = await Scheduler.createDaySchedule(calendar.events, data.location, preferences);
        await db.updateSchedule(data.username, schedule);
        res.status(200).json({ schedule: schedule });
    } catch (e) {
        res.status(500).json({ message: e });
    }
})
.get(async (req, res) => { // ?user=username
    try {
        const schedule = await db.getSchedule(req.query.user);
        res.status(200).json({ schedule: schedule });
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

/*
* Group chats API calls
*/
app.get('/api/message_history', async (req, res) => {
    console.log('getting message history')
    const chatName = req.query.chatName; // ?chatName=x 
    try {
        const messages = await db.getMessages(chatName);
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
    - This identifies the user

    "commute_method": ["bus", "car"],
    - options are only bus, car, and bicycle, user can choose one or more

    "traffic_alerts": true,
    - If the user choses bus and car, this would give them notification about the traffic with/without alarm

    "preparation_time": "30 minutes",

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

// Use the API routes from User.js
const userRoutes = require('./Interfaces/User'); // Replace with your actual path
app.use('/api/users', userRoutes);


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


/*
Smart Navigation system
Description: This module would implement google maps API and handle alarm schedules for each event. It needs to have following features
1) ask the user what transit is preferred for the every first even in the upcoming week after importing the google calendar data.
2) ask the user what mode of transportation would be used for getting inbetween every other event in a upcoming week.
3) Optimize API calls to google maps or other external API services when calculating transit time, nevigation, and routes
4) NOT YET : Store and cache the past history of all google maps API calls, past history of time taken for getting ready in the morning, and GPS_location travel data to create a smart navigation time prediction.
*/

// Use the smart navigation router
const smartNavigateRouter = require('./Interfaces/smartNavigate');
app.use('/api/smartNavigate', smartNavigateRouter);

// Add your other routes and middleware here

app.get('/', (req, res) => {
  res.send('Hello, Welcome to Calendo!');
});


var port = null;
if (isHttps) {
    port = 443; // Standard HTTPS port
    
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      const host = "20.64.250.110"
      const port = serverApp.address().port;

      console.log(`Server is running on https://${host}:${port}`);
    });
} else {
    // Start server
    port = process.env.PORT || 3000;

    server.listen(port, '0.0.0.0', () => console.log('Server started on port 3000')); // needs to be server.listen or sockets stop working

    // const serverApp = app.listen(port, () => {
    //     const host = "localhost"
    //     const port = serverApp.address().port;

    //     console.log(`Server is running on http://${host}:${port}`);
    // });
}
