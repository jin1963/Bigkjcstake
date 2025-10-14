// ------- ABI ของ KJCBigStake -------
const BIGSTAKE_ABI = [
  {"inputs":[
    {"internalType":"address","name":"_kjc","type":"address"},
    {"internalType":"uint256","name":"_aprBps","type":"uint256"}],
   "stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"KJC","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],
   "stateMutability":"view","type":"function"},
  {"inputs":[],"name":"APR_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
   "stateMutability":"view","type":"function"},
  {"inputs":[],"name":"STAKE_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
   "stateMutability":"view","type":"function"},

  {"inputs":[
      {"internalType":"uint256","name":"amount","type":"uint256"},
      {"internalType":"uint256","name":"daysLock","type":"uint256"}],
   "name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"claimReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"withdrawStake","outputs":[],"stateMutability":"nonpayable","type":"function"},

  {"inputs":[{"internalType":"address","name":"user","type":"address"}],
   "name":"getStakeInfo","outputs":[
     {"internalType":"uint256","name":"amount","type":"uint256"},
     {"internalType":"uint256","name":"start","type":"uint256"},
     {"internalType":"uint256","name":"rewards","type":"uint256"},
     {"internalType":"bool","name":"withdrawn","type":"bool"}],
   "stateMutability":"view","type":"function"}
];

// ------- Minimal ERC20 -------
const ERC20_MINI_ABI = [
  {"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function"},
  {"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"type":"function"},
  {"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"}
];
