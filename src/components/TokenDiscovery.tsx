import React, { useState } from "react";
import { ethers } from "ethers";

import logo from "../assets/NEYX_LOGO_TEXT.svg";
import { TbHexagonLetterG } from "react-icons/tb";
import { FaEthereum } from "react-icons/fa";
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
  const [address, setAddress] = useState<string>("");
  const [isGenesis, setIsGenesis] = useState<boolean | null>(null);
  const [neyxtBalance, setNeyxtBalance] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleCheck = async () => {
    setError(null);
    setIsGenesis(null);
    setNeyxtBalance(null);
    setEthBalance(null);

    if (!ethers.isAddress(address)) {
      setError("Invalid Ethereum address");
      return;
    }

    try {
      setIsGenesis(checkGenesis(address));
      const [neyxt, eth] = await Promise.all([fetchNEYXTBalance(address), fetchETHBalance(address)]);
      setNeyxtBalance(neyxt);
      setEthBalance(eth);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch balances.");
    }
  };

  

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-6">
      {/* Header */}
      <div className="mb-8 w-full max-w-md text-center">
        <img
          src={logo}
          alt="NEYXT Logo"
          className="w-full max-w-md mx-auto"
        />
        <h1 className="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-300">
          Token Discovery
        </h1>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-md bg-gray-200 dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <input
          type="text"
          className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Enter Ethereum address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button
          onClick={handleCheck}
          className="w-full bg-neyx-orange hover:bg-orange-300 text-white py-2 rounded-md transition"
        >
          Check Address
        </button>
      </div>

      {/* Results Section */}
      <div className="mt-8 w-full max-w-md space-y-4">
        {error && <p className="text-red-500 text-center">{error}</p>}

        {isGenesis !== null && (
          <div className="flex gap-4 items-stretch">
            <div
              className={`flex justify-center items-center w-20 rounded-lg shadow ${
                isGenesis ? "bg-neyx-orange dark:bg-neyx-orange" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <TbHexagonLetterG className={`text-3xl ${isGenesis ? "text-white" : "text-neyx-orange"}`}/>
            </div>
            <div className={`flex-grow p-4 rounded-lg shadow ${ isGenesis ? "bg-neyx-orange" : "bg-gray-200 dark:bg-gray-800"}`}>
              <p className={isGenesis ? "text-white" : ""}>
                <strong>Genesis Address:</strong> {isGenesis ? "Yes" : "No"}
              </p>
            </div>
          </div>
        )}

        {neyxtBalance !== null && (
          <div className="flex gap-4 items-stretch">
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
          <div className="flex gap-4 items-stretch">
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
    </div>
  );
};

export default TokenDiscovery;