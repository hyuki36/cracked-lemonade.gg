// Vercel serverless: POST /api/generate
// Models: cracked-ultra (local parametric Luau, instant, inf) + convex-real (proxy).
const { detectGameType, buildLuau } = require("./_engine");
const CONVEX_URL = process.env.CONVEX_URL || "https://cloud.lemonade.gg";
const CONVEX_PATH = process.env.CONVEX_PATH || "games:generate";

module.exports = async (req, res) => {
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end("{}");
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "POST {prompt, model?, jwt?} only", credits: null }));
    return;
  }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const prompt = String(body.prompt || "brainrot pvp arena").slice(0, 500);
  const model = String(body.model || "cracked-ultra");
  const jwt = body.jwt || null;
  const gameType = detectGameType(prompt);

  // convex-real: try real backend first, fall back to local engine (still functional)
  if ((model === "convex-real" || jwt) && jwt) {
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
      } catch (e) { if (text.length > 50 && text.includes("local ")) code = text.slice(0, 20000); }
      if (code && code.length > 100) {
        res.statusCode = 200;
        res.end(JSON.stringify({ code, credits: null, mode: "convex-real", gameType, model: "convex-real" }));
        return;
      }
    } catch (e) { /* fall through to local */ }
  }

  const code = buildLuau(prompt, gameType);
  res.statusCode = 200;
  res.end(JSON.stringify({ code, credits: null, mode: "local-inf", gameType, model: "cracked-ultra" }));
};
