const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    access_token: String,
    refresh_token: String,
    id_token: String,
    google_token: [mongoose.Schema.Types.Mixed],
    preferences: {
        commute_method: String,
        preparation_time: String,
        notification_preferences: {
            morning_alarm: Boolean,
            event_alarm: Boolean,
            event_notification: Boolean,
            traffic_alerts: Boolean,
            weather_alerts: Boolean,
        },
        maxMissedBus: String,
        home_location: String,
        school_location: String,
        work_location: String,
        snooze_duration: String,
        vibration_alert: Boolean,
    },
    events: [mongoose.Schema.Types.Mixed],
    daySchedule: [mongoose.Schema.Types.Mixed],
});

module.exports = userSchema;
