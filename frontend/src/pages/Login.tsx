import React, { useContext, useState } from "react";
import type { JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

export default function Login(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://api.bestshop.fh/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setError(txt || "Invalid email or password");
        setLoading(false);
        return;
      }

      // parse returned user and persist
      const rawUser = await res.json(); // { id, name, email, is_admin }
      const mapped = {
        id: rawUser.id,
        name: rawUser.name,
        email: rawUser.email,
        isAdmin: rawUser.is_admin === 1 || rawUser.is_admin === true,
      };
      setUser(mapped);
      navigate("/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left - Visual */}
        <div className="hidden md:flex flex-col items-start justify-center p-12 bg-gradient-to-b from-indigo-600 to-indigo-500 text-white gap-6">
          <div className="rounded-lg bg-white/10 px-3 py-1 text-sm font-semibold">Welcome back</div>
          <h2 className="text-3xl font-extrabold leading-tight">Sign in to continue</h2>
          <p className="text-indigo-100 max-w-xs">
            Access your account to view orders, manage favorites, and get personalized recommendations.
          </p>

          <div className="mt-4 w-full">
            <img
              src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=60"
              alt="shopping illustration"
              className="w-full rounded-xl object-cover shadow-lg"
            />
          </div>
        </div>

        {/* Right - Form */}
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-80">
                <path d="M12 2L15 8l6 .5-4.5 3.5L18 20l-6-4.5L6 20l1.5-8L3 8.5 9 8 12 2z" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Secure checkout
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </label>

            <label className="block relative">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-10 text-sm text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </label>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                Remember me
              </label>
              <a href="#" className="text-sm text-indigo-600 hover:underline">Forgot password?</a>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-lg shadow"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account? <a href="/register" className="text-indigo-600 font-semibold hover:underline">Create one</a>
          </p>
        </div>
      </div>
    </div>
  );
}
