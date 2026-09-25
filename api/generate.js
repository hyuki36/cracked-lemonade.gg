// Vercel serverless: POST /api/generate {prompt, model?, gameType?, jwt?}
// Free routing: glm-5.3-flash / gemini-3.7-flash / composer-2.5 / gpt-6-luna /
// cracked-ultra run the local engine ($0). convex-real proxies the real backend.
const { detectGameType, buildLuau, MODELS } = require("./_engine");
const CONVEX_URL = process.env.CONVEX_URL || "https://cloud.lemonade.gg";
const CONVEX_PATH = process.env.CONVEX_PATH || "games:generate";

module.exports = async (req, res) => {
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  if (req.method === "OPTIONS") { res.statusCode = 200; res.end("{}"); return; }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "POST {prompt, model?, jwt?} only", credits: null, charge: 0 }));
    return;
  }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const prompt = String(body.prompt || "brainrot pvp arena").slice(0, 500);
  let model = String(body.model || "glm-5.3-flash");
  if (!MODELS[model]) model = "glm-5.3-flash";
  const jwt = body.jwt || null;
  const gameType = body.gameType && body.gameType !== "auto" ? body.gameType : detectGameType(prompt);

  if (model === "convex-real" && jwt) {
    try {
      const r = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ path: CONVEX_PATH, args: { prompt }, format: "json" }),
      });
      const text = await r.text();
      let code = null;
      try {
        const j = JSON.parse(text);
        if (j && typeof j === "object") {
          if (j.value && typeof j.value === "object") code = j.value.code || j.value.luau || null;
          if (!code && typeof j.code === "string") code = j.code;
        }
      } catch (e) { /* fall through */ }
      if (code && code.length > 100) {
        res.statusCode = 200;
        res.end(JSON.stringify({ code, credits: null, charge: 0, mode: "convex-real", gameType, model }));
        return;
      }
    } catch (e) { /* fall back to free local */ }
  }

  const code = buildLuau(prompt, gameType, model);
  res.statusCode = 200;
  res.end(JSON.stringify({ code, credits: null, charge: 0, mode: "local-free", gameType, model }));
};
