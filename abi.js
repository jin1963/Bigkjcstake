// abi.js — รวมทั้งชื่อแบบเก่า/ใหม่ให้เลือกใช้ได้อัตโนมัติ

// KJC Big Stake (รวมฟังก์ชันที่พบบ่อยไว้หลายแบบ)
const BIGSTAKE_ABI = [
  // views (ชื่อใหม่)
  {"inputs":[],"name":"APR_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"STAKE_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},

  // views (ชื่อเก่า)
  {"inputs":[],"name":"REWARD_RATE_PER_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"CLAIM_INTERVAL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},

  // ดึงสถานะ stake แบบสัญญาใหม่
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],
   "name":"getStakeInfo",
   "outputs":[
     {"internalType":"uint256","name":"amount","type":"uint256"},
     {"internalType":"uint256","name":"start","type":"uint256"},
     {"internalType":"uint256","name":"rewards","type":"uint256"},
     {"internalType":"bool","name":"withdrawn","type":"bool"}
   ],
   "stateMutability":"view","type":"function"},

  // ดึงสถานะ/รางวัลแบบสัญญาเก่า (หลายโพซิชัน)
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],
   "name":"getStakeCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
   "stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],
   "name":"pendingReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
   "stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],
   "name":"stakes","outputs":[
     {"internalType":"uint256","name":"amount","type":"uint256"},
     {"internalType":"uint256","name":"startTime","type":"uint256"},
     {"internalType":"uint256","name":"lockPeriod","type":"uint256"},
     {"internalType":"uint256","name":"lastClaimTime","type":"uint256"},
     {"internalType":"bool","name":"claimed","type":"bool"}
   ],"stateMutability":"view","type":"function"},

  // actions – stake (ทั้งแบบใหม่/เก่า ใช้ชื่อ stake เหมือนกัน)
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"daysLock","type":"uint256"}],
   "name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},

  // actions – claim (ชื่อใหม่)
  {"inputs":[],"name":"claimReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  // actions – claim (ชื่อเก่า ต้องมี index)
  {"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],
   "name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},

  // actions – withdraw (ชื่อใหม่)
  {"inputs":[],"name":"withdrawStake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  // actions – withdraw (ชื่อเก่า ต้องมี index)
  {"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],
   "name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

// Minimal ERC20
const ERC20_MINI_ABI = [
  {"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function"},
  {"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"type":"function"},
  {"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"}
];
