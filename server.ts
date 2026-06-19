import express from "express";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Define DB path
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

// Default DB state (with Egyptian localization for whole mobile accessories and parts)
const DEFAULT_DB = {
  items: [
    {
      id: "prod_1",
      name: "شاشة آيفون 13 برو ماكس جودة ممتازة (OLED)",
      category: "شاشات",
      priceWholesale: 2400,
      priceRetail: 2900,
      stockBranch1: 12,
      stockBranch2: 3,
      minStockAlert: 5,
      compatibleMobiles: ["iPhone 13 Pro Max"],
      imageUrl: "https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod_2",
      name: "شاشة سامسونج Galaxy S22 Ultra أصلية توكيل",
      category: "شاشات",
      priceWholesale: 5800,
      priceRetail: 6500,
      stockBranch1: 4,
      stockBranch2: 0, // Out of stock in Branch 2, present in Branch 1!
      minStockAlert: 2,
      compatibleMobiles: ["Samsung S22 Ultra"],
      imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod_3",
      name: "باغة بايركس حماية كاميرا آيفون 15 برو / ماكس",
      category: "باغات وزجاج",
      priceWholesale: 120,
      priceRetail: 180,
      stockBranch1: 45,
      stockBranch2: 50,
      minStockAlert: 15,
      compatibleMobiles: ["iPhone 15 Pro", "iPhone 15 Pro Max"],
      imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod_4",
      name: "جراب شفاف ماغ سيف مضاد للصدمات آيفون 14",
      category: "إكسسوارات",
      priceWholesale: 85,
      priceRetail: 150,
      stockBranch1: 120,
      stockBranch2: 80,
      minStockAlert: 20,
      compatibleMobiles: ["iPhone 14", "iPhone 14 Pro"],
      imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod_5",
      name: "فلاتة شحن ريلمي 8 برو أصلية بالكامل",
      category: "فلاتات وشواحن",
      priceWholesale: 180,
      priceRetail: 250,
      stockBranch1: 15,
      stockBranch2: 1, // Scarce in Branch 2
      minStockAlert: 5,
      compatibleMobiles: ["Realme 8 Pro"],
      imageUrl: "https://images.unsplash.com/photo-1517055720445-995536551677?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod_6",
      name: "بطارية آيفون 11 برو ماكس سعة أصلية هاف ميكس",
      category: "بطاريات",
      priceWholesale: 480,
      priceRetail: 650,
      stockBranch1: 0, // Out in Branch 1, present in Branch 2!
      minStockAlert: 3,
      compatibleMobiles: ["iPhone 11 Pro Max"],
      imageUrl: "https://images.unsplash.com/photo-1624996379697-f01d168b1a52?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod_7",
      name: "سماعة بلوتوث AirPods 3 هاي كوبي درجة أولى",
      category: "إكسسوارات",
      priceWholesale: 450,
      priceRetail: 650,
      stockBranch1: 25,
      stockBranch2: 0, // Present in 1, out in 2
      minStockAlert: 5,
      compatibleMobiles: ["جميع الهواتف iOS/Android"],
      imageUrl: "https://images.unsplash.com/photo-1588449668338-d1347b11a53a?auto=format&fit=crop&w=600&q=80",
    }
  ],
  sales: [
    {
      id: "sale_1",
      productId: "prod_1",
      productName: "شاشة آيفون 13 برو ماكس جودة ممتازة (OLED)",
      branch: "branch1",
      quantity: 2,
      price: 2900,
      total: 5800,
      profit: 1000,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "مبيعات مباشرة للعميل",
      soldBy: "user 1",
    },
    {
      id: "sale_2",
      productId: "prod_3",
      productName: "باغة بايركس حماية كاميرا آيفون 15 برو / ماكس",
      branch: "branch2",
      quantity: 5,
      price: 180,
      total: 900,
      profit: 300,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "محاسبة جملة للمحل المجاور",
      soldBy: "user 2",
    },
    {
      id: "sale_3",
      productId: "prod_2",
      productName: "شاشة سامسونج Galaxy S22 Ultra أصلية توكيل",
      branch: "branch2", // Sold in branch 2 but it is 0! It causes a warning/bypass.
      quantity: 1,
      price: 6500,
      total: 6500,
      profit: 700,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "تنبيه: تم السحب من مخزون الفرع الأول لعدم توفرها بالفرع الثاني",
      soldBy: "user 2",
    }
  ],
  settings: {
    spreadsheetId: "",
    spreadsheetUrl: "",
    lastSync: null,
  },
  logs: [
    {
      id: "log_1",
      user: "system",
      actionType: "add_product",
      details: "تهيئة النظام الأساسي وإدخال بضائع مخازن blackhours الاسترشادية",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  requests: [],
  orders: []
};

import { Redis } from "@upstash/redis";

// Only initialize Redis if environment variables are present, else fallback to null to avoid crashing locally without KV.
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = (redisUrl && redisToken) 
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    }) 
  : null;

// Help helper to initialize and load / save DB
async function loadDb() {
  try {
    if (redis) {
      const data = await redis.get("blackhours_prototype_db");
      if (data) {
        // Ensure properties exist
        const parsed: any = typeof data === "string" ? JSON.parse(data) : data;
        parsed.logs = parsed.logs || [];
        parsed.requests = parsed.requests || [];
        parsed.orders = parsed.orders || [];
        return parsed;
      }
      await redis.set("blackhours_prototype_db", DEFAULT_DB);
      return DEFAULT_DB;
    }

    // Fallback to local FS if Redis isn't configured (e.g. local dev before linking)
    if (!existsSync(DB_DIR)) {
      await fs.mkdir(DB_DIR, { recursive: true });
    }
    if (!existsSync(DB_PATH)) {
      await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    parsed.logs = parsed.logs || [];
    parsed.requests = parsed.requests || [];
    parsed.orders = parsed.orders || [];
    return parsed;
  } catch (err) {
    console.error("Error reading database:", err);
    return DEFAULT_DB;
  }
}

async function saveDb(data: any) {
  try {
    if (redis) {
      await redis.set("blackhours_prototype_db", data);
      return;
    }

    if (!existsSync(DB_DIR)) {
      await fs.mkdir(DB_DIR, { recursive: true });
    }
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// REST APIs
// 1. Get database records
app.get("/api/data", async (req, res) => {
  const db = await loadDb();
  res.json(db);
});

// 2. Update database records (sync from client)
app.post("/api/data", async (req, res) => {
  const data = req.body;
  if (!data?.items || !data?.sales) {
    return res.status(400).json({ error: "Invalid data format" });
  }
  await saveDb(data);
  res.json({ success: true, message: "تم حفظ البيانات بنجاح" });
});

// 3. Gemini Intelligent Assistant Integration (التخيلات ومحاكاة البيانات)
app.post("/api/gemini", async (req, res) => {
  const { prompt, currentInventory, salesHistory, scenarioType } = req.body;
  
  if (!process.env.GROQ_API_KEY) {
    return res.status(400).json({ 
      error: "مفتاح API الخاص بـ Groq غير متوفر. يرجى تكوينه في الإعدادات." 
    });
  }

  try {
    // We can formulate custom prompts depending on scenarioType to give awesome output templates!
    let systemPrompt = "";
    if (scenarioType === "customer_advisor") {
      systemPrompt = `أنت المساعد الذكي الخبير لمتجر وماركت بليس "blackhours" لقطع غيار الهواتف وإكسسواراتها في مصر.
عليك مساعدة المشترين والعملاء باللغة العربية بأسلوب ودود ومحبب بالعامية المصرية الراقية، والإجابة عن توافق قطع الغيار مع هواتفهم وتوجيههم.

أهم القوانين الأمنية والتجارية:
1. اعرض فقط "سعر القطاعي (سعر التجزئة) priceRetail" للعملاء. لا تذكر ولا تشير ولا تلمح إطلاقاً لـ "سعر الجملة" أو "سعر التكلفة" للعملاء نهائياً لسرية حسابات التجار!
2. أجب عن التوافق مع الهواتف بناء على قائمة kompatibles (أو compatibleMobiles) المرفقة بالمنتج.
3. وجههم لإضافة المنتجات إلى السلة والدفع إلكترونياً أو عند الاستلام وتتبع طلبهم برقم الهاتف.
4. لا تتناول أي أمور برمجية أو خوادم، ركز فقط على قطع الغيار، الهواتف، التوافق، الأسعار الاستهلاكية، والدعم.`;
    } else {
      systemPrompt = `أنت المساعد الذكي المالي والمخزني لبراند "blackhours" المتخصص في قطع غيار الهواتف وإكسسواراتها بالجملة في مصر.
لديك فرعان للمحل (الفرع الأول والفرع الثاني)، وعليك مساعدة العميل وصاحب المحل في القيام بالتوقعات والمحاكاة الذكية (التخيلات) للمخزون والمبيعات والأرباح وعرض النتائج بطريقة احترافية باللغة العربية بأسلوب راقٍ ومنظم وسهل الفهم للعملاء والتجار.

التعليمات الهامة:
1. قم بتحليل حالة البضائع وتوزيعها بين الفروع.
2. اعرض التنبؤات والتحليلات في نقاط واضحة ومنظمة.
3. تفاعل مع نوع المحاكاة المطلوبة:
   - "forecasting": توقع النواقص ومعدل النفاد للأسابيع القادمة وتوصية بمعدلات الشراء والتحويلات الاستراتيجية بين الفرعين لمنع نفاد المخزن.
   - "simulation": محاكاة سيناريو بيع أو حملة عروض (مثل: زيادة البيع بنسبة 30% أو تقديم خصومات جملة) وعرض العائد المتوقع والأرباح المتخيلة ومبيعات كل فرع منفصلاً.
   - "adviser": تقديم استشارة ذكية بخصوص تسعير منتج، أو إدخال موديلات جديدة (مثل قطع غيار ايفون 16 أو سامسونج S24)، وموازنة العرض والطلب بين الفرع الأول والفرع الثاني.
4. استخدم لغة تجارية مصرية راقية ومفهومة (مثلاً: "جملة الجملة"، "القاليعي"، "تشكيل البضاعة"، "الفرع الأول"، "الفرع الثاني"، "حركة السحب").
5. لا تشير إلى تفاصيل فنية عن الكود أو الخوادم مطلقاً، ركز على الجوانب المادية، الأرباح، التعبئة، والتحليلات المالية.`;
    }

    const userPrompt = `
نوع المحاكاة المطلوب: ${scenarioType || 'عامة'}
الطلب المخصص للعميل: ${prompt}

تفاصيل المخزون الحالي:
${JSON.stringify(currentInventory, null, 2)}

سجل المبيعات الأخيرة:
${JSON.stringify(salesHistory, null, 2)}

الرجاء تقديم تحليل ذكي للغاية يتضمن:
1. تقييم للوضعية والسيناريو المتخيل.
2. جدول أو قائمة متخيلة للأرباح المتوقعة، وكميات البضاعة المطلوبة لكل فرع.
3. التوصية بالتحويلات المباشرة بين الفرعين (Branch Transfer Advice) لتقليل العجز ومزامنة البضاعة.
4. خلاصة أو عرض نهائي يمكن تقديمه للعميل/التاجر الشريك لجعله يقتنع بالصفقة.
`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      throw new Error(errorData.error?.message || "Groq API error");
    }

    const data = await groqResponse.json();
    const replyText = data.choices[0].message.content;

    res.json({ reply: replyText, text: replyText });
  } catch (error: any) {
    console.error("Groq API Error:", error);
    res.status(500).json({ 
      error: "حدث خطأ أثناء الاتصال بالمساعد الذكي: " + (error.message || error) 
    });
  }
});

// Serve frontend build or mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
