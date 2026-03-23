const API_BASE = "http://localhost:3000"; // TODO: change to production URL

// ── State helpers ──

async function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

async function setStorage(data) {
  return chrome.storage.local.set(data);
}

// ── Whitelist ──

async function fetchWhitelist() {
  try {
    const res = await fetch(`${API_BASE}/api/extension/whitelist`);
    if (!res.ok) return;
    const { domains } = await res.json();
    await setStorage({ whitelist: domains, whitelistFetchedAt: Date.now() });
  } catch (e) {
    console.error("Failed to fetch whitelist:", e);
  }
}

async function getWhitelist() {
  const { whitelist, whitelistFetchedAt } = await getStorage([
    "whitelist",
    "whitelistFetchedAt",
  ]);
  const stale = !whitelistFetchedAt || Date.now() - whitelistFetchedAt > 86400000;
  if (stale) {
    fetchWhitelist();
  }
  return whitelist || [];
}

// ── Auth ──

async function getAuthState() {
  const { token, eventId, eventTitle, productCount } = await getStorage([
    "token",
    "eventId",
    "eventTitle",
    "productCount",
  ]);
  return { token, eventId, eventTitle, productCount };
}

async function signOut() {
  await chrome.storage.local.remove([
    "token",
    "eventId",
    "eventTitle",
    "productCount",
    "recentAdditions",
  ]);
}

// ── API calls ──

async function addProduct(data) {
  const { token } = await getAuthState();
  if (!token) {
    return { error: "not_authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/extension/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.status === 401) {
      await signOut();
      return { error: "token_expired" };
    }
    if (res.status === 409) {
      return { error: "duplicate" };
    }
    if (res.status === 403) {
      return { error: "not_whitelisted" };
    }
    if (res.status === 429) {
      return { error: "rate_limited" };
    }
    if (!res.ok) {
      return { error: "server_error" };
    }

    const product = await res.json();

    const { recentAdditions = [] } = await getStorage(["recentAdditions"]);
    recentAdditions.unshift({
      ...product,
      addedAt: Date.now(),
    });
    await setStorage({
      recentAdditions: recentAdditions.slice(0, 20),
    });

    return { success: true, product };
  } catch (e) {
    if (!navigator.onLine) {
      return { error: "offline" };
    }
    return { error: "network_error" };
  }
}

// ── Message handling ──

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_WHITELIST") {
    getWhitelist().then(sendResponse);
    return true;
  }

  if (message.type === "GET_AUTH_STATE") {
    getAuthState().then(sendResponse);
    return true;
  }

  if (message.type === "ADD_PRODUCT") {
    addProduct(message.data).then(sendResponse);
    return true;
  }

  if (message.type === "SIGN_OUT") {
    signOut().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === "GET_RECENT_ADDITIONS") {
    getStorage(["recentAdditions"]).then(({ recentAdditions = [] }) => {
      sendResponse(recentAdditions);
    });
    return true;
  }
});

// ── Install / startup ──

chrome.runtime.onInstalled.addListener(() => {
  fetchWhitelist();
});
