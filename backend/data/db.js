const db = {
    users: [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            balance: 1000,
        },
        {
            id: 2,
            name: 'Sara',
            email: 'sara@example.com',
            balance: 500,
        },
    ],

    pockets: [
        {
            id: 1,
            userId: 1,
            name: 'expenses',
            percentage: 50,
            balance: 0,
        },
        {
            id: 2,
            userId: 1,
            name: 'savings',
            percentage: 30,
            balance: 0,
        },
        {
            id: 3,
            userId: 1,
            name: 'commitments',
            percentage: 20,
            balance: 0,
        },
        {
            id: 4,
            userId: 2,
            name: 'expenses',
            percentage: 50,
            balance: 0,
        },
        {
            id: 5,
            userId: 2,
            name: 'savings',
            percentage: 30,
            balance: 0,
        },
        {
            id: 6,
            userId: 2,
            name: 'commitments',
            percentage: 20,
            balance: 0,
        },
    ],

    transactions: [],
};

module.exports = db;