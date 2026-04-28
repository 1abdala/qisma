const db = {
    users: [
        {
            id: 1,
            name: 'Hussam',
            email: 'hussam@example.com',
            balance: 1000,
            currency: 'SAR',
        },
        {
            id: 2,
            name: 'Ali',
            email: 'ali@example.com',
            balance: 800,
            currency: 'AED',
        },
        {
            id: 3,
            name: 'Ahmed',
            email: 'ahmed@example.com',
            balance: 1200,
            currency: 'EGP',
        },
        {
            id: 4,
            name: 'Fatima',
            email: 'fatima@example.com',
            balance: 950,
            currency: 'OMR',
        },
    ],

    pockets: [
        // User 1 - Hussam
        { id: 1, userId: 1, name: 'expenses', percentage: 0.5, balance: 0 },
        { id: 2, userId: 1, name: 'savings', percentage: 0.3, balance: 0 },
        { id: 3, userId: 1, name: 'commitments', percentage: 0.2, balance: 0 },

        // User 2 - Ali
        { id: 4, userId: 2, name: 'expenses', percentage: 0.5, balance: 0 },
        { id: 5, userId: 2, name: 'savings', percentage: 0.3, balance: 0 },
        { id: 6, userId: 2, name: 'commitments', percentage: 0.2, balance: 0 },

        // User 3 - Ahmed
        { id: 7, userId: 3, name: 'expenses', percentage: 0.5, balance: 0 },
        { id: 8, userId: 3, name: 'savings', percentage: 0.3, balance: 0 },
        { id: 9, userId: 3, name: 'commitments', percentage: 0.2, balance: 0 },

        // User 4 - Fatima
        { id: 10, userId: 4, name: 'expenses', percentage: 0.5, balance: 0 },
        { id: 11, userId: 4, name: 'savings', percentage: 0.3, balance: 0 },
        { id: 12, userId: 4, name: 'commitments', percentage: 0.2, balance: 0 },
    ],

    transactions: [],
};

module.exports = db;