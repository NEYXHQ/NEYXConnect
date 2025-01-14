import React, { useState } from "react";
import { ethers } from "ethers";

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

const App: React.FC = () => {
  const [address, setAddress] = useState<string>("");
  const [isGenesis, setIsGenesis] = useState<boolean | null>(null);
  const [hasNEYXT, setHasNEYXT] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const INFURA_API_KEY = import.meta.env.VITE_INFURA_API_KEY;
  const NETWORK = "mainnet"; // or "goerli" for testnet
  const provider = new ethers.JsonRpcProvider(`https://${NETWORK}.infura.io/v3/${INFURA_API_KEY}`);

  // Check if the address is a genesis address
  const checkGenesis = (inputAddress: string) => {
    console.log("address : ",inputAddress.toLowerCase())
    return genesisAddresses.has(inputAddress);
  };

  // Check if the address holds NEYXT tokens
  const checkNEYXTBalance = async (inputAddress: string) => {
    try {
      const contract = new ethers.Contract(NEYXT_TOKEN_ADDRESS, ERC20_ABI, provider);
      const balance = await contract.balanceOf(inputAddress);
      return balance > 0n; // Returns true if balance > 0
    } catch (err) {
      console.error(err);
      throw new Error("Failed to fetch NEYXT token balance.");
    }
  };

  // Handle form submission
  const handleCheck = async () => {
    setError(null);
    setIsGenesis(null);
    setHasNEYXT(null);

    if (!ethers.isAddress(address)) {
      setError("Invalid Ethereum address");
      return;
    }

    try {
      // Check if it's a genesis address
      const genesis = checkGenesis(address);
      setIsGenesis(genesis);

      // Check if it holds NEYXT tokens
      const holdsNEYXT = await checkNEYXTBalance(address);
      setHasNEYXT(holdsNEYXT);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message || "An error occurred while checking the address.");
          } else {
            console.error("An unexpected error occurred:", err);
          }  
    }
  };

  return (
    <div>
      <h1>NEYXT Address Checker</h1>
      <input
        type="text"
        placeholder="Enter Ethereum address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button onClick={handleCheck}>Check Address</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {isGenesis !== null && (
        <p>{isGenesis ? "This is a genesis address for NEYXT." : "This is NOT a genesis address for NEYXT."}</p>
      )}
      {hasNEYXT !== null && (
        <p>{hasNEYXT ? "This address holds NEYXT tokens." : "This address does NOT hold NEYXT tokens."}</p>
      )}
    </div>
  );
};

export default App;