const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;

beforeAll(async () => {
    // Setup env vars
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key';
    
    // Start mongo memory server
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    
    // Require app after env vars are set so it connects to the memory server
    app = require('../server');
});

afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

describe('Auth Endpoints', () => {
    it('Should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Athlete',
                email: 'athlete@test.com',
                password: 'password123A'
            });
            
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('name', 'Test Athlete');
    });

    it('Should fail registration with existing email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Another Athlete',
                email: 'athlete@test.com',
                password: 'password123A'
            });
            
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'User already exists');
    });

    it('Should login exiting user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'athlete@test.com',
                password: 'password123A'
            });
            
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('email', 'athlete@test.com');
    });

    it('Should fail login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'athlete@test.com',
                password: 'wrongpassword'
            });
            
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('Should reject weak password on register', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Weak Password',
                email: 'weak@test.com',
                password: 'weak'
            });
            
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/Password must be/);
    });
});
