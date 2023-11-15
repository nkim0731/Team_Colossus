const { Client } = require("@googlemaps/google-maps-services-js");
const path = require('path');
const dotenv = require('dotenv');

const envFilePath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envFilePath });

const googleAPIKey = process.env.GOOGLE_API_KEY;

class Scheduler {
    constructor() {
        this.client = new Client({});
    }

    // get direction to an event from position when called
    // ChatGPT usage: Partial
    async getDirections(origin, event, preferences) {
        
        let params = {
            origin,
            destination: event.address,
            travelMode: preferences.commute_method,
            alternatives: true,
            key: googleAPIKey,
        }
        if (preferences.commute_method.toLowerCase() === 'transit') {
            params.transitOptions = {
                arrivalTime: new Date(event.start),
                // routingPreference: preferences.routing,
            }
        }
        if (preferences.commute_method.toLowerCase() === 'driving') {
            params.drivingOptions = {
                departureTime: new Date(),
                trafficModel: 'pessimistic',
            }
        }
        const result = await this.client.directions({ params });
        return result.data; // array of possible routes from origin to destination
        
    }

    // create schedule with routes for events taking place today
    // ChatGPT usage: Partial
    async createDaySchedule(events, origin, preferences) { // origin is user home location
        // callback for sort, optimize for shortest duration, least steps, earliest arrival
        function compareRoutes(a, b) {
            // compare by duration
            if (a.legs[0].duration.value < b.legs[0].duration.value) {
                return -1;
            } else if (a.legs[0].duration.value > b.legs[0].duration.value) {
                return 1;
            }
            // compare by steps, if duration is equal
            if (a.legs[0].steps.length < b.legs[0].steps.length) {
                return -1;
            } else if (a.legs[0].steps.length > b.legs[0].steps.length) {
                return 1;
            }
            // compare arrival time to then use earliest arrival
            if (a.legs[0].arrival_time.value < b.legs[0].arrival_time.value) {
                return -1;
            } else if (a.legs[0].arrival_time.value > b.legs[0].arrival_time.value) {
                return 1;
            }
            return 0; // route a and b are equal in duration and steps
        }

        const today = new Date();
        const dayEvents = events.filter(e => {
            const eventDate = new Date(e.start);
            return (
                eventDate.getDate() === today.getDate() &&
                eventDate.getMonth() === today.getMonth() &&
                eventDate.getFullYear() === today.getFullYear()
            );
        });

        let schedule = [];
        for (let i = 0; i < dayEvents.length; i++) {
            if (i > 0) origin = dayEvents[i].address;
            try {
                const directions = await this.getDirections(origin, dayEvents[i], preferences);
                let routes = directions.routes;
                // routes sorted by lowest duration, then steps and time of arrival, optimal is routes[0]
                routes.sort(compareRoutes); 
                const route = {
                    distance: routes[0].legs[0].distance,
                    duration: routes[0].legs[0].duration,
                    end_address: routes[0].legs[0].end_address,
                    start_address: routes[0].legs[0].start_address,
                }
                const eventRoute = { event: dayEvents[i], route };
                schedule.push(eventRoute);
            } catch (e) {
                console.log('Error generating routes: ' + e);
                throw e;
            }
        }
        return schedule;
    }
}

module.exports = new Scheduler();
