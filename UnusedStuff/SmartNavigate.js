// const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const userSchema = require('../Backend/Schema/transitHistory');

// GET user preferences by username
router.get('/:username/:eventID', async (req, res) => {
  try {
    const User = req.app.locals.mongoDB.model('user', userSchema);

    const username = req.params.username;
    const user = await User.findOne({ username });

    console.log('user.preferences : ', user.preferences);
    console.log('user.preferences.params : ', user.preferences.params);
    if (!user.preferences === undefined) {
      return res.status(404).json({ error: 'User not found' });
    }
    

    const preferences = user.preferences; // Use the preferences object from the schema

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST to create or update user preferences
router.post('/:username/preferences', async (req, res) => {
  try {
    const User = req.app.locals.mongoDB.model('user', userSchema);

    const username = req.params.username;
    const user = await User.findOne({ username });

    if (user) {
        return res.status(500).json({ error: 'user already exists, try PUT to update exisiting user' });
    }

    // Define the validation schema using Joi
    const checkSchema = Joi.object({
        commute_method: Joi.string().required(),
        traffic_alerts: Joi.boolean().required(),
        preparation_time: Joi.string().required(),
        notification_preferences: Joi.object({
          morning_alarm: Joi.boolean(),
          event_alarm: Joi.boolean(),
          event_notification: Joi.boolean(),
          traffic_alerts: Joi.boolean(),
          weather_alerts: Joi.boolean(),
        }).required(),
        maxMissedBus: Joi.string().required(),
        home_location: Joi.string().required(),
        school_location: Joi.string().required(),
        work_location: Joi.string().required(),
        snooze_duration: Joi.string().required(),
        vibration_alert: Joi.boolean().required(),
      });

    const validate_result = checkSchema.validate(req.body);

    if (validate_result.error) {
      return res.status(400).send(validate_result.error.details[0].message);
    }

    // Update user preferences based on the request body
    user.preferences = validate_result.value; // Assign the preferences object from the request

    const updatedUser = await user.save();

    res.status(201).json(updatedUser.preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT to update specific preferences
router.put('/:username/preferences', async (req, res) => {
  try {
    const User = req.app.locals.mongoDB.model('user', userSchema);

    const username = req.params.username;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update specific user preferences fields
    Object.keys(req.body).forEach((key) => {
      user.preferences[key] = req.body[key]; // Assign to the preferences object
    });

    const updatedUser = await user.save();

    res.json(updatedUser.preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user preferences
router.delete('/:username/preferences', async (req, res) => {
  try {
    const User = req.app.locals.mongoDB.model('user', userSchema);

    const username = req.params.username;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear user preferences
    user.preferences = null;

    // const updatedUser = await user.save();

    res.json({ message: 'User preferences deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
