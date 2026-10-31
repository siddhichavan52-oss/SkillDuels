# SkillDuels Backend

Production-ready backend API and real-time multiplayer server for the **SkillDuels** competitive learning platform. Built with Express, MongoDB/Mongoose, JWT, and Socket.IO.

---

## Architecture & Features

### Phase 1: Auth & Data Models
- **Database Connection (`src/config/db.js`)**: Mongoose connection pooling (`maxPoolSize: 50`, `minPoolSize: 10`) and graceful shutdown.
- **User Schema (`src/models/User.js`)**: Bcrypt password hashing, compound indexes for fast leaderboard lookups, stats tracking (XP, streaks, badges, match history).
- **JWT Authentication (`src/controllers/authController.js`)**: Token generation, verification, and session recovery (`/api/auth/me`).
- **Category & Question Schema (`src/models/Category.js`, `src/models/Question.js`)**: Categories, 4-option questions, answer validation, status moderation (`published` / `hidden`).
- **RBAC Middleware (`src/middlewares/auth.js`)**: Role-based access control protecting administrative actions (NFR-03).

### Phase 2: Match Engine & Disconnect Persistence
- **Match Creation (`POST /api/matches/create`)**: Validates playable category pool, selects questions, shuffles options, and remaps answer indices.
- **Match Recording (`POST /api/matches/record`)**: Calculates scores, result bonuses, streak rewards, and atomically updates stats.
- **Persistence on Disconnect (`NFR-04`)**:
  - `POST /api/matches/draft`: Running scores and answers saved after every question.
  - `GET /api/matches/draft`: Interrupted match detection upon login/reconnect.
  - `POST /api/matches/recover`: Automatically resolves abandoned duels so earned XP is never lost.
  - `DELETE /api/matches/draft`: Cleans up completed drafts.
- **Real-Time Sockets (`src/sockets/matchSocket.js`)**: Socket.IO matchmaking queue (`queue:join`, `match:found`), live answers (`match:answer`, `match:opponentAnswer`), and forfeit notifications (`match:leave`, `match:opponentLeft`).

### Phase 3: XP/Rank Calculation & Leaderboard Aggregation
- **Scoring Engine (`src/services/xpService.js`)**:
  - Question points: 100 base + up to 50 for speed (`scorePoints`).
  - Result bonuses: Win = +100 XP, Draw = +50 XP, Loss = +25 XP, Forfeit = 0 XP.
  - Daily Streak: First match of a consecutive day extends streak; if streak ≥ 2, grants `min(streak, 7) * 10` bonus XP.
  - ISO Week: Aggregates XP earned during the current ISO calendar week (`YYYY-Www`).
  - Badges (`src/services/badgeService.js`): Automatic qualification testing for all 8 badges.
  - Tiers: Rookie (0), Challenger (2,000), Strategist (5,000), Master (10,000), Grandmaster (20,000).
- **Leaderboard Aggregation Pipelines (`src/controllers/leaderboardController.js`)**:
  - `GET /api/leaderboard/global`: MongoDB aggregation pipeline with pagination and search.
  - `GET /api/leaderboard/weekly`: Real-time weekly XP calculation pipeline.
  - `GET /api/leaderboard/me`: Calling user's global and weekly ranks.

### Phase 4: Security Hardening & Performance (NFR-01–03)
- **Security (`NFR-02`, `NFR-03`)**:
  - `helmet`: Sets standard HTTP security headers.
  - `cors`: Strict origin validation with credential support.
  - `express-rate-limit`: Auth rate limiting (20 attempts / 15 min) and API rate limiting (120 req / min).
  - Input validation: Email regex, password length/character requirements, distinct question choices.
  - Centralized error handler without stack trace leaks in production.
- **Performance (`NFR-01`)**:
  - `compression`: Gzip/Brotli response compression.
  - Compound indexes on `{ role: 1, xp: -1, name: 1 }` and `{ categoryId: 1, status: 1 }`.
  - `.lean()` queries to bypass Mongoose document hydration on read paths.

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new player account
- `POST /api/auth/login` - Authenticate and receive JWT
- `GET /api/auth/me` - Current authenticated user profile and tier progress
- `POST /api/auth/logout` - Discard session

### Categories
- `GET /api/categories` - List categories with playable question count
- `GET /api/categories/:id` - Get category details
- `POST /api/categories` - (Admin) Create category
- `PUT /api/categories/:id` - (Admin) Update category
- `DELETE /api/categories/:id` - (Admin) Delete category

### Questions
- `GET /api/questions` - (Admin) Filter questions by category and status
- `POST /api/questions` - (Admin) Create question
- `PUT /api/questions/:id` - (Admin) Update question
- `PATCH /api/questions/:id/status` - (Admin) Publish or hide question
- `DELETE /api/questions/:id` - (Admin) Delete question

### Matches
- `POST /api/matches/create` - Initialize duel with shuffled questions
- `POST /api/matches/record` - Record duel result and calculate XP
- `GET /api/matches/history` - User's recent match history
- `POST /api/matches/draft` - Save mid-match progress after an answer (NFR-04)
- `GET /api/matches/draft` - Retrieve active draft
- `DELETE /api/matches/draft` - Clear draft
- `POST /api/matches/recover` - Recover interrupted duel and award earned XP

### Leaderboards
- `GET /api/leaderboard/global` - Global all-time rankings
- `GET /api/leaderboard/weekly` - Current week's rankings
- `GET /api/leaderboard/me` - Authenticated player's ranks

### Admin
- `GET /api/admin/stats` - Platform stats (player, question, match counts)
- `POST /api/admin/reset-demo` - Reset database to default seed state

---

## Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (edit .env if needed)
cp .env.example .env

# 3. Seed database (creates categories, 32 questions, Ava, and Admin accounts)
npm run seed

# 4. Start development server with auto-reload
npm run dev

# 5. Run automated test suite
npm test
```

### Account Creation
Create an account via `POST /api/auth/register` (or the frontend Sign Up tab).
The first user registered is automatically granted the `admin` role; all subsequent accounts are created with the `player` role.
