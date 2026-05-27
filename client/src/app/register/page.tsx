"use client";
 
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
 
export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
 
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
 
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
 
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
 
      // Auto-login after registration
      localStorage.setItem("deaddrop_token", data.accessToken);
      localStorage.setItem("deaddrop_refresh", data.refreshToken);
      localStorage.setItem("deaddrop_user", JSON.stringify(data.user));
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <main className="min-h-screen flex items-center justify-center bg-void-950 px-4">
      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display tracking-widest uppercase text-white">
            Register
          </h1>
          <p className="text-sm text-white/40 mt-2">
            Create your DeadDrop account
          </p>
        </div>
 
        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}
 
        <div className="space-y-2">
          <label className="text-xs font-mono text-white/30 tracking-widest uppercase">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-3 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-accent/40 transition-colors font-mono"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-white/30 tracking-widest uppercase">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-3 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-accent/40 transition-colors font-mono"
            required
          />
        </div>
 
        <div className="space-y-2">
          <label className="text-xs font-mono text-white/30 tracking-widest uppercase">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-3 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-accent/40 transition-colors font-mono"
            required
          />
          <PasswordStrengthMeter password={password} />
        </div>
 
        <div className="space-y-2">
          <label className="text-xs font-mono text-white/30 tracking-widest uppercase">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-3 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-accent/40 transition-colors font-mono"
            required
          />
        </div>
 
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent/10 border border-accent/30 text-accent rounded-xl text-sm font-mono tracking-wider hover:bg-accent/20 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
          <ArrowRight size={16} />
        </button>
 
        <p className="text-center text-xs text-white/30">
          Already have an account?{" "}
          <a href="/login" className="text-accent/60 hover:text-accent transition-colors">
            Sign In
          </a>
        </p>
      </form>
    </main>
  );
}