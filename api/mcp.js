// Vercel serverless: /api/mcp — MCP JSON-RPC over HTTP.
// Game tools + FULL Studio control. The Studio plugin loadstring-executes the
// returned Luau inside Studio, so these tools genuinely build/edit/clear/GUI/light anything.
const { detectGameType, buildLuau, editLuau, buildStudioAction, TYPES, MODELS } = require("./_engine");

function ok(id, result) { return { jsonrpc: "2.0", id: id === undefined ? null : id, result }; }
function err(id, code, message) { return { jsonrpc: "2.0", id: id === undefined ? null : id, error: { code, message } }; }
const T = (text) => ({ content: [{ type: "text", text }], credits: null, charge: 0 });

const TOOLS = [
  { name: "generate_game", description: "Generate a complete runnable Luau game script (free model).", inputSchema: { type: "object", properties: { prompt: { type: "string" }, model: { type: "string" } }, required: ["prompt"] } },
  { name: "edit_code", description: "Apply a natural-language edit to Luau code.", inputSchema: { type: "object", properties: { code: { type: "string" }, instruction: { type: "string" } }, required: ["code", "instruction"] } },
  { name: "list_templates", description: "List the 8 built-in game templates.", inputSchema: { type: "object", properties: {} } },
  { name: "list_models", description: "List the free models (GLM / Gemini / Composer / GPT-6).", inputSchema: { type: "object", properties: {} } },
  { name: "studio_setup", description: "Roblox Studio wiring guide.", inputSchema: { type: "object", properties: { baseUrl: { type: "string" } } } },
  { name: "studio_build", description: "Build a FULL game inside Studio: returns executable Luau the plugin runs (creates folder, base, spawn, leaderstats, tools).", inputSchema: { type: "object", properties: { prompt: { type: "string" }, model: { type: "string" } }, required: ["prompt"] } },
  { name: "studio_create", description: "Create any Instance inside Studio (Part, PointLight, SpawnLocation, ...).", inputSchema: { type: "object", properties: { className: { type: "string" }, name: { type: "string" }, parent: { type: "string" }, color: { type: "string" }, size: { type: "string" }, position: { type: "string" } }, required: ["className"] } },
  { name: "studio_delete", description: "Delete anything in Studio by name (searches Workspace/Lighting/StarterGui).", inputSchema: { type: "object", properties: { target: { type: "string" } }, required: ["target"] } },
  { name: "studio_gui", description: "Create StarterGui shop/leaderboard UI inside Studio.", inputSchema: { type: "object", properties: {} } },
  { name: "studio_lighting", description: "Set Studio Lighting to a clean day-studio look.", inputSchema: { type: "object", properties: {} } },
];

module.exports = async (req, res) => {
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  const base = `https://${req.headers.host || "cracked-lemonade.vercel.app"}`;
  if (req.method === "GET") {
    res.statusCode = 200;
    res.end(JSON.stringify({ name: "lemonade-cracked-mcp", version: "2.0.0", protocol: "mcp-jsonrpc-http", endpoint: `${base}/api/mcp`, tools: TOOLS.map((t) => t.name), credits: null, charge: 0 }));
    return;
  }
  if (req.method === "OPTIONS") { res.statusCode = 200; res.end("{}"); return; }
  if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify(err(null, -32600, "POST JSON-RPC only"))); return; }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const { id = null, method, params = {} } = body;

  if (method === "initialize") {
    res.statusCode = 200;
    res.end(JSON.stringify(ok(id, { protocolVersion: "2024-11-05", serverInfo: { name: "lemonade-cracked-mcp", version: "2.0.0" }, capabilities: { tools: {} } })));
    return;
  }
  if (method === "tools/list") { res.statusCode = 200; res.end(JSON.stringify(ok(id, { tools: TOOLS }))); return; }
  if (method === "tools/call") {
    const { name, arguments: args = {} } = params;
    if (name === "generate_game" || name === "studio_build") {
      const prompt = String(args.prompt || "pvp arena").slice(0, 500);
      const model = MODELS[args.model] ? args.model : "glm-5.3-flash";
      const gameType = detectGameType(prompt);
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, { ...T(buildLuau(prompt, gameType, model)), gameType, model })));
      return;
    }
    if (name === "edit_code") {
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, T(editLuau(String(args.code || ""), String(args.instruction || ""))))));
      return;
    }
    if (name === "list_templates") {
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, T(JSON.stringify(Object.entries(TYPES).map(([k, v]) => ({ id: k, ...v })))))));
      return;
    }
    if (name === "list_models") {
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, T(JSON.stringify(Object.entries(MODELS).map(([mid, m]) => ({ id: mid, name: m.name, cost: "$0 free", badge: m.badge, tab: m.tab, performance: { simple: m.simple, complex: m.complex, speed: m.speed } })))))));
      return;
    }
    if (name === "studio_setup") {
      const b = args.baseUrl || base;
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, T(
`1) Studio > Game Settings > Security: HTTP Requests ON (+ Studio Access to APIs ON).
2) ServerScriptService > new Script > paste ${b}/plugin/lemonade-cracked-plugin.server.luau (set TASK at top) > Play.
3) The plugin calls ${b}/api/mcp and loadstring-EXECUTES the returned build/create/delete/gui/lighting code inside Studio.
4) No plugin? ${b}/dashboard > Generate > Export .luau > paste > Play (F5).`))));
      return;
    }
    if (name === "studio_create" || name === "studio_delete" || name === "studio_gui" || name === "studio_lighting") {
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, T(buildStudioAction(name, args)))));
      return;
    }
    res.statusCode = 200;
    res.end(JSON.stringify(err(id, -32601, `unknown tool: ${name}`)));
    return;
  }
  res.statusCode = 200;
  res.end(JSON.stringify(err(id, -32601, `unknown method: ${method}`)));
};
