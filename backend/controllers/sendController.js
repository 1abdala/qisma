const db = require('../data/db');
const { autoSplit } = require('../services/splitService');

/**
 * POST /api/send
 * Body: { fromUserId, toUserId, amount }
 *
 * 1. Find both users
 * 2. Deduct from sender
 * 3. Add to receiver
 * 4. Call autoSplit for receiver (splits into their pockets)
 * 5. Save transaction for sender
 * 6. Return both balances + split result
 */
function send(req, res) {
  const { fromUserId, toUserId, amount } = req.body;

  // 1. Basic validation
  if (!fromUserId || !toUserId || !amount || amount <= 0) {
    return res.status(400).json({
      error: 'fromUserId, toUserId, and a positive amount are required',
    });
  }

  // 2. Find both users
  const sender = db.users.find((u) => u.id === fromUserId);
  const receiver = db.users.find((u) => u.id === toUserId);

  if (!sender) {
    return res.status(404).json({ error: `Sender with id ${fromUserId} not found` });
  }
  if (!receiver) {
    return res.status(404).json({ error: `Receiver with id ${toUserId} not found` });
  }

  // 3. Check sender has enough balance
  if (sender.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // 4. Deduct from sender
  sender.balance -= amount;

  // 5. Add to receiver + split into their pockets
  receiver.balance += amount;
  const split = autoSplit(toUserId, amount);

  // 6. Save a send transaction for the sender
  db.transactions.push({
    id: db.transactions.length + 1,
    type: 'send',
    fromUserId,
    toUserId,
    amount,
    createdAt: new Date().toISOString(),
  });

  // 7. Return clean response
  return res.status(200).json({
    amount,
    senderBalance: sender.balance,
    receiverBalance: receiver.balance,
    split: {
      expenses: split.expenses,
      savings: split.savings,
      commitments: split.commitments,
    },
  });
}

module.exports = { send };
