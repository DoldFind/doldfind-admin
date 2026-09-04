"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlaceForm } from "@/components/PlaceForm";

interface SessionInfo {
  username: string;
  badge: string;
}

export default function Home() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Login inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Fetch session status on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setSession(result.data);
          }
        }
      } catch (err) {
        console.error("Session verification failed:", err);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Fetch active session status after login success
        const sessRes = await fetch("/api/auth/session");
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          setSession(sessData.data);
        }
      } else {
        setLoginError(data.error?.message || "Invalid username or password.");
      }
    } catch {
      setLoginError("Failed to connect to authentication server. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout submission
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession(null);
      setUsername("");
      setPassword("");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  // 1. Initial Checking Session Loading View
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Unauthenticated Login Screen View
  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0e0e0e] px-4">
        <div className="w-full max-w-sm border border-white/10 rounded-xl p-6 bg-[#0e0e0e] flex flex-col gap-6">
          <div className="text-center">
            <span className="font-bold tracking-tight text-lg text-white">
              DoldFind
            </span>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {loginError && (
              <div className="border border-red-500/40 bg-red-950/20 rounded-lg p-2.5 text-xs text-red-400">
                {loginError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-neutral-400 select-none">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-neutral-400 select-none">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 w-full py-2 text-xs font-semibold text-black rounded-lg bg-white hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {loginLoading ? "Authenticating..." : "Log In"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 3. Authenticated Contributor Dashboard View
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#0e0e0e] text-white">
      {/* Header Navigation */}
      <header className="border-b border-white/10 bg-[#0e0e0e]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-sm tracking-tight text-white">
              DoldFind
            </Link>

            {/* Main Tabs */}
            <nav className="hidden md:flex items-center gap-5 text-xs">
              <Link href="/" className="text-white border-b border-white pb-0.5 font-medium">
                Contribute
              </Link>
              <Link href="/places" className="text-neutral-400 hover:text-white transition">
                Places
              </Link>
            </nav>
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-400">{session.username}</span>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="border border-white/15 text-neutral-300 hover:text-white hover:bg-white/5 py-1 px-2.5 rounded text-xs transition disabled:opacity-50"
            >
              {logoutLoading ? "..." : "Log Out"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation sub-bar */}
        <div className="md:hidden border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-6 h-9 text-xs">
            <Link href="/" className="text-white border-b border-white">
              Contribute
            </Link>
            <Link href="/places" className="text-neutral-400 hover:text-white transition">
              Places
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Contribute Spot
          </h1>
        </div>

        {/* Form Orchestrator */}
        <PlaceForm />
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-white/10 py-5 mt-12 text-center text-xs text-neutral-600">
        &copy; {new Date().getFullYear()} DoldFind
      </footer>
    </main>
  );
}
