"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function ExtensionAuthClient({
  redirectUri,
}: {
  redirectUri: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Reload the page — server component will now see the session and redirect
    window.location.reload();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#111",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        width: 360,
        padding: 32,
        background: "#1a1a1a",
        borderRadius: 12,
        border: "1px solid #333",
      }}>
        <h1 style={{ color: "#e5e5e5", fontSize: 20, marginBottom: 8 }}>
          Connect Chrome Extension
        </h1>
        <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>
          Sign in to link the extension to your registry.
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 12,
              background: "#222",
              border: "1px solid #444",
              borderRadius: 8,
              color: "#e5e5e5",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 16,
              background: "#222",
              border: "1px solid #444",
              borderRadius: 8,
              color: "#e5e5e5",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 24px",
              background: loading ? "#555" : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in & Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
