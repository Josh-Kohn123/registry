(function () {
  // Don't inject on our own site
  if (window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("your-registry-domain.com")) {
    return;
  }

  let whitelist = [];
  let isWhitelisted = false;

  // ── Scraping ──

  function scrapeProductMeta() {
    const getMeta = (property) => {
      const el =
        document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);
      return el?.getAttribute("content") || null;
    };

    const title =
      getMeta("og:title") ||
      document.title?.replace(/\s*[\|–—]\s*[^|–—]+$/, "").trim() ||
      null;

    const imageUrl = getMeta("og:image") || null;

    const priceStr =
      getMeta("og:price:amount") ||
      getMeta("product:price:amount") ||
      null;
    const estimatedPrice = priceStr ? Math.round(parseFloat(priceStr)) : undefined;

    return {
      url: window.location.href,
      title,
      imageUrl: imageUrl || undefined,
      estimatedPrice: estimatedPrice || undefined,
    };
  }

  // ── Toast ──

  let activeToast = null;

  function showToast(type, message, link) {
    if (activeToast) {
      activeToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = `registry-ext-toast registry-ext-toast--${type}`;

    const icons = { success: "\u2713", error: "!", info: "\u2605", unsupported: "\u2022" };
    toast.innerHTML = `<span>${icons[type] || ""}</span><span>${message}</span>`;

    if (link) {
      const a = document.createElement("a");
      a.className = "registry-ext-toast__link";
      a.textContent = link.text;
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener";
      toast.appendChild(a);
    }

    document.body.appendChild(toast);
    activeToast = toast;

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
      if (activeToast === toast) activeToast = null;
    }, 3000);
  }

  // ── Floating Button ──

  function createButton(whitelisted) {
    const btn = document.createElement("button");
    btn.className = `registry-ext-fab ${
      whitelisted ? "registry-ext-fab--active" : "registry-ext-fab--disabled"
    }`;
    btn.innerHTML = `<span class="registry-ext-fab__icon">+</span> Add to Registry`;
    btn.addEventListener("click", handleClick);
    document.body.appendChild(btn);
    return btn;
  }

  async function handleClick() {
    const auth = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" });
    if (!auth?.token) {
      showToast("error", "Sign in first — click the extension icon in your toolbar.");
      return;
    }

    if (!isWhitelisted) {
      showToast("unsupported", "This store isn't supported yet.", {
        text: "Request it \u2192",
        url: `${getApiBase()}/whitelist-request`,
      });
      return;
    }

    const data = scrapeProductMeta();
    if (!data.title) {
      showToast("error", "Navigate to a product page to add it.");
      return;
    }

    const btn = document.querySelector(".registry-ext-fab");
    if (btn) btn.classList.add("registry-ext-fab--loading");

    const result = await chrome.runtime.sendMessage({
      type: "ADD_PRODUCT",
      data,
    });

    if (btn) btn.classList.remove("registry-ext-fab--loading");

    if (result.success) {
      showToast("success", "Added to registry!");
    } else if (result.error === "duplicate") {
      showToast("info", "Already in your registry.");
    } else if (result.error === "not_authenticated" || result.error === "token_expired") {
      showToast("error", "Sign in again — click the extension icon.");
    } else if (result.error === "offline") {
      showToast("error", "You're offline \u2014 try again later.");
    } else if (result.error === "rate_limited") {
      showToast("error", "Slow down \u2014 try again in a moment.");
    } else {
      showToast("error", "Something went wrong \u2014 try again.");
    }
  }

  function getApiBase() {
    return "http://localhost:3000";
  }

  // ── Domain matching ──

  function isDomainMatch(hostname, whitelistDomain) {
    const clean = hostname.toLowerCase().replace(/^www\./, "");
    return clean === whitelistDomain || clean.endsWith("." + whitelistDomain);
  }

  // ── Init ──

  async function init() {
    whitelist = await chrome.runtime.sendMessage({ type: "GET_WHITELIST" });
    if (!whitelist || !Array.isArray(whitelist)) {
      whitelist = [];
    }

    const hostname = window.location.hostname;
    isWhitelisted = whitelist.some((r) => isDomainMatch(hostname, r.domain));

    if (isWhitelisted) {
      createButton(true);
    } else {
      const hasProductMeta =
        document.querySelector('meta[property="og:price:amount"]') ||
        document.querySelector('meta[property="product:price:amount"]') ||
        document.querySelector('meta[property="og:type"][content="product"]');
      if (hasProductMeta) {
        createButton(false);
      }
    }
  }

  init();
})();
