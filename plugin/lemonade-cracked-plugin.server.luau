-- lemonade-cracked FULL Studio controller (Script in ServerScriptService, Play with F5)
-- This plugin EXECUTES MCP inside Studio: it fetches executable Luau from /api/mcp
-- and loadstring-runs it, so MCP can build / create / delete / GUI / light ANYTHING.
--
-- SETUP:
-- 1) Game Settings > Security > HTTP Requests ON (+ Studio Access to APIs ON)
-- 2) ServerScriptService > Insert Script > paste this ENTIRE file
-- 3) Edit TASK / ACTION below, press Play. Watch Output.
--
-- ACTIONS:
--   "build"    -> full game from TASK prompt (folder + base + spawn + leaderstats + tool)
--   "create"   -> one instance: set CLASS + INST_NAME (+ COLOR/SIZE/POS)
--   "delete"   -> delete by name: set TARGET
--   "gui"      -> shop/leaderboard ScreenGui
--   "lighting" -> clean day-studio lighting

local HttpService = game:GetService("HttpService")

local MCP_URL = "https://cracked-lemonade.vercel.app/api/mcp"
local ACTION = "build"
local TASK = "brainrot pvp arena with swords"
local MODEL = "glm-5.3-flash"
local CLASS = "Part"
local INST_NAME = "CrackedPart"
local TARGET = "CrackedArena"

local function callTool(name, args)
  local payload = HttpService:JSONEncode({ jsonrpc = "2.0", id = 1, method = "tools/call", params = { name = name, arguments = args } })
  local ok, res = pcall(function()
    return HttpService:PostAsync(MCP_URL, payload, Enum.HttpContentType.ApplicationJson, false)
  end)
  if not ok then
    warn("[lemonade-cracked] MCP unreachable. HTTP Requests ON? URL ok? " .. tostring(res))
    return nil
  end
  local parsed
  local ok2 = pcall(function() parsed = HttpService:JSONDecode(res) end)
  if not ok2 or not parsed or not parsed.result or not parsed.result.content then
    warn("[lemonade-cracked] bad MCP response: " .. string.sub(tostring(res), 1, 300))
    return nil
  end
  return parsed.result.content[1].text
end

local code = nil
if ACTION == "build" then
  code = callTool("studio_build", { prompt = TASK, model = MODEL })
elseif ACTION == "create" then
  code = callTool("studio_create", { className = CLASS, name = INST_NAME })
elseif ACTION == "delete" then
  code = callTool("studio_delete", { target = TARGET })
elseif ACTION == "gui" then
  code = callTool("studio_gui", {})
elseif ACTION == "lighting" then
  code = callTool("studio_lighting", {})
else
  warn("[lemonade-cracked] unknown ACTION: " .. tostring(ACTION))
end

if code then
  print("[lemonade-cracked] executing " .. ACTION .. " (" .. #code .. " bytes, $0, Infinity)...")
  local fn, herr = loadstring(code)
  if not fn then
    warn("[lemonade-cracked] compile error: " .. tostring(herr))
  else
    local ok, rerr = pcall(fn)
    if ok then
      print("[lemonade-cracked] DONE. Change ACTION/TASK and press Play again for more.")
    else
      warn("[lemonade-cracked] runtime error: " .. tostring(rerr))
    end
  end
else
  warn("[lemonade-cracked] nothing to execute — fallback: /dashboard > Export .luau")
end
