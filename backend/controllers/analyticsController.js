const db = require('../data/db');

/**
 * GET /api/analytics/:userId
 *
 * Returns pocket totals + pie chart data ready for the frontend.
 * The frontend only needs to plug the percentages into the SVG donut chart.
 */
function getAnalytics(req, res) {
  const userId = parseInt(req.params.userId);

  // 1. Find user
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: `User ${userId} not found` });
  }

  // 2. Get this user's pockets
  const pockets = db.pockets.filter((p) => p.userId === userId);

  // 3. Calculate totals
  const expenses    = pockets.find((p) => p.name === 'expenses')?.balance    ?? 0;
  const savings     = pockets.find((p) => p.name === 'savings')?.balance     ?? 0;
  const commitments = pockets.find((p) => p.name === 'commitments')?.balance ?? 0;
  const total       = expenses + savings + commitments;

  // 4. Calculate percentages for the pie chart (avoid division by zero)
  function toPercent(value) {
    if (total === 0) return 0;
    return parseFloat(((value / total) * 100).toFixed(1));
  }

  const expensesPercent    = toPercent(expenses);
  const savingsPercent     = toPercent(savings);
  const commitmentsPercent = toPercent(commitments);

  // 5. Build pie chart slice data
  //    SVG donut: strokeDashoffset for each slice = negative sum of all previous slices
  const pieChart = [
    {
      name: 'expenses',
      label: 'مصاريف',
      color: '#ebc23e',
      amount: expenses,
      percentage: expensesPercent,
      dashArray: `${expensesPercent} ${100 - expensesPercent}`,
      dashOffset: 0,
    },
    {
      name: 'savings',
      label: 'ادخار',
      color: '#84d5c5',
      amount: savings,
      percentage: savingsPercent,
      dashArray: `${savingsPercent} ${100 - savingsPercent}`,
      dashOffset: -expensesPercent,
    },
    {
      name: 'commitments',
      label: 'التزامات',
      color: '#75d1ff',
      amount: commitments,
      percentage: commitmentsPercent,
      dashArray: `${commitmentsPercent} ${100 - commitmentsPercent}`,
      dashOffset: -(expensesPercent + savingsPercent),
    },
  ];

  return res.status(200).json({
    totals: { expenses, savings, commitments, overall: total },
    pieChart,
  });
}

module.exports = { getAnalytics };
