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

export function MarketRegime({
  regimeLabel,
  metrics,
}: {
  regimeLabel: string;
  metrics?: { label: string; value: string; sub: string }[];
}) {
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
          {(metrics?.length
            ? metrics
            : [
                { label: "Model", value: "7-factor", sub: "safe haven" },
                { label: "Horizon", value: "Macro", sub: "not intraday" },
                { label: "Stance", value: "Context", sub: "not a signal" },
              ]
          ).map((m) => (
            <div className="regime-metric" key={m.label}>
              <div className="lbl">{m.label}</div>
              <div className="val mono">{m.value}</div>
              <div className="sub mono">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
