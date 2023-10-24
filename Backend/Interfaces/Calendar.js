/*
* Calendar algorithims and computation go here
*/
const { google } = require('googleapis');
const { Client } = require("@googlemaps/google-maps-services-js");
const OAuth2 = google.auth.OAuth2;

class Calendar {
    #apiKey = 'key'; // private google maps api key goes here
    
    constructor() {
        this.client = new Client({});
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
            timeMin: new Date().toISOString(), // do we only want upcoming events?
            maxResults: 10,
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