
const mongoose = require('mongoose');
const Joi = require('joi');
const express = require('express');
const app = express();

var isTest = true;
module.exports = isTest;

mongoURI = null
if (isTest) {
  mongoURI = 'mongodb://localhost:27017/test_calendoDB';
} else {
  // For actual project deployment
  mongoURI = 'mongodb://localhost:27017/calendoDB';
}

// Create connection for calendoDB
const db = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });


// Store data in app.locals
app.locals.mongoDB = db;


/*
// Testing for model for user
const dbUser1 = new dbUserModel({
  username: 'john_doe',
  password: 'password123',
  preferences: {
    mode: 'walk',
    preptime: 30,
  },
  events: [
    { eventTitle: 'Meeting', eventDate: new Date('2023-11-15T08:00:00Z') },
    { eventTitle: 'Lunch', eventDate: new Date('2023-11-15T12:30:00Z') },
  ],
});
dbUser1
  .save()
  .then((result) => {
    console.log('Saved in user collection:', result);
  })
  .catch((err) => {
    console.error('Error in user collection:', err);
  });




// Testing for model for chat
const dbChat1 = new dbChatModel({
  time: new Date(), // Use the current date and time
  content: 'Hello, how are you?',
});
dbChat1
  .save()
  .then((result) => {
    console.log('Saved in chat collection:', result);
  })
  .catch((err) => {
    console.error('Error in chat collection:', err);
  });




// Testing for model for event
const dbEvent1 = new dbEventModel({
  calendarId: '12345', // Calendar ID
  eventId: 'abcde',   // Event ID
  organizer: {
    email: 'organizer@example.com',  // Organizer's email
    displayName: 'John Doe'         // Organizer's display name
  },
  ownerUserId: 'user123',          // Owner User ID
  summary: 'Sample Event',         // Event summary
  description: 'This is a sample event', // Event description
  start: {
    dateTime: new Date('2023-10-25T10:00:00Z'), // Start date and time
    timeZone: 'UTC'             // Timezone information
  },
  end: {
    dateTime: new Date('2023-10-25T12:00:00Z'), // End date and time
    timeZone: 'UTC'             // Timezone information
  },
  location: 'Sample Location'     // Event location
})
dbEvent1
  .save()
  .then((result) => {
    console.log('Saved in event collection:', result);
  })
  .catch((err) => {
    console.error('Error in event collection:', err);
  });
  */






/*
Here we import routes modules for user and calendar
*/
const userRoutes = require('./routes/user'); // Replace with your actual path
app.use('/api/users', userRoutes);
//const calendarRoutes = require('./routes/calendar'); // Replace with your actual path

// Use the route modules in your Express app
//app.use('/api/users', userRoutes); // Mount user routes under the '/api/users' path
//app.use('/api/calendar', calendarRoutes); // Mount calendar routes under the '/api/calendar' path



/*
app.post('/api/users/register', async (req, res) => {
  console.log('register user started')
  const user_schema = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(3).required()
  });

  const validate_result = user_schema.validate(req.body);
  if (validate_result.error) {
    res.status(400).send(result.error.details[0].message)
    return;
  }

  const item = req.body; // Assuming the request body contains user data

  var newUser = new dbUserModel(item);
  await newUser.save()
  .then((result) => {
    console.log('Saved in user collection the newUser model:', result);
    res.status(201).json(result);
  })
  .catch((err) => {
    console.error('Error in user collection the newUser model:', err);
    res.status(400).json({ error: err.message });
  });
});
*/



// Start server
const port = process.env.PORT || 3000;

const serverApp = app.listen(port, () => {
    const host = "localhost"
    const port = serverApp.address().port;
    
    console.log(`Server is running on http://${host}:${port}`);
  });


/*

const WebSocket = require('ws');
const http = require('http');

// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

// Create a WebSocket server by upgrading the HTTP server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// Event handler for WebSocket connection
wss.on('connection', (ws) => {
  clients.add(ws);

  // Event handler for incoming messages
  ws.on('message', (message) => {
    // Broadcast the message to all connected clients
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  });

  // Event handler for closing the connection
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Start the HTTP server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});

*/