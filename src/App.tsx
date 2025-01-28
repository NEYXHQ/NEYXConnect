import React, { useState, useEffect } from "react";
import TokenDiscovery from "./components/TokenDiscovery";
import ErrorBoundary from "./components/ErrorBoundary";
import logo from "./assets/NEYX_LOGO_TEXT.svg";
import { FaSun, FaMoon } from "react-icons/fa";

const App: React.FC = () => {
  // State to manage dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Default to dark mode
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true; // Default to dark mode if no saved preference
  });

  // Apply dark mode class to the <html> element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Toggle Dark Mode Function
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-6">
      {/* Error Boundary for the App */}
      <ErrorBoundary
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen">
            {/* Display Logo */}
            <img src={logo} alt="NEYX Logo" className="w-40 mb-4" />

            {/* Friendly Fallback Message */}
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-300">
              Something went wrong.
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6 text-center">
              Please try refreshing the page or check if your browser supports all required features.
            </p>

            {/* Dark Mode Toggle Button in Fallback UI */}
            <div className="flex justify-center">
              <button
                onClick={toggleDarkMode}
                className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? (
                  <FaSun className="text-yellow-500 text-lg" />
                ) : (
                  <FaMoon className="text-blue-500 text-lg" />
                )}
              </button>
            </div>
          </div>
        }
      >
        {/* Main Content */}
        <div className="flex-grow w-full">
          <TokenDiscovery />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default App;