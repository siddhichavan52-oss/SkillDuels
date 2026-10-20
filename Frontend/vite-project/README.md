# SkillDuels (frontend)

Competitive learning and quiz battle platform. React 19 + Vite. Built from
`EDU-WEB-2026-115-SRS-v1.2`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

No extra dependencies are needed. All app code lives in `src/components/`.

## Pages

- `#/` landing page for visitors (hero, how it works, categories, features, live weekly rankings, tiers, FAQ)
- `#/login` and `#/signup` account pages
- After signing in: Home, Play, Leaderboard and Profile for players; Admin and Leaderboard for administrators

## Demo accounts

| Role   | Email                  | Password   |
| ------ | ---------------------- | ---------- |
| Player | ava@skillduels.dev     | Player@123 |
| Admin  | admin@skillduels.dev   | Admin@123  |

You can also create your own player account on the sign-up tab.

## Demo a live two-player duel

1. Open the app in two browser tabs (same browser).
2. Tab 1: log in as Ava. Tab 2: create a new account (each tab keeps its own login).
3. In both tabs go to **Play** and pick the **same category**.
4. The tabs pair up, receive the same questions, and scores update live in both.

If nobody joins within 8 seconds, a practice bot steps in so a duel is always playable.

## Requirement coverage

| ID | Where |
| --- | --- |
| FR-01 register / log in | `AuthPage.jsx`, `store.js` (login, register) |
| FR-02 XP and rank on profile | `Profile.jsx`, `Dashboard.jsx`, `store.js` (recordMatch) |
| FR-03 two-player matches | `Matchmaking.jsx`, `Match.jsx`, `matchChannel.js` |
| FR-04 per-question countdown | `Match.jsx` (15 s timer, auto-advance at zero) |
| FR-05 live scores | `Match.jsx` score cards and tug bar, fed by `matchChannel.js` |
| FR-06 global leaderboard | `Leaderboard.jsx` (Global tab) |
| FR-07 weekly rankings | `Leaderboard.jsx` (Weekly tab, resets each ISO week) |
| FR-08 skill categories | `Lobby.jsx`, `data.js` |
| FR-09 admin panel | `AdminPanel.jsx` (categories, questions, hide/publish) |
| FR-10 badges and bonus points | `data.js` (BADGES), `Result.jsx`, `Profile.jsx` |
| NFR-03 role-based access | admin routes and actions check role in `App.jsx` and `store.js` |
| NFR-04 nothing lost on disconnect | match progress is saved after every answer and recovered on next sign-in |
| NFR-05/07 usability, accessibility | visible toasts for every action, keyboard play (1-4 / A-D), focus rings, labelled controls, skip link, reduced-motion support |
| NFR-06 compatibility | responsive layout; bottom navigation on tablet and phone |

## Files in `src/components/`

| File | Purpose |
| --- | --- |
| `Landing.jsx` | Public landing page |
| `AuthPage.jsx` | Log in, sign up, demo shortcuts |
| `DuelPreview.jsx` | Product preview used on the landing and sign-in pages |
| `Navbar.jsx` | Top bar and mobile bottom navigation |
| `Dashboard.jsx` | Home: tier progress, stats, weekly top five, recent duels, badges |
| `Lobby.jsx`, `Matchmaking.jsx` | Category picker and opponent search |
| `Match.jsx` | Live duel screen |
| `Result.jsx` | Score, XP breakdown, rank change, badges, question review |
| `Leaderboard.jsx`, `Profile.jsx` | Rankings and player profile |
| `AdminPanel.jsx` | Content management and moderation |
| `ui.jsx`, `Icons.jsx`, `Toast.jsx`, `toastContext.js` | Shared UI |
| `store.js` | Data layer (stands in for the Express and MongoDB API) |
| `matchChannel.js` | Real-time layer (stands in for Socket.IO) |
| `data.js`, `utils.js`, `styles.css` | Seed content and config, helpers, design system |

## Connecting the real backend later

The frontend runs standalone, so two modules stand in for the server:

- **`store.js`** keeps data in `localStorage`. Each exported function mirrors an API call
  (`login` is `POST /auth/login`, `recordMatch` is `POST /matches`, and so on). Replace the
  bodies with `fetch()` calls that send the JWT.
- **`matchChannel.js`** defines the channel interface the match screen uses. A commented
  Socket.IO adapter in the file header shows the event names to implement
  (`match:answer`, `match:opponentAnswer`, `match:opponentLeft`, `queue:join`).

Passwords in the demo are hashed with a toy function. Do not reuse it: the real backend
should hash with bcrypt or argon2 and issue JWTs.

## Scoring

- Correct answer: 100 points, plus up to 50 for answering quickly.
- Match XP: your points plus a result bonus (win 100, draw 50, loss 25).
- Daily streak bonus: 10 XP per streak day (up to 7), on the first duel of each day.
- Badges pay a one-off XP bonus.
- Tiers: Rookie, Challenger (2,000 XP), Strategist (5,000), Master (10,000), Grandmaster (20,000).
