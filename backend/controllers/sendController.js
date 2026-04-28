const db = require('../data/db');
const { autoSplit } = require('../services/splitService');
const { convert } = require('../services/currencyService');

/**
 * POST /api/send
 * Body: { fromUserId, toUserId, amount, fromCurrency?, toCurrency? }
 *
 * Supports cross-currency transfers:
 * 1. Find both users
 * 2. Deduct amount from sender (in sender's currency)
 * 3. Convert amount if currencies differ
 * 4. Add converted amount to receiver (in receiver's currency)
 * 5. Apply autoSplit to receiver
 * 6. Save transaction with both currencies
 * 7. Return balances + split + conversion info
 */
function send(req, res) {
  const { fromUserId, toUserId, amount, fromCurrency, toCurrency } = req.body;

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

  // 3. Determine currencies (use user's currency if not provided)
  const senderCurrency = fromCurrency || sender.currency;
  const receiverCurrency = toCurrency || receiver.currency;

  // 4. Check sender has enough balance
  if (sender.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // 5. Deduct from sender (in their currency)
  sender.balance -= amount;

  // 6. Convert amount if currencies differ
  const convertedAmount = convert(amount, senderCurrency, receiverCurrency);

  // 7. Add converted amount to receiver + split into their pockets
  receiver.balance += convertedAmount;
  const split = autoSplit(toUserId, convertedAmount);

  // 8. Save transaction with currency info
  db.transactions.push({
    id: db.transactions.length + 1,
    type: 'send',
    fromUserId,
    toUserId,
    amount,                       // original amount in sender's currency
    convertedAmount,              // amount receiver got in their currency
    fromCurrency: senderCurrency,
    toCurrency: receiverCurrency,
    createdAt: new Date().toISOString(),
  });

  // 9. Return response with conversion details
  return res.status(200).json({
    amount,
    convertedAmount,
    fromCurrency: senderCurrency,
    toCurrency: receiverCurrency,
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