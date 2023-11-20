/* 
    charles backend tests
    for So, just move this file out of backend when doing your own test if it interferes
    merge with So file once done, and set "collectCoverage" to true and check for 100%

    test endpoints
    /api/calendar/by_day
    /api/calendar/day_schedule
    /api/message_history
    /api/chatrooms
    Message sockets


So:
    working on unit test for 
    '/login/google' POST
    '/api/preferences' POST GET
    '/api/calendar' POST GET
*/
const server = require('../server.js');
const request = require('supertest');
var db = require('../Databases/Database.js');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    //console.log('MONGO_URI : ', mongoUri);
    await db.connect(mongoUri); 
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});


beforeEach(async () => {
    // This is needed when we have the mock functions for db
    // This loops through all properties and resets mock functions 
    Object.values(db).forEach((property) => {
        // Check if the property is a Jest mock function
        if (typeof property.mockClear === 'function') {
            property.mockClear();
        }
    });

    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped');
});


// // This is only for charles code to run
// // mocked database will only work if you disable jest.unmock('../Databases/Database.js'); in my part of the code
// jest.mock('../Databases/Database.js');
// db = require('../Databases/Database.js');


// // Interface GET /api/calendar/by_day
// describe('GET calendar events of a given day', () => {
//     const events = [
//         { 
//             eventName: 'cpen321',
//             start: '2023-11-18T09:00:00Z',
//             end: '2023-11-18T12:00:00Z',
//             address: '2357 Main Mall, Vancouver',
//         },
//         { 
//             eventName: 'cpen321 v2',
//             start: '2023-11-18T13:00:00Z',
//             end: '2023-11-18T15:00:00Z',
//             address: '2357 Main Mall, Vancouver',
//         },
//     ]


//     // Input: username as email string, id_token google auth session, day string
//     // Expected status code: 200
//     // Expected behavior: a valid user gets events on 
//     // Expected output: array of events on the specified day
//     it('should get events of a given day', async () => {
//         const user = 'user@gmail.com';
//         const id_token = 'token';
//         const date = '2023-11-18';
//         db.verifyUser.mockResolvedValue(true);
//         db.getCalendar.mockResolvedValue({ events });

//         const res = await request(server)
//             .get(`/api/calendar/by_day?user=${user}&day=${date}`)
//             .set('id_token', id_token);

//         expect(res.status).toBe(200);
//         expect(res.body).toEqual(events);

//         expect(db.verifyUser).toHaveBeenCalledWith(id_token, user, process.env.CLIENT_ID);
//         expect(db.getCalendar).toHaveBeenCalledWith(user);
//     })

//     // //This code the rewritten code for function above, but using actual database class functions
//     // it('should get events of a given day', async () => {
//     //     // Set up a test user and events in the database
//     //     const user = { username: 'user@gmail.com', events: events};
//     //     await db.addUser(user);

//     //     const res = await request(server)
//     //         .get(`/api/calendar/by_day?user=${user.username}&day=2023-11-18`);

//     //     expect(res.status).toBe(200);
//     //     expect(res.body).toEqual(user.events);
//     // });



//     // Input: username as email string, id_token google auth session, day string
//     // Expected status code: 500
//     // Expected behavior: 
//     // Expected output: 
//     it('should handle error case', async () => {
//         jest.spyOn(db, 'verifyUser').mockImplementation(() => { throw new Error('Database error'); });
//         const user = 'user@gmail.com';
//         const id_token = 'token';
//         const date = '2023-11-18';
    
//         const res = await request(server)
//           .get(`/api/calendar/by_day?user=${user}&day=${date}`)
//           .set('id_token', id_token);
    
//         expect(res.status).toBe(500);
//         expect(res.body).toHaveProperty('message');
//     });
//     // Input: username as email string, invalid id_token google auth session, day string
//     // Expected status code: 400
//     // Expected behavior: 
//     // Expected output: 
//     it('should handle an invalid token', async () => {
//         const user = 'user@gmail.com';
//         const id_token = 'invalid_token';
//         const date = '2023-11-18';
//         db.verifyUser.mockResolvedValue(false);
//         db.getCalendar.mockResolvedValue({ events });
    
//         const res = await request(server)
//           .get(`/api/calendar/by_day?user=${user}&day=${date}`)
//           .set('id_token', id_token);
    
//         expect(res.status).toBe(400);
//         expect(res.body).toHaveProperty('message');
//         expect(res.body).not.toHaveProperty('events');
//     });
// })




/*
So's test:

    working on unit test for 
    '/login/google' POST
    '/api/preferences' POST GET
    '/api/calendar' POST GET
*/

const sampleUser = {
    username: "sampleUser_So@gmail.com",
    password: "thisisapassword",
    preferences: {
        commute_method: "bus",
        traffic_alerts: true,
        preparation_time: "30 minutes",
        notification_preferences: {
            morning_alarm: true,
            event_alarm: true,
            event_notification: true,
            traffic_alerts: true,
            weather_alerts: true
        },
        maxMissedBus: "1",
        home_location: "123 Main St, Your City",
        school_location: "4566 Main Mall, Vancouver",
        work_location: "456 Business Ave, Your City",
        snooze_duration: "10 minutes",
        vibration_alert: true
    },
   
    events: [
        {
            eventID: "06a9tvveju39v9c0et0egjgan7_20231031T183000Z",
            summary: "CPEN442 Meeting",
            description: null,
            creator_email: "sou.nozaki@gmail.com",
            status: "confirmed",
            kind: "calendar#event",
            location: null,
            start: "2023-10-31T11:30:00-07:00",
            start_timeZone: "America/Vancouver",
            end: "2023-10-31T12:30:00-07:00",
            end_timeZone: "America/Vancouver"
        },
        {
            eventID : "_64p36d1h6osj8dhk6gs3idpl70q62oj3cgq38d1l6op0_20231101T010000Z",
            summary : "APSC 496E 001",
            description: "This section of New Venture Design capstone is for ECE students only. For more information about the course and how to apply, please go to https://design.engineering.ubc.ca/design-courses/new-venture-design/.\n\n",
            creator_email : "sou.nozaki@gmail.com",
            status : "confirmed",
            kind : "calendar#event",
            location : "David Lam Management Research Centre, Room 009",
            start : "2023-10-31T18:00:00-07:00",
            start_timeZone : "America/Vancouver",
            end : "2023-10-31T21:00:00-07:00",
            end_timeZone : "America/Vancouver"
        },
    ]
};

var invalidDataUser = {
    username: "this user is invalid",
    preferences: {
      such_preferences_dont_exist: "Space ship", // this actually does not cause error cuz its seen as extra data
      commute_method: false, // However this does not match mongoose schema type so causes error
      traffic_alerts: "aagggghhhhh",
    },
    // this events also does not cause error cuz its type is Mixed object  
    events: [
        {
            eventID: null,
            summary: "invalid events",
            description: null,
        }
    ]
};

var invalidUsernameUser = {
    //Invalid username
    "username": null,
    "preferences": {
      "such preferences dont exist": "Space ship",
    },
    "events": [
        {
            eventID: null,
            summary: "invalid events",
            description: null,
        }
    ]
};


// Use actual db implementation for the second part of tests
jest.unmock('../Databases/Database.js');
db = jest.requireActual('../Databases/Database.js');

describe('POST /login/google', () => {
    // Input: sampleUser is valid user
    // Expected status code: 200
    // Expected behavior: user is added to the database, and output is register new user
    // Expected output: { result: 'register' }
    it('registers a new user', async () => {
        const response = await request(server)
        .post('/login/google')
        .send(sampleUser);

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toBe('register');
        const actualUser = await db.getUser(sampleUser.username);
        //console.log("actualUser : \n", actualUser);  // Check what's being returned here

        // Compare specific fields
        expect(actualUser).toHaveProperty('username', sampleUser.username);
        expect(actualUser).toHaveProperty('preferences', sampleUser.preferences);
        expect(actualUser).toHaveProperty('events', sampleUser.events);
        // ... add more fields as needed

        // For nested objects, you can use expect.objectContaining
        expect(actualUser.preferences.notification_preferences).toEqual(
            expect.objectContaining(sampleUser.preferences.notification_preferences)
        );

    });

    // Input: invalidUsernameUser
    // Expected status code: 500
    // Expected behavior: user is not added
    // Expected output: error message
    it('register null username ', async () => {
        const response = await request(server)
        .post('/login/google')
        .send(invalidUsernameUser);

        expect(response.statusCode).toBe(500);
        //console.log("null user name response", response.body);
    });



    // Input: invalidDataUser
    // Expected status code: 500
    // Expected behavior: user is not added
    // Expected output: error message
    it('register invalid data user', async () => {
        const response = await request(server)
        .post('/login/google')
        .send(invalidDataUser);

        expect(response.statusCode).toBe(500);
        console.log("invalid username response", response.body);
    });

    // Input: sampleUser is valid user
    // Expected status code: 200
    // Expected behavior: user is added to the database, and output is login user
    // Expected output: 'login'
    it('logs in an existing user', async () => {
        // Add user to database
        db.addUser(sampleUser);

        const response = await request(server)
        .post('/login/google')
        .send(sampleUser);

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toBe('login');
        
        // Check that the user was added to the database
        const actualUser = await db.getUser(sampleUser.username);

        // Compare specific fields
        expect(actualUser).toHaveProperty('username', sampleUser.username);
        expect(actualUser).toHaveProperty('preferences', sampleUser.preferences);
        expect(actualUser).toHaveProperty('events', sampleUser.events);
        // ... add more fields as needed

        // For nested objects, you can use expect.objectContaining
        expect(actualUser.preferences.notification_preferences).toEqual(
            expect.objectContaining(sampleUser.preferences.notification_preferences)
        );
    });
});
  

  
describe('GET /api/preferences', () => {
    // Test case: Retrieving user preferences
    // Input: sampleUser is an existing user in the database
    // Expected status code: 200
    // Expected behavior: correct preferences are retrieved from the database
    // Expected output: sampleUser.preferences
    it('retrieves user preferences', async () => {
        // Add user to database
        db.addUser(sampleUser);

        const response = await request(server)
            .get(`/api/preferences?user=${sampleUser.username}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleUser.preferences)
        
        const actualUser = await db.getUser(sampleUser.username);
        console.log("actualUser preferences: \n", actualUser.preferences);  

        // Compare specific fields
        expect(actualUser).toHaveProperty('preferences', sampleUser.preferences);
    });

    // Test case: Retrieving preferences for a non-existing user
    // Input: nonExistingUser is a user not present in the database
    // Expected status code: 404 (Not Found) or similar
    // Expected behavior: No user found in the database
    // Expected output: error message
    it('fails to retrieve preference with non-existing user', async () => {
        const response = await request(server)
            .get(`/api/preferences?user=${invalidUsernameUser.username}`);

        expect(response.statusCode).toBe(404);
        console.log("GET preference response : \n", response);

        // Checks if the error message contains the specified text
        expect(response.body.error).toMatch(/No such user exists/);
    });
});




describe('PUT /api/preferences', () => {
    preferencesUpdate = {
        commute_method: "bike", // changed
        traffic_alerts: true,
        preparation_time: "30 minutes",
        notification_preferences: {
            morning_alarm: true,
            event_alarm: true,
            event_notification: true,
            traffic_alerts: true,
            weather_alerts: false // unchanged
        },
        maxMissedBus: "2", // changed
        home_location: "updated home location",
        school_location: "new school!",
        work_location: "456 Business Ave, Your City", // unchanged
        snooze_duration: "10 minutes",
        vibration_alert: true
    }
    // Test case: Updating user preferences
    // Input: sampleUser is an existing user, preferencesUpdate contains new preferences
    // Expected status code: 200
    // Expected behavior: user's preferences are updated in the database
    // Expected output: { result: 'success' }
    it('updates user preferences', async () => {
        // Add user to database
        db.addUser(sampleUser);


        const response = await request(server)
            .put('/api/preferences')
            .send({ username: sampleUser.username, preferences: preferencesUpdate });

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toBe('success');
        
        const actualUser = await db.getUser(sampleUser.username);

        // Compare specific fields
        expect(actualUser).toHaveProperty('preferences', preferencesUpdate);
    });

    // Test case: Updating preferences for a non-existing user
    // Input: nonExistingUser is a user not present in the database, preferencesUpdate contains new preferences
    // Expected status code: 404 (Not Found) or similar
    // Expected behavior: No user found in the database
    // Expected output: error message
    it('fails to update preferences for a non-existing user', async () => {
        const response = await request(server)
            .put('/api/preferences')
            .send({ username: "This username does not exist", preferences: preferencesUpdate });

        expect(response.statusCode).toBe(404); // user not found
        // Checks if the error message contains the specified text
        expect(response.body.error).toMatch(/No such user exists/);
    });

    // Test case: Updating preferences with invalid input
    // Input: sampleUser is an existing user, invalidPreferencesUpdate contains incorrect or malformed data
    // Expected status code: 400 (Bad Request) or similar
    // Expected behavior: Invalid input format
    // Expected output: error message
    it('fails to update preferences with invalid input', async () => {
        // Add user to database
        db.addUser(sampleUser);

        const response = await request(server)
            .put('/api/preferences')
            .send({ username: sampleUser.username, preferences: invalidDataUser.preferences });

        expect(response.statusCode).toBe(500);  // user not found
        // Checks if the error message contains the specified text
        expect(response.body.error).toMatch(/user validation failed/);
    });
});
    
  
  