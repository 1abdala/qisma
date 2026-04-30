const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `أنت مستشار مالي ذكي مدمج في تطبيق قسمة للتمويل الشخصي.
مهمتك: تحليل البيانات المالية للمستخدم وإنتاج 3 إلى 5 رؤى مالية باللغة العربية.

قواعد صارمة:
- أعِد فقط كائن JSON بالشكل: {"insights": [...]}
- كل عنصر يجب أن يحتوي بالضبط على: type, icon, title, body
- type: واحد من "tip" أو "warning" أو "achievement" أو "action"
- icon: اسم أيقونة Material Symbols (كلمة واحدة مثل: lightbulb, warning, emoji_events, trending_up, savings, pie_chart, flag, rocket_launch)
- title: عربي، 5 كلمات أو أقل، عنوان جذاب
- body: عربي، جملة أو جملتان، محدد ومفيد ومبني على الأرقام المعطاة
- لا تضف أي نص خارج JSON

أسلوب الكتابة: داعم، واضح، وعملي. استخدم الأرقام المحددة من البيانات.`;

function buildUserContext(snapshot) {
    const { pockets, customGoals, transactions30Days, recentTransactions, totalBalance, currency } = snapshot;

    const goalsText = customGoals.length === 0
        ? 'لا توجد أهداف مخصصة'
        : customGoals.map(g =>
            `• "${g.goalTitle}": ${g.balance.toLocaleString()} من ${g.targetAmount.toLocaleString()} ${currency} (${g.progress}%)` +
            (g.monthsRemaining ? ` — يتبقى ${g.monthsRemaining} شهر` : '')
        ).join('\n');

    let txText = 'لا توجد تفاصيل متاحة';
    if (transactions30Days) {
        txText = `إجمالي المرسل (مصاريف): ${transactions30Days.totalSent.toLocaleString()} ${currency}
إجمالي المستلم (دخل): ${transactions30Days.totalReceived.toLocaleString()} ${currency}
إجمالي عدد المعاملات (آخر 30 يوم): ${transactions30Days.count}`;
    }

    let recentTxsText = 'لا يوجد';
    if (recentTransactions && recentTransactions.length > 0) {
        recentTxsText = recentTransactions.map(t => 
            `- ${t.type}: ${t.amount} ${t.currency} ${t.type === 'إرسال' ? 'إلى' : 'من'} ${t.otherParty} في ${new Date(t.date).toLocaleDateString('ar-SA')}`
        ).join('\n');
    }

    return `الرصيد الإجمالي: ${totalBalance.toLocaleString()} ${currency}

توزيع الصناديق:
• مصاريف: ${pockets.expenses.balance.toLocaleString()} ${currency} (${pockets.expenses.percentage}% من الدخل)
• ادخار: ${pockets.savings.balance.toLocaleString()} ${currency} (${pockets.savings.percentage}% من الدخل)
• التزامات: ${pockets.commitments.balance.toLocaleString()} ${currency} (${pockets.commitments.percentage}% من الدخل)

الأهداف المخصصة:
${goalsText}

إحصائيات المعاملات (آخر 30 يوم):
${txText}

أحدث المعاملات تفصيلاً (مرتبة من الأحدث إلى الأقدم، أي أن المعاملة الأولى هي آخر/أحدث معاملة قام بها المستخدم):
${recentTxsText}`;
}

function getFallbackInsights() {
    return [
        {
            type: 'tip',
            icon: 'savings',
            title: 'راجع نسبة مدخراتك',
            body: 'يُنصح بتخصيص 20-30% من الدخل للمدخرات لضمان الاستقرار المالي على المدى البعيد.',
        },
        {
            type: 'action',
            icon: 'pie_chart',
            title: 'وازن توزيع صناديقك',
            body: 'تأكد أن نسب تقسيم الدخل تعكس أولوياتك المالية الحالية وعدّلها إذا لزم الأمر.',
        },
        {
            type: 'tip',
            icon: 'flag',
            title: 'ابدأ هدفاً مالياً جديداً',
            body: 'إنشاء صندوق بهدف محدد يساعدك على الادخار بانتظام وتحقيق أحلامك بشكل أسرع.',
        },
    ];
}

async function generateInsights(snapshot) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        console.warn('[AI] GROQ_API_KEY not set — using fallback insights');
        return getFallbackInsights();
    }

    const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user',   content: `حلّل البيانات المالية التالية:\n\n${buildUserContext(snapshot)}\n\nأنتج 3-5 رؤى مالية مفيدة بناءً على هذه البيانات.` },
            ],
            temperature: 0.65,
            max_tokens: 900,
            response_format: { type: 'json_object' },
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq API ${res.status}: ${err}`);
    }

    const json = await res.json();
    const content = json.choices[0].message.content;
    const parsed = JSON.parse(content);

    const insights = Array.isArray(parsed) ? parsed : (parsed.insights ?? []);
    if (!insights.length) throw new Error('Empty insights array from model');

    return insights;
}

async function chatWithAI(snapshot, messages) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        throw new Error('GROQ_API_KEY is missing');
    }

    const sysPrompt = `أنت المساعد الذكي لتطبيق قسمة للتمويل الشخصي واسمك Qisma AI.
مهمتك: مساعدة المستخدم بالإجابة على أسئلته المالية بناءً على بياناته. كن ودوداً، مختصراً، واحترافياً. تحدث باللغة العربية.

البيانات المالية الخاصة بالمستخدم حالياً:
${buildUserContext(snapshot)}

أجب الآن على أسئلة المستخدم بصورة مباشرة وبدون تكرار بياناته إلا إذا لزم الأمر:`;

    const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: sysPrompt },
                ...messages
            ],
            temperature: 0.65,
            max_tokens: 1000,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq API ${res.status}: ${err}`);
    }

    const json = await res.json();
    return json.choices[0].message.content;
}

module.exports = { generateInsights, getFallbackInsights, chatWithAI };
