const axios = require('axios');
const { Client } = require("@googlemaps/google-maps-services-js");
const { apikeys } = require('googleapis/build/src/apis/apikeys');

//const apiKey = '';

class Scheduler {
    constructor() {
        this.client = new Client({});
    }

    /*
    * Methods
    */
    async getDirections(origin, destination, mode) {
        try {
            const params = {
                origin: origin,
                destination: destination,
                mode: mode, // can be driving|walking|transit ?
                // transit_mode=train|tram|subway
                // transit_routing_preference
                alternatives: true,
                key: apiKey,
            }
            const result = await client.directions(params);
            // console.log(result.data);
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
