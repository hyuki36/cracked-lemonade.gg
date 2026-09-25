-- lemonade-cracked Studio bridge (Script, not LocalScript)
-- SETUP:
-- 1) Game Settings > Security > Enable Studio Access to APIs ON + HTTP Requests ON
-- 2) ServerScriptService > Insert Script > paste this ENTIRE file > set MCP_URL below
-- 3) Press Play (F5). Output prints your generated game code -> copy into a new Script.
-- Works with the MCP server at /api/mcp (tools/call -> generate_game).

local HttpService = game:GetService("HttpService")

local MCP_URL = "https://cracked-lemonade.vercel.app/api/mcp"
local PROMPT = "brainrot pvp arena with swords"

local function mcpGenerate(prompt)
  local payload = HttpService:JSONEncode({
    jsonrpc = "2.0",
    id = 1,
    method = "tools/call",
    params = { name = "generate_game", arguments = { prompt = prompt } },
  })
  local ok, res = pcall(function()
    return HttpService:PostAsync(MCP_URL, payload, Enum.HttpContentType.ApplicationJson, false)
  end)
  if not ok then
    warn("[lemonade-cracked] MCP unreachable. Enable HTTP Requests + check MCP_URL. " .. tostring(res))
    return nil
  end
  local parsed
  local ok2, herr = pcall(function()
    parsed = HttpService:JSONDecode(res)
  end)
  if not ok2 or not parsed or not parsed.result then
    warn("[lemonade-cracked] bad MCP response: " .. string.sub(tostring(res), 1, 300))
    return nil
  end
  local content = parsed.result.content
  if content and content[1] and content[1].text then
    return content[1].text
  end
  return nil
end

local code = mcpGenerate(PROMPT)
if code then
  print("[lemonade-cracked] ===== COPY BELOW INTO A NEW SCRIPT (ServerScriptService) =====")
  print(code)
  print("[lemonade-cracked] ===== END · gameType credits: Infinity =====")
else
  warn("[lemonade-cracked] generation failed — use /dashboard > Export .luau instead.")
end
