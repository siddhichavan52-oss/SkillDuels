import { connectDB, disconnectDB } from '../config/db.js';
import { Category } from '../models/Category.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { MatchDraft } from '../models/MatchDraft.js';
import { Match } from '../models/Match.js';
import { SEED_CATEGORIES, SEED_QUESTIONS } from './seedData.js';

export async function runSeed() {
  console.log('[Seed] Beginning database seed...');

  // Clean and initialize collections
  await Promise.all([
    Category.deleteMany({}),
    Question.deleteMany({}),
    MatchDraft.deleteMany({}),
    Match.deleteMany({}),
  ]);

  // 1. Insert Categories
  await Category.insertMany(SEED_CATEGORIES);
  console.log(`[Seed] Inserted ${SEED_CATEGORIES.length} categories.`);

  // 2. Insert Questions
  await Question.insertMany(SEED_QUESTIONS);
  console.log(`[Seed] Inserted ${SEED_QUESTIONS.length} questions.`);

  // 3. Insert Admin Account (admin@gmail.com / pass123)
  const adminEmail = 'admin@gmail.com';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: 'Admin',
      email: adminEmail,
      password: 'pass123',
      role: 'admin',
      avatarColor: '#C3A1FF',
    });
    console.log(`[Seed] Created Admin account: ${adminEmail} / pass123`);
  }

  console.log('[Seed] Seed completed successfully.');
  return { ok: true };
}

// Direct invocation via CLI: npm run seed
if (process.argv[1] && process.argv[1].endsWith('seedRunner.js')) {
  (async () => {
    try {
      await connectDB();
      await runSeed();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]', err);
      process.exit(1);
    }
  })();
}
