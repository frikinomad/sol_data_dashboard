import { Connection, clusterApiUrl, PublicKey  } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { Buffer } from 'buffer';
window.Buffer = Buffer;

// const network = "mainnet-beta"
// const network = "devnet"
// const connection = new Connection(clusterApiUrl(network), "confirmed");

export const fetchLatestBlock = async (connection) => {
  try {
    const blockHeight = await connection.getBlockHeight();
    const block = await connection.getBlock(blockHeight, { maxSupportedTransactionVersion: 0 });
    return { blockHeight, block };
  } catch (error) {
    console.error("Error fetching block data:", error);
    throw error;
  }
};

export const fetchEpochInfo = async (connection) => {
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
export const subscribeToSlotChanges = (callback, connection) => {
    const subscriptionId = connection.onSlotChange((slotInfo) => {
      callback(slotInfo);
    });
    return () => connection.removeSlotChangeListener(subscriptionId);
};

export const fetchNetworkStatistics = async (connection) => {
  try {
    // Fetch active nodes
    const clusterNodes = await connection.getClusterNodes();
    const activeNodes = clusterNodes.length; // Each entry in clusterNodes represents an active node

    return { activeNodes };
  } catch (error) {
    console.error("Error fetching network statistics:", error);
    throw error;
  }
};

export const fetchTransactionMetrics = async (connection) => {
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

export const fetchGasFeesMetrics = async (connection) => {
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

export const fetchClusterHealth = async (connection) => {
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

export const fetchSolPrice = async (connection) => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    const data = await response.json();
    return data.solana.usd; // Extract SOL price in USD
  } catch (error) {
    console.error("Error fetching SOL price:", error);
    throw error;
  }
};

export const fetchFinalityTime = async (connection) => {
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

export const fetchTransaction = async (id, connection) => {
  if (!id || id.length !== 88) {  // Basic Solana signature length check
    return { error: 'Invalid transaction signature format' };
  }

  try {
    const tx = await connection.getTransaction(id, { 
      commitment: 'confirmed' 
    });
    return tx || { error: 'Transaction not found' };
  } catch (e) {
    return { error: 'Invalid transaction signature' };
  }
};

export const fetchWallet = async (publicKey, connection) => {
  try {
    if(!publicKey){
      return {
        error: 'Failed to fetch wallet data',
        errorDetail: error.message
      };
    }

    // Get all token accounts owned by the wallet address
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(publicKey),
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    // Format the token data
    const tokenBalances = tokenAccounts.value.map((account) => {
      const parsedAccountData = account.account.data.parsed;
      const mintAddress = parsedAccountData.info.mint;
      const tokenBalance = parsedAccountData.info.tokenAmount;
      
      return {
        mint: mintAddress,
        balance: tokenBalance.uiAmount,
        decimals: tokenBalance.decimals,
        isAssociatedToken: account.pubkey.toString() === account.account.owner.toString(),
        tokenAccount: account.pubkey.toString()
      };
    });

    // Get SOL balance
    const solBalance = await connection.getBalance(publicKey);

    return {
      tokens: tokenBalances,
      solBalance: solBalance / 1e9, // Convert lamports to SOL
      address: publicKey.toString()
    };

  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return {
      error: 'Failed to fetch wallet data',
      errorDetail: error.message
    };
  }
};

export const fetchWalletTx = async (publicKey, connection) => {
  if (!publicKey) {
    return {
      error: "Public Key undefined or null",
      errorDetail: "Please provide a valid public key.",
    };
  }

  try {
    
    const pubKey = new PublicKey(publicKey);

    // Fetch signatures for the last 5 transactions
    const signatures = await connection.getSignaturesForAddress(
      pubKey,
      { limit: 5 }
    );
    

    if (!signatures || signatures.length === 0) {
      return {
        error: "No transactions found",
        transactions: [],
      };
    }

    // Fetch detailed transaction information for each signature
    const transactionPromises = signatures.map(async (signature) => {
      const transactionDetails = await connection.getTransaction(
        signature.signature,
        { commitment: "confirmed" }
      );
      return {
        signature: signature.signature,
        slot: transactionDetails?.slot || null,
        blockTime: transactionDetails?.blockTime || null,
        fee: transactionDetails?.meta?.fee || null,
        status: transactionDetails?.meta?.err ? "Failed" : "Success",
        instructions: transactionDetails?.transaction.message.instructions || [],
      };
    });

    const transactions = await Promise.all(transactionPromises);

    return {
      error: null,
      transactions,
    };
  } catch (error) {
    return {
      error: "Failed to fetch transactions",
      errorDetail: error.message,
    };
  }
};