<div align="center">

# قسمة | Qisma

### محفظة مالية ذكية للمستقل العربي

**لأن المال يُقسَّم، لا يُدار فقط**

[العربية](#العربية) · [English](#english)

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![SalamHack](https://img.shields.io/badge/SalamHack-2026-10B981?style=flat)

</div>

---

## العربية

### نبذة عن المشروع

كل مستقل عربي يعرف مدى صعوبة استلام مستحقاته من عميل في دولة عربية أخرى: رسوم مرتفعة، انتظار طويل، وإجراءات معقدة. وحتى مع التحويل البنكي أو خدمات التحويل التقليدية، تبقى التجربة بطيئة ومرهقة.

في **SalamHack 2026** بنينا **قسمة (Qisma)** — محفظة ذكية مصممة للمستقل العربي، تساعده على إرسال واستقبال الأموال بين الدول العربية، وفهم أين تذهب أمواله منذ لحظة وصولها.

بدل أن تسأل: **«وين راحت فلوسي؟»**

تساعدك قسمة على معرفة بالضبط أين تذهب أموالك ولماذا.

### ماذا تقدم قسمة؟

- إرسال واستقبال الأموال بين الدول العربية بسهولة.
- تحويل العملات تلقائيًا عند إرسال الأموال بين مستخدمين بعملات مختلفة.
- استقبال المدفوعات عبر رمز QR.
- تقسيم كل دفعة تلقائيًا إلى **مصاريف، ادخار، والتزامات**.
- تخصيص نسب التقسيم حسب احتياجاتك.
- إنشاء صناديق وأهداف مالية مخصصة، مثل شراء لابتوب أو كاميرا أو التخطيط لسفر.
- تحليلات مرئية تساعدك على فهم توزيع أموالك.
- واجهة عربية تدعم اتجاه الكتابة من اليمين إلى اليسار.

### كيف تعمل؟

عند استلام دفعة مالية، توزّع قسمة المبلغ تلقائيًا بحسب النسب التي يحددها المستخدم. الإعداد الافتراضي هو:

```text
المبلغ المستلم
      ↓
┌─────────────────────────────┐
│ المصاريف       50%          │
│ الادخار        30%          │
│ الالتزامات     20%          │
└─────────────────────────────┘
      ↓
أرصدة منظمة وخطة مالية أوضح
```

يمكن تعديل النسب في أي وقت لتناسب الدخل والالتزامات والأهداف الشخصية.

### العملات المدعومة في النموذج الأولي

| العملة | الرمز |
|---|---|
| الريال السعودي | SAR |
| الدرهم الإماراتي | AED |
| الجنيه المصري | EGP |
| الريال العُماني | OMR |

> يستخدم النموذج الأولي أسعار صرف ثابتة لضمان عمل العرض التجريبي دون الاعتماد على خدمات خارجية.

### Qisma AI

يهدف **Qisma AI** إلى تقديم مساعد مالي شخصي يعتمد على عادات الإنفاق الفعلية للمستخدم، ليساعده على:

- فهم نمط الإنفاق.
- اكتشاف فرص تحسين إدارة الدخل.
- بناء توصيات مالية مخصصة.
- الاقتراب من الأهداف المالية بطريقة أبسط وأكثر وضوحًا.

### شاشات التطبيق

| الشاشة | المسار | الوظيفة |
|---|---|---|
| لوحة التحكم | `/` | عرض الرصيد والإجراءات السريعة |
| إرسال الأموال | `/sending` | تحويل الأموال مع عرض تحويل العملة |
| الاستلام | `/receive` | إنشاء QR ومحاكاة استلام دفعة |
| التقسيم | `/splitting` | عرض عملية تقسيم الدفعة |
| الصناديق | `/pockets` | إدارة الأرصدة والنسب |
| التحليلات | `/analytics` | عرض توزيع الأموال بصريًا |

### التشغيل محليًا

#### المتطلبات

- Node.js 18 أو أحدث
- npm

#### 1. استنساخ المستودع

```bash
git clone https://github.com/1abdala/qisma.git
cd qisma
```

#### 2. تشغيل الخادم الخلفي

```bash
cd backend
npm install
node server.js
```

سيعمل الخادم افتراضيًا على `http://localhost:5000`.

#### 3. تشغيل الواجهة الأمامية

```bash
cd frontend
npm install
npm run dev
```

ستعمل الواجهة افتراضيًا على `http://localhost:5173`.

### واجهة API

| الطريقة | المسار | الوصف |
|---|---|---|
| `GET` | `/api/users` | عرض المستخدمين التجريبيين |
| `GET` | `/api/dashboard/:userId` | بيانات المستخدم والصناديق والمعاملات |
| `GET` | `/api/analytics/:userId` | إجماليات الصناديق وبيانات التحليلات |
| `GET` | `/api/pockets/:userId` | نسب التقسيم الحالية |
| `POST` | `/api/receive` | إضافة دفعة وتقسيمها تلقائيًا |
| `POST` | `/api/send` | إرسال الأموال مع تحويل العملة |
| `POST` | `/api/pockets/update-percentages` | تحديث نسب التقسيم |

### حدود النموذج الأولي

هذا المشروع نموذج أولي مبني ضمن فعالية هاكاثون، ولذلك فهو لا يمثل منتجًا ماليًا جاهزًا للاستخدام الفعلي. من القيود الحالية:

- تخزين البيانات في الذاكرة؛ تُعاد البيانات إلى حالتها الأولية عند إعادة تشغيل الخادم.
- عدم وجود نظام مصادقة حقيقي.
- أسعار صرف ثابتة وليست أسعارًا مباشرة من السوق.
- تجربة QR محاكاة وليست مرتبطة بكاميرا أو شبكة مدفوعات فعلية.
- يحتاج أي إطلاق حقيقي إلى مراجعة أمنية وقانونية وامتثال للأنظمة المالية ذات الصلة.

### خارطة الطريق

- [ ] تطبيق جوال باستخدام React Native.
- [ ] إضافة مصادقة وإدارة حسابات آمنة.
- [ ] ربط أسعار الصرف بمصادر مباشرة.
- [ ] دعم صناديق وأهداف مالية متقدمة.
- [ ] تطوير Qisma AI إلى مساعد مالي متكامل.
- [ ] إضافة اختبارات آلية وتخزين دائم.

---

## English

### About Qisma

Every Arab freelancer knows how difficult it can be to get paid by a client in another Arab country: high fees, long waiting times, and complicated processes. Even with traditional bank transfers and money-transfer services, the experience can remain slow and frustrating.

Built during **SalamHack 2026**, **Qisma** is a smart wallet designed for Arab freelancers. It makes cross-border money transfers easier while helping users understand where their money goes from the moment a payment arrives.

Instead of asking, **“Where did my money go?”**, Qisma helps you know exactly where it goes — and why.

### Key features

- Send and receive money between Arab countries.
- Convert currencies automatically when transferring between users.
- Receive payments through QR codes.
- Automatically split incoming payments into **expenses, savings, and commitments**.
- Customize split percentages to match your financial situation.
- Create custom pockets and savings goals for items such as a laptop, camera, or trip.
- Visual analytics for understanding how money is distributed.
- Arabic-first RTL interface with a dark fintech-inspired design.

### Qisma AI

**Qisma AI** is designed as a personalized financial assistant that uses spending behavior to provide practical insights and recommendations. Its goal is to help users understand their habits, make better decisions, and reach their financial goals with less complexity.

### Project structure

```text
qisma/
├── backend/
│   ├── server.js
│   ├── data/
│   ├── routes/
│   ├── controllers/
│   └── services/
└── frontend/
    ├── src/
    └── package.json
```

### Demo

A demo video can be added here:

```markdown
[Watch the Qisma demo](YOUR_DEMO_VIDEO_URL)
```

### Built at SalamHack 2026

Special thanks to my teammate **Husam Harpah** 🙌

And a big thank you to **Tariq** for organizing an enjoyable and valuable event and for creating this opportunity.

---

<div align="center">

**قسمة — لأن المال يُقسَّم، لا يُدار فقط**

*Because money is distributed, not just managed.*

</div>
