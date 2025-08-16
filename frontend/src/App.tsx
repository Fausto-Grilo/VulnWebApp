import React, { createContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

export type User = { id: number; name: string; email: string; isAdmin?: boolean } | null;

export const AuthContext = createContext<{
  user: User;
  setUser: (u: User) => void;
}>( {
  user: null,
  setUser: () => {},
});

function App() {
  const [user, setUser] = useState<User>(() => {
    try {
      const raw = localStorage.getItem("user_v1");
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  });

  // persist user to localStorage whenever it changes
  useEffect(() => {
    try {
      if (user) localStorage.setItem("user_v1", JSON.stringify(user));
      else localStorage.removeItem("user_v1");
    } catch {
      // ignore
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* protect dashboard route: only accessible to admin users */}
            <Route
              path="/dashboard"
              element={user && user.isAdmin ? <Dashboard /> : <Navigate to="/" replace />}
            />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;