// ------- CONFIG (BSC Mainnet) -------
const CONFIG = {
  chainIdHex: '0x38',
  rpcUrl: 'https://bsc-dataseed.binance.org',
  kjc: '0x2FB9b0F45278D62dc13Dc9F826F78e8E3774047D',
  bigStake: '0xa5139bbB455F4484C61DB20815c2150b3EAEF83b',
  decimals: 18
};

// formatter
function fmtUnits(bn, d=18, p=6){
  try{
    const s = ethers.utils.formatUnits(bn, d);
    const [i, dec=''] = s.split('.');
    return dec ? `${i}.${dec.slice(0,p)}` : i;
  }catch{ return bn?.toString?.() ?? String(bn); }
}
