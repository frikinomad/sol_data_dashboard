import { Connection, clusterApiUrl } from "@solana/web3.js";

// const network = "mainnet-beta"
const network = "devnet"
const connection = new Connection(clusterApiUrl(network), "confirmed");

export const fetchLatestBlock = async () => {
  try {
    const blockHeight = await connection.getBlockHeight();
    const block = await connection.getBlock(blockHeight, { maxSupportedTransactionVersion: 0 });
    return { blockHeight, block };
  } catch (error) {
    console.error("Error fetching block data:", error);
    throw error;
  }
};

export const fetchEpochInfo = async () => {
  try {
    const epochInfo = await connection.getEpochInfo();
    return {
      currentEpoch: epochInfo.epoch,
      epochProgress: (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100, // Progress as percentage
    };
  } catch (error) {
    console.error("Error fetching epoch information:", error);
    throw error;
  }
};

// Websocket
export const subscribeToSlotChanges = (callback) => {
    const subscriptionId = connection.onSlotChange((slotInfo) => {
      callback(slotInfo);
    });
    return () => connection.removeSlotChangeListener(subscriptionId);
};

export const fetchNetworkStatistics = async () => {
  try {
    // Fetch active nodes
    const clusterNodes = await connection.getClusterNodes();
    const activeNodes = clusterNodes.length; // Each entry in clusterNodes represents an active node

    return { totalBlocks, activeNodes };
  } catch (error) {
    console.error("Error fetching network statistics:", error);
    throw error;
  }
};

export const fetchTransactionMetrics = async () => {
  try {
    // Fetch transaction count (total transactions processed on the network)
    const txnCount = await connection.getTransactionCount();

    // Fetch TPS (transactions per second) using recent performance samples
    const txnPerSec = await connection.getRecentPerformanceSamples(1).then((samples) => {
      if (samples && samples.length > 0) {
        const { numTransactions, samplePeriodSecs } = samples[0];
        return numTransactions / samplePeriodSecs;
      }
      return 0;
    });

    return { txnCount, txnPerSec };
  } catch (error) {
    console.error("Error fetching transaction metrics:", error);
    throw error;
  }
};

export const fetchValidatorPerformance = async () => {
  try {
    // Fetch all validator information
    const validators = await connection.getVoteAccounts();

    // Process data for current validators
    const validatorStats = validators.current.map((validator) => ({
      pubkey: validator.votePubkey,
      uptime: (validator.activatedStake > 0 ? (validator.lastVote / validator.rootSlot) : 0).toFixed(2),
      skippedSlots: validator.rootSlot - validator.lastVote,
      rewards: validator.commission, // Commission is a proxy for validator rewards in % terms
    }));

    return validatorStats;
  } catch (error) {
    console.error("Error fetching validator performance:", error);
    throw error;
  }
};

export const fetchGasFeesMetrics = async () => {
  try {
    // Fetch recent block data to calculate average fees
    const recentBlockSlot = await connection.getSlot();
    const block = await connection.getBlock(recentBlockSlot, { maxSupportedTransactionVersion: 0 });

    if (!block || !block.transactions || block.transactions.length === 0) {
      return { averageFee: 0, totalFee: 0 };
    }

    // Calculate total fees for the block
    const totalFee = block.transactions.reduce((acc, txn) => {
      const fee = txn.meta?.fee || 0; // Ensure fee exists in transaction meta
      return acc + fee;
    }, 0);

    // Calculate average fees
    const averageFee = totalFee / block.transactions.length;

    return { averageFee, totalFee };
  } catch (error) {
    console.error("Error fetching gas fees metrics:", error);
    throw error;
  }
};

export const fetchClusterHealth = async () => {
  try {
    // Ping the network to measure latency
    const start = Date.now();
    await connection.getVersion(); // Simple RPC call to measure response time
    const networkPing = Date.now() - start;

    // Fetch node status information
    const nodes = await connection.getClusterNodes();
    const activeNodes = nodes.filter((node) => node.rpcState === "Connected");

    return {
      networkPing,
      totalNodes: nodes.length,
      activeNodes: activeNodes.length,
    };
  } catch (error) {
    console.error("Error fetching cluster health metrics:", error);
    throw error;
  }
};

export const fetchSolPrice = async () => {
  try {
    // TODO: add decentralized network
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    const data = await response.json();
    return data.solana.usd; // Extract SOL price in USD
  } catch (error) {
    console.error("Error fetching SOL price:", error);
    throw error;
  }
};

export const fetchFinalityTime = async () => {
  try {
    // Get the current slot
    const currentSlot = await connection.getSlot("finalized");

    // Fetch the finalized block details
    const finalizedBlock = await connection.getBlock(currentSlot);

    if (!finalizedBlock) {
      throw new Error("Finalized block not found");
    }

    // Get the block creation time
    const blockCreationTime = finalizedBlock.blockTime;

    if (!blockCreationTime) {
      throw new Error("Block creation time not available");
    }

    // Calculate the time difference between now and block creation
    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
    const finalityTime = currentTime - blockCreationTime;

    return finalityTime; // Time to finality in seconds
  } catch (error) {
    console.error("Error fetching finality time:", error);
    throw error;
  }
};