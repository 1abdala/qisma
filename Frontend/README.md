<div align="center">

# قسمة | Qisma

### Smart Wallet for Freelancers

*Because money is distributed, not just managed*

---

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Hackathon](https://img.shields.io/badge/Salam-Hackathon-10B981?style=flat)

</div>

---

## 📖 What Is Qisma?

Qisma (قسمة — Arabic for *distribution*) is a mobile fintech prototype built for the **Salam Hackathon**. It targets Arabic freelancers who deal with irregular income and struggle to manage their money.

> **Core idea:** Every time money is received, it is instantly and automatically split across three financial pockets — Expenses, Savings, and Commitments — with full user control over the ratios.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏦 **Smart Auto-Split** | Incoming money is instantly distributed 50% / 30% / 20% across pockets |
| 🎛 **Custom Split Ratios** | Users set their own percentages via interactive sliders |
| 💱 **Multi-Currency** | Supports SAR, AED, EGP, OMR with fixed conversion rates |
| 🔄 **Cross-Country Transfers** | Send in one currency, receiver gets it in theirs |
| 👁 **Display Currency** | View balances in any currency without touching stored data |
| 📷 **QR Receive** | Generate a QR code to request payment |
| 📊 **Analytics** | Donut chart breakdown of pocket distribution |
| 🔔 **Toast Notifications** | Instant feedback on every financial action |
| 🌙 **Arabic RTL UI** | Full dark-mode fintech interface in Arabic |

---

## 🗂 Project Structure

```
qisma/
├── backend/
│   ├── server.js
│   ├── data/
│   │   └── db.js                  # In-memory users, pockets, transactions
│   ├── routes/
│   │   ├── receiveRoutes.js
│   │   ├── sendRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── pocketsRoutes.js
│   │   ├── userRoutes.js
│   │   └── usersRoutes.js
│   ├── controllers/               # Business logic per endpoint
│   └── services/
│       ├── splitService.js        # autoSplit()
│       └── currencyService.js     # convert(), getRate()
│
└── frontend/
    ├── src/
    │   ├── App.jsx                # Router + Context providers
    │   ├── contexts/
    │   │   ├── UserContext.jsx
    │   │   └── DisplayCurrencyContext.jsx
    │   ├── hooks/
    │   │   ├── useCurrencyConverter.js
    │   │   └── useToast.js
    │   ├── components/
    │   │   └── ToastContainer.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Sending.jsx
    │       ├── Receive.jsx
    │       ├── Splitting.jsx
    │       ├── Pockets.jsx
    │       └── Analytics.jsx
    └── package.json
```

---

## 🚀 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/your-username/qisma.git
cd qisma
```

### 2. Start the backend

```bash
cd backend
npm install
node server.js
# → Running on http://localhost:5000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | All users (id, name, currency) |
| `GET` | `/api/dashboard/:userId` | User + pockets + recent transactions |
| `GET` | `/api/analytics/:userId` | Pocket totals + pie chart data |
| `GET` | `/api/pockets/:userId` | Current split percentages |
| `POST` | `/api/receive` | Credit money + auto-split |
| `POST` | `/api/send` | Transfer with currency conversion |
| `POST` | `/api/pockets/update-percentages` | Update split ratios |

---

## 💱 Supported Currencies

| Currency | Code | Flag |
|----------|------|------|
| Saudi Riyal | SAR | 🇸🇦 |
| UAE Dirham | AED | 🇦🇪 |
| Egyptian Pound | EGP | 🇪🇬 |
| Omani Rial | OMR | 🇴🇲 |

> Exchange rates are fixed for hackathon reliability — no external APIs, works fully offline.

---

## 👥 Demo Users

| Name | Currency | Balance |
|------|----------|---------|
| Hussam | SAR | 1,000 |
| Ali | AED | 800 |
| Ahmed | EGP | 1,200 |
| Fatima | OMR | 950 |

---

## 🏗 How Auto-Split Works

```
User receives 1000 SAR
        ↓
autoSplit(userId, 1000)
        ↓
reads pocket.percentage for each pocket
        ↓
┌─────────────────────────────────────┐
│  Expenses  (50%)  →  500 SAR        │
│  Savings   (30%)  →  300 SAR        │
│  Commitments (20%) → 200 SAR        │
└─────────────────────────────────────┘
        ↓
pocket.balance updated in-memory
        ↓
returns { expenses, savings, commitments, total }
```

Percentages are fully customizable per user via `POST /api/pockets/update-percentages`.

---

## 💸 Cross-Currency Transfer Flow

```
Hussam (SAR) sends 100 SAR to Ali (AED)
        ↓
currencyService.convert(100, 'SAR', 'AED')
        ↓
100 × 0.98 = 98 AED
        ↓
Hussam.balance  -= 100 SAR
Ali.balance     += 98 AED
        ↓
autoSplit fires for Ali in AED
→ expenses: 49 AED
→ savings: 29.4 AED
→ commitments: 19.6 AED
```

---

## 📱 Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `/` | Balance overview, quick actions |
| Send | `/sending` | Transfer money with live conversion |
| Receive | `/receive` | QR code + simulate payment |
| Splitting | `/splitting` | Animated split breakdown |
| Pockets | `/pockets` | Pocket balance detail |
| Analytics | `/analytics` | Donut chart distribution |

---

## 🔔 Notification Examples

```
✅  تم تحويل 100 SAR بنجاح
🔀  تم تقسيم المبلغ تلقائياً على صناديق المستلم
✅  تم استلام 1000 SAR بنجاح
🔀  تم تقسيم المبلغ تلقائياً على صناديقك
✅  تم تحديث نسب التقسيم بنجاح
```

---

## 📄 Documentation

Full technical documentation is available in [`Qisma_Documentation.docx`](./Qisma_Documentation.docx), covering:

- Complete system architecture
- Data model + API reference
- Core services deep-dive
- Full build log (12 stages)
- User flows
- Known limitations & production roadmap

---

## ⚠️ Limitations (Hackathon Scope)

- **In-memory storage** — data resets on server restart
- **No authentication** — open access for demo purposes
- **Fixed exchange rates** — not connected to live market data
- **QR scan simulated** — no real camera integration

---

## 🗺 Roadmap

- [ ] React Native mobile app

---

## 🏆 Built At

**Salam Hackathon** — April 2026

---

<div align="center">

**قسمة — لأن المال يُقسَّم، لا يُدار**

*"Because money is distributed, not just managed"*

</div>