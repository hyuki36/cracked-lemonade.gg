// Vercel serverless: GET /api/models — free model registry (mirrors real dashboard picker).
// All models cost $0 here: cracked server-side, ∞ credits enforced client + API.
const { MODELS, TYPES } = require("./_engine");
module.exports = async (req, res) => {
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  const base = `https://${req.headers.host || "cracked-lemonade.vercel.app"}`;
  const order = ["glm-5.3-flash", "gemini-3.7-flash", "composer-2.5", "gpt-6-luna"];
  const models = order.map((id) => ({
    id,
    name: MODELS[id].name,
    cost: "$0 (free here)",
    listPrice: MODELS[id].cost,
    badge: MODELS[id].badge,
    tab: MODELS[id].tab,
    performance: { simple: MODELS[id].simple, complex: MODELS[id].complex, speed: MODELS[id].speed },
    needsJwt: false,
  }));
  models.push({ id: "convex-real", name: "Convex Real", cost: "$0 (free here)", listPrice: "$$$", badge: "needs JWT", tab: "advanced", performance: { simple: 5, complex: 5, speed: 2 }, needsJwt: true });
  res.statusCode = 200;
  res.end(JSON.stringify({
    credits: null,
    charge: 0,
    models,
    gameTypes: Object.keys(TYPES),
    mcp: {
      endpoint: `${base}/api/mcp`,
      protocol: "mcp-jsonrpc-http",
      tools: ["generate_game", "edit_code", "list_templates", "list_models", "studio_setup", "studio_build", "studio_create", "studio_delete", "studio_gui", "studio_lighting"],
    },
    studio: {
      plugin: `${base}/plugin/lemonade-cracked-plugin.server.luau`,
      setup: "HTTP Requests ON, paste plugin or generated script into ServerScriptService, Play (F5).",
    },
  }));
};
