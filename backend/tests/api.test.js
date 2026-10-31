import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { runSeed } from '../src/seeds/seedRunner.js';
import { User } from '../src/models/User.js';
import { dayKey, weekKey } from '../src/services/xpService.js';

let mongoServer;
let adminToken;
let playerToken;
let playerId;

before(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create({
    instance: { launchTimeout: 120000 },
  });
  const uri = mongoServer.getUri();
  await connectDB(uri);

  // Seed the test database (categories & questions only, no demo accounts)
  await runSeed();

  // 1. Authenticate as admin (admin@gmail.com / pass123)
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@gmail.com', password: 'pass123' });
  adminToken = adminRes.body.token;

  // 2. Create test player via register -> assigned player role
  const playerRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Ava Sharma', email: 'ava@skillduels.dev', password: 'Player@123' });
  playerToken = playerRes.body.token;
  playerId = playerRes.body.user.id;

  // Set initial XP/stats on test player for leaderboard & tier testing
  await User.findByIdAndUpdate(playerId, {
    xp: 2650,
    weekly: { key: weekKey(), xp: 410, matches: 2 },
    matches: 12,
    wins: 7,
    losses: 4,
    draws: 1,
    winStreak: 1,
    streak: 2,
    lastPlayed: dayKey(-1),
    categoriesPlayed: ['technical', 'aptitude', 'logic'],
    badges: ['first_win', 'polymath', 'veteran'],
  });

  // Create additional test players for leaderboard aggregation tests
  await User.create([
    {
      name: 'Rohan Mehta',
      email: 'rohan.mehta@test.dev',
      password: 'Password1',
      role: 'player',
      xp: 21400,
      weekly: { key: weekKey(), xp: 1350, matches: 4 },
      matches: 96,
      wins: 71,
      losses: 25,
      streak: 1,
      lastPlayed: dayKey(),
    },
    {
      name: 'Priya Nair',
      email: 'priya.nair@test.dev',
      password: 'Password1',
      role: 'player',
      xp: 17850,
      weekly: { key: weekKey(), xp: 2300, matches: 6 },
      matches: 88,
      wins: 60,
      losses: 28,
      streak: 1,
      lastPlayed: dayKey(),
    },
  ]);
});

after(async () => {
  await disconnectDB();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Health check & security headers
test('GET /api/health should return 200 with status healthy and security headers', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'healthy');
  // Check Helmet security headers (NFR-02)
  assert.ok(res.headers['x-content-type-options']);
});

// Phase 1: Auth & Validation tests
test('Auth: Register new player with valid credentials', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Cadet',
      email: 'cadet@skillduels.dev',
      password: 'CadetPassword1',
    });

  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.name, 'Test Cadet');
  assert.equal(res.body.user.role, 'player');
});

test('Auth: Reject duplicate email registration', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Another Ava',
      email: 'ava@skillduels.dev',
      password: 'Password123',
    });

  assert.equal(res.status, 409);
  assert.ok(res.body.errors.email);
});

test('Auth: Reject weak password during registration', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Weak Pass',
      email: 'weak@skillduels.dev',
      password: '123',
    });

  assert.equal(res.status, 400);
  assert.ok(res.body.errors.password);
});

test('Auth: Authenticate /api/auth/me returns user profile and tier progress', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${playerToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'ava@skillduels.dev');
  assert.ok(res.body.tierProgress);
  assert.equal(res.body.tierProgress.current.name, 'Challenger');
});

// RBAC tests (NFR-03)
test('RBAC: Non-admin player forbidden from creating categories', async () => {
  const res = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${playerToken}`)
    .send({
      name: 'Hacking 101',
      description: 'Unauthorized category creation attempt.',
    });

  assert.equal(res.status, 403);
});

test('RBAC: Admin can create and retrieve a new category', async () => {
  const res = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Cloud Computing',
      description: 'AWS, GCP, serverless and distributed infrastructure basics.',
      icon: 'globe',
      color: '#3DD9A8',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.category.name, 'Cloud Computing');
});

// Phase 2: Match Creation & Disconnect Persistence
test('Match: Create match with shuffled questions and answers', async () => {
  const res = await request(app)
    .post('/api/matches/create')
    .set('Authorization', `Bearer ${playerToken}`)
    .send({
      categoryId: 'technical',
      mode: 'live',
    });

  assert.equal(res.status, 201);
  assert.ok(res.body.matchId);
  assert.equal(res.body.questions.length, 6);
  assert.ok(res.body.questions[0].options.length === 4);
});

test('Disconnect Persistence (NFR-04): Save draft and recover interrupted duel', async () => {
  // 1. Save mid-duel draft
  const draftPayload = {
    categoryId: 'technical',
    mode: 'live',
    oppName: 'Rohan Mehta',
    myScore: 420,
    oppScore: 350,
    correct: 3,
    total: 6,
    quick: 2,
  };

  const saveRes = await request(app)
    .post('/api/matches/draft')
    .set('Authorization', `Bearer ${playerToken}`)
    .send(draftPayload);

  assert.equal(saveRes.status, 200);
  assert.equal(saveRes.body.draft.myScore, 420);

  // 2. Fetch draft
  const getRes = await request(app)
    .get('/api/matches/draft')
    .set('Authorization', `Bearer ${playerToken}`);

  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.draft.myScore, 420);

  // 3. Recover interrupted draft
  const recoverRes = await request(app)
    .post('/api/matches/recover')
    .set('Authorization', `Bearer ${playerToken}`);

  assert.equal(recoverRes.status, 200);
  assert.equal(recoverRes.body.recovered, true);
  assert.ok(recoverRes.body.summary.xpGained >= 420);

  // 4. Verify draft is cleared after recovery
  const emptyRes = await request(app)
    .get('/api/matches/draft')
    .set('Authorization', `Bearer ${playerToken}`);
  assert.equal(emptyRes.body.draft, null);
});

// Phase 3: Match completion, XP/streak calculation, and Leaderboard
test('Match: Record match completion and calculate streak & XP', async () => {
  const matchResult = {
    categoryId: 'technical',
    myScore: 500,
    oppScore: 400,
    correct: 5,
    total: 6,
    quick: 3,
    mode: 'live',
    oppName: 'Priya Nair',
  };

  const res = await request(app)
    .post('/api/matches/record')
    .set('Authorization', `Bearer ${playerToken}`)
    .send(matchResult);

  assert.equal(res.status, 200);
  assert.equal(res.body.result, 'win');
  assert.equal(res.body.breakdown.result, 100); // 100 bonus for win
  assert.ok(res.body.xpGained >= 600);
});

test('Leaderboard: Global leaderboard returns ranked players excluding admins', async () => {
  const res = await request(app)
    .get('/api/leaderboard/global?limit=5')
    .set('Authorization', `Bearer ${playerToken}`);

  assert.equal(res.status, 200);
  assert.ok(res.body.leaderboard.length <= 5);
  assert.equal(res.body.leaderboard[0].rank, 1);
  assert.ok(res.body.userRank >= 1);
  // Verify no admin in leaderboard
  const hasAdmin = res.body.leaderboard.some((u) => u.name === 'Admin');
  assert.equal(hasAdmin, false);
});

test('Leaderboard: Weekly leaderboard computes current week XP', async () => {
  const res = await request(app)
    .get('/api/leaderboard/weekly')
    .set('Authorization', `Bearer ${playerToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.kind, 'weekly');
  assert.ok(res.body.leaderboard.length > 0);
  assert.ok(res.body.weekKey);
});

test('Leaderboard: Get calling user rank profile', async () => {
  const res = await request(app)
    .get('/api/leaderboard/me')
    .set('Authorization', `Bearer ${playerToken}`);

  assert.equal(res.status, 200);
  assert.ok(res.body.globalRank >= 1);
  assert.ok(res.body.weeklyRank >= 1);
  assert.ok(res.body.tier);
});
