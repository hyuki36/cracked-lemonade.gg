// Vercel serverless: GET /api/models — functional model registry for the dashboard + MCP clients.
module.exports = async (req, res) => {
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  const base = `https://${req.headers.host || "cracked-lemonade.vercel.app"}`;
  res.statusCode = 200;
  res.end(JSON.stringify({
    credits: null,
    models: [
      {
        id: "cracked-ultra",
        name: "Cracked Ultra",
        description: "Local parametric Luau builder. Instant, offline-capable, 8 game types. Fully functional in Roblox Studio.",
        latency: "instant",
        needsJwt: false,
        gameTypes: ["pvp", "tycoon", "simulator", "obby", "shooter", "survival", "farm", "pet"],
      },
      {
        id: "convex-real",
        name: "Convex Real",
        description: "Proxies the real lemonade.gg Convex backend (cloud.lemonade.gg). Needs your Clerk JWT. Falls back to Cracked Ultra.",
        latency: "network",
        needsJwt: true,
      },
    ],
    mcp: {
      endpoint: `${base}/api/mcp`,
      protocol: "mcp-jsonrpc-http",
      tools: ["generate_game", "edit_code", "list_templates", "list_models", "studio_setup"],
    },
    studio: {
      plugin: `${base}/plugin/lemonade-cracked-plugin.server.luau`,
      setup: "Studio > View > Output, Game Settings > Security > Enable Studio Access to APIs + HTTP Requests ON, ServerScriptService > paste plugin or generated script, Play (F5).",
    },
  }));
};
