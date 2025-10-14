let provider, signer, me;
let stake, kjc;

const $ = (id)=>document.getElementById(id);
const toast = (m)=>{
  const t = $('toast'); t.textContent = m; t.style.display='block';
  setTimeout(()=>t.style.display='none', 2600);
};

async function ensureChain(){
  const chainId = await provider.send('eth_chainId',[]);
  if (chainId !== CONFIG.chainIdHex){
    await provider.send('wallet_switchEthereumChain', [{ chainId: CONFIG.chainIdHex }]);
  }
}

async function connect(){
  if (!window.ethereum) return toast('กรุณาติดตั้ง MetaMask');
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  await ensureChain();
  signer = provider.getSigner();
  me = await signer.getAddress();
  $('addr').textContent = me.slice(0,6)+'…'+me.slice(-4);

  // instances
  stake = new ethers.Contract(CONFIG.bigStake, BIGSTAKE_ABI, signer);
  kjc   = new ethers.Contract(CONFIG.kjc, ERC20_MINI_ABI, signer);

  $('ca').textContent = CONFIG.bigStake;
  await refreshAll();

  // events (optional, if the contract emits)
  provider.on('block', ()=> refreshStakeInfo(false));
}

async function refreshAll(){
  await Promise.all([loadParams(), loadBalances(), refreshStakeInfo(true)]);
}

async function loadParams(){
  try{
    const [aprBps, lockSec] = await Promise.all([
      stake.APR_BPS(), stake.STAKE_DURATION()
    ]);
    $('apr').textContent = aprBps.toString();
    $('lockDays').textContent = Math.floor(Number(lockSec)/86400);
  }catch(e){ console.error(e); }
}

async function loadBalances(){
  try{
    const [bal, allowance] = await Promise.all([
      kjc.balanceOf(me),
      kjc.allowance(me, CONFIG.bigStake)
    ]);
    $('balKJC').textContent = fmtUnits(bal, CONFIG.decimals);
    $('allow').textContent  = fmtUnits(allowance, CONFIG.decimals);
  }catch(e){ console.error(e); }
}

function tsToStr(ts){
  if (!ts || ts.toString()==='0') return '-';
  const d = new Date(Number(ts)*1000);
  return d.toLocaleString();
}

async function refreshStakeInfo(showToast){
  try{
    const info = await stake.getStakeInfo(me);
    const amt = info.amount;
    const start = info.start;
    const rew = info.rewards;
    $('stAmt').textContent = fmtUnits(amt, CONFIG.decimals);
    $('stStart').textContent = tsToStr(start);

    // unlock = start + STAKE_DURATION (จากสัญญา)
    const lockSec = await stake.STAKE_DURATION();
    const unlockTs = start.add(lockSec);
    $('stUnlock').textContent = tsToStr(unlockTs);

    $('stReward').textContent = fmtUnits(rew, CONFIG.decimals);
    if (showToast) toast('รีเฟรชข้อมูลแล้ว');
  }catch(e){ console.error(e); }
}

async function doApprove(){
  try{
    const amount = $('amount').value.trim();
    if (!amount) return toast('กรุณาใส่จำนวน KJC');
    const wei = ethers.utils.parseUnits(amount, CONFIG.decimals);
    const tx = await kjc.approve(CONFIG.bigStake, wei);
    toast('กำลังส่ง approve…'); await tx.wait(); toast('✅ Approve สำเร็จ');
    await loadBalances();
  }catch(e){ console.error(e); toast('❌ ไม่สำเร็จ: ' + (e?.data?.message || e.message)); }
}

async function doStake(){
  try{
    const amount = $('amount').value.trim();
    if (!amount) return toast('กรุณาใส่จำนวน KJC');
    const wei = ethers.utils.parseUnits(amount, CONFIG.decimals);

    const dSel = Number($('days').value||0); // 0 = ใช้ค่าจากสัญญา
    const tx = await stake.stake(wei, dSel);
    toast('กำลังส่งธุรกรรม stake…'); await tx.wait();
    toast('✅ Stake สำเร็จ');
    $('amount').value = '';
    await Promise.all([loadBalances(), refreshStakeInfo(true)]);
  }catch(e){ console.error(e); toast('❌ ไม่สำเร็จ: ' + (e?.data?.message || e.message)); }
}

async function doClaim(){
  try{
    const tx = await stake.claimReward();
    toast('กำลังเคลม…'); await tx.wait(); toast('✅ เคลมสำเร็จ');
    await refreshStakeInfo(true);
  }catch(e){ console.error(e); toast('❌ เคลมไม่ได้: ' + (e?.data?.message || e.message)); }
}

async function doWithdraw(){
  try{
    const tx = await stake.withdrawStake();
    toast('กำลังถอน…'); await tx.wait(); toast('✅ ถอนสำเร็จ');
    await Promise.all([loadBalances(), refreshStakeInfo(true)]);
  }catch(e){ console.error(e); toast('❌ ถอนผิดพลาด: ' + (e?.data?.message || e.message)); }
}

window.addEventListener('DOMContentLoaded', ()=>{
  $('ca').textContent = CONFIG.bigStake;
  $('btnConnect').onclick = connect;
  $('btnApprove').onclick = doApprove;
  $('btnStake').onclick = doStake;
  $('btnClaim').onclick = doClaim;
  $('btnWithdraw').onclick = doWithdraw;
  $('btnRefresh').onclick = ()=>refreshStakeInfo(true);
});
