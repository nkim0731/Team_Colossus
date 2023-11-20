/* Test for functions in Database.js */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const db = require('../Databases/Database');
// models to interact with memory server
const UserModel = mongoose.model('user', require('../Schema/userSchema'));
const ChatModel = mongoose.model('chat', require('../Schema/chatSchema'));

let mongoServer;
beforeAll(async () => {
    await db.disconnect();
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

    await db.connect();
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

    // need to mock expected behavior given input of this.authClient.verifyIdToken and ticket.getPayload
    test('verifyUser works with correct token', async () => {
        const id_token = 'token';
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

    // test('updatePreferences works on correct inputs', async () => {
    //     //
    // })
})

