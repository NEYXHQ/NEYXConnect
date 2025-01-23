import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

import logo from "../assets/NEYX_LOGO_TEXT.svg";
import { TbHexagonLetterG, TbPlugConnected } from "react-icons/tb";
import { FaEthereum, FaSpinner } from "react-icons/fa";
import { PiPlugsConnectedDuotone } from "react-icons/pi";
import { FaSun, FaMoon } from "react-icons/fa";
// import { IoIosArrowBack } from "react-icons/io";
import neyxtLogo from "../assets/NEYX_White_Transparnt.svg";

// Hardcoded genesis addresses
const genesisAddresses = new Set<string>([
  "0x1134Bb07cb7F35946E7e02f58cA7fcC64698B59b",
  "0x99Bb88cbC2A1D0B12f3BA63Cd51aC919B7601179",
  "0x82c5e1812079FE89bD8240c924592a1DC13BAd18",
  "0x90730d044Ccd332f5a23844F7E219d2CF0AC467C",
  "0x89691BaF004bf4A7D9Ce265d47903D3595996Ad7",
  "0x7Abb72de1cea2C7319338417537f23977dE9c111",
  "0x33D05F773131Acc38A605506953cE8c1b4580AC0",
  "0x739D97D7862062B6d14d9998c9513f7922d22A45",
  "0x68eEB5992bDBf53Ead548E80E59cFCb26bEca892",
  "0x9B273a89fe6EE30bD568856A169895C4E1e264d1",
  "0x8F13AF490425D40cA3179E4fa5D6847FcCCd85d6",
  "0x76E871415906652F268Ae45348564bB0194a65Ee",
  "0xe8c5E2dd21aaEc34575C2b5FF23708E2616AECd7",
  "0x4bf431e37539B8528f176B46CFd627699861df58",
]);

// NEYXT token details
const NEYXT_TOKEN_ADDRESS = "0x86b8B002ff72Be60C63E9Ae716348EDC1771F52e";
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
];

const TokenDiscovery: React.FC = () => {

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Apply dark mode by default
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

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isGenesis, setIsGenesis] = useState<boolean | null>(null);
  const [neyxtBalance, setNeyxtBalance] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // New loading state

  const INFURA_API_KEY = import.meta.env.VITE_INFURA_API_KEY;
  const NETWORK = "mainnet"; // or "goerli" for testnet
  const provider = new ethers.JsonRpcProvider(`https://${NETWORK}.infura.io/v3/${INFURA_API_KEY}`);

  const checkGenesis = (inputAddress: string) => genesisAddresses.has(inputAddress);

  const fetchNEYXTBalance = async (inputAddress: string) => {
    const contract = new ethers.Contract(NEYXT_TOKEN_ADDRESS, ERC20_ABI, provider);
    const balance = await contract.balanceOf(inputAddress);
    return new Intl.NumberFormat("en-US").format(
      parseInt(ethers.formatUnits(balance, 18), 10)
    );
  };

  const fetchETHBalance = async (inputAddress: string) => {
    const balance = await provider.getBalance(inputAddress);
    return parseFloat(ethers.formatEther(balance)).toFixed(4);
  };

  const handleCheck = async (inputAddress: string) => {
    setError(null);
    setIsGenesis(null);
    setNeyxtBalance(null);
    setEthBalance(null);
    setLoading(true); // Start loading
  
    if (!ethers.isAddress(inputAddress)) {
      setError("Invalid Ethereum address");
      setLoading(false); // Stop loading
      return;
    }
  
    try {
      // Fetch all data in parallel and set loading to false after all results are fetched
      const [neyxt, eth, isGenesis] = await Promise.all([
        fetchNEYXTBalance(inputAddress),
        fetchETHBalance(inputAddress),
        Promise.resolve(checkGenesis(inputAddress)), // Wrap synchronous call in a promise for consistency
      ]);
  
      setNeyxtBalance(neyxt);
      setEthBalance(eth);
      setIsGenesis(isGenesis);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch balances.");
    } finally {
      setLoading(false); // Stop loading only after all results are ready
    }
  };

  // Helper function to truncate wallet address
  const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const connectWallet = async () => {
    if (walletAddress) {
      // Disconnect wallet
      setWalletAddress(null);
      
      setNeyxtBalance(null);
      setEthBalance(null);
      setIsGenesis(null);
      setError(null);
      return;
    }
  
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
  
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const wallet = accounts[0];
      setWalletAddress(wallet);

  
      // Call handleCheck with the wallet address
      handleCheck(wallet);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to connect wallet");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-6">
      {/* Back Button */}
      {/* <div className="w-full flex justify-start mb-4">
        <button
          onClick={() => window.history.back()} // Navigate to the previous page
          className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full transition shadow"
        >
          <IoIosArrowBack className="text-2xl" />
        </button>
      </div> */}
      {/* Header */}
      <div className="mb-8 w-full max-w-md text-center">
        <a href="https://neyx.io" target="_blank" rel="noopener noreferrer">
          <img
            src={logo}
            alt="NEYXT Logo "
            className="w-full max-w-md mx-auto"
          />
        </a>
        <h1 className="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-300">
          Token Discovery
        </h1>
      </div>

      {/* Wallet Connection Button */}
      <div className="mb-6">
        <button
          onClick={connectWallet}
          disabled={loading}
          className="flex items-center gap-2 bg-neyx-orange text-white py-2 px-4 rounded-md shadow hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <FaSpinner className="animate-spin text-xl" />
          ) : walletAddress ? (
            <>
              <PiPlugsConnectedDuotone className="text-white text-xl" />
              {truncateAddress(walletAddress)}
            </>
          ) : (
            <>
              <TbPlugConnected className="text-white text-xl" />
              Connect Wallet
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      <div className="mt-8 w-full max-w-md space-y-4">
        {error && <p className="text-red-500 text-center">{error}</p>}

        {isGenesis !== null && (
          <div className="flex gap-4 items-stretch ">
            <div
              className={`flex justify-center items-center w-20 rounded-lg shadow ${isGenesis ? "bg-neyx-orange dark:bg-neyx-orange" : "bg-gray-200 dark:bg-gray-600"
                }`}
            >
              <TbHexagonLetterG className={`text-3xl ${isGenesis ? "text-white" : "text-neyx-orange"}`} />
            </div>
            <div className={`flex-grow p-4 rounded-lg shadow ${isGenesis ? "bg-neyx-orange" : "bg-gray-200 dark:bg-gray-800"}`}>
              <p className={isGenesis ? "text-white" : ""}>
                <strong>Genesis Address:</strong> {isGenesis ? "Yes" : "No"}
              </p>
            </div>
          </div>
        )}

        {neyxtBalance !== null && (
          <div className="flex gap-4 items-stretch ">
            <div className="flex justify-center items-center w-20 rounded-lg shadow bg-neyx-orange dark:bg-neyx-orange">
              <img src={neyxtLogo} alt="NEYXT Logo" className="w-8 h-8" />
            </div>
            <div className="flex-grow p-4 rounded-lg shadow bg-gray-200 dark:bg-gray-800">
              <p>
                <strong>NEYXT Balance:</strong> <span className="text-neyx-orange">{neyxtBalance}</span>
              </p>
            </div>
          </div>
        )}

        {ethBalance !== null && (
          <div className="flex gap-4 items-stretch ">
            <div className="flex justify-center items-center w-20 rounded-lg shadow bg-blue-500">
              <FaEthereum className="text-white text-3xl" />
            </div>
            <div className="flex-grow p-4 rounded-lg shadow bg-gray-200 dark:bg-gray-800">
              <p>
                <strong>ETH Balance:</strong> {ethBalance}
              </p>
            </div>
          </div>
        )}
      </div>

         {/* Dark Mode Toggle Button */}
         <br></br>
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
  );
};

export default TokenDiscovery;