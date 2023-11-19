const request = require('supertest');
const server = require('../server.js');
const db = require('../Databases/Database.js');
const { MongoMemoryServer } = require('mongodb-memory-server');

// For loading env variables
const path = require('path');
const envFilePath = path.join(__dirname ,'/../.env');
require('dotenv').config({ path: envFilePath });

/*
So:
    working on unit test for 
    '/login/google' POST
    '/api/preferences' POST GET
    '/api/calendar' POST GET

*/

// Mock the entire Database class
jest.mock('../Databases/Database.js', () => {
    return jest.fn().mockImplementation(() => {
      return {
        getUser: jest.fn().mockResolvedValue({ username: 'testuser', email: 'test@example.com' })
        // Mock other methods if needed
      };
    });
  });
  

describe('POST /login/google', () => {
  let mongoServer;
  let dbInstance;

  beforeAll(async () => {
    // Start an in-memory MongoDB server
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();

    // Set the MongoDB URI for your application to the in-memory server
    process.env.MONGO_URI = mongoUri;
    console.log('process.env.MONGO_URI is set : ', process.env.MONGO_URI)

    // Create a MongoDB client and database instance
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    dbInstance = client.db();
  });

  afterAll(async () => {
    // Stop the in-memory MongoDB server and close the client
    await mongoServer.stop();
  });

  it('registers a new user', async () => {
    // Mock the database response for a new user
    db.getUser.mockResolvedValue(null);
    db.addUser.mockResolvedValue({ /* Mocked user data */ });

    const response = await request(server)
      .post('/login/google')
      .send({ username: 'newuser@example.com' }); // Mock request body

    expect(response.statusCode).toBe(200);
    expect(response.body.result).toBe('register');
  });

  it('logs in an existing user', async () => {
    // Mock the database response for an existing user
    db.getUser.mockResolvedValue({ /* Existing user data */ });

    const response = await request(server)
      .post('/login/google')
      .send({ username: 'existinguser@example.com' });

    expect(response.statusCode).toBe(200);
    expect(response.body.result).toBe('login');
  });

  // Add more tests for error cases...
});





describe('GET /api/preferences', () => {
    it('retrieves user preferences', async () => {
      // Mock database call
      db.getUser.mockResolvedValue({ username: 'user1', preferences: {/* preferences data */} });
  
      const response = await request(server)
        .get('/api/preferences?user=user1');
  
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({/* expected preferences data */});
    });
  
    // Add tests for error cases...
  });
  

  describe('PUT /api/preferences', () => {
    it('updates user preferences', async () => {
      // Mock database calls
      db.updatePreferences.mockResolvedValue({/* Updated preferences data */});
  
      const response = await request(server)
        .put('/api/preferences')
        .send({ username: 'user1', preferences: {/* new preferences data */} });
  
      expect(response.statusCode).toBe(200);
      expect(response.body.result).toBe('success');
    });
  
    // Add tests for error cases...
  });
  




  /*
    // test needs to have 100% coverage
    const request = require('supertest');
    const server = require('../server.js');
    const db = require('../Databases/Database.js');

    describe('API Endpoint Tests', () => {
    // Test /login/google endpoint
    describe('POST /login/google', () => {
        it('should register a new user if not already registered', async () => {
        const response = await request(server)
            .post('/login/google')
            .send({ username: 'newuser' });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('register');
        });

        it('should login an existing user', async () => {
        const response = await request(server)
            .post('/login/google')
            .send({ username: 'existinguser' });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('login');
        });
    });

    // Test /api/preferences endpoint
    describe('PUT /api/preferences', () => {
        it('should update user preferences', async () => {
        const response = await request(server)
            .put('/api/preferences')
            .send({ username: 'user1', preferences: { theme: 'dark' } });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('success');
        });
    });

    describe('GET /api/preferences', () => {
        it('should get user preferences', async () => {
        const response = await request(server)
            .get('/api/preferences')
            .query({ user: 'user1' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ theme: 'dark' });
        });
    });

    // Test /api/calendar/import endpoint
    describe('GET /api/calendar/import', () => {
        it('should import calendar events for a user', async () => {
        const response = await request(server)
            .get('/api/calendar/import')
            .query({ useremail: 'user1@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.events).toHaveLength(3);
        });
    });

    // Test /api/calendar endpoint
    describe('GET /api/calendar', () => {
        it('should get calendar events for a user', async () => {
        const response = await request(server)
            .get('/api/calendar')
            .query({ user: 'user1' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);
        });
    });

    describe('POST /api/calendar', () => {
        it('should add events to the calendar', async () => {
        const response = await request(server)
            .post('/api/calendar')
            .send({ username: 'user1', events: [{ title: 'Event 1' }, { title: 'Event 2' }] });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Events add successful');
        });
    });

    // Test /api/calendar/by_day endpoint
    describe('GET /api/calendar/by_day', () => {
        it('should get calendar events for a specific day', async () => {
        const response = await request(server)
            .get('/api/calendar/by_day')
            .query({ user: 'user1', day: '2022-01-01' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        });
    });
    });
  */