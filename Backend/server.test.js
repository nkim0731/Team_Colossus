const server = require('./server.js');
const request = require('supertest');

// mock database
const db = require('./Mocks/MockDatabase.js');
jest.mock('./Databases/Database.js', () => require('./Mocks/MockDatabase.js'));

/* tests needs to have 100% coverage */

// testing login endpoint
describe('login with google', () => {
    test('first time login, register user', async () => {
        let data = { username: "newuser" }
        const res = await request(server)
            .post('/api/endpoint')
            .send(data)
            .set('Accept', 'application/json');

        expect(res.status).toBe(200);
        const user = await db.getUser(data.username);
        expect(user.password).toBe('Register from Google');
    })
})