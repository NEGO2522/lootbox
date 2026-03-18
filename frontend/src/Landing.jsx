import { useState, useEffect, useRef } from "react";
import "./Landing.css";

/* ── Reusable mini chest SVG ── */
function MiniChest({ className = "", style = {} }) {
  return (
    <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <ellipse cx="60" cy="97" rx="38" ry="5" fill="rgba(0,0,0,0.3)" />
      <rect x="10" y="50" width="100" height="45" rx="6" fill="#2a1a0e" stroke="#c8922a" strokeWidth="2.5" />
      <path d="M10 55 Q10 20 60 18 Q110 20 110 55 Z" fill="#1e130a" stroke="#c8922a" strokeWidth="2.5" />
      <rect x="10" y="52" width="100" height="6" rx="2" fill="#c8922a" opacity="0.55" />
      <rect x="52" y="50" width="16" height="14" rx="3" fill="#c8922a" />
      <circle cx="60" cy="57" r="4" fill="#1e130a" stroke="#ffd700" strokeWidth="1.5" />
      {[20, 40, 80, 100].map(x => (
        <circle key={x} cx={x} cy="58" r="2.5" fill="#c8922a" opacity="0.8" />
      ))}
    </svg>
  );
}

/* ── Ambient particles (same as App) ── */
function Particle({ color = "#c8922a" }) {
  const s = useRef({
    w:  Math.random() * 5 + 3,
    l:  Math.random() * 100,
    t:  Math.random() * 100,
    dur: Math.random() * 4 + 4,
    del: Math.random() * 4,
    op:  Math.random() * 0.4 + 0.15,
  }).current;
  return (
    <div style={{
      position: "absolute",
      width: s.w, height: s.w,
      borderRadius: "50%",
      background: color,
      left: `${s.l}%`, top: `${s.t}%`,
      animation: `lp-float ${s.dur}s ease-in-out infinite`,
      animationDelay: `${s.del}s`,
      opacity: s.op,
      boxShadow: `0 0 8px ${color}`,
      pointerEvents: "none",
    }} />
  );
}

/* ── FAQ accordion item ── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lp-faq-item ${open ? "open" : ""}`} onClick={() => setOpen(o => !o)}>
      <div className="lp-faq-q">
        <span>{q}</span>
        <span className="lp-faq-icon">{open ? "−" : "+"}</span>
      </div>
      {open && <div className="lp-faq-a">{a}</div>}
    </div>
  );
}

/* ── Step card ── */
function Step({ n, icon, title, desc }) {
  return (
    <div className="lp-step">
      <div className="lp-step-num">{n}</div>
      <div className="lp-step-icon">{icon}</div>
      <div className="lp-step-title">{title}</div>
      <div className="lp-step-desc">{desc}</div>
    </div>
  );
}

/* ── Tier card ── */
function TierCard({ emoji, tier, pct, color, desc }) {
  return (
    <div className="lp-tier" style={{ "--tc": color }}>
      <div className="lp-tier-top">
        <span className="lp-tier-emoji">{emoji}</span>
        <span className="lp-tier-badge" style={{ color, borderColor: color + "55", background: color + "15" }}>{pct}</span>
      </div>
      <div className="lp-tier-name" style={{ color }}>{tier}</div>
      <div className="lp-tier-desc">{desc}</div>
      <div className="lp-tier-bar">
        <div className="lp-tier-fill" style={{ width: pct, background: color, boxShadow: `0 0 10px ${color}88` }} />
      </div>
    </div>
  );
}

/* ── Main Landing component ── */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Landing({ onEnter }) {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const particles = useRef(Array.from({ length: 22 })).current;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="lp-root">

      {/* ── Ambient particles ── */}
      <div className="lp-particles" aria-hidden>
        {particles.map((_, i) => <Particle key={i} color="#c8922a" />)}
      </div>

      {/* ══════════ NAV ══════════ */}
      <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <MiniChest style={{ width: 28, height: 28, opacity: 0.9 }} />
            <span>LOOTCHEST</span>
          </div>

          <div className={`lp-nav-links ${menuOpen ? "open" : ""}`}>
            <a href="#how"     onClick={e => { e.preventDefault(); setMenuOpen(false); scrollTo("how"); }}>How It Works</a>
            <a href="#rewards" onClick={e => { e.preventDefault(); setMenuOpen(false); scrollTo("rewards"); }}>Rewards</a>
            <a href="#faq"     onClick={e => { e.preventDefault(); setMenuOpen(false); scrollTo("faq"); }}>FAQ</a>
          </div>

          <button className="lp-launch-btn" onClick={onEnter}>Launch App →</button>

          <button className="lp-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="lp-hero">
        {/* Background glow blobs */}
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />

        {/* Drifting bg chests */}
        {[
          { w:70,  top:"8%",  left:"3%",  op:0.12, dur:"8s",  del:"0s"   },
          { w:55,  top:"18%", right:"4%", op:0.10, dur:"11s", del:"1.5s" },
          { w:48,  top:"62%", left:"1%",  op:0.08, dur:"7s",  del:"0.8s" },
          { w:62,  top:"72%", right:"2%", op:0.11, dur:"9s",  del:"2.2s" },
          { w:40,  top:"42%", right:"8%", op:0.07, dur:"13s", del:"3s"   },
        ].map((c, i) => (
          <MiniChest key={i} style={{
            position:"absolute", width:c.w,
            top:c.top, left:c.left, right:c.right,
            opacity:c.op,
            animation:`lp-drift ${c.dur} ease-in-out infinite`,
            animationDelay:c.del,
            pointerEvents:"none",
          }} />
        ))}

        <div className="lp-hero-inner">
          {/* Left: copy */}
          <div className="lp-hero-copy">
            <div className="lp-badge">⚡ Live on Sui Testnet</div>
            <h1 className="lp-h1">
              Open the Chest.<br />
              <span className="lp-h1-gold">Claim Your Fate.</span>
            </h1>
            <p className="lp-hero-sub">
              A fully on-chain loot box experience built on Sui. Every reward is
              provably fair, permanently recorded, and minted as an NFT — yours forever.
            </p>
            <div className="lp-hero-actions">
              <button className="lp-cta-primary" onClick={onEnter}>
                🔓 Open a Chest
              </button>
              <a href="#how" className="lp-cta-ghost" onClick={e => { e.preventDefault(); scrollTo("how"); }}>See How It Works ↓</a>
            </div>

            {/* Stats row */}
            <div className="lp-stats">
              {[
                { v: "3",        l: "Reward Tiers"  },
                { v: "NFT",      l: "On-Chain Mint" },
                { v: "Sui",      l: "Blockchain"    },
                { v: "Fair",     l: "Provably"      },
              ].map(s => (
                <div className="lp-stat" key={s.l}>
                  <div className="lp-stat-val">{s.v}</div>
                  <div className="lp-stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: big chest */}
          <div className="lp-hero-chest-wrap">
            <div className="lp-hero-halo" />
            <div className="lp-hero-halo lp-hero-halo-2" />
            <svg viewBox="0 0 200 170" className="lp-hero-chest" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="hg" cx="50%" cy="75%" r="55%">
                  <stop offset="0%" stopColor="#ffd700" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="transparent"/>
                </radialGradient>
              </defs>
              <ellipse cx="100" cy="163" rx="68" ry="9" fill="rgba(0,0,0,0.35)" />
              <rect x="12" y="88" width="176" height="75" rx="10" fill="#2a1a0e" stroke="#c8922a" strokeWidth="3" />
              <path d="M12 94 Q12 30 100 26 Q188 30 188 94 Z" fill="#1e130a" stroke="#c8922a" strokeWidth="3" />
              <path d="M30 94 Q30 52 100 48 Q170 52 170 94 Z" fill="url(#hg)" />
              <rect x="12" y="88" width="176" height="10" rx="3" fill="#c8922a" opacity="0.55" />
              <rect x="84" y="84" width="32" height="24" rx="5" fill="#c8922a" />
              <circle cx="100" cy="96" r="7" fill="#1e130a" stroke="#ffd700" strokeWidth="2" />
              <line x1="100" y1="98" x2="100" y2="104" stroke="#ffd700" strokeWidth="2" />
              {[28,56,144,172].map(x => <circle key={x} cx={x} cy="96" r="4" fill="#c8922a" opacity="0.8" />)}
              {/* animated sparkles */}
              {[[38,48,2,"2s","0s"],[162,40,1.5,"2.8s","0.6s"],[100,18,2,"3.2s","1.2s"],[60,65,1.5,"2.4s","0.3s"],[142,62,1.5,"3s","0.9s"]].map(([x,y,r,dur,del],i)=>(
                <circle key={i} cx={x} cy={y} r={r} fill="#ffd700">
                  <animate attributeName="opacity" values="0;1;0" dur={dur} begin={del} repeatCount="indefinite"/>
                  <animate attributeName="r" values={`${r};${r*1.8};${r}`} dur={dur} begin={del} repeatCount="indefinite"/>
                </circle>
              ))}
            </svg>
            <div className="lp-hero-chest-label">One click. One fate. On-chain forever.</div>
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="lp-section" id="how">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">THE PROCESS</p>
          <h2 className="lp-h2">How It Works</h2>
          <p className="lp-section-sub">Three steps between you and your on-chain destiny</p>

          <div className="lp-steps">
            <Step n="01" icon="🔗" title="Connect Wallet"
              desc="Link your Sui wallet — Sui Wallet, Martian, Ethos, or any compatible extension." />
            <div className="lp-step-connector" />
            <Step n="02" icon="🔓" title="Open the Chest"
              desc="Click Open Chest. A transaction is signed and submitted to the Sui blockchain instantly." />
            <div className="lp-step-connector" />
            <Step n="03" icon="🎁" title="Receive Your NFT"
              desc="The smart contract mints an NFT to your wallet and emits your reward tier on-chain. Transparent. Permanent." />
          </div>
        </div>
      </section>

      {/* ══════════ REWARDS ══════════ */}
      <section className="lp-section lp-section--alt" id="rewards">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">LOOT TIERS</p>
          <h2 className="lp-h2">What Can You Win?</h2>
          <p className="lp-section-sub">Every chest holds exactly one fate</p>

          <div className="lp-tiers">
            <TierCard emoji="🎁" tier="Common" pct="70%" color="#a0c4ff"
              desc="The reliable reward. Still on-chain. Still an NFT. Still yours." />
            <TierCard emoji="💎" tier="Rare"   pct="25%" color="#b48eff"
              desc="A cut above. Rarer than most. Coveted by many, held by few." />
            <TierCard emoji="🔥" tier="Epic"   pct="5%"  color="#ff9f43"
              desc="The rarest drop. Only 1 in 20 chests ever reveals this power." />
          </div>

          {/* Fairness callout */}
          <div className="lp-fairness-box">
            <div className="lp-fairness-icon">⛓️</div>
            <div>
              <div className="lp-fairness-title">Provably Fair</div>
              <div className="lp-fairness-desc">
                Drop rates are determined entirely on-chain using the Sui epoch and your
                wallet address as a seed. No backend. No admin keys. Every result is
                fully verifiable on the Sui Explorer.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="lp-section" id="faq">
        <div className="lp-section-inner lp-narrow">
          <p className="lp-eyebrow">FAQ</p>
          <h2 className="lp-h2">Common Questions</h2>

          <div className="lp-faqs">
            {[
              { q: "Is it free to use?",
                a: "You only pay the Sui network gas fee per transaction — a tiny fraction of a cent on testnet." },
              { q: "Which wallets are supported?",
                a: "Any Sui-compatible wallet: Sui Wallet, Martian, Ethos, and others. The app auto-detects installed wallets." },
              { q: "What does the NFT actually do?",
                a: "Right now it's a permanent on-chain record of your reward. NFT utility expansions (traits, rarity metadata, trading) are on the roadmap." },
              { q: "Is this on mainnet?",
                a: "Currently live on Sui Testnet. Mainnet deployment is coming once audits are complete." },
              { q: "Can I verify my result?",
                a: "Yes — every transaction has a digest you can look up on Suiscan or Sui Explorer to see the raw on-chain event data." },
            ].map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="lp-final">
        <div className="lp-final-glow" />
        <div className="lp-final-inner">
          <MiniChest style={{ width: 64, marginBottom: 20, opacity: 0.85 }} />
          <p className="lp-eyebrow" style={{ marginBottom: 12 }}>READY?</p>
          <h2 className="lp-final-h2">Your chest awaits.</h2>
          <p className="lp-final-sub">
            Connect your wallet and discover your fate — permanently, on Sui.
          </p>
          <button className="lp-cta-primary lp-cta-lg" onClick={onEnter}>
            🔓 Open the Chest
          </button>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo" style={{ opacity: 0.5 }}>
            <MiniChest style={{ width: 20 }} />
            <span>LOOTCHEST</span>
          </div>
          <div className="lp-footer-links">
            <a href="#how"     onClick={e => { e.preventDefault(); scrollTo("how"); }}>How It Works</a>
            <a href="#rewards" onClick={e => { e.preventDefault(); scrollTo("rewards"); }}>Rewards</a>
            <a href="#faq"     onClick={e => { e.preventDefault(); scrollTo("faq"); }}>FAQ</a>
          </div>
          <div className="lp-footer-copy">Built on Sui · Provably Fair · Open Source</div>
        </div>
      </footer>

    </div>
  );
}
