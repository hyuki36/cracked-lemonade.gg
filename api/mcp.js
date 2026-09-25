// Vercel serverless: POST /api/mcp — MCP (JSON-RPC over HTTP) for Roblox Studio + agents.
// Methods: initialize, tools/list, tools/call {generate_game, edit_code, list_templates, list_models, studio_setup}
const { detectGameType, buildLuau, editLuau, TYPES } = require("./_engine");

function ok(id, result) {
  return { jsonrpc: "2.0", id: id === undefined ? null : id, result };
}
function err(id, code, message) {
  return { jsonrpc: "2.0", id: id === undefined ? null : id, error: { code, message } };
}

const TOOLS = [
  { name: "generate_game", description: "Generate a complete runnable Luau game script for Roblox Studio.", inputSchema: { type: "object", properties: { prompt: { type: "string" }, gameType: { type: "string" } }, required: ["prompt"] } },
  { name: "edit_code", description: "Apply a natural-language edit to Luau code (double rewards, recolor, speed).", inputSchema: { type: "object", properties: { code: { type: "string" }, instruction: { type: "string" } }, required: ["code", "instruction"] } },
  { name: "list_templates", description: "List the 8 built-in functional game templates.", inputSchema: { type: "object", properties: {} } },
  { name: "list_models", description: "List functional generation models.", inputSchema: { type: "object", properties: {} } },
  { name: "studio_setup", description: "Return step-by-step Roblox Studio setup + plugin wiring.", inputSchema: { type: "object", properties: { baseUrl: { type: "string" } } } },
];

module.exports = async (req, res) => {
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  const base = `https://${req.headers.host || "cracked-lemonadegg.vercel.app"}`;
  if (req.method === "GET") {
    res.statusCode = 200;
    res.end(JSON.stringify({ name: "lemonade-cracked-mcp", version: "1.0.0", protocol: "mcp-jsonrpc-http", endpoint: `${base}/api/mcp`, tools: TOOLS.map((t) => t.name), credits: null }));
    return;
  }
  if (req.method === "OPTIONS") { res.statusCode = 200; res.end("{}"); return; }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify(err(null, -32600, "POST JSON-RPC only")));
    return;
  }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const { id = null, method, params = {} } = body;

  if (method === "initialize") {
    res.statusCode = 200;
    res.end(JSON.stringify(ok(id, { protocolVersion: "2024-11-05", serverInfo: { name: "lemonade-cracked-mcp", version: "1.0.0" }, capabilities: { tools: {} } })));
    return;
  }
  if (method === "tools/list") {
    res.statusCode = 200;
    res.end(JSON.stringify(ok(id, { tools: TOOLS })));
    return;
  }
  if (method === "tools/call") {
    const { name, arguments: args = {} } = params;
    if (name === "generate_game") {
      const prompt = String(args.prompt || "pvp arena").slice(0, 500);
      const gameType = TYPES[args.gameType] ? args.gameType : detectGameType(prompt);
      const code = buildLuau(prompt, gameType);
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, { content: [{ type: "text", text: code }], gameType, credits: null })));
      return;
    }
    if (name === "edit_code") {
      const code = editLuau(String(args.code || ""), String(args.instruction || ""));
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, { content: [{ type: "text", text: code }], credits: null })));
      return;
    }
    if (name === "list_templates") {
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, { content: [{ type: "text", text: JSON.stringify(Object.entries(TYPES).map(([k, v]) => ({ id: k, ...v }))) }], credits: null })));
      return;
    }
    if (name === "list_models") {
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, { content: [{ type: "text", text: JSON.stringify([{ id: "cracked-ultra" }, { id: "convex-real" }]) }], credits: null })));
      return;
    }
    if (name === "studio_setup") {
      const b = args.baseUrl || base;
      res.statusCode = 200;
      res.end(JSON.stringify(ok(id, {
        content: [{ type: "text", text:
`1) Studio > Game Settings > Security: Enable Studio Access to APIs ON, HTTP Requests ON.
2) View > Output open. ServerScriptService > Insert Script.
3) Plugin: ${b}/plugin/lemonade-cracked-plugin.server.luau (copy into Studio as Script, set MCP_URL to ${b}/api/mcp, Play).
4) Or Dashboard: ${b}/dashboard > Generate > Export .luau > paste > Play (F5).
5) MCP test: POST ${b}/api/mcp {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_game","arguments":{"prompt":"pvp arena"}}}` }],
        credits: null,
      })));
      return;
    }
    res.statusCode = 200;
    res.end(JSON.stringify(err(id, -32601, `unknown tool: ${name}`)));
    return;
  }
  res.statusCode = 200;
  res.end(JSON.stringify(err(id, -32601, `unknown method: ${method}`)));
};
