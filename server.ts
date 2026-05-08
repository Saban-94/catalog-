import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
