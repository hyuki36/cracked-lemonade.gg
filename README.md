# lemonade-cracked — ∞ credits · functional models + MCP for Roblox Studio

Premium mirror of `https://lemonade.gg` with infinite credits, 8 working Luau models and a real MCP bridge.

Live: `https://cracked-lemonade.vercel.app` (also works as `lemonade-cracked.vercel.app` if you rename the Vercel project)

## What works
- `/` — cinematic landing (no Next.js runtime, no client exceptions)
- `/dashboard` — Builder ∞ IDE: model picker, 8 templates, Generate, Edit, Copy, Export .luau
- `POST /api/generate` `{prompt, model?, jwt?}` → `{code, gameType, mode, credits: null}`
  - `cracked-ultra` (default): local parametric engine `api/_engine.js`, instant, always works
  - `convex-real`: proxies `https://cloud.lemonade.gg` with your Clerk JWT, falls back to local
- `GET /api/models` — live model + MCP + Studio registry
- `/api/mcp` — MCP JSON-RPC over HTTP: `initialize`, `tools/list`, `tools/call`
  - tools: `generate_game`, `edit_code`, `list_templates`, `list_models`, `studio_setup`
- `/plugin/lemonade-cracked-plugin.server.luau` — Studio Script using `HttpService:PostAsync` → MCP
- `/mcp.json` — Cursor/Claude client config pointing at `/api/mcp`
- `/crack.js` — inf-credits fetch/XHR + DOM patch (credits → ∞, paywall killer)

## Deploy (Vercel)
1. Import `hyuki36/cracked-lemonade.gg`, Framework: Other, Build empty, Output `.`
2. Project name `cracked-lemonade` (or `lemonade-cracked`)
3. Env (optional, only for convex-real): `CONVEX_URL=https://cloud.lemonade.gg`, `CONVEX_PATH=games:generate`
4. Deploy. Test: `GET /api/models`, `GET /api/mcp`, open `/dashboard` → Generate ∞

## Roblox Studio wiring
1. Game Settings → Security → HTTP Requests ON (+ Studio Access to APIs ON)
2. Option A (no plugin): `/dashboard` → Generate ∞ → Export .luau → ServerScriptService → new Script → paste → Play (F5)
3. Option B (MCP): ServerScriptService → new Script → paste `/plugin/lemonade-cracked-plugin.server.luau` (set `MCP_URL` to your deployment) → Play → Output prints the game code → copy into a second Script → Play again
4. MCP raw test: `POST /api/mcp {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_game","arguments":{"prompt":"tycoon with droppers"}}}`

## Files
`index.html` landing · `dashboard.html` builder · `crack.js` inf patch · `api/_engine.js` Luau engine · `api/generate.js` models · `api/models.js` registry · `api/mcp.js` MCP server · `plugin/*.luau` Studio bridge · `mcp.json` client config · `orig_index.html` reference snapshot
