import React, { FC, ReactNode, useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

// Define localnet URL
const LOCALNET_URL = "http://127.0.0.1:8899";

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [network, setNetwork] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Devnet);

    // Determine endpoint based on selected network
    const endpoint = useMemo(() => {
        switch (network) {
            case WalletAdapterNetwork.Devnet:
                return clusterApiUrl("devnet");
            case WalletAdapterNetwork.Testnet:
                return clusterApiUrl("testnet");
            case WalletAdapterNetwork.Mainnet:
                return clusterApiUrl("mainnet-beta");
            default:
                return LOCALNET_URL; // Fallback to localnet if none of the predefined networks are selected
        }
    }, [network]);

    // Define available wallets
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                    <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg">
                        <select
                            value={network}
                            onChange={(e) => setNetwork(e.target.value as WalletAdapterNetwork)}
                            className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600"
                        >
                            <option value={WalletAdapterNetwork.Devnet}>Devnet</option>
                            <option value={WalletAdapterNetwork.Testnet}>Testnet</option>
                            <option value={WalletAdapterNetwork.Mainnet}>Mainnet</option>
                            <option value="localnet">Localnet</option>
                        </select>
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
    
};
