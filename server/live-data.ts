/**
 * Live Data Fetcher for Gold Safe Haven Score
 * Pulls real-time data from FRED API, Yahoo Finance, and GPR Index
 * Computes the 7-component scoring model on the fly
 */

import * as fs from "fs";
import * as path from "path";

// ─── FRED API (public, no key needed for CSV format) ─────────────
const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";
const FRED_API_KEY = "DEMO_KEY"; // Public demo key — works for low-volume

interface FredObs {
  date: string;
  value: number;
}

async function fetchFredSeries(
  seriesId: string,
  lookbackMonths: number = 24
): Promise<FredObs[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - lookbackMonths);
  const startStr = startDate.toISOString().split("T")[0];

  // Use FRED's public CSV endpoint (no key required)
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${startStr}`;

  const resp = await fetch(url, {
    headers: { "User-Agent": "AstroFX-Gold-Intelligence/1.0" },
  });

  if (!resp.ok) {
    console.warn(`FRED fetch failed for ${seriesId}: ${resp.status}`);
    return [];
  }

  const text = await resp.text();
  const lines = text.trim().split("\n").slice(1); // skip header

  return lines
    .map((line) => {
      const [date, val] = line.split(",");
      const value = parseFloat(val);
      return { date: date.trim(), value };
    })
    .filter((obs) => !isNaN(obs.value));
}

// ─── Yahoo Finance Gold Price ────────────────────────────────────
interface GoldPrice {
  date: string;
  close: number;
}

interface GoldFetchResult {
  dailyPrices: GoldPrice[];
  spotPrice: number;
  futuresPrice: number;
  spotSource: string;
}

/** Fetch XAU/USD spot price from gold-api.com (primary, no auth, true spot)
 *  with Yahoo Finance GC=F daily data as fallback for historical SMA calculation. */
async function fetchGoldPrice(): Promise<GoldFetchResult> {
  const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

  // 1. Primary: gold-api.com for true XAU/USD spot (no auth, real-time)
  let spotPrice: number | null = null;
  let spotSource = "";
  try {
    const resp = await fetch("https://api.gold-api.com/price/XAU", {
      headers: { "User-Agent": ua },
    });
    if (resp.ok) {
      const json = (await resp.json()) as any;
      if (json.price && json.price > 0) {
        spotPrice = json.price;
        spotSource = "gold-api.com";
      }
    }
  } catch (err) {
    console.warn("[Gold] gold-api.com fetch failed:", err);
  }

  // 2. Fallback: Yahoo Finance GC=F for daily history + fallback spot
  const now = Math.floor(Date.now() / 1000);
  const sixMonthsAgo = now - 180 * 24 * 3600;
  let dailyPrices: GoldPrice[] = [];
  let yahooSpot: number | null = null;

  try {
    const dailyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?period1=${sixMonthsAgo}&period2=${now}&interval=1d`;
    const resp = await fetch(dailyUrl, { headers: { "User-Agent": ua } });
    if (resp.ok) {
      const json = (await resp.json()) as any;
      const result = json.chart?.result?.[0];
      if (result) {
        yahooSpot = result.meta?.regularMarketPrice || null;
        const timestamps: number[] = result.timestamp || [];
        const closes: number[] = result.indicators?.quote?.[0]?.close || [];
        dailyPrices = timestamps.map((ts, i) => ({
          date: new Date(ts * 1000).toISOString().split("T")[0],
          close: closes[i] || 0,
        })).filter((p) => p.close > 0);
      }
    }
  } catch (err) {
    console.warn("[Gold] Yahoo daily fetch failed:", err);
  }

  // 3. Use spot price from gold-api.com (true XAU/USD), fall back to Yahoo GC=F
  const currentPrice = spotPrice || yahooSpot || dailyPrices.at(-1)?.close || 0;
  const source = spotPrice ? spotSource : (yahooSpot ? "Yahoo GC=F" : "historical");

  // 4. Update/append today's price
  if (currentPrice > 0) {
    const today = new Date().toISOString().split("T")[0];
    const lastEntry = dailyPrices.at(-1);
    if (lastEntry && lastEntry.date === today) {
      lastEntry.close = currentPrice;
    } else {
      dailyPrices.push({ date: today, close: currentPrice });
    }
  }

  const basis = (yahooSpot && spotPrice) ? yahooSpot - spotPrice : 0;
  console.log(
    `[Gold] XAU/USD: $${currentPrice.toFixed(2)} via ${source}${yahooSpot ? ` (GC=F: $${yahooSpot.toFixed(2)}, basis: $${basis.toFixed(2)})` : ""} | ${dailyPrices.length} daily points`
  );

  return {
    dailyPrices,
    spotPrice: spotPrice || currentPrice,
    futuresPrice: yahooSpot || currentPrice,
    spotSource: spotPrice ? spotSource : "Yahoo GC=F",
  };
}

// ─── GPR Index ───────────────────────────────────────────────────
async function fetchGPRIndex(): Promise<{ date: string; gpr: number }[]> {
  // Binary XLS file from Caldara-Iacoviello GPR dataset
  const url =
    "https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls";

  try {
    // Dynamic import of xlsx — handles both ESM and CJS
    let XLSX: any;
    try {
      XLSX = await import("xlsx");
      if (XLSX.default) XLSX = XLSX.default;
    } catch {
      XLSX = require("xlsx");
    }

    const resp = await fetch(url, {
      headers: { "User-Agent": "AstroFX-Gold-Intelligence/1.0" },
    });

    if (!resp.ok) {
      console.warn(`GPR fetch failed: ${resp.status}`);
      return [];
    }

    // Read binary XLS into buffer
    const arrayBuf = await resp.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    // Parse with xlsx library
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Find GPR column index from header row
    const headers: string[] = rawData[0]?.map((h: any) => String(h).trim()) ?? [];
    const gprColIdx = headers.indexOf("GPR");
    if (gprColIdx < 0) {
      console.warn("GPR column not found in XLS headers:", headers.slice(0, 10));
      return [];
    }

    // Parse rows: col 0 = Excel serial date, col gprColIdx = GPR value
    const rows: { date: string; gpr: number }[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length <= gprColIdx) continue;

      const excelSerial = row[0];
      const gprVal = parseFloat(row[gprColIdx]);
      if (isNaN(gprVal) || typeof excelSerial !== "number") continue;

      // Convert Excel serial date to ISO string
      const jsDate = new Date((excelSerial - 25569) * 86400 * 1000);
      const dateStr = jsDate.toISOString().split("T")[0];
      rows.push({ date: dateStr, gpr: Math.round(gprVal * 100) / 100 });
    }

    console.log(
      `[GPR] Parsed ${rows.length} rows, latest: ${rows.at(-1)?.date} GPR=${rows.at(-1)?.gpr}`
    );

    // Return last 24 months for lookback
    return rows.slice(-24);
  } catch (err) {
    console.warn("GPR fetch error:", err);
    return [];
  }
}

// ─── Scoring Functions ───────────────────────────────────────────

/** Rolling percentile rank over array of numbers */
function percentileRank(values: number[], currentValue: number): number {
  const sorted = values.filter((v) => !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length < 3) return 50;
  let count = 0;
  for (const v of sorted) {
    if (v < currentValue) count++;
    else if (v === currentValue) count += 0.5;
  }
  return (count / sorted.length) * 100;
}

/** Remap GPR value to 0-100 score */
function remapGPR(val: number): number {
  if (isNaN(val)) return 50;
  if (val < 80) return 20;
  if (val < 150) return 20 + ((val - 80) / 70) * 60;
  if (val < 250) return 80 + ((val - 150) / 100) * 20;
  return 100;
}

// ─── Types ───────────────────────────────────────────────────────
export interface BasisData {
  spot: number;         // XAU/USD spot from gold-api.com
  futures: number;      // GC=F front-month futures from Yahoo
  basis: number;        // futures - spot (premium)
  basisPct: number;     // basis as % of spot
  contangoWarning: boolean; // true if basis > $50
  spotSource: string;   // e.g. "gold-api.com"
  futuresSource: string; // e.g. "Yahoo GC=F"
}

export interface LiveScoreData {
  // Raw values
  realYield: number;
  vix: number;
  breakeven: number;
  hySpread: number;
  usdBroad: number;
  gpr: number;
  goldClose: number;

  // Spot-Futures Basis
  basisData: BasisData;

  // Component scores (0-100)
  ryScore: number;
  usdScore: number;
  gprScore: number;
  cbScore: number;
  riskoffScore: number;
  inflationScore: number;
  momentumScore: number;

  // Composite
  goldSafeHavenScore: number;

  // Metadata
  lastFetched: string; // ISO timestamp
  nextRefresh: string; // ISO timestamp
  dataStatus: "live" | "stale" | "error";
  sources: {
    fred: boolean;
    yahoo: boolean;
    gpr: boolean;
  };
}

// ─── Score Log ───────────────────────────────────────────────────
export interface ScoreLogEntry {
  timestamp: string; // ISO
  score: number;
  signal: string; // STRONG BUY, BUY, HOLD, REDUCE, SELL, STRONG SELL
  goldClose: number;
  vix: number;
  gpr: number;
  delta: number; // change from previous reading
  basis?: number; // spot-futures basis
  contangoWarning?: boolean;
  components: {
    ry: number;
    usd: number;
    gpr: number;
    cb: number;
    riskoff: number;
    inflation: number;
    momentum: number;
  };
}

function getSignalLabel(score: number): string {
  if (score >= 75) return "STRONG BUY";
  if (score >= 65) return "BUY";
  if (score >= 50) return "HOLD";
  if (score >= 35) return "REDUCE";
  if (score >= 20) return "SELL";
  return "STRONG SELL";
}

const MAX_LOG_ENTRIES = 500; // ~10 days of 30-min readings
let scoreLog: ScoreLogEntry[] = [];

// Persistence: save/load from JSON file next to the data dir
function getLogFilePath(): string {
  // Try several locations
  for (const base of [
    path.join(process.cwd(), "server", "data"),
    path.join(process.cwd(), "dist", "data"),
  ]) {
    if (fs.existsSync(base)) return path.join(base, "score_log.json");
  }
  return path.join(process.cwd(), "score_log.json");
}

function loadScoreLog(): void {
  try {
    const filePath = getLogFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      scoreLog = JSON.parse(raw);
      console.log(`[Score Log] Loaded ${scoreLog.length} entries from disk`);
    }
  } catch (err) {
    console.warn("[Score Log] Failed to load from disk:", err);
  }
}

function saveScoreLog(): void {
  try {
    const filePath = getLogFilePath();
    fs.writeFileSync(filePath, JSON.stringify(scoreLog), "utf-8");
  } catch (err) {
    console.warn("[Score Log] Failed to save to disk:", err);
  }
}

function appendToScoreLog(data: LiveScoreData): void {
  const prevScore = scoreLog.length > 0 ? scoreLog[scoreLog.length - 1].score : data.goldSafeHavenScore;
  const delta = Math.round((data.goldSafeHavenScore - prevScore) * 10) / 10;

  const entry: ScoreLogEntry = {
    timestamp: data.lastFetched,
    score: data.goldSafeHavenScore,
    signal: getSignalLabel(data.goldSafeHavenScore),
    goldClose: Math.round(data.goldClose * 100) / 100,
    vix: data.vix,
    gpr: data.gpr,
    delta,
    basis: data.basisData.basis,
    contangoWarning: data.basisData.contangoWarning,
    components: {
      ry: data.ryScore,
      usd: data.usdScore,
      gpr: data.gprScore,
      cb: data.cbScore,
      riskoff: data.riskoffScore,
      inflation: data.inflationScore,
      momentum: data.momentumScore,
    },
  };

  scoreLog.push(entry);

  // Trim to max
  if (scoreLog.length > MAX_LOG_ENTRIES) {
    scoreLog = scoreLog.slice(-MAX_LOG_ENTRIES);
  }

  saveScoreLog();
  console.log(
    `[Score Log] #${scoreLog.length} | Score: ${entry.score} (${entry.delta >= 0 ? "+" : ""}${entry.delta}) | Signal: ${entry.signal}`
  );
}

export function getScoreLog(): ScoreLogEntry[] {
  return scoreLog;
}

// ─── Cache ───────────────────────────────────────────────────────
let cachedLiveScore: LiveScoreData | null = null;
let fetchInProgress = false;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function getCachedLiveScore(): LiveScoreData | null {
  return cachedLiveScore;
}

export function isFetchInProgress(): boolean {
  return fetchInProgress;
}

// ─── Main Fetch & Compute ────────────────────────────────────────
export async function fetchAndComputeLiveScore(): Promise<LiveScoreData> {
  if (fetchInProgress && cachedLiveScore) return cachedLiveScore;
  fetchInProgress = true;

  const sources = { fred: false, yahoo: false, gpr: false };

  try {
    // Parallel fetch all data sources
    const [realYieldData, vixData, breakevenData, hyData, usdData, gprData, goldResult] =
      await Promise.all([
        fetchFredSeries("DFII10", 18),
        fetchFredSeries("VIXCLS", 18),
        fetchFredSeries("T10YIE", 18),
        fetchFredSeries("BAMLH0A0HYM2", 18),
        fetchFredSeries("DTWEXBGS", 18),
        fetchGPRIndex(),
        fetchGoldPrice(),
      ]);

    // Destructure gold result
    const goldData = goldResult.dailyPrices;
    const goldSpot = goldResult.spotPrice;
    const goldFutures = goldResult.futuresPrice;
    const goldSpotSource = goldResult.spotSource;

    // Mark which sources succeeded
    if (realYieldData.length > 0) sources.fred = true;
    if (goldData.length > 0) sources.yahoo = true;
    if (gprData.length > 0) sources.gpr = true;

    // Build basis data
    const basis = Math.round((goldFutures - goldSpot) * 100) / 100;
    const basisPct = goldSpot > 0 ? Math.round((basis / goldSpot) * 10000) / 100 : 0;
    const basisData: BasisData = {
      spot: Math.round(goldSpot * 100) / 100,
      futures: Math.round(goldFutures * 100) / 100,
      basis,
      basisPct,
      contangoWarning: basis > 50,
      spotSource: goldSpotSource,
      futuresSource: "Yahoo GC=F",
    };

    if (basisData.contangoWarning) {
      console.warn(`[Basis] ⚠️ CONTANGO WARNING: $${basis.toFixed(2)} (${basisPct.toFixed(2)}%) — futures premium above $50`);
    }

    // Extract latest values
    const latestRY = realYieldData.at(-1)?.value ?? 1.8;
    const latestVIX = vixData.at(-1)?.value ?? 20;
    const latestBE = breakevenData.at(-1)?.value ?? 2.3;
    const latestHY = hyData.at(-1)?.value ?? 3.5;
    const latestUSD = usdData.at(-1)?.value ?? 110;
    const latestGPR = gprData.at(-1)?.gpr ?? 100;
    const latestGold = goldData.at(-1)?.close ?? 2500;

    // Get lookback arrays for percentile calculations
    const ryValues = realYieldData.map((d) => d.value);
    const vixValues = vixData.map((d) => d.value);
    const beValues = breakevenData.map((d) => d.value);
    const hyValues = hyData.map((d) => d.value);
    const usdValues = usdData.map((d) => d.value);
    const goldCloses = goldData.map((d) => d.close);

    // Component 1: Real Yield Direction (falling = bullish for gold)
    // Compute month-over-month changes
    const ryChanges = ryValues.slice(1).map((v, i) => v - ryValues[i]);
    const latestRYChange = ryChanges.at(-1) ?? 0;
    const ryScore = 100 - percentileRank(ryChanges, latestRYChange);

    // Component 2: USD Trend (weakening = bullish for gold)
    const usdRocs = usdValues.slice(1).map((v, i) =>
      ((v - usdValues[i]) / usdValues[i]) * 100
    );
    const latestUSDRoc = usdRocs.at(-1) ?? 0;
    const usdScore = 100 - percentileRank(usdRocs, latestUSDRoc);

    // Component 3: GPR Index
    const gprScore = remapGPR(latestGPR);

    // Component 4: Central Bank Demand (structural — 2022+ is high demand regime)
    const cbScore = 70; // Post-2022 structural bid

    // Component 5: Risk-Off Score (VIX + HY spread)
    const vixPct = percentileRank(vixValues, latestVIX);
    const hyPct = percentileRank(hyValues, latestHY);
    const riskoffScore = 0.5 * vixPct + 0.5 * hyPct;

    // Component 6: Inflation Expectations (rising breakevens = bullish)
    const beChanges = beValues.slice(1).map((v, i) => v - beValues[i]);
    const latestBEChange = beChanges.at(-1) ?? 0;
    const inflationScore = percentileRank(beChanges, latestBEChange);

    // Component 7: Momentum (gold above 3-month SMA)
    // Using daily data now: ~63 trading days = 3 months
    const smaWindow = Math.min(63, goldCloses.length);
    const smaSlice = goldCloses.slice(-smaWindow);
    const sma3 = smaSlice.reduce((a, b) => a + b, 0) / Math.max(smaSlice.length, 1);
    const momentumScore = latestGold > sma3 ? 80 : 30;

    // Composite Score (original weights)
    const goldSafeHavenScore =
      0.25 * ryScore +
      0.2 * usdScore +
      0.15 * gprScore +
      0.1 * cbScore +
      0.15 * riskoffScore +
      0.1 * inflationScore +
      0.05 * momentumScore;

    const now = new Date();
    const nextRefresh = new Date(now.getTime() + REFRESH_INTERVAL_MS);

    cachedLiveScore = {
      realYield: latestRY,
      vix: latestVIX,
      breakeven: latestBE,
      hySpread: latestHY,
      usdBroad: latestUSD,
      gpr: latestGPR,
      goldClose: latestGold,
      basisData,
      ryScore: Math.round(ryScore * 10) / 10,
      usdScore: Math.round(usdScore * 10) / 10,
      gprScore: Math.round(gprScore * 10) / 10,
      cbScore,
      riskoffScore: Math.round(riskoffScore * 10) / 10,
      inflationScore: Math.round(inflationScore * 10) / 10,
      momentumScore,
      goldSafeHavenScore: Math.round(goldSafeHavenScore * 10) / 10,
      lastFetched: now.toISOString(),
      nextRefresh: nextRefresh.toISOString(),
      dataStatus: sources.fred && sources.yahoo ? "live" : "stale",
      sources,
    };

    console.log(
      `[Live Data] Score: ${cachedLiveScore.goldSafeHavenScore} | Gold: $${latestGold} | VIX: ${latestVIX} | Sources: FRED=${sources.fred} Yahoo=${sources.yahoo} GPR=${sources.gpr}`
    );

    // Append to score log
    appendToScoreLog(cachedLiveScore);

    return cachedLiveScore;
  } catch (err) {
    console.error("[Live Data] Fetch error:", err);

    if (cachedLiveScore) {
      cachedLiveScore.dataStatus = "stale";
      return cachedLiveScore;
    }

    // Return fallback
    const now = new Date();
    return {
      realYield: 0, vix: 0, breakeven: 0, hySpread: 0, usdBroad: 0, gpr: 0, goldClose: 0,
      basisData: { spot: 0, futures: 0, basis: 0, basisPct: 0, contangoWarning: false, spotSource: "N/A", futuresSource: "N/A" },
      ryScore: 50, usdScore: 50, gprScore: 50, cbScore: 50,
      riskoffScore: 50, inflationScore: 50, momentumScore: 50,
      goldSafeHavenScore: 50,
      lastFetched: now.toISOString(),
      nextRefresh: new Date(now.getTime() + REFRESH_INTERVAL_MS).toISOString(),
      dataStatus: "error",
      sources,
    };
  } finally {
    fetchInProgress = false;
  }
}

// ─── Auto-refresh timer ──────────────────────────────────────────
let refreshTimer: ReturnType<typeof setInterval> | null = null;

export function startAutoRefresh(): void {
  // Load persisted log from disk
  loadScoreLog();

  // Initial fetch
  fetchAndComputeLiveScore().catch(console.error);

  // Refresh every hour
  refreshTimer = setInterval(() => {
    fetchAndComputeLiveScore().catch(console.error);
  }, REFRESH_INTERVAL_MS);

  console.log(`[Live Data] Auto-refresh started (every ${REFRESH_INTERVAL_MS / 60000} min)`);
}

export function stopAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
