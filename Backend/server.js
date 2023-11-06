// Requires
const express = require('express');
// const http = require('http');
const https = require('https');
const fs = require('fs');
// const path = require('path');

// Requires for defined interfaces
const Scheduler = require('./Interfaces/Scheduler.js');
const ChatManager = require('./Interfaces/Messaging.js');
const db = require('./Databases/Database.js');

// For loading env variables
require('dotenv').config({ path: `${__dirname}/.env` });

//Import export variables from variables.js
// const { isHttps, isTest, test_calendoDB } = require('./variables.js');

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

// const server = http.createServer(app); // HTTP server for testing 

// const chatManager = new ChatManager(httpsServer); // start socketio service for groupchats

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
    const user = req.query.user;
    try {
        const events = await db.getCalendar(user);
        res.status(200).send(events.events); // send events array
    } catch (e) {
        res.status(500).json({ message: e });
    }
})
// ChatGPT usage: No
.post(async (req, res) => {
    const data = req.body;
    try {
        await db.addEvents(data.username, data.events);
        res.status(200).json({ message: 'Events add successful' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
});

// get calendar events by a specific day
// ChatGPT usage: Partial
app.get('/api/calendar/by_day', async (req, res) => { // ?user=username&day=date
    const user = req.query.user;
    const day = new Date(req.query.day + " 10:10:10");
    try {
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
// ChatGPT usage: No
.get(async (req, res) => { // ?user=username
    
    const schedule = await db.getSchedule(req.query.user);
    res.status(200).send(schedule.daySchedule);
    
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

//chatgpt usage: partial
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

//chatgpt usage: partial
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
