const SESSIONS = [
  {
    name: "Asia",
    start: 0,
    end: 8,
    tz: "00:00 – 08:00 UTC",
    tone: "low" as const,
    toneLbl: "Low Volatility",
    body: (
      <>
        Typically <span className="em">range-bound</span>. Liquidity thin ex-China — positioning into
        London open matters more than price.
      </>
    ),
    stat: "Avg range · 0.28%",
  },
  {
    name: "London",
    start: 7,
    end: 15,
    tz: "07:00 – 15:00 UTC",
    tone: "high" as const,
    toneLbl: "Primary Killzone",
    body: (
      <>
        Highest edge for <span className="em">breakout execution</span>. LBMA fix at 10:30 & 15:00 —
        expect sharp directional moves if narrative pressure is unresolved.
      </>
    ),
    stat: "Avg range · 0.74%",
  },
  {
    name: "New York",
    start: 13,
    end: 21,
    tz: "13:00 – 21:00 UTC",
    tone: "med" as const,
    toneLbl: "Secondary Killzone",
    body: (
      <>
        Overlap hour drives <span className="em">two-way flow</span>. DXY-correlated — watch 14:00
        UTC cross-market reactions around U.S. data.
      </>
    ),
    stat: "Avg range · 0.61%",
  },
];

function sessionStatus(active: boolean, s: (typeof SESSIONS)[0], nowHour: number): string {
  if (!active) {
    if (nowHour < s.start) {
      const opensIn = s.start - nowHour;
      const h = Math.floor(opensIn);
      const m = Math.round((opensIn - h) * 60);
      return `Opens in ${h}h ${m}m`;
    }
    return "Closed";
  }
  const left = s.end - nowHour;
  const h = Math.floor(left);
  const m = Math.round((left - h) * 60);
  return `Live · ${h}h ${m}m remaining`;
}

export function KillzoneTiming() {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const nowHour = utcH + utcM / 60;
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
            <div key={i} className={`kz-session ${active ? "active" : ""}`}>
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
              <div
                style={{
                  marginTop: 8,
                  fontFamily: "Geist Mono, monospace",
                  fontSize: 10,
                  color: active ? "var(--gold-bright)" : "var(--text-3)",
                  letterSpacing: "0.04em",
                }}
              >
                {sessionStatus(active, s, nowHour)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="kz-timeline">
        <div className="kz-track">
          {SESSIONS.map((s, i) => (
            <div
              key={i}
              className={`kz-zone ${nowHour >= s.start && nowHour < s.end ? "active" : ""}`}
              style={{
                left: `${(s.start / 24) * 100}%`,
                width: `${((s.end - s.start) / 24) * 100}%`,
              }}
            />
          ))}
          <div className="kz-now" style={{ left: `${nowPct}%` }} />
        </div>
        <div className="kz-hours">
          <span>00</span>
          <span>04</span>
          <span>08</span>
          <span>12</span>
          <span>16</span>
          <span>20</span>
          <span>24</span>
        </div>
      </div>
    </div>
  );
}
