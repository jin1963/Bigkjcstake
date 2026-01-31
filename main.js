// ===== Config =====
const CHAIN_HEX   = "0x38"; // BSC
const TOKEN_ADDR  = "0x2FB9b0F45278D62dc13Dc9F826F78e8E3774047D"; // KJC
const STAKE_ADDR  = "0xa5139bbB455F4484C61DB20815c2150b3EAEF83b"; // BigStake

const BSC_PARAMS = {
  chainId: "0x38",
  chainName: "BNB Smart Chain (BSC)",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com"]
};

// ===== Globals =====
let provider, web3, acct, kjc, stake;

// ===== Utils =====
const fmt = (bn, dec=18, p=6) => {
  try{
    if (!web3) return String(bn);
    if(dec!==18){
      const s = BigInt(bn).toString();
      const base = 10n**BigInt(dec);
      const i = (BigInt(s)/base).toString();
      let d = (BigInt(s)%base).toString().padStart(dec,'0').slice(0,p).replace(/0+$/,'');
      return d?`${i}.${d}`:i;
    }
    const v = web3.utils.fromWei(bn, 'ether');
    const [i,d=''] = v.split('.');
    return d?`${i}.${d.slice(0,p)}`:i;
  }catch{ return String(bn); }
};

const toUnits = (val,dec) => {
  const s = String(val).trim();
  const [i,f=''] = s.split('.');
  const bi = BigInt(i||'0')*(10n**BigInt(dec));
  const bf = BigInt((f+'0'.repeat(dec)).slice(0,dec));
  return (bi+bf).toString();
};

const short = a => a?`${a.slice(0,6)}...${a.slice(-4)}`:'-';
const el = id => document.getElementById(id);

// ===== Provider chooser (Bitget fix) =====
function getProvider(){
  const eth = window.ethereum;

  // กรณีมีหลาย provider ซ้อน (MetaMask + Bitget + OKX)
  if (eth?.providers?.length){
    return (
      eth.providers.find(p=>p?.isBitget) ||
      eth.providers.find(p=>p?.isBitKeep) ||
      eth.providers.find(p=>p?.isOKXWallet) ||
      eth.providers.find(p=>p?.isMetaMask) ||
      eth.providers[0]
    );
  }

  // fallback
  return window.bitget?.ethereum || window.okxwallet?.ethereum || window.bitkeep?.ethereum || eth || null;
}

// ===== Chain =====
async function ensureChain(){
  const cid = await provider.request({method:'eth_chainId'});
  if(cid?.toLowerCase() === CHAIN_HEX.toLowerCase()) return;

  try{
    await provider.request({method:'wallet_switchEthereumChain', params:[{chainId:CHAIN_HEX}]});
  }catch(e){
    // 4902 = ยังไม่มี chain นี้ → add
    if(e?.code === 4902){
      await provider.request({method:'wallet_addEthereumChain', params:[BSC_PARAMS]});
    }else{
      throw e;
    }
  }
}

// ===== Connect =====
async function connect(){
  try{
    provider = getProvider();
    if(!provider){ alert('ไม่พบกระเป๋า Web3 (MetaMask/Bitget/OKX)'); return; }

    web3 = new Web3(provider);

    // ✅ ขอ account ก่อน (สำคัญกับ Bitget)
    const accounts = await provider.request({method:'eth_requestAccounts'});
    acct = accounts?.[0];
    if(!acct){ alert('ไม่พบบัญชีในกระเป๋า'); return; }

    // ✅ แล้วค่อย ensure chain
    await ensureChain();

    // ต้องมี ABI จาก abi.js
    if(typeof ERC20_MINI_ABI === 'undefined' || typeof STAKING_ABI === 'undefined'){
      alert('❌ ไม่พบ ABI: ตรวจ abi.js ว่าประกาศ ERC20_MINI_ABI และ STAKING_ABI แล้ว');
      return;
    }

    kjc   = new web3.eth.Contract(ERC20_MINI_ABI, TOKEN_ADDR);
    stake = new web3.eth.Contract(STAKING_ABI,  STAKE_ADDR);

    el('acct').textContent = short(acct);
    el('contractAddr').textContent = STAKE_ADDR;

    await refreshParams();
    await refreshBalances();
    await loadStakes();

    provider.on?.('accountsChanged', ()=>location.reload());
    provider.on?.('chainChanged',   ()=>location.reload());
  }catch(e){
    console.error(e);
    alert('❌ Connect ล้มเหลว: '+(e?.message||e));
  }
}

async function refreshParams(){
  try{
    const apr = await stake.methods.REWARD_APR_BPS().call();
    const ci  = await stake.methods.CLAIM_INTERVAL().call();
    el('apr').textContent = apr;
    el('ci').textContent  = ci;
    const d = Math.round(Number(ci)/86400);
    el('ciHuman').textContent = `(≈ ${d} วัน)`;
  }catch(e){ console.warn(e); }
}

async function refreshBalances(){
  try{
    const dec = await kjc.methods.decimals().call();
    const bal = await kjc.methods.balanceOf(acct).call();
    const allow = await kjc.methods.allowance(acct, STAKE_ADDR).call();
    el('bal').textContent   = fmt(bal, Number(dec));
    el('allow').textContent = fmt(allow, Number(dec));
  }catch(e){ console.warn(e); }
}

async function doApprove(){
  try{
    const dec = await kjc.methods.decimals().call();
    const raw = el('amt').value || "0";
    if(!raw || Number(raw)<=0) return alert('กรอกจำนวน KJC ก่อน');
    const need = toUnits(raw, Number(dec));
    await kjc.methods.approve(STAKE_ADDR, need).send({from:acct});
    alert('✅ Approved สำเร็จ');
    await refreshBalances();
  }catch(e){ alert('❌ Approve ล้มเหลว: '+(e?.message||e)); }
}

async function doStake(){
  try{
    const dec = await kjc.methods.decimals().call();
    const raw = el('amt').value.trim();
    const days = Number(el('lockDays').value);
    if(!raw || Number(raw)<=0) return alert('กรอกจำนวน KJC ก่อน');
    const amt = toUnits(raw, Number(dec));

    const allow = await kjc.methods.allowance(acct, STAKE_ADDR).call();
    if(BigInt(allow) < BigInt(amt)){
      alert('Allowance ไม่พอ: โปรดกด Approve ให้พอ แล้วค่อย Stake อีกครั้ง');
      return;
    }

    await stake.methods.stake(amt, days).send({from:acct});
    alert('✅ Stake สำเร็จ');
    el('amt').value = '';
    await refreshBalances();
    await loadStakes();
  }catch(e){
    alert('❌ Stake ล้มเหลว: '+(e?.message||e));
    console.error(e);
  }
}

async function loadStakes(){
  const box = el('list');
  box.innerHTML = '';
  try{
    const cnt = Number(await stake.methods.getStakeCount(acct).call());
    if(cnt===0){ box.innerHTML = '<div class="muted">ยังไม่มีรายการ</div>'; return; }

    const dec = await kjc.methods.decimals().call();

    for(let i=0;i<cnt;i++){
      const s = await stake.methods.stakes(acct, i).call();
      const amt = fmt(s.amount, Number(dec));
      const st  = Number(s.startTime);
      const unlock = st + Number(s.lockPeriod);

      let pending = "0";
      try{ pending = fmt(await stake.methods.pendingReward(acct,i).call(), Number(dec)); }catch{}

      const canUn = await stake.methods.canUnstake(acct,i).call();

      const div = document.createElement('div');
      div.className = 'stake';
      div.innerHTML = `
        <div><b>Index</b> #${i}</div>
        <div>Amount: <span class="mono">${amt}</span> KJC</div>
        <div>Start: ${st?new Date(st*1000).toLocaleString(): '-'}</div>
        <div>Unlock: ${unlock?new Date(unlock*1000).toLocaleString(): '-'}</div>
        <div>Pending: <span class="mono">${pending}</span> KJC</div>
        <div class="row" style="margin-top:8px;gap:8px">
          <button id="claim-${i}">Claim</button>
          <button id="unstake-${i}" ${canUn?'':'disabled'}>Unstake</button>
        </div>
      `;
      box.appendChild(div);

      document.getElementById(`claim-${i}`).onclick = async()=>{
        try{ await stake.methods.claim(i).send({from:acct}); alert('✅ Claimed'); await loadStakes(); }
        catch(e){ alert('❌ Claim ล้มเหลว: '+(e?.message||e)); }
      };
      document.getElementById(`unstake-${i}`).onclick = async()=>{
        try{ await stake.methods.unstake(i).send({from:acct}); alert('✅ Unstaked'); await loadStakes(); await refreshBalances(); }
        catch(e){ alert('❌ Unstake ล้มเหลว: '+(e?.message||e)); }
      };
    }
  }catch(e){
    console.error(e);
    box.innerHTML = '<div class="muted">โหลดรายการไม่สำเร็จ</div>';
  }
}

// ===== wire UI =====
window.addEventListener('DOMContentLoaded', ()=>{
  el('contractAddr').textContent = STAKE_ADDR;
  el('connectBtn').onclick = connect;
  el('approveBtn').onclick = doApprove;
  el('stakeBtn').onclick = doStake;
});
