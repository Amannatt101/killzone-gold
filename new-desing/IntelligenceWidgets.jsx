/* IntelligenceWidgets.jsx — chart-less widget library */

const { useMemo, useState, useEffect } = React;

/* ============================================
   MARKET NARRATIVE HERO
   ============================================ */
function MarketNarrative() {
  return (
    <>
      <div className="bf-disclaimer bf-disclaimer-standalone">
        <svg className="bf-disclaimer-ic" width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <circle cx="8" cy="11" r="0.7" fill="currentColor"/>
        </svg>
        <div>
          <span className="bf-disclaimer-lbl">Narrative, not a signal.</span> Gold carries significant intraday volatility and is exposed to macro shocks, policy prints, and geopolitical tail events. This dashboard is a framing tool for context — not a directional recommendation. Size your exposure, define invalidation, and make your own decisions.
        </div>
      </div>
    <div className="narrative">
      <div className="narrative-top">
        <div className="narrative-eyebrow">
          <span className="pulse" />
          <span>Live Market Narrative</span>
          <span className="sep">·</span>
          <span>XAU / USD</span>
        </div>
        <div className="narrative-ts">UPDATED 18 APR · 10:34 UTC</div>
      </div>

      <div className="narrative-statement">
        Gold is holding <span className="em">above $4,800</span> on geopolitical anxiety, but rising real yields are <span className="em">quietly draining conviction</span> from the safe-haven bid.
      </div>

      <div className="narrative-sub">
        The market is paying for insurance, not positioning for a rally. Flows remain defensive while the dollar trades flat. Until yields relent or a risk event escalates, price action will remain a tug-of-war — no clean edge in either direction.
      </div>

      <div className="narrative-forces">
        <div className="nf-col">
          <div className="nf-lbl">Primary Driver <span className="chip primary">SUPPORT</span></div>
          <div className="nf-value">Geopolitical Tension</div>
          <div className="nf-desc">GPR index at 282 — elevated bid for safe-haven assets across central-bank and institutional flow.</div>
        </div>
        <div className="nf-vs">VS</div>
        <div className="nf-col">
          <div className="nf-lbl">Opposing Force <span className="chip opposing">PRESSURE</span></div>
          <div className="nf-value">Rising Real Yields</div>
          <div className="nf-desc">10Y real at 1.82% — opportunity cost of holding a non-yielding asset is climbing into restrictive territory.</div>
        </div>
      </div>
    </div>
    </>
  );
}

/* ============================================
   BULL vs BEAR BATTLEFIELD
   ============================================ */
const BULL_FORCES = [
  { name: 'Geopolitical Tension', weight: 28, strong: true },
  { name: 'Central Bank Demand', weight: 18 },
  { name: 'ETF Flows (WoW)', weight: 9 },
  { name: 'Dollar Stagnation', weight: 7 },
];
const BEAR_FORCES = [
  { name: 'Real Yields Rising', weight: 22, strong: true },
  { name: 'Risk-On Sentiment', weight: 9 },
  { name: 'Inflation Cooling', weight: 5 },
  { name: 'Momentum Fading', weight: 2 },
];

function Battlefield() {
  const bullSum = BULL_FORCES.reduce((a, b) => a + b.weight, 0);
  const bearSum = BEAR_FORCES.reduce((a, b) => a + b.weight, 0);
  const total = bullSum + bearSum;
  const bullPct = Math.round((bullSum / total) * 100);
  const bearPct = 100 - bullPct;
  const edge = bullPct - bearPct;
  const leaning = edge > 0 ? 'bull' : edge < 0 ? 'bear' : 'neutral';
  const leaningLabel = leaning === 'bull' ? 'LEANING BULLISH' : leaning === 'bear' ? 'LEANING BEARISH' : 'BALANCED';
  const magnitude = Math.abs(edge) < 6 ? 'Narrow' : Math.abs(edge) < 18 ? 'Moderate' : 'Decisive';

  return (
    <div className="w-card accent">
      <div className="w-head">
        <div className="title">Bull vs Bear · Dominance</div>
        <div className="meta">WEIGHTED BY INSTITUTIONAL FLOW</div>
      </div>

      {/* DOMINANCE HERO — at the top */}
      <div className="bf-hero">
        <div className="bf-hero-top">
          <div className="bf-hero-side bull">
            <div className="bf-hero-lbl">Supporting Gold</div>
            <div className="bf-hero-pct mono">{bullPct}%</div>
          </div>
          <div className={`bf-hero-verdict ${leaning}`}>
            <div className="bf-hero-verdict-arrow">
              {leaning === 'bull' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {leaning === 'bear' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {leaning === 'neutral' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 9h16M4 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <div className="bf-hero-verdict-text">
              <div className="bf-hero-verdict-lbl">{leaningLabel}</div>
              <div className="bf-hero-verdict-edge mono">
                {edge > 0 ? '+' : ''}{edge} pt edge · {magnitude}
              </div>
            </div>
          </div>
          <div className="bf-hero-side bear">
            <div className="bf-hero-lbl">Opposing Gold</div>
            <div className="bf-hero-pct mono">{bearPct}%</div>
          </div>
        </div>

        <div className="bf-hero-bar">
          <div className="bull" style={{ width: `${bullPct}%` }}>
            <span className="bf-hero-bar-lbl">{bullPct}%</span>
          </div>
          <div className="bear" style={{ width: `${bearPct}%` }}>
            <span className="bf-hero-bar-lbl">{bearPct}%</span>
          </div>
          <div className="bf-hero-bar-center" />
          <div className="bf-hero-bar-marker" style={{ left: `${bullPct}%` }}>
            <div className="bf-hero-bar-marker-dot" />
          </div>
        </div>

        <div className="bf-hero-verdict-copy">
          Bulls hold a <span className="em">{edge}-point edge</span> — a <span className="em">{magnitude.toLowerCase()} lean</span> {leaning === 'bull' ? 'toward support' : leaning === 'bear' ? 'toward pressure' : 'with no clear winner'}. Spread is thin enough that a single yield print could flip dominance.
        </div>
      </div>

      {/* FORCES BREAKDOWN */}
      <div className="battlefield-grid">
        <div className="bf-side bull">
          <div className="bf-head">
            <div className="bf-label bull">Supporting Forces</div>
            <div className="bf-dom bull mono">+{bullSum}</div>
          </div>
          <div className="bf-forces">
            {BULL_FORCES.map((f, i) => (
              <div key={i} className={`bf-force ${f.strong ? 'strong' : ''}`}>
                <div className="bf-force-name">{f.name}</div>
                <div className="bf-force-wt bull">+{f.weight}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bf-side bear">
          <div className="bf-head">
            <div className="bf-label bear">Opposing Forces</div>
            <div className="bf-dom bear mono">−{bearSum}</div>
          </div>
          <div className="bf-forces">
            {BEAR_FORCES.map((f, i) => (
              <div key={i} className={`bf-force ${f.strong ? 'strong' : ''}`}>
                <div className="bf-force-name">{f.name}</div>
                <div className="bf-force-wt bear">−{f.weight}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   SCORE HISTORY (NO PRICE)
   ============================================ */
const SCORE_HISTORY = [
  { d: '05 Apr', s: 71 },
  { d: '06 Apr', s: 68 },
  { d: '07 Apr', s: 66 },
  { d: '08 Apr', s: 64 },
  { d: '09 Apr', s: 62 },
  { d: '10 Apr', s: 58 },
  { d: '11 Apr', s: 55 },
  { d: '12 Apr', s: 52 },
  { d: '13 Apr', s: 54 },
  { d: '14 Apr', s: 51 },
  { d: '15 Apr', s: 49 },
  { d: '16 Apr', s: 50 },
  { d: '17 Apr', s: 49 },
  { d: '18 Apr', s: 48 },
];

const SHIFTS = [
  { from: '04 Apr', to: '07 Apr', chg: -5, kind: 'down', reason: 'Real yields broke above 1.60% — rate sensitivity reasserted as a first-order driver.' },
  { from: '08 Apr', to: '11 Apr', chg: -11, kind: 'down', reason: 'Equity melt-up softened risk-off positioning; ETF inflows turned negative for the first time in 6 weeks.' },
  { from: '13 Apr', to: '16 Apr', chg: -4, kind: 'down', reason: 'Geopolitical headline intensity eased marginally as diplomatic channels reopened.' },
  { from: '17 Apr', to: '18 Apr', chg: -1, kind: 'flat', reason: 'Consolidation. No new drivers — score drifting sideways below the 50-line.' },
];

function ScoreHistory() {
  const colorFor = (s) =>
    s >= 75 ? '#5bc88a' :
    s >= 65 ? '#a0c95a' :
    s >= 50 ? '#e8b85a' :
    s >= 35 ? '#e88a5a' : '#ef5e5e';

  const current = SCORE_HISTORY[SCORE_HISTORY.length - 1].s;
  const twoWeeksAgo = SCORE_HISTORY[0].s;
  const delta = current - twoWeeksAgo;

  return (
    <div className="w-card">
      <div className="w-head">
        <div className="title">Score History · 14 Days</div>
        <div className="meta">NO PRICE DATA</div>
      </div>
      <div className="w-body">
        <div className="sh-trend">
          <div className="now">
            <span className="v mono">48</span>
            <span className="lbl">Current Score</span>
          </div>
          <div className="sh-trend" style={{ gap: 8 }}>
            <span className={`delta ${delta >= 0 ? 'up' : 'down'} mono`}>
              {delta >= 0 ? '+' : ''}{delta} in 14d
            </span>
            <span style={{ fontFamily: 'Geist Mono', fontSize: 11, color: 'var(--text-3)' }}>
              from {twoWeeksAgo}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="sh-bars">
            {SCORE_HISTORY.map((h, i) => (
              <div key={i}
                   className="sh-bar"
                   data-score={`${h.d} · ${h.s}`}
                   style={{
                     height: `${(h.s / 100) * 100}%`,
                     background: `linear-gradient(180deg, ${colorFor(h.s)} 0%, ${colorFor(h.s)}66 100%)`,
                     boxShadow: i === SCORE_HISTORY.length - 1 ? `0 0 12px ${colorFor(h.s)}80` : 'none',
                   }} />
            ))}
          </div>
          <div className="sh-xlabels">
            {SCORE_HISTORY.map((h, i) => (
              <span key={i}>{h.d.split(' ')[0]}</span>
            ))}
          </div>
        </div>

        <div className="sh-shifts">
          {SHIFTS.map((s, i) => (
            <div key={i} className={`sh-shift ${s.kind}`}>
              <div className="sh-shift-date mono">{s.from}</div>
              <div className={`sh-shift-chg ${s.kind} mono`}>
                {s.chg >= 0 ? '+' : ''}{s.chg}
              </div>
              <div className="sh-shift-reason">{s.reason}</div>
              <div className="sh-shift-range mono">→ {s.to}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================
   INVALIDATION CONDITIONS
   ============================================ */
const INVALIDATIONS = [
  { trigger: <>Real yields break <span className="num">above 2.00%</span> and hold for two daily closes</>, exp: 'Would confirm rate regime has overtaken safe-haven demand as the dominant driver. Current narrative collapses.', status: 'near', statusLbl: 'NEAR' },
  { trigger: <>GPR index falls <span className="num">below 220</span> on a sustained basis</>, exp: 'Removes the primary bullish pillar. Without geopolitical bid, positioning is structurally offside.', status: 'armed', statusLbl: 'ARMED' },
  { trigger: <>DXY closes <span className="num">above 108.50</span> with confirming rate differential move</>, exp: 'Dollar strength would compound the yield pressure. Safe-haven score would likely drop below 35.', status: 'armed', statusLbl: 'ARMED' },
  { trigger: <>Weekly central-bank gold flow turns net negative</>, exp: 'Removes the structural floor that has cushioned previous drawdowns. Long-horizon bulls lose their anchor.', status: 'remote', statusLbl: 'REMOTE' },
  { trigger: <>VIX spikes <span className="num">above 28</span> while gold fails to rally</>, exp: 'Breakdown of the safe-haven correlation — signals gold has lost its defensive premium entirely.', status: 'remote', statusLbl: 'REMOTE' },
];

function Invalidation() {
  return (
    <div className="w-card">
      <div className="w-head">
        <div className="title">Invalidation Conditions</div>
        <div className="meta">WHAT WOULD BREAK THIS NARRATIVE</div>
      </div>
      <div className="inv-list">
        {INVALIDATIONS.map((iv, i) => (
          <div key={i} className="inv-row">
            <div className="inv-idx">0{i + 1}</div>
            <div className="inv-body">
              <div className="inv-trigger">{iv.trigger}</div>
              <div className="inv-exp">{iv.exp}</div>
            </div>
            <div className={`inv-status ${iv.status}`}>{iv.statusLbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================
   KILLZONE TIMING WIDGET
   ============================================ */
const SESSIONS = [
  { name: 'Asia', start: 0, end: 8, tz: '00:00 – 08:00 UTC', tone: 'low', toneLbl: 'Low Volatility',
    body: <>Typically <span className="em">range-bound</span>. Liquidity thin ex-China — positioning into London open matters more than price.</>,
    stat: 'Avg range · 0.28%', status: 'Closed' },
  { name: 'London', start: 7, end: 15, tz: '07:00 – 15:00 UTC', tone: 'high', toneLbl: 'Primary Killzone',
    body: <>Highest edge for <span className="em">breakout execution</span>. LBMA fix at 10:30 & 15:00 — expect sharp directional moves if narrative pressure is unresolved.</>,
    stat: 'Avg range · 0.74%', status: 'Live · 3h 24m remaining' },
  { name: 'New York', start: 13, end: 21, tz: '13:00 – 21:00 UTC', tone: 'med', toneLbl: 'Secondary Killzone',
    body: <>Overlap hour drives <span className="em">two-way flow</span>. DXY-correlated — watch 14:00 UTC cross-market reactions around U.S. data.</>,
    stat: 'Avg range · 0.61%', status: 'Opens in 2h 26m' },
];

function KillzoneTiming() {
  // current hour (fixed 10:34 UTC to match narrative)
  const nowHour = 10 + 34 / 60;
  const nowPct = (nowHour / 24) * 100;

  return (
    <div className="w-card accent">
      <div className="w-head">
        <div className="title">Killzone Timing</div>
        <div className="meta">SESSION EXPECTATIONS · UTC</div>
      </div>
      <div className="kz-sessions">
        {SESSIONS.map((s, i) => {
          const active = nowHour >= s.start && nowHour < s.end;
          return (
            <div key={i} className={`kz-session ${active ? 'active' : ''}`}>
              <div className="kz-session-head">
                <div className="kz-session-name">
                  <span className="kz-session-dot" />
                  {s.name}
                </div>
                <div className="kz-session-time mono">{s.tz}</div>
              </div>
              <div className="kz-session-body">{s.body}</div>
              <div className="kz-session-footer">
                <span className="mono">{s.stat}</span>
                <span className={`kz-session-tone ${s.tone}`}>{s.toneLbl}</span>
              </div>
              <div style={{ marginTop: 8, fontFamily: 'Geist Mono', fontSize: 10, color: active ? 'var(--gold-bright)' : 'var(--text-3)', letterSpacing: '0.04em' }}>
                {s.status}
              </div>
            </div>
          );
        })}
      </div>
      <div className="kz-timeline">
        <div className="kz-track">
          {SESSIONS.map((s, i) => (
            <div key={i}
                 className={`kz-zone ${nowHour >= s.start && nowHour < s.end ? 'active' : ''}`}
                 style={{ left: `${(s.start / 24) * 100}%`, width: `${((s.end - s.start) / 24) * 100}%` }} />
          ))}
          <div className="kz-now" style={{ left: `${nowPct}%` }} />
        </div>
        <div className="kz-hours">
          <span>00</span><span>04</span><span>08</span><span>12</span><span>16</span><span>20</span><span>24</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   MARKET REGIME INDICATOR
   ============================================ */
const REGIMES = [
  { key: 'range', name: 'Range', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M6 8l-3 4 3 4M18 8l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { key: 'trend', name: 'Trending', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 17l6-6 4 4 8-8M21 7h-5M21 7v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { key: 'vol', name: 'Vol Expansion', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 12h3l2-6 4 12 4-9 2 3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
];

function MarketRegime() {
  const activeKey = 'range';
  return (
    <div className="w-card">
      <div className="w-head">
        <div className="title">Market Regime</div>
        <div className="meta">20D ATR · KALMAN STATE</div>
      </div>
      <div className="regime-body">
        <div className="regime-states">
          {REGIMES.map(r => (
            <div key={r.key} className={`regime-state ${r.key === activeKey ? 'active' : ''}`}>
              <div className="regime-icon">{r.icon}</div>
              <div className="regime-name">{r.name}</div>
            </div>
          ))}
        </div>
        <div className="regime-desc">
          Gold is in a <span className="em">compression range</span>. Realised vol has contracted to the 28th percentile of the last 90 days. Expect mean-reversion inside the band; treat breakouts with <span className="em">scepticism until confirmed by a macro catalyst</span>.
        </div>
        <div className="regime-metrics">
          <div className="regime-metric">
            <div className="lbl">Realised Vol</div>
            <div className="val mono">11.4%</div>
            <div className="sub mono">28th pct · 90d</div>
          </div>
          <div className="regime-metric">
            <div className="lbl">ATR (14)</div>
            <div className="val mono">$38.20</div>
            <div className="sub mono">−22% MoM</div>
          </div>
          <div className="regime-metric">
            <div className="lbl">Hurst Exp.</div>
            <div className="val mono">0.41</div>
            <div className="sub mono">mean-reverting</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   POSITIONING BIAS
   ============================================ */
function PositioningBias() {
  return (
    <div className="w-card">
      <div className="w-head">
        <div className="title">Positioning Bias</div>
        <div className="meta">APPROACH · NOT A SIGNAL</div>
      </div>
      <div className="bias-head">
        <div className="bias-badge">
          <div style={{ textAlign: 'center' }}>
            <div className="lbl">Bias</div>
            <div className="val neutral">NEUTRAL</div>
          </div>
        </div>
        <div className="bias-copy">
          <div className="bias-title">Stand aside — wait for structure.</div>
          <div className="bias-body">
            The score sits in the <span style={{ color: 'var(--warn)' }}>neutral zone (35–49)</span>. Opposing forces are approximately balanced; conviction here is low-value and the reward-to-risk for directional exposure is unfavourable.
          </div>
        </div>
      </div>

      <div className="bias-scale">
        <div className="bias-scale-track">
          <div className="bias-scale-marker" style={{ left: '48%' }} />
        </div>
        <div className="bias-scale-labels">
          <span className="bear">STRUCTURAL SHORT</span>
          <span className="neu">NEUTRAL</span>
          <span className="bull">STRUCTURAL LONG</span>
        </div>
      </div>

      <div className="bias-principles">
        <div className="bias-principle">
          <div className="ic">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="t">Patience</div>
            <div className="c">Wait for score &gt; 65 or &lt; 35 before committing capital.</div>
          </div>
        </div>
        <div className="bias-principle">
          <div className="ic">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 13l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 5h3v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div className="t">Asymmetry</div>
            <div className="c">Only deploy when invalidation is clearly defined &amp; tight.</div>
          </div>
        </div>
        <div className="bias-principle">
          <div className="ic">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.3"/></svg>
          </div>
          <div>
            <div className="t">Confluence</div>
            <div className="c">Require ≥3 aligned factors before overriding neutrality.</div>
          </div>
        </div>
        <div className="bias-principle">
          <div className="ic">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 0 1 12 0v2l-2-1-2 1-2-1-2 1-2-1-2 1V8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div className="t">Humility</div>
            <div className="c">Size down when narrative is unresolved, not the opposite.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  MarketNarrative,
  Battlefield,
  ScoreHistory,
  Invalidation,
  KillzoneTiming,
  MarketRegime,
  PositioningBias,
});
