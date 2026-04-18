const REGIMES = [
  {
    key: "range" as const,
    name: "Range",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12h18M6 8l-3 4 3 4M18 8l3 4-3 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "trend" as const,
    name: "Trending",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 17l6-6 4 4 8-8M21 7h-5M21 7v5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "vol" as const,
    name: "Vol Expansion",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12h3l2-6 4 12 4-9 2 3h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function regimeKeyFromLabel(regime: string): "range" | "trend" | "vol" {
  const r = regime.toLowerCase();
  if (r.includes("trend") || r.includes("bullish") || r.includes("bearish bias")) return "trend";
  if (r.includes("vol") || r.includes("expansion")) return "vol";
  return "range";
}

export function MarketRegime({ regimeLabel }: { regimeLabel: string }) {
  const activeKey = regimeKeyFromLabel(regimeLabel);

  return (
    <div className="w-card">
      <div className="w-head">
        <div className="title">Market Regime</div>
        <div className="meta">FROM LIVE SCORE REGIME</div>
      </div>
      <div className="regime-body">
        <div className="regime-states">
          {REGIMES.map((r) => (
            <div key={r.key} className={`regime-state ${r.key === activeKey ? "active" : ""}`}>
              <div className="regime-icon">{r.icon}</div>
              <div className="regime-name">{r.name}</div>
            </div>
          ))}
        </div>
        <div className="regime-desc">{regimeLabel}</div>
        <div className="regime-metrics">
          <div className="regime-metric">
            <div className="lbl">Model</div>
            <div className="val mono">7-factor</div>
            <div className="sub mono">safe haven</div>
          </div>
          <div className="regime-metric">
            <div className="lbl">Horizon</div>
            <div className="val mono">Macro</div>
            <div className="sub mono">not intraday</div>
          </div>
          <div className="regime-metric">
            <div className="lbl">Stance</div>
            <div className="val mono">Context</div>
            <div className="sub mono">not a signal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
