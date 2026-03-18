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

const PACKAGE = import.meta.env.VITE_PACKAGE_ID;
const NFT_TYPE = `${PACKAGE}::lootbox::LootNFT`;

const REWARDS = {
  1: { label: "Common NFT", emoji: "🎁", color: "#a0c4ff", glow: "#a0c4ff", pct: "70%", tier: "COMMON", desc: "A common loot drop — yours forever on-chain." },
  2: { label: "Rare NFT",   emoji: "💎", color: "#b48eff", glow: "#b48eff", pct: "25%", tier: "RARE",   desc: "A rare find. Only 1 in 4 chests holds this." },
  3: { label: "Epic NFT",   emoji: "🔥", color: "#ff9f43", glow: "#ff6b35", pct: "5%",  tier: "EPIC",   desc: "Legendary. Only 1 in 20. You're one of the few." },
};

// Map NFT name bytes or tier number → reward tier
function nameToReward(nameArr) {
  if (!nameArr) return null;
  const str = Array.isArray(nameArr)
    ? String.fromCharCode(...nameArr)
    : String(nameArr);
  if (str.includes("Epic"))   return 3;
  if (str.includes("Rare"))   return 2;
  if (str.includes("Common")) return 1;
  return null;
}

// Decode on-chain vector<u8> URL → string
function decodeUrl(urlField) {
  if (!urlField) return null;
  if (typeof urlField === "string") return urlField;
  if (Array.isArray(urlField)) return String.fromCharCode(...urlField);
  return null;
}

/* ── Floating particle ── */
function Particle({ color }) {
  const s = useRef({
    w: Math.random() * 6 + 3,
    l: Math.random() * 100,
    t: Math.random() * 100,
    dur: Math.random() * 4 + 3,
    del: Math.random() * 3,
    op: Math.random() * 0.6 + 0.2,
  }).current;
  return (
    <div style={{
      position: "absolute",
      width: s.w, height: s.w, borderRadius: "50%",
      background: color, left: `${s.l}%`, top: `${s.t}%`,
      animation: `floatParticle ${s.dur}s ease-in-out infinite`,
      animationDelay: `${s.del}s`, opacity: s.op,
      boxShadow: `0 0 8px ${color}`,
    }} />
  );
}

/* ── SVG Chest ── */
function ChestIcon({ loading, reward }) {
  const r = reward ? REWARDS[reward] : null;
  return (
    <div className={`chest-wrap ${loading ? "shaking" : ""} ${r ? "opened" : ""}`}>
      <div className="chest-glow" style={r ? { background: r.glow, opacity: 0.5 } : {}} />
      <svg viewBox="0 0 120 100" className="chest-svg" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="97" rx="38" ry="5" fill="rgba(0,0,0,0.4)" />
        <rect x="10" y="50" width="100" height="45" rx="6" fill="#2a1a0e" stroke="#c8922a" strokeWidth="2.5" />
        <path d="M10 55 Q10 20 60 18 Q110 20 110 55 Z"
          fill={r ? "#3d2a0a" : "#1e130a"} stroke="#c8922a" strokeWidth="2.5"
          style={{ transformOrigin: "60px 55px", transition: "transform 0.6s cubic-bezier(.68,-0.55,.27,1.55)" }}
        />
        <rect x="10" y="52" width="100" height="6" rx="2" fill="#c8922a" opacity="0.6" />
        <rect x="52" y="50" width="16" height="14" rx="3" fill="#c8922a" />
        <circle cx="60" cy="57" r="4" fill="#1e130a" stroke="#ffd700" strokeWidth="1.5" />
        {[20, 40, 80, 100].map(x => <circle key={x} cx={x} cy="58" r="2.5" fill="#c8922a" opacity="0.8" />)}
        {r && <ellipse cx="60" cy="55" rx="35" ry="15" fill={r.glow} opacity="0.3" style={{ filter: "blur(4px)" }} />}
      </svg>
      {r && <div className="reward-burst">{r.emoji}</div>}
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

/* ── NFT Image with fallback emoji ── */
function NFTImage({ imageUrl, emoji, color, glow, size = 140 }) {
  const [errored, setErrored] = useState(false);
  if (imageUrl && !errored) {
    return (
      <div className="nft-img-wrap" style={{
        width: size, height: size,
        boxShadow: `0 0 30px ${glow}55`,
        borderColor: color + "55",
      }}>
        <img
          src={imageUrl}
          alt="NFT"
          className="nft-img"
          onError={() => setErrored(true)}
        />
        <div className="nft-img-shine" />
      </div>
    );
  }
  // Fallback: stylised emoji box
  return (
    <div className="nft-img-wrap nft-img-fallback" style={{
      width: size, height: size,
      background: `radial-gradient(circle at 50% 40%, ${glow}33, transparent 70%)`,
      boxShadow: `0 0 24px ${glow}44`,
      borderColor: color + "55",
    }}>
      <div style={{ fontSize: size * 0.38, lineHeight: 1 }}>{emoji}</div>
    </div>
  );
}

/* ── Single NFT mint result card ── */
function NFTCard({ rewardId, nftObjectId, txDigest, imageUrl }) {
  const r = REWARDS[rewardId];
  if (!r) return null;
  const shortId = nftObjectId ? nftObjectId.slice(0,8) + "..." + nftObjectId.slice(-6) : null;
  return (
    <div className="nft-card" style={{ borderColor: r.color, boxShadow: `0 0 40px ${r.glow}44` }}>
      <div className="nft-card-badge" style={{ background: r.color+"22", borderColor: r.color+"66", color: r.color }}>
        ⛓ MINTED ON SUI
      </div>

      {/* Real image */}
      <NFTImage imageUrl={imageUrl} emoji={r.emoji} color={r.color} glow={r.glow} size={140} />

      <div className="nft-tier-label" style={{ color: r.color }}>{r.tier}</div>
      <div className="nft-name" style={{ color: r.color }}>{r.label}</div>
      <div className="nft-desc">{r.desc}</div>

      <div className="nft-meta">
        {[
          ["Drop Rate", r.pct, r.color],
          ["Network",   "Sui Testnet", null],
          ["Standard",  "Sui Object (key)", null],
          shortId ? ["Object ID", shortId, null] : null,
        ].filter(Boolean).map(([k, v, c]) => (
          <div className="nft-meta-row" key={k}>
            <span className="nft-meta-key">{k}</span>
            <span className="nft-meta-val nft-meta-mono" style={c ? { color: c } : {}}>{v}</span>
          </div>
        ))}
      </div>
      <div className="nft-links">
        {nftObjectId && (
          <a href={`https://suiscan.xyz/testnet/object/${nftObjectId}`} target="_blank" rel="noreferrer"
            className="nft-link-btn" style={{ borderColor: r.color+"88", color: r.color }}>
            🔍 View NFT
          </a>
        )}
        {txDigest && (
          <a href={`https://suiscan.xyz/testnet/tx/${txDigest}`} target="_blank" rel="noreferrer"
            className="nft-link-btn nft-link-ghost">
            📋 View TX
          </a>
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
  const r = rewardId ? REWARDS[rewardId] : { label: "Unknown NFT", emoji: "❓", color: "#888", glow: "#888", tier: "?", pct: "?" };
  const shortId = nft.objectId.slice(0,6) + "..." + nft.objectId.slice(-4);

  return (
    <div className="col-card" style={{ borderColor: r.color+"55", "--col-glow": r.glow }}>
      {/* Image */}
      <NFTImage imageUrl={imageUrl} emoji={r.emoji} color={r.color} glow={r.glow} size={90} />
      <div className="col-card-tier" style={{ color: r.color }}>{r.tier}</div>
      <div className="col-card-name" style={{ color: r.color }}>{r.label}</div>
      <div className="col-card-id">{shortId}</div>
      <a
        href={`https://suiscan.xyz/testnet/object/${nft.objectId}`}
        target="_blank" rel="noreferrer"
        className="col-card-link"
        style={{ borderColor: r.color+"66", color: r.color }}
      >
        View on Suiscan →
      </a>
    </div>
  );
}

/* ── My Collection panel ── */
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
    } catch (e) {
      console.error("Failed to fetch NFTs:", e);
    }
    setLoading(false);
    setFetched(true);
  }, [account, suiClient]);

  // Fetch on mount + whenever a new mint happens
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

  // Tally by tier
  const counts = nfts.reduce((acc, nft) => {
    const r = nameToReward(nft.content?.fields?.name);
    if (r) acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="col-wrap">
      {/* Stats bar */}
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
          <div className="col-empty-text">No LootChest NFTs found in your wallet.</div>
          <div className="col-empty-sub">Mint your first one above!</div>
        </div>
      ) : (
        <div className="col-grid">
          {nfts.map(nft => <CollectionCard key={nft.objectId} nft={nft} />)}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   Main App
═══════════════════════════════════ */
function App({ onBack }) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const [tab, setTab]             = useState("mint"); // "mint" | "collection"
  const [rewardId, setRewardId]   = useState(null);
  const [nftObjectId, setNftObjectId] = useState(null);
  const [nftImageUrl, setNftImageUrl] = useState(null);
  const [txDigest, setTxDigest]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [phase, setPhase]         = useState("idle");
  const [mintCount, setMintCount] = useState(0); // triggers collection refresh
  const particles = useRef(Array.from({ length: 18 }));

  const reward = rewardId ? REWARDS[rewardId] : null;

  const mintNFT = async () => {
    setLoading(true);
    setRewardId(null);
    setNftObjectId(null);
    setNftImageUrl(null);
    setTxDigest(null);
    setError("");
    setPhase("loading");

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE}::lootbox::open_box`,
      arguments: [
        tx.object("0x8"), // Sui on-chain Random object — always 0x8
      ],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: async (res) => {
        try {
          setTxDigest(res.digest);
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
              // Fetch the object to get image_url field
              try {
                const obj = await suiClient.getObject({
                  id: created.objectId,
                  options: { showContent: true },
                });
                const imgUrl = decodeUrl(obj.data?.content?.fields?.image_url);
                if (imgUrl) setNftImageUrl(imgUrl);
              } catch (_) {}
            }

          if (num in REWARDS) {
            setRewardId(num);
            setPhase("reveal");
            setMintCount(n => n + 1); // triggers collection refresh
          } else {
            setError("⚠️ Could not determine reward tier");
            setPhase("idle");
          }
        } catch (e) {
          setError("⚠️ " + (e?.message || String(e)));
          setPhase("idle");
        }
        setLoading(false);
      },
      onError: (err) => {
        setError("❌ " + (err?.message || "Transaction Failed"));
        setLoading(false);
        setPhase("idle");
      },
    });
  };

  const reset = () => { setRewardId(null); setNftObjectId(null); setNftImageUrl(null); setTxDigest(null); setPhase("idle"); setError(""); };

  return (
    <div className="app-bg">
      <div className="particles">
        {particles.current.map((_, i) => <Particle key={i} color={reward ? reward.glow : "#c8922a"} />)}
      </div>

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
          {/* Header */}
          <div className="header">
            <div className="subtitle">SUI BLOCKCHAIN · NFT MINT</div>
            <h1 className="title">LOOT CHEST</h1>
            <p className="tagline">Open the chest. Mint your NFT. Own it forever.</p>
          </div>

          {/* Wallet */}
          <div className="wallet-row"><WalletButton /></div>

          {/* Chest */}
          <ChestIcon loading={loading} reward={rewardId} />

          {/* Mint button */}
          {phase !== "reveal" ? (
            <div className="btn-row">
              <button className="open-btn" onClick={mintNFT} disabled={loading}>
                {loading ? <><span className="spinner" /> Minting NFT...</> : <>⚡ Mint NFT</>}
              </button>
            </div>
          ) : (
            <div className="btn-row">
              <button className="open-btn secondary" onClick={reset}>🔄 Mint Another</button>
            </div>
          )}

          {phase === "loading" && (
            <div className="mint-status">
              <span className="spinner" /> Minting your NFT on Sui...
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}

          {/* Odds */}
          <div className="odds">
            <span style={{ color: "#a0c4ff" }}>🎁 70%</span>
            <span style={{ color: "#b48eff" }}>💎 25%</span>
            <span style={{ color: "#ff9f43" }}>🔥 5%</span>
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="panel panel-right">
          {/* Tabs */}
          <div className="tabs">
            <button className={`tab-btn ${tab === "mint" ? "active" : ""}`} onClick={() => setTab("mint")}>
              ⚡ Last Mint
            </button>
            <button className={`tab-btn ${tab === "collection" ? "active" : ""}`} onClick={() => setTab("collection")}>
              🎒 My Collection
            </button>
          </div>

          {/* Last mint result */}
          {tab === "mint" && (
            <>
              {phase === "idle" && !error && (
                <div className="right-empty">
                  <div className="right-empty-icon">🎁</div>
                  <div className="right-empty-text">Your minted NFT will appear here</div>
                  <div className="right-empty-sub">Click Mint NFT to get started</div>
                </div>
              )}
              {phase === "loading" && (
                <div className="right-empty">
                  <span className="spinner col-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                  <div className="right-empty-text">Minting on Sui...</div>
                </div>
              )}
              {phase === "reveal" && (
                <NFTCard rewardId={rewardId} nftObjectId={nftObjectId} txDigest={txDigest} imageUrl={nftImageUrl} />
              )}
            </>
          )}

          {/* Collection */}
          {tab === "collection" && (
            <MyCollection refreshTrigger={mintCount} />
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
