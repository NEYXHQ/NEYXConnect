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

    const [minting, setMinting] = useState<boolean>(false);
    const [mintSuccess, setMintSuccess] = useState<boolean>(false);
    const [txHash, setTxHash] = useState<string | null>(null); // Store transaction hash
    // const [alreadyMinted, setAlreadyMinted] = useState<boolean>(false); // ✅ Track if address has minted

    // NFT State
    const [nftMetadata, setNftMetadata] = useState<{ image: string; name: string } | null>(null);
    const [fetchingNFT, setFetchingNFT] = useState<boolean>(false);
    const API_BASE_URL = "https://wfounders.club/api/nft/";

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
                 // ✅ Reset NFT & transaction data
                setTxHash(null);
                setMinting(false);
                setMintSuccess(false);

                // ✅ Fetch new wallet data
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

    useEffect(() => {
        if (walletAddress) {
            fetchNFT(walletAddress);
        }
    }, [walletAddress]);

    // ---------------
    // NFT Co-Foudner
    // ---------------

    const fetchNFT = async (wallet: string) => {
        try {
            setFetchingNFT(true);
            const response = await fetch(`${API_BASE_URL}${wallet}`);
            if (!response.ok) throw new Error("No NFT found for this wallet.");

            const metadata = await response.json();
            setNftMetadata({ image: metadata.image, name: metadata.name });
        } catch (err) {
            console.error("Error fetching NFT:", err);
            setNftMetadata(null);
        } finally {
            setFetchingNFT(false);
        }
    };

    // ---------------
    //   NFT Section
    // ---------------

    // const claimNFT = async () => {
    //     if (!walletAddress) {
    //         alert("Please connect your wallet first.");
    //         return;
    //     }

    //     setMinting(true);  // Show "Minting in progress..."
    //     setMintSuccess(false); // Reset success state
    //     setTxHash(null); // Reset transaction hash before minting 

    //     try {
    //         const response = await fetch("https://wfounders.club/claim-nft", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ walletAddress }),
    //         });

    //         if (!response.ok) {
    //             setMinting(false);
    //             setMintSuccess(true); // Show "Minting Complete!"
    //             const errorData = await response.json();
    //             throw new Error(errorData.error || "Something went wrong.");
    //         }

    //         console.log('Waiting for Mint to complete')

    //         const data = await response.json();
    //         if (response.ok) {
    //             setMinting(false);
    //             setMintSuccess(true); // Show "Minting Complete!"
    //             setTxHash(data.txHash); // Save transaction hash
    //         } else {
    //             alert(`Error: ${data.error}`);
    //             console.error("Minting Error:", data.error);
    //         }
    //     } catch (err) {
    //         alert("Failed to claim NFT.");
    //         console.error(err);
    //     }
    // };

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

                    {/* Display NFT Founder if Found */}
                    {fetchingNFT ? (
                        <p className="text-gray-500 mt-4">Loading NFT...</p>
                    ) : nftMetadata ? (
                        <div className="mt-6 text-center">
                            <h2 className="text-lg font-semibold">{nftMetadata.name}</h2>
                            <img
                                src={nftMetadata.image}
                                alt="NFT"
                                className="w-full max-w-xs h-auto object-contain rounded-lg shadow-lg mt-2 mx-auto"
                            />
                        </div>
                    ) : (
                        walletAddress && <p className="text-gray-500 mt-4">No NFT found for this wallet.</p>
                    )}

                    {ethBalance !== null && (
                        <p className="text-lg font-semibold mt-4 flex items-center">
                            <FaEthereum className="text-blue-500 text-2xl mr-2" /> ETH Balance: {ethBalance}
                        </p>
                    )}

                    
                    {/* Show "Claim NFT" button only if a wallet is connected */}
                    {/*walletAddress && !wrongNetwork && (
                        <button
                            onClick={claimNFT}
                            disabled={minting}
                            className={`mt-4 px-6 py-2 rounded-md shadow transition font-semibold ${minting
                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                    : mintSuccess
                                        ? "bg-green-500 text-white"
                                        : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                        >
                            {minting ? "Minting in progress..." : mintSuccess ? "Minting Complete! ✅" : "Claim NFT"}
                        </button>
                    )*/}

                    {ethBalance !== null && (
                        <p className="text-lg font-semibold mt-4 flex items-center">
                            <FaEthereum className="text-blue-500 text-2xl mr-2" /> ETH Balance: {ethBalance}
                        </p>
                    )}

                    {/* Show NFT image & transaction hash ONLY if minting is successful */}
                    {txHash && (
                        <div className="mt-6 text-center">
                            <h2 className="text-lg font-semibold">Your Minted NFT</h2>

                            <img
                                src="https://res.cloudinary.com/ddnwvo0qv/image/upload/v1739366956/WF01_hvlduz.png" // Use actual image URL
                                alt="Minted NFT"
                                className="w-full max-w-xs h-auto object-contain rounded-lg shadow-lg mt-2 mx-auto"
                            />

                            {/* Show transaction hash */}
                            <div className="mt-4 bg-gray-200 dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                <p className="text-sm text-gray-600 dark:text-gray-300">Transaction Hash:</p>
                                <p className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all">
                                    {txHash}
                                </p>
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline mt-2 inline-block"
                                >
                                    View on Etherscan
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Subtle mention of Sepolia */}
                    {networkInfo?.chainId === 11155111 && (
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-4 italic self-end">
                            Sepolia Testnet (v0.029)
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