import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// import logo from "../assets/NEYX_LOGO_TEXT.svg";
import { FaEthereum, FaSpinner } from "react-icons/fa";
// import { TbCircleLetterS } from "react-icons/tb";  // React icon for Sepolia
import { FaSun, FaMoon } from "react-icons/fa";
import { TbPlugConnected } from "react-icons/tb";
import { RiExchangeFundsLine } from "react-icons/ri";
// import neyxtLogo from "../assets/NEYX_White_Transparnt.svg";

// NEYXT token details
// MAINNET
// const NEYXT_TOKEN_ADDRESS = "0x86b8B002ff72Be60C63E9Ae716348EDC1771F52e";
// SEPOLIA
// const NEYXT_TOKEN_ADDRESS = import.meta.env.VITE_NEYXT_TOKEN_ADDRESS;

// const ERC20_ABI = [
//   "function balanceOf(address account) view returns (uint256)",
// ];


// function formatBalance(balance: string | number | bigint): string {
//   const fullTokens = BigInt(balance) / BigInt(1e18); // Convert from Wei to full tokens
//   return new Intl.NumberFormat("en-US").format(fullTokens); // Format with thousands separators
// }

const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const QRCodeClaim: React.FC = () => {

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

  const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || "DEV"; // Default to DEV
  // const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 11155111; // Default to Sepolia
  const EXPECTED_CHAIN_ID = 11155111; // Default to Sepolia

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  // const [neyxtBalance, setNeyxtBalance] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // New loading state
  const [wrongNetwork, setWrongNetwork] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  if (!window.ethereum) throw new Error("MetaMask is not installed. Please install MetaMask.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  // const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);


  const [networkInfo, setNetworkInfo] = useState<{ name?: string; chainId?: number } | null>(null);

  const [showSwitchOverlay, setShowSwitchOverlay] = useState(false);


  const fetchETHBalance = async (inputAddress: string) => {
    const balance = await provider.getBalance(inputAddress);
    return parseFloat(ethers.formatEther(balance)).toFixed(4);
  };

  const FetchWalletBalances = async (inputAddress: string) => {
    setError(null);
    setEthBalance(null);
    setLoading(true); // Start loading

    if (!ethers.isAddress(inputAddress)) {
      setError("Invalid Ethereum address");
      setLoading(false); // Stop loading
      return;
    }

    try {
      // Fetch all data in parallel and set loading to false after all results are fetched
      const eth = await fetchETHBalance(inputAddress);
      setEthBalance(eth);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch balances.");
    }
  };

  //
  // WALLET CONNECTION
  //
  const connectWallet = async () => {

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      setLoading(true);

      // Use ethers.BrowserProvider for signing transactions
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const metamaskSigner = await browserProvider.getSigner()
      // setSigner(metamaskSigner);

      const accounts = await browserProvider.send("eth_requestAccounts", []); // Request accounts
      console.log(`accounts : ${accounts}`);

      console.log(`signer : ${metamaskSigner.address}`);

      let wallet: string | null = null;
      if (accounts.length > 0) {
        wallet = accounts[0]; // Use first connected account
      } else {
        // Request permission if no accounts are connected
        const requestedAccounts = await browserProvider.send("eth_requestAccounts", []);
        wallet = requestedAccounts[0];
      }

      if (!wallet) {
        setError("No account connected.");
        return;
      }
      setWalletAddress(wallet);

      // Get the connected network
      const network = await browserProvider.getNetwork();
      console.log("Connected to network:", network.name, `(Chain ID: ${network.chainId})`);

      // Store network info
      setNetworkInfo({ name: network.name, chainId: Number(network.chainId) });

      // Check if the user is on the correct network
      if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
        setError(`Wrong Network`);
        setWrongNetwork(true);
        return;
      } else {
        setError(null);
        setWrongNetwork(false);
      }

      // Call data with the wallet address
      await FetchWalletBalances(wallet);
      // **Auto-Submit Wallet Address to Netlify Forms**
      submitWalletAddress(metamaskSigner.address);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to connect wallet");
    } finally {
      setLoading(false); // Stop loading after all operations are complete
    }
  };

  // **Submit Wallet Address to Netlify**
  const ENABLE_FORM_SUBMISSION = false;

  const submitWalletAddress = async (address: string) => {

    if (!ENABLE_FORM_SUBMISSION) {
      console.log("⚠️ Form submission is disabled. Wallet address:", address);
      setFormSubmitted(true);
      return; // Exit function early
    }

    const formData = { "form-name": "wallet-signup", walletAddress: address };

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode(formData),
      });
      setFormSubmitted(true);
    } catch (error) {
      console.error("Error submitting wallet address:", error);
    }
  };

  // ✅ Function to encode form data for Netlify
  const encode = (data: { [key: string]: string }) => {
    return Object.keys(data)
      .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
      .join("&");
  };


  //
  // Network change listener
  //
  useEffect(() => {
    if (!window.ethereum) return;

    const handleNetworkChange = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
        const network = await provider.getNetwork();
        console.log("Network changed to:", network.name, `(Chain ID: ${network.chainId})`);
        setNetworkInfo({ name: network.name, chainId: Number(network.chainId) });

        // If the user is on the wrong network, show a warning
        if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
          setError(`Wrong Network`);
          setWrongNetwork(true);
        } else {
          setError(null);
          setWrongNetwork(false);
          // Reload data
          if (walletAddress) {
            await FetchWalletBalances(walletAddress);
          }
        }
      } catch (error) {
        console.error("Error handling network change:", error);
        setError("Failed to update after network change.");
      } finally {
        setLoading(false); // Stop loading after the data has been fetched
      }
    };

    window.ethereum.on("chainChanged", handleNetworkChange);

    return () => {
      window.ethereum?.removeListener("chainChanged", handleNetworkChange);
    };
  }, []);

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ethers.toBeHex(11155111) }], // Sepolia Chain ID
      });
    } catch (error) {
      console.error("Error switching network:", error);
    }
  };

  const requestMoreAccounts = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }

    try {
      console.log("Requesting permission to access multiple accounts...");
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      // Fetch the newly connected accounts
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_accounts", []);

      if (accounts.length > 0) {
        console.log("Connected accounts:", accounts);
        setWalletAddress(accounts[0]); // Set the first account
        if (walletAddress) {
          connectWallet();
        }
      } else {
        console.error("No accounts returned.");
      }
    } catch (err) {
      console.error("Error requesting multiple accounts:", err);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-300">
        Claim Your NFT
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
        Connect your wallet to proceed with the claim.
      </p>

      {/* Wallet Connection Button */}
      <div className="mb-6">
        <button
          onClick={walletAddress ? () => setShowSwitchOverlay(true) : connectWallet}
          disabled={loading}
          className="flex items-center gap-2 bg-neyx-orange text-white py-2 px-4 rounded-md shadow hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <FaSpinner className="animate-spin text-xl" />
          ) : walletAddress ? (
            <>
              {/* "Account" Label */}
              <span className="text-white textlg">Account</span>

              {/* Truncated Wallet Address */}
              <span className="font-medium text-gray-200">{truncateAddress(walletAddress)}</span>

              {/* Exchange Icon for Switching */}
              <RiExchangeFundsLine className="text-white text-xl" title="Switch Account" />
            </>
          ) : (
            <>
              <TbPlugConnected className="text-white text-xl" />
              Connect Wallet
            </>
          )}
        </button>

        {/* Success Message after Form Submission */}
        {formSubmitted && (
          <p className="text-green-500 mt-4">
          ✅ Email Registered! {ENABLE_FORM_SUBMISSION ? "See you soon." : "Kind of..."}
        </p>
        )}

      </div>
      <div className="mt-4 w-full max-w-md space-y-4">
        {ethBalance !== null && (
          <div className="flex items-center bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow">
              <FaEthereum className="text-white text-2xl" />
            </div>

            {/* Text Content */}
            <div className="flex-1 flex justify-between items-center ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">ETH Balance</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-right">
                {ethBalance}
              </p>
            </div>
          </div>
        )}

        {/* Hidden Form for Netlify */}
        <form name="wallet-signup" method="POST" data-netlify="true" hidden>
          <input type="hidden" name="form-name" value="wallet-signup" />
          <input type="text" name="walletAddress" value={walletAddress || ""} readOnly />
        </form>

      </div>
      <div className="w-full max-w-md flex justify-center items-center mt-6 relative">
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

        {/* Sepolia Network Label (Only if Sepolia) - Right Aligned */}
        {networkInfo?.chainId === 11155111 && (
          <span className="absolute right-0 text-gray-500 dark:text-gray-400 text-sm">
            Sepolia Testnet
          </span>
        )}
      </div>

      {/* Account Switch Overlay */}
      {showSwitchOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Change to address selected in MetaMask?
            </p>

            <div className="flex justify-center gap-4 mt-4">
              {/* OK Button (Switch Account) */}
              <button
                onClick={() => {
                  requestMoreAccounts();
                  setShowSwitchOverlay(false);
                }}
                className="bg-neyx-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md shadow transition"
              >
                OK
              </button>

              {/* Cancel Button (Close Overlay) */}
              <button
                onClick={() => setShowSwitchOverlay(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch network */}
      {/* {error && (
        <div className="bg-red-200 text-red-800 p-3 rounded-md text-center">
          <p>{error}</p>
          <p>Expected Network: <strong>{ENVIRONMENT === "PROD" ? "Mainnet" : "Sepolia"}</strong></p>
          <button
            onClick={switchNetwork}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md mt-2"
          >
            Switch to {ENVIRONMENT === "PROD" ? "Mainnet" : "Sepolia"}
          </button>
        </div>
      )} */}

      {/* Switch network to Sepolia*/}
      {wrongNetwork && (
        <div className="bg-red-200 text-red-800 p-3 rounded-md text-center">
          <p>{error}</p>
          <p>Expected Network: <strong>{ENVIRONMENT === "PROD" ? "Mainnet" : "Sepolia"}</strong></p>
          <button
            onClick={switchNetwork}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md mt-2"
          >
            Switch to {ENVIRONMENT === "PROD" ? "Mainnet" : "Sepolia"}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>

  );
};

export default QRCodeClaim;