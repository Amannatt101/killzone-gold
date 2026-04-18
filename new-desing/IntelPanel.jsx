/* IntelPanel.jsx — Right-side Gold Intelligence analysis panel */

const factorsData = [
  {
    name: 'USD Strength',
    tag: 'DOLLAR WEAK',
    tagKind: 'bull',
    pct: 50,
    pctKind: 'neut',
    dir: 'flat',
    desc: 'DXY at 106.2 — mixed signals, no clear directional pressure',
  },
  {
    name: 'Bond Yields',
    tag: 'YIELDS RISING',
    tagKind: 'bear',
    pct: 20,
    pctKind: 'bear',
    dir: 'down',
    desc: 'Real yield at 1.82% and rising — gold faces headwinds',
  },
  {
    name: 'Risk Sentiment',
    tag: 'RISK ON',
    tagKind: 'bear',
    pct: 50,
    pctKind: 'neut',
    dir: 'flat',
    desc: 'VIX at 17.8 — moderate, market seeking catalyst',
  },
  {
    name: 'Geopolitical Tension',
    tag: 'EXTREME',
    tagKind: 'extreme',
    pct: 75,
    pctKind: 'bull',
    dir: 'up',
    desc: 'GPR index at 282 — extreme geopolitical risk, mass safe-haven bid',
  },
  {
    name: 'Inflation & Momentum',
    tag: 'WEAKENING',
    tagKind: 'bear',
    pct: 20,
    pctKind: 'bear',
    dir: 'down',
    desc: 'Momentum weakening — breakevens at 2.36%, watch for reversal',
  },
];

function ArrowIcon({ dir }) {
  if (dir === 'up') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (dir === 'down') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M15 8l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ScoreDial({ value = 48, size = 128 }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value / 100;
  const dash = c * pct;
  const rest = c - dash;
  // color by band
  const color = value >= 75 ? '#5bc88a'
              : value >= 65 ? '#a0c95a'
              : value >= 50 ? '#e8b85a'
              : value >= 35 ? '#e88a5a'
              : '#ef5e5e';

  return (
    <div className="score-dial" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r}
                fill="none" stroke="var(--bg-3)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r}
                fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${rest}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 600ms var(--ease)' }} />
      </svg>
      <div className="score-dial-inner">
        <div className="score-dial-val">{value}</div>
        <div className="score-dial-unit">Score</div>
      </div>
    </div>
  );
}

function IntelPanel() {
  const score = 48;
  // position of marker across 5 zones 0-19, 20-34, 35-49, 50-64, 65-74, 75-100
  const markerPct = score; // simple pct

  return (
    <div className="intel-scroll">
      <div className="intel-inner">

        {/* SCORE HERO */}
        <div className="score-hero fade-in">
          <div className="score-hero-grid">
            <ScoreDial value={score} />
            <div className="score-body">
              <div className="score-label">
                <span className="dot" /> Gold Safe Haven Score
              </div>
              <div className="score-title">Neutral — Weakening Safe-Haven Demand</div>
              <div className="score-sub">
                At $4,831, the macro backdrop is <span className="em">unfavourable for gold today</span>. 2 of 5 factors are working against it. Score of 48 reflects weakening safe-haven demand.
              </div>
            </div>
            <div className="score-price-stack">
              <div className="cap">XAUUSD Spot</div>
              <div className="price mono">$4,831.40</div>
              <div className="delta mono">−12.60 · −0.26%</div>
              <div className="meta mono">18 APR · 10:34 UTC</div>
            </div>
          </div>

          {/* zone bar */}
          <div className="score-zone-bar">
            <div className="zone-track">
              <div className={`zone-seg z-weak ${score < 20 ? 'active' : ''}`} />
              <div className={`zone-seg z-low ${score >= 20 && score < 35 ? 'active' : ''}`} />
              <div className={`zone-seg z-neut ${score >= 35 && score < 50 ? 'active' : ''}`} />
              <div className={`zone-seg z-high ${score >= 50 && score < 75 ? 'active' : ''}`} />
              <div className={`zone-seg z-strong ${score >= 75 ? 'active' : ''}`} />
              <div className="zone-marker" style={{ left: `calc(${markerPct}% - 1px)` }} />
            </div>
            <div className="zone-labels">
              <span>0</span><span>20</span><span>35</span><span>50</span><span>65</span><span>75</span><span>100</span>
            </div>
          </div>
        </div>

        {/* DRIVER HEADLINE */}
        <div className="section-head">
          <h3>Macro Factors Driving Score</h3>
          <span className="meta">5 signals · updated 11s ago</span>
        </div>

        <div className="driver-bar">
          <div className="headline">
            <span className="q">"Geopolitical Tension is the primary driver today, offset by rising bond yields."</span>
          </div>
          <div className="ts mono">18 APR · 10:34 UTC</div>
        </div>

        <div className="factors">
          {factorsData.map((f, k) => (
            <div className="factor" key={k}>
              <div className={`factor-pct ${f.pctKind} mono`}>{f.pct}%</div>
              <div className={`factor-arrow ${f.pctKind}`}>
                <ArrowIcon dir={f.dir} />
              </div>
              <div className="factor-body">
                <div className="factor-name">{f.name}</div>
                <div className="factor-desc">{f.desc}</div>
              </div>
              <div className={`factor-tag ${f.tagKind}`}>{f.tag}</div>
            </div>
          ))}
        </div>

        {/* KEY LEVELS */}
        <div className="section-head">
          <h3>Key Levels to Watch</h3>
          <span className="meta">XAUUSD · 1D</span>
        </div>

        <div className="key-levels">
          <p>
            No clear edge — wait for score to break above <span className="num">65</span> (bullish) or below <span className="num">35</span> (bearish). Key pivot: <span className="num">$4,831</span>. Patience here protects capital.
          </p>
          <div className="level-stack">
            <div className="level">
              <div className="lbl">Resistance</div>
              <div className="val bear mono">$4,885.00</div>
              <div className="dist mono">+53.60 · +1.11%</div>
            </div>
            <div className="level">
              <div className="lbl">Pivot</div>
              <div className="val mono">$4,750.00</div>
              <div className="dist mono">−81.40 · −1.68%</div>
            </div>
            <div className="level">
              <div className="lbl">Support</div>
              <div className="val bull mono">$4,580.00</div>
              <div className="dist mono">−251.40 · −5.21%</div>
            </div>
          </div>
        </div>

        {/* ZONE LEGEND */}
        <div className="section-head">
          <h3>Score Zones</h3>
          <span className="meta">Threshold Framework</span>
        </div>

        <div className="zone-legend">
          <div className="zli">
            <div className="swatch" style={{ background: '#5bc88a' }} />
            <div>
              <div className="range mono">75–100</div>
              <div className="name">Strong Conviction</div>
            </div>
          </div>
          <div className="zli">
            <div className="swatch" style={{ background: '#a0c95a' }} />
            <div>
              <div className="range mono">65–74</div>
              <div className="name">High</div>
            </div>
          </div>
          <div className="zli">
            <div className="swatch" style={{ background: '#e8b85a' }} />
            <div>
              <div className="range mono">50–64</div>
              <div className="name">Neutral</div>
            </div>
          </div>
          <div className="zli">
            <div className="swatch" style={{ background: '#e88a5a' }} />
            <div>
              <div className="range mono">35–49</div>
              <div className="name">Low</div>
            </div>
          </div>
          <div className="zli">
            <div className="swatch" style={{ background: '#ef5e5e' }} />
            <div>
              <div className="range mono">0–34</div>
              <div className="name">Weak</div>
            </div>
          </div>
        </div>

        <div className="intel-foot">
          <span>DATA · REUTERS · CME · ICE · FRED</span>
          <span>NEXT UPDATE · 00:48</span>
        </div>

      </div>
    </div>
  );
}

window.IntelPanel = IntelPanel;
