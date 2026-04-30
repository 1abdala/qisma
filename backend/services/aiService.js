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

function buildUserPrompt(snapshot) {
    const { pockets, customGoals, recentIncomeCount, totalBalance } = snapshot;

    const goalsText = customGoals.length === 0
        ? 'لا توجد أهداف مخصصة'
        : customGoals.map(g =>
            `• "${g.goalTitle}": ${g.balance.toLocaleString()} من ${g.targetAmount.toLocaleString()} ريال (${g.progress}%)` +
            (g.monthsRemaining ? ` — يتبقى ${g.monthsRemaining} شهر` : '')
        ).join('\n');

    return `حلّل البيانات المالية التالية:

الرصيد الإجمالي: ${totalBalance.toLocaleString()} ريال

توزيع الصناديق:
• مصاريف: ${pockets.expenses.balance.toLocaleString()} ريال (${pockets.expenses.percentage}% من الدخل)
• ادخار: ${pockets.savings.balance.toLocaleString()} ريال (${pockets.savings.percentage}% من الدخل)
• التزامات: ${pockets.commitments.balance.toLocaleString()} ريال (${pockets.commitments.percentage}% من الدخل)

الأهداف المخصصة:
${goalsText}

معاملات الدخل خلال آخر 30 يوم: ${recentIncomeCount}

أنتج 3-5 رؤى مالية مفيدة بناءً على هذه البيانات.`;
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
                { role: 'user',   content: buildUserPrompt(snapshot) },
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

module.exports = { generateInsights, getFallbackInsights };
