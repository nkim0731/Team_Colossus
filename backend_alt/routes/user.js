const express = require('express');
const Joi = require('joi');
const app = express();
const router = express.Router();
const User = require('../models/user');

//const dbUserModel = require('../models/user.js');
const userSchema = require('../models/user.js');
const dbChatModel = require('../models/chat.js');
const dbEventModel = require('../models/event.js');


// Register a new user
router.post('/register', async (req, res) => {
  console.log('Enter : user.js/register')
  const checkSchema = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(3).required()
  });

  const validate_result = checkSchema.validate(req.body);
  if (validate_result.error) {
    res.status(400).send(result.error.details[0].message)
    return;
  }

  const item = req.body; // Assuming the request body contains user data

  // Declare 'dbUserModel' using 'const' or 'let'
  const dbUserModel = req.app.locals.mongoDB.model('user', userSchema);

  try {
    console.log('user.js/register : save the new user');
    const newUser = new dbUserModel(item);
    await newUser.save(); // Adjust the timeout value as needed
    // The save operation completed successfully
    console.log('Saved in user collection the newUser model');
    res.status(201).json(newUser); // Use 'newUser' instead of 'result'
  } catch (err) {
    // Handle the error, which could be a timeout or other issue
    console.error('Error in user collection the newUser model:', err);
    res.status(500).json({ error: err.message });
  }

  // await newUser.save()
  // .then((result) => {
  //   console.log('Saved in user collection the newUser model:', result);
  //   res.status(201).json(result);
  // })
  // .catch((err) => {
  //   console.error('Error in user collection the newUser model:', err);
  //   res.status(400).json({ error: err.message });
  // });
});

// Login a user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.collection('users').findOne({ username });

  if (!user || user.password !== password) {
    res.status(401).json({ error: 'Authentication failed' });
  } else {
    res.status(200).json({ message: 'Login successful' });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ _id: req.params.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(user);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if a user exists
router.get('/exist', async (req, res) => {
  // Retrieve user information from the request (e.g., username or email)
  const { username, email } = req.query;

  // Query the database to check if the user exists
  const user = await db.collection('users').findOne({ $or: [{ username }, { email }] });

  if (user) {
    // User already exists
    res.status(200).json({ exists: true });
  } else {
    // User does not exist
    res.status(200).json({ exists: false });
  }
});

module.exports = router;