// Requires
const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');

// Other files interfaces
const Database = require('./Interfaces/Database.js');
const { initializeSocketIo } = require('./Interfaces/Messaging.js');

const port = 8081;
const app = express();
const server = http.createServer(app);
// const httpsServer = https.createServer(credentials, app);

/*
* API calls and calls to/from frontend go here
*/
let db = new Database();

// app.get

// Start server
server.listen(3000, () => console.log('Server started on port 3000'));
// httpsServer.listen(port, () => console.log('Server started on port ' + port));

initializeSocketIo(server);