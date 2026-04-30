// const db = {
//     users: [
//         { id: 1, name: 'Hussam', email: 'hussam@example.com', balance: 10000, currency: 'SAR' },
//         { id: 2, name: 'Ali', email: 'ali@example.com', balance: 8000, currency: 'AED' },
//         { id: 3, name: 'Ahmed', email: 'ahmed@example.com', balance: 12000, currency: 'EGP' },
//         { id: 4, name: 'Fatima', email: 'fatima@example.com', balance: 9500, currency: 'OMR' },
//     ],

//     // ─── ORIGINAL SYSTEM POCKETS (percentage-based, untouched) ──────────────────
//     pockets: [
//         { id: 1, userId: 1, name: 'expenses', percentage: 0.5, balance: 0 },
//         { id: 2, userId: 1, name: 'savings', percentage: 0.3, balance: 0 },
//         { id: 3, userId: 1, name: 'commitments', percentage: 0.2, balance: 0 },
//         { id: 4, userId: 2, name: 'expenses', percentage: 0.5, balance: 0 },
//         { id: 5, userId: 2, name: 'savings', percentage: 0.3, balance: 0 },
//         { id: 6, userId: 2, name: 'commitments', percentage: 0.2, balance: 0 },
//         { id: 7, userId: 3, name: 'expenses', percentage: 0.5, balance: 0 },
//         { id: 8, userId: 3, name: 'savings', percentage: 0.3, balance: 0 },
//         { id: 9, userId: 3, name: 'commitments', percentage: 0.2, balance: 0 },
//         { id: 10, userId: 4, name: 'expenses', percentage: 0.5, balance: 0 },
//         { id: 11, userId: 4, name: 'savings', percentage: 0.3, balance: 0 },
//         { id: 12, userId: 4, name: 'commitments', percentage: 0.2, balance: 0 },
//     ],

//     // ─── CUSTOM GOAL POCKETS (Levels 1–5) ────────────────────────────────────────
//     //
//     // Full schema reference:
//     // {
//     //   id      : number            — auto-incremented via _nextCustomPocketId
//     //   userId  : number
//     //   name    : string
//     //   balance : number            — independently stored (not derived from user.balance)
//     //
//     //   goal: null | {
//     //     enabled             : true
//     //     title               : string        — L2
//     //     targetAmount        : number        — L2
//     //     currentAmount       : number        — L2: mirrors balance
//     //     monthlyContribution : number        — L4: SAR/month (0 = disabled)
//     //
//     //     // ── LEVEL 5 ──────────────────────────────────────────────────────────
//     //     startDate           : string|null   — ISO date string; null = today
//     //     endDate             : string|null   — ISO date string; null = no end
//     //     contributionDay     : number        — 1–28: day of month to run
//     //     isActive            : boolean       — pause/resume switch
//     //   }
//     //
//     //   lastContributionDate  : string|null   — ISO datetime of last applied contribution
//     // }
//     //
//     customPockets: [],
//     _nextCustomPocketId: 1,

//     transactions: [],
// };

// module.exports = db;



const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
});

pool.connect()
    .then(client => { client.release(); console.log('🌐 Connected to Supabase PostgreSQL'); })
    .catch(err  => console.error('❌ Supabase connection error:', err.message));

module.exports = pool;