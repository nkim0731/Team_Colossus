const axios = require('axios');
const { Client } = require("@googlemaps/google-maps-services-js");
const { apikeys } = require('googleapis/build/src/apis/apikeys');

// const apiKey = process.env.MAPS_API_KEY;

class Scheduler {
    constructor() {
        this.client = new Client({});
    }

    /*
    * Methods
    */

    // get direction to an event from position when called
    async getDirections(origin, event, mode) { // need to pass objects
        try {
            const params = {
                origin: origin, // LatLng "lat,lng" string
                destination: destination,
                travelMode: mode, // DRIVING, BICYCLING, WALKING, TRANSIT (strings)
                transitOptions: 'TransitOptions',
                /*
                   {
                    arrivalTime: Date, // use event time here
                    departureTime: Date,
                    modes[]: TransitMode, // BUS, RAIL, SUBWAY, TRAIN, TRAM
                    routingPreference: TransitRoutePreference // FEWER_TRANSFERS, LESS_WALKING
                    }
                */
                drivingOptions: 'DrivingOptions',
                /*
                    {
                    departureTime: Date,
                    trafficModel: TrafficModel // bestguess, pessimistic, optimistic
                    }
                */
                alternatives: true,
                key: apiKey,
            }
            const result = await client.directions(params);
            console.log(result.data);
            return result.data; // array of possible routes from origin to destination
        } catch (e) {
            console.log('Error: ' + e);
        }
    }

    // cache driving routes, give buffer time based on traffic
    async createDaySchedule(events) { //
        const today = new Date();
        let validEvents = events.filter(() => {
            // filter with location or not
        })
    }
}

module.exports = new Scheduler();
