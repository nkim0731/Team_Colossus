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
*/
const server = require('../server.js');
const request = require('supertest');

const db = require('../Databases/Database.js');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// env variables
const path = require('path');
const envFilePath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envFilePath });

jest.mock('../Databases/Database.js');

let mongoServer;
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

// Interface GET /api/calendar/by_day
describe('GET calendar events of a given day', () => {
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
        expect(res.body).toHaveProperty('message');
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