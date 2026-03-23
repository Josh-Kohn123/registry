const API_BASE = "http://localhost:3000"; // TODO: change to production URL

document.addEventListener("DOMContentLoaded", async () => {
  const auth = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" });

  if (auth?.token) {
    showSignedIn(auth);
  } else {
    showSignedOut();
  }
});

function showSignedIn(auth) {
  document.getElementById("signed-in").style.display = "block";
  document.getElementById("signed-out").style.display = "none";

  const title = auth.eventTitle || "My Registry";
  document.getElementById("event-title").textContent = title;
  document.getElementById("event-meta").textContent =
    `${auth.productCount ?? "—"} products`;
  document.getElementById("avatar").textContent =
    title.charAt(0).toUpperCase();
  document.getElementById("dashboard-link").href = API_BASE;

  loadRecentAdditions();

  document.getElementById("sign-out-btn").addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "SIGN_OUT" });
    showSignedOut();
  }, { once: true });
}

function showSignedOut() {
  document.getElementById("signed-in").style.display = "none";
  document.getElementById("signed-out").style.display = "block";

  document.getElementById("sign-in-btn").addEventListener("click", () => {
    // Prevent double-click
    document.getElementById("sign-in-btn").disabled = true;
    const redirectUri = chrome.identity.getRedirectURL("callback");
    const authUrl =
      `${API_BASE}/en/auth/extension?redirect_uri=${encodeURIComponent(redirectUri)}`;

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          console.error("Auth failed:", chrome.runtime.lastError);
          return;
        }

        const url = new URL(responseUrl);
        const token = url.searchParams.get("token");
        const eventId = url.searchParams.get("event_id");
        const eventTitle = url.searchParams.get("event_title");
        const productCount = parseInt(url.searchParams.get("product_count") || "0", 10);

        if (token) {
          chrome.storage.local.set(
            { token, eventId, eventTitle, productCount },
            () => {
              showSignedIn({ token, eventId, eventTitle, productCount });
            }
          );
        }
      }
    );
  });
}

async function loadRecentAdditions() {
  const items = await chrome.runtime.sendMessage({ type: "GET_RECENT_ADDITIONS" });
  const container = document.getElementById("recent-list");

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty-state">No products added yet.</div>';
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const timeAgo = formatTimeAgo(item.addedAt);
      const thumb = item.imageUrl
        ? `<img class="recent-thumb" src="${escapeHtml(item.imageUrl)}" alt="">`
        : '<div class="recent-thumb"></div>';
      const price = item.estimatedPrice ? ` · ₪${item.estimatedPrice}` : "";

      return `
        <div class="recent-item">
          ${thumb}
          <div class="recent-info">
            <div class="recent-title">${escapeHtml(item.title)}</div>
            <div class="recent-detail">${escapeHtml(item.retailerDomain)}${price}</div>
          </div>
          <div class="recent-time">${timeAgo}</div>
        </div>
      `;
    })
    .join("");
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
