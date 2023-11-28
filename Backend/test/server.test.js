const server = require('../server.js');
const request = require('supertest');

const db = require('../Databases/Database.js');
const Scheduler = require('../Interfaces/Scheduler.js');
const auth = require('../Interfaces/GoogleAuth.js');
const inputs = require('./mockInputs.js');

// mock database functions to only test endpoint functionalities
jest.mock('../Databases/Database.js');
jest.mock('../Interfaces/GoogleAuth.js');

// clean up server of tests
afterAll(() => {
    server.close();
})

// Backend tests
// 27 unit tests in server.test.js
// 6 unit test in scheduler.test.js
// 5 unit tests in message.test.js
// 22 unit tests in database.test.js

// Frontend tests
// 2 tests in CreateNewEventTest.java
// 1 test in ExampleInstrumentedTest.java
// 3 tests in preferenceTest.java
// 4 tests in SendMessageTest.java

const today = new Date();
const mockEvents = [
    { 
        eventName: 'cpen321',
        start: today.toISOString(),
        end: '2023-11-30T12:00:00Z',
        address: '2357 Main Mall, Vancouver',
    },
    { 
        eventName: 'event2',
        start: today.toISOString(),
        end: '2023-11-30T12:00:00Z',
        address: '6200 University Blvd, Vancouver',
    },
];
const mockUser = {
    username: 'user@gmail.com',
    events: mockEvents,
    preferences: { 
        commute_method: 'Driving',
        preparation_time: '0',
        notification_preferences: {
            morning_alarm: true,
            event_alarm: true,
            event_notification: true,
            traffic_alerts: true,
            weather_alerts: true,
        },
        maxMissedBus: '1',
    },
}
const mockDirections = {
    routes: [
        {
            legs: [
                {
                    distance: { value: 100, text: '100 m' },
                    duration: { value: 4200, text: '1 hours 10 mins' },
                    end_address: '2357 Main Mall, Vancouver',
                    start_address: '', // not important to mocked implementation
                    steps: [1, 2, 3], // details not important to implementation
                    arrival_time: { value: new Date(), text: '', timezone: 'America/Vancouver'},
                }
            ],
        },
    ],
}
const mockSchedule = [
    {
        event: mockEvents[0],
        route: JSON.parse(JSON.stringify(mockDirections.routes[0].legs[0], (key, value) => {
            if (key === 'steps' || key === 'arrival_time') {
                return undefined;
            }
            return value;
        })),
    },
    {
        event: mockEvents[1],
        route: JSON.parse(JSON.stringify(mockDirections.routes[0].legs[0], (key, value) => {
            if (key === 'steps' || key === 'arrival_time') {
                return undefined;
            }
            return value;
        })),
    }
];

// Interface POST /api/calendar/day_schedule
describe('create day schedule for a user', () => {

    // ChatGPT usage: Partial
    // Input: username latitude longitude id_token
    // Expected status code: 200
    // Expected behavior: create and store schedule in database
    // Expected output: return the schedule 
    it('should create a schedule for the current day', async () => {
        const data = { 
            username: 'user@gmail.com', 
            latitude: 49.1673,
            longitude: 123.1384,
        }
        const id_token = 'token';
        auth.verifyUser.mockResolvedValue(true);
        db.getUser.mockResolvedValue(mockUser);
        db.addSchedule.mockResolvedValue(true);
        // mock google api directions
        jest.spyOn(Scheduler, 'getDirections').mockImplementation(() => { return mockDirections });

        const res = await request(server)
            .post('/api/calendar/day_schedule')
            .send(data)
            .set('id_token', id_token)
            .set('Accept', 'application/json');

        // output expectations
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockSchedule);

        expect(auth.verifyUser).toHaveBeenCalledWith(id_token, data.username, process.env.CLIENT_ID);
        expect(db.getUser).toHaveBeenCalledWith(data.username);
        expect(db.addSchedule).toHaveBeenCalledWith(data.username, res.body);
    })

    // ChatGPT usage: Partial
    // Test Case: invalid token
    // Input: invalid token, username, latitude, longitude
    // Expected status code: 400
    // Expected behavior: nothing
    // Expected output: error
    it('should not make a schedule for an invalid token', async () => {
        const data = { 
            username: 'user@gmail.com', 
            latitude: 49.1673,
            longitude: 123.1384,
        }
        const id_token = 'invalid_token';

        auth.verifyUser.mockResolvedValue(false);
        const res = await request(server)
            .post('/api/calendar/day_schedule')
            .send(data)
            .set('id_token', id_token)
            .set('Accept', 'application/json');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('daySchedule');

        expect(auth.verifyUser).toHaveBeenCalledWith(id_token, data.username, process.env.CLIENT_ID);
    })

    // ChatGPT usage: Partial
    // Test Case: unable to get directions somewhere
    // Input: username, invalid latitude and/or longitude, id_token
    // Expected status code: 500
    // Expected behavior: nothing
    // Expected output: error
    it('should throw error if getting direction fails', async () => {
        const data = { 
            username: 'user@gmail.com', 
            latitude: 'not a lat',
            longitude: 'not a long',
        }
        const id_token = 'token';

        auth.verifyUser.mockResolvedValue(true);
        db.getUser.mockResolvedValue(mockUser);
        db.addSchedule.mockResolvedValue(true);
        jest.spyOn(Scheduler, 'getDirections').mockImplementation(() => { throw new Error('Bad LatLng') });

        const res = await request(server)
            .post('/api/calendar/day_schedule')
            .send(data)
            .set('id_token', id_token)
            .set('Accept', 'application/json');
        
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
        expect(res.body).not.toHaveProperty('daySchedule');
    })

    // TODO all test case of schedule
})

// Interface GET /api/calendar/day_schedule
describe('get day schedule for a user', () => {
    
    // ChatGPT usage: Partial
    // Test Case: get day schedule out of database
    // Input: date today, username, id_token
    // Expected status code: 200
    // Expected behavior: retrieve schedule from db
    // Expected output: schedule object
    it('should be able to return the day schedule', async () => {
        let day = new Date(today);
        day.setHours(0, 0, 0, 0);
        const id_token = 'token';

        auth.verifyUser.mockResolvedValue(true);
        db.getUser.mockResolvedValue({ daySchedule: mockSchedule });
        const res = await request(server)
            .get(`/api/calendar/day_schedule?user=${mockUser.username}&day=${day}`)
            .set('id_token', id_token);

        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('route');
        expect(res.body[0]).toHaveProperty('event');

        expect(db.getUser).toHaveBeenCalledWith(mockUser.username);
        // TODO validate schedule
    })

    // ChatGPT usage: No
    // Test Case: invalid token
    // Input: invalid_token, username, today
    // Expected status code: 400
    // Expected behavior: nothing
    // Expected output: error
    it('should handle bad token in get', async () => {
        let day = new Date(today);
        day.setHours(0, 0, 0, 0);
        const id_token = 'invalid_token';

        auth.verifyUser.mockResolvedValue(false);
        db.getUser.mockResolvedValue({ daySchedule: mockSchedule });
        const res = await request(server)
            .get(`/api/calendar/day_schedule?user=${mockUser.username}&day=${day}`)
            .set('id_token', id_token);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
    })

    // ChatGPT usage: Partial
    // Test Case: internal server error
    // Input: id_token, today, username
    // Expected status code: 500
    // Expected behavior: nothing
    // Expected output: error
    it('should handle internal server error', async () => {
        let day = new Date(today);
        day.setHours(0, 0, 0, 0);
        const id_token = 'token';

        auth.verifyUser.mockResolvedValue(true);
        jest.spyOn(db, 'getUser').mockImplementation(() => { throw new Error('Database error'); });
        const res = await request(server)
            .get(`/api/calendar/day_schedule?user=${mockUser.username}&day=${day}`)
            .set('id_token', id_token);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    })
})

// Interface GET /api/calendar/by_day
describe('get calendar events of a given day', () => {
    const events = [
        { 
            eventName: 'cpen321',
            start: '2023-11-18T09:00:00Z',
            end: '2023-11-18T12:00:00Z',
            address: '2357 Main Mall, Vancouver',
        },
        { 
            eventName: 'cpen321 v2',
            start: '2023-11-18T13:00:00Z',
            end: '2023-11-18T15:00:00Z',
            address: '2357 Main Mall, Vancouver',
        },
    ]

    // ChatGPT usage: Partial
    // Input: username as email string, id_token google auth session, day string
    // Expected status code: 200
    // Expected behavior: a valid user gets events on 
    // Expected output: array of events on the specified day
    it('should get events of a given day', async () => {
        const user = 'user@gmail.com';
        const id_token = 'token';
        const date = '2023-11-18';
        auth.verifyUser.mockResolvedValue(true);
        db.getUser.mockResolvedValue({ events });

        const res = await request(server)
            .get(`/api/calendar/by_day?user=${user}&day=${date}`)
            .set('id_token', id_token);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(events);

        expect(auth.verifyUser).toHaveBeenCalledWith(id_token, user, process.env.CLIENT_ID);
        expect(db.getUser).toHaveBeenCalledWith(user);
    })

    // ChatGPT usage: Partial
    // Input: username as email string, id_token google auth session, day string
    // Expected status code: 500
    // Expected behavior: nothing
    // Expected output: error
    it('should handle error case', async () => {
        jest.spyOn(auth, 'verifyUser').mockImplementation(() => { throw new Error('Database error'); });
        const user = 'user@gmail.com';
        const id_token = 'token';
        const date = '2023-11-18';
    
        const res = await request(server)
          .get(`/api/calendar/by_day?user=${user}&day=${date}`)
          .set('id_token', id_token);
    
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    // ChatGPT usage: Partial
    // Input: username as email string, invalid id_token google auth session, day string
    // Expected status code: 400
    // Expected behavior: nothing
    // Expected output: error
    it('should handle an invalid token', async () => {
        const user = 'user@gmail.com';
        const id_token = 'invalid_token';
        const date = '2023-11-18';
        auth.verifyUser.mockResolvedValue(false);
        db.getUser.mockResolvedValue({ events });
    
        const res = await request(server)
          .get(`/api/calendar/by_day?user=${user}&day=${date}`)
          .set('id_token', id_token);
    
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('events');
    });
})

// Interface GET /api/message_history
describe('get the message history of a specific chat', () => {
    const mockMessages = [
        {message: 'hi', sender: 'me', timestamp: 123},
        {message: 'hi', sender: 'you', timestamp: 123},
        {message: 'bye', sender: 'me', timestamp: 123}
    ];
    const mockChatName = 'cpen321';


    // ChatGPT usage: Partial
    // Test Case: get messages of a room
    // Input: chatName
    // Expected status code: 200
    // Expected behavior: fetch messages from db
    // Expected output: array of message objects
    it('should get message history of a chatroom', async () => {
        db.getRoom.mockResolvedValue({ messages: [
            {message: 'hi', sender: 'me', timestamp: 123},
            {message: 'hi', sender: 'you', timestamp: 123},
            {message: 'bye', sender: 'me', timestamp: 123}
        ] });

        const res = await request(server).get(`/api/message_history?chatName=${mockChatName}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockMessages);

        expect(db.getRoom).toHaveBeenCalledWith(mockChatName);
    })


    // ChatGPT usage: Partial
    // Test Case: internal server error
    // Input: chatName
    // Expected status code: 500
    // Expected behavior: nothing
    // Expected output: error
    it('should return error if issue with database or connection', async () => {
        jest.spyOn(db, 'getRoom').mockImplementation(() => { throw new Error('Database error'); });
        const res = await request(server).get(`/api/message_history?chatName=${mockChatName}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
        expect(res.body).not.toBeInstanceOf(Array);
    })
})

// Interface GET /api/chatrooms
describe('get chatrooms associated with a user', () => {
    const today = new Date();
    const mockUser = 'user@gmail.com';
    const mockEvents = [
        { 
            eventName: 'cpen321',
            start: today.toISOString(),
            end: '2023-11-30T12:00:00Z',
            address: '2357 Main Mall, Vancouver',
            hasChat: true,
        },
        { 
            eventName: 'event2',
            start: today.toISOString(),
            end: '2023-11-30T12:00:00Z',
            address: '6200 University Blvd, Vancouver',
            hasChat: false,
        },
    ];


    // ChatGPT usage: Partial
    // Test Case: retrieve chatroom associated with a user
    // Input: username
    // Expected status code: 200 
    // Expected behavior: fetch chatrooms filtered on ones user has
    // Expected output: array of chatrooms
    it('should get chatrooms of a user', async () => {
        db.getUser.mockResolvedValue({ events: mockEvents });
        jest.spyOn(db, 'getRoom').mockImplementation((eventName) => { 
            return { chatName: eventName, messages: [] }
        });
        jest.spyOn(db, 'createRoom').mockImplementation((eventName) => { 
            return { chatName: eventName, messages: [] }
        });

        const res = await request(server).get(`/api/chatrooms?user=${mockUser}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        // TODO validate room
    })


    // ChatGPT usage: Partial
    // Test Case: first message to chatroom, create the room
    // Input: username
    // Expected status code: 200
    // Expected behavior: creates chatroom for event in db
    // Expected output: array of chatrooms of user
    it('should create chatroom instance if not existing already', async () => {
        db.getUser.mockResolvedValue({ events: mockEvents });
        jest.spyOn(db, 'getRoom').mockImplementation(() => { 
            return null;
        });
        jest.spyOn(db, 'createRoom').mockImplementation((eventName) => { 
            return { chatName: eventName, messages: [] }
        });

        const res = await request(server).get(`/api/chatrooms?user=${mockUser}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
    })


    // ChatGPT usage: Partial
    // Test Case: internal server error
    // Input: username
    // Expected status code: 500
    // Expected behavior: nothing
    // Expected output: error
    it('should handle database errors', async () => {
        jest.spyOn(db, 'getUser').mockImplementation(() => { throw new Error('Database Error'); });
        const res = await request(server).get(`/api/chatrooms?user=${mockUser}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    })
})

// Interface POST /login/google
// this endpoint is not supposed to take anything else other than username
describe('logging in or registering with google signin', () => {
    // TODO add cases for null user

    // ChatGPT usage: Partial
    // Input: sampleUser is valid user
    // Expected status code: 200
    // Expected behavior: user is added to the database, and output is register new user
    // Expected output: { result: 'register' }
    it('should register a new user on first time login', async () => {
        db.getUser.mockResolvedValue(null);
        db.addUser.mockResolvedValue(true);

        const response = await request(server)
            .post('/login/google')
            .send(inputs.sampleUser)
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toBe('register');
        expect(db.addUser).toHaveBeenCalledWith(inputs.sampleUser);
    });

    // ChatGPT usage: Partial
    // Input: invalidUser
    // Expected status code: 500
    // Expected behavior: user is not added
    // Expected output: error message
    it('should not allow invalid user to register/login', async () => {
        const invalidUser = { username: null };
        db.getUser.mockResolvedValue(null);
        jest.spyOn(db, 'addUser').mockImplementation(() => { throw new Error("No such user exists"); }); // expected addUser behaviour
        
        const response = await request(server)
            .post('/login/google')
            .send(invalidUser)
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty('error');
    });

    // ChatGPT usage: Partial
    // Input: sampleUser is valid user
    // Expected status code: 200
    // Expected behavior: user is added to the database, and output is login user
    // Expected output: 'login'
    it('should log in an existing user', async () => {
        db.getUser.mockResolvedValue(inputs.sampleUser);

        const response = await request(server)
            .post('/login/google')
            .send(inputs.sampleUser)
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toBe('login');
    });
})

// Interface GET /api/preferences
describe('get a user preferences', () => {

    // ChatGPT usage: Partial
    // Test case: Retrieving user preferences
    // Input: sampleUser is an existing user in the database
    // Expected status code: 200
    // Expected behavior: correct preferences are retrieved from the database
    // Expected output: sampleUser.preferences
    it('gets user preferences', async () => {
        db.getUser.mockResolvedValue(inputs.sampleUser);
    
        const response = await request(server)
            .get(`/api/preferences?user=${inputs.sampleUser.username}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(inputs.sampleUser.preferences);
    });


    // ChatGPT usage: Partial
    // Test case: Retrieving preferences for a non-existing user
    // Input: nonExistingUser is a user not present in the database
    // Expected status code: 404 (Not Found) or similar
    // Expected behavior: No user found in the database
    // Expected output: error message
    it('should fail to retrieve preference of non-existing user', async () => {
        const invalidUser = 'invalid username';
        db.getUser.mockResolvedValue(null);

        const response = await request(server)
            .get(`/api/preferences?user=${invalidUser}`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('error');
    });


    // ChatGPT usage: Partial
    // Test case: connection error to database or server error
    // Input: sampleUser username
    // Expected status code: 500
    // Expected behavior: internal server error
    // Expected output: error message
    it('should fail on server error/database connection issues', async () => {
        jest.spyOn(db, 'getUser').mockImplementation(() => { throw new Error('Database Error'); });

        const response = await request(server).get(`/api/preferences?user=${inputs.sampleUser.username}`);

        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty('error');
    });

})

// Interface PUT /api/preferences
describe('update a user preferences', () => {
    const preferencesUpdate = {
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

    // ChatGPT usage: Partial
    // Test case: Updating user preferences
    // Input: sampleUser is an existing user, preferencesUpdate contains new preferences
    // Expected status code: 200
    // Expected behavior: user's preferences are updated in the database
    // Expected output: { result: 'success' }
    it('should update user preferences', async () => {
        db.updatePreferences.mockResolvedValue(true);
        
        const data = {
            username: inputs.sampleUser.username,
            preferences: preferencesUpdate,
        }
        const res = await request(server)
            .put('/api/preferences')
            .send(data)
            .set('Accept', 'application/json');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ result: 'success' });
        expect(db.updatePreferences).toHaveBeenCalledWith(inputs.sampleUser.username, preferencesUpdate);
    })

    // ChatGPT usage: Partial
    // Test case: Updating preferences for a non-existing user
    // Input: nonExistingUser is a user not present in the database, preferencesUpdate contains new preferences
    // Expected status code: 404 (Not Found) or similar
    // Expected behavior: No user found in the database
    // Expected output: error message
    it('should not update preferences for a non-existing user', async () => {
        db.updatePreferences.mockResolvedValue(false);

        const response = await request(server)
            .put('/api/preferences')
            .send({ username: "This username does not exist", preferences: preferencesUpdate })
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toMatch(/No such user exists/);
    });

    // ChatGPT usage: Partial
    // Test case: connection error to database or server error
    // Input: sampleUser username, preferencesUpdate contains new preferences
    // Expected status code: 500
    // Expected behavior: internal server error
    // Expected output: error message
    it('should fail on connection error to database or server error', async () => {
        jest.spyOn(db, 'updatePreferences').mockImplementation(() => { throw new Error('Database Error') });

        const data = {
            username: inputs.sampleUser.username,
            preferences: preferencesUpdate,
        }
        const res = await request(server)
            .put('/api/preferences')
            .send(data)
            .set('Accept', 'application/json');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error')
    })
})

// Interface GET /api/calendar
describe('get a user events', () => {
    // Test Case: get events of a user
    // Input: username, id_token
    // Expected status code: 200
    // Expected behavior: fetch events from db
    // Expected output: events array from db
    it('should get events array of a valid user', async () => {
        const id_token = 'token';
        auth.verifyUser.mockResolvedValue(true);
        db.getUser.mockResolvedValue({ events: inputs.sampleUser.events });
        
        const res = await request(server)
            .get(`/api/calendar?user=${inputs.sampleUser.username}`)
            .set('id_token', id_token);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(inputs.sampleUser.events);
        expect(db.getUser).toHaveBeenCalledWith(inputs.sampleUser.username);
    })

    // Test Case: invalid token
    // Input: invalid_token, username
    // Expected status code: 400
    // Expected behavior: nothing
    // Expected output: error
    it('should fail on invalid token', async () => {
        const id_token = 'invalid_token';
        auth.verifyUser.mockResolvedValue(false);
        db.getUser.mockResolvedValue({ events: inputs.sampleUser.events });
        
        const res = await request(server)
            .get(`/api/calendar?user=${inputs.sampleUser.username}`)
            .set('id_token', id_token);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
    })

    // Test Case: internal server error
    // Input: id_token, username
    // Expected status code: 500
    // Expected behavior: nothing
    // Expected output: error
    it('should fail on server error', async () => {
        const id_token = 'token';
        auth.verifyUser.mockResolvedValue(true);
        jest.spyOn(db, 'getUser').mockImplementation(() => { throw new Error('Database Error') });
        
        const res = await request(server)
            .get(`/api/calendar?user=${inputs.sampleUser.username}`)
            .set('id_token', id_token);

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    })
})

// Interface POST /api/calendar
describe('create a user events and add it to the user data', () => {
    const today = new Date();
    const mockUser = 'user@gmail.com';
    const mockEvents = [
        { 
            eventName: 'cpen321',
            start: today.toISOString(),
            end: '2023-11-30T12:00:00Z',
            address: '2357 Main Mall, Vancouver',
        },
        { 
            eventName: 'event2',
            start: today.toISOString(),
            end: '2023-11-30T12:00:00Z',
            address: '6200 University Blvd, Vancouver',
        },
    ];

    // Test Case: adding events to user
    // Input: array of events, username, id_token
    // Expected status code: 200
    // Expected behavior: events pushed to events array of user on db
    // Expected output: success message
    it('should be able to push array of events', async () => {
        const id_token = 'token';
        const data = {
            username: mockUser,
            events: mockEvents,
        }
        auth.verifyUser.mockResolvedValue(true);
        db.addEvents.mockResolvedValue(true);
        
        const res = await request(server)
            .post('/api/calendar')
            .send(data)
            .set('id_token', id_token)
            .set('Accept', 'application/json');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: 'Events add successful' });
        expect(db.addEvents).toHaveBeenCalledWith(mockUser, mockEvents);
    })

    // Test Case: invalid token
    // Input: invalid_token, username, events array
    // Expected status code: 400
    // Expected behavior: nothing
    // Expected output: error
    it('should fail on invalid token', async () => {
        const id_token = 'invalid_token';
        const data = {
            username: mockUser,
            events: mockEvents,
        }
        auth.verifyUser.mockResolvedValue(false);
        db.addEvents.mockResolvedValue(true);
        
        const res = await request(server)
            .post('/api/calendar')
            .send(data)
            .set('id_token', id_token)
            .set('Accept', 'application/json');

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ message: 'Could not verify user' });
    })

    // Test Case: internal server error
    // Input: id_token, username, events array
    // Expected status code: 500
    // Expected behavior: nothing
    // Expected output: error
    it('should fail on server error', async () => {
        const id_token = 'token';
        const data = {
            username: mockUser,
            events: mockEvents,
        }
        auth.verifyUser.mockResolvedValue(true);
        jest.spyOn(db, 'addEvents').mockImplementation(() => { throw new Error('Database Error') });
        
        const res = await request(server)
            .post('/api/calendar')
            .send(data)
            .set('id_token', id_token)
            .set('Accept', 'application/json');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    })
})