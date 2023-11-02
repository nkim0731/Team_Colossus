/*
* Calendar algorithims and computation go here
*/
const mongoose = require('mongoose');
const db = require('../Databases/Database.js');
const { google } = require('googleapis');
const { Client } = require("@googlemaps/google-maps-services-js");
const OAuth2 = google.auth.OAuth2;

require('dotenv').config({ path: `${__dirname}/../.env` });
const googleAPIKey = process.env.GOOGLE_API_KEY;


// Schema and Model for event
const eventSchema = new mongoose.Schema({
    eventName: String,
    eventId: String,
    eventType: String,
    description: String,
    start: Date,
    end: Date,
    hasChat: Boolean,
    address: String,
    gpsLocation: String,
})

class Calendar {  
    constructor() {
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
    }

    async importCalendar(token) {

        // https://developers.google.com/calendar/api/quickstart/nodejs
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const res = await calendar.events.list({
            calendarId: 'primary',
            auth: Calendar.oauth2Client,
            timeMin: new Date().toISOString(),
            maxResults: 10, // should this be increased ?
            singleEvents: true,
            orderBy: 'startTime',
        });
        return res.data.items; // events array
    }
    /*
    * data stored in separate collection under users (tentative)
    * need to also receive user's current location, or an input starting location
    * 
    * CALENDAR REPRESENTATION
    * user: user's unqiue username/email (identifier)
    * events: array of calendar events
    * 
    * CALENDAR EVENT REPRESENTATION
    * id: A unique identifier for the event.
    * status: The status of the event (e.g., "confirmed").
    * summary: The title or summary of the event.
    * description: A description of the event.
    * start and end: The start and end date/time of the event, including the time zone.
    * location: The location where the event takes place.
    * creator: Information about the event's creator.
    * organizer: Information about the event's organizer.
    * attendees: A list of attendees with their email addresses and response statuses (e.g., "accepted").
    */
}

module.exports = Calendar;