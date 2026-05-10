/**
 * Human-readable factor copy derived from the same live inputs as /api/score.
 * Keeps Battlefield "Supporting / Opposing" rows tied to observable market data, not generic score language.
 */

import type { MonthlyData } from "@shared/schema";
import type { LiveScoreData } from "./live-data";

export type ScoreComponentRow = {
  name: string;
  score: number;
  weight: number;
  contribution: number;
};

type MacroSlice = Pick<
  MonthlyData,
  | "realYield"
  | "vix"
  | "breakeven"
  | "hySpread"
  | "usdBroad"
  | "gpr"
  | "goldClose"
  | "ryScore"
  | "usdScore"
  | "gprScore"
  | "cbScore"
  | "riskoffScore"
  | "inflationScore"
  | "momentumScore"
>;

function signedPct(x: number, digits = 2): string {
  const s = x >= 0 ? "+" : "−";
  return `${s}${Math.abs(x).toFixed(digits)}%`;
}

function macroFromLive(live: LiveScoreData): MacroSlice {
  return {
    realYield: live.realYield,
    vix: live.vix,
    breakeven: live.breakeven,
    hySpread: live.hySpread,
    usdBroad: live.usdBroad,
    gpr: live.gpr,
    goldClose: live.goldClose,
    ryScore: live.ryScore,
    usdScore: live.usdScore,
    gprScore: live.gprScore,
    cbScore: live.cbScore,
    riskoffScore: live.riskoffScore,
    inflationScore: live.inflationScore,
    momentumScore: live.momentumScore,
  };
}

function stanceFromScore(score: number, bullAbove = 55, bearBelow = 45): "supportive" | "headwind" | "mixed" {
  if (score >= bullAbove) return "supportive";
  if (score <= bearBelow) return "headwind";
  return "mixed";
}

function narrativeRealYieldDirection(m: MacroSlice, live?: LiveScoreData): string {
  const st = stanceFromScore(m.ryScore);
  const tail =
    live?.factorContext != null
      ? ` Latest daily move in 10Y TIPS real yield: ${signedPct(live.factorContext.realYieldDailyChange)} (FRED), which the model reads as ${
          live.factorContext.realYieldDailyChange <= 0 ? "less" : "more"
        } opportunity-cost pressure on gold.`
      : "";
  return `10Y TIPS real yield is ${m.realYield.toFixed(2)}% with a model score of ${m.ryScore.toFixed(1)}/100 (${st} for gold).${tail}`;
}

function narrativeUsdTrend(m: MacroSlice, live?: LiveScoreData): string {
  const st = stanceFromScore(m.usdScore);
  const tail =
    live?.factorContext != null
      ? ` Latest broad USD change vs prior observation: ${signedPct(live.factorContext.usdMomPct)} (DTWEXBGS).`
      : "";
  return `Broad USD index sits near ${m.usdBroad.toFixed(2)} (${st} for gold at score ${m.usdScore.toFixed(1)}/100).${tail}`;
}

function narrativeGpr(m: MacroSlice): string {
  const st = stanceFromScore(m.gprScore, 58, 42);
  return `GPR (geopolitical risk) reads ${m.gpr.toFixed(2)} with score ${m.gprScore.toFixed(1)}/100 — ${st} safe-haven demand in the model.`;
}

function narrativeCentralBank(_m: MacroSlice): string {
  return "Central bank demand is treated as a structural bid post-2022 (elevated score). Official buying reduces float and underpins dips even when tactical flows chop.";
}

function narrativeRiskOff(m: MacroSlice, live?: LiveScoreData): string {
  const st = stanceFromScore(m.riskoffScore);
  const tail =
    live?.factorContext != null
      ? ` Session deltas: VIX ${live.vix.toFixed(1)} vs prior ${live.factorContext.vixPrev.toFixed(1)}; HY OAS ${m.hySpread.toFixed(2)}% vs prior ${live.factorContext.hyPrev.toFixed(2)}%.`
      : "";
  return `Risk-off composite blends VIX (${m.vix.toFixed(1)}) and HY OAS (${m.hySpread.toFixed(2)}%) for score ${m.riskoffScore.toFixed(1)}/100 (${st} for gold).${tail}`;
}

function narrativeInflation(m: MacroSlice): string {
  const st = stanceFromScore(m.inflationScore);
  return `5Y breakeven inflation is ${m.breakeven.toFixed(2)}% (score ${m.inflationScore.toFixed(1)}/100) — ${st} for inflation-hedge demand in this framework.`;
}

function narrativeMomentum(m: MacroSlice, live?: LiveScoreData): string {
  const st = stanceFromScore(m.momentumScore);
  const tail =
    live?.factorContext != null
      ? ` Recent spot moves: ~${signedPct(live.factorContext.roc24hPct)} over ~24h, ~${signedPct(live.factorContext.roc6hPct)} over ~6h on the live gold tape.`
      : "";
  return `Gold momentum blends trend vs SMA and short-horizon impulse (score ${m.momentumScore.toFixed(1)}/100, ${st}).${tail}`;
}

function narrativeIntradayXauImpulse(live: LiveScoreData): string {
  const p = live.factorContext!;
  return `Fast tape: gold ~${signedPct(p.roc15mPct)} over ~15m and ~${signedPct(p.roc1hPct)} over ~1h from live intraday prices — this is the immediate bid/offer battle, not the monthly macro percentile.`;
}

function narrativeIntradayXauAccel(live: LiveScoreData): string {
  const p = live.factorContext!;
  const accel = p.roc1hPct - p.roc4hPct;
  return `Acceleration compares ~1h vs ~4h returns (${signedPct(p.roc1hPct)} vs ${signedPct(p.roc4hPct)}); net impulse shift ${signedPct(
    accel,
  )}. Rising acceleration often means short-term buyers are pressing; fading acceleration warns of exhaustion.`;
}

function narrativeIntradayUsdPulse(live: LiveScoreData): string {
  const p = live.factorContext!;
  return `USD pulse uses the latest broad-dollar move (${signedPct(
    p.usdMomPct,
  )} vs prior print). Firm USD typically caps gold on the intraday layer; softness frees upside.`;
}

function narrativeIntradayYieldPulse(live: LiveScoreData): string {
  const p = live.factorContext!;
  return `Yield pulse tracks the latest daily change in real yields (${signedPct(
    p.realYieldDailyChange,
  )} in yield terms). Higher real rates add carry pressure on gold over the tactical window.`;
}

function narrativeIntradayRiskPulse(live: LiveScoreData): string {
  const p = live.factorContext!;
  return `Risk pulse blends VIX and HY moves: VIX ${live.vix.toFixed(1)} (Δ vs prior ${(live.vix - p.vixPrev).toFixed(2)}), HY OAS ${live.hySpread.toFixed(
    2,
  )}% (Δ vs prior ${(live.hySpread - p.hyPrev).toFixed(2)} pp).`;
}

function narrativeIntradayXau2hImpulse(live: LiveScoreData): string {
  const p = live.factorContext!;
  return `2h gold impulse: ~${signedPct(p.roc1hPct)} over ~1h and ~${signedPct(p.roc4hPct)} over ~4h — slightly slower horizon than the 15m/1h strip but still tape-driven.`;
}

function narrativeIntradayXau2hStructure(live: LiveScoreData): string {
  const p = live.factorContext!;
  return `2h structure compares near-term vs ~8h drift (${signedPct(p.roc1hPct)} vs ${signedPct(p.roc8hPct)}). Positive spread means the latest hour is outperforming the morning trend.`;
}

function narrativeIntradayXau4hImpulse(live: LiveScoreData): string {
  const p = live.factorContext!;
  return `4h impulse weights ~4h vs ~8h gold returns (${signedPct(p.roc4hPct)} / ${signedPct(p.roc8hPct)}) for swing-style pressure on the board.`;
}

function narrativeIntradayXau4hStructure(live: LiveScoreData): string {
  const p = live.factorContext!;
  return `4h structure contrasts ~4h return with ~24h drift (${signedPct(p.roc4hPct)} vs ${signedPct(p.roc24hPct)}). Shows whether the current half-session is extending or mean-reverting the daily move.`;
}

/** Public: attach factorDetail to any component list using live or monthly macro snapshot. */
export function enrichComponentsWithFactorDetails(
  components: ScoreComponentRow[],
  opts: { live: LiveScoreData } | { monthly: MonthlyData },
): Array<ScoreComponentRow & { factorDetail: string }> {
  const live = "live" in opts ? opts.live : undefined;
  const monthly = "monthly" in opts ? opts.monthly : undefined;
  const m = live ? macroFromLive(live) : macroFromMonthly(monthly!);

  return components.map((c) => ({
    ...c,
    factorDetail: factorDetailForComponentName(c.name, m, live),
  }));
}

function macroFromMonthly(row: MonthlyData): MacroSlice {
  return {
    realYield: row.realYield,
    vix: row.vix,
    breakeven: row.breakeven,
    hySpread: row.hySpread,
    usdBroad: row.usdBroad,
    gpr: row.gpr,
    goldClose: row.goldClose,
    ryScore: row.ryScore,
    usdScore: row.usdScore,
    gprScore: row.gprScore,
    cbScore: row.cbScore,
    riskoffScore: row.riskoffScore,
    inflationScore: row.inflationScore,
    momentumScore: row.momentumScore,
  };
}

function factorDetailForComponentName(name: string, m: MacroSlice, live?: LiveScoreData): string {
  const n = name.toLowerCase();

  if (live?.factorContext) {
    if (n.includes("xau") && n.includes("15m")) return narrativeIntradayXauImpulse(live);
    if (n.includes("acceleration")) return narrativeIntradayXauAccel(live);
    if (n.includes("usd") && n.includes("pulse")) return narrativeIntradayUsdPulse(live);
    if ((n.includes("yield") || n.includes("real yield")) && n.includes("pulse"))
      return narrativeIntradayYieldPulse(live);
    if (n.includes("risk") && n.includes("pulse")) return narrativeIntradayRiskPulse(live);
    if (n.includes("xau") && n.includes("2h") && n.includes("impulse")) return narrativeIntradayXau2hImpulse(live);
    if (n.includes("xau") && n.includes("2h") && n.includes("structure")) return narrativeIntradayXau2hStructure(live);
    if (n.includes("xau") && n.includes("4h") && n.includes("impulse")) return narrativeIntradayXau4hImpulse(live);
    if (n.includes("xau") && n.includes("4h") && n.includes("structure")) return narrativeIntradayXau4hStructure(live);
  }

  if (n.includes("real yield") && n.includes("direction")) return narrativeRealYieldDirection(m, live);
  if (n.includes("usd") && n.includes("trend")) return narrativeUsdTrend(m, live);
  if (n.includes("gpr")) return narrativeGpr(m);
  if (n.includes("central bank")) return narrativeCentralBank(m);
  if (n.includes("risk-off") || n.includes("risk off")) return narrativeRiskOff(m, live);
  if (n.includes("inflation")) return narrativeInflation(m);
  if (n.includes("momentum")) return narrativeMomentum(m, live);

  if (n.includes("intraday")) {
    return `${name}: intraday-style tilt approximated on the client when fast data is unavailable — see macro factors above for the underlying drivers.`;
  }

  return `${name}: live macro snapshot (gold ~$${m.goldClose.toFixed(
    2,
  )}, real yield ${m.realYield.toFixed(2)}%, USD ${m.usdBroad.toFixed(2)}). Label did not match a known factor template; data is still from the live /api/score feed.`;
}
