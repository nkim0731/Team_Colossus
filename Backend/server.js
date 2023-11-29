const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const axios = require('axios');
const querystring = require('querystring'); // Node.js module to stringify as x-www-form-urlencoded


// Calendar import
const { google } = require('googleapis');

// Requires for defined interfaces
const Scheduler = require('./Interfaces/Scheduler.js');
const db = require('./Databases/Database.js');
const auth = require('./Interfaces/GoogleAuth.js');

const envFilePath = path.join(__dirname, '.env');
require('dotenv').config({ path: envFilePath });

const app = express();
app.use(express.json());


/*
    Everything related to Google API
*/
const googleAPIKey = process.env.GOOGLE_API_KEY;
const OAuth2Client = new google.auth.OAuth2(
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
const authorizationUrl = OAuth2Client.generateAuthUrl({
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
        const ticket = await OAuth2Client.verifyIdToken({
            idToken: id_token,
            audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        return payload;
    } catch(e) {
        console.error('verifyIdToken() ID token verification failed:', e);
        return false;
    }
}


/*
    Other setup sections
*/
var server = null;
var httpsServer = null;
var options = null;

if (process.env.LOCAL_TEST === 'True') {
    server = http.createServer(app); // HTTP server for testing 
} else {
    // This is only for deployment on the VM using HTTPS
    options = {
        key: fs.readFileSync('/home/CPEN321_admin/privkey.pem'),
        cert: fs.readFileSync('/home/CPEN321_admin/fullchain.pem'),
    };
    
    // This is only for using self-signed certificate
    // const sslFilePath = path.join(__dirname, '..', '..', 'ssl/');
    // const key = fs.readFileSync(sslFilePath + "key.pem", 'utf8');
    // const cert = fs.readFileSync(sslFilePath + "cert.pem", 'utf8');
    // options = {
    //     key: key,
    //     cert: cert,
    //     passphrase: 'Colossus3210' // only if your key is passphrase protected
    // };

    httpsServer = https.createServer(options, app);
}


// Start socket io service for group chats
// require('./Interfaces/Messaging.js')(httpsServer);
require('./Interfaces/Messaging.js')(server);

// Important header parser middleware for user verification and sign in 
app.use((req, res, next) => {
    // console.log('Middleware for extracting access token from the header is running!');

    // Initialize req.middleware if it doesn't exist
    if (!req.middleware) {
        req.middleware = {};
    }

    const id_token = req.headers['id_token'] || "";
    const access_token = req.headers['access_token'] || "";
    const refresh_token = req.headers['refresh_token'] || "";

    req.middleware.id_token = id_token; // Attach the token to the request object
    req.middleware.access_token = access_token; // Attach the token to the request object
    req.middleware.refresh_token = refresh_token; // Attach the token to the request object

    console.log("\nExtracted in req.middleware.id_token : " + id_token);
    console.log("Extracted in req.middleware.access_token : " + access_token);
    console.log("Extracted in req.middleware.refresh_token : " + refresh_token + "\n");

    /* authHeader here is not defined, causing errors */
    // if (authHeader) { 
        // const access_token = authHeader.split(' ')[1];
        // const refresh_token = authHeader.split(' ')[2]; 
        // req.headerParser.access_token = access_token; // Attach the token to the request object
        // req.headerParser.refresh_token = refresh_token; // Attach the token to the request object
        // console.log("req.access_token", req.access_token);
    // }
    next(); // Continue to the next middleware or route
});



/*
    API endpoints
*/

// handle signin (and register if first time login) with google account
// ChatGPT usage: Partial
app.post('/login/google', async (req, res) => {
    const data = req.body;
    const useremail = data.username;
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
        console.log(e);
        res.status(500).json({ error: e.message });
    }
})

// endpoint set/get preferences for user
app.route('/api/preferences')
// ChatGPT usage: No
.get(async (req, res) => {
    const useremail = req.query.user; 
    try {
        const user = await db.getUser(username);
        if (!user) return res.status(404).json({ error: "No such user exists" });

        res.status(200).send(user.preferences);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
})
// ChatGPT usage: No
.put(async (req, res) => {
    const data = req.body;
    const useremail = data.username; 
    const preferences = data.preferences; 
    try {
        if (!await db.userExists(useremail)) {
            return res.status(404).json({ error: "No such user exists" });
        }
        await db.updatePreferences(useremail, preferences);
        res.status(200).json({ result: 'success' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


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
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});

// ChatGPT usage: Partial
app.get('/api/chatrooms', async (req, res) => {
    const useremail = req.query.user; // ?user=x
    try {
        const calendar = await db.getCalendar(useremail);
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
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});



/*
* Calendar API calls
*/

// get / add events to calendar
// ChatGPT usage: Partial
app.route('/api/calendar')
// ChatGPT usage: Partial
.get(async (req, res) => { // /api/calendar?user=username
    const useremail = req.query.user;
    // const id_token = req.middleware.id_token;
    try {
        const tokens = await db.getUserTokens(useremail, ['id_token']);
        const id_token = tokens.id_token;

        if (!await db.verifyUser(id_token, useremail, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
        const user = await db.getUser(username);
        if (!user) return res.status(404).json({ message: 'No user for username: ' + username });

        res.status(200).send(user.events);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
})
// ChatGPT usage: No
.post(async (req, res) => {
    const data = req.body;
    // const id_token = req.middleware.id_token;
    const useremail = data.username;
    try {
        const tokens = await db.getUserTokens(useremail, ['id_token']);
        const id_token = tokens.id_token;

        if (!await db.verifyUser(id_token, username, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
        await db.addEvents(data.username, data.events);
        res.status(200).json({ message: 'Events add successful' });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});




// get calendar events by a specific day
// ChatGPT usage: Partial
app.get('/api/calendar/by_day', async (req, res) => { // ?user=username&day=date
    const useremail = req.query.user;
    // const id_token = req.headerParser.id_token;
    // const id_token = req.middleware.id_token;
    const day = new Date(req.query.day + " 10:10:10");
    try {
        const tokens = await db.getUserTokens(useremail, ['id_token']);
        console.log("/api/calendar/by_day tokens.id_token : ", tokens.id_token);

        const id_token = tokens.id_token;

        if (!await db.verifyUser(id_token, useremail, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
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
        console.log(e);
        res.status(500).json({ error: e.message });
    }
}) 

// create day schedule on button press
app.route('/api/calendar/day_schedule')
// ChatGPT usage: Partial
.post(async (req, res) => {
    const data = req.body; // username, latitude, longitude
    // const id_token = req.middleware.id_token;
    const username = data.username;
    const LatLng = `${data.latitude}, ${data.longitude}`;

    try {
        const tokens = await db.getUserTokens(useremail, ['id_token']);
        const id_token = tokens.id_token;

        if (!await db.verifyUser(id_token, username, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
        const user = await db.getUser(data.username);
        const LatLng = `${data.latitude}, ${data.longitude}`;

        const schedule = await Scheduler.createDaySchedule(user.events, LatLng, user.preferences);
        await db.addSchedule(username, schedule);
        res.status(200).send(schedule);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
})

// ChatGPT usage: No
.get(async (req, res) => { // ?user=username
    // const id_token = req.middleware.id_token;
    const useremail = req.query.user
    try {
        const tokens = await db.getUserTokens(useremail, ['id_token']);
        const id_token = tokens.id_token;

        if (!await db.verifyUser(id_token, useremail, process.env.CLIENT_ID)) {
            return res.status(400).json({ message: 'Could not verify user' });
        }
        const user = await db.getUser(req.query.user);
        res.status(200).send(user.daySchedule);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
    
})

async function exchangeAuthCodeForTokens(authCode) {
    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
            code: authCode,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            redirect_uri: process.env.REDIRECT_URL,
            grant_type: 'authorization_code'
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('Exchanged auth code for tokens:', response.data)
        // Current time in milliseconds
        const currentTime = new Date().getTime();

        // expiresIn is in seconds, convert it to milliseconds and add to current time
        // Then, convert the result to Unix time (in seconds)
        const expiryTimeUnix = Math.floor((currentTime + (response.data.expires_in * 1000)) / 1000);


        console.log('\nexchanged access_token : ', response.data.access_token);
        console.log('exchanged refresh_token : ', response.data.refresh_token);
        console.log('exchanged expire_time : ', expiryTimeUnix, "\n");

        if (response.data.refresh_token == null || response.data.refresh_token == undefined) {
            console.log('No refresh token returned from Google OAuth2');
            return {
                access_token: response.data.access_token,
                expire_time: expiryTimeUnix,
            }
        } else {
            return {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                expire_time: expiryTimeUnix,
            };
        }
    } catch (error) {
        console.error('Error exchanging auth code for tokens:', error);
        throw error;
    }
}


async function refreshAccessTokenIfExpiring() {
    try {
        var newToken 
        // Refresh the token if necessary
        if (OAuth2Client.isTokenExpiring()) {
            // Attempt to refresh the token
            newToken = await OAuth2Client.getAccessToken();
            console.log("Refreshed a new access token:", newToken);
        } else {
            console.log("Access token is still valid :", OAuth2Client.credentials.access_token);
            console.log("Refresh token is set as :", OAuth2Client.credentials.refresh_token);
        }

        // If successful, the credentials and refresh token are valid
        return true;
    } catch (error) {
        console.error("Error in refreshing token:", error);
        return false;
    }
}

// This is for  updating the tokens in the database after successful login/register
app.post('/api/tokens', async (req, res) => {
    const useremail = req.body.username;
    const id_token = req.body.id_token;
    const authorization_code = req.body.refresh_token;
    
    try {
        // const { access_token, refresh_token, expire_time } = await exchangeAuthCodeForTokens(authorization_code);
        const { access_token, expire_time } = await exchangeAuthCodeForTokens(authorization_code);

        await db.updateUserTokens(useremail, { id_token, access_token, expire_time }); // update tokens

        OAuth2Client.setCredentials({
            id_token: id_token,
            access_token: access_token,
            // refresh_token: refresh_token,
            expire_time: expire_time,
        });

        res.status(200).json({ result: 'tokens and expire time backup success' });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'api/tokens : ' + e.message });
    }
})


// This is redirected from /auth/google and /auth/google/token path so do not make CHANGES!
app.get('/api/calendar/import', async (req, res) => {
    const useremail = req.query.useremail;
    console.log("\n/api/calendar/import useremail : ", useremail);
    const now = moment();
    const sevenDaysFromNow = moment().add(7, 'days');
    var access_token = ""
    var id_token = "";
    var refresh_token = "";

    OAuth2Client._clientId = process.env.CLIENT_ID;


    // await refreshTokenIfNecessary(useremail).then(
    //     new_access_token => {
    //         access_token = new_access_token
    //         console.log("/api/calendar/import new_access_token : ", new_access_token);
    //     });

    // Users.find({useremail}).then(user => {
    //     if (user.access_token != null && user.access_token != "") {
    //         access_token = user.access_token;
    //     }
    // });

    // // Assuming you have a User model and user email stored in 'userEmail'
    // await Users.findOne({ username: useremail }
    // ).then(user => {
    //     id_token = user.id_token;
    //     refresh_token = user.refresh_token;
    //     access_token = access_token;
        
    //     OAuth2Client.setCredentials({
    //         id_token: id_token,
    //         refresh_token: refresh_token,
    //         access_token: access_token
    //     });
    // });

    let userTokens = await db.getUserTokens(useremail, ['access_token', 'id_token', 'refresh_token']);
    id_token = userTokens.id_token;
    access_token = userTokens.access_token;
    refresh_token = userTokens.refresh_token;
    
    console.log('\nid_token to import calendar : ', id_token);
    console.log('\naccess_token to import calendar : ', access_token); // This is undefined for the actual app user
    console.log('\nrefresh_token to import calendar : ', refresh_token);

    const verifiedPayload = await verifyIdToken(id_token);
    console.log(verifiedPayload);

    if (verifiedPayload) {
        // Check the criteria you mentioned
        const { aud, iss, exp, _, email } = verifiedPayload;

        if (aud === process.env.CLIENT_ID 
            && (iss === 'accounts.google.com' || iss === 'https://accounts.google.com') 
            && exp > Math.floor(Date.now() / 1000)
            && useremail == email) {
            // The ID token is valid and satisfies the criteria
            console.log("\nuser id_token is verified! \nGoing to Import the calendar for the user");

            
            OAuth2Client.setCredentials({
                // refresh_token: refresh_token,
                access_token: access_token,
                id_token: id_token
            });
            
            // try {  
            //     const isValid = await refreshAccessTokenIfExpiring();
            //     if (!isValid) {
            //         return res.status(400).json({ message: 'Error from refreshing access_token' });
            //     }
            // } catch (error) {
            //     // console.error('Error during token refresh :', error);
        
            //     // Handle specific token refresh error
            //     if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
            //         // Token is invalid, prompt for re-authentication or handle accordingly
            //         return res.status(401).json({ message: 'Authentication error. Please re-authenticate.' });
            //     }
        
            //     // General error response
            //     return res.status(500).json({ message: 'Internal Server Error' });
            // }

            
            try {
                const userInfo = await googleUser.userinfo.get({ auth : OAuth2Client});
                console.log('/api/calendar/import will import calendar from : ', userInfo.data.email);
            } catch(error) {
                console.error(error);
                return res.status(400).json({ message: 'Error getting userInfo from OAuth2Client' });
            }

        
            // console.log("/api/calendar/import oauth2client : ", OAuth2Client);
        
            
            try {
                const calendarEvents = await googleCalendar.events.list({
                    calendarId: 'primary',
                    auth: OAuth2Client,
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
        
                // const result = await Users.findOneAndUpdate(
                //     { username: useremail },
                //     { $set: { events: extractedEvents } },
                //     { new: true } // This option returns the updated document
                // );

                let result = await db.updateCalendar(useremail, extractedEvents);
        
                // console.log('Updated user field with the imported Calendar data : ', result);
                console.log('Updated user field with the imported Calendar data');

        
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




app.get('/auth/google', async (req, res) => {

    // /auth/google?useremail=X where X you need to specify what useremail are you requesting authentication for
    const useremail = req.query.useremail; 
    console.log(`\nGoing to authenticate google with email : ${useremail}`);
    
    if (process.env.LOCAL_TEST === 'True') {
        res.redirect(authorizationUrl);
        console.log("Redirecting you to authorizationUrl : ", authorizationUrl + "\n");
    } else {
        // If not local test, then just reject the access with error code
        console.log("/auth/google : could not find the user associated with the useremail");
        res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
    }


    // const new_access_token = await getUserAccessToken(useremail);

    // if (new_access_token) {
    //     console.log(`new_access_token : ${new_access_token}`)
    //     OAuth2Client.setCredentials({
    //         access_token: new_access_token
    //     });
        
    //     // You can now use 'userEmail' to save events to the user's database
    //     res.redirect(`https://${host}:${port}/api/calendar/import?useremail=${useremail}`);
    //     console.log(`Redirecting you to https://${host}:${port}/api/calendar/import?useremail=${useremail}`);
    // } else {
    //     if (process.env.LOCAL_TEST === 'True') {
    //         res.redirect(authorizationUrl);
    //         console.log("Redirecting you to authorizationUrl : ", authorizationUrl + "\n");
    //     } else {
    //         console.log("/auth/google : could not find the user associated with the useremail");
    //         res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
    //     }
    // }
});

app.get('/auth/google/token', async (req, res) => {
    // This is because the middleware already extracted the id_token so no need for query.
    var id_token = req.middleware.id_token;
    var refresh_token = req.middleware.refresh_token;

    // /auth/google/token?useremail=ee where ee you need to specify what useremail are you requesting authentication for
    const useremail = req.query.useremail;
    console.log(`\nGoing to authenticate google with id_token : ${id_token}`);
    

    // Store the refresh token in the user's database record
    // Assuming you have a User model and user email stored in 'userEmail'
    // const result = await Users.findOneAndUpdate(
    //     { username: useremail },
    //     { $set: { id_token: id_token, refresh_token: refresh_token } },
    //     { new: true } // This option returns the updated document
    // );

    if (id_token == null || id_token == "") {
        console.log('/auth/google/token : continuing with the token in the database')
        var tokens = await db.getUserTokens(useremail, ['id_token', 'refresh_token'])
        id_token = tokens.id_token;
        refresh_token = tokens.refresh_token;
    } else {
        let result = await db.updateUserTokens(useremail, { 
            id_token : id_token, 
            refresh_token : refresh_token 
        });
        
        if (result == null) {
            console.error("/auth/google/token : Error saving the user token, check if you have registered the user");
            return res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
        }
        //console.log('Updated user field with the given token : ', result);
    }

    try {
        OAuth2Client.setCredentials({
            id_token: id_token,
            refresh_token: refresh_token
        });

        // host = "calendo.westus2.cloudapp.azure.com"
        // You can now use 'userEmail' to save events to the user's database
        res.redirect(`${process.env.REDIRECT_DOMAIN}/api/calendar/import?useremail=${useremail}`);
        console.log(`Redirecting you to import calendar endpoint : ${process.env.REDIRECT_DOMAIN}/api/calendar/import?useremail=${useremail}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
    }
});


OAuth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
        // store the refresh_token in my database!
        console.log("OAuth2 Client Automatic refresh_token update listener : ", tokens.refresh_token);
        
        try {
            const userInfo = await googleUser.userinfo.get({ auth : OAuth2Client});
            userEmail = userInfo.data.email;

            let updatedUser = await db.updateUserTokens(userEmail, {
                refresh_token : tokens.refresh_token,
                access_token : tokens.access_token
            });
            console.log('\nOAuthClient Listener updated user with new refresh_token');

            return;
        } catch (error) {
            console.error('Error in oauth2 event lister : refersh token update failed ', error);
            return;
        }
    } 
    if (tokens.id_token) {
        console.log("OAuth2 Client access_token refreshed! : ", tokens.access_token);
    }
  });


// This expects the user already registered through /register
app.get('/auth/google/redirect', async (req, res) => {
    const code = req.query.code;

    const { tokens } = await OAuth2Client.getToken(code);
    console.log("\n/auth/google/redirect google token : ", tokens);

    if (tokens.expiry_date) {
        const expirationDate = new Date(tokens.expiry_date);
        console.log("\nNewly created access token expiration date: " + expirationDate.toLocaleString());
    }

    OAuth2Client.setCredentials(tokens);
    var id_token = tokens.id_token;
    var access_token = tokens.access_token;
    var refresh_token = tokens.refresh_token;

    const userInfo = await googleUser.userinfo.get({ auth : OAuth2Client });
    console.log('\nyou have successfully logged in with email: ', userInfo.data.email);
    console.log('\nid_token from google authenticate : ', tokens.id_token);
    console.log('\naccess_token from google authenticate : ', tokens.access_token);
    console.log('\nrefresh_token from google authenticate : ', tokens.refresh_token);

    useremail = userInfo.data.email;

    try {
        // Store the refresh token in the user's database record
        // Assuming you have a User model and user email stored in 'useremail'

        // let result = await Users.findOneAndUpdate(
        //     { username: useremail },
        //     { $set: { access_token: access_token, id_token: id_token, google_token : tokens } },
        //     { new: true }
        // )

        let result = await db.updateUserTokens(useremail, {
            access_token : access_token,
            id_token : id_token,
            google_token : tokens
        });



        if (refresh_token != null) {
            // result = await Users.findOneAndUpdate(
            //     { username: useremail },
            //     { $set: { refresh_token: refresh_token } },
            //     { new: true }
            // )

            result = await db.updateUserTokens(useremail, {
                refresh_token : refresh_token
            });
        }

        console.log('updated user with new tokens : ', result);
        
        // host = "calendo.westus2.cloudapp.azure.com"
        // You can now use 'useremail' to save events to the user's database
        res.redirect(`${process.env.REDIRECT_DOMAIN}/api/calendar/import?useremail=${useremail}`);
        console.log(`Redirecting you to import calendar endpoint : ${process.env.REDIRECT_DOMAIN}/api/calendar/import?useremail=${useremail}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving the user token, check if you have registered the user' });
    }
});

// Need this to quickly check server is running
app.get('/', (req, res) => {
    res.send('Welcome to Team Colossus Calendo Backend!');
});

const port = 8081; // Standard HTTPS port
const host = "calendo.westus2.cloudapp.azure.com";
    
if (process.env.LOCAL_TEST === 'True') {
    server.listen(port, () => console.log(`Server started on http://localhost:${port}`));
} else {
    httpsServer.listen(port, () => {
      console.log(`Server is running on https://${host}:${port}`);
    });
}


module.exports = server;