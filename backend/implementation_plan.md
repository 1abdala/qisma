# AI-Powered Analytics Suggestions for Qisma

## Overview

Qisma is an Arabic-language personal finance app that splits income into three system pockets: **مصاريف (Expenses)**, **ادخار (Savings)**, and **التزامات (Commitments)**. The analytics page currently shows balances, a donut chart, and progress bars.

The goal is to add an **AI assistant layer** that reads the user's financial data and generates personalized, actionable Arabic-language suggestions — such as "your savings rate is low", "you're close to your goal", or "consider rebalancing your pockets".

---

## Open Questions

> [!IMPORTANT]
> **Which AI provider should we use?**
> - **Option A — Google Gemini API** (free tier available, easy to set up): Best if you already have a Google Cloud account.
> - **Option B — OpenAI GPT-4o-mini** (cheap, ~$0.00015/1K tokens): Best if you have an OpenAI key.
> - **Option C — Groq (Llama 3)** (very fast, generous free tier): Best for a hackathon — no cost, fast responses.
>
> **Recommendation: Groq with Llama 3.3-70B** — it's free, fast, supports Arabic well, and perfect for a hackathon. Which do you prefer?

> [!IMPORTANT]
> **Where should the AI key live?**
> The backend `.env` currently only has `DATABASE_URL`. We'll add `GROQ_API_KEY` (or equivalent) there. This keeps the key server-side and secure.

---

## Proposed Architecture

```
User opens Analytics Page
        ↓
Frontend calls GET /api/analytics/:userId  (already exists)
        ↓
Frontend ALSO calls GET /api/ai/insights/:userId  (NEW)
        ↓
Backend aiController.js:
  1. Queries DB for full financial snapshot (balances, pockets, transactions, goals)
  2. Builds a structured prompt in Arabic context
  3. Calls Groq/Gemini/OpenAI API
  4. Returns 3–5 structured insight cards
        ↓
Frontend renders AI Insight Cards on Analytics page
```

---

## Proposed Changes

### Backend — AI Service & Route

#### [NEW] `backend/services/aiService.js`
- Wraps the chosen LLM API call (Groq SDK or `fetch`)
- Builds a system prompt describing Qisma's structure
- Takes the user's financial snapshot as input
- Returns 3–5 structured insight objects: `{ type, icon, title, body, action? }`

#### [MODIFY] `backend/controllers/analyticsController.js`
- Extend `getAnalytics` OR add a new `getAiInsights` function
- Fetch richer data: pocket balances, pocket goals progress, recent transaction count, pocket percentages
- Pass snapshot to `aiService.js`
- Return insights array alongside or separately from analytics data

#### [NEW] `backend/routes/aiRoutes.js`
- `GET /api/ai/insights/:userId` → calls `getAiInsights`

#### [MODIFY] `backend/server.js`
- Mount `aiRoutes`

---

### Frontend — AI Insight Cards UI

#### [MODIFY] `Frontend/src/pages/Analytics.jsx`
- Add a second `useEffect` (or combine into one) to fetch `/api/ai/insights/:userId`
- Add `aiInsights` state: `useState(null)` with a streaming/loading skeleton
- Add an **"AI Insights" section** below the donut chart, above the category breakdown

#### [NEW] `Frontend/src/pages/Analytics.css` additions
- Styles for AI insight cards with a distinct gradient (purple/indigo AI theme to differentiate from the teal finance theme)
- Shimmer loading skeleton animation
- Card types: `tip` (lightbulb), `warning` (alert), `achievement` (trophy), `action` (arrow)

---

## What the AI Will Analyze

The prompt will include:
| Data Point | Source |
|---|---|
| Total balance distributed | `totals.overall` |
| Per-pocket balances & percentages | `pieChart` data |
| Pocket split ratios (expenses/savings/commitments %) | `qisma_pockets.percentage` |
| Custom pocket goals — progress % | `qisma_pocket_goals` |
| Number of months until goal deadline | Computed |
| Recent receive transactions (income signals) | `transactions` table |

**Example AI suggestions it will generate:**
- 🎯 "نسبة ادخارك 20% — يُنصح بالوصول إلى 30% على المدى البعيد"
- ⚠️ "التزاماتك تمثل 40% من رصيدك — تأكد أن هذا ضمن ميزانيتك"
- 🏆 "أنت على وشك تحقيق هدف [اسم الصندوق] — تبقى 2 أشهر فقط!"
- 💡 "لم تستلم أي دخل هذا الشهر — هل تريد تسجيل راتب؟"

---

## Verification Plan

### Automated
- Test the new `/api/ai/insights/:userId` endpoint via curl/Postman
- Verify graceful fallback when AI API is unavailable (show static placeholder cards)

### Visual
- Open Analytics page in browser and confirm AI insight cards render below the donut chart
- Verify Arabic text is RTL and well-formatted
- Verify shimmer skeleton shows while loading

---

## Implementation Steps (ordered)

1. Install AI SDK in backend (`npm install groq-sdk` or use fetch)
2. Add API key to `backend/.env`
3. Create `backend/services/aiService.js`
4. Add `getAiInsights` to `analyticsController.js`
5. Create `backend/routes/aiRoutes.js`
6. Mount route in `backend/server.js`
7. Update `Analytics.jsx` to fetch insights and render cards
8. Add CSS for AI insight cards
