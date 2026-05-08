const request = require('supertest');
const knex    = require('knex');
const configs = require('../../knexfile');

let app;
let db;

beforeAll(async () => {
  process.env.NODE_ENV           = 'test';
  process.env.JWT_SECRET         = 'test_secret_at_least_32_characters_here!!';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars!!';
  process.env.ENCRYPTION_KEY     = '0'.repeat(64);
  process.env.CORS_ORIGINS       = 'http://localhost:3000';
  process.env.DB_PATH            = ':memory:';

  db  = knex(configs.test);
  await db.migrate.latest();
  await db.seed.run();

  // patch the app's db singleton
  jest.resetModules();
  jest.mock('../../src/config/database', () => db);
  app = require('../../src/app');
}, 30000);

afterAll(async () => {
  await db.destroy();
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 and tokens for valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email:'admin@platform.com', password:'Admin@123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.refresh_token).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email:'admin@platform.com', password:'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 422 for missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email:'admin@platform.com' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/auth/me', () => {
  let token;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email:'admin@platform.com', password:'Admin@123' });
    token = res.body.data.access_token;
  });

  it('returns user info with valid token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@platform.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
