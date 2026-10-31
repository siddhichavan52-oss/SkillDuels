// Static configuration and seed content for SkillDuels.
// In production these live in MongoDB; the frontend reads them through store.js or the API.

export const MATCH_QUESTIONS = 6 // questions per duel
export const QUESTION_SECONDS = 15 // countdown per question (FR-04)
export const REVEAL_MS = 1700 // pause after a question closes
export const MIN_QUESTIONS_TO_PLAY = 3 // a category needs this many published questions
export const SEARCH_SECONDS = 8 // how long to look for a live opponent before offering a bot

export const RESULT_BONUS = { win: 100, draw: 50, loss: 25 }

/* ---------- Tiers (rank titles driven by XP) ---------- */

export const TIERS = [
  { id: 'rookie', name: 'Rookie', min: 0, color: '#AEB5DA' },
  { id: 'challenger', name: 'Challenger', min: 2000, color: '#6CC4FF' },
  { id: 'strategist', name: 'Strategist', min: 5000, color: '#3DD9A8' },
  { id: 'master', name: 'Master', min: 10000, color: '#C3A1FF' },
  { id: 'grandmaster', name: 'Grandmaster', min: 20000, color: '#FFC93C' },
]

export function tierFor(xp) {
  let tier = TIERS[0]
  for (const t of TIERS) if (xp >= t.min) tier = t
  return tier
}

export function tierProgress(xp) {
  const current = tierFor(xp)
  const next = TIERS.find((t) => t.min > xp) || null
  if (!next) return { current, next: null, pct: 100, remaining: 0 }
  const pct = Math.round((100 * (xp - current.min)) / (next.min - current.min))
  return { current, next, pct, remaining: next.min - xp }
}

/* ---------- Badges (FR-10) ---------- */

export const BADGES = [
  {
    id: 'first_win',
    name: 'Opening move',
    description: 'Win your first duel.',
    icon: 'swords',
    bonus: 50,
    test: (u) => (u.wins || 0) >= 1,
  },
  {
    id: 'hat_trick',
    name: 'Hat-trick',
    description: 'Win three duels in a row.',
    icon: 'flame',
    bonus: 75,
    test: (u) => (u.winStreak || 0) >= 3,
  },
  {
    id: 'streak_3',
    name: 'Three-day streak',
    description: 'Play on three days in a row.',
    icon: 'bolt',
    bonus: 60,
    test: (u) => (u.streak || 0) >= 3,
  },
  {
    id: 'week_warrior',
    name: 'Week warrior',
    description: 'Play five duels in one week.',
    icon: 'shield',
    bonus: 100,
    test: (u) => (u.weekly?.matches || 0) >= 5,
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Answer every question correctly in a duel.',
    icon: 'target',
    bonus: 80,
    test: (u) => (u.perfect || 0) >= 1,
  },
  {
    id: 'quick_draw',
    name: 'Quick draw',
    description: 'Land 10 correct answers within 3 seconds.',
    icon: 'clock',
    bonus: 60,
    test: (u) => (u.quick || 0) >= 10,
  },
  {
    id: 'polymath',
    name: 'Polymath',
    description: 'Play duels in three different categories.',
    icon: 'globe',
    bonus: 100,
    test: (u) => (u.categoriesPlayed || []).length >= 3,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Complete 10 duels.',
    icon: 'medal',
    bonus: 120,
    test: (u) => (u.matches || 0) >= 10,
  },
]

/* ---------- Visual options for categories (admin panel) ---------- */

export const CATEGORY_ICONS = ['code', 'calculator', 'bulb', 'database', 'book', 'globe', 'bolt', 'target', 'shield']
export const CATEGORY_COLORS = ['#6CC4FF', '#FFC93C', '#3DD9A8', '#C3A1FF', '#FF9DBB', '#FFB07A', '#8EE3E0', '#B8E36B']
export const AVATAR_COLORS = ['#FFC93C', '#3DD9A8', '#C3A1FF', '#6CC4FF', '#FF9DBB', '#8EE3E0', '#FFB07A']

/* ---------- Categories (FR-08) ---------- */

export const SEED_CATEGORIES = [
  {
    id: 'technical',
    name: 'Technical',
    description: 'Web development, JavaScript and everyday engineering knowledge.',
    icon: 'code',
    color: '#6CC4FF',
  },
  {
    id: 'aptitude',
    name: 'Aptitude',
    description: 'Percentages, ratios, speed and number patterns under time pressure.',
    icon: 'calculator',
    color: '#FFC93C',
  },
  {
    id: 'logic',
    name: 'Logical reasoning',
    description: 'Syllogisms, series, relations and puzzles that reward a clear head.',
    icon: 'bulb',
    color: '#3DD9A8',
  },
  {
    id: 'database',
    name: 'Databases and SQL',
    description: 'Queries, keys, joins, normalization and the basics of MongoDB.',
    icon: 'database',
    color: '#C3A1FF',
  },
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    description: 'Arrays, trees, graphs, dynamic programming, and Big-O time complexity.',
    icon: 'bolt',
    color: '#FFB07A',
  },
  {
    id: 'cloud',
    name: 'Cloud & DevOps',
    description: 'Docker, Kubernetes, CI/CD pipelines, AWS services, and Linux administration.',
    icon: 'globe',
    color: '#8EE3E0',
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity & Networks',
    description: 'Encryption, network protocols, web application security, and threat defense.',
    icon: 'shield',
    color: '#FF9DBB',
  },
  {
    id: 'core-cs',
    name: 'Computer Fundamentals',
    description: 'Operating systems, CPU scheduling, memory management, and process synchronization.',
    icon: 'book',
    color: '#B8E36B',
  },
]

/* ---------- Questions ---------- */

const q = (id, categoryId, text, options, answer, difficulty = 'easy') => ({
  id,
  categoryId,
  text,
  options,
  answer,
  difficulty,
  status: 'published',
})

export const SEED_QUESTIONS = [
  // Technical (12 questions)
  q('t1', 'technical', 'Which React hook runs side effects after a component renders?', ['useState', 'useEffect', 'useMemo', 'useRef'], 1),
  q('t2', 'technical', 'What does typeof null return in JavaScript?', ['"null"', '"undefined"', '"object"', '"number"'], 2, 'medium'),
  q('t3', 'technical', 'Which HTTP status code means "Not Found"?', ['200', '301', '404', '500'], 2),
  q('t4', 'technical', 'Which CSS property controls the stacking order of positioned elements?', ['z-index', 'order', 'float', 'display'], 0),
  q('t5', 'technical', 'What does JSON stand for?', ['JavaScript Object Notation', 'Java Standard Object Network', 'JavaScript Online Node', 'Joined Script Object Name'], 0),
  q('t6', 'technical', 'Which array method adds an element to the end of an array?', ['pop()', 'push()', 'shift()', 'unshift()'], 1),
  q('t7', 'technical', 'Which of these is NOT a primitive type in JavaScript?', ['string', 'boolean', 'array', 'symbol'], 2, 'medium'),
  q('t8', 'technical', 'Which Git command creates a new branch and switches to it?', ['git branch -d feature', 'git checkout -b feature', 'git merge feature', 'git stash feature'], 1),
  q('t9', 'technical', 'What does the "===" strict equality operator check in JavaScript?', ['Value only', 'Value and type', 'Type only', 'Memory address only'], 1),
  q('t10', 'technical', 'Which cleanup mechanism runs before a React component unmounts?', ['useEffect return callback', 'componentDidMount', 'render()', 'useMemo()'], 0, 'medium'),
  q('t11', 'technical', 'In the JavaScript event loop, which queue executes before the Macrotask queue?', ['Microtask queue (Promises)', 'RequestAnimationFrame queue', 'SetTimeout queue', 'Idle callback queue'], 0, 'hard'),
  q('t12', 'technical', 'Which HTML attribute provides alternative text for accessibility when an image fails to load?', ['title', 'src', 'alt', 'aria-label'], 2),

  // Aptitude (12 questions)
  q('a1', 'aptitude', 'A train covers 120 km in 2 hours. At the same speed, how far does it go in 5 hours?', ['250 km', '300 km', '350 km', '600 km'], 1),
  q('a2', 'aptitude', 'What is 15% of 240?', ['24', '30', '36', '45'], 2),
  q('a3', 'aptitude', '6 workers finish a job in 10 days. How many days would 12 workers need at the same rate?', ['3 days', '5 days', '15 days', '20 days'], 1),
  q('a4', 'aptitude', 'What is the average of 4, 8, 12, 16 and 20?', ['10', '12', '14', '15'], 1),
  q('a5', 'aptitude', 'A shirt costs ₹800 after a 20% discount. What was the original price?', ['₹960', '₹1,000', '₹1,040', '₹1,200'], 1, 'medium'),
  q('a6', 'aptitude', 'Two numbers are in the ratio 3:5 and add up to 64. What is the larger number?', ['24', '32', '40', '48'], 2, 'medium'),
  q('a7', 'aptitude', 'What is the simple interest on ₹5,000 at 8% per year for 3 years?', ['₹1,000', '₹1,200', '₹1,500', '₹2,000'], 1),
  q('a8', 'aptitude', 'What comes next in the sequence? 2, 6, 12, 20, 30, ?', ['38', '40', '42', '44'], 2, 'medium'),
  q('a9', 'aptitude', 'A sum of money doubles itself in 5 years at simple interest. What is the rate of interest per annum?', ['10%', '15%', '20%', '25%'], 2, 'medium'),
  q('a10', 'aptitude', 'A card is drawn from a well-shuffled pack of 52 cards. What is the probability of drawing a King?', ['1/13', '1/26', '1/52', '4/13'], 0),
  q('a11', 'aptitude', 'Pipe A fills a tank in 6 hours and Pipe B empties it in 8 hours. How long to fill the tank if both are open?', ['12 hours', '18 hours', '24 hours', '30 hours'], 2, 'medium'),
  q('a12', 'aptitude', 'Find the compound interest on ₹10,000 at 10% per annum for 2 years, compounded annually.', ['₹2,000', '₹2,100', '₹2,200', '₹2,500'], 1, 'medium'),

  // Logical reasoning (12 questions)
  q('l1', 'logic', 'All cats are animals. All animals need water. Which conclusion follows?', ['Some animals are not cats', 'All cats need water', 'No cat is an animal', 'All water is for cats'], 1),
  q('l2', 'logic', 'Which one is the odd one out?', ['Apple', 'Banana', 'Carrot', 'Mango'], 2),
  q('l3', 'logic', 'Find the next letter in the series: A, C, F, J, ?', ['N', 'O', 'P', 'Q'], 1, 'hard'),
  q('l4', 'logic', 'Ravi is taller than Sam. Sam is taller than Tej. Who is the shortest?', ['Ravi', 'Sam', 'Tej', 'Cannot be determined'], 2),
  q('l5', 'logic', 'How many times do the hands of a clock overlap in 12 hours?', ['10', '11', '12', '13'], 1, 'hard'),
  q('l6', 'logic', 'Today is Wednesday. What day will it be after 100 days?', ['Thursday', 'Friday', 'Saturday', 'Sunday'], 1, 'medium'),
  q('l7', 'logic', 'Mira points to a man: "He is the son of my mother\'s only brother." How is he related to Mira?', ['Brother', 'Uncle', 'Cousin', 'Nephew'], 2, 'medium'),
  q('l8', 'logic', 'Complete the sequence: 1, 4, 9, 16, 25, ?', ['30', '34', '36', '49'], 2),
  q('l9', 'logic', 'If South-East becomes North, and North-East becomes West, what will West become?', ['North-East', 'South-East', 'South-West', 'North-West'], 1, 'hard'),
  q('l10', 'logic', 'In a code, "ROAD" is written as "URDG". How is "SWAN" written in that code?', ['VXDQ', 'VZCQ', 'UXDQ', 'VZDQ'], 3, 'medium'),
  q('l11', 'logic', 'Statements: Some books are pens. All pens are desks. Conclusion: Some books are desks.', ['Follows logically', 'Does not follow', 'Cannot be determined', 'Contradictory'], 0),
  q('l12', 'logic', 'A woman says: "He is the son of the only daughter of the father of my brother." Who is he to her?', ['Brother', 'Son', 'Nephew', 'Uncle'], 1, 'hard'),

  // Databases (12 questions)
  q('d1', 'database', 'Which SQL clause filters rows after they have been grouped?', ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], 1, 'medium'),
  q('d2', 'database', 'Which MongoDB method inserts a single document into a collection?', ['insertOne()', 'addOne()', 'push()', 'create()'], 0),
  q('d3', 'database', 'Which MongoDB operator matches values strictly greater than a given value?', ['$gt', '$gte', '$lt', '$ne'], 0, 'medium'),
  q('d4', 'database', 'What does a primary key guarantee?', ['Each row is uniquely identified', 'Values are encrypted', 'Rows are sorted alphabetically', 'The table has no other keys'], 0),
  q('d5', 'database', 'Which JOIN returns only rows that have matches in both tables?', ['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'], 0),
  q('d6', 'database', 'Which of these is a NoSQL document database?', ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'], 2),
  q('d7', 'database', 'Which command removes all rows from a table but keeps its structure?', ['DROP TABLE', 'TRUNCATE TABLE', 'ALTER TABLE', 'DELETE DATABASE'], 1, 'medium'),
  q('d8', 'database', 'What is a database index mainly used for?', ['Speeding up data lookups', 'Backing up data', 'Encrypting columns', 'Renaming tables'], 0),
  q('d9', 'database', 'Which normal form eliminates transitive functional dependencies?', ['1NF', '2NF', '3NF', 'BCNF'], 2, 'medium'),
  q('d10', 'database', 'In MongoDB, which aggregation stage reshapes documents or computes calculated fields?', ['$match', '$project', '$group', '$unwind'], 1),
  q('d11', 'database', 'What does the "I" stand for in database ACID properties?', ['Integration', 'Isolation', 'Index', 'Iteration'], 1),
  q('d12', 'database', 'Which data structure type is Redis primarily categorized as?', ['Key-Value Store', 'Document Database', 'Wide-Column Store', 'Graph Database'], 0, 'medium'),

  // Data Structures & Algorithms (10 questions)
  q('ds1', 'dsa', 'What is the worst-case time complexity of searching in a balanced Binary Search Tree (AVL)?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 1),
  q('ds2', 'dsa', 'Which data structure operates on the Last-In, First-Out (LIFO) principle?', ['Queue', 'Stack', 'Priority Queue', 'Circular Array'], 1),
  q('ds3', 'dsa', 'What is the average time complexity of QuickSort?', ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'], 1),
  q('ds4', 'dsa', 'Which algorithm finds the shortest path in a weighted graph with non-negative weights?', ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Tarjan's Algorithm", "Kadane's Algorithm"], 0, 'medium'),
  q('ds5', 'dsa', 'Which data structure is typically used to implement Breadth-First Search (BFS)?', ['Stack', 'Queue', 'Max Heap', 'Binary Search Tree'], 1),
  q('ds6', 'dsa', 'What is the worst-case space complexity of recursive tree traversal with depth n?', ['O(1)', 'O(n)', 'O(n²)', 'O(2ⁿ)'], 1, 'medium'),
  q('ds7', 'dsa', 'Which algorithmic paradigm does Kadane’s algorithm for maximum subarray sum use?', ['Dynamic Programming', 'Greedy Method', 'Backtracking', 'Divide and Conquer'], 0, 'medium'),
  q('ds8', 'dsa', 'In a hash table with good hashing, what is the average lookup time complexity?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 0),
  q('ds9', 'dsa', 'Which of the following sorting algorithms is NOT stable by default?', ['Merge Sort', 'Insertion Sort', 'Heap Sort', 'Bubble Sort'], 2, 'hard'),
  q('ds10', 'dsa', 'What is the time complexity to retrieve the minimum element from a Min-Heap?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 0, 'medium'),

  // Cloud & DevOps (10 questions)
  q('cl1', 'cloud', 'What is the core purpose of a Docker container?', ['To virtualize complete hardware', 'To package applications with dependencies in lightweight isolation', 'To replace network switches', 'To transpile JavaScript code'], 1),
  q('cl2', 'cloud', 'In Kubernetes, what is the smallest deployable computing unit?', ['Node', 'Cluster', 'Pod', 'Service'], 2),
  q('cl3', 'cloud', 'Which AWS service provides resizable on-demand virtual server instances?', ['Amazon S3', 'Amazon EC2', 'Amazon RDS', 'AWS Lambda'], 1),
  q('cl4', 'cloud', 'What does the abbreviation CI/CD stand for in modern DevOps?', ['Continuous Integration / Continuous Delivery', 'Code Inspection / Code Deployment', 'Central Infrastructure / Cloud Distribution', 'Container Isolation / Cluster Directory'], 0),
  q('cl5', 'cloud', 'Which HTTP status code indicates a gateway timeout from an upstream proxy?', ['400 Bad Request', '403 Forbidden', '502 Bad Gateway', '504 Gateway Timeout'], 3, 'medium'),
  q('cl6', 'cloud', 'What is Infrastructure as Code (IaC) used for?', ['Writing frontend components', 'Managing infrastructure using versioned configuration files', 'Debugging memory leaks in C++', 'Encrypting SSL certificates'], 1, 'medium'),
  q('cl7', 'cloud', 'Which open-source tool by HashiCorp is industry standard for multi-cloud IaC?', ['Terraform', 'Webpack', 'Ansible Vault', 'Babel'], 0, 'medium'),
  q('cl8', 'cloud', 'What is the function of a Kubernetes liveness probe?', ['Measure connection latency', 'Detect when a container needs to be restarted', 'Format persistent disk volumes', 'Scale down cluster nodes'], 1, 'medium'),
  q('cl9', 'cloud', 'Which Linux utility monitors CPU, memory, and active processes in real time?', ['top', 'grep', 'chmod', 'curl'], 0),
  q('cl10', 'cloud', 'Which deployment strategy shifts traffic to a new version in small incremental percentages?', ['Blue-Green Deployment', 'Canary Deployment', 'Recreate Deployment', 'Big Bang Deployment'], 1, 'hard'),

  // Cybersecurity & Networks (10 questions)
  q('sec1', 'cybersecurity', 'At which layer of the 7-layer OSI model does the TCP protocol operate?', ['Network Layer (3)', 'Transport Layer (4)', 'Session Layer (5)', 'Application Layer (7)'], 1),
  q('sec2', 'cybersecurity', 'What distinguishes asymmetric encryption from symmetric encryption?', ['Asymmetric uses a public and private key pair', 'Asymmetric cannot be decrypted', 'Symmetric is only used for audio streams', 'Symmetric does not use any key'], 0),
  q('sec3', 'cybersecurity', 'Which attack occurs when malicious queries are injected through unsanitized user inputs?', ['Cross-Site Scripting (XSS)', 'SQL Injection (SQLi)', 'Man-in-the-Middle', 'DDoS'], 1),
  q('sec4', 'cybersecurity', 'Which cryptographic protocol secures modern web communications over HTTPS?', ['TLS (Transport Layer Security)', 'FTP', 'SNMP', 'TELNET'], 0),
  q('sec5', 'cybersecurity', 'Which HTTP response header helps prevent XSS by restricting allowed script origins?', ['Access-Control-Allow-Origin', 'Content-Security-Policy (CSP)', 'X-Powered-By', 'Server'], 1, 'medium'),
  q('sec6', 'cybersecurity', 'What is the main objective of a Distributed Denial of Service (DDoS) attack?', ['Exfiltrate hashed passwords', 'Overwhelm a system so legitimate users cannot access it', 'Reverse engineer source code', 'Poison DNS servers permanently'], 1),
  q('sec7', 'cybersecurity', 'Which algorithm is recommended for slow, salted password hashing to resist brute force?', ['Bcrypt (or Argon2)', 'MD5', 'SHA-1', 'Base64'], 0, 'medium'),
  q('sec8', 'cybersecurity', 'What is the primary function of the Domain Name System (DNS)?', ['Translating domain names into IP addresses', 'Encrypting HTTP requests', 'Assigning MAC addresses to routers', 'Compressing video streaming packets'], 0),
  q('sec9', 'cybersecurity', 'Which exploit tricks an authenticated browser into sending unauthorized requests to a web app?', ['Cross-Site Request Forgery (CSRF)', 'Buffer Overflow', 'ARP Poisoning', 'Port Scanning'], 0, 'medium'),
  q('sec10', 'cybersecurity', 'What is the default TCP port used for secure SSH connections?', ['21', '22', '80', '443'], 1, 'medium'),

  // Computer Fundamentals (10 questions)
  q('cs1', 'core-cs', 'Which CPU scheduling algorithm gives each process a fixed time slice in cyclical order?', ['First-Come, First-Served', 'Shortest Job Next', 'Round Robin', 'Priority Scheduling'], 2),
  q('cs2', 'core-cs', 'What situation occurs when two processes wait indefinitely for resources held by each other?', ['Paging', 'Deadlock', 'Thrashing', 'Fragmentation'], 1),
  q('cs3', 'core-cs', 'What is the primary benefit of Virtual Memory in operating systems?', ['Increases clock speed of the CPU', 'Allows running programs larger than physical RAM', 'Permanently prevents malware', 'Speeds up monitor refresh rates'], 1),
  q('cs4', 'core-cs', 'What condition occurs when excessive paging activity degrades CPU throughput to near zero?', ['Thrashing', 'Deadlock', 'Spooling', 'Starvation'], 0, 'medium'),
  q('cs5', 'core-cs', 'What synchronization primitive consists of an integer accessed only via atomic wait() and signal()?', ['Semaphore', 'Thread Pool', 'Process Control Block', 'TLB'], 0, 'medium'),
  q('cs6', 'core-cs', 'In computer architecture, what does the ALU stand for?', ['Arithmetic Logic Unit', 'Advanced Language Unit', 'Asynchronous Linkage Utility', 'Array Level Unit'], 0),
  q('cs7', 'core-cs', 'Which kernel component directly interfaces with physical hardware controllers?', ['Device Drivers', 'Command Shell', 'Window Manager', 'File Archiver'], 0, 'medium'),
  q('cs8', 'core-cs', 'Which memory type resides directly inside the CPU and has the fastest access time?', ['Hard Disk Drive', 'RAM', 'CPU Registers', 'L3 Cache'], 2),
  q('cs9', 'core-cs', 'What is a race condition in multi-threaded programming?', ['When two threads execute at different clock frequencies', 'When the output depends on non-deterministic thread execution timing', 'When CPU temperature exceeds safe limits', 'When a thread terminates without closing sockets'], 1, 'medium'),
  q('cs10', 'core-cs', 'What is external fragmentation in memory management?', ['Total memory space exists to satisfy a request, but it is not contiguous', 'Memory inside an allocated block is wasted', 'Virtual page tables overflow RAM', 'A process leaks pointers'], 0, 'hard'),
]

export const SEED_PLAYERS = []

/* ---------- Practice opponents ---------- */
// Used when no live opponent is found. accuracy = chance of a correct answer,
// minTime/maxTime = how quickly (in seconds) the bot tends to answer.

export const BOT_OPPONENTS = [
  { id: 'bot_nova', name: 'Nova', avatarColor: '#FF9DBB', xp: 3200, accuracy: 0.62, minTime: 4, maxTime: 11 },
  { id: 'bot_bolt', name: 'Bolt', avatarColor: '#8EE3E0', xp: 4800, accuracy: 0.55, minTime: 2, maxTime: 7 },
  { id: 'bot_quill', name: 'Quill', avatarColor: '#FFB07A', xp: 6500, accuracy: 0.74, minTime: 5, maxTime: 12 },
  { id: 'bot_pixel', name: 'Pixel', avatarColor: '#B8E36B', xp: 2400, accuracy: 0.5, minTime: 3, maxTime: 10 },
]
