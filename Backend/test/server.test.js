/* 
    charles backend tests
    move this out of Backend folder when testing
    move it back when pushing
*/
const server = require('../server.js');
const request = require('supertest');

const db = require('../Databases/Database.js');
const Scheduler = require('../Interfaces/Scheduler.js');

// mock database functions to only test endpoint functionalities
jest.mock('../Databases/Database.js');


beforeEach(async () => {
    jest.clearAllMocks(); // Clear mocks before each test
});

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

    // Input: 
    // Expected status code: 
    // Expected behavior: 
    // Expected output: 
    it('should create a schedule for the current day', async () => {
        const data = { 
            username: 'user@gmail.com', 
            latitude: 49.1673,
            longitude: 123.1384,
        }
        const id_token = 'token';
        db.verifyUser.mockResolvedValue(true);
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

        expect(db.verifyUser).toHaveBeenCalledWith(id_token, data.username, process.env.CLIENT_ID);
        expect(db.getUser).toHaveBeenCalledWith(data.username);
        expect(db.addSchedule).toHaveBeenCalledWith(data.username, res.body);
    })

    it('should not make a schedule for an invalid token', async () => {
        const data = { 
            username: 'user@gmail.com', 
            latitude: 49.1673,
            longitude: 123.1384,
        }
        const id_token = 'invalid_token';

        db.verifyUser.mockResolvedValue(false);
        const res = await request(server)
            .post('/api/calendar/day_schedule')
            .send(data)
            .set('id_token', id_token)
            .set('Accept', 'application/json');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('daySchedule');

        expect(db.verifyUser).toHaveBeenCalledWith(id_token, data.username, process.env.CLIENT_ID);
    })

    it('should throw error if getting direction fails', async () => {
        const data = { 
            username: 'user@gmail.com', 
            latitude: 'not a lat',
            longitude: 'not a long',
        }
        const id_token = 'token';

        db.verifyUser.mockResolvedValue(true);
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
})

// Interface GET /api/calendar/day_schedule
describe('get day schedule for a user', () => {
    
    it('should be able to return the day schedule', async () => {
        let day = new Date(today);
        day.setHours(0, 0, 0, 0);
        const id_token = 'token';

        db.verifyUser.mockResolvedValue(true);
        db.getSchedule.mockResolvedValue({ daySchedule: mockSchedule });
        const res = await request(server)
            .get(`/api/calendar/day_schedule?user=${mockUser.username}&day=${day}`)
            .set('id_token', id_token);

        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('route');
        expect(res.body[0]).toHaveProperty('event');

        expect(db.getSchedule).toHaveBeenCalledWith(mockUser.username);
    })

    it('should handle bad token in get', async () => {
        let day = new Date(today);
        day.setHours(0, 0, 0, 0);
        const id_token = 'invalid_token';

        db.verifyUser.mockResolvedValue(false);
        db.getSchedule.mockResolvedValue({ daySchedule: mockSchedule });
        const res = await request(server)
            .get(`/api/calendar/day_schedule?user=${mockUser.username}&day=${day}`)
            .set('id_token', id_token);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
    })

    it('should handle internal server error', async () => {
        let day = new Date(today);
        day.setHours(0, 0, 0, 0);
        const id_token = 'token';

        db.verifyUser.mockResolvedValue(true);
        jest.spyOn(db, 'getSchedule').mockImplementation(() => { throw new Error('Database error'); });
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
    // Input: username as email string, id_token google auth session, day string
    // Expected status code: 200
    // Expected behavior: a valid user gets events on 
    // Expected output: array of events on the specified day
    it('should get events of a given day', async () => {
        const user = 'user@gmail.com';
        const id_token = 'token';
        const date = '2023-11-18';
        db.verifyUser.mockResolvedValue(true);
        db.getCalendar.mockResolvedValue({ events });

        const res = await request(server)
            .get(`/api/calendar/by_day?user=${user}&day=${date}`)
            .set('id_token', id_token);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(events);

        expect(db.verifyUser).toHaveBeenCalledWith(id_token, user, process.env.CLIENT_ID);
        expect(db.getCalendar).toHaveBeenCalledWith(user);
    })
    // Input: username as email string, id_token google auth session, day string
    // Expected status code: 500
    // Expected behavior: 
    // Expected output: 
    it('should handle error case', async () => {
        jest.spyOn(db, 'verifyUser').mockImplementation(() => { throw new Error('Database error'); });
        const user = 'user@gmail.com';
        const id_token = 'token';
        const date = '2023-11-18';
    
        const res = await request(server)
          .get(`/api/calendar/by_day?user=${user}&day=${date}`)
          .set('id_token', id_token);
    
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
    // Input: username as email string, invalid id_token google auth session, day string
    // Expected status code: 400
    // Expected behavior: 
    // Expected output: 
    it('should handle an invalid token', async () => {
        const user = 'user@gmail.com';
        const id_token = 'invalid_token';
        const date = '2023-11-18';
        db.verifyUser.mockResolvedValue(false);
        db.getCalendar.mockResolvedValue({ events });
    
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

    it('should get message history of a chatroom', async () => {
        db.getMessages.mockResolvedValue({ messages: [
            {message: 'hi', sender: 'me', timestamp: 123},
            {message: 'hi', sender: 'you', timestamp: 123},
            {message: 'bye', sender: 'me', timestamp: 123}
        ] });

        const res = await request(server).get(`/api/message_history?chatName=${mockChatName}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockMessages);

        expect(db.getMessages).toHaveBeenCalledWith(mockChatName);
    })

    it('should return error if issue with database or connection', async () => {
        jest.spyOn(db, 'getMessages').mockImplementation(() => { throw new Error('Database error'); });
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

    it('should get chatrooms of a user', async () => {
        db.getCalendar.mockResolvedValue({ events: mockEvents });
        jest.spyOn(db, 'getRoom').mockImplementation((eventName) => { 
            return { chatName: eventName, messages: [] }
        });
        jest.spyOn(db, 'createRoom').mockImplementation((eventName) => { 
            return { chatName: eventName, messages: [] }
        });

        const res = await request(server).get(`/api/chatrooms?user=${mockUser}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
    })

    it('should create chatroom instance if not existing already', async () => {
        db.getCalendar.mockResolvedValue({ events: mockEvents });
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

    it('should handle database errors', async () => {
        jest.spyOn(db, 'getCalendar').mockImplementation(() => { throw new Error('Database Error'); });
        const res = await request(server).get(`/api/chatrooms?user=${mockUser}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    })
})


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

// Interface POST /login/google
// this endpoint is not supposed to take anything else other than username
describe('logging in or registering with google signin', () => {
    // Input: sampleUser is valid user
    // Expected status code: 200
    // Expected behavior: user is added to the database, and output is register new user
    // Expected output: { result: 'register' }
    it('should register a new user on first time login', async () => {
        db.userExists.mockResolvedValue(false);
        db.addUser.mockResolvedValue(sampleUser);

        const response = await request(server)
            .post('/login/google')
            .send(sampleUser)
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toBe('register');
        expect(db.addUser).toHaveBeenCalledWith(sampleUser);
    });

    // Input: invalidUser
    // Expected status code: 500
    // Expected behavior: user is not added
    // Expected output: error message
    it('should not allow invalid user to register/login', async () => {
        const invalidUser = { username: null };
        db.userExists.mockResolvedValue(false); // expect false
        jest.spyOn(db, 'addUser').mockImplementation(() => { throw new Error("No such user exists"); }); // expected addUser behaviour
        
        const response = await request(server)
            .post('/login/google')
            .send(invalidUser)
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty('error');
    });

    // Input: sampleUser is valid user
    // Expected status code: 200
    // Expected behavior: user is added to the database, and output is login user
    // Expected output: 'login'
    it('should log in an existing user', async () => {
        db.userExists.mockResolvedValue(true);
        db.addUser.mockResolvedValue(sampleUser);

        const response = await request(server)
            .post('/login/google')
            .send(sampleUser)
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(200);
        expect(response.body.result).toBe('login');
        expect(db.addUser).toHaveBeenCalledWith(sampleUser);
    });
})

// Interface GET /api/preferences
describe('get a user preferences', () => {
    // Test case: Retrieving user preferences
    // Input: sampleUser is an existing user in the database
    // Expected status code: 200
    // Expected behavior: correct preferences are retrieved from the database
    // Expected output: sampleUser.preferences
    it('gets user preferences', async () => {
        db.userExists.mockResolvedValue(true);
        db.getUser.mockResolvedValue(sampleUser);
    
        const response = await request(server)
            .get(`/api/preferences?user=${sampleUser.username}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleUser.preferences);
    });

    // Test case: Retrieving preferences for a non-existing user
    // Input: nonExistingUser is a user not present in the database
    // Expected status code: 404 (Not Found) or similar
    // Expected behavior: No user found in the database
    // Expected output: error message
    it('should fail to retrieve preference of non-existing user', async () => {
        const invalidUser = 'invalid username';
        db.userExists.mockResolvedValue(false);

        const response = await request(server)
            .get(`/api/preferences?user=${invalidUser}`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('error');
    });

    it('should fail on server error/database connection issues', async () => {
        db.userExists.mockResolvedValue(true);
        jest.spyOn(db, 'getUser').mockImplementation(() => { throw new Error('Database Error'); });

        const response = await request(server).get(`/api/preferences?user=${sampleUser.username}`);

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

    // Test case: Updating user preferences
    // Input: sampleUser is an existing user, preferencesUpdate contains new preferences
    // Expected status code: 200
    // Expected behavior: user's preferences are updated in the database
    // Expected output: { result: 'success' }
    it('should update user preferences', async () => {
        db.userExists.mockResolvedValue(true);
        db.updatePreferences.mockResolvedValue(preferencesUpdate);
        
        const data = {
            username: sampleUser.username,
            preferences: preferencesUpdate,
        }
        const res = await request(server)
            .put('/api/preferences')
            .send(data)
            .set('Accept', 'application/json');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ result: 'success' });
        expect(db.updatePreferences).toHaveBeenCalledWith(sampleUser.username, preferencesUpdate);
    })

    // Test case: Updating preferences for a non-existing user
    // Input: nonExistingUser is a user not present in the database, preferencesUpdate contains new preferences
    // Expected status code: 404 (Not Found) or similar
    // Expected behavior: No user found in the database
    // Expected output: error message
    it('should not update preferences for a non-existing user', async () => {
        db.userExists.mockResolvedValue(false);

        const response = await request(server)
            .put('/api/preferences')
            .send({ username: "This username does not exist", preferences: preferencesUpdate })
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toMatch(/No such user exists/);
    });

    it('should fail on connection error to database or server error', async () => {
        db.userExists.mockResolvedValue(true);
        jest.spyOn(db, 'updatePreferences').mockImplementation(() => { throw new Error('Database Error') });

        const data = {
            username: sampleUser.username,
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
    it('should get events array of a valid user', async () => {
        const id_token = 'token';
        db.verifyUser.mockResolvedValue(true);
        db.getCalendar.mockResolvedValue({ events: sampleUser.events });
        
        const res = await request(server)
            .get(`/api/calendar?user=${sampleUser.username}`)
            .set('id_token', id_token);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(sampleUser.events);
        expect(db.getCalendar).toHaveBeenCalledWith(sampleUser.username);
    })

    it('should fail on invalid token', async () => {
        const id_token = 'invalid_token';
        db.verifyUser.mockResolvedValue(false);
        db.getCalendar.mockResolvedValue({ events: sampleUser.events });
        
        const res = await request(server)
            .get(`/api/calendar?user=${sampleUser.username}`)
            .set('id_token', id_token);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
    })

    it('should fail on server error', async () => {
        const id_token = 'token';
        db.verifyUser.mockResolvedValue(true);
        jest.spyOn(db, 'getCalendar').mockImplementation(() => { throw new Error('Database Error') });
        
        const res = await request(server)
            .get(`/api/calendar?user=${sampleUser.username}`)
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

    it('should be able to push array of events', async () => {
        const id_token = 'token';
        const data = {
            username: mockUser,
            events: mockEvents,
        }
        db.verifyUser.mockResolvedValue(true);
        db.addEvents.mockResolvedValue(true); // function returns nothing
        
        const res = await request(server)
            .post('/api/calendar')
            .send(data)
            .set('id_token', id_token)
            .set('Accept', 'application/json');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: 'Events add successful' });
        expect(db.addEvents).toHaveBeenCalledWith(mockUser, mockEvents);
    })

    it('should fail on invalid token', async () => {
        const id_token = 'invalid_token';
        const data = {
            username: mockUser,
            events: mockEvents,
        }
        db.verifyUser.mockResolvedValue(false);
        db.addEvents.mockResolvedValue(true);
        
        const res = await request(server)
            .post('/api/calendar')
            .send(data)
            .set('id_token', id_token)
            .set('Accept', 'application/json');

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ message: 'Could not verify user' });
    })

    it('should fail on server error', async () => {
        const id_token = 'token';
        const data = {
            username: mockUser,
            events: mockEvents,
        }
        db.verifyUser.mockResolvedValue(true);
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