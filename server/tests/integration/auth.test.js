const request = require('supertest');
const dbHandler = require('../helpers/dbHandler');
const app = require('../../app');
const User = require('../../models/User');

describe('Authentication & Authorization API Integration Tests', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register new customer user successfully with HTTP-only cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Customer',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user.password).toBeUndefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject registration if email already exists', async () => {
      await User.create({
        name: 'Existing User',
        email: 'jane@example.com',
        password: 'Password123!',
        role: 'customer',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Customer',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject weak passwords like "123456" or "password"', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Pass',
          email: 'weak@example.com',
          password: '123456',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Password');
    });

    it('should prevent role escalation on registration (force role=customer)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker',
          email: 'hacker@example.com',
          password: 'Password123!',
          role: 'admin', // Attempting role escalation
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('customer'); // Forced customer
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Valid User',
        email: 'valid@example.com',
        password: 'Password123!',
        role: 'customer',
      });
    });

    it('should login valid user and return 200 with HTTP-only cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('valid@example.com');
    });

    it('should reject incorrect password with uniform generic message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject non-existent user with uniform generic message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return currently logged-in user profile', async () => {
      const user = await User.create({
        name: 'Logged User',
        email: 'logged@example.com',
        password: 'Password123!',
        role: 'customer',
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'logged@example.com', password: 'Password123!' });

      const cookie = loginRes.headers['set-cookie'];

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('logged@example.com');
    });

    it('should reject request without valid authentication token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
