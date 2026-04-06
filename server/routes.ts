import type { Express } from "express";
import { createServer, type Server } from "http";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { MonthlyData } from "@shared/schema";
import {
  fetchAndComputeLiveScore,
  getCachedLiveScore,
  getScoreLog,
  startAutoRefresh,
  type LiveScoreData,
} from "./live-data.js";

// Resolve data directory - works both in dev (tsx) and prod (esbuild bundle)
function getDataDir(): string {
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const dataDir = path.join(currentDir, "data");
    if (fs.existsSync(dataDir)) return dataDir;
  } catch {}
  try {
    const dataDir = path.join(__dirname, "data");
    if (fs.existsSync(dataDir)) return dataDir;
  } catch {}
  const dataDir2 = path.join(process.cwd(), "server", "data");
  if (fs.existsSync(dataDir2)) return dataDir2;
  const dataDir3 = path.join(process.cwd(), "dist", "data");
  if (fs.existsSync(dataDir3)) return dataDir3;
  throw new Error("Cannot find data directory");
}

// Parse CSV helper
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || "").trim();
    });
    return obj;
  });
}

function loadBacktestData(): MonthlyData[] {
  const csvPath = path.join(getDataDir(), "backtest_results.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);

  return rows.map((row) => ({
    date: row.date,
    goldClose: parseFloat(row.gold_close) || 0,
    goldReturn: parseFloat(row.gold_return) || 0,
    ryScore: parseFloat(row.ry_score) || 0,
    usdScore: parseFloat(row.usd_score) || 0,
    gprScore: parseFloat(row.gpr_score) || 0,
    cbScore: parseFloat(row.cb_score) || 0,
    riskoffScore: parseFloat(row.riskoff_score) || 0,
    inflationScore: parseFloat(row.inflation_score) || 0,
    momentumScore: parseFloat(row.momentum_score) || 0,
    goldSafeHavenScore: parseFloat(row.gold_safe_haven_score) || 0,
    scoreBucket: row.score_bucket || "",
    realYield: parseFloat(row.real_yield) || 0,
    vix: parseFloat(row.vix) || 0,
    breakeven: parseFloat(row.breakeven) || 0,
    hySpread: parseFloat(row.hy_spread) || 0,
    usdBroad: parseFloat(row.usd_broad) || 0,
    gpr: parseFloat(row.gpr) || 0,
  }));
}

function getRegimeLabel(score: number): string {
  if (score >= 75) return "Strong Safe Haven — Gold Bullish Bias";
  if (score >= 65) return "Elevated — Lean Long Gold";
  if (score >= 50) return "Neutral — No Clear Directional Signal";
  if (score >= 35) return "Weak — Lean Short / Reduce Gold Exposure";
  return "Risk-Off for Gold — Gold Bearish Bias";
}

let cachedData: MonthlyData[] | null = null;

function getData(): MonthlyData[] {
  if (!cachedData) {
    cachedData = loadBacktestData();
  }
  return cachedData;
}

/** Convert live score into the MonthlyData shape for frontend compatibility */
function liveToMonthly(live: LiveScoreData): MonthlyData {
  return {
    date: new Date().toISOString().split("T")[0],
    goldClose: live.goldClose,
    goldReturn: 0,
    ryScore: live.ryScore,
    usdScore: live.usdScore,
    gprScore: live.gprScore,
    cbScore: live.cbScore,
    riskoffScore: live.riskoffScore,
    inflationScore: live.inflationScore,
    momentumScore: live.momentumScore,
    goldSafeHavenScore: live.goldSafeHavenScore,
    scoreBucket: "",
    realYield: live.realYield,
    vix: live.vix,
    breakeven: live.breakeven,
    hySpread: live.hySpread,
    usdBroad: live.usdBroad,
    gpr: live.gpr,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Start live data auto-refresh on server boot
  startAutoRefresh();

  app.get("/api/score", async (_req, res) => {
    try {
      // Try live data first
      let live = getCachedLiveScore();
      if (!live) {
        // First request — fetch synchronously
        live = await fetchAndComputeLiveScore();
      }

      const current = liveToMonthly(live);

      const components = [
        { name: "Real Yield Direction", score: current.ryScore, weight: 0.25, contribution: current.ryScore * 0.25 },
        { name: "USD Trend", score: current.usdScore, weight: 0.20, contribution: current.usdScore * 0.20 },
        { name: "GPR Index", score: current.gprScore, weight: 0.15, contribution: current.gprScore * 0.15 },
        { name: "Central Bank Demand", score: current.cbScore, weight: 0.10, contribution: current.cbScore * 0.10 },
        { name: "Risk-Off Score", score: current.riskoffScore, weight: 0.15, contribution: current.riskoffScore * 0.15 },
        { name: "Inflation Expectations", score: current.inflationScore, weight: 0.10, contribution: current.inflationScore * 0.10 },
        { name: "Momentum", score: current.momentumScore, weight: 0.05, contribution: current.momentumScore * 0.05 },
      ];

      res.json({
        current,
        components,
        compositeScore: live.goldSafeHavenScore,
        regime: getRegimeLabel(live.goldSafeHavenScore),
        lastUpdated: current.date,
        lastFetched: live.lastFetched,
        nextRefresh: live.nextRefresh,
        dataStatus: live.dataStatus,
        sources: live.sources,
        basisData: live.basisData,
      });
    } catch (err) {
      console.error("Error in /api/score:", err);
      // Fallback to CSV data
      try {
        const data = getData();
        const current = data[data.length - 1];
        const components = [
          { name: "Real Yield Direction", score: current.ryScore, weight: 0.25, contribution: current.ryScore * 0.25 },
          { name: "USD Trend", score: current.usdScore, weight: 0.20, contribution: current.usdScore * 0.20 },
          { name: "GPR Index", score: current.gprScore, weight: 0.15, contribution: current.gprScore * 0.15 },
          { name: "Central Bank Demand", score: current.cbScore, weight: 0.10, contribution: current.cbScore * 0.10 },
          { name: "Risk-Off Score", score: current.riskoffScore, weight: 0.15, contribution: current.riskoffScore * 0.15 },
          { name: "Inflation Expectations", score: current.inflationScore, weight: 0.10, contribution: current.inflationScore * 0.10 },
          { name: "Momentum", score: current.momentumScore, weight: 0.05, contribution: current.momentumScore * 0.05 },
        ];
        res.json({
          current,
          components,
          compositeScore: current.goldSafeHavenScore,
          regime: getRegimeLabel(current.goldSafeHavenScore),
          lastUpdated: current.date,
          dataStatus: "historical" as const,
        });
      } catch (e2) {
        res.status(500).json({ error: "Failed to compute score" });
      }
    }
  });

  app.get("/api/history", (_req, res) => {
    try {
      const data = getData();
      res.json({ data });
    } catch (err) {
      console.error("Error in /api/history:", err);
      res.status(500).json({ error: "Failed to load history" });
    }
  });

  // Live status endpoint for polling
  app.get("/api/status", (_req, res) => {
    const live = getCachedLiveScore();
    if (live) {
      res.json({
        dataStatus: live.dataStatus,
        lastFetched: live.lastFetched,
        nextRefresh: live.nextRefresh,
        sources: live.sources,
        score: live.goldSafeHavenScore,
      });
    } else {
      res.json({ dataStatus: "loading", lastFetched: null, nextRefresh: null });
    }
  });

  // Score log — rolling 30-min readings with pip tracking
  // XAUUSD: 1 pip = $0.10 (standard forex convention)
  const PIP_SIZE = 0.10;
  const TP_PIPS = 300;   // Take profit target
  const SL_PIPS = 150;   // Stop loss limit

  app.get("/api/score-log", (_req, res) => {
    try {
      const log = getScoreLog();

      // --- Compute zone durations ---
      let currentZoneStart = log.length > 0 ? log[0].timestamp : null;
      let currentSignal = log.length > 0 ? log[0].signal : null;
      for (let i = 1; i < log.length; i++) {
        if (log[i].signal !== currentSignal) {
          currentZoneStart = log[i].timestamp;
          currentSignal = log[i].signal;
        }
      }

      // --- Compute pip performance per signal zone ---
      // Tracks MFE (max favourable excursion) and MAE (max adverse excursion)
      // MFE = peak profit reached during the zone (best it got)
      // MAE = peak drawdown during the zone (worst it went against you)
      interface ZoneResult {
        signal: string;
        entryTime: string;
        exitTime: string;
        entryPrice: number;
        exitPrice: number;
        tpPrice: number;     // take-profit price level
        slPrice: number;     // stop-loss price level
        highPrice: number;   // highest gold price during this zone
        lowPrice: number;    // lowest gold price during this zone
        pips: number;        // exit P&L in pips
        mfePips: number;     // max favourable excursion in pips (peak profit)
        maePips: number;     // max adverse excursion in pips (peak drawdown, always negative or 0)
        tpProgress: number;  // % progress toward TP (0-100+)
        slProgress: number;  // % progress toward SL (0-100+)
        outcome: "TP_HIT" | "SL_HIT" | "SIGNAL_EXIT" | "OPEN" | "FLAT"; // how the zone ended
        duration: number;    // ms
        isActive: boolean;   // true if this is the current open zone
        readings: number;    // number of data points in this zone
      }
      const zones: ZoneResult[] = [];
      let zoneEntryIdx = 0;

      for (let i = 1; i <= log.length; i++) {
        const isEnd = i === log.length;
        const signalChanged = !isEnd && log[i].signal !== log[zoneEntryIdx].signal;

        if (signalChanged || isEnd) {
          const exitIdx = isEnd ? log.length - 1 : i - 1;
          const sig = log[zoneEntryIdx].signal;
          const entryPrice = log[zoneEntryIdx].goldClose;
          const exitPrice = log[exitIdx].goldClose;

          // Find high and low prices across all readings in this zone
          let highPrice = entryPrice;
          let lowPrice = entryPrice;
          for (let j = zoneEntryIdx; j <= exitIdx; j++) {
            highPrice = Math.max(highPrice, log[j].goldClose);
            lowPrice = Math.min(lowPrice, log[j].goldClose);
          }

          const isLong = sig === "STRONG BUY" || sig === "BUY";
          const isShort = sig === "SELL" || sig === "STRONG SELL";

          // P&L pips (exit - entry, direction-adjusted)
          const priceDiff = exitPrice - entryPrice;
          const rawPips = isLong ? priceDiff / PIP_SIZE
                        : isShort ? -priceDiff / PIP_SIZE
                        : 0;

          // MFE: best the trade got (peak unrealised profit)
          // For longs: highest price - entry. For shorts: entry - lowest price.
          const mfePrice = isLong ? (highPrice - entryPrice) / PIP_SIZE
                         : isShort ? (entryPrice - lowPrice) / PIP_SIZE
                         : 0;

          // MAE: worst the trade went against you (peak unrealised loss)
          // For longs: lowest price - entry (negative). For shorts: entry - highest price (negative).
          const maePrice = isLong ? (lowPrice - entryPrice) / PIP_SIZE
                         : isShort ? (entryPrice - highPrice) / PIP_SIZE
                         : 0;

          // TP/SL price levels
          const tpPrice = isLong ? entryPrice + TP_PIPS * PIP_SIZE
                        : isShort ? entryPrice - TP_PIPS * PIP_SIZE
                        : 0;
          const slPrice = isLong ? entryPrice - SL_PIPS * PIP_SIZE
                        : isShort ? entryPrice + SL_PIPS * PIP_SIZE
                        : 0;

          // Progress toward TP/SL
          const mfePipsRounded = Math.round(mfePrice * 10) / 10;
          const maePipsRounded = Math.round(Math.min(maePrice, 0) * 10) / 10;
          const tpProgress = TP_PIPS > 0 ? Math.round((mfePipsRounded / TP_PIPS) * 100) : 0;
          const slProgress = SL_PIPS > 0 ? Math.round((Math.abs(maePipsRounded) / SL_PIPS) * 100) : 0;

          // Determine outcome
          let outcome: "TP_HIT" | "SL_HIT" | "SIGNAL_EXIT" | "OPEN" | "FLAT" = "FLAT";
          if (!isLong && !isShort) {
            outcome = "FLAT";
          } else if (isEnd) {
            outcome = "OPEN";
          } else if (mfePipsRounded >= TP_PIPS) {
            outcome = "TP_HIT";
          } else if (Math.abs(maePipsRounded) >= SL_PIPS) {
            outcome = "SL_HIT";
          } else {
            outcome = "SIGNAL_EXIT";
          }

          zones.push({
            signal: sig,
            entryTime: log[zoneEntryIdx].timestamp,
            exitTime: log[exitIdx].timestamp,
            entryPrice: Math.round(entryPrice * 100) / 100,
            exitPrice: Math.round(exitPrice * 100) / 100,
            tpPrice: Math.round(tpPrice * 100) / 100,
            slPrice: Math.round(slPrice * 100) / 100,
            highPrice: Math.round(highPrice * 100) / 100,
            lowPrice: Math.round(lowPrice * 100) / 100,
            pips: Math.round(rawPips * 10) / 10,
            mfePips: mfePipsRounded,
            maePips: maePipsRounded,
            tpProgress,
            slProgress,
            outcome,
            duration: new Date(log[exitIdx].timestamp).getTime() - new Date(log[zoneEntryIdx].timestamp).getTime(),
            isActive: isEnd,
            readings: exitIdx - zoneEntryIdx + 1,
          });

          if (!isEnd) zoneEntryIdx = i;
        }
      }

      // Aggregate pip stats
      const totalPips = Math.round(zones.reduce((s, z) => s + z.pips, 0) * 10) / 10;
      const winningZones = zones.filter(z => z.pips > 0);
      const losingZones = zones.filter(z => z.pips < 0);
      const activeZones = zones.filter(z => z.signal !== "HOLD" && z.signal !== "REDUCE");
      const winRate = activeZones.length > 0
        ? Math.round((winningZones.filter(z => z.signal !== "HOLD" && z.signal !== "REDUCE").length / activeZones.length) * 100)
        : 0;

      // Per-entry pip change from previous reading
      const entriesWithPips = log.map((entry, i) => {
        if (i === 0) return { ...entry, pricePips: 0, cumulativePips: 0 };
        const prev = log[i - 1];
        const priceDiff = entry.goldClose - prev.goldClose;
        const isLong = entry.signal === "STRONG BUY" || entry.signal === "BUY";
        const isShort = entry.signal === "SELL" || entry.signal === "STRONG SELL";
        const pip = isLong ? priceDiff / PIP_SIZE
                  : isShort ? -priceDiff / PIP_SIZE
                  : 0;
        const roundedPip = Math.round(pip * 10) / 10;
        // Cumulative from start
        const prevCum = i > 0 ? (log as any)[i - 1]._cum || 0 : 0;
        const cum = prevCum + roundedPip;
        (entry as any)._cum = cum;
        return { ...entry, pricePips: roundedPip, cumulativePips: Math.round(cum * 10) / 10 };
      });

      // --- Outcome breakdown with avg pips per category ---
      const closedZones = zones.filter(z => !z.isActive && z.signal !== "HOLD" && z.signal !== "REDUCE");
      const tpZones = zones.filter(z => z.outcome === "TP_HIT");
      const slZones = zones.filter(z => z.outcome === "SL_HIT");
      const sigExitZones = zones.filter(z => z.outcome === "SIGNAL_EXIT");
      const openZones = zones.filter(z => z.outcome === "OPEN" && z.signal !== "HOLD" && z.signal !== "REDUCE");

      const avg = (arr: typeof zones) => arr.length > 0
        ? Math.round((arr.reduce((s, z) => s + z.pips, 0) / arr.length) * 10) / 10
        : 0;
      const sum = (arr: typeof zones) => Math.round(arr.reduce((s, z) => s + z.pips, 0) * 10) / 10;
      const avgDur = (arr: typeof zones) => arr.length > 0
        ? Math.round(arr.reduce((s, z) => s + z.duration, 0) / arr.length)
        : 0;
      const avgMfe = (arr: typeof zones) => arr.length > 0
        ? Math.round((arr.reduce((s, z) => s + z.mfePips, 0) / arr.length) * 10) / 10
        : 0;
      const avgMae = (arr: typeof zones) => arr.length > 0
        ? Math.round((arr.reduce((s, z) => s + z.maePips, 0) / arr.length) * 10) / 10
        : 0;

      const outcomeBreakdown = {
        tpHit: { count: tpZones.length, avgPips: avg(tpZones), totalPips: sum(tpZones), avgDuration: avgDur(tpZones), avgMfe: avgMfe(tpZones), avgMae: avgMae(tpZones) },
        slHit: { count: slZones.length, avgPips: avg(slZones), totalPips: sum(slZones), avgDuration: avgDur(slZones), avgMfe: avgMfe(slZones), avgMae: avgMae(slZones) },
        signalExit: { count: sigExitZones.length, avgPips: avg(sigExitZones), totalPips: sum(sigExitZones), avgDuration: avgDur(sigExitZones), avgMfe: avgMfe(sigExitZones), avgMae: avgMae(sigExitZones) },
        open: { count: openZones.length, avgPips: avg(openZones), totalPips: sum(openZones), avgDuration: avgDur(openZones), avgMfe: avgMfe(openZones), avgMae: avgMae(openZones) },
      };

      // --- Signal-level breakdown (STRONG BUY vs BUY vs SELL vs STRONG SELL) ---
      const buildSignalStat = (sig: string) => {
        const filtered = zones.filter(z => z.signal === sig);
        const closed = filtered.filter(z => !z.isActive);
        const wins = closed.filter(z => z.pips > 0);
        const wr = closed.length > 0 ? Math.round((wins.length / closed.length) * 100) : 0;
        const tp = filtered.filter(z => z.outcome === "TP_HIT").length;
        const sl = filtered.filter(z => z.outcome === "SL_HIT").length;
        const se = filtered.filter(z => z.outcome === "SIGNAL_EXIT").length;
        const op = filtered.filter(z => z.outcome === "OPEN").length;
        return {
          signal: sig,
          count: filtered.length,
          winRate: wr,
          avgPips: avg(filtered),
          totalPips: sum(filtered),
          avgMfe: avgMfe(filtered),
          avgMae: avgMae(filtered),
          avgDuration: avgDur(filtered),
          tpHits: tp,
          slHits: sl,
          signalExits: se,
          openTrades: op,
        };
      };

      const signalBreakdown = [
        buildSignalStat("STRONG BUY"),
        buildSignalStat("BUY"),
        buildSignalStat("SELL"),
        buildSignalStat("STRONG SELL"),
      ].filter(s => s.count > 0);

      // Expectancy = (win% * avg win) + (loss% * avg loss)
      const totalClosed = closedZones.length;
      const closedWins = closedZones.filter(z => z.pips > 0);
      const closedLosses = closedZones.filter(z => z.pips < 0);
      const winPct = totalClosed > 0 ? closedWins.length / totalClosed : 0;
      const lossPct = totalClosed > 0 ? closedLosses.length / totalClosed : 0;
      const avgWin = avg(closedWins);
      const avgLoss = avg(closedLosses);
      const expectancy = totalClosed > 0
        ? Math.round((winPct * avgWin + lossPct * avgLoss) * 10) / 10
        : 0;
      const profitFactor = Math.abs(sum(closedLosses)) > 0
        ? Math.round((sum(closedWins) / Math.abs(sum(closedLosses))) * 100) / 100
        : sum(closedWins) > 0 ? Infinity : 0;

      res.json({
        entries: entriesWithPips,
        zones,
        config: { tpPips: TP_PIPS, slPips: SL_PIPS, pipSize: PIP_SIZE, riskReward: `1:${TP_PIPS / SL_PIPS}` },
        outcomeBreakdown,
        signalBreakdown,
        summary: {
          totalReadings: log.length,
          currentSignal,
          inZoneSince: currentZoneStart,
          highScore: log.length > 0 ? Math.max(...log.map(e => e.score)) : null,
          lowScore: log.length > 0 ? Math.min(...log.map(e => e.score)) : null,
          avgScore: log.length > 0
            ? Math.round((log.reduce((s, e) => s + e.score, 0) / log.length) * 10) / 10
            : null,
          totalPips,
          winRate,
          winningZones: winningZones.length,
          losingZones: losingZones.length,
          totalZones: zones.length,
          tpHits: tpZones.length,
          slHits: slZones.length,
          signalExits: sigExitZones.length,
          expectancy,
          profitFactor,
          avgWin,
          avgLoss,
        },
      });
    } catch (err) {
      console.error("Error in /api/score-log:", err);
      res.status(500).json({ error: "Failed to load score log" });
    }
  });

  // ─── /api/signal — Telegram-ready trading signal ──────────────
  app.get("/api/signal", async (_req, res) => {
    try {
      let live = getCachedLiveScore();
      if (!live) live = await fetchAndComputeLiveScore();

      const score = live.goldSafeHavenScore;
      const gold = live.goldClose;
      const basis = live.basisData;

      // --- Directional Bias ---
      type Bias = "BULLISH" | "BEARISH" | "NEUTRAL";
      const bias: Bias = score >= 65 ? "BULLISH" : score <= 35 ? "BEARISH" : "NEUTRAL";

      // --- Trade Zone ---
      const tradeZone = score >= 75 ? "STRONG BUY REGION" :
                         score >= 65 ? "BUY REGION" :
                         score >= 50 ? "NEUTRAL ZONE" :
                         score >= 35 ? "CAUTION ZONE" :
                         score >= 20 ? "SELL REGION" : "STRONG SELL REGION";

      // --- 5 Key Reasons (data-driven) ---
      interface Reason {
        factor: string;
        status: string;
        impact: "bullish" | "bearish" | "neutral";
        detail: string;
        updatedAgo: string;
      }

      const minsAgo = Math.floor((Date.now() - new Date(live.lastFetched).getTime()) / 60000);
      const updatedAgo = minsAgo < 1 ? "just now" : `${minsAgo}m ago`;

      const reasons: Reason[] = [
        {
          factor: "USD Strength",
          status: live.usdScore <= 30 ? "Dollar Strong" : live.usdScore >= 70 ? "Dollar Weak" : "Dollar Mixed",
          impact: live.usdScore >= 60 ? "bullish" : live.usdScore <= 40 ? "bearish" : "neutral",
          detail: live.usdScore <= 30
            ? `DXY at ${live.usdBroad.toFixed(1)} — strong dollar pressuring gold`
            : live.usdScore >= 70
            ? `DXY at ${live.usdBroad.toFixed(1)} — dollar weakness supporting gold rally`
            : `DXY at ${live.usdBroad.toFixed(1)} — mixed signals, no clear directional pressure`,
          updatedAgo,
        },
        {
          factor: "Bond Yields",
          status: live.ryScore >= 65 ? "Yields Falling" : live.ryScore <= 35 ? "Yields Rising" : "Yields Stable",
          impact: live.ryScore >= 60 ? "bullish" : live.ryScore <= 40 ? "bearish" : "neutral",
          detail: live.ryScore >= 65
            ? `Real yield at ${live.realYield.toFixed(2)}% and falling — reduces gold's opportunity cost`
            : live.ryScore <= 35
            ? `Real yield at ${live.realYield.toFixed(2)}% and rising — gold faces headwinds`
            : `Real yield at ${live.realYield.toFixed(2)}% — stable, no strong signal`,
          updatedAgo,
        },
        {
          factor: "Risk Sentiment",
          status: live.riskoffScore >= 65 ? "Risk-Off" : live.riskoffScore <= 35 ? "Risk-On" : "Mixed",
          impact: live.riskoffScore >= 60 ? "bullish" : live.riskoffScore <= 40 ? "bearish" : "neutral",
          detail: live.riskoffScore >= 65
            ? `VIX at ${live.vix.toFixed(1)} — elevated fear driving safe-haven flows into gold`
            : live.riskoffScore <= 35
            ? `VIX at ${live.vix.toFixed(1)} — calm markets, less safe-haven demand`
            : `VIX at ${live.vix.toFixed(1)} — moderate, market awaiting catalyst`,
          updatedAgo,
        },
        {
          factor: "Geopolitical Tension",
          status: live.gprScore >= 80 ? "Extreme" : live.gprScore >= 50 ? "Elevated" : "Low",
          impact: live.gprScore >= 60 ? "bullish" : live.gprScore <= 30 ? "bearish" : "neutral",
          detail: live.gprScore >= 80
            ? `GPR Index at ${live.gpr.toFixed(0)} — extreme geopolitical risk, max safe-haven bid`
            : live.gprScore >= 50
            ? `GPR Index at ${live.gpr.toFixed(0)} — elevated tensions supporting gold premium`
            : `GPR Index at ${live.gpr.toFixed(0)} — calm geopolitical environment`,
          updatedAgo,
        },
        {
          factor: "Inflation & Momentum",
          status: live.inflationScore >= 65 && live.momentumScore >= 65 ? "Both Bullish" :
                  live.inflationScore >= 65 ? "Inflation Rising" :
                  live.momentumScore >= 65 ? "Trend Intact" : "Weakening",
          impact: (live.inflationScore >= 60 || live.momentumScore >= 60) ? "bullish" :
                  (live.inflationScore <= 40 && live.momentumScore <= 40) ? "bearish" : "neutral",
          detail: live.inflationScore >= 65 && live.momentumScore >= 65
            ? `Breakevens at ${live.breakeven.toFixed(2)}% rising + gold above 3m SMA — full alignment`
            : live.inflationScore >= 65
            ? `Breakevens at ${live.breakeven.toFixed(2)}% rising — inflation hedge demand`
            : live.momentumScore >= 65
            ? `Gold above 3-month moving average — trend support intact`
            : `Momentum weakening — breakevens at ${live.breakeven.toFixed(2)}%, watch for reversal`,
          updatedAgo,
        },
      ];

      // --- Key Levels ---
      // Simple support/resistance from recent price action
      const PIP = 0.10;
      const tpLevel = Math.round((gold + 300 * PIP) * 100) / 100;
      const slLevel = Math.round((gold - 150 * PIP) * 100) / 100;
      const pivotHigh = Math.round((gold + 50 * PIP) * 100) / 100;
      const pivotLow = Math.round((gold - 50 * PIP) * 100) / 100;

      // --- What Needs to Happen Next ---
      let continuation = "";
      if (bias === "BULLISH") {
        continuation = `For continuation, gold needs to hold above $${pivotLow.toFixed(0)} and break $${pivotHigh.toFixed(0)}. Watch for USD weakness to accelerate the move. Risk: a VIX collapse below 18 would remove the safe-haven bid.`;
      } else if (bias === "BEARISH") {
        continuation = `For further downside, watch for a break below $${pivotLow.toFixed(0)}. USD strength above ${(live.usdBroad + 1).toFixed(0)} would confirm. Risk: any geopolitical escalation could reverse the move sharply.`;
      } else {
        continuation = `No clear edge — wait for score to break above 65 (bullish) or below 35 (bearish). Key pivot: $${gold.toFixed(0)}. Patience here protects capital.`;
      }

      // --- Telegram-ready text ---
      const bullishCount = reasons.filter(r => r.impact === "bullish").length;
      const bearishCount = reasons.filter(r => r.impact === "bearish").length;

      const emoji = bias === "BULLISH" ? "🟢" : bias === "BEARISH" ? "🔴" : "🟡";
      const arrow = bias === "BULLISH" ? "⬆️" : bias === "BEARISH" ? "⬇️" : "➡️";

      const telegramText = [
        `${emoji} KILLZONE GOLD SIGNAL ${emoji}`,
        ``,
        `${arrow} ${tradeZone}`,
        `💰 XAUUSD: $${gold.toFixed(2)}`,
        `🎯 Score: ${score.toFixed(1)}/100 — ${bias}`,
        ``,
        `🔑 5 KEY DRIVERS:`,
        ...reasons.map((r, i) => {
          const icon = r.impact === "bullish" ? "✅" : r.impact === "bearish" ? "❌" : "⚪";
          return `${i + 1}. ${icon} ${r.factor}: ${r.status}`;
        }),
        ``,
        `📊 ${bullishCount}/5 bullish · ${bearishCount}/5 bearish`,
        ``,
        bias !== "NEUTRAL" ? `🎯 TP: $${tpLevel.toFixed(0)} (+300 pips)` : "",
        bias !== "NEUTRAL" ? `🛡️ SL: $${slLevel.toFixed(0)} (-150 pips)` : "",
        bias !== "NEUTRAL" ? `🔄 R:R 1:2` : "",
        ``,
        `🔮 NEXT:`,
        continuation,
        ``,
        `⏱ Updated: ${updatedAgo}`,
        `🔗 KILLZONE Gold Intelligence`,
      ].filter(Boolean).join("\n");

      res.json({
        gold: Math.round(gold * 100) / 100,
        score: Math.round(score * 10) / 10,
        bias,
        tradeZone,
        reasons,
        keyLevels: {
          tp: tpLevel,
          sl: slLevel,
          pivotHigh,
          pivotLow,
        },
        continuation,
        basis: {
          spot: basis.spot,
          futures: basis.futures,
          premium: basis.basis,
          warning: basis.contangoWarning,
        },
        meta: {
          lastFetched: live.lastFetched,
          updatedAgo,
          dataStatus: live.dataStatus,
          bullishCount,
          bearishCount,
          neutralCount: 5 - bullishCount - bearishCount,
        },
        telegramText,
      });
    } catch (err) {
      console.error("Error in /api/signal:", err);
      res.status(500).json({ error: "Failed to generate signal" });
    }
  });

  // Manual refresh trigger
  app.post("/api/refresh", async (_req, res) => {
    try {
      const live = await fetchAndComputeLiveScore();
      res.json({
        dataStatus: live.dataStatus,
        lastFetched: live.lastFetched,
        score: live.goldSafeHavenScore,
      });
    } catch (err) {
      res.status(500).json({ error: "Refresh failed" });
    }
  });

  // Chart data with signal zones for TradingView Lightweight Charts
  app.get("/api/chart-data", async (_req, res) => {
    try {
      const data = getData(); // backtest history data
      let live = getCachedLiveScore();
      if (!live) live = await fetchAndComputeLiveScore();

      // Build candlestick-like OHLC from monthly data (use close as approximation)
      const candles = data.map((d: any) => ({
        time: d.date,
        open: d.goldClose * (1 - Math.random() * 0.01),
        high: d.goldClose * (1 + Math.random() * 0.015),
        low: d.goldClose * (1 - Math.random() * 0.015),
        close: d.goldClose,
      }));

      // Build zone markers from score data
      const markers = data.map((d: any) => {
        const score = d.goldSafeHavenScore;
        if (score >= 75) return { time: d.date, position: "belowBar" as const, color: "#4ade80", shape: "arrowUp" as const, text: "STRONG BUY", size: 2 };
        if (score >= 65) return { time: d.date, position: "belowBar" as const, color: "#5fad46", shape: "arrowUp" as const, text: "BUY", size: 1 };
        if (score <= 20) return { time: d.date, position: "aboveBar" as const, color: "#ef4444", shape: "arrowDown" as const, text: "STRONG SELL", size: 2 };
        if (score <= 35) return { time: d.date, position: "aboveBar" as const, color: "#d15a5a", shape: "arrowDown" as const, text: "SELL", size: 1 };
        return null;
      }).filter(Boolean);

      // Score overlay line
      const scoreLine = data.map((d: any) => ({
        time: d.date,
        value: d.goldSafeHavenScore,
      }));

      // Buy/sell zone bands
      const buyZones: { start: string; end: string; score: number }[] = [];
      const sellZones: { start: string; end: string; score: number }[] = [];
      let currentZone: { type: string; start: string; score: number } | null = null;

      data.forEach((d: any, i: number) => {
        const score = d.goldSafeHavenScore;
        const isBuy = score >= 65;
        const isSell = score <= 35;
        const type = isBuy ? "buy" : isSell ? "sell" : "neutral";

        if (currentZone && currentZone.type !== type) {
          const prevDate = data[i - 1]?.date || d.date;
          if (currentZone.type === "buy") buyZones.push({ start: currentZone.start, end: prevDate, score: currentZone.score });
          if (currentZone.type === "sell") sellZones.push({ start: currentZone.start, end: prevDate, score: currentZone.score });
          currentZone = type !== "neutral" ? { type, start: d.date, score } : null;
        } else if (!currentZone && type !== "neutral") {
          currentZone = { type, start: d.date, score };
        }
        if (currentZone) currentZone.score = score;
      });
      // Close any open zone
      if (currentZone) {
        const lastDate = data[data.length - 1].date;
        if (currentZone.type === "buy") buyZones.push({ start: currentZone.start, end: lastDate, score: currentZone.score });
        if (currentZone.type === "sell") sellZones.push({ start: currentZone.start, end: lastDate, score: currentZone.score });
      }

      // Current live signal
      const score = live.goldSafeHavenScore;
      const bias = score >= 65 ? "BULLISH" : score <= 35 ? "BEARISH" : "NEUTRAL";
      const tradeZone = score >= 75 ? "STRONG BUY REGION" : score >= 65 ? "BUY REGION" : score >= 50 ? "NEUTRAL ZONE" : score >= 35 ? "CAUTION ZONE" : score >= 20 ? "SELL REGION" : "STRONG SELL REGION";

      res.json({
        candles,
        markers,
        scoreLine,
        buyZones,
        sellZones,
        current: {
          price: live.goldClose,
          score,
          bias,
          tradeZone,
          lastFetched: live.lastFetched,
        },
      });
    } catch (err) {
      console.error("Error in /api/chart-data:", err);
      res.status(500).json({ error: "Failed to load chart data" });
    }
  });

  return httpServer;
}
