import React, { useState } from "react";
import type { JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";

export default function Register(): JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill out all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://api.bestshop.fh/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setError(txt || "Registration failed");
        return;
      }

      setSuccess("Account created. Redirecting to sign in...");
      // clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirm("");

      // short delay so user sees success message, then navigate to login
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left - Illustration / benefits */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-b from-rose-600 to-pink-500 text-white gap-6">
          <div className="rounded-lg bg-white/10 px-3 py-1 text-sm font-semibold">Create account</div>
          <h2 className="text-3xl font-extrabold leading-tight">Join the community</h2>
          <p className="text-rose-100 max-w-xs">
            Create an account to save favorites, track orders and checkout faster.
          </p>

          <div className="mt-4 w-full">
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=60"
              alt="join illustration"
              className="w-full rounded-xl object-cover shadow-lg"
            />
          </div>
        </div>

        {/* Right - Form */}
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
              <p className="mt-1 text-sm text-slate-500">Quick and secure signup</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-80">
                <path d="M12 2L15 8l6 .5-4.5 3.5L18 20l-6-4.5L6 20l1.5-8L3 8.5 9 8 12 2z" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Secure signup
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block relative">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300 pr-10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Confirm password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                Subscribe to newsletter
              </label>

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-sm text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-emerald-600">{success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold px-4 py-3 rounded-lg shadow"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <div className="text-sm text-slate-400">Already have an account? <a href="/login" className="text-pink-600 font-semibold hover:underline">Sign in</a></div>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            By creating an account you agree to our <a href="#" className="text-pink-600 font-semibold hover:underline">Terms</a>.
          </p>
        </div>
      </div>
    </div>
  );
}