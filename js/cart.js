/* ============================================================
   NetWebMedia — Shopping Cart (vanilla JS, localStorage)
   Wires: add-to-cart buttons, nav cart badge, cart.html page
   ============================================================ */
(function () {
  const STORAGE_KEY = "nwm-cart";

  // ---- State ----------------------------------------------------
  const readCart = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch (e) { return []; }
  };
  const writeCart = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    renderBadge();
    document.dispatchEvent(new CustomEvent("nwm:cart:change", { detail: items }));
  };

  const addItem = (item) => {
    const cart = readCart();
    // prevent duplicates: same service id + tier
    const key = `${item.id}__${item.tier}`;
    const existingIdx = cart.findIndex(i => `${i.id}__${i.tier}` === key);
    if (existingIdx >= 0) {
      cart[existingIdx].qty = (cart[existingIdx].qty || 1) + 1;
    } else {
      cart.push({ ...item, qty: 1, addedAt: Date.now() });
    }
    writeCart(cart);
    toast(`Added "${item.service} — ${item.tier}" to your cart`);
  };

  const removeItem = (idx) => {
    const cart = readCart();
    cart.splice(idx, 1);
    writeCart(cart);
  };

  const clearCart = () => writeCart([]);

  // ---- Nav badge ------------------------------------------------
  const renderBadge = () => {
    const count = readCart().reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll(".nav-cart-count").forEach(el => {
      el.textContent = count;
      el.classList.toggle("has-items", count > 0);
    });
  };

  // ---- Toast ----------------------------------------------------
  let toastEl = null;
  let toastTimer = null;
  const toast = (msg) => {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "cart-toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  };

  // ---- Wire add-to-cart buttons --------------------------------
  const wireAddButtons = () => {
    document.querySelectorAll(".btn-add-cart").forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const item = {
          id: btn.dataset.serviceId,
          service: btn.dataset.serviceName,
          icon: btn.dataset.icon || "💼",
          tier: btn.dataset.tier,
          price: parseFloat(btn.dataset.price),
          period: btn.dataset.period || "one-time",
        };
        addItem(item);
        const original = btn.textContent;
        btn.classList.add("added");
        btn.textContent = "✓ Added to cart";
        setTimeout(() => {
          btn.classList.remove("added");
          btn.textContent = original;
        }, 1800);
      });
    });
  };

  // ---- cart.html page rendering --------------------------------
  const formatUSD = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const renderCartPage = () => {
    const root = document.getElementById("cart-root");
    if (!root) return;
    const cart = readCart();

    if (cart.length === 0) {
      root.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <h2 style="font-family:var(--font-display);font-size:26px;margin-bottom:8px;">Your cart is empty</h2>
          <p style="margin-bottom:24px;">Browse our services and pick the plan that fits your growth goals.</p>
          <a href="services.html" class="btn-primary">Explore Services →</a>
        </div>`;
      return;
    }

    const monthly = cart
      .filter(i => (i.period || "").toLowerCase().includes("month"))
      .reduce((s, i) => s + i.price * (i.qty || 1), 0);
    const oneTime = cart
      .filter(i => !(i.period || "").toLowerCase().includes("month"))
      .reduce((s, i) => s + i.price * (i.qty || 1), 0);
    const firstMonth = monthly + oneTime;

    const itemsHtml = cart.map((i, idx) => `
      <div class="cart-item">
        <div class="cart-item-icon">${i.icon || "💼"}</div>
        <div>
          <div class="cart-item-title">${i.service}</div>
          <div class="cart-item-tier">${i.tier} plan${i.qty > 1 ? ` · ×${i.qty}` : ""}</div>
        </div>
        <div style="text-align:right;">
          <div class="cart-item-price">${formatUSD(i.price * (i.qty || 1))}</div>
          <span class="cart-item-period">${i.period}</span>
        </div>
        <button class="cart-item-remove" data-remove="${idx}" aria-label="Remove item">✕</button>
      </div>`).join("");

    root.innerHTML = `
      <div class="cart-page-grid">
        <div class="cart-items">${itemsHtml}</div>
        <aside class="cart-summary">
          <h3>Order summary</h3>
          ${monthly > 0 ? `<div class="cart-summary-row"><span>Recurring (monthly)</span><strong>${formatUSD(monthly)}/mo</strong></div>` : ""}
          ${oneTime > 0 ? `<div class="cart-summary-row"><span>One-time fees</span><strong>${formatUSD(oneTime)}</strong></div>` : ""}
          <div class="cart-summary-row total"><span>First-month total</span><strong>${formatUSD(firstMonth)}</strong></div>
          <p style="font-size:12px;color:var(--text-muted);margin:12px 0 22px;line-height:1.55;">
            Prices reflect standard plans. Final quote may adjust based on scope after our free strategy call. No payment collected online — this is a quote request.
          </p>
          <a href="contact.html?source=cart" class="btn-primary" id="checkout-btn" style="display:block;text-align:center;">Request Quote &amp; Start Onboarding →</a>
          <button id="clear-cart" style="margin-top:14px;width:100%;background:transparent;border:1px solid var(--border-glass);color:var(--text-muted);padding:10px;border-radius:9999px;font-size:13px;cursor:pointer;">Clear cart</button>
        </aside>
      </div>`;

    root.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => removeItem(parseInt(btn.dataset.remove, 10)));
    });
    const clearBtn = document.getElementById("clear-cart");
    if (clearBtn) clearBtn.addEventListener("click", () => { if (confirm("Clear all items?")) clearCart(); });

    // pass cart payload to contact form via sessionStorage
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        sessionStorage.setItem("nwm-cart-snapshot", JSON.stringify(cart));
      });
    }
  };

  // ---- contact.html hydration -----------------------------------
  const hydrateContactFromCart = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") !== "cart") return;
    const snapshot = sessionStorage.getItem("nwm-cart-snapshot");
    if (!snapshot) return;
    try {
      const cart = JSON.parse(snapshot);
      if (!cart.length) return;
      const lines = cart.map(i =>
        `• ${i.service} — ${i.tier} plan (${formatUSD(i.price)} ${i.period})`
      ).join("\n");
      const msg = `I'd like a quote for the following services:\n\n${lines}\n\nPlease schedule a strategy call to finalize scope.`;
      const msgField =
        document.querySelector('textarea[name="message"]') ||
        document.querySelector('textarea[id="message"]') ||
        document.querySelector("textarea");
      if (msgField && !msgField.value) msgField.value = msg;
    } catch (e) {}
  };

  // ---- Public API ------------------------------------------------
  window.NWMCart = { readCart, addItem, removeItem, clearCart };

  // ---- Init -----------------------------------------------------
  const init = () => {
    renderBadge();
    wireAddButtons();
    renderCartPage();
    hydrateContactFromCart();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // re-render cart page on cart change (after remove)
  document.addEventListener("nwm:cart:change", renderCartPage);
})();
