import {
  useSignAndExecuteTransaction,
  useSuiClient,
  useCurrentAccount,
  useDisconnectWallet,
  useConnectWallet,
  useWallets,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

const PACKAGE   = import.meta.env.VITE_PACKAGE_ID;
const NFT_TYPE  = `${PACKAGE}::lootbox::LootNFT`;
const COOLDOWN  = 8; // seconds between mints

const REWARDS = {
  1: { label: "Common NFT", emoji: "🎁", color: "#a0c4ff", glow: "#a0c4ff", pct: "70%", tier: "COMMON", desc: "A common loot drop — yours forever on-chain." },
  2: { label: "Rare NFT",   emoji: "💎", color: "#b48eff", glow: "#b48eff", pct: "25%", tier: "RARE",   desc: "A rare find. Only 1 in 4 chests holds this." },
  3: { label: "Epic NFT",   emoji: "🔥", color: "#ff9f43", glow: "#ff6b35", pct: "5%",  tier: "EPIC",   desc: "Legendary. Only 1 in 20. You're one of the few." },
};

/* ── Helpers ── */
function nameToReward(nameArr) {
  if (!nameArr) return null;
  const str = Array.isArray(nameArr) ? String.fromCharCode(...nameArr) : String(nameArr);
  if (str.includes("Epic"))   return 3;
  if (str.includes("Rare"))   return 2;
  if (str.includes("Common")) return 1;
  return null;
}
function decodeUrl(u) {
  if (!u) return null;
  if (typeof u === "string") return u;
  if (Array.isArray(u)) return String.fromCharCode(...u);
  return null;
}

/* ── Sound engine (Web Audio API — no files needed) ── */
function createSound() {
  let ctx = null;
  const get = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; };

  function play(freq, type, duration, vol = 0.3, delay = 0) {
    try {
      const ac = get();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ac.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ac.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
      osc.start(ac.currentTime + delay);
      osc.stop(ac.currentTime + delay + duration + 0.05);
    } catch (_) {}
  }

  return {
    click() { play(440, "sine", 0.08, 0.15); },
    loading() {
      [200, 250, 300].forEach((f, i) => play(f, "sine", 0.15, 0.12, i * 0.12));
    },
    common() {
      play(523, "triangle", 0.3, 0.25);
      play(659, "triangle", 0.3, 0.20, 0.15);
      play(784, "triangle", 0.4, 0.25, 0.30);
    },
    rare() {
      [523, 659, 784, 1047].forEach((f, i) => play(f, "sine", 0.35, 0.22, i * 0.1));
      play(1047, "sine", 0.6, 0.3, 0.5);
    },
    epic() {
      [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => {
        play(f, "sawtooth", 0.4, 0.18, i * 0.08);
        play(f * 1.5, "sine", 0.25, 0.12, i * 0.08 + 0.04);
      });
      play(1047, "sine", 1.0, 0.35, 0.7);
    },
    error() { play(200, "sawtooth", 0.3, 0.2); play(150, "sawtooth", 0.3, 0.2, 0.15); },
  };
}
const SFX = createSound();

/* ── Confetti burst ── */
function Confetti({ color }) {
  const pieces = useRef(
    Array.from({ length: 22 }, (_, i) => ({
      x: 45 + Math.random() * 10,
      dx: (Math.random() - 0.5) * 180,
      dy: -(Math.random() * 220 + 80),
      rot: Math.random() * 360,
      drot: (Math.random() - 0.5) * 720,
      size: Math.random() * 7 + 4,
      delay: Math.random() * 0.2,
      color: [color, "#ffd700", "#ffffff", "#ff9f43"][i % 4],
    }))
  ).current;

  return (
    <div className="confetti-wrap" aria-hidden>
      {pieces.map((p, i) => (
        <div key={i} className="confetti-piece" style={{
          left: `${p.x}%`,
          width: p.size, height: p.size,
          background: p.color,
          "--dx": `${p.dx}px`,
          "--dy": `${p.dy}px`,
          "--rot": `${p.rot}deg`,
          "--drot": `${p.drot}deg`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}

/* ── Floating particle ── */
function Particle({ color }) {
  const s = useRef({
    w: Math.random() * 6 + 3, l: Math.random() * 100, t: Math.random() * 100,
    dur: Math.random() * 4 + 3, del: Math.random() * 3, op: Math.random() * 0.6 + 0.2,
  }).current;
  return <div style={{
    position: "absolute", width: s.w, height: s.w, borderRadius: "50%",
    background: color, left: `${s.l}%`, top: `${s.t}%`,
    animation: `floatParticle ${s.dur}s ease-in-out infinite`,
    animationDelay: `${s.del}s`, opacity: s.op, boxShadow: `0 0 8px ${color}`,
  }} />;
}

/* ── Animated chest ── */
function ChestIcon({ phase, reward }) {
  const r = reward ? REWARDS[reward] : null;
  const isShaking  = phase === "signing" || phase === "loading";
  const isOpened   = phase === "reveal";
  const isIdle     = phase === "idle" || phase === "cooldown";

  return (
    <div className={`chest-wrap ${isShaking ? "shaking" : ""} ${isOpened ? "opened" : ""} ${isIdle ? "idle-float" : ""}`}>
      {r && <div className="chest-ring" style={{ borderColor: r.color + "55", boxShadow: `0 0 40px ${r.glow}44` }} />}
      <div className="chest-glow" style={r ? { background: r.glow, opacity: 0.55 } : {}} />
      <svg viewBox="0 0 120 100" className="chest-svg" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="97" rx="38" ry="5" fill="rgba(0,0,0,0.4)" />
        <rect x="10" y="50" width="100" height="45" rx="6" fill="#2a1a0e" stroke="#c8922a" strokeWidth="2.5" />
        <path d="M10 55 Q10 20 60 18 Q110 20 110 55 Z"
          fill={r ? "#3d2a0a" : "#1e130a"} stroke="#c8922a" strokeWidth="2.5"
          className={isOpened ? "lid-open" : ""}
          style={{ transformOrigin: "60px 55px", transition: "transform 0.7s cubic-bezier(.68,-0.55,.27,1.55)" }}
        />
        <rect x="10" y="52" width="100" height="6" rx="2" fill="#c8922a" opacity="0.6" />
        <rect x="52" y="50" width="16" height="14" rx="3" fill="#c8922a" />
        <circle cx="60" cy="57" r="4" fill="#1e130a" stroke="#ffd700" strokeWidth="1.5" />
        {[20, 40, 80, 100].map(x => <circle key={x} cx={x} cy="58" r="2.5" fill="#c8922a" opacity="0.8" />)}
        {r && <ellipse cx="60" cy="55" rx="35" ry="15" fill={r.glow} opacity="0.35" style={{ filter: "blur(4px)" }} />}
      </svg>
      {r && <div className="reward-burst">{r.emoji}</div>}
    </div>
  );
}

/* ── Reveal Modal ── */
function RevealModal({ rewardId, nftObjectId, txDigest, imageUrl, onClose }) {
  const r = REWARDS[rewardId];
  if (!r) return null;
  const shortId = nftObjectId ? nftObjectId.slice(0,8) + "..." + nftObjectId.slice(-6) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ "--mc": r.color, "--mg": r.glow }}
        onClick={e => e.stopPropagation()}>

        {/* Confetti */}
        <Confetti color={r.color} />

        {/* Close */}
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Chain badge */}
        <div className="modal-badge" style={{ background: r.color+"18", borderColor: r.color+"55", color: r.color }}>
          ⛓ MINTED ON SUI BLOCKCHAIN
        </div>

        {/* NFT image */}
        <NFTImage imageUrl={imageUrl} emoji={r.emoji} color={r.color} glow={r.glow} size={180} />

        {/* Tier + name */}
        <div className="modal-tier" style={{ color: r.color }}>{r.tier}</div>
        <div className="modal-name" style={{ color: r.color }}>{r.label}</div>
        <div className="modal-desc">{r.desc}</div>

        {/* Stats row */}
        <div className="modal-stats">
          <div className="modal-stat">
            <div className="modal-stat-val" style={{ color: r.color }}>{r.pct}</div>
            <div className="modal-stat-lbl">Drop Rate</div>
          </div>
          <div className="modal-stat-divider" />
          <div className="modal-stat">
            <div className="modal-stat-val">0.01</div>
            <div className="modal-stat-lbl">SUI Paid</div>
          </div>
          <div className="modal-stat-divider" />
          <div className="modal-stat">
            <div className="modal-stat-val" style={{ color: "#4cff8f" }}>✓</div>
            <div className="modal-stat-lbl">On-Chain</div>
          </div>
        </div>

        {shortId && (
          <div className="modal-object-id">
            <span className="modal-id-label">Object ID</span>
            <span className="modal-id-val">{shortId}</span>
          </div>
        )}

        {/* Links */}
        <div className="modal-links">
          {nftObjectId && (
            <a href={`https://suiscan.xyz/testnet/object/${nftObjectId}`}
              target="_blank" rel="noreferrer" className="modal-link-btn"
              style={{ borderColor: r.color+"88", color: r.color }}>
              🔍 View NFT on Suiscan
            </a>
          )}
          {txDigest && (
            <a href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
              target="_blank" rel="noreferrer" className="modal-link-btn modal-link-ghost">
              📋 View Transaction
            </a>
          )}
        </div>

        <div className="modal-owned">✅ Permanently owned by your wallet</div>
      </div>
    </div>
  );
}

/* ── NFT Image ── */
function NFTImage({ imageUrl, emoji, color, glow, size = 140 }) {
  const [errored, setErrored] = useState(false);
  if (imageUrl && !errored) return (
    <div className="nft-img-wrap" style={{ width: size, height: size, boxShadow: `0 0 30px ${glow}55`, borderColor: color+"55" }}>
      <img src={imageUrl} alt="NFT" className="nft-img" onError={() => setErrored(true)} />
      <div className="nft-img-shine" />
    </div>
  );
  return (
    <div className="nft-img-wrap nft-img-fallback" style={{
      width: size, height: size,
      background: `radial-gradient(circle at 50% 40%, ${glow}33, transparent 70%)`,
      boxShadow: `0 0 24px ${glow}44`, borderColor: color+"55",
    }}>
      <div style={{ fontSize: size * 0.38, lineHeight: 1 }}>{emoji}</div>
    </div>
  );
}

/* ── NFT Card (right panel) ── */
function NFTCard({ rewardId, nftObjectId, txDigest, imageUrl, onExpand }) {
  const r = REWARDS[rewardId];
  if (!r) return null;
  const shortId = nftObjectId ? nftObjectId.slice(0,8) + "..." + nftObjectId.slice(-6) : null;
  return (
    <div className="nft-card" style={{ borderColor: r.color, boxShadow: `0 0 40px ${r.glow}33` }}>
      <div className="nft-card-badge" style={{ background: r.color+"22", borderColor: r.color+"55", color: r.color }}>
        ⛓ MINTED ON SUI
      </div>
      <NFTImage imageUrl={imageUrl} emoji={r.emoji} color={r.color} glow={r.glow} size={140} />
      <div className="nft-tier-label" style={{ color: r.color }}>{r.tier}</div>
      <div className="nft-name" style={{ color: r.color }}>{r.label}</div>
      <div className="nft-desc">{r.desc}</div>
      <div className="nft-meta">
        {[
          ["Drop Rate", r.pct, r.color],
          ["Price Paid", "0.01 SUI", null],
          ["Network", "Sui Testnet", null],
          shortId ? ["Object ID", shortId, null] : null,
        ].filter(Boolean).map(([k, v, c]) => (
          <div className="nft-meta-row" key={k}>
            <span className="nft-meta-key">{k}</span>
            <span className="nft-meta-val nft-meta-mono" style={c ? { color: c } : {}}>{v}</span>
          </div>
        ))}
      </div>
      <div className="nft-links">
        <button className="nft-link-btn" style={{ borderColor: r.color+"88", color: r.color }} onClick={onExpand}>
          🎉 View Full Reveal
        </button>
        {nftObjectId && (
          <a href={`https://suiscan.xyz/testnet/object/${nftObjectId}`} target="_blank" rel="noreferrer"
            className="nft-link-btn nft-link-ghost">🔍 Suiscan</a>
        )}
      </div>
      <div className="nft-owned">✅ Owned by your wallet</div>
    </div>
  );
}

/* ── Collection grid card ── */
function CollectionCard({ nft }) {
  const fields   = nft.content?.fields ?? {};
  const rewardId = fields.tier ? Number(fields.tier) : nameToReward(fields.name);
  const imageUrl = decodeUrl(fields.image_url);
  const r = rewardId ? REWARDS[rewardId] : { label: "Unknown", emoji: "❓", color: "#888", glow: "#888", tier: "?", pct: "?" };
  const shortId = nft.objectId.slice(0,6) + "..." + nft.objectId.slice(-4);
  return (
    <div className="col-card" style={{ borderColor: r.color+"55", "--col-glow": r.glow }}>
      <NFTImage imageUrl={imageUrl} emoji={r.emoji} color={r.color} glow={r.glow} size={90} />
      <div className="col-card-tier" style={{ color: r.color }}>{r.tier}</div>
      <div className="col-card-name" style={{ color: r.color }}>{r.label}</div>
      <div className="col-card-id">{shortId}</div>
      <a href={`https://suiscan.xyz/testnet/object/${nft.objectId}`} target="_blank" rel="noreferrer"
        className="col-card-link" style={{ borderColor: r.color+"66", color: r.color }}>
        View on Suiscan →
      </a>
    </div>
  );
}

/* ── Wallet button ── */
function WalletButton() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: connect }    = useConnectWallet();
  const wallets = useWallets();
  const [open, setOpen] = useState(false);

  if (!account) return (
    <div className="wallet-dropdown-wrap">
      <button className="wallet-connect-btn" onClick={() => setOpen(o => !o)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
        Connect Wallet
        <span className={`wallet-caret ${open ? "up" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="wallet-menu">
          <div className="wallet-menu-title">Select Wallet</div>
          {wallets.length === 0 && <div className="wallet-none">No wallets found.<br/>Install Sui Wallet extension.</div>}
          {wallets.map(w => (
            <button key={w.name} className="wallet-option" onClick={() => { connect({ wallet: w }); setOpen(false); }}>
              {w.icon && <img src={w.icon} width="20" height="20" alt="" style={{ borderRadius: 4 }} />}
              {w.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const short = account.address.slice(0, 6) + "..." + account.address.slice(-4);
  return (
    <div className="wallet-dropdown-wrap">
      <button className="wallet-addr-btn" onClick={() => setOpen(o => !o)}>
        <span className="wallet-dot" />{short}
        <span className={`wallet-caret ${open ? "up" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="wallet-menu">
          <div className="wallet-menu-addr">{account.address.slice(0,10)}...{account.address.slice(-6)}</div>
          <button className="wallet-disconnect" onClick={() => { disconnect(); setOpen(false); }}>⏏️ Disconnect</button>
        </div>
      )}
    </div>
  );
}

/* ── My Collection ── */
function MyCollection({ refreshTrigger }) {
  const account   = useCurrentAccount();
  const suiClient = useSuiClient();
  const [nfts, setNfts]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchNFTs = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const res = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: { StructType: NFT_TYPE },
        options: { showContent: true, showType: true },
      });
      setNfts(res.data.map(d => d.data).filter(Boolean));
    } catch (e) { console.error(e); }
    setLoading(false);
    setFetched(true);
  }, [account, suiClient]);

  useEffect(() => { fetchNFTs(); }, [fetchNFTs, refreshTrigger]);

  if (!account) return (
    <div className="col-empty">
      <div className="col-empty-icon">🔗</div>
      <div className="col-empty-text">Connect your wallet to see your NFTs</div>
    </div>
  );
  if (loading && !fetched) return (
    <div className="col-empty">
      <span className="spinner col-spinner" />
      <div className="col-empty-text">Loading your collection...</div>
    </div>
  );

  const counts = nfts.reduce((acc, nft) => {
    const r = nameToReward(nft.content?.fields?.name);
    if (r) acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="col-wrap">
      <div className="col-stats">
        <div className="col-stat-total">
          <span className="col-stat-num">{nfts.length}</span>
          <span className="col-stat-lbl">Total NFTs</span>
        </div>
        {Object.entries(counts).map(([id, count]) => {
          const r = REWARDS[id];
          return (
            <div className="col-stat-tier" key={id} style={{ borderColor: r.color+"44" }}>
              <span>{r.emoji}</span>
              <span style={{ color: r.color }}>{count}</span>
              <span className="col-stat-tier-lbl">{r.tier}</span>
            </div>
          );
        })}
        <button className="col-refresh-btn" onClick={fetchNFTs} disabled={loading} title="Refresh">
          {loading ? <span className="spinner col-spinner-sm" /> : "↻"}
        </button>
      </div>
      {nfts.length === 0 ? (
        <div className="col-empty">
          <div className="col-empty-icon">📭</div>
          <div className="col-empty-text">No LootChest NFTs in your wallet.</div>
          <div className="col-empty-sub">Mint your first one!</div>
        </div>
      ) : (
        <div className="col-grid">
          {nfts.map(nft => <CollectionCard key={nft.objectId} nft={nft} />)}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
function App({ onBack }) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const [tab, setTab]                 = useState("mint");
  const [phase, setPhase]             = useState("idle"); // idle|signing|loading|reveal|cooldown
  const [rewardId, setRewardId]       = useState(null);
  const [nftObjectId, setNftObjectId] = useState(null);
  const [nftImageUrl, setNftImageUrl] = useState(null);
  const [txDigest, setTxDigest]       = useState(null);
  const [error, setError]             = useState("");
  const [mintCount, setMintCount]     = useState(0);
  const [showModal, setShowModal]     = useState(false);
  const [cooldown, setCooldown]       = useState(0);
  const cooldownRef = useRef(null);
  const particles   = useRef(Array.from({ length: 18 }));

  const reward = rewardId ? REWARDS[rewardId] : null;

  /* ── Cooldown timer ── */
  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN);
    setPhase("cooldown");
    cooldownRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) {
          clearInterval(cooldownRef.current);
          setPhase("reveal");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  /* ── Mint ── */
  const mintNFT = async () => {
    if (phase === "signing" || phase === "loading" || phase === "cooldown") return;
    SFX.click();
    setPhase("signing");
    setRewardId(null); setNftObjectId(null); setNftImageUrl(null); setTxDigest(null);
    setError(""); setShowModal(false);

    const tx = new Transaction();
    const [paymentCoin] = tx.splitCoins(tx.gas, [10_000_000n]);
    tx.moveCall({
      target: `${PACKAGE}::lootbox::open_box`,
      arguments: [paymentCoin, tx.object("0x8")],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: async (res) => {
        SFX.loading();
        setPhase("loading");
        setTxDigest(res.digest);
        try {
          await suiClient.waitForTransaction({ digest: res.digest });
          const txResult = await suiClient.getTransactionBlock({
            digest: res.digest,
            options: { showEvents: true, showEffects: true, showObjectChanges: true },
          });

          const events = txResult.events ?? [];
          const rewardEvent = events.find(e => e.type?.includes("RewardEvent")) ?? events[0];
          const num = Number(rewardEvent?.parsedJson?.reward);

          const created = (txResult.objectChanges ?? []).find(
            c => c.type === "created" && c.objectType?.includes("LootNFT")
          );
          if (created?.objectId) {
            setNftObjectId(created.objectId);
            try {
              const obj = await suiClient.getObject({ id: created.objectId, options: { showContent: true } });
              const imgUrl = decodeUrl(obj.data?.content?.fields?.image_url);
              if (imgUrl) setNftImageUrl(imgUrl);
            } catch (_) {}
          }

          if (num in REWARDS) {
            setRewardId(num);
            setMintCount(n => n + 1);
            // Play tier sound then show modal
            setTimeout(() => {
              if (num === 3) SFX.epic();
              else if (num === 2) SFX.rare();
              else SFX.common();
              setShowModal(true);
              startCooldown();
            }, 400);
          } else {
            setError("⚠️ Could not read reward tier");
            setPhase("idle");
          }
        } catch (e) {
          SFX.error();
          setError("⚠️ " + (e?.message || String(e)));
          setPhase("idle");
        }
      },
      onError: (err) => {
        SFX.error();
        setError("❌ " + (err?.message || "Transaction Failed"));
        setPhase("idle");
      },
    });
  };

  const reset = () => {
    clearInterval(cooldownRef.current);
    setRewardId(null); setNftObjectId(null); setNftImageUrl(null);
    setTxDigest(null); setPhase("idle"); setError(""); setShowModal(false); setCooldown(0);
  };

  const isBusy     = phase === "signing" || phase === "loading";
  const isCooldown = phase === "cooldown";
  const canMint    = phase === "idle";

  /* ── Button label ── */
  const btnLabel = () => {
    if (phase === "signing") return <><span className="spinner" /> Confirm in Wallet...</>;
    if (phase === "loading") return <><span className="spinner spinner-gold" /> Minting on Sui...</>;
    if (isCooldown)          return <>⏳ Next mint in {cooldown}s</>;
    if (phase === "reveal")  return <>🔄 Mint Another</>;
    return <>⚡ Mint NFT — 0.01 SUI</>;
  };

  return (
    <div className="app-bg">
      <div className="particles">
        {particles.current.map((_, i) => <Particle key={i} color={reward ? reward.glow : "#c8922a"} />)}
      </div>

      {/* Modal */}
      {showModal && rewardId && (
        <RevealModal
          rewardId={rewardId} nftObjectId={nftObjectId}
          txDigest={txDigest} imageUrl={nftImageUrl}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Top Nav */}
      {onBack && (
        <div className="app-topnav">
          <button className="app-topnav-back" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Landing
          </button>
          <div className="app-topnav-logo">
            <svg viewBox="0 0 120 100" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="50" width="100" height="45" rx="6" fill="#2a1a0e" stroke="#c8922a" strokeWidth="2.5"/>
              <path d="M10 55 Q10 20 60 18 Q110 20 110 55 Z" fill="#1e130a" stroke="#c8922a" strokeWidth="2.5"/>
              <rect x="52" y="50" width="16" height="14" rx="3" fill="#c8922a"/>
              <circle cx="60" cy="57" r="4" fill="#1e130a" stroke="#ffd700" strokeWidth="1.5"/>
            </svg>
            LOOTCHEST
          </div>
          <div className="app-topnav-badge">TESTNET</div>
        </div>
      )}

      <div className="app-layout">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="panel panel-left">
          <div className="header">
            <div className="subtitle">SUI BLOCKCHAIN · NFT MINT</div>
            <h1 className="title">LOOT CHEST</h1>
            <p className="tagline">Open the chest. Mint your NFT. Own it forever.</p>
          </div>

          <div className="wallet-row"><WalletButton /></div>

          {/* Chest with phase-aware animation */}
          <ChestIcon phase={phase} reward={rewardId} />

          {/* Phase status text */}
          <div className="phase-status">
            {phase === "signing" && <><span className="status-dot signing" /> Waiting for wallet approval...</>}
            {phase === "loading" && <><span className="status-dot loading" /> Transaction confirming on-chain...</>}
            {phase === "reveal"  && <><span className="status-dot success" /> NFT minted successfully!</>}
            {isCooldown          && <><span className="status-dot cooldown" /> Cooldown active — {cooldown}s</>}
            {phase === "idle"    && <><span className="status-dot idle" /> Ready to mint</>}
          </div>

          {/* Cooldown progress bar */}
          {isCooldown && (
            <div className="cooldown-bar-wrap">
              <div className="cooldown-bar" style={{ animationDuration: `${COOLDOWN}s` }} />
            </div>
          )}

          {/* Main CTA button */}
          <div className="btn-row">
            <button
              className={`open-btn ${isBusy || isCooldown ? "busy" : ""} ${phase === "reveal" ? "secondary" : ""}`}
              onClick={phase === "reveal" ? reset : mintNFT}
              disabled={isBusy || isCooldown}
            >
              {btnLabel()}
            </button>
          </div>

          {/* Price badge */}
          <div className="price-info">
            <span className="price-icon">💰</span>
            <span className="price-amount">0.01 SUI</span>
            <span className="price-label">per chest · gas extra</span>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {/* Reveal button if modal was dismissed */}
          {phase === "reveal" && !showModal && (
            <button className="reveal-again-btn" onClick={() => setShowModal(true)}>
              🎉 Show NFT Reveal Again
            </button>
          )}

          {/* Odds */}
          <div className="odds">
            <span style={{ color: "#a0c4ff" }}>🎁 70%</span>
            <span style={{ color: "#b48eff" }}>💎 25%</span>
            <span style={{ color: "#ff9f43" }}>🔥 5%</span>
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="panel panel-right">
          <div className="tabs">
            <button className={`tab-btn ${tab === "mint" ? "active" : ""}`} onClick={() => setTab("mint")}>
              ⚡ Last Mint
            </button>
            <button className={`tab-btn ${tab === "collection" ? "active" : ""}`} onClick={() => setTab("collection")}>
              🎒 My Collection
            </button>
          </div>

          {tab === "mint" && (
            <>
              {(phase === "idle" || phase === "signing") && !error && (
                <div className="right-empty">
                  <div className="right-empty-icon">🎁</div>
                  <div className="right-empty-text">Your minted NFT will appear here</div>
                  <div className="right-empty-sub">Click Mint NFT to get started</div>
                </div>
              )}
              {phase === "loading" && (
                <div className="right-empty">
                  <div className="chain-loading">
                    <div className="chain-ring" />
                    <div className="chain-ring chain-ring-2" />
                    <div className="chain-ring chain-ring-3" />
                  </div>
                  <div className="right-empty-text" style={{ marginTop: 16 }}>Confirming on-chain...</div>
                  <div className="right-empty-sub">This usually takes 2–5 seconds</div>
                </div>
              )}
              {(phase === "reveal" || phase === "cooldown") && rewardId && (
                <NFTCard
                  rewardId={rewardId} nftObjectId={nftObjectId}
                  txDigest={txDigest} imageUrl={nftImageUrl}
                  onExpand={() => setShowModal(true)}
                />
              )}
              {error && phase === "idle" && (
                <div className="right-empty">
                  <div style={{ fontSize: 40 }}>❌</div>
                  <div className="right-empty-text">{error}</div>
                  <button className="open-btn secondary" style={{ marginTop: 12 }} onClick={reset}>Try Again</button>
                </div>
              )}
            </>
          )}

          {tab === "collection" && <MyCollection refreshTrigger={mintCount} />}
        </div>

      </div>
    </div>
  );
}

export default App;
