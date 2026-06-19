import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  try {
    const { prompt, currentInventory, salesHistory, scenarioType } = req.body;
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "API Key is missing in environment variables" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GROQ_API_KEY });
    
    let systemPrompt = "أنت مساعد ذكي ومدير مبيعات وجرد لمحلات قطع غيار هواتف (Blackhours).";
    if (scenarioType === 'valuation') {
      systemPrompt += " قم بتحليل رأس مال البضاعة ومخاطر الركود بناء على المخزون.";
    } else if (scenarioType === 'sales') {
      systemPrompt += " قم بتحليل أرباح الفروع والمنتجات الأكثر مبيعاً.";
    }

    const userPrompt = `
      الطلب من المستخدم: ${prompt}
      مخزون الفروع: ${JSON.stringify(currentInventory)}
      المبيعات الأخيرة: ${JSON.stringify(salesHistory)}
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

    return res.status(200).json({ reply: replyText, text: replyText });
  } catch (error: any) {
    console.error("Vercel Gemini Function Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
