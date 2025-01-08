import { useState, useEffect } from "react";
import { fetchEpochInfo, fetchLatestBlock, 
  subscribeToSlotChanges, fetchNetworkStatistics, 
  fetchTransactionMetrics,
  fetchGasFeesMetrics, fetchClusterHealth,
  fetchSolPrice, fetchFinalityTime, 
  fetchTransaction,
  fetchWallet, fetchWalletTx} from "../services/solanaService";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Activity, Box, Clock, CreditCard, Database, GitCommit, Globe, TrendingUp, Terminal, Wallet } from 'lucide-react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Buffer } from 'buffer';
window.Buffer = Buffer;

const BlockExplorer = () => {
  const [blockData, setBlockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slotInfo, setSlotInfo] = useState(null);
  const [epochInfo, setEpochInfo] = useState(null);
  const [stats, setStats] = useState({ totalBlocks: null, activeNodes: null });
  const [metrics, setMetrics] = useState({ txnCount: null, txnPerSec: null });
  const [gasMetrics, setGasMetrics] = useState({ averageFee: 0, totalFee: 0 });
  const [healthMetrics, setHealthMetrics] = useState({
    networkPing: null,
    totalNodes: 0,
    activeNodes: 0,
  });
  const [solPrice, setSolPrice] = useState(null);
  const [finalityTime, setFinalityTime] = useState(null);
  const [data, setData] = useState(null);
  const [dataError, setDataError] = useState(null);
  const [id, setId] = useState(null);
  const [accountInfo, setAccountInfo] = useState({})
  const [walletTx, setWalletTx] = useState({});

  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  // const network = "devnet"
  // const connection = new Connection(clusterApiUrl(network), "confirmed");

  useEffect(() => {
    const subscriptionId = connection.onSlotChange(async () => {
      try {
        const { blockHeight, block } = await fetchLatestBlock(connection);
        setBlockData({ blockHeight, block });
      } catch (error) {
        console.error("Error fetching block data:", error);
      }
    });
  
    return () => {
      connection.removeSlotChangeListener(subscriptionId);
    };
  }, [connection]);


  useEffect(() => {
    const unsubscribe = subscribeToSlotChanges((info) => {
      setSlotInfo(info);
    }, connection);
    return () => unsubscribe();
  }, [connection]);

  useEffect(() => {
    const loadEpoch = async () => {
      try{
        const {currentEpoch, epochProgress} = await fetchEpochInfo(connection);
        setEpochInfo({ currentEpoch, epochProgress })
      }catch(error){
        console.error("Error fetching epoch info:", error);
      }

      return () => {
        connection.removeSlotChangeListener(subscriptionId);
      }
    };

    loadEpoch();
  }, [connection]);


  useEffect(() => {
    const loadNetworkStatistics = async () => {
      setLoading(true);
      try {
        const data = await fetchNetworkStatistics(connection);
        setStats(data);
      } catch (error) {
        console.error("Error loading network statistics:", error);
      }
      setLoading(false);
    };

    loadNetworkStatistics();
  }, [connection]);

  useEffect(() => {
    let subscriptionId;

    const loadTransactionMetrics = async () => {
      setLoading(true);
      try {
        const data = await fetchTransactionMetrics(connection);
        setMetrics(data);
      } catch (error) {
        console.error("Error loading transaction metrics:", error);
      }
      setLoading(false);
    };

    loadTransactionMetrics();
    const interval = setInterval(loadTransactionMetrics, 60000); // Refresh every 10 seconds

    return () => {
      if (subscriptionId) {
        connection.removeOnLogsListener(subscriptionId);
      }
      clearInterval(interval);
    };
  }, [connection]);

  useEffect(() => {
    const loadGasFeesMetrics = async () => {
      setLoading(true);
      try {
        const metrics = await fetchGasFeesMetrics(connection);
        setGasMetrics(metrics);
      } catch (error) {
        console.error("Error loading gas fees metrics:", error);
      }
      setLoading(false);
    };

    // Load data initially and set up a refresh interval
    loadGasFeesMetrics();
    const interval = setInterval(loadGasFeesMetrics, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [connection]);

  useEffect(() => {
    const loadClusterHealth = async () => {
      setLoading(true);
      try {
        const metrics = await fetchClusterHealth(connection);
        setHealthMetrics(metrics);
      } catch (error) {
        console.error("Error loading cluster health metrics:", error);
      }
      setLoading(false);
    };

    // Load data initially and set up a refresh interval
    loadClusterHealth();
    const interval = setInterval(loadClusterHealth, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [connection]);

  useEffect(() => {
    const loadSolPrice = async () => {
      setLoading(true);
      try {
        const price = await fetchSolPrice(connection);
        
        setSolPrice(price);
      } catch (error) {
        console.error("Error loading SOL price:", error);
      }
      setLoading(false);
    };

    // Load price initially and set up a refresh interval
    loadSolPrice();
    const interval = setInterval(loadSolPrice, 60000); // Refresh every 60 sec

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [connection]);

  useEffect(() => {
    const loadFinalityTime = async () => {
      setLoading(true);
      try {
        const time = await fetchFinalityTime(connection);
        setFinalityTime(time);
      } catch (error) {
        console.error("Error loading finality time:", error);
      }
      setLoading(false);
    };

    // Load data initially and refresh every 10 seconds
    loadFinalityTime();
    const interval = setInterval(loadFinalityTime, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [connection]);

  const handleGetTransaction = async () => {
    try {
      const fetchData = await fetchTransaction(id, connection);
      setData(fetchData);
      
    } catch (error) {
      console.error('Error in handleGetTransaction:', error);
      // Set a safe error state instead of the raw error
      setData(null);
      setDataError({ error: 'Failed to fetch transaction' });
    }
  };

  useEffect(() => {
    const loadWallet = async () => {
      if (!publicKey) {
        console.error("publicKey is undefined or null.");
        return;
      }

      const getWallet = await fetchWallet(publicKey, connection); 
      
      setAccountInfo(getWallet);
    }

    loadWallet();
    const interval = setInterval(loadWallet, 60000);
    
    return () => clearInterval(interval);

  }, [publicKey, connection])

  const handleFetchWalletTx = async () => {
    try{
      if(!publicKey){
        return null;
      }
      const callFetchWalletTx = await fetchWalletTx(publicKey, connection);
      setWalletTx(callFetchWalletTx);
    }catch(error){
      console.error('Error in Getting wallet Tx:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-gray-100">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Solana Network Dashboard</h1>
        <p className="text-gray-400 mt-2">Real-time network statistics and metrics</p>
      </div>

      <WalletMultiButton className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full text-lg font-semibold mb-8 mx-auto block shadow-lg transition-all duration-300" />
      <br/>
      <br/>
      <a 
        href="#wallet-section" 
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 14l-7 7m0 0l-7-7m7 7V3" 
          />
        </svg>
        Go to Wallet
      </a>
      <br/>
      <br/>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-purple-500 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Current Price</p>
              <h3 className="text-2xl font-bold mt-2 text-purple-400">
                {loading ? "Loading..." : solPrice ? `$${solPrice.toFixed(2)}` : "N/A"}
              </h3>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-blue-500 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">TPS</p>
              <h3 className="text-2xl font-bold mt-2 text-blue-400">
                {loading ? "Loading..." : metrics.txnPerSec?.toFixed(2) || "N/A"}
              </h3>
            </div>
            <Activity className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-green-500 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Transactions</p>
              <h3 className="text-2xl font-bold mt-2 text-green-400">
                {loading ? "Loading..." : metrics.txnCount?.toLocaleString() || "N/A"}
              </h3>
            </div>
            <Database className="h-8 w-8 text-green-400" />
          </div>
        </div>


        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-amber-500 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Time to Finality</p>
              <h3 className="text-2xl font-bold mt-2 text-amber-400">
                {loading ? "Loading..." : finalityTime ? `${finalityTime}s` : "N/A"}
              </h3>
            </div>
            <Clock className="h-8 w-8 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Id Search */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="border-b border-gray-700 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
              <Terminal className="h-5 w-5" />
              Search
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Input and Button */}
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="Enter Transaction ID"
                  className="px-4 py-2 rounded-full bg-gray-700 text-gray-300"
                />
                <button
                  onClick={handleGetTransaction}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full text-lg font-semibold"
                >
                  Search
                </button>
              </div>

              {/* Transaction Data Display */}
              {dataError ? (
                <div className="text-red-400 mt-4">{dataError.error}</div>
              ) : data && data.transaction?.signatures && data.meta ? (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-gray-200">Details</h3>
                  <div className="bg-gray-900 text-gray-400 p-4 rounded-lg mt-2">
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-gray-300">Id:</span>
                        <p>{data.transaction.signatures[0].slice(0, 20)}....</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300">Block Time:</span>
                        <p>{new Date(data.blockTime * 1000).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300">Fee:</span>
                        <p>{(data.meta.fee / 1000000000).toFixed(9)} SOL</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300">Slot:</span>
                        <p>{data.slot}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">Enter a transaction ID and click "Search" to get transaction details.</div>
              )}

            </div>
          </div>
        </div>

        {/* Block Info */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="border-b border-gray-700 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-400">
              <Box className="h-5 w-5" />
              Block Information
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Block Height</span>
                <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">{blockData?.blockHeight || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Block Transactions</span>
                <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">{blockData?.block?.transactions?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Epoch Info */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="border-b border-gray-700 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-400">
              <GitCommit className="h-5 w-5" />
              Epoch Status
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Epoch</span>
                <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">{epochInfo?.currentEpoch || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${epochInfo?.epochProgress || 0}%` }}
                    />
                  </div>
                  <span className="font-medium">{epochInfo?.epochProgress || "N/A"}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Health */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="border-b border-gray-700 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-400">
              <Globe className="h-5 w-5" />
              Network Health
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Network Ping</span>
                <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">{healthMetrics.networkPing} ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Nodes</span>
                <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">{healthMetrics.totalNodes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gas Metrics */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="border-b border-gray-700 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-400">
              <CreditCard className="h-5 w-5" />
              Gas Metrics
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Average Fee</span>
                <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">
                  {(gasMetrics.averageFee / LAMPORTS_PER_SOL).toFixed(9)} SOL
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Fee</span>
                <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">
                  {(gasMetrics.totalFee / LAMPORTS_PER_SOL).toFixed(9)} SOL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Slot Information */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="border-b border-gray-700 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
              <Terminal className="h-5 w-5" />
              Slot Information
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {slotInfo ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Slot</span>
                  <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">{slotInfo.slot}</span>
                </div>
              ) : (
                <div className="text-gray-400">Waiting for slot updates...</div>
              )}
            </div>
          </div>
        </div>
      
      </div>

      
      <br/>
      <h1 id="wallet-section" className="text-4xl font-extrabold text-indigo-600 hover:text-indigo-700 transition duration-300">
        Wallet
      </h1>
      <br/>

      {publicKey ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallet Information */}
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            {/* Wallet Header */}
            <div className="border-b border-gray-700 p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
                <Wallet className="h-5 w-5" />
                Wallet Information
              </h2>
            </div>

            {/* Wallet Content */}
            <div className="p-6 space-y-4">
              {/* Wallet Address */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Wallet Address</span>
                <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">
                  {accountInfo.address}
                </span>
              </div>

              {/* SOL Balance */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">SOL Balance</span>
                <span className="font-medium bg-gray-900 px-4 py-1 rounded-full">
                  {accountInfo.solBalance} SOL
                </span>
              </div>

              {/* Token Balances */}
              <h3 className="text-md font-medium text-indigo-400 mt-4">Token Balances</h3>
              {accountInfo.tokens && accountInfo.tokens.length > 0 ? (
                accountInfo.tokens.map((token, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded-lg"
                  >
                    <div className="flex flex-col">
                      Token Account:
                      <span className="text-indigo-400">{token.tokenAccount}</span>
                      <span className="text-gray-400">Mint: {token.mint}</span>
                      <span className="text-gray-400">
                        Balance: {token.balance} ({token.decimals} decimals)
                      </span>
                      <br />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No token balances available.</div>
              )}
            </div>
          </div>
          
          {walletTx && (
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              {/* Header */}
              <div className="border-b border-gray-700 p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
                  <Terminal className="h-5 w-5" />
                  Wallet Transactions
                </h2>
              </div>
        
              {/* Button to Fetch Transactions */}
              <div className="p-6">
              <button
                onClick={handleFetchWalletTx}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-full"
              >
                Fetch Last 5 Transactions
              </button>
              <button
                onClick={() => setWalletTx({})}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-full"
              >
                Clear
              </button>
        
                {/* Transactions Display */}
                <div className="mt-6 space-y-4">
                  {walletTx ? (
                    walletTx.error ? (
                      <div className="text-red-500">{walletTx.error}</div>
                    ) : walletTx.transactions && walletTx.transactions.length > 0 ? (
                      walletTx.transactions.map((tx, index) => (
                        <div
                          key={index}
                          className="bg-gray-900 p-4 rounded-lg space-y-2"
                        >
                          <div className="text-gray-400">
                            <strong>Signature:</strong>{" "}
                            <span className="truncate max-w-xs inline-block align-middle cursor-pointer hover:whitespace-normal hover:max-w-none hover:bg-gray-800 px-2 rounded">
                              {tx.signature}
                            </span>
                          </div>
                          <div className="text-gray-400">
                            <strong>Slot:</strong> {tx.slot}
                          </div>
                          <div className="text-gray-400">
                            <strong>Block Time:</strong>{" "}
                            {tx.blockTime
                              ? new Date(tx.blockTime * 1000).toLocaleString()
                              : "N/A"}
                          </div>
                          <div className="text-gray-400">
                            <strong>Fee:</strong> {tx.fee} lamports
                          </div>
                          <div className={`text-gray-400`}>
                            <strong>Status:</strong>{" "}
                            <span
                              className={`${
                                tx.status === "Success"
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          <div className="text-gray-400">
                            <strong>Instructions:</strong>
                            <ul className="list-disc pl-6">
                              {tx.instructions.map((instruction, idx) => (
                                <li key={idx}>{JSON.stringify(instruction)}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400">No transactions found.</div>
                    )
                  ) : (
                    <div className="text-gray-400">Click the button to fetch transactions.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ): (
        <div className="text-gray-400 text-center p-6">
          Connect wallet to see wallet information
        </div>
      )}
    </div>
  );
};

export default BlockExplorer;
