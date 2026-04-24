/**
 * Lightweight imperative toast — no React context required.
 * Works in any "use client" component.
 */
export function showToast(message: string, type: "info" | "success" | "error" = "info") {
  if (typeof document === "undefined") return;

  // Remove any existing toast
  const existing = document.getElementById("nwm-toast");
  if (existing) existing.remove();

  const colors: Record<string, string> = {
    info:    "background:#6c5ce7;color:#fff",
    success: "background:#00b894;color:#fff",
    error:   "background:#e17055;color:#fff",
  };

  const el = document.createElement("div");
  el.id = "nwm-toast";
  el.style.cssText = [
    "position:fixed",
    "bottom:28px",
    "right:28px",
    "z-index:99999",
    "padding:12px 20px",
    "border-radius:10px",
    "font-size:13px",
    "font-weight:600",
    "font-family:Inter,sans-serif",
    "box-shadow:0 8px 32px rgba(0,0,0,.35)",
    "pointer-events:none",
    "opacity:0",
    "transform:translateY(12px)",
    "transition:opacity .2s ease,transform .2s ease",
    "max-width:340px",
    "line-height:1.4",
    colors[type],
  ].join(";");

  el.textContent = message;
  document.body.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });

  // Animate out and remove
  const timer = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    setTimeout(() => el.remove(), 220);
  }, 3000);

  // Allow early dismiss on click
  el.style.pointerEvents = "auto";
  el.style.cursor = "pointer";
  el.onclick = () => { clearTimeout(timer); el.remove(); };
}
