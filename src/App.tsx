import React, { useState, useEffect } from "react";
import { Routes, Route/*, Link*/ } from "react-router-dom";
import TokenDiscovery from "./components/TokenDiscovery";
import QRCodeClaim from "./components/QRCodeClaim"; 
import Claim from "./components/connectWallet"; 
import ErrorBoundary from "./components/ErrorBoundary";
import logo from "./assets/NEYX_LOGO_TEXT.svg";
import { FaSun, FaMoon } from "react-icons/fa";
import DeepLinker from "./components/DeepLinker";

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true;
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

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-6">
      {/* Error Boundary */}
      <ErrorBoundary
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen">
            <img src={logo} alt="NEYX Logo" className="w-40 mb-4" />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-300">
              Something went wrong.
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6 text-center">
              Please try refreshing the page or check if your browser supports all required features.
            </p>
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
        }
      >
        {/* Navigation Menu */}
        {/* <nav className="w-full max-w-md flex justify-between mb-6">
          <Link to="/" className="text-neyx-orange hover:underline font-semibold">
            Token Discovery
          </Link>
          <Link to="/qr-claim" className="text-neyx-orange hover:underline font-semibold">
            QR Code Claim
          </Link>
        </nav> */}

        {/* Route Definitions */}
        <Routes>
          <Route path="/" element={<TokenDiscovery />} />
          <Route path="/qr-claim" element={<QRCodeClaim />} />
          <Route path="/deeplinker" element={<DeepLinker />} />
          <Route path="/claim" element={<Claim />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
};

export default App;