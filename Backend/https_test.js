const express = require('express');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 8081; // Change this to the port you want to use

function directoryExists(directoryPath) {
  try {
    return fs.statSync(directoryPath).isDirectory();
  } catch (err) {
    if (err.code === 'ENOENT') {
      // The directory doesn't exist
      return false;
    }
    throw err; // Handle other errors
  }
}

// Example usage:
const directoryPath = '/etc/letsencrypt/live/calendo.westus2.cloudapp.azure.com/';


const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/calendo.westus2.cloudapp.azure.com/privkey.pem'), // Path to your private key
  cert: fs.readFileSync('/etc/letsencrypt/live/calendo.westus2.cloudapp.azure.com/fullchain.pem'), // Path to your certificate
};

app.get('/', (req, res) => {
    if (directoryExists(directoryPath)) {
        console.log(`The directory at ${directoryPath} exists.`);
    } else {
        console.log(`The directory at ${directoryPath} does not exist.`);
    }
    res.send('Hello, HTTPS World!'); // Modify this response as needed
});

const server = https.createServer(options, app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});