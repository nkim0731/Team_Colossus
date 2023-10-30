const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    preferences: {
        commute_method: {
            type: String
        },
        traffic_alerts: {
            type: Boolean
        },
        preparation_time: {
            type: String
        },
        notification_preferences: {
            morning_alarm: {
                type: Boolean,
            },
            event_alarm: {
                type: Boolean,
            },
            event_notification: {
                type: Boolean,
            },
            traffic_alerts: {
                type: Boolean,
            },
            weather_alerts: {
                type: Boolean,
            },
        },
        maxMissedBus: {
            type: String
        },
        home_location: {
            type: String
        },
        school_location: {
            type: String
        },
        work_location: {
            type: String
        },
        snooze_duration: {
            type: String
        },
        vibration_alert: {
            type: Boolean
        },
    },
    events: [mongoose.Schema.Types.Mixed],
    daySchedule: [mongoose.Schema.Types.Mixed], // returned optimal schedule for the day from scheduler
});

module.exports = userSchema;
