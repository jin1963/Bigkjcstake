// === main.js (อัปเดตตรงกับ ABI BigStake) ===

let web3, provider, user, token, contract;

async function initWeb3() {
  provider = window.ethereum || window.bitget?.ethereum;
  if (!provider) return alert("⚠️ โปรดเปิดด้วย MetaMask หรือ Bitget Wallet");

  web3 = new Web3(provider);
  token = new web3.eth.Contract(erc20ABI, "0x2FB9b0F45278D62dc13Dc9F826F78e8E3774047D"); // KJC
  contract = new web3.eth.Contract(stakingABI, "0xa5139bbB455F4484C61DB20815c2150b3EAEF83b"); // BigStake

  provider.on?.("accountsChanged", () => location.reload());
  provider.on?.("chainChanged", () => location.reload());

  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("stakeButton").onclick = stakeTokens;
}

window.addEventListener("load", initWeb3);

async function connectWallet() {
  try {
    const accs = await provider.request({ method: "eth_requestAccounts" });
    user = accs[0];
    document.getElementById("status").innerHTML = `✅ Connected: ${user}`;
  } catch (err) {
    alert("❌ เชื่อมกระเป๋าไม่สำเร็จ\n" + (err.message || err));
  }
}

async function stakeTokens() {
  if (!user) return alert("กรุณาเชื่อมต่อกระเป๋าก่อน");
  const raw = document.getElementById("stakeAmount").value.trim();
  const days = Number(document.getElementById("stakeTier").value || "0");
  if (!raw || Number(raw) <= 0) return alert("กรุณากรอกจำนวนที่จะ stake");

  try {
    const decimals = await token.methods.decimals().call();
    const amountWei = web3.utils.toBN(web3.utils.toWei(raw, "ether"));
    const allowance = await token.methods.allowance(user, contract._address).call();

    if (BigInt(allowance) < BigInt(amountWei)) {
      await token.methods.approve(contract._address, amountWei).send({ from: user });
      alert("✅ Approved แล้ว กรุณากด Stake อีกครั้ง");
      return;
    }

    const tx = await contract.methods.stake(amountWei, days).send({ from: user, gas: 600000 });
    console.log("Stake TX:", tx);
    alert("✅ Stake สำเร็จ");
  } catch (err) {
    console.error(err);
    alert("❌ Stake ล้มเหลว: " + (err?.data?.message || err?.message || err));
  }
}
