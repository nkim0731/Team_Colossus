const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const Database = require('./Database.js');

const port = 8081;
const app = express();
const server = http.createServer(app);
// const httpsServer = https.createServer(credentials, app);

const uri = "mongodb://localhost:27017"
const client = new MongoClient(uri);

let db = new Database()

server.listen(3000, () => console.log('Server started on port 3000'));
// httpsServer.listen(port, () => console.log('Server started on port ' + port));