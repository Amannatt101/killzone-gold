import { formatGmtPlus1DateTime, GMT_PLUS_ONE_LABEL } from "@/lib/timezone";

type Force = { name: string; weight: number; strong?: boolean };

const DEFAULT_BULL: Force[] = [
  { name: "Geopolitical Tension", weight: 28, strong: true },
  { name: "Central Bank Demand", weight: 18 },
  { name: "ETF Flows (WoW)", weight: 9 },
  { name: "Dollar Stagnation", weight: 7 },
];
const DEFAULT_BEAR: Force[] = [
  { name: "Real Yields Rising", weight: 22, strong: true },
  { name: "Risk-On Sentiment", weight: 9 },
  { name: "Inflation Cooling", weight: 5 },
  { name: "Momentum Fading", weight: 2 },
];

function forcesFromReasons(
  reasons: { factor: string; impact: string }[] | undefined,
): { bull: Force[]; bear: Force[] } {
  if (!reasons?.length) return { bull: DEFAULT_BULL, bear: DEFAULT_BEAR };
  const bullish = reasons.filter((r) => r.impact === "bullish");
  const bearish = reasons.filter((r) => r.impact === "bearish");
  if (!bullish.length && !bearish.length) return { bull: DEFAULT_BULL, bear: DEFAULT_BEAR };
  const bull: Force[] =
    bullish.length > 0
      ? bullish.map((r, i) => ({
          name: r.factor,
          weight: Math.max(6, 26 - i * 5),
          strong: i === 0,
        }))
      : DEFAULT_BULL;
  const bear: Force[] =
    bearish.length > 0
      ? bearish.map((r, i) => ({
          name: r.factor,
          weight: Math.max(4, 24 - i * 5),
          strong: i === 0,
        }))
      : DEFAULT_BEAR;
  return { bull, bear };
}

export function Battlefield({
  reasons,
  score,
  scoreTag,
  generatedAtIso,
  scoreLastChangedIso,
  nextRefreshIso,
}: {
  reasons?: { factor: string; impact: string }[];
  score?: number;
  scoreTag?: string;
  generatedAtIso?: string;
  scoreLastChangedIso?: string;
  nextRefreshIso?: string | null;
}) {
  const { bull: BULL_FORCES, bear: BEAR_FORCES } = forcesFromReasons(reasons);
  const bullSum = BULL_FORCES.reduce((a, b) => a + b.weight, 0);
  const bearSum = BEAR_FORCES.reduce((a, b) => a + b.weight, 0);
  const total = bullSum + bearSum;
  const bullPct = total ? Math.round((bullSum / total) * 100) : 50;
  const bearPct = 100 - bullPct;
  const edge = bullPct - bearPct;
  const leaning = edge > 0 ? "bull" : edge < 0 ? "bear" : "neutral";
  const leaningLabel =
    leaning === "bull" ? "LEANING BULLISH" : leaning === "bear" ? "LEANING BEARISH" : "BALANCED";
  const magnitude = Math.abs(edge) < 6 ? "Narrow" : Math.abs(edge) < 18 ? "Moderate" : "Decisive";
  const shownScore = Math.round(score ?? 50);
  const shownScorePrecise = Number((score ?? 50).toFixed(1));
  const shownTag = scoreTag ?? "NEUTRAL · LOW";
  const scoreColor = shownScore >= 65 ? "var(--ok)" : shownScore <= 35 ? "var(--danger)" : "var(--warn)";
  const generatedAt = generatedAtIso
    ? `${formatGmtPlus1DateTime(generatedAtIso, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} ${GMT_PLUS_ONE_LABEL}`
    : "—";
  const generatedAtCompact = generatedAtIso
    ? `${formatGmtPlus1DateTime(generatedAtIso, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })} ${GMT_PLUS_ONE_LABEL}`
    : "—";
  const nextRefreshAt = nextRefreshIso
    ? `${formatGmtPlus1DateTime(nextRefreshIso, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} ${GMT_PLUS_ONE_LABEL}`
    : "—";
  const lastChangedAt = scoreLastChangedIso
    ? `${formatGmtPlus1DateTime(scoreLastChangedIso, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })} ${GMT_PLUS_ONE_LABEL}`
    : "—";

  return (
    <div className="w-card accent">
      <div className="w-head">
        <div className="title">Bull vs Bear · Dominance</div>
        <div className="meta">WEIGHTED BY INSTITUTIONAL FLOW</div>
      </div>

      <div className="bf-hero">
        <div
          style={{
            marginBottom: 12,
            display: "inline-flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            padding: "10px 14px",
            border: `1px solid ${scoreColor}66`,
            borderRadius: 8,
            background: `${scoreColor}1a`,
            maxWidth: "100%",
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "var(--text-3)",
              textTransform: "uppercase",
            }}
          >
            Score
          </span>
          <span
            className="mono"
            style={{
              fontSize: 30,
              lineHeight: 1,
              fontWeight: 700,
              color: scoreColor,
            }}
          >
            {shownScorePrecise}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--text-2)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "3px 6px",
              borderRadius: 4,
              border: "1px solid var(--line-1)",
              background: "var(--bg-2)",
            }}
          >
            Generated {generatedAtCompact}
          </span>
          <span
            style={{
              fontSize: 13,
              letterSpacing: "0.06em",
              fontWeight: 600,
              color: scoreColor,
              textTransform: "uppercase",
            }}
          >
            {shownTag}
          </span>
          <div
            style={{
              flexBasis: "100%",
              borderTop: "1px solid var(--line-1)",
              marginTop: 4,
              paddingTop: 6,
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 14px",
              fontSize: 10,
              letterSpacing: "0.04em",
              color: "var(--text-2)",
              fontFamily: "Geist Mono, monospace",
            }}
          >
            <span>LAST CHANGED · {lastChangedAt}</span>
            <span>GENERATED · {generatedAt}</span>
            <span>NEXT REFRESH · {nextRefreshAt}</span>
          </div>
        </div>
        <div className="bf-hero-top">
          <div className="bf-hero-side bull">
            <div className="bf-hero-lbl">Supporting Gold</div>
            <div className="bf-hero-pct mono">{bullPct}%</div>
          </div>
          <div className={`bf-hero-verdict ${leaning}`}>
            <div className="bf-hero-verdict-arrow">
              {leaning === "bull" && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {leaning === "bear" && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12H5M11 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {leaning === "neutral" && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 9h16M4 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div className="bf-hero-verdict-text">
              <div className="bf-hero-verdict-lbl">{leaningLabel}</div>
              <div className="bf-hero-verdict-edge mono">
                {edge > 0 ? "+" : ""}
                {edge} pt edge · {magnitude}
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
          Bulls hold a <span className="em">{edge}-point edge</span> — a{" "}
          <span className="em">{magnitude.toLowerCase()} lean</span>{" "}
          {leaning === "bull"
            ? "toward support"
            : leaning === "bear"
              ? "toward pressure"
              : "with no clear winner"}
          . Spread is thin enough that a single yield print could flip dominance.
        </div>
      </div>

      <div className="battlefield-grid">
        <div className="bf-side bull">
          <div className="bf-head">
            <div className="bf-label bull">Supporting Forces</div>
            <div className="bf-dom bull mono">+{bullSum}</div>
          </div>
          <div className="bf-forces">
            {BULL_FORCES.map((f, i) => (
              <div key={i} className={`bf-force ${f.strong ? "strong" : ""}`}>
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
              <div key={i} className={`bf-force ${f.strong ? "strong" : ""}`}>
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
