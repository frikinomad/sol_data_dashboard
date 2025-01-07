import { useState, useEffect } from "react";
import { fetchEpochInfo, fetchLatestBlock, 
  subscribeToSlotChanges, fetchNetworkStatistics, 
  fetchTransactionMetrics, fetchValidatorPerformance,
  fetchGasFeesMetrics, fetchClusterHealth,
  fetchSolPrice, fetchFinalityTime  } from "../services/solanaService";
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Activity, Box, Circle, Clock, CreditCard, Database, GitCommit, Globe, Server, TrendingUp } from 'lucide-react';

const BlockExplorer = () => {
  const [blockData, setBlockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slotInfo, setSlotInfo] = useState(null);
  const [epochInfo, setEpochInfo] = useState(null);
  const [stats, setStats] = useState({ totalBlocks: null, activeNodes: null });
  const [metrics, setMetrics] = useState({ txnCount: null, txnPerSec: null });
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [validatorStats, setValidatorStats] = useState([]);
  const [gasMetrics, setGasMetrics] = useState({ averageFee: 0, totalFee: 0 });
  const [healthMetrics, setHealthMetrics] = useState({
    networkPing: null,
    totalNodes: 0,
    activeNodes: 0,
  });
  const [solPrice, setSolPrice] = useState(null);
  const [finalityTime, setFinalityTime] = useState(null);

  const network = "devnet"
  const connection = new Connection(clusterApiUrl(network), "confirmed");

  useEffect(() => {
    const subscriptionId = connection.onSlotChange(async () => {
      try {
        const { blockHeight, block } = await fetchLatestBlock();
        setBlockData({ blockHeight, block });
      } catch (error) {
        console.error("Error fetching block data:", error);
      }
    });
  
    return () => {
      connection.removeSlotChangeListener(subscriptionId);
    };
  }, []);


  useEffect(() => {
    const unsubscribe = subscribeToSlotChanges((info) => {
      setSlotInfo(info);
    });
    return () => unsubscribe();
  });

  useEffect(() => {
    const loadEpoch = async () => {
      try{
        const {currentEpoch, epochProgress} = await fetchEpochInfo();
        setEpochInfo({ currentEpoch, epochProgress })
      }catch(error){
        console.error("Error fetching epoch info:", error);
      }

      return () => {
        connection.removeSlotChangeListener(subscriptionId);
      }
    };

    loadEpoch();
  }, []);


  useEffect(() => {
    const loadNetworkStatistics = async () => {
      setLoading(true);
      try {
        const data = await fetchNetworkStatistics();
        setStats(data);
      } catch (error) {
        console.error("Error loading network statistics:", error);
      }
      setLoading(false);
    };

    loadNetworkStatistics();
  }, []);

  useEffect(() => {
    let subscriptionId;

    const loadTransactionMetrics = async () => {
      setLoading(true);
      try {
        const data = await fetchTransactionMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Error loading transaction metrics:", error);
      }
      setLoading(false);
    };

    const streamTransactions = () => {
      subscriptionId = connection.onLogs("all", (logInfo) => {
        setLiveTransactions((prevLogs) => [logInfo, ...prevLogs].slice(0, 10)); // Keep the latest 10 transactions
      });
    };

    loadTransactionMetrics();
    // TODO: uncomment
    // streamTransactions();

    return () => {
      if (subscriptionId) {
        connection.removeOnLogsListener(subscriptionId);
      }
    };
  }, []);

  useEffect(() => {
    const loadValidatorPerformance = async () => {
      setLoading(true);
      try {
        const stats = await fetchValidatorPerformance();
        setValidatorStats(stats);
      } catch (error) {
        console.error("Error loading validator performance:", error);
      }
      setLoading(false);
    };

    loadValidatorPerformance();
  }, []);

  useEffect(() => {
    const loadGasFeesMetrics = async () => {
      setLoading(true);
      try {
        const metrics = await fetchGasFeesMetrics();
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
  }, []);

  useEffect(() => {
    const loadClusterHealth = async () => {
      setLoading(true);
      try {
        const metrics = await fetchClusterHealth();
        setHealthMetrics(metrics);
      } catch (error) {
        console.error("Error loading cluster health metrics:", error);
      }
      setLoading(false);
    };

    // Load data initially and set up a refresh interval
    loadClusterHealth();
    const interval = setInterval(loadClusterHealth, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, []);

  useEffect(() => {
    const loadSolPrice = async () => {
      setLoading(true);
      try {
        const price = await fetchSolPrice();
        setSolPrice(price);
      } catch (error) {
        console.error("Error loading SOL price:", error);
      }
      setLoading(false);
    };

    // Load price initially and set up a refresh interval
    loadSolPrice();
    const interval = setInterval(loadSolPrice, 10000); // Refresh every 10 sec

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, []);

  useEffect(() => {
    const loadFinalityTime = async () => {
      setLoading(true);
      try {
        const time = await fetchFinalityTime();
        setFinalityTime(time);
      } catch (error) {
        console.error("Error loading finality time:", error);
      }
      setLoading(false);
    };

    // Load data initially and refresh every 10 seconds
    loadFinalityTime();
    const interval = setInterval(loadFinalityTime, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, []);

  // return (
  //   <>
  //     <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
  //       <ul>
  //         {slotInfo ? (
  //           <li><strong>Current Slot:</strong> {slotInfo.slot}</li>
  //         ) : (
  //           <li><strong>Status:</strong> Waiting for slot updates...</li>
  //         )}
  //       </ul>
  
  //       {loading ? (
  //         <ul>
  //           <li><strong>Status:</strong> Loading...</li>
  //         </ul>
  //       ) : (
  //         blockData ? (
  //           <ul>
  //             <li><strong>Block Height:</strong> {blockData.blockHeight}</li>
  //             <li><strong>Block Hash:</strong> {blockData.block?.blockhash}</li>
  //             <li><strong>Transactions:</strong> {blockData.block?.transactions?.length || 0}</li>
  //           </ul>
  //         ) : (
  //           <ul>
  //             <li><strong>Status:</strong> No data available</li>
  //           </ul>
  //         )
  //       )}
  //       {loading ? (
  //         <ul>
  //           <li><strong>Status:</strong> Loading...</li>
  //         </ul>
  //       ) : (
  //         blockData ? (
  //           <ul>
  //             <li><strong>epochProgress:</strong> {epochInfo.epochProgress}</li>
  //             <li><strong>currentEpoch:</strong> {epochInfo.currentEpoch}</li>
  //           </ul>
  //         ) : (
  //           <ul>
  //             <li><strong>Status:</strong> No data available</li>
  //           </ul>
  //         )
  //       )}
  //       <h2>Network Statistics</h2>
  //       {loading ? (
  //         <p>Loading...</p>
  //       ) : (
  //         <ul>
  //           <li><strong>Total Blocks:</strong> {stats.totalBlocks || "N/A"}</li>
  //           <li><strong>Active Nodes:</strong> {stats.activeNodes || "N/A"}</li>
  //         </ul>
  //       )}
  //       <h2>Transaction Metrics</h2>
  //       {loading ? (
  //         <p>Loading...</p>
  //       ) : (
  //         <ul>
  //           <li><strong>Total Transactions:</strong> {metrics.txnCount || "N/A"}</li>
  //           <li><strong>Transactions Per Second (TPS):</strong> {metrics.txnPerSec?.toFixed(2) || "N/A"}</li>
  //         </ul>
  //       )}
  //       <h2>Real-Time Transaction Feed</h2>
  //       <ul>
  //         {liveTransactions.length > 0 ? (
  //           liveTransactions.map((log, index) => (
  //             <li key={index}>
  //               <strong>Transaction Signature:</strong> {log.signature || "N/A"}
  //             </li>
  //           ))
  //         ) : (
  //           <li>No transactions available.</li>
  //         )}
  //       </ul>

  //       <h2>Validator Performance</h2>
  //       {loading ? (
  //         <p>Loading...</p>
  //       ) : (
  //         <ol>
  //           {validatorStats.map((validator, index) => (
  //             <li key={index}>
  //               <strong>Validator:</strong> {validator.pubkey} <br />
  //               <strong>Uptime:</strong> {validator.uptime}% <br />
  //               <strong>Skipped Slots:</strong> {validator.skippedSlots} <br />
  //               <strong>Rewards (Commission):</strong> {validator.rewards}%
  //             </li>
  //           ))}
  //         </ol>
  //       )}

  //       <h2>Gas/Fees Metrics</h2>
  //       {loading ? (
  //         <p>Loading...</p>
  //       ) : (
  //         <ol>
  //           <li>
  //             <strong>Average Fee:</strong> {(gasMetrics.averageFee / LAMPORTS_PER_SOL).toFixed(9)} SOL
  //           </li>
  //           <li>
  //             <strong>Total Fee:</strong> {(gasMetrics.totalFee / LAMPORTS_PER_SOL).toFixed(9)} SOL
  //           </li>
  //         </ol>
  //       )}

  //       <h2>Cluster Health Metrics</h2>
  //       {loading ? (
  //         <p>Loading...</p>
  //       ) : (
  //         <ul>
  //           <li>
  //             <strong>Network Ping:</strong> {healthMetrics.networkPing} ms
  //           </li>
  //           <li>
  //             <strong>Total Nodes:</strong> {healthMetrics.totalNodes}
  //           </li>
  //           <li>
  //             <strong>Active Nodes:</strong> {healthMetrics.activeNodes}
  //           </li>
  //         </ul>
  //       )}

  //       <h2>Market Data</h2>
  //       {loading ? (
  //         <p>Loading SOL price...</p>
  //       ) : (
  //         <ul>
  //           <li>
  //             <strong>SOL Price (USD):</strong> {solPrice ? `$${solPrice.toFixed(2)}` : "N/A"}
  //           </li>
  //         </ul>
  //       )}
  //       <h2>Time to Finality</h2>
  //       {loading ? (
  //         <p>Loading...</p>
  //       ) : (
  //         <ul>
  //           <li>
  //             <strong>Finality Time:</strong>{" "}
  //             {finalityTime ? `${finalityTime} seconds` : "N/A"}
  //           </li>
  //         </ul>
  //       )}
  //     </div>
  //   </>
  // );


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Solana Network Dashboard</h1>
        <p className="text-gray-500 mt-2">Real-time network statistics and metrics</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Price</p>
              <h3 className="text-2xl font-bold mt-2">
                {loading ? "Loading..." : solPrice ? `$${solPrice.toFixed(2)}` : "N/A"}
              </h3>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">TPS</p>
              <h3 className="text-2xl font-bold mt-2">
                {loading ? "Loading..." : metrics.txnPerSec?.toFixed(2) || "N/A"}
              </h3>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Nodes</p>
              <h3 className="text-2xl font-bold mt-2">
                {loading ? "Loading..." : healthMetrics.activeNodes || "N/A"}
              </h3>
            </div>
            <Server className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Time to Finality</p>
              <h3 className="text-2xl font-bold mt-2">
                {loading ? "Loading..." : finalityTime ? `${finalityTime}s` : "N/A"}
              </h3>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block Info */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Box className="h-5 w-5" />
              Block Information
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Block Height</span>
                <span className="font-medium">{blockData?.blockHeight || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Block Hash</span>
                <span className="font-medium">{blockData?.block?.blockhash || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transactions</span>
                <span className="font-medium">{blockData?.block?.transactions?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Epoch Info */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Epoch Status
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Epoch</span>
                <span className="font-medium">{epochInfo?.currentEpoch || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{epochInfo?.epochProgress || "N/A"}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Health */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Network Health
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Network Ping</span>
                <span className="font-medium">{healthMetrics.networkPing} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Nodes</span>
                <span className="font-medium">{healthMetrics.totalNodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active/Total Ratio</span>
                <span className="font-medium">
                  {((healthMetrics.activeNodes / healthMetrics.totalNodes) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gas Metrics */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gas Metrics
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Average Fee</span>
                <span className="font-medium">
                  {(gasMetrics.averageFee / LAMPORTS_PER_SOL).toFixed(9)} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Fee</span>
                <span className="font-medium">
                  {(gasMetrics.totalFee / LAMPORTS_PER_SOL).toFixed(9)} SOL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm lg:col-span-2">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-5 w-5" />
              Recent Transactions
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {liveTransactions.length > 0 ? (
                liveTransactions.slice(0, 5).map((tx, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <Circle className="h-4 w-4 text-green-500" />
                    <span className="font-mono text-sm truncate">
                      {tx.signature || "N/A"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No recent transactions</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockExplorer;
