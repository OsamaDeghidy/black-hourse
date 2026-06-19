import React, { useState, useRef, useEffect } from "react";
import { Product, Sale } from "../types";
import { Bot, Sparkles, Send, RefreshCw, AlertTriangle, Lightbulb, TrendingUp, BarChart2, Coins, Percent, ShoppingBag } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIAssistantProps {
  items: Product[];
  sales: Sale[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistant({ items, sales }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "مرحباً بك في نظام المساعدة الذكي لمخازن blackhours! 🌟 أنا هنا لمساعدتك في عمل التخيلات والمحاكاة لفرعي المحل الخاص بك. يمكنك الضغط على أيٍّ من سيناريوهات المحاكاة بالأسفل لتوليد توقعات تزيد مبيعاتك وتنسق مخزونك تلقائياً:",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const triggerScenario = async (
    scenarioType: "forecasting" | "simulation" | "adviser" | "deadstock" | "pricing" | "purchase",
    name: string
  ) => {
    let customPrompt = "";
    if (scenarioType === "forecasting") {
      customPrompt = "قم بعمل توقع دقيق للبضائع التي أوشكت على النفاد وقدم مقترحاً واضحاً بالقطع التي يجب نقلها فورياً من فرع 1 إلى فرع 2 (أو العكس) لموازنة العرض والطلب وتجنب عجز السحب.";
    } else if (scenarioType === "simulation") {
      customPrompt = "محاكاة حملة تخفيضات بنسبة 15% على إكسسوارات الهواتف وحساب الزيادة المتوقعة في الطلب وعرض شكل الأرباح والمبيعات المتخيلة للفروع وتأثيرها على السيولة والأرباح الصافية.";
    } else if (scenarioType === "adviser") {
      customPrompt = "اقتراح قائمة قطع غيار وهواتف مطلوبة للفترة القادمة (مثل شاشات وبطاريات فئة الآيفون 15 والـ S24 الجديدة) ومستويات الأسعار المناسبة للجملة والقطاعي في السوق المصري وطريقة توزيعها بالفروع.";
    } else if (scenarioType === "deadstock") {
      customPrompt = "قم بتحليل المخزون الحالي بدقة لتحديد السلع أو قطع الغيار الراكدة (التي لا تسجل مبيعات كافية منذ فترة طويلة) واقترح استراتيجية فعالة للتخلص منها بالدمج أو الخصم وإعادة تسييل قيمتها.";
    } else if (scenarioType === "pricing") {
      customPrompt = "حلل فروق الأسعار الحالية وهوامش الربح بين سعر الجملة والقطاعي للبضاعة، واقترح خطة تسعير مطورة تتماشى مع تكاليف تأمين قطع الغيار والبطاريات بالسوق المصري وحماية السيولة من تقلبات سعر الصرف.";
    } else if (scenarioType === "purchase") {
      customPrompt = "اعتماداً على مستويات الأمان والجرد الحالي للبضائع ونسب السحب الكلية، قم بتوليد قائمة مشتريات ذكية ومقدار الكميات المقترحة لطلبها من كبار الموردين لتغذية فرعي blackhours.";
    }

    await handleSendMessage(customPrompt, scenarioType, name);
  };

  const handleSendMessage = async (textToSend?: string, type?: string, overrideName?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt) return;

    if (!textToSend) {
      setInputPrompt("");
    }

    const newUserMessage: Message = { role: "user", content: overrideName || prompt };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setErrorStatus(null);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          currentInventory: items,
          salesHistory: sales,
          scenarioType: type || "custom",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "خطأ غير معروف");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.text || "عذراً، لم يتم استلام أي نص من المساعد." }]);
    } catch (err: any) {
      setErrorStatus(err.message || "حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl flex flex-col h-[560px] text-right overflow-hidden mb-6" dir="rtl">
      {/* Header */}
      <div className="bg-neutral-950 border-b border-neutral-850 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center text-neutral-950 shadow-md">
            <Bot className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">مساعد blackhours الذكي للتنبؤ ومحاكاة المبيعات</span>
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-neutral-400">التخيلات الاقتصادية، النواقص الناتجة عن السحب، وتخطيط الأسعار المدعوم بالذكاء الاصطناعي</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/40">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-cyan-500 text-neutral-950 font-bold rounded-tr-none"
                  : "bg-neutral-950 text-neutral-200 border border-neutral-850 rounded-tl-none font-sans"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="markdown-body text-neutral-200 space-y-1.5">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="font-semibold">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-neutral-950 border border-neutral-850 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-neutral-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>جاري محاكاة السيناريو وحساب التخيلات الاقتصادية...</span>
            </div>
          </div>
        )}
        {errorStatus && (
          <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>خطأ الـ API: {errorStatus}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scenarios shortcuts */}
      <div className="bg-neutral-950 border-t border-neutral-850 px-4 py-3">
        <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-2 font-bold">سيناريوهات محاكاة سريعة ومتقدمة لمخازن blackhours:</span>
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          <button
            onClick={() => triggerScenario("forecasting", "📊 توقع النواقص ونقل البضائع بين الفروع")}
            disabled={isLoading}
            className="shrink-0 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            موازنة فروع blackhours
          </button>
          <button
            onClick={() => triggerScenario("simulation", "🛍️ محاكاة حملة عروض وزيادة مبيعات")}
            disabled={isLoading}
            className="shrink-0 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-sky-300 hover:text-sky-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
            محاكاة ترويج الإكسسوارات
          </button>
          <button
            onClick={() => triggerScenario("adviser", "💡 استشارة بضائع جديدة وتسعير قطع الغيار")}
            disabled={isLoading}
            className="shrink-0 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-amber-300 hover:text-amber-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            دليل التسعير وشراء الجديد
          </button>
          <button
            onClick={() => triggerScenario("deadstock", "🔍 رصد السلع الراكدة وتسييل المخازن")}
            disabled={isLoading}
            className="shrink-0 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-rose-300 hover:text-rose-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Percent className="w-3.5 h-3.5 text-rose-400" />
            تسييل السلع الراكدة
          </button>
          <button
            onClick={() => triggerScenario("pricing", "💰 مراجعة فروق الأسعار وهامش الربح")}
            disabled={isLoading}
            className="shrink-0 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-emerald-300 hover:text-emerald-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            تعديلات التسعير والتضخم
          </button>
          <button
            onClick={() => triggerScenario("purchase", "📦 توليد قائمة المشتريات الذكية")}
            disabled={isLoading}
            className="shrink-0 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-purple-300 hover:text-purple-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
            قائمة توريد جديدة
          </button>
        </div>
      </div>

      {/* Input area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-neutral-950 border-t border-neutral-850 flex gap-2"
      >
        <input
          type="text"
          placeholder="اكتب سؤالك لتسأل المساعد عن المخزن أو المبيعات أو محاكاة معينة..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-100 outline-none focus:border-cyan-500/50 transition disabled:opacity-75"
        />
        <button
          type="submit"
          disabled={isLoading || !inputPrompt.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-neutral-850 disabled:text-neutral-500 text-neutral-950 font-bold w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4 transform rotate-180" />
        </button>
      </form>
    </div>
  );
}
