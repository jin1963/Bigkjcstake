// ====== CONFIG ======
const CONFIG = {
  chainIdHex: "0x38", // BSC mainnet
  KJC: "0x2FB9b0F45278D62dc13Dc9F826F78e8E3774047D",
  STAKING: "0xa5139bbB455F4484C61DB20815c2150b3EAEF83b",
  kjcDecimals: 18,
};

// ====== helpers ======
const toBig = (x) => BigInt(x.toString());
function toUnits(amount, decimals = 18) {
  const s = String(amount);
  const [i, f = ""] = s.split(".");
  const base = 10n ** BigInt(decimals);
  const int = toBig(i || "0") * base;
  const frac = f ? toBig((f + "0".repeat(decimals)).slice(0, decimals)) : 0n;
  return (int + frac).toString();
}
function fmtUnits(bn, decimals = 18, p = 6) {
  try {
    const v = BigInt(bn);
    const base = 10n ** BigInt(decimals);
    const i = (v / base).toString();
    let d = (v % base).toString().padStart(decimals, "0");
    d = p >= 0 ? d.slice(0, p) : d;
    d = d.replace(/0+$/, "");
    return d ? `${i}.${d}` : i;
  } catch { return String(bn); }
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => t.style.display = "none", 2500);
}

// ====== state ======
let provider, web3, user, token, staking;

// ====== init ======
window.addEventListener("DOMContentLoaded", async () => {
  if (typeof Web3 === "undefined") {
    alert("ไม่พบ Web3.js — กรุณาโหลดจาก CDN ให้เรียบร้อย");
    return;
  }
  provider = window.ethereum || window.bitget?.ethereum || window.okxwallet?.ethereum || window.bitkeep?.ethereum;
  if (!provider) {
    alert("⚠️ ไม่พบกระเป๋า Web3 (MetaMask/Bitget/OKX)");
    return;
  }

  web3 = new Web3(provider);
  token = new web3.eth.Contract(ERC20_MINI_ABI, CONFIG.KJC);
  staking = new web3.eth.Contract(STAKING_ABI, CONFIG.STAKING);

  // UI
  document.getElementById("ca").textContent = CONFIG.STAKING;
  document.getElementById("btnConnect").onclick = connect;
  document.getElementById("btnApprove").onclick = doApprove;
  document.getElementById("btnStake").onclick = doStake;
  document.getElementById("lockDays").onchange = () => {
    document.getElementById("lockLabel").textContent = document.getElementById("lockDays").value + " วัน";
  };

  provider.on?.("accountsChanged", () => location.reload());
  provider.on?.("chainChanged", () => location.reload());

  await loadParams();
});

async function ensureChain() {
  const chainId = await provider.request({ method: "eth_chainId" });
  if (chainId !== CONFIG.chainIdHex) {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CONFIG.chainIdHex }] });
  }
}

async function connect() {
  try {
    await ensureChain();
    const accs = await provider.request({ method: "eth_requestAccounts" });
    user = accs[0];
    document.getElementById("who").textContent = user;
    await refreshBalances();
    await loadStakes();
  } catch (e) {
    alert("เชื่อมต่อไม่สำเร็จ: " + (e?.message || e));
  }
}

// ====== reads ======
async function loadParams() {
  try {
    const apr = await staking.methods.REWARD_APR_BPS().call();
    const interval = await staking.methods.CLAIM_INTERVAL().call();
    document.getElementById("apr").textContent = apr;
    document.getElementById("interval").textContent = interval;
    document.getElementById("lockLabel").textContent = document.getElementById("lockDays").value + " วัน";
  } catch (e) {
    console.warn("loadParams:", e);
  }
}

async function refreshBalances() {
  if (!user) return;
  try {
    const bal = await token.methods.balanceOf(user).call();
    const allow = await token.methods.allowance(user, CONFIG.STAKING).call();
    document.getElementById("balKJC").textContent = fmtUnits(bal, CONFIG.kjcDecimals);
    document.getElementById("allowKJC").textContent = fmtUnits(allow, CONFIG.kjcDecimals);
  } catch (e) {
    console.warn("refreshBalances:", e);
  }
}

// ====== actions ======
async function doApprove() {
  if (!user) return alert("กรุณาเชื่อมต่อกระเป๋าก่อน");
  try {
    const raw = document.getElementById("amount").value.trim();
    if (!raw || Number(raw) <= 0) return alert("กรุณาใส่จำนวนที่จะ stake");
    const need = toUnits(raw, CONFIG.kjcDecimals);
    await token.methods.approve(CONFIG.STAKING, need).send({ from: user });
    showToast("✅ Approved สำเร็จ");
    await refreshBalances();
  } catch (e) {
    alert("Approve fail: " + (e?.message || e));
  }
}

async function doStake() {
  if (!user) return alert("กรุณาเชื่อมต่อกระเป๋าก่อน");
  try {
    const raw = document.getElementById("amount").value.trim();
    const days = Number(document.getElementById("lockDays").value || "0");
    if (!raw || Number(raw) <= 0) return alert("กรุณาใส่จำนวนที่จะ stake");
    const amt = toUnits(raw, CONFIG.kjcDecimals);

    // ตรวจ allowance
    const allow = await token.methods.allowance(user, CONFIG.STAKING).call();
    if (toBig(allow) < toBig(amt)) {
      return alert("กรุณา Approve ให้เพียงพอก่อน (กดปุ่ม Approve)");
    }

    await staking.methods.stake(amt, days).send({ from: user });
    showToast("✅ Stake สำเร็จ");
    document.getElementById("amount").value = "";
    await refreshBalances();
    await loadStakes();
  } catch (e) {
    console.error(e);
    alert("Stake fail: " + (e?.message || e));
  }
}

// ====== list stakes ======
async function loadStakes() {
  const box = document.getElementById("stakes");
  box.innerHTML = "กำลังโหลด…";
  if (!user) { box.textContent = "กรุณาเชื่อมต่อกระเป๋า"; return; }

  try {
    const count = Number(await staking.methods.getStakeCount(user).call());
    if (count === 0) { box.textContent = "ยังไม่มีรายการ"; return; }

    const items = [];
    for (let i = 0; i < count; i++) {
      const s = await staking.methods.stakes(user, i).call();
      items.push({ ...s, index: i });
    }

    box.innerHTML = "";
    for (const s of items) {
      const amt = fmtUnits(s.amount, CONFIG.kjcDecimals);
      const start = Number(s.startTime) ? new Date(Number(s.startTime)*1000).toLocaleString() : "-";
      const unlockTs = Number(s.startTime) + Number(s.lockPeriod);
      const unlock = unlockTs ? new Date(unlockTs*1000).toLocaleString() : "-";

      // pending
      let pending = "0";
      try {
        const p = await staking.methods.pendingReward(user, s.index).call();
        pending = fmtUnits(p, CONFIG.kjcDecimals);
      } catch {}

      const row = document.createElement("div");
      row.className = "stake-item";
      row.innerHTML = `
        <div><b>Index #${s.index}</b></div>
        <div>Amount: ${amt} KJC</div>
        <div>Start: ${start}</div>
        <div>Unlock: ${unlock}</div>
        <div>Pending: ${pending} KJC</div>
      `;

      // ปุ่ม Claim (อ้างอิง CLAIM_INTERVAL)
      try {
        const next = await staking.methods.nextClaimTime(user, s.index).call();
        const canClaim = Number(next) > 0 && Math.floor(Date.now()/1000) >= Number(next);
        const btnC = document.createElement("button");
        btnC.textContent = canClaim ? "Claim" : "Claim (ยังไม่ถึงเวลา)";
        btnC.disabled = !canClaim;
        btnC.onclick = async () => {
          try {
            await staking.methods.claim(s.index).send({ from: user });
            showToast("✅ Claimed");
            await refreshBalances();
            await loadStakes();
          } catch (e) { alert("Claim fail: " + (e?.message || e)); }
        };
        row.appendChild(btnC);
      } catch {}

      // ปุ่ม Unstake
      try {
        const can = await staking.methods.canUnstake(user, s.index).call();
        const btnU = document.createElement("button");
        btnU.textContent = can ? "Unstake" : "Unstake (ยังล็อกอยู่)";
        btnU.disabled = !can;
        btnU.onclick = async () => {
          try {
            await staking.methods.unstake(s.index).send({ from: user });
            showToast("✅ Unstaked");
            await refreshBalances();
            await loadStakes();
          } catch (e) { alert("Unstake fail: " + (e?.message || e)); }
        };
        row.appendChild(btnU);
      } catch {}

      box.appendChild(row);
    }
  } catch (e) {
    console.error(e);
    box.textContent = "โหลดรายการไม่สำเร็จ";
  }
}
