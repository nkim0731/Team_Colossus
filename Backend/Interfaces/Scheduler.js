const axios = require('axios');
const { Client } = require("@googlemaps/google-maps-services-js");
const { apikeys } = require('googleapis/build/src/apis/apikeys');

require('dotenv').config({ path: `${__dirname}/../.env` });
const googleAPIKey = process.env.GOOGLE_API_KEY;

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
                const routes = await this.getDirections(origin, dayEvents[i], preferences);
                for (let route of routes) {
                    route.legs; // path the route takes (array)
                    /*
                    leg object { // no waypoints returns a single leg
                        distance: distance.value
                        duration: duration.value // in seconds
                        steps: array objects
                    }
                    step object { // steps amout of turns to make / transit changes
                        distance
                        duration
                        start_location/end_location
                        travel_mode: mode used for each step
                        transit: arrival/departure times
                    }
                    */
                    break;
                }
            } catch (e) {
                console.log('Error generating routes: ' + e);
            }
        }
        /*
        Complete Event Object
        {
            event: event
            route: route
        }
        */
        return schedule;
    }
}

module.exports = new Scheduler();
