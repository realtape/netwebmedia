---
name: reference_homepage_react_dashboard
description: Homepage unpkg React UMDs are NOT dead code — js/aeo-dashboard.js is a real React app powering the AEO Pulse hero
metadata: 
  node_type: memory
  type: reference
  originSessionId: fc56ecde-f921-4b0f-8719-fe48d7858325
---

The two `unpkg.com/react@18.3.1` + `react-dom` `<script>` tags in root [index.html](../../../Desktop/NetWebMedia/index.html) (~line 929) are **live dependencies, not dead code**. `js/aeo-dashboard.js` is a full React app (`React.createElement` aliased to `h`, `useState`/`useEffect`/`useRef`, `ReactDOM` mounting into `#dashboard-root`) that renders the homepage "AEO Pulse" hero dashboard, and it checks for `window.React`/`window.ReactDOM` before mounting.

**Why:** A 2026-05-29 audit agent grepped only the inline `index.html`, found no `createRoot`/`createElement`, and concluded the React UMDs were ~140KB of dead JS to delete — a false positive. The actual consumer is the *external* `js/aeo-dashboard.js`. Deleting the script tags would break the homepage hero.

**How to apply:** Do NOT remove the unpkg React/ReactDOM tags or scope `unpkg.com` out of the CSP `script-src` without first checking `js/aeo-dashboard.js` (and `/community-alert-app/` Leaflet, `/livery-editor/` Fabric). The legit improvement is self-hosting these libs at `/vendor/*` (a real TODO noted in [.htaccess](../../../Desktop/NetWebMedia/.htaccess) CSP comment), not deletion.
