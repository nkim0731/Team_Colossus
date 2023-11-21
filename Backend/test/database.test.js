/* Test for functions in Database.js */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const db = require('../Databases/Database');
const { OAuth2Client } = require('google-auth-library');
// models to interact with memory server
const UserModel = mongoose.model('user', require('../Schema/userSchema'));
const ChatModel = mongoose.model('chat', require('../Schema/chatSchema'));

let mongoServer;
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();

    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Test database interactions', () => {
    const mockUser = 'user@gmail.com';

    test('getUser gets correct user given username', async () => {
        await UserModel.create({ username: mockUser });

        const gotUser = await db.getUser('user@gmail.com');
        expect(gotUser.username).toBe(mockUser);
    })

    test('getUser fails with nonexisting username', async () => {
        try {
            await db.getUser('nouser@gmail.com');
        } catch (e) {
            expect(e.message).toBe("No such user exists");
        }
    })

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // need to mock expected behavior given input of this.authClient.verifyIdToken and ticket.getPayload
    test('verifyUser works with correct token', async () => {
        const id_token = 'token';
        const user = 'testuser@gmail.com';
        const audience = 'audience';

        const mockTicket = { getPayload: function getPayload() {
            return { 
                aud: 'audience', 
                iss: 'accounts.google.com', 
                exp: tomorrow, 
                email: user, 
            }
        }};

        // mock verifyIdToken
        OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue(mockTicket);

        const res = await db.verifyUser(id_token, user, audience);
        expect(res).toBeTruthy();
    })

    test('verifyUser fails if no payload', async () => {
        const id_token = 'token';
        const user = 'testuser@gmail.com';
        const audience = 'audience';
        const mockTicket = { getPayload: function getPayload() {
            return { 
                aud: 'audience', 
                iss: 'not valid iss', 
                exp: tomorrow, 
                email: user, 
            }
        }};
        OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue(mockTicket);

        const res = await db.verifyUser(id_token, user, audience);
        expect(res).toBeFalsy();
    })

    test('verifyUser fails on invalid payload', async () => {
        const id_token = 'token';
        const user = 'testuser@gmail.com';
        const audience = 'audience';
        const mockTicket = { getPayload: function getPayload() { return null }};
        OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue(mockTicket);

        const res = await db.verifyUser(id_token, user, audience);
        expect(res).toBeFalsy();
    })

    test('addUser adds a valid username to database', async () => {
        const newUser = { username: 'newuser@gmail.com' };
        await db.addUser(newUser);

        const findUser = await UserModel.findOne(newUser);
        expect(findUser).toBeDefined();
        expect(findUser.username).toBe(newUser.username);
    })

    test('addUser fails on invalid user', async () => {
        const invalidUser = { username: null };
        try {
            await db.addUser(invalidUser);
        } catch (e) {
            expect(e.message).toBe("No username provided");
        }
        const findUser = await UserModel.findOne(invalidUser);
        expect(findUser).toBeNull();
    })

    const preferenceUser = {
        username: 'testpreferences@gmail.com',
        password: 'testpassword',
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
        events: [],
        daySchedule: [],
    };

    test('updatePreferences works on correct inputs', async () => {
        const newUser = new UserModel(preferenceUser);
        await newUser.save();

        const updatedPreferences = { 
            commute_method: 'Transit',
            preparation_time: '30',
            notification_preferences: {
                event_alarm: false,
                event_notification: false,
            },
            maxMissedBus: '5',
        }
        const expectedPreferences = { 
            commute_method: 'Transit',
            preparation_time: '30',
            notification_preferences: {
                morning_alarm: true, // unchanged
                event_alarm: false,
                event_notification: false,
                traffic_alerts: true, // unchanged
                weather_alerts: true, // unchanged
            },
            maxMissedBus: '5',
        }

        await db.updatePreferences(preferenceUser.username, updatedPreferences);
        const findUser = await UserModel.findOne({ username: preferenceUser.username });
        expect(findUser.preferences).toEqual(expectedPreferences);
    })

    test('fail to updatePreferences for non-existing user', async () => {
        const badUser = 'doesntexist@gmail.com';
        const updatedPreferences = { 
            commute_method: 'Bicycle',
        }
        try {
            await db.updatePreferences(badUser, updatedPreferences);
        } catch (e) {
            expect(e.message).toBe("No such user exists");
        }
        const findUser = await UserModel.findOne({ username: badUser });
        expect(findUser).toBeNull();
    })

    const sampleUser = {
        username: "sampleUser_So@gmail.com",
        password: "thisisapassword",
        preferences: {
            commute_method: "Transit",
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
        },
        events: [
            {
                eventID: "06a9tvveju39v9c0et0egjgan7_20231031T183000Z",
                summary: "CPEN442 Meeting",
                eventName: "CPEN442 Meeting",
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
                eventName: "ASPC 496E 001",
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

    test('getCalendar for a valid user', async () => {
        const newUser = new UserModel(sampleUser);
        await newUser.save();

        await db.getCalendar(sampleUser.username);
        
        const findUser = await UserModel.findOne({ username: sampleUser.username });
        expect(findUser).toHaveProperty('events');
        expect(findUser.events).toEqual(sampleUser.events);
    })

    test('getCalendar fail on invalid user', async () => {
        const badUser = 'invalid@gmail.com';

        try {
            await db.getCalendar(badUser);
        } catch (e) {
            expect(e.message).toBe("No such user exists");
        }
        const findUser = await UserModel.findOne({ username: badUser });
        expect(findUser).toBeNull();
    })

    const today = new Date();
    const eventsToAdd = [
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
        {
            eventName: "CPEN442 Meeting", // existing event
            start: today.toISOString(),
            end: '2023-11-30T12:00:00Z',
            address: '6200 University Blvd, Vancouver',
        }
    ];

    test('addEvents to a valid user', async () => {
        await db.addEvents(sampleUser.username, eventsToAdd);
        
        const findUser = await UserModel.findOne({ username: sampleUser.username });
        expect(findUser.events.length).toBe(4); // 2 events already in, adding 2 new events, 1 existing already
        
        let expectedAddedEvent = eventsToAdd[0];
        expectedAddedEvent.hasChat = true;
        expect(findUser.events).toContainEqual(expectedAddedEvent);
    })

    test('addEvents fail on invalid user', async () => {
        const badUser = 'invalid@gmail.com';

        try {
            await db.addEvents(badUser, eventsToAdd);
        } catch (e) {
            expect(e.message).toBe("No such user exists");
        }
        const findUser = await UserModel.findOne({ username: badUser });
        expect(findUser).toBeNull();
    })

    const scheduleToAdd = [ { event: 'event1', route: 'route 1' }, ];
    test('addSchedule for valid user', async () => {
        await db.addSchedule(sampleUser.username, scheduleToAdd);

        const findUser = await UserModel.findOne({ username: sampleUser.username });
        expect(findUser.daySchedule).toEqual(scheduleToAdd);
    })

    test('addSchedule fails on invalid user', async () => {
        const badUser = 'invalid@gmail.com';

        try {
            await db.addSchedule(badUser, scheduleToAdd);
        } catch (e) {
            expect(e.message).toBe("No such user exists");
        }
        const findUser = await UserModel.findOne({ username: badUser });
        expect(findUser).toBeNull();
    })

    test('getSchedule for valid user', async () => {
        const res = await db.getSchedule(sampleUser.username);
        expect(res.daySchedule).toEqual(scheduleToAdd);
    })

    test('getSchedule fails for invalid user', async () => {
        const badUser = 'invalid@gmail.com';

        try {
            await db.getSchedule(badUser);
        } catch (e) {
            expect(e.message).toBe("No such user exists");
        }
        const findUser = await UserModel.findOne({ username: badUser });
        expect(findUser).toBeNull();
    })

    const testMessageLimit = 5;
    const mockChat = { chatName: 'cpen321', messages: [
        { message: 'hi', sender: 'me', timestamp: 123 }, 
        { message: 'hi', sender: 'me', timestamp: 123 }, 
        { message: 'hi', sender: 'me', timestamp: 123 }, 
        { message: 'hi', sender: 'me', timestamp: 123 }, 
        { message: 'lastmessage', sender: 'me', timestamp: 123 }, // test value for message limit is 5
    ] };
    test('getMessages succeeds for chat', async () => {
        const newRoom = new ChatModel(mockChat);
        await newRoom.save();

        const res = await db.getMessages('cpen321');
        expect(res.messages.length).toBe(testMessageLimit);
    })

    test('createRoom makes new room in database', async () => {
        const newRoomName = 'cpen491';

        const res = await db.createRoom('cpen491');
        expect(res.chatName).toBe(newRoomName);
        expect(res.messages.length).toBe(0);
    })

    test('getRoom returns the room object from database', async () => {
        const res = await db.getRoom(mockChat.chatName);
        expect(res.chatName).toBe(mockChat.chatName);
        expect(res.messages.length).toBe(testMessageLimit);
    })

    const message = { message: 'newmessage', sender: 'test', timestamp: 321 };

    test('addMessage adds a message to a chat', async () => {
        await db.addMessage(mockChat.chatName, message);

        const findChat = await ChatModel.findOne({ chatName: mockChat.chatName });
        expect(findChat.chatName).toBe(mockChat.chatName);
        expect(findChat.messages.length).toBe(testMessageLimit);
        expect(findChat.messages).toContainEqual(expect.objectContaining({ message: 'newmessage' }));
        expect(findChat.messages).not.toContainEqual(expect.objectContaining({ message: 'lastmessage' }));
    })

    test('addMessage creates room if not exist and adds message', async () => {
        const newRoom = 'cpen355';
        await db.addMessage(newRoom, message);

        const findChat = await ChatModel.findOne({ chatName: 'cpen355' });
        expect(findChat.chatName).toBe(newRoom);
        expect(findChat.messages.length).toBe(1);
        expect(findChat.messages).toContainEqual(expect.objectContaining({ message: 'newmessage' }));
    })

    // connect coverage, run this last since it disconnects from memoryserver
    test('connect function on database', async () => {
        await mongoose.disconnect();
        
        process.env.TESTING = 'false';
        const mongooseConnectSpy = jest.spyOn(mongoose, 'connect')
        await db.connect();
        expect(mongooseConnectSpy).toHaveBeenCalledWith(process.env.MONGO_URI);
        process.env.TESTING = 'true';
    })
})

