const request = require('supertest');
const express = require('express');
const knex = require('../db/knex');
const authRoutes = require('../routes/auth');
const progressRoutes = require('../routes/progress');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);

let token = '';
let dynamicEmail = `test${Date.now()}@example.com`;

afterAll(async () => {
  await knex.destroy();
});

describe('Authentication API — success cases', () => {
  test('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test',
        surname: 'User',
        email: dynamicEmail,
        password: 'pass1234'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('userId');
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: dynamicEmail,
        password: 'pass1234'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  test('returns user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('surname');
  });

  test('allows reusing same token for multiple requests', async () => {
    const res1 = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    const res2 = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
  });
});

describe('Authentication API — failure cases', () => {
  test('rejects weak password on registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak',
        surname: 'Pass',
        email: `weak${Date.now()}@example.com`,
        password: 'short'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  test('rejects duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test',
        surname: 'User',
        email: dynamicEmail,
        password: 'pass1234'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: dynamicEmail,
        password: 'wrongpass'
      });
    expect(res.statusCode).toBe(401);
  });

  test('rejects login with nonexistent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'somepass123'
      });
    expect(res.statusCode).toBe(401);
  });

  test('rejects profile access without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('rejects profile access with bad token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer bad.token.here');
    expect(res.statusCode).toBe(401);
  });
});

describe('Progress API — success and achievements', () => {
  test('submits progress and assigns achievements', async () => {
    const res = await request(app)
      .post('/api/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 1, time_taken: 15, anxiety_rating: 2 });
    expect(res.statusCode).toBe(201);
  });

  test('retrieves user progress (2 calls)', async () => {
    const res1 = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${token}`);
    const res2 = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${token}`);
    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
    expect(Array.isArray(res1.body)).toBe(true);
  });

  test('retrieves achievements', async () => {
    const res = await request(app)
      .get('/api/progress/achievements')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('awards multiple achievements correctly', async () => {
    const res = await request(app)
      .get('/api/progress/achievements')
      .set('Authorization', `Bearer ${token}`);
    const codes = res.body.map(a => a.code);
    expect(codes).toEqual(expect.arrayContaining([
      'lvl1_complete', 'calm_climber', 'eagle_eye', 'speed_runner'
    ]));
  });

  test('awards consistency_champ after 3 different levels', async () => {
    const levels = [4, 5, 6];
    for (const lvl of levels) {
      await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({ level: lvl, time_taken: 30, anxiety_rating: 5 });
    }
    const res = await request(app)
      .get('/api/progress/achievements')
      .set('Authorization', `Bearer ${token}`);
    const has = res.body.some(a => a.code === 'consistency_champ');
    expect(has).toBe(true);
  });

  test('re-saves same level with new time_taken', async () => {
    const res = await request(app)
      .post('/api/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 1, time_taken: 50, anxiety_rating: 6 });
    expect(res.statusCode).toBe(201);
  });
});

describe('Progress API — validation and failure cases', () => {
  test('fails to save progress without token', async () => {
    const res = await request(app)
      .post('/api/progress')
      .send({ level: 2, time_taken: 22, anxiety_rating: 5 });
    expect(res.statusCode).toBe(401);
  });

  test('fails with missing time_taken', async () => {
    const res = await request(app)
      .post('/api/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 3, anxiety_rating: 4 });
    expect([400, 500]).toContain(res.statusCode);
  });

  test('rejects invalid level number', async () => {
    const res = await request(app)
      .post('/api/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 999, time_taken: 20, anxiety_rating: 5 });
    expect([400, 500]).toContain(res.statusCode);
  });

  test('rejects negative anxiety rating', async () => {
    const res = await request(app)
      .post('/api/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 2, time_taken: 22, anxiety_rating: -2 });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  test('rejects non-numeric fields', async () => {
    const res = await request(app)
      .post('/api/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: "two", time_taken: "fast", anxiety_rating: "low" });
    expect(res.statusCode).toBe(400);
  });

  test('rejects /achievements without token', async () => {
    const res = await request(app)
      .get('/api/progress/achievements');
    expect(res.statusCode).toBe(401);
  });
  test('handles empty progress: justFinished is undefined', async () => {
  const user = await knex('users').where({ email: dynamicEmail }).first();
  await knex('progress').where({ user_id: user.id }).del();

  const res = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${token}`)
    .send({ level: 6, time_taken: 20, anxiety_rating: 4 });

  expect(res.statusCode).toBe(201);
});
test('skips achievement insert when already awarded', async () => {
  const res = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${token}`)
    .send({ level: 1, time_taken: 60, anxiety_rating: 8 });

  expect(res.statusCode).toBe(201);
});
test('awards consistency_champ for 3 distinct levels in order', async () => {
  const levels = [3, 4, 5];
  for (const lvl of levels) {
    await request(app)
      .post('/api/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: lvl, time_taken: 25, anxiety_rating: 6 });
  }

  const res = await request(app)
    .get('/api/progress/achievements')
    .set('Authorization', `Bearer ${token}`);

  const has = res.body.some(a => a.code === 'consistency_champ');
  expect(has).toBe(true);
});
test('triggers catch block when inserting broken progress', async () => {
  const res = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${token}`)
    .send({ level: 1, time_taken: 'wrong_type', anxiety_rating: 2 });

  expect([400, 500]).toContain(res.statusCode);
});

});
