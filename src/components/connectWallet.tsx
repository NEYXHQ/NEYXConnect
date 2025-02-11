import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { FaEthereum, FaSpinner } from "react-icons/fa";
import { TbPlugConnected } from "react-icons/tb";
import { RiExchangeFundsLine } from "react-icons/ri";

// Expected Chain
const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);

const WalletConnectPage: React.FC = () => {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [ethBalance, setEthBalance] = useState<string | null>(null);
    const [networkInfo, setNetworkInfo] = useState<{ name?: string; chainId?: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [wrongNetwork, setWrongNetwork] = useState<boolean>(false);
    const [showSwitchOverlay, setShowSwitchOverlay] = useState(false);

    if (!window.ethereum) throw new Error("MetaMask is not installed. Please install MetaMask.");
    const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);

    const fetchETHBalance = async (inputAddress: string) => {
        const balance = await provider.getBalance(inputAddress);
        return parseFloat(ethers.formatEther(balance)).toFixed(4);
    };

    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                throw new Error("MetaMask is not installed");
            }

            setLoading(true);
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await browserProvider.send("eth_requestAccounts", []);

            if (accounts.length === 0) throw new Error("No account connected.");
            const wallet = accounts[0];
            setWalletAddress(wallet);

            const network = await browserProvider.getNetwork();
            setNetworkInfo({ name: network.name, chainId: Number(network.chainId) });

            if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
                setError("Wrong Network");
                setWrongNetwork(true);
            } else {
                setError(null);
                setWrongNetwork(false);
            }

            const eth = await fetchETHBalance(wallet);
            setEthBalance(eth);
        } catch (err) {
            console.error(err);
            setError((err as Error).message || "Failed to connect wallet");
        } finally {
            setLoading(false);
        }
    };

    const switchNetwork = async () => {
        if (!window.ethereum) return;
        try {
            const expectedChainId = EXPECTED_CHAIN_ID;
            const hexChainId = "0x" + expectedChainId.toString(16);

            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: hexChainId }],
            });

            console.log(`Switched to network: ${expectedChainId}`);
            if (walletAddress) {
                const eth = await fetchETHBalance(walletAddress);
                setEthBalance(eth);
            }
        } catch (error: any) {
            console.error("Error switching network:", error);
            if (error.code === 4902) await addNetwork();
        }
    };

    const addNetwork = async () => {
        try {
            await window.ethereum?.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: "0x" + EXPECTED_CHAIN_ID.toString(16),
                        rpcUrls: ["https://rpc.sepolia.org"],
                        chainName: "Sepolia Testnet",
                        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                        blockExplorerUrls: ["https://sepolia.etherscan.io"],
                    },
                ],
            });
            console.log("Network added successfully!");
        } catch (error) {
            console.error("Failed to add network:", error);
        }
    };

    const requestMoreAccounts = async () => {
        if (!window.ethereum) return;
        try {
            console.log("Requesting multiple accounts...");
            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }],
            });

            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await browserProvider.send("eth_accounts", []);

            if (accounts.length > 0) {
                setWalletAddress(accounts[0]);
                connectWallet();
            } else {
                console.error("No accounts returned.");
            }
        } catch (err) {
            console.error("Error requesting multiple accounts:", err);
        }
    };

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
                        await fetchETHBalance(walletAddress);
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

    return (
        <div className="min-h-screen flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold mb-4">Wallet Connection</h1>

            {/* If wrong network, show only this */}
            {wrongNetwork ? (
                <div className="bg-red-200 text-red-800 p-3 rounded-md text-center">
                    <p>Wrong Network</p>
                    <button onClick={switchNetwork} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md mt-2">
                        Switch to Sepolia
                    </button>
                </div>
            ) : (
                <>
                    <button
                        onClick={walletAddress ? () => setShowSwitchOverlay(true) : connectWallet}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-md shadow hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <FaSpinner className="animate-spin text-xl" /> : walletAddress ? (
                            <>
                                <span className="text-white text-lg">Account</span>
                                <span className="font-medium">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                                <RiExchangeFundsLine className="text-white text-xl" title="Switch Account" />
                            </>
                        ) : (
                            <>
                                <TbPlugConnected className="text-white text-xl" />
                                Connect Wallet
                            </>
                        )}
                    </button>

                    {showSwitchOverlay && (
                        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                                <p className="text-lg font-semibold">Change to selected MetaMask address?</p>
                                <div className="flex justify-center gap-4 mt-4">
                                    <button onClick={() => { requestMoreAccounts(); setShowSwitchOverlay(false); }} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md shadow">OK</button>
                                    <button onClick={() => setShowSwitchOverlay(false)} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md shadow">Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {ethBalance !== null && (
                        <p className="text-lg font-semibold mt-4 flex items-center">
                            <FaEthereum className="text-blue-500 text-2xl mr-2" /> ETH Balance: {ethBalance}
                        </p>
                    )}

                    {/* Subtle mention of Sepolia */}
                    {networkInfo?.chainId === 11155111 && (
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-4 italic self-end">
                            Sepolia Testnet
                        </p>
                    )}

                    {error && (
                        <div className="bg-red-200 text-red-800 p-3 rounded-md text-center">
                            <p>{error}</p>
                        </div>
                    )}

                </>
            )}


        </div>
    );
};

export default WalletConnectPage;