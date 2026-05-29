"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("deaddrop_token", data.accessToken);
      localStorage.setItem("deaddrop_refresh", data.refreshToken);
      localStorage.setItem("deaddrop_user", JSON.stringify(data.user));
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-void-950 px-4">
      {/* ThemeToggle OUTSIDE the form, fixed top-right */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display tracking-widest uppercase text-gray-900 dark:text-white">
            Login
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-2">
            Welcome back to DeadDrop
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-mono text-gray-400 dark:text-white/30 tracking-widest uppercase">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl px-5 py-3 text-sm text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/15 focus:outline-none focus:border-accent/40 transition-colors font-mono"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-gray-400 dark:text-white/30 tracking-widest uppercase">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl px-5 py-3 text-sm text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/15 focus:outline-none focus:border-accent/40 transition-colors font-mono"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 dark:bg-accent/10 bg-accent/5 dark:border-accent/30 border-accent/40 text-accent rounded-xl text-sm font-mono tracking-wider dark:hover:bg-accent/20 hover:bg-accent/15 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
          <ArrowRight size={16} />
        </button>

        <p className="text-center text-xs text-gray-400 dark:text-white/30">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-accent/60 hover:text-accent transition-colors">
            Register
          </a>
        </p>
      </form>
    </main>
  );
}