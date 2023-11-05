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
const { OAuth2Client } = require('google-auth-library');

// Requires for defined interfaces
const Calendar = require('./Interfaces/Calendar.js');
const Scheduler = require('./Interfaces/Scheduler.js');
const ChatManager = require('./Interfaces/Messaging.js');
const db = require('./Databases/Database.js');

// For loading env variables
require('dotenv').config({ path: `${__dirname}/.env` });

// Schemas needed for db
const userSchema = require('./Schema/userSchema');
const chatSchema = require('./Schema/chatSchema');

//Import export variables from variables.js
const { isHttps, isTest, test_calendoDB } = require('./variables.js');

const app = express();
app.use(express.json());

var mongoURI = null
if (isTest) {
    if (test_calendoDB) {
        mongoURI = 'mongodb://localhost:27017/test_calendoDB';
    } else {
        // This URL should be the same as the db connection created in the server.js
        mongoURI = 'mongodb://localhost:27017/cpen321'; // charles db name
    }
} else {
    // For actual project deployment
    mongoURI = 'mongodb://localhost:27017/calendoDB';
}
console.log("serverjs connecting to  : " + mongoURI);


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

//Universal mongoDB instantiation and other help code (used by So)
var port = 8081;
var host = "calendo.westus2.cloudapp.azure.com";

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
const authClient = new OAuth2Client();
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
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
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


const verifyIdToken = async (id_token) => {
    try {
        const ticket = await authClient.verifyIdToken({
            idToken: id_token,
            audience: process.env.CLIENT_ID
        });
        const payload = ticket.getPayload();
        return payload;
    } catch(e) {
        console.error('verifyIdToken() ID token verification failed:', e);
        return false;
    }
}

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



//This updates the access_token if expired, and returns the updated access_token.
//if its not expired, it will just return the access_token
const refreshTokenIfNecessary = async (userEmail) => {
    const user = await User.findOne({ username: userEmail });
    
    if (user) {
        const currentTime = Date.now() / 1000;
        if (user.access_token.expiry_date < currentTime) {
            // Access token has expired; use the refresh token to obtain a new access token
            const { token } = await oauth2Client.refreshToken(user.refresh_token);
            oauth2Client.setCredentials(token);
            user.google_token = token;
            user.access_token = token.access_token; // This field is just debug view only, we dont use in code.
            user.id_token = token.id_token; // This field is just debug view only, we dont use in code.
            user.save();
            return token.access_token; // This is a new access_token
        }
        return user.access_token;
    }
};

/*
* Calendar API calls
*/
// This is redirected from /auth/google and /auth/google/token path so do not make CHANGES!
app.get('/api/calendar/import', async (req, res) => {
    const useremail = req.query.useremail;
    const now = moment();
    const sevenDaysFromNow = moment().add(7, 'days');
    var access_token = ""

    await refreshTokenIfNecessary(useremail).then(
        new_access_token => {
            access_token = new_access_token
            console.log("/api/calendar/import new_access_token : ", new_access_token);
        });

    var id_token = "";
    var refresh_token = ""
    // Assuming you have a User model and user email stored in 'userEmail'
    await User.findOne({ username: useremail }
    ).then((user) => {
        id_token = user.id_token;
        refresh_token = user.refresh_token;
        access_token = access_token;
        
        oauth2Client.setCredentials({
            id_token: id_token,
            refresh_token: refresh_token,
            access_token: access_token
        });
    });

    
    console.log('\nid_token to import calendar : ', id_token);
    console.log('\naccess_token to import calendar : ', access_token);
    console.log('\nrefresh_token to import calendar : ', refresh_token);

    
    const verifiedPayload = await verifyIdToken(id_token);
    console.log(verifiedPayload);


    if (verifiedPayload) {
        // Check the criteria you mentioned
        const { aud, iss, exp, hd, email } = verifiedPayload;

        if (aud === process.env.CLIENT_ID 
            && (iss === 'accounts.google.com' || iss === 'https://accounts.google.com') 
            && exp > Math.floor(Date.now() / 1000)
            && useremail == email) {
            // The ID token is valid and satisfies the criteria
            console.log("\nuser id_token is verified! \nGoing to Import the calendar for the user");



            const userInfo = await googleUser.userinfo.get({ auth : oauth2Client});
            console.log('/api/calendar/import will import calendar from : ', userInfo.data.email);
        
            console.log("/api/calendar/import oauth2client : ", oauth2Client);
        
            
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
        
                const result = await User.findOneAndUpdate(
                    { username: useremail },
                    { $set: { events: extractedEvents } },
                    { new: true } // This option returns the updated document
                );
        
                console.log('Updated user field with the imported Calendar data : ', result);
        
                res.status(200).json({ 'events' : extractedEvents });
            } catch (error) {
                console.error(error);
            
                res.status(500).json({ message: 'Error fetching calendar events' });
            }
        } else {
            res.status(400).json({ message: 'Invalid ID token for importing calendar' });
        }
    } else {
        res.status(400).json({ message: 'Error with verifyIdToken()' });
    }


});

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
        res.status(200).json({ schedule: schedule });
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

// Use the API routes from User.js
const userRoutes = require('./Interfaces/User'); // Replace with your actual path
app.use('/api/users', userRoutes);

// Middleware to extract the access token
app.use((req, res, next) => {
    // Log a message to indicate that the middleware is running
    console.log('Middleware for extracting access token from the header is running!');

    //const authHeader = req.headers['authorization'];

    const id_token = req.headers['id_token'];
    const refresh_token = req.headers['refresh_token'];

    req.id_token = id_token; // Attach the token to the request object
    req.refresh_token = refresh_token; // Attach the token to the request object

    console.log("\nExtracted id_token : " + id_token);
    console.log("Extracted refresh_token : " + refresh_token + "\n");
    // if (authHeader) {
    //     console.log("middleware authHeader : ", authHeader);
    //     const access_token = authHeader.split(' ')[1]; // Split and get the token after "Bearer"
    //     const refresh_token = authHeader.split(' ')[2]; 
    //     req.access_token = access_token; // Attach the token to the request object
    //     req.refresh_token = refresh_token; // Attach the token to the request object
    //     console.log("req.access_token", req.access_token);
    // }
    next(); // Continue to the next middleware or route
  });

// This function will return false if there is no valid access_token, otherwise it returns a valid access_token
const getUserAccessToken = async (userEmail) => {
    // Define a regex pattern for a basic email format
    // const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    // // Check if the userEmail matches the email regex pattern
    // if (!emailRegex.test(userEmail)) {
    //     // If it doesn't match, return null
    //     return false;
    // }

    const user = await User.findOne({ username: userEmail });
    if (user == null) {
        return false;
    } else if (user.access_token == "" && user.refresh_token == "") {
        return false;
    }

    // If the user has refresh token
    if (user.refresh_token) {
        if (user.access_token) {
            //console.log(`\n user.access_token : ${user.access_token}, user.refresh_token : ${user.refresh_token}`);
    
            new_access_token = await refreshTokenIfNecessary(user.username);
            return new_access_token;
        }
    } else {
        if (user.access_token && user.access_token.expiry_date >= currentTime) {
            // Access token is still valid
            return user.access_token;
        } else {
            console.log("user access_token is expired, and does not have refresh_token")
            return false;
        }
    }
};

app.get('/auth/google', async (req, res) => {

    // /auth/google?useremail=X where X you need to specify what useremail are you requesting authentication for
    const useremail = req.query.useremail; 
    console.log(`\nGoing to authenticate google with email : ${useremail}`);
    
    const new_access_token = await getUserAccessToken(useremail);

    if (new_access_token) {
        console.log(`new_access_token : ${new_access_token}`)
        oauth2Client.setCredentials({
            access_token: new_access_token
        });
        host = "calendo.westus2.cloudapp.azure.com"
        // You can now use 'userEmail' to save events to the user's database
        res.redirect(`https://${host}:${port}/api/calendar/import?useremail=${useremail}`);
        console.log(`Redirecting you to https://${host}:${port}/api/calendar/import?useremail=${useremail}`);
    } else {
        if (isTest) {
            res.redirect(authorizationUrl);
            console.log("Redirecting you to authorizationUrl : ", authorizationUrl + "\n");
        } else {
            console.log("/auth/google : could not find the user associated with the useremail");
            res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
        }
    }
});

app.get('/auth/google/token', async (req, res) => {
    // This is because the middleware already extracted the id_token so no need for query.
    const id_token = req.id_token;
    const refresh_token = req.refresh_token;


    // /auth/google/token?useremail=ee where ee you need to specify what useremail are you requesting authentication for
    const useremail = req.query.useremail;
    console.log(`\nGoing to authenticate google with id_token : ${id_token}`);
    

    // Store the refresh token in the user's database record
    // Assuming you have a User model and user email stored in 'userEmail'
    const result = await User.findOneAndUpdate(
        { username: useremail },
        { $set: { id_token: id_token, refresh_token: refresh_token } },
        { new: true } // This option returns the updated document
    );

    if (result == null) {
        console.error("/auth/google/token : Error saving the user token, check if you have registered the user");
        return res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
    }
    //console.log('Updated user field with the given token : ', result);

    try {
        oauth2Client.setCredentials({
            id_token: id_token,
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
                { $set: { access_token: tokens.access_token, refresh_token: tokens.refresh_token } },
                { new: true }
            ).then(updatedUser => {
                console.log('\nOAuthClient Listener updated user with new refresh_token : ', updatedUser);
            });
            return;
        } catch (error) {
            console.error('Error in oauth2 event lister : refersh token update failed ', error);
            return;
        }
    } else {
        console.log(tokens.access_token);
    }
  });


// This expects the user already registered through /register
app.get('/auth/google/redirect', async (req, res) => {
    const code = req.query.code;

    const { tokens } = await oauth2Client.getToken(code);
    //console.log("\n/auth/google/redirect google token : ", tokens);

    if (tokens.expiry_date) {
        const expirationDate = new Date(tokens.expiry_date);
        console.log("\nNewly created access token expiration date: " + expirationDate.toLocaleString());
    }

    oauth2Client.setCredentials(tokens);
    var id_token = tokens.id_token;
    var access_token = tokens.access_token;
    var refresh_token = tokens.refresh_token;

    const userInfo = await googleUser.userinfo.get({ auth : oauth2Client});
    console.log('\nyou have successfully logged in with email: ', userInfo.data.email);
    console.log('\nid_token from google authenticate : ', tokens.id_token);
    console.log('\naccess_token from google authenticate : ', tokens.access_token);
    console.log('\nrefresh_token from google authenticate : ', tokens.refresh_token);

    userEmail = userInfo.data.email;

    try {
        // Store the refresh token in the user's database record
        // Assuming you have a User model and user email stored in 'userEmail'

        let result = await User.findOneAndUpdate(
            { username: userEmail },
            { $set: { access_token: access_token, id_token: id_token, google_token : tokens } },
            { new: true }
        )

        if (refresh_token != null) {
            let result = await User.findOneAndUpdate(
                { username: userEmail },
                { $set: { refresh_token: refresh_token } },
                { new: true }
            )
        }

        console.log('updated user with new tokens : ', result);
        
        host = "calendo.westus2.cloudapp.azure.com"
        // You can now use 'userEmail' to save events to the user's database
        res.redirect(`https://${host}:${port}/api/calendar/import?useremail=${userEmail}`);
        console.log('redirecting you again to calender importing endpoint\n');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
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
