// Shared Luau engine for lemonade-cracked.
// - buildLuau(prompt, gameType, modelId): full runnable ServerScriptService script.
// - buildStudioAction(action, args): executable Luau for full Studio control
//   (create / delete / gui / lighting / build), run via plugin loadstring.
function detectGameType(prompt) {
  const p = String(prompt || "").toLowerCase();
  const has = (...ws) => ws.some((w) => p.includes(w));
  if (has("pvp", "arena", "sword", "fight", "battle", "brainrot")) return "pvp";
  if (has("tycoon", "factory", "dropper", "business", "lemonade stand", "stand")) return "tycoon";
  if (has("simulator", "sim", "click", "power", "strength")) return "simulator";
  if (has("obby", "obstacle", "parkour", "stage", "checkpoint", "tower")) return "obby";
  if (has("gun", "shooter", "fps", "sniper", "blaster")) return "shooter";
  if (has("survival", "survive", "wave", "night", "zombie")) return "survival";
  if (has("farm", "garden", "crop", "plant", "grow")) return "farm";
  if (has("pet", "egg", "hatch", "adopt")) return "pet";
  if (has("race", "cart", "car", "aura")) return "obby";
  return "pvp";
}

const TYPES = {
  pvp: { label: "PvP Arena", base: "CrackedArena", tool: "Brainrot Blade", stat: "KOs", color: "Bright yellow", reward: 10 },
  tycoon: { label: "Tycoon", base: "CrackedTycoon", tool: "Collector", stat: "Cash", color: "Lime green", reward: 25 },
  simulator: { label: "Simulator", base: "CrackedSim", tool: "Clicker", stat: "Power", color: "Bright blue", reward: 5 },
  obby: { label: "Obby", base: "CrackedObby", tool: "Speed Coil", stat: "Stage", color: "Bright red", reward: 1 },
  shooter: { label: "Shooter", base: "CrackedRange", tool: "Blaster", stat: "Hits", color: "Really black", reward: 15 },
  survival: { label: "Survival", base: "CrackedCamp", tool: "Lantern", stat: "Nights", color: "Brown", reward: 20 },
  farm: { label: "Farm", base: "CrackedFarm", tool: "Watering Can", stat: "Crops", color: "Bright green", reward: 8 },
  pet: { label: "Pet Sim", base: "CrackedNursery", tool: "Treat", stat: "Pets", color: "Hot pink", reward: 12 },
};

// Free-tier model personalities (all $0, ∞ credits). Each tunes the same
// proven scaffold: glm = compact/fast, gemini = commented/balanced,
// composer = deluxe (lighting + extra decor), luna = all-round.
const MODELS = {
  "glm-5.3-flash": { name: "GLM 5.3 Flash", rewardMul: 1, extra: "compact", cost: "$", speed: 5, simple: 4, complex: 3, tab: "recommended", badge: null },
  "gemini-3.7-flash": { name: "Gemini 3.7 Flash", rewardMul: 1, extra: "commented", cost: "$$$", speed: 4, simple: 5, complex: 4, tab: "recommended", badge: "50% off" },
  "composer-2.5": { name: "Composer 2.5", rewardMul: 2, extra: "deluxe", cost: "$$$", speed: 3, simple: 4, complex: 5, tab: "advanced", badge: null },
  "gpt-6-luna": { name: "GPT-6 Luna", rewardMul: 1, extra: "balanced", cost: "$", speed: 4, simple: 5, complex: 5, tab: "recommended", badge: null },
  "cracked-ultra": { name: "Cracked Ultra", rewardMul: 1, extra: "balanced", cost: "$", speed: 5, simple: 5, complex: 4, tab: "lowcost", badge: null },
  "convex-real": { name: "Convex Real", rewardMul: 1, extra: "balanced", cost: "$$$", speed: 2, simple: 5, complex: 5, tab: "advanced", badge: null },
};

function safeName(s) {
  return String(s || "CrackedGame").replace(/[^A-Za-z0-9 ]/g, "").slice(0, 40) || "CrackedGame";
}

function buildLuau(prompt, gameType, modelId) {
  const type = TYPES[gameType] ? gameType : "pvp";
  const cfg = TYPES[type];
  const m = MODELS[modelId] || MODELS["glm-5.3-flash"];
  const title = safeName(prompt).slice(0, 32) || cfg.label;
  const reward = cfg.reward * (m.rewardMul || 1);
  const header_extra =
    m.extra === "commented" ? "-- Style: commented, step-by-step (gemini-3.7-flash)\n" :
    m.extra === "deluxe" ? "-- Style: deluxe build + atmosphere lighting (composer-2.5)\n" :
    m.extra === "compact" ? "-- Style: compact, zero-fluff (glm-5.3-flash)\n" :
    "-- Style: balanced (gpt-6-luna)\n";
  const deluxeLua = m.extra === "deluxe" ? `
-- deluxe: atmosphere + title billboard
local lighting = game:GetService("Lighting")
lighting.Ambient = Color3.fromRGB(90, 90, 90)
lighting.Brightness = 3
local lamp = Instance.new("PointLight")
lamp.Brightness = 2
lamp.Range = 60
lamp.Parent = folder:WaitForChild("Spawn")
local bill = Instance.new("BillboardGui")
bill.Size = UDim2.new(0, 300, 0, 60)
bill.Adornee = folder:WaitForChild("Baseplate")
bill.Parent = folder
local lbl = Instance.new("TextLabel")
lbl.Size = UDim2.new(1, 0, 1, 0)
lbl.BackgroundTransparency = 1
lbl.Text = CONFIG.GameName
lbl.TextScaled = true
lbl.TextColor3 = Color3.fromRGB(255, 255, 255)
lbl.Parent = bill
` : "";
  return `-- ${title} (${cfg.label}) [${m.name}]
-- Generated free · model ${modelId} · cost $0 · credits Infinity
${header_extra}-- SETUP: Roblox Studio > ServerScriptService > Insert Script > paste ALL > Play (F5)

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local CONFIG = {
  GameName = "${title}",
  StatName = "${cfg.stat}",
  Reward = ${reward},
  BaseColor = BrickColor.new("${cfg.color}"),
  BaseSize = Vector3.new(128, 2, 128),
}

local function ensureFolder()
  local f = Workspace:FindFirstChild(CONFIG.GameName)
  if not f then
    f = Instance.new("Folder")
    f.Name = CONFIG.GameName
    f.Parent = Workspace
  end
  return f
end

local function buildBase(folder)
  if folder:FindFirstChild("Baseplate") then return end
  local base = Instance.new("Part")
  base.Name = "Baseplate"
  base.Size = CONFIG.BaseSize
  base.Position = Vector3.new(0, 0, 0)
  base.Anchored = true
  base.BrickColor = CONFIG.BaseColor
  base.Material = Enum.Material.Grass
  base.Parent = folder
  local spawn = Instance.new("SpawnLocation")
  spawn.Name = "Spawn"
  spawn.Size = Vector3.new(6, 1, 6)
  spawn.Position = Vector3.new(0, 4, 0)
  spawn.Anchored = true
  spawn.Neutral = true
  spawn.Parent = folder
  for i = 1, 4 do
    local pillar = Instance.new("Part")
    pillar.Name = "Pillar" .. i
    pillar.Size = Vector3.new(4, 16, 4)
    pillar.Position = Vector3.new(math.cos(i * math.pi / 2) * 40, 8, math.sin(i * math.pi / 2) * 40)
    pillar.Anchored = true
    pillar.BrickColor = BrickColor.new("Institutional white")
    pillar.Parent = folder
  end
end

local function giveTool(player)
  local pack = player:WaitForChild("Backpack")
  if pack:FindFirstChild("${cfg.tool}") then return end
  local tool = Instance.new("Tool")
  tool.Name = "${cfg.tool}"
  tool.RequiresHandle = false
  tool.CanBeDropped = false
  tool.Parent = pack
  tool.Activated:Connect(function()
    local char = player.Character
    if not char then return end
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if hrp then
      hrp.Velocity = hrp.Velocity + Vector3.new(0, 50, 0)
    end
    local leader = player:FindFirstChild("leaderstats")
    if leader then
      local s = leader:FindFirstChild(CONFIG.StatName)
      if s then s.Value += CONFIG.Reward end
    end
  end)
end

local function onPlayer(player)
  local ls = Instance.new("Folder")
  ls.Name = "leaderstats"
  ls.Parent = player
  local stat = Instance.new("IntValue")
  stat.Name = CONFIG.StatName
  stat.Value = 0
  stat.Parent = ls
  giveTool(player)
end

local folder = ensureFolder()
buildBase(folder)
${deluxeLua}Players.PlayerAdded:Connect(onPlayer)
for _, plr in ipairs(Players:GetPlayers()) do
  task.spawn(onPlayer, plr)
end
print("[lemonade-cracked] ${cfg.label} ready | " .. CONFIG.GameName .. " | model ${modelId} | $0 | Infinity")
`;
}

function editLuau(code, instruction) {
  let out = String(code || "");
  const ins = String(instruction || "").toLowerCase();
  if (/double|2x|x2/.test(ins) && /reward\s*=\s*(\d+)/i.test(out)) {
    out = out.replace(/Reward\s*=\s*(\d+)/i, (m, n) => `Reward = ${Number(n) * 2}`);
  }
  if (/half|nerf/.test(ins) && /reward\s*=\s*(\d+)/i.test(out)) {
    out = out.replace(/Reward\s*=\s*(\d+)/i, (m, n) => `Reward = ${Math.max(1, Math.floor(Number(n) / 2))}`);
  }
  const colorM = ins.match(/(red|blue|green|yellow|pink|black|white|orange|purple)/);
  if (colorM && /BrickColor\.new\("([^"]+)"\)/.test(out)) {
    const map = { red: "Bright red", blue: "Bright blue", green: "Bright green", yellow: "Bright yellow", pink: "Hot pink", black: "Really black", white: "Institutional white", orange: "Bright orange", purple: "Bright violet" };
    out = out.replace(/BrickColor\.new\("[^"]+"\)/, `BrickColor.new("${map[colorM[1]]}")`);
  }
  if (out === String(code || "")) {
    out += `\n-- edit applied: ${String(instruction).slice(0, 120)}\n`;
  }
  return out;
}

// Executable Studio actions. The plugin loadstring-runs the returned code
// inside Studio, so MCP can create / delete / restyle anything.
function luaStr(s) {
  return '"' + String(s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').slice(0, 200) + '"';
}
function buildStudioAction(action, args) {
  args = args || {};
  if (action === "studio_create") {
    const cls = String(args.className || "Part").replace(/[^A-Za-z]/g, "") || "Part";
    const name = String(args.name || "CrackedPart").replace(/[^A-Za-z0-9_]/g, "") || "CrackedPart";
    const parent = String(args.parent || "Workspace").replace(/[^A-Za-z]/g, "") || "Workspace";
    const parentLua = parent === "Lighting" ? 'game:GetService("Lighting")' : parent === "StarterGui" ? 'game:GetService("StarterGui")' : 'game:GetService("Workspace")';
    return `-- studio_create: ${cls} "${name}" -> ${parent} ($0, Infinity)
local inst = Instance.new("${cls}")
inst.Name = ${luaStr(name)}
${args.color ? `inst.BrickColor = BrickColor.new("${String(args.color).slice(0, 30)}")\n` : ""}${args.size ? `inst.Size = Vector3.new(${String(args.size).slice(0, 30)})\n` : ""}${args.position ? `inst.Position = Vector3.new(${String(args.position).slice(0, 30)})\n` : "inst.Position = Vector3.new(0, 10, 0)\n"}${cls === "Part" ? "inst.Anchored = true\n" : ""}inst.Parent = ${parentLua}
print("[lemonade-cracked] created ${cls} " .. inst:GetFullName())
`;
  }
  if (action === "studio_delete") {
    const target = String(args.target || "CrackedArena").replace(/[^A-Za-z0-9_]/g, "") || "CrackedArena";
    return `-- studio_delete ($0, Infinity)
for _, s in ipairs({game:GetService("Workspace"), game:GetService("Lighting"), game:GetService("StarterGui")}) do
  local f = s:FindFirstChild(${luaStr(target)}, true)
  if f then f:Destroy() print("[lemonade-cracked] deleted " .. ${luaStr(target)}) end
end
`;
  }
  if (action === "studio_gui") {
    return `-- studio_gui: shop/leaderboard UI ($0, Infinity)
local gui = game:GetService("StarterGui"):FindFirstChild("CrackedUI")
if not gui then
  gui = Instance.new("ScreenGui")
  gui.Name = "CrackedUI"
  gui.ResetOnSpawn = false
  gui.Parent = game:GetService("StarterGui")
end
local btn = Instance.new("TextButton")
btn.Name = "ShopButton"
btn.Size = UDim2.new(0, 160, 0, 48)
btn.Position = UDim2.new(1, -176, 0, 16)
btn.Text = "SHOP"
btn.Font = Enum.Font.GothamBold
btn.TextSize = 18
btn.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
btn.TextColor3 = Color3.fromRGB(255, 255, 255)
btn.Parent = gui
print("[lemonade-cracked] GUI ready: StarterGui/CrackedUI")
`;
  }
  if (action === "studio_lighting") {
    return `-- studio_lighting: monochrome day studio look ($0, Infinity)
local L = game:GetService("Lighting")
L.Ambient = Color3.fromRGB(110, 110, 110)
L.Brightness = 3
L.ClockTime = 14
L.FogEnd = 800
print("[lemonade-cracked] lighting set")
`;
  }
  const prompt = String(args.prompt || "pvp arena").slice(0, 300);
  return buildLuau(prompt, detectGameType(prompt), args.model || "composer-2.5");
}

module.exports = { detectGameType, buildLuau, editLuau, buildStudioAction, TYPES, MODELS };
