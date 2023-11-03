// Requires
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const moment = require('moment');

// For google auth
const { google } = require('googleapis');

// Requires for defined interfaces
const Session = require('./Interfaces/Session.js');
const Calendar = require('./Interfaces/Calendar.js');
const Scheduler = require('./Interfaces/Scheduler.js');

const ChatManager = require('./Interfaces/Messaging.js');
const db = require('./Databases/Database.js');

// For loading env variables
require('dotenv').config({ path: `${__dirname}/.env` });

// Schemas needed for db
const userSchema = require('./Schema/userSchema');
const chatSchema = require('./Schema/chatSchema');


const app = express();
var isHttps = false; // TODO revert this back to true dont forget lol

var httpsServer = null
if (isHttps) {
    const options = {
        key: fs.readFileSync('/home/CPEN321_admin/privkey.pem'), // Path to your private key
        cert: fs.readFileSync('/home/CPEN321_admin/fullchain.pem'), // Path to your certificate
    };

    httpsServer = https.createServer(options, app);
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

var port = 8081;
var host = "calendo.westus2.cloudapp.azure.com";

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

// models to interact with database collections
const User = testDB.model('user', userSchema);

// Store data in app.locals
app.locals.mongoDB = testDB;



/*
Everything related to Google API
*/
const googleAPIKey = process.env.GOOGLE_API_KEY;
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
)

const googleCalendar = google.calendar({
    version : "v3",
    auth : googleAPIKey
});


const googleUser = google.oauth2({
    version : "v2",
    auth : googleAPIKey
});


// generate a url that asks permissions for Blogger and Google Calendar scopes
const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email'
];

// Generate a url that asks permissions for the two scopes defined above
const authorizationUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
    /** Pass in the scopes array defined above.
         * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
    scope: scopes,
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true
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

// handle signin with google account
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

// register a user 
app.post('/register', async (req, res) => {
    const data = req.body;
    try {
        let checkUser = await db.getUser(data.username);
        if (checkUser !== false) {
            res.status(400).json({ message: 'Username/Email already exists' });
        } else {
            console.log('/register : adding a new user');
            await db.addUser(data);
            res.status(200).json({ result: 'register' });
        }
    } catch (e) {
        res.status(500).json({ message: e });
    }
})

// endpoint set preferences and update database
app.put('/api/preferences', async (req, res) => {
    const data = req.body;
    try {
        await db.updatePreferences(data.username, data.preferences);
        res.status(200).json({ result: 'success' });
    } catch (e) {
        res.status(500).json({ result: e });
    }
})

/*
* Calendar API calls
*/

// This is redirected from /auth/google and /auth/google/token path so do not make CHANGES!
app.get('/api/calendar/import', async (req, res) => {
    const useremail = req.query.useremail;
    const now = moment();
    const sevenDaysFromNow = moment().add(7, 'days');


    try {
        const calendarEvents = await googleCalendar.events.list({
            calendarId: 'primary',
            auth: oauth2Client,
            timeMin: now.toISOString(),
            timeMax: sevenDaysFromNow.toISOString(),
            maxResults: 30,
            singleEvents: true,
            orderBy: 'startTime'
        });

        //console.log(calendarEvents);
        const extractedEvents = [];
        for (const event of calendarEvents.data.items) {
            const extractedEvent = {
                eventID: event.id,
                summary: event.summary,
                description: event.description,
                creator_email: event.creator.email,
                status: event.status,
                kind: event.kind,
                location: event.location,
                start: event.start.dateTime,
                start_timeZone: event.start.timeZone,
                end: event.end.dateTime,
                end_timeZone: event.end.timeZone,
                // Add more fields you want to extract here
            };

            extractedEvents.push(extractedEvent);
        };

        result = await User.findOneAndUpdate({ username: useremail }, { $set: { events: extractedEvents } });

        res.status(200).json({ 'events' : result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching calendar events' });
    }
});

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
    const data = req.body; // needs username, location (origin)
    try {
        const user = db.getUser(data.username);
        const schedule = await Scheduler.createDaySchedule(user.events, data.location, user.preferences);
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

// API endpoint to get calendar data for a user by email
app.get('/api/calendar', async (req, res) => {
    const useremail = req.query.useremail;

    try {
        // Find the user by their email
        const user = await User.findOne({ username: useremail });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Retrieve the calendar events from the user's data
        const calendarEvents = user.events;

        if (!calendarEvents) {
            return res.status(404).json({ message: 'No calendar events found for this user' });
        }

        res.status(200).json({ events: calendarEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching calendar events' });
    }
});

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
const smartNavigateRouter = require('./Interfaces/SmartNavigate');
app.use('/api/smartNavigate', smartNavigateRouter);





// Middleware to extract the access token
app.use((req, res, next) => {
    // Log a message to indicate that the middleware is running
    console.log('Middleware is running!');

    const authHeader = req.headers['authorization'];
    if (authHeader) {
        console.log("middleware authHeader", authHeader);
      const access_token = authHeader.split(' ')[1]; // Split and get the token after "Bearer"
      const refresh_token = authHeader.split(' ')[2]; 
      req.access_token = access_token; // Attach the token to the request object
      req.refresh_token = refresh_token; // Attach the token to the request object
      console.log("req.access_token", req.access_token);
    }
    next(); // Continue to the next middleware or route
  });

const refreshTokenIfNecessary = async (userEmail) => {
    const user = await User.findOne({ username: userEmail });

    if (user) {
        const currentTime = Date.now() / 1000;
        if (user.token.expiry_date < currentTime) {
            // Access token has expired; use the refresh token to obtain a new access token
            const { token } = await oauth2Client.refreshToken(user.refresh_token);
            oauth2Client.setCredentials(token);
        }
    }
};

const getUserToken = async (userEmail) => {
    // Define a regex pattern for a basic email format
    // const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    // // Check if the userEmail matches the email regex pattern
    // if (!emailRegex.test(userEmail)) {
    //     // If it doesn't match, return null
    //     return false;
    // }

    const user = await User.findOne({ username: userEmail });

    if (user.token) {
        console.log(`\n user.token : ${user.token}, user.refresh_token : ${user.refresh_token}`);

        const currentTime = Date.now() / 1000;
        if (user.token && user.token.expiry_date >= currentTime) {
            // Access token is still valid
            return user.token.access_token;
        } else if (user.refresh_token) {
            // Access token has expired; use the refresh token to obtain a new access token
            const { token } = await oauth2Client.refreshToken(user.refresh_token);
            oauth2Client.setCredentials(token);

            // Store the new tokens in the user's record
            await User.updateOne({ username: userEmail }, { $set: { token } });

            return token.access_token;
        } else {
            console.log("tokens were undefined so return false")
            return false;
        }
    }

    // No user or token found, return null
    return false;
};

app.get('/auth/google', async (req, res) => {

    // /auth/google?useremail=X where X you need to specify what useremail are you requesting authentication for
    const useremail = req.query.useremail; 
    console.log(`\nGoing to authenticate google with email : ${useremail}`);
    
    const foundUserToken = await getUserToken(useremail);
    console.log(`foundUserToken : ${foundUserToken}`)

    if (foundUserToken) {
        oauth2Client.setCredentials(foundUserToken);
        host = "calendo.westus2.cloudapp.azure.com"
        // You can now use 'userEmail' to save events to the user's database
        res.redirect(`https://${host}:${port}/api/calendar/import?useremail=${useremail}`);
        console.log(`Redirecting you to https://${host}:${port}/api/calendar/import?useremail=${useremail}`);
    } else {
        res.redirect(authorizationUrl);
        console.log("Redirecting you to authorizationUrl : ", authorizationUrl);
    }
});

app.get('/auth/google/token', async (req, res) => {

    // /auth/google/token?useremail=ee where ee you need to specify what useremail are you requesting authentication for
    const access_token = req.access_token;
    const refresh_token = req.refresh_token;
    const useremail = req.query.useremail;
    console.log(`\nGoing to authenticate google with access_token : ${access_token}`);
    

    // Store the refresh token in the user's database record
    // Assuming you have a User model and user email stored in 'userEmail'
    const result = await User.findOneAndUpdate(
        { username: useremail },
        { $set: { access_token: access_token, refresh_token: req.refresh_token } },
        { new: true } // This option returns the updated document
    );
    console.log('Updated user field with the given token : ', result);

    try {
        oauth2Client.setCredentials({
            access_token: access_token,
            refresh_token: refresh_token
        });
        host = "calendo.westus2.cloudapp.azure.com"
        // You can now use 'userEmail' to save events to the user's database
        res.redirect(`https://${host}:${port}/api/calendar/import?useremail=${useremail}`);
        console.log(`Redirecting you to import calendar endpoint : https://${host}:${port}/api/calendar/import?useremail=${useremail}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
    }
});


oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
        // store the refresh_token in my database!
        console.log(tokens.refresh_token);
        
        try {
            const userInfo = await googleUser.userinfo.get({ auth : oauth2Client});
            userEmail = userInfo.data.email;

            // Store the refresh token in the user's database record
            // Assuming you have a User model and user email stored in 'userEmail'
            await User.findOneAndUpdate(
                { username: userEmail },
                { $set: { access_token: tokens.access_token, refresh_token: tokens.refresh_token } }
            ).then(updatedUser => {
                console.log('\nupdated user with new tokens : ', updatedUser.value);
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error in oauth2 event lister : refersh token update failed' });
        }
    }
    console.log(tokens.access_token);
  });


// This expects the user already registered through /register
app.get('/auth/google/redirect', async (req, res) => {
    const code = req.query.code;

    const { tokens } = await oauth2Client.getToken(code);
    console.log("google token : ", tokens)

    if (tokens.expiry_date) {
        const expirationDate = new Date(tokens.expiry_date);
        console.log("access token expiration date: " + expirationDate.toLocaleString());
    }

    oauth2Client.setCredentials(tokens);

    const userInfo = await googleUser.userinfo.get({ auth : oauth2Client});
    console.log('\nyou have successfully logged in with email: ', userInfo.data.email);
    console.log('token from google authenticate : ', tokens.access_token);
    console.log('refresh_token from google authenticate : ', tokens.refresh_token);

    userEmail = userInfo.data.email;

    try {
        // Store the refresh token in the user's database record
        // Assuming you have a User model and user email stored in 'userEmail'
        await User.findOneAndUpdate(
            { username: userEmail },
            { $set: { access_token: tokens.access_token, refresh_token: tokens.refresh_token } }
        ).then(updatedUser => {
            console.log('updated user with new tokens : ', updatedUser);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
    }


    host = "calendo.westus2.cloudapp.azure.com"
    // You can now use 'userEmail' to save events to the user's database
    res.redirect(`https://${host}:${port}/api/calendar/import?useremail=${userEmail}`);
    console.log('redirecting you again to calender importing endpoint\n');
});





app.get('/', (req, res) => {
    if (isHttps) {
        res.send('Hello, Welcome to Calendo using HTTPS on port 8081!');
    } else {
        res.send('Hello, Welcome to Calendo using HTTP on port 3000!');
    }
});

app.get('/check', (req, res) => {
    if (isHttps) {
        res.send('check for https!');
    } else {
        res.send('check for http');
    }
});

if (isHttps) {
    port = 8081; // Standard HTTPS port
    
    httpsServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      host = "calendo.westus2.cloudapp.azure.com"

      console.log(`Server is running on https://${host}:${port}`);
    });
} else {
    // Start server
    port = process.env.PORT || 3000;

    // host = "20.64.250.110"
    host = 'localhost'
    server.listen(port, '0.0.0.0', () => console.log(`Server started on http://${host}:${port}`));
}
