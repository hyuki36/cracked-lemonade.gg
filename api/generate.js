// Vercel serverless: /api/generate
// Proxies to real Convex (cloud.lemonade.gg) when JWT supplied,
// else returns demo Luau. Strips any credit caps from responses.
const CONVEX_URL = process.env.CONVEX_URL || "https://cloud.lemonade.gg";

function demoLuau(prompt) {
  return `-- lemonade-cracked demo (no JWT supplied)
-- prompt: ${(prompt || "").slice(0, 200)}
-- credits: Infinity

local Players = game:GetService("Players")

local function buildArena()
  local folder = Instance.new("Folder")
  folder.Name = "CrackedArena"
  local base = Instance.new("Part")
  base.Name = "Baseplate"
  base.Size = Vector3.new(128, 2, 128)
  base.Anchored = true
  base.Parent = folder
  return folder
end

Players.PlayerAdded:Connect(function(plr)
  plr.CharacterAdded:Connect(function(char)
    local sword = Instance.new("Tool")
    sword.Name = "Brainrot Blade"
    sword.RequiresHandle = false
    sword.Parent = plr.Backpack
  end)
end)

buildArena().Parent = workspace
print("lemonade-cracked inf ready")
`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "POST {prompt, jwt} only", credits: null }));
    return;
  }
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};
  const prompt = body.prompt || "pvp arena";
  const jwt = body.jwt || null;

  // Demo mode: inf credits, no backend needed
  if (!jwt) {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ code: demoLuau(prompt), credits: null, mode: "demo-inf" }));
    return;
  }

  // Real mode: forward to Convex generic query endpoint.
  // Exact function path varies by deployment; override via CONVEX_PATH env.
  // Discover it in DevTools Network tab on lemonade.gg/dashboard (filter 'convex').
  const convexPath = process.env.CONVEX_PATH || "games:generate";
  try {
    const r = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify({ path: convexPath, args: { prompt }, format: "json" }),
    });
    const text = await r.text();
    let out;
    try {
      const j = JSON.parse(text);
      // strip caps
      if (j && typeof j === "object") {
        j.credits = null;
        j.balance = null;
        if (j.value && typeof j.value === "object") {
          j.value.credits = null;
        }
      }
      out = j.value && (j.value.code || j.value.luau) ? (j.value.code || j.value.luau) : JSON.stringify(j).slice(0, 20000);
    } catch (e) {
      out = text.slice(0, 20000);
    }
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ code: out, credits: null, mode: "convex-proxy-inf" }));
  } catch (e) {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ code: demoLuau(prompt), credits: null, mode: "fallback-inf", note: String(e).slice(0, 300) }));
  }
};
