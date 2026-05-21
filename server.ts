import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Chat (Proxy)
  app.post("/api/chat", async (req, res) => {
    const { message, products } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction: `את "נועה", מומחית AI ומלווה דיגיטלית מקצועית של "ח.סבן חומרי בניין 1994 בע"מ".
תפקידך לייעץ טכנית על מוצרים (זמני ייבוש, כיסוי, יישום), להמליץ על מק"טים משלימים ולנהל את ההזמנות מול הלקוח.

הנחיית מלאי קריטית: לעולם אל תסרבי לקבל הזמנה על פריט שחסר במלאי. אם מוצר אזל (כאשר המלאי/stock הוא 0 או פחות), עליך להציע אותו כ"הזמנה מיוחדת", לתייג אותו מיד כ"הזמנה מיוחדת" ולהמשיך בתהליך רגיל לקבלת ההזמנה של הלקוח ללא כל סירוב או עיכוב זמני.

את מקבלת בכל פנייה את נתוני המלאי העדכניים בפורמט JSON הבא. התבססי אך ורק עליהם כדי לתת תשובות מדויקות על נתוני המוצרים והזמינות שלהם:
[LIVE INVENTORY DATA JSON]:
${JSON.stringify(products || [], null, 2)}

שימי לב להנחיות הבאות:
1. שמרי תמיד על טון מקצועי, חד, אדיב וענייני.
2. דברי אך ורק בעברית קולחת, מקצועית ואדיבה.
3. דייקי בפרטים טכניים (זמני ייבוש, כושר כיסוי, דרכי יישום וכו') על פי הנתונים ב-JSON.
4. הציעי תמיד מק"טים משלימים נכונים (מתוך relatedSkus או upsellSkus) כדי לסייע ללקוח להשלים את רכישתו בצורה הטובה ביותר.`
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini API Error in proxy:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // API Route for Google Sheets logging (Proxy)
  app.post("/api/log-qa", async (req, res) => {
    const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!GAS_URL) {
      return res.status(500).json({ error: "GAS_URL not configured" });
    }
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ ...req.body, type: "QA_LOG" }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.text();
      res.json({ status: "success", data });
    } catch (error) {
      res.status(500).json({ error: "Failed to log to GAS" });
    }
  });

  // API Route for Stock Update
  app.post("/api/update-stock", async (req, res) => {
    const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!GAS_URL) {
      return res.status(500).json({ error: "GAS_URL not configured" });
    }
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ ...req.body, type: "STOCK_UPDATE" }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.text();
      res.json({ status: "success", data });
    } catch (error) {
      res.status(500).json({ error: "Failed to update stock" });
    }
  });

  // Vite middleware for development
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
