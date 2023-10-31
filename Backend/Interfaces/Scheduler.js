const axios = require('axios');
const { Client } = require("@googlemaps/google-maps-services-js");
const { apikeys } = require('googleapis/build/src/apis/apikeys');
require('dotenv').config();

const googleAPIKey = process.env.GOOGLE_API_KEY;
// const apiKey = process.env.MAPS_API_KEY;

class Scheduler {
    constructor() {
        this.client = new Client({});
    }

    /*
    * Methods
    */

    // get direction to an event from position when called
    async getDirections(origin, event, preferences) { // need to pass objects
        try {
            let params = {
                origin: origin, // LatLng "lat, lng" string
                destination: event.gpsLocation, // a LatLng string, place object can be event.address instead
                travelMode: preferences.mode, // DRIVING, BICYCLING, WALKING, TRANSIT (strings)
                alternatives: true,
                key: googleAPIKey,
            }
            if (preferences.mode === 'TRANSIT') {
                /*
                   {
                    arrivalTime: Date, // use event time here
                    departureTime: Date,
                    modes[]: TransitMode, // BUS, RAIL, SUBWAY, TRAIN, TRAM
                    routingPreference: TransitRoutePreference // FEWER_TRANSFERS, LESS_WALKING
                    }
                */
                params.transitOptions = {
                    arrivalTime: new Date(event.start),
                    routingPreference: preferences.routing,
                }
            }
            if (preferences.mode === 'DRIVING') {
                /*
                    {
                    departureTime: Date,
                    trafficModel: TrafficModel // bestguess, pessimistic, optimistic
                    }
                */
                // not sure how to handle this because there is no arrivalTime field
                // i guess we can just make the departure time whenever this function is called
                // and have a pessimistic guess for traffic
                params.drivingOptions = {
                    departureTime: new Date(),
                    trafficModel: 'pessimistic',
                }
            }
            const result = await client.directions(params);
            console.log(result.data);
            return result.data; // array of possible routes from origin to destination
        } catch (e) {
            console.log('Error: ' + e);
            throw e;
        }
    }

    // create schedule with routes for events taking place today
    async createDaySchedule(events, origin, preferences) { // origin is user home location
        const today = new Date();
        const dayEvents = events.filter(e => {
            e.start.getDate() === today.getDate() &&
            e.start.getMonth() === today.getMonth() &&
            e.start.getFullYear() === today.getFullYear()
        });

        let schedule = [];
        for (let i = 0; i < dayEvents.length; i++) {
            if (i > 0) origin = dayEvents[i].address;
            try {
                let routes = await this.getDirections(origin, dayEvents[i], preferences);
                // callback for sort, optimize for shortest duration, least steps, earliest arrival
                // assumption no waypoints, hence only one leg in legs []
                compareRoutes = (a, b) => {
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
                // routes sorted by lowest duration/steps, optimal is route[0]
                routes.sort(compareRoutes); 
                const eventRoute = { event: dayEvents[i], routes: routes };
                schedule.push(eventRoute);
            } catch (e) {
                console.log('Error generating routes: ' + e);
            }
        }
        return schedule;
    }
}

/*
    leg object {
        distance: distance.value
        duration: duration.value // in seconds
        arrival_time: Time object: {value: Date, text: String, time_zone}
        departure_time.value: Date
        steps: array objects
    }
    step object { // steps amout of turns to make / transit changes
        distance
        duration
        start_location/end_location
        travel_mode: mode used for each step
        transit: arrival/departure times
    }
    Schedule Object {
        event: event
        route: route
    }
*/

module.exports = new Scheduler();
