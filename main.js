let provider, signer, me;
let stake, kjc;

const $ = id => document.getElementById(id);
const toast = (m)=>{ const t=$('toast'); t.textContent=m; t.style.display='block'; setTimeout(()=>t.style.display='none',2500); };

function fmtUnits(bn, d=18, p=6){ try{ const s=ethers.utils.formatUnits(bn,d); const [i,dec='']=s.split('.'); return dec?`${i}.${dec.slice(0,p)}`:i; }catch{ return String(bn); } }
function hasFn(contract, name){ try{ return !!contract.interface.functions[name]; }catch{ return false; } }
function ts(x){ return x && x.toString()!=='0' ? new Date(Number(x)*1000).toLocaleString() : '-'; }

async function ensureChain(){ const id=await provider.send('eth_chainId',[]); if(id!==CONFIG.chainIdHex){ await provider.send('wallet_switchEthereumChain',[{chainId:CONFIG.chainIdHex}]); } }

async function connect(){
  if(!window.ethereum) return toast('กรุณาติดตั้ง MetaMask');
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts',[]);
  await ensureChain();
  signer = provider.getSigner();
  me = await signer.getAddress();
  $('addr').textContent = me.slice(0,6)+'…'+me.slice(-4);

  stake = new ethers.Contract(CONFIG.bigStake, BIGSTAKE_ABI, signer);
  kjc   = new ethers.Contract(CONFIG.kjc, ERC20_MINI_ABI, signer);

  $('ca').textContent = CONFIG.bigStake;
  await refreshAll();
}

async function refreshAll(){ await Promise.all([loadParams(), loadBalances(), refreshStakeInfo(true)]); }

async function loadParams(){
  try{
    let apr='-', lock='-';
    if (hasFn(stake,'APR_BPS()')) apr = (await stake.APR_BPS()).toString();
    else if (hasFn(stake,'REWARD_RATE_PER_YEAR()')) apr = (await stake.REWARD_RATE_PER_YEAR()).toString();

    if (hasFn(stake,'STAKE_DURATION()')) lock = Math.floor(Number(await stake.STAKE_DURATION())/86400);
    else if (hasFn(stake,'CLAIM_INTERVAL()')) lock = Math.floor(Number(await stake.CLAIM_INTERVAL())/86400);

    $('apr').textContent = apr;
    $('lockDays').textContent = lock;
  }catch(e){ console.error(e); }
}

async function loadBalances(){
  try{
    const [bal,allow] = await Promise.all([
      kjc.balanceOf(me),
      kjc.allowance(me, CONFIG.bigStake)
    ]);
    $('balKJC').textContent = fmtUnits(bal, CONFIG.decimals);
    $('allow').textContent  = fmtUnits(allow, CONFIG.decimals);
  }catch(e){ console.error(e); }
}

async function refreshStakeInfo(showToast){
  try{
    // แบบสัญญาใหม่
    if (hasFn(stake,'getStakeInfo(address)')){
      const info = await stake.getStakeInfo(me);
      $('stAmt').textContent = fmtUnits(info.amount, CONFIG.decimals);
      $('stStart').textContent = ts(info.start);

      // unlock จากสัญญาใหม่ = start + STAKE_DURATION
      let lockSec = 0;
      if (hasFn(stake,'STAKE_DURATION()')) lockSec = Number(await stake.STAKE_DURATION());
      $('stUnlock').textContent = info.start ? ts(ethers.BigNumber.from(info.start).add(lockSec)) : '-';
      $('stReward').textContent = fmtUnits(info.rewards, CONFIG.decimals);
      if (showToast) toast('รีเฟรชแล้ว');
      return;
    }

    // แบบสัญญาเก่า (มีหลายโพซิชัน — แสดง index 0)
    if (hasFn(stake,'stakes(address,uint256)')){
      const s0 = await stake.stakes(me, 0);
      $('stAmt').textContent = fmtUnits(s0.amount, CONFIG.decimals);
      $('stStart').textContent = ts(s0.startTime);
      const lock = Number(s0.lockPeriod||0);
      $('stUnlock').textContent = s0.startTime ? ts(ethers.BigNumber.from(s0.startTime).add(lock)) : '-';
      if (hasFn(stake,'pendingReward(address,uint256)')){
        const r = await stake.pendingReward(me,0);
        $('stReward').textContent = fmtUnits(r, CONFIG.decimals);
      } else {
        $('stReward').textContent = '-';
      }
      if (showToast) toast('รีเฟรชแล้ว');
      return;
    }

    // ถ้าไม่มีทั้งสองแบบ
    $('stAmt').textContent='-'; $('stStart').textContent='-'; $('stUnlock').textContent='-'; $('stReward').textContent='-';
  }catch(e){ console.error(e); }
}

async function doApprove(){
  try{
    const v = $('amount').value.trim();
    if(!v) return toast('ใส่จำนวน KJC ก่อน');
    const wei = ethers.utils.parseUnits(v, CONFIG.decimals);
    const tx = await kjc.approve(CONFIG.bigStake, wei);
    toast('กำลังอนุมัติ…'); await tx.wait(); toast('✅ Approve สำเร็จ');
    await loadBalances();
  }catch(e){ console.error(e); toast('❌ ' + (e?.data?.message || e.message)); }
}

async function doStake(){
  try{
    const v = $('amount').value.trim();
    if(!v) return toast('ใส่จำนวน KJC ก่อน');
    const wei = ethers.utils.parseUnits(v, CONFIG.decimals);
    const dSel = Number(document.getElementById('days').value || 0);

    const tx = await stake.stake(wei, dSel);
    toast('กำลังส่ง Stake…'); await tx.wait(); toast('✅ Stake สำเร็จ');
    $('amount').value='';
    await Promise.all([loadBalances(), refreshStakeInfo(true)]);
  }catch(e){ console.error(e); toast('❌ ' + (e?.data?.message || e.message)); }
}

async function doClaim(){
  try{
    let tx;
    if (hasFn(stake,'claimReward()')) tx = await stake.claimReward();
    else if (hasFn(stake,'claim(uint256)')) tx = await stake.claim(0);
    else return toast('ไม่พบฟังก์ชันเคลมในสัญญา');
    toast('กำลังเคลม…'); await tx.wait(); toast('✅ เคลมสำเร็จ');
    await refreshStakeInfo(true);
  }catch(e){ console.error(e); toast('❌ ' + (e?.data?.message || e.message)); }
}

async function doWithdraw(){
  try{
    let tx;
    if (hasFn(stake,'withdrawStake()')) tx = await stake.withdrawStake();
    else if (hasFn(stake,'unstake(uint256)')) tx = await stake.unstake(0);
    else return toast('ไม่พบฟังก์ชันถอนในสัญญา');
    toast('กำลังถอน…'); await tx.wait(); toast('✅ ถอนสำเร็จ');
    await Promise.all([loadBalances(), refreshStakeInfo(true)]);
  }catch(e){ console.error(e); toast('❌ ' + (e?.data?.message || e.message)); }
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
