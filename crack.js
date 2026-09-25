/* lemonade-cracked - inf credits client patch
 * Loaded on every page. Forces credits/balance to Infinity,
 * kills paywall modals, keeps generation flowing.
 */
(function () {
  "use strict";
  const INF = Infinity;
  window.__CRACKED__ = { credits: INF, plan: "pro-inf", cracked: true };

  // 1. Persist inf credits locally (overrides real values on boot)
  try {
    localStorage.setItem("__cracked_credits", "Infinity");
    localStorage.setItem("lemonade_credits", "Infinity");
    localStorage.setItem("credits", "Infinity");
  } catch (e) {}

  // 2. Patch JSON responses: credits/balance/remaining/usage -> Infinity
  function patchObj(o) {
    if (!o || typeof o !== "object") return o;
    const keys = ["credits", "credit", "balance", "remaining", "remainingCredits", "usage", "usagesLeft", "planCredits"];
    for (const k of Object.keys(o)) {
      if (keys.includes(k)) {
        o[k] = INF;
      } else if (k === "plan" && typeof o[k] === "string") {
        o[k] = "pro-inf";
      } else if (typeof o[k] === "object") {
        patchObj(o[k]);
      }
    }
    return o;
  }

  function patchJsonText(text) {
    if (typeof text !== "string") return text;
    if (!/credit|balance|remaining|usage|plan/i.test(text)) return text;
    try {
      const j = JSON.parse(text);
      return JSON.stringify(patchObj(j));
    } catch (e) {
      return text
        .replace(/"credits"\s*:\s*\d+/gi, '"credits":null')
        .replace(/"balance"\s*:\s*\d+/gi, '"balance":null');
    }
  }

  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await _fetch.apply(this, args);
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        const txt = await res.clone().text();
        const patched = patchJsonText(txt);
        if (patched !== txt) {
          return new Response(patched, {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
          });
        }
      }
    } catch (e) {}
    return res;
  };

  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (...a) { return _open.apply(this, a); };
  XMLHttpRequest.prototype.send = function (...a) {
    this.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        try {
          Object.defineProperty(this, "responseText", {
            value: patchJsonText(this.responseText),
            writable: false,
          });
        } catch (e) {}
      }
    });
    return _send.apply(this, a);
  };

  // 3. DOM: rewrite visible credit counters to infinity, kill paywalls
  function scrub(root) {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      if (/\b\d+\s*credits?\b/i.test(n.nodeValue)) {
        n.nodeValue = n.nodeValue.replace(/\b\d+\s*credits?\b/gi, "\u221E credits");
      }
    }
    // kill upgrade / out-of-credits modals
    document.querySelectorAll('[role="dialog"], .modal, [class*="paywall"], [class*="upgrade"], [class*="Paywall"]').forEach((el) => {
      const t = (el.innerText || "").toLowerCase();
      if (t.includes("out of credits") || t.includes("buy credits") || t.includes("upgrade to continue") || t.includes("not enough credits")) {
        el.style.display = "none";
        el.remove();
      }
    });
    // force any credit badge to infinity
    document.querySelectorAll('[data-credits], [id*="credit"], [class*="credit"]').forEach((el) => {
      if (/^\d+$/.test(el.textContent.trim())) el.textContent = "\u221E";
    });
  }

  new MutationObserver(() => scrub(document.body)).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  document.addEventListener("DOMContentLoaded", () => scrub(document.body));
  setInterval(() => { try { scrub(document.body); } catch (e) {} }, 2000);

  // 4. Expose helper for dashboard.html
  window.__getCredits = () => INF;
  console.log("%c[lemonade-cracked] inf credits active", "color:#00ffa3");
})();
