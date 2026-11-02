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

**Qisma AI** is an integrated financial assistant powered by the **Groq API** running the **Llama 3.3 70B** model (`llama-3.3-70b-versatile`). It provides actionable financial guidance, budget recommendations, and risk insights tailored to the user's saved pockets, financial goals, transactions, and balance stored in Supabase PostgreSQL.

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

### Built at SalamHack 2026

Special thanks to my teammate **Husam Harpah** 🙌

And a big thank you to **Tariq** for organizing an enjoyable and valuable event and for creating this opportunity.

---

<div align="center">

**قسمة — لأن المال يُقسَّم، لا يُدار فقط**

*Because money is distributed, not just managed.*

</div>
