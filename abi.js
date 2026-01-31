// ================================
// ABI : KJCBigStake
// ================================
const STAKING_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_kjc", "type": "address" },
      { "internalType": "uint256", "name": "_aprBps", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  // ===== Events =====
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true,  "internalType": "uint256", "name": "index", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }
    ],
    "name": "ClaimReward",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "to", "type": "address" }
    ],
    "name": "OwnerWithdraw",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "prev", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "next", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "aprBps", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "claimInterval", "type": "uint256" }
    ],
    "name": "ParamsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true,  "internalType": "uint256", "name": "index", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "lockDays", "type": "uint256" }
    ],
    "name": "Staked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true,  "internalType": "uint256", "name": "index", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "principal", "type": "uint256" }
    ],
    "name": "Unstaked",
    "type": "event"
  },

  // ===== View =====
  {
    "inputs": [],
    "name": "KJC",
    "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "REWARD_APR_BPS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CLAIM_INTERVAL",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SECONDS_PER_YEAR",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getStakeCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "stakes",
    "outputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "internalType": "uint256", "name": "lockPeriod", "type": "uint256" },
      { "internalType": "uint256", "name": "lastClaim", "type": "uint256" },
      { "internalType": "bool",    "name": "withdrawn", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "pendingReward",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "canUnstake",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "nextClaimTime",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== Actions =====
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "lockDays", "type": "uint256" }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ===== Owner =====
  {
    "inputs": [
      { "internalType": "uint256", "name": "aprBps", "type": "uint256" },
      { "internalType": "uint256", "name": "claimInterval", "type": "uint256" }
    ],
    "name": "setParams",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "n", "type": "address" }],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "address", "name": "to", "type": "address" }
    ],
    "name": "withdrawRemainingKJC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ================================
// ABI : Minimal ERC20 (KJC)
// ================================
const ERC20_MINI_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "_owner", "type": "address" },
      { "name": "_spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  }
];
