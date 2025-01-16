import React, { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";
import TokenDiscovery from "./components/TokenDiscovery";

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-gray-200 dark:bg-gray-800 shadow p-4 flex justify-between items-center">
        <div className="text-lg font-bold">
          <Link to="/" className="hover:text-blue-500">
            NEYXT App
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-neyx-orange transition">
            Home
          </Link>
          <Link to="/token-discovery" className="hover:text-neyx-orange transition">
            Token Discovery
          </Link>
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-700 transition"
          >
            {isDarkMode ? (
              <FaSun className="text-neyx-orange text-2xl" />
            ) : (
              <FaMoon className="text-neyx-orange text-2xl" />
            )}
          </button>
        </div>
      </nav>

      {/* Routes */}
      <main className="flex-grow p-6">
        <Routes>
          <Route
            path="/"
            element={
              <h1 className="text-3xl font-bold text-center">
                Welcome to NEYXT App
              </h1>
            }
          />
          <Route path="/token-discovery" element={<TokenDiscovery />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gray-200 dark:bg-gray-800 text-center p-4">
        <p className="text-sm">© 2025 NEYXT. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;