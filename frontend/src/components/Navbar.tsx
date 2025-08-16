import React, { useContext, type JSX } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

export default function Navbar(): JSX.Element {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  function handleLogout() {
    setUser(null);
    try {
      localStorage.removeItem("user_v1");
    } catch {}
    navigate("/");
  }

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-indigo-600">Best Shop</Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-slate-600 hover:text-indigo-600">Home</Link>

          {user ? (
            <>
            {user.isAdmin && (
              <Link to="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">Dashboard</Link>
            )}
              <Link to="/profile" className="text-sm text-slate-600 hover:text-indigo-600 flex items-center gap-2">
                <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-1 text-xs font-medium">
                  {user.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-600 hover:text-indigo-600">Login</Link>
              <Link to="/register" className="text-sm text-slate-600 hover:text-indigo-600">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
