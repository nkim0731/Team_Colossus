/*
* Calendar algorithims and computation go here
*/
const mongoose = require('mongoose');
const db = require('../Databases/Database.js');
const { google } = require('googleapis');
const { Client } = require("@googlemaps/google-maps-services-js");
const OAuth2 = google.auth.OAuth2;

const apiKey = process.env.GOOGLE_API_KEY;

// Schema and Model for event
const eventSchema = new mongoose.Schema({
    // calendarId: String,
    eventName: String, // for frontend display what the event is
    eventId: String,
    // ownerUserId: String, // don't think we need since events are stored under a user
    eventType: String,
    description: String,
    start: Date,
    end: Date,
    hasChat: Boolean, // true if its a course, false otherwise (how do we know an event is a course?)
    address: String,
    gpsLocation: String,
})

class Calendar {  
    constructor() {
        // this.client = new Client({});
    }

    async importCalendar(token) {
        const oauth2Client = new OAuth2();
        oauth2Client.setCredentials({
            access_token: token, // replace with user oath2.0 access token
        });

        // https://developers.google.com/calendar/api/quickstart/nodejs
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const res = await calendar.events.list({
            calendarId: 'primary',
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