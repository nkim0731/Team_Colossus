const express = require('express');
const Joi = require('joi');
const app = express();
const router = express.Router();


/*
For google calendar authentication
*/
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const serviceAccount = require('../keys/calendo_SA.json');

const calendar = google.calendar({
  version: 'v3',
  auth: new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  }),
});

async function listEvents() {
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const events = response.data.items;
    console.log('response:', response);
    console.log('Upcoming 10 events:', events);
  } catch (error) {
    console.error('Error connecting to google calendar:', error);
  }
}

listEvents();



module.exports = (db) => {
  // Create a new calendar event
  router.post('/events', async (req, res) => {
    const schema = Joi.object({
      calendarId: Joi.string().min(3).required(),
      eventId: Joi.string().min(3).required(),
      organizer: Joi.object({
        email: Joi.string().email().required(),
        displayName: Joi.string(),
      }),
      ownerUserId: Joi.string().min(3).required(),
      summary: Joi.string(),
      description: Joi.string(),
      start: Joi.object({
        dateTime: Joi.string().isoDate().required(),
        timeZone: Joi.string().required(),
      }),
      end: Joi.object({
        dateTime: Joi.string().isoDate().required(),
        timeZone: Joi.string().required(),
      }),
      location: Joi.string(),
    });

    const result = Joi.validate(req.body, schema);
    if (result.error) {
      res.status(400).send(result.error.details[0].message)
      return;
    }

    if (req.body.summary == "class"){
      const updatedRequestBody = req.body.keys({
        isThisAClass: Joi.boolean(),
      });
    }

    try {
      const newEvent = req.body; // Assuming the request body contains event data
      const result = await db.collection('calendarEvents').insertOne(newEvent);
      res.status(201).json(result.ops[0]);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all calendar events for a user
  router.get('/events/:ownerUserId', async (req, res) => {
    try {
      const userId = req.params.ownerUserId;
      const events = await db.collection('calendarEvents').find({ userId }).toArray();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add more calendar-related routes as needed.

  return router;
};
