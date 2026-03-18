import { useState, useEffect, useRef } from "react";
import "./Landing.css";

/* ── Mini chest SVG ── */
function MiniChest({ className = "", style = {} }) {
  return (
    <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <ellipse cx="60" cy="97" rx="38" ry="5" fill="rgba(0,0,0,0.3)" />
      <rect x="10" y="50" width="100" height="45" rx="6" fill="#2a1a0e" stroke="#c8922a" strokeWidth="2.5" />
      <path d="M10 55 Q10 20 60 18 Q110 20 110 55 Z" fill="#1e130a" stroke="#c8922a" strokeWidth="2.5" />
      <rect x="10" y="52" width="100" height="6" rx="2" fill="#c8922a" opacity="0.55" />
      <rect x="52" y="50" width="16" height="14" rx="3" fill="#c8922a" />
      <circle cx="60" cy="57" r="4" fill="#1e130a" stroke="#ffd700" strokeWidth="1.5" />
      {[20, 40, 80, 100].map(x => <circle key={x} cx={x} cy="58" r="2.5" fill="#c8922a" opacity="0.8" />)}
    </svg>
  );
}

/* ── Particle ── */
function Particle({ color = "#c8922a" }) {
  const s = useRef({
    w: Math.random() * 5 + 3, l: Math.random() * 100, t: Math.random() * 100,
    dur: Math.random() * 4 + 4, del: Math.random() * 4, op: Math.random() * 0.4 + 0.15,
  }).current;
  return <div style={{
    position: "absolute", width: s.w, height: s.w, borderRadius: "50%",
    background: color, left: `${s.l}%`, top: `${s.t}%`,
    animation: `lp-float ${s.dur}s ease-in-out infinite`,
    animationDelay: `${s.del}s`, opacity: s.op, boxShadow: `0 0 8px ${color}`,
    pointerEvents: "none",
  }} />;
}

/* ── Smooth scroll ── */
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── Step card with scroll reveal ── */
function Step({ n, icon, title, desc, delay = "0s" }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`lp-step ${vis ? "visible" : ""}`} style={{ transitionDelay: delay }}>
      <div className="lp-step-num">{n}</div>
      <div className="lp-step-icon">{icon}</div>
      <div className="lp-step-title">{title}</div>
      <div className="lp-step-desc">{desc}</div>
    </div>
  );
}

/* ── Tier card ── */
function TierCard({ emoji, tier, pct, color, desc, delay = "0s" }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`lp-tier ${vis ? "visible" : ""}`}
      style={{ "--tc": color, transitionDelay: delay }}>
      <div className="lp-tier-top">
        <span className="lp-tier-emoji">{emoji}</span>
        <span className="lp-tier-badge" style={{ color, borderColor: color+"55", background: color+"15" }}>{pct}</span>
      </div>
      <div className="lp-tier-name" style={{ color }}>{tier}</div>
      <div className="lp-tier-desc">{desc}</div>
      <div className="lp-tier-bar">
        <div className="lp-tier-fill" style={{
          width: vis ? pct : "0%", background: color, boxShadow: `0 0 12px ${color}88`,
          transition: "width 1.2s cubic-bezier(.4,0,.2,1)",
          transitionDelay: delay,
        }} />
      </div>
    </div>
  );
}

/* ── Animated counter ── */
function Counter({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const end = parseInt(target);
      if (isNaN(end)) { setVal(target); return; }
      const step = Math.ceil(end / 40);
      const timer = setInterval(() => {
        start = Math.min(start + step, end);
        setVal(start);
        if (start >= end) clearInterval(timer);
      }, 30);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{isNaN(parseInt(target)) ? target : val}{suffix}</span>;
}

export default function Landing({ onEnter }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const particles = useRef(Array.from({ length: 22 })).current;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="lp-root">
      <div className="lp-particles" aria-hidden>
        {particles.map((_, i) => <Particle key={i} color="#c8922a" />)}
      </div>

      {/* ════════ NAV ════════ */}
      <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <MiniChest style={{ width: 26, height: 26, opacity: 0.9 }} />
            <span>LOOTCHEST</span>
          </div>
          <div className={`lp-nav-links ${menuOpen ? "open" : ""}`}>
            <a href="#how"     onClick={e => { e.preventDefault(); setMenuOpen(false); scrollTo("how"); }}>How It Works</a>
            <a href="#rewards" onClick={e => { e.preventDefault(); setMenuOpen(false); scrollTo("rewards"); }}>Rewards</a>
          </div>
          <div className="lp-nav-right">
            <div className="lp-nav-network">
              <span className="lp-net-dot" />
              Sui Testnet
            </div>
            <button className="lp-launch-btn" onClick={onEnter}>Launch App →</button>
          </div>
          <button className="lp-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="lp-hero">
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />

        {/* Drifting bg chests */}
        {[
          { w:70,  top:"8%",  left:"3%",  op:0.10, dur:"8s",  del:"0s"   },
          { w:55,  top:"18%", right:"4%", op:0.08, dur:"11s", del:"1.5s" },
          { w:48,  top:"62%", left:"1%",  op:0.07, dur:"7s",  del:"0.8s" },
          { w:62,  top:"72%", right:"2%", op:0.09, dur:"9s",  del:"2.2s" },
          { w:38,  top:"42%", right:"8%", op:0.06, dur:"13s", del:"3s"   },
        ].map((c, i) => (
          <MiniChest key={i} style={{
            position:"absolute", width:c.w,
            top:c.top, left:c.left, right:c.right, opacity:c.op,
            animation:`lp-drift ${c.dur} ease-in-out infinite`,
            animationDelay:c.del, pointerEvents:"none",
          }} />
        ))}

        <div className="lp-hero-inner">
          {/* Left copy */}
          <div className="lp-hero-copy">
            <div className="lp-badge-row">
              <div className="lp-badge">⚡ Live on Sui Testnet</div>
              <div className="lp-badge lp-badge-purple">🎲 True On-Chain Random</div>
            </div>

            <h1 className="lp-h1">
              Open the Chest.<br />
              <span className="lp-h1-gold">Claim Your Fate.</span>
            </h1>

            <p className="lp-hero-sub">
              A fully on-chain loot box built on Sui. Pay <strong>0.01 SUI</strong>, open a chest,
              receive a provably fair NFT — minted live on the blockchain and permanently yours.
            </p>

            <div className="lp-hero-actions">
              <button className="lp-cta-primary" onClick={onEnter}>
                🔓 Open a Chest — 0.01 SUI
              </button>
              <a href="#how" className="lp-cta-ghost"
                onClick={e => { e.preventDefault(); scrollTo("how"); }}>
                How does it work? ↓
              </a>
            </div>

            {/* Stats */}
            <div className="lp-stats">
              {[
                { v: "3",     s: "",  l: "Reward Tiers"  },
                { v: "100",   s: "%", l: "On-Chain"      },
                { v: "0.01",  s: "",  l: "SUI per Open"  },
                { v: "Sui",   s: "",  l: "Blockchain"    },
              ].map(s => (
                <div className="lp-stat" key={s.l}>
                  <div className="lp-stat-val">
                    <Counter target={s.v} suffix={s.s} />
                  </div>
                  <div className="lp-stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: big chest */}
          <div className="lp-hero-chest-wrap">
            <div className="lp-hero-halo" />
            <div className="lp-hero-halo lp-hero-halo-2" />
            <div className="lp-hero-halo lp-hero-halo-3" />
            <svg viewBox="0 0 200 170" className="lp-hero-chest" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="hg" cx="50%" cy="75%" r="55%">
                  <stop offset="0%" stopColor="#ffd700" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="transparent"/>
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <ellipse cx="100" cy="163" rx="68" ry="9" fill="rgba(0,0,0,0.35)" />
              <rect x="12" y="88" width="176" height="75" rx="10" fill="#2a1a0e" stroke="#c8922a" strokeWidth="3" />
              <path d="M12 94 Q12 30 100 26 Q188 30 188 94 Z" fill="#1e130a" stroke="#c8922a" strokeWidth="3" />
              <path d="M30 94 Q30 52 100 48 Q170 52 170 94 Z" fill="url(#hg)" />
              <rect x="12" y="88" width="176" height="10" rx="3" fill="#c8922a" opacity="0.55" />
              <rect x="84" y="84" width="32" height="24" rx="5" fill="#c8922a" filter="url(#glow)" />
              <circle cx="100" cy="96" r="7" fill="#1e130a" stroke="#ffd700" strokeWidth="2" />
              <line x1="100" y1="98" x2="100" y2="104" stroke="#ffd700" strokeWidth="2" />
              {[28,56,144,172].map(x => <circle key={x} cx={x} cy="96" r="4" fill="#c8922a" opacity="0.8" />)}
              {[[38,48,2,"2s","0s"],[162,40,1.5,"2.8s","0.6s"],[100,18,2,"3.2s","1.2s"],
                [60,65,1.5,"2.4s","0.3s"],[142,62,1.5,"3s","0.9s"]].map(([x,y,r,dur,del],i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="#ffd700">
                  <animate attributeName="opacity" values="0;1;0" dur={dur} begin={del} repeatCount="indefinite"/>
                  <animate attributeName="r" values={`${r};${r*1.8};${r}`} dur={dur} begin={del} repeatCount="indefinite"/>
                </circle>
              ))}
            </svg>
            {/* Floating reward chips */}
            <div className="lp-chest-chips">
              <div className="lp-chip lp-chip-1" style={{ color: "#a0c4ff", borderColor: "#a0c4ff44" }}>🎁 Common</div>
              <div className="lp-chip lp-chip-2" style={{ color: "#b48eff", borderColor: "#b48eff44" }}>💎 Rare</div>
              <div className="lp-chip lp-chip-3" style={{ color: "#ff9f43", borderColor: "#ff9f4344" }}>🔥 Epic</div>
            </div>
            <div className="lp-hero-chest-label">One click. One fate. On-chain forever.</div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="lp-scroll-hint" onClick={() => scrollTo("how")}>
          <div className="lp-scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="lp-section" id="how">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">THE PROCESS</p>
          <h2 className="lp-h2">How It Works</h2>
          <p className="lp-section-sub">Three steps between you and your on-chain destiny</p>

          <div className="lp-steps">
            <Step n="01" icon="🔗" title="Connect Wallet" delay="0s"
              desc="Link your Sui wallet — Sui Wallet, Martian, Ethos, or any compatible extension." />
            <div className="lp-step-connector" />
            <Step n="02" icon="🔓" title="Pay & Open" delay="0.1s"
              desc="Pay 0.01 SUI and click Open Chest. A signed transaction hits the Sui blockchain instantly." />
            <div className="lp-step-connector" />
            <Step n="03" icon="🎁" title="Receive Your NFT" delay="0.2s"
              desc="The contract rolls randomness on-chain, mints your NFT, and sends it to your wallet — permanently." />
          </div>

          {/* Tech highlight bar */}
          <div className="lp-tech-bar">
            {[
              { icon: "🎲", label: "sui::random", desc: "True on-chain VRF" },
              { icon: "⛓",  label: "Sui Move",    desc: "Smart contract" },
              { icon: "🔒", label: "Non-custodial",desc: "You hold the keys" },
              { icon: "🌐", label: "Open source",  desc: "Fully verifiable" },
            ].map(t => (
              <div className="lp-tech-item" key={t.label}>
                <span className="lp-tech-icon">{t.icon}</span>
                <div>
                  <div className="lp-tech-label">{t.label}</div>
                  <div className="lp-tech-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ REWARDS ════════ */}
      <section className="lp-section lp-section--alt" id="rewards">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">LOOT TIERS</p>
          <h2 className="lp-h2">What Can You Win?</h2>
          <p className="lp-section-sub">Every chest holds exactly one fate</p>

          <div className="lp-tiers">
            <TierCard emoji="🎁" tier="Common" pct="70%" color="#a0c4ff" delay="0s"
              desc="The reliable reward. Still on-chain. Still an NFT. Still yours forever." />
            <TierCard emoji="💎" tier="Rare"   pct="25%" color="#b48eff" delay="0.1s"
              desc="A cut above. Rarer than most. Coveted by many, held by few." />
            <TierCard emoji="🔥" tier="Epic"   pct="5%"  color="#ff9f43" delay="0.2s"
              desc="The rarest drop. Only 1 in 20 chests ever reveals this power." />
          </div>

          <div className="lp-fairness-box">
            <div className="lp-fairness-icon">🎲</div>
            <div>
              <div className="lp-fairness-title">Powered by sui::random — True On-Chain Randomness</div>
              <div className="lp-fairness-desc">
                Unlike fake "random" systems, LootChest uses Sui's native VRF (<code>sui::random</code>) —
                a cryptographically secure on-chain random number that is different for every single transaction,
                for every user. No backend. No admin manipulation. Every result is verifiable on Sui Explorer.
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ════════ FINAL CTA ════════ */}
      <section className="lp-final">
        <div className="lp-final-glow" />
        <div className="lp-final-inner">
          <MiniChest style={{ width: 72, marginBottom: 24, opacity: 0.9 }} />
          <p className="lp-eyebrow" style={{ marginBottom: 12 }}>READY?</p>
          <h2 className="lp-final-h2">Your chest awaits.</h2>
          <p className="lp-final-sub">
            Connect your wallet, pay 0.01 SUI, and discover your fate —<br />
            permanently recorded on the Sui blockchain.
          </p>
          <button className="lp-cta-primary lp-cta-lg" onClick={onEnter}>
            🔓 Open the Chest
          </button>
          <div className="lp-final-meta">
            <span>0.01 SUI per open</span>
            <span className="lp-final-dot">·</span>
            <span>True on-chain random</span>
            <span className="lp-final-dot">·</span>
            <span>NFT minted to your wallet</span>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo" style={{ opacity: 0.55 }}>
            <MiniChest style={{ width: 20 }} />
            <span>LOOTCHEST</span>
          </div>
          <div className="lp-footer-links">
            <a href="#how"     onClick={e => { e.preventDefault(); scrollTo("how"); }}>How It Works</a>
            <a href="#rewards" onClick={e => { e.preventDefault(); scrollTo("rewards"); }}>Rewards</a>
          </div>
          <div className="lp-footer-right">
            <div className="lp-net-dot" style={{ marginRight: 6 }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: 1 }}>Sui Testnet · Open Source</span>
          </div>
        </div>
        <div className="lp-footer-copy">
          Built with Move 2024 · sui::random · @mysten/dapp-kit · React + Vite
        </div>
      </footer>
    </div>
  );
}
