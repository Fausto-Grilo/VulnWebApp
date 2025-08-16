import React, { useContext } from "react";
import type { JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

export default function Profile(): JSX.Element {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return <div />;
  }

  function handleLogout() {
    setUser(null);
    try { localStorage.removeItem("user_v1"); } catch {}
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
              {user.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{user.name}</h1>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <div className="ml-auto">
              <button onClick={handleLogout} className="px-3 py-2 bg-red-50 text-red-700 rounded">Logout</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h3 className="text-sm text-slate-600">Account</h3>
              <div className="mt-2 text-sm">Name: <span className="font-medium">{user.name}</span></div>
              <div className="mt-1 text-sm">Email: <span className="font-medium">{user.email}</span></div>
            </div>

            <div className="p-4 border rounded">
              <h3 className="text-sm text-slate-600">Recent orders</h3>
              <div className="mt-2 text-sm text-slate-500">Order history is recorded server-side and not fetched in this demo.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}