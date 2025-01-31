import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

import logo from "../assets/NEYX_LOGO_TEXT.svg";
import { FaEthereum, FaSpinner } from "react-icons/fa";
// import { TbCircleLetterS } from "react-icons/tb";  // React icon for Sepolia
import { FaSun, FaMoon } from "react-icons/fa";
import { TbPlugConnected } from "react-icons/tb";
import { RiExchangeFundsLine } from "react-icons/ri";
import neyxtLogo from "../assets/NEYX_White_Transparnt.svg";

// NEYXT token details
// MAINNET
// const NEYXT_TOKEN_ADDRESS = "0x86b8B002ff72Be60C63E9Ae716348EDC1771F52e";
// SEPOLIA
const NEYXT_TOKEN_ADDRESS = import.meta.env.VITE_NEYXT_TOKEN_ADDRESS;

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
];

const VESTING_WALLET_ABI = [
  "function owner() view returns (address)",
  "function releasable(address token) view returns (uint256)", // Releasable ERC-20 tokens
  "function vestedAmount(address token, uint64 timestamp) view returns (uint256)", // Vested ERC-20 tokens
  "function release(address token)",
  "function balance() view returns (uint256)",
  "function released(address token) view returns (uint256)",
  "function duration() view returns (uint64)",
  "function start() view returns (uint64)",
];

// Beneficiary-to-Vesting-Wallet Mapping - for SEPOLIA
const vestingMapping: { [beneficiaryAddress: string]: string } = (() => {
  try {
    const encoded = import.meta.env.VITE_VESTING_MAPPING || "";
    const decoded = atob(encoded); // Decode Base64
    return JSON.parse(decoded); // Parse JSON
  } catch (error) {
    console.error("Error decoding VITE_VESTING_MAPPING:", error);
    return {};
  }
})();

function formatBalance(balance: string | number | bigint): string {
  const fullTokens = BigInt(balance) / BigInt(1e18); // Convert from Wei to full tokens
  return new Intl.NumberFormat("en-US").format(fullTokens); // Format with thousands separators
}

const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const TokenDiscovery: React.FC = () => {

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Removes saved scroll position to avoid logo snug at top after refresh
  // useEffect(() => {
  //   const handleBeforeUnload = () => {
  //     window.scrollTo(0, 0);
  //   };
  
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  
  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //   };
  // }, []);

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
  const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 11155111; // Default to Sepolia

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [neyxtBalance, setNeyxtBalance] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // New loading state
  const [wrongNetwork, setWrongNetwork] = useState<boolean>(false);

  if (!window.ethereum) throw new Error("MetaMask is not installed. Please install MetaMask.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const [vestingWalletAddress, setVestingWalletAddress] = useState<string | null>(null);
  const [vestedBalance, setVestedBalance] = useState<string | null>(null);
  const [availableToWithdraw, setAvailableToWithdraw] = useState<string | null>(null);
  const [remainingDurationInDays, setRemainingDurationInDays] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [durationInDays, setDurationIndays] = useState<string | null>(null);

  const [networkInfo, setNetworkInfo] = useState<{ name?: string; chainId?: number } | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const [showSwitchOverlay, setShowSwitchOverlay] = useState(false);

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

  const FetchWalletBalances = async (inputAddress: string) => {
    setError(null);
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
      const [neyxt, eth] = await Promise.all([
        fetchNEYXTBalance(inputAddress),
        fetchETHBalance(inputAddress),
      ]);

      setNeyxtBalance(neyxt);
      setEthBalance(eth);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch balances.");
    }
  };

  const fetchVestingWalletData = async (walletAddress: string) => {
    try {
      const VESTING_WALLET_ADDRESS = vestingMapping[walletAddress.toLowerCase()];
      if (!VESTING_WALLET_ADDRESS) {
        console.log("No vesting wallet found for this address.");
        setVestingWalletAddress(null);
        return;
      }

      const contract = new ethers.Contract(
        VESTING_WALLET_ADDRESS,
        VESTING_WALLET_ABI,
        provider
      );

      // Check if the connected wallet is the beneficiary
      const beneficiary = await contract.owner();
      if (beneficiary.toLowerCase() !== walletAddress.toLowerCase()) {
        setVestingWalletAddress(null); // Not a beneficiary
        return;
      }

      // Fetch the total duration (in seconds)
      const duration = await contract.duration();
      const durationDays = Number(duration) / (60 * 60 * 24);

      // Fetch the start time (UNIX timestamp)
      const start = await contract.start();
      const startDat = new Date(Number(start) * 1000).toLocaleString();

      // Calculate remaining duration
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const endTimestamp = Number(start) + Number(duration);
      const remainingDurationInSeconds = endTimestamp - currentTimestamp;
      const remainingDurationDays = remainingDurationInSeconds / (60 * 60 * 24);

      // Fetch already released tokens (NEYXT)
      // const released = await contract.released(NEYXT_TOKEN_ADDRESS);

      // Fetch & Calculate total initially vested tokens
      const neyxtContract = new ethers.Contract(NEYXT_TOKEN_ADDRESS, ERC20_ABI, provider);
      const vestedNEYXT = await neyxtContract.balanceOf(VESTING_WALLET_ADDRESS);

      // Fetch releasable ERC-20 tokens (NEYXT in this case)
      const releasableNEYXT = await contract.releasable(NEYXT_TOKEN_ADDRESS);

      // Update state
      setVestingWalletAddress(VESTING_WALLET_ADDRESS);
      setAvailableToWithdraw(formatBalance(releasableNEYXT));// Total tokens that can be withdrawn
      setVestedBalance(formatBalance(vestedNEYXT));
      setStartDate(startDat);
      setRemainingDurationInDays(remainingDurationDays.toFixed(2));
      setDurationIndays(durationDays.toString());
    } catch (err) {
      console.error("Error fetching vesting wallet data:", err);
      setVestingWalletAddress(null);
      setVestedBalance(null);
      setAvailableToWithdraw(null);
      setStartDate(null);
      setRemainingDurationInDays(null);
      setDurationIndays(null);
    }
  };

  const withdrawNEYXT = async () => {
    try {
      if (!vestingWalletAddress) return;

      setLoading(true);
      setTxStatus("Waiting for transaction confirmation..."); // Show overlay

      const contract = new ethers.Contract(vestingWalletAddress, VESTING_WALLET_ABI, signer);
      console.log("Withdrawing NEYXT tokens...");
      setTxStatus("Transaction - Waiting for Metamask Approval...");
      const tx = await contract.release(NEYXT_TOKEN_ADDRESS); // Withdraw NEYXT tokens
      console.log("Transaction sent, waiting for confirmation...");
      setTxStatus("Transaction sent - Waiting for confirmation...");
      await tx.wait();
      setTxStatus("Transaction confirmed! Updating balances...");
      // Refresh wallet balances and vesting data
      if (walletAddress) {
        await FetchWalletBalances(walletAddress);
        await fetchVestingWalletData(walletAddress);
      }
    } catch (err) {
      console.error("Error withdrawing NEYXT tokens:", err);
      alert("Failed to withdraw NEYXT tokens.");
      setTxStatus("Transaction failed. Please try again.");
    } finally {
      setLoading(false); // Stop loading after the transaction is processed
      setTimeout(() => setTxStatus(null), 1000); // Hide overlay after 1 seconds
    }
  };

  //
  // WALLET CONNECTION
  //
  const connectWallet = async () => {

    // if (walletAddress) {
    //   // Disconnect wallet
    //   setWalletAddress(null);
    //   setNeyxtBalance(null);
    //   setEthBalance(null);
    //   setError(null);
    //   setVestingWalletAddress(null);
    //   setVestedBalance(null);
    //   setAvailableToWithdraw(null);
    //   setStartDate(null);
    //   setRemainingDurationInDays(null);
    //   setDurationIndays(null);
    //   return;
    // }

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      setLoading(true);

      // Use ethers.BrowserProvider for signing transactions
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const metamaskSigner = await browserProvider.getSigner()
      setSigner(metamaskSigner);

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
      await fetchVestingWalletData(wallet);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to connect wallet");
    } finally {
      setLoading(false); // Stop loading after all operations are complete
    }
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
            await fetchVestingWalletData(walletAddress);
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-6">
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

      {/* Show network-specific icon with tooltip */}
      {/* {networkInfo?.chainId === 1 ? (
          <FaEthereum 
            className="text-gray-200 text-xl" 
            title="Ethereum Mainnet" // Tooltip on hover
          />
        ) : networkInfo?.chainId === 11155111 ? (
          <TbCircleLetterS 
            className="text-gray-200 text-xl" 
            title="Sepolia Testnet" // Tooltip on hover
          />
        ) : null} */}

      {/* Transaction Status Overlay */}
      {txStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center flex flex-col items-center">
          <FaSpinner className="animate-spin text-5xl text-neyx-orange mb-4" />
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {txStatus}
          </p>
        </div>
      </div>
      )}

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
      {error && (
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

      {/* Results Section */}
      <div className="mt-4 w-full max-w-md space-y-4">
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Hide all if wrong Network */}
        {!wrongNetwork && (
          <>
            {vestingWalletAddress && (
              <div className="mt-4 w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Vesting Wallet Details
                </h2>

                {/* Vested Balance */}
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-3">
                  <span className="text-gray-600 dark:text-gray-400">Vested Balance:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{vestedBalance} NEYXT</span>
                </div>

                {/* Start Date */}
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-3">
                  <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{startDate}</span>
                </div>

                {/* Remaining Days */}
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-3">
                  <span className="text-gray-600 dark:text-gray-400">Remaining Days:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    {remainingDurationInDays} / {durationInDays} Days
                  </span>
                </div>

                {/* Available to Withdraw */}
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-3">
                  <span className="text-gray-600 dark:text-gray-400">Available to Withdraw:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{availableToWithdraw} NEYXT</span>
                </div>

                {/* Withdraw Button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={withdrawNEYXT}
                    className="bg-neyx-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md shadow transition"
                  >
                    Withdraw Available
                  </button>
                </div>
              </div>
            )}

            {neyxtBalance !== null && (
              <div className="flex items-center bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-4">
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-neyx-orange rounded-full shadow">
                  <img src={neyxtLogo} alt="NEYXT Logo" className="w-6 h-6" />
                </div>

                {/* Text Content */}
                <div className="flex-1 flex justify-between items-center ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">NEYXT Balance</p>
                  <p className="text-lg font-semibold text-neyx-orange text-right">
                    {neyxtBalance}
                  </p>
                </div>
              </div>
            )}

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
          </>
        )}
      </div>

      {/* Dark Mode Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="p-2 mt-2 rounded-full hover:bg-gray-700 transition"
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