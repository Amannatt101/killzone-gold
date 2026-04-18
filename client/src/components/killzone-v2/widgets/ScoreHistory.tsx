import { useMemo } from "react";

const STATIC_SCORE_HISTORY = [
  { d: "05 Apr", s: 71 },
  { d: "06 Apr", s: 68 },
  { d: "07 Apr", s: 66 },
  { d: "08 Apr", s: 64 },
  { d: "09 Apr", s: 62 },
  { d: "10 Apr", s: 58 },
  { d: "11 Apr", s: 55 },
  { d: "12 Apr", s: 52 },
  { d: "13 Apr", s: 54 },
  { d: "14 Apr", s: 51 },
  { d: "15 Apr", s: 49 },
  { d: "16 Apr", s: 50 },
  { d: "17 Apr", s: 49 },
  { d: "18 Apr", s: 48 },
];

const SHIFTS = [
  {
    from: "04 Apr",
    to: "07 Apr",
    chg: -5,
    kind: "down" as const,
    reason: "Real yields broke above 1.60% — rate sensitivity reasserted as a first-order driver.",
  },
  {
    from: "08 Apr",
    to: "11 Apr",
    chg: -11,
    kind: "down" as const,
    reason:
      "Equity melt-up softened risk-off positioning; ETF inflows turned negative for the first time in 6 weeks.",
  },
  {
    from: "13 Apr",
    to: "16 Apr",
    chg: -4,
    kind: "down" as const,
    reason: "Geopolitical headline intensity eased marginally as diplomatic channels reopened.",
  },
  {
    from: "17 Apr",
    to: "18 Apr",
    chg: -1,
    kind: "flat" as const,
    reason: "Consolidation. No new drivers — score drifting sideways below the 50-line.",
  },
];

function colorFor(s: number): string {
  return s >= 75
    ? "#5bc88a"
    : s >= 65
      ? "#a0c95a"
      : s >= 50
        ? "#e8b85a"
        : s >= 35
          ? "#e88a5a"
          : "#ef5e5e";
}

export function ScoreHistory({
  series,
}: {
  series?: { d: string; s: number }[];
}) {
  const SCORE_HISTORY = useMemo(() => {
    if (series?.length) return series.slice(-14);
    return STATIC_SCORE_HISTORY;
  }, [series]);

  const current = SCORE_HISTORY[SCORE_HISTORY.length - 1]?.s ?? 48;
  const twoWeeksAgo = SCORE_HISTORY[0]?.s ?? current;
  const delta = current - twoWeeksAgo;

  return (
    <div className="w-card">
      <div className="w-head">
        <div className="title">Score History · 14 Days</div>
        <div className="meta">{series?.length ? "FROM MODEL HISTORY" : "ILLUSTRATIVE"}</div>
      </div>
      <div className="w-body">
        <div className="sh-trend">
          <div className="now">
            <span className="v mono">{current}</span>
            <span className="lbl">Current Score</span>
          </div>
          <div className="sh-trend" style={{ gap: 8 }}>
            <span className={`delta ${delta >= 0 ? "up" : "down"} mono`}>
              {delta >= 0 ? "+" : ""}
              {delta} in 14d
            </span>
            <span
              style={{
                fontFamily: "Geist Mono, monospace",
                fontSize: 11,
                color: "var(--text-3)",
              }}
            >
              from {twoWeeksAgo}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="sh-bars">
            {SCORE_HISTORY.map((h, i) => (
              <div
                key={i}
                className="sh-bar"
                data-score={`${h.d} · ${h.s}`}
                style={{
                  height: `${(h.s / 100) * 100}%`,
                  background: `linear-gradient(180deg, ${colorFor(h.s)} 0%, ${colorFor(h.s)}66 100%)`,
                  boxShadow:
                    i === SCORE_HISTORY.length - 1 ? `0 0 12px ${colorFor(h.s)}80` : "none",
                }}
              />
            ))}
          </div>
          <div className="sh-xlabels">
            {SCORE_HISTORY.map((h, i) => (
              <span key={i}>{h.d.split(" ")[0]}</span>
            ))}
          </div>
        </div>

        <div className="sh-shifts">
          {SHIFTS.map((s, i) => (
            <div key={i} className={`sh-shift ${s.kind}`}>
              <div className="sh-shift-date mono">{s.from}</div>
              <div className={`sh-shift-chg ${s.kind} mono`}>
                {s.chg >= 0 ? "+" : ""}
                {s.chg}
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
