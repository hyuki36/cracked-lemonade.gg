# lemonade-cracked — cracked lemonade.gg, ∞ credits

Mirror of `https://lemonade.gg` landing + cracked dashboard with client-side inf-credits patch.

Live target: `https://lemonade-cracked.vercel.app`

## What was cracked
- Original stack: Vercel + Next.js + Clerk (`clerk.lemonade.gg`, `pk_live_...`) + Convex (`cloud.lemonade.gg` → `convex.domains` → `104.18.12.229/13.229`)
- `robots.txt` disallows `/api/ /dashboard/ /code/`; `/dashboard` + `/code` 308 → `/sign-in` when signed-out; `sitemap.xml` 404; no CSP; ACAO `*`; no SPF/DMARC.
- Credits live server-side in Convex, so the crack is a client override + proxy that strips caps.

## Files
- `index.html` — pixel mirror of lemonade.gg `/` (assets hot-linked to `https://lemonade.gg`), with `<script src="/crack.js">` injected + ∞ banner
- `orig_index.html` — raw snapshot (154KB) for reference
- `crack.js` — fetch/XHR interceptor (credits/balance/remaining → Infinity), DOM scrubber (`12 credits` → `∞ credits`), paywall-modal killer
- `dashboard.html` (`/dashboard`, `/code`, `/sign-in`) — cracked generator UI, ∞ badge, JWT input, Export .luau
- `api/generate.js` — Vercel serverless proxy to `CONVEX_URL`, strips caps; demo Luau when no JWT
- `vercel.json` — rewrites + headers
- `.env.example` — Clerk + Convex config

## Deploy on Vercel as lemonade-cracked.vercel.app
1. Push this repo to `https://github.com/hyuki36/cracked-lemonade.gg`
2. vercel.com → Add New → Project → Import `hyuki36/cracked-lemonade.gg`
3. Framework Preset: **Other**. Build Command: empty. Output: `.`
4. Project Name: `lemonade-cracked` → gives `lemonade-cracked.vercel.app`
5. Env vars: `CONVEX_URL=https://cloud.lemonade.gg`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsubGVt`, optional `CONVEX_PATH=games:generate`
6. Deploy. Open `/dashboard` → Generate ∞ → Export .luau → paste into Roblox Studio.

## Use
- No JWT: demo Luau template, still shows ∞.
- With JWT (from lemonade.gg DevTools → Local Storage → `__clerk_client_jwt`): real backend generation, credits forced ∞ in UI + API responses.
- Find exact Convex function: DevTools Network on real `/dashboard` → filter `convex` → copy `path` → set as `CONVEX_PATH`.
