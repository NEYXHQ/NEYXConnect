import React, { useState, useEffect } from "react";
import { Routes, Route/*, Link*/ } from "react-router-dom";
import TokenDiscovery from "./components/TokenDiscovery";
import QRCodeClaim from "./components/QRCodeClaim";
import NFTFounder from "./components/connectWallet";
import ErrorBoundary from "./components/ErrorBoundary";
// import logo from "./assets/NEYX_LOGO_TEXT.svg";
import { FaSun, FaMoon } from "react-icons/fa";
import DeepLinker from "./components/DeepLinker";
import { FaChrome, FaEthereum } from "react-icons/fa";
import { FaBrave } from "react-icons/fa6";

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
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-300">
              MetaMask is not installed.
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
              To interact with this app, you need a Web3-enabled browser.
            </p>
            <div className="flex flex-col gap-4">
              <a
                href="https://brave.com/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition"
              >
                <FaBrave className="mr-2 text-xl" /> Download Brave
              </a>
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
              >
                <FaChrome className="mr-2 text-xl" /> Download Chrome
              </a>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition"
              >
                <FaEthereum className="mr-2 text-xl" /> Install MetaMask
              </a>
            </div>
            {/* Dark Mode Toggle Button (Centered) */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-700 transition"
            >
              {isDarkMode ? (
                <FaSun className="text-neyx-orange text-xl" />
              ) : (
                <FaMoon className="text-neyx-orange text-xl" />
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
          <Route path="/nftfounder" element={<NFTFounder />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
};

export default App;