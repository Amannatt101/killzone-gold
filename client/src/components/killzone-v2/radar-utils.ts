import type { DominanceComponent } from "./dominance-models";
import type { DominanceResult } from "./score-utils";

export type RadarCurrent = {
  realYield?: number;
  vix?: number;
  usdBroad?: number;
};

export type RadarVertex = {
  id: string;
  label: string;
  sublabel: string;
  angleDeg: number;
  normalized: number;
  side: "bull" | "bear" | "neutral";
};

const SPOKES: { id: string; label: string; angleDeg: number; match: RegExp }[] = [
  { id: "macro24h", label: "MACRO 24H", angleDeg: -90, match: /.*/ },
  { id: "curve", label: "10Y / 2Y", angleDeg: -45, match: /10y|2y|curve|spread/i },
  { id: "vix", label: "VIX", angleDeg: 0, match: /vix|risk/i },
  { id: "usd", label: "USD BROAD", angleDeg: 45, match: /usd|dollar|dxy/i },
  { id: "intraday4h", label: "INTRADAY 4H", angleDeg: 90, match: /.*/ },
  { id: "fast", label: "FAST TAPE", angleDeg: 135, match: /.*/ },
  { id: "price", label: "PRICE 1H", angleDeg: 180, match: /xau|price|momentum|impulse|gold/i },
  { id: "realyield", label: "REAL YLD", angleDeg: -135, match: /real yield|yield/i },
];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function scoreToNormalized(score: number): number {
  return clamp((score - 50) / 50, -1, 1);
}

function dominanceToNormalized(bullPct: number): number {
  return clamp((bullPct - 50) / 50, -1, 1);
}

function findComponent(components: DominanceComponent[] | undefined, pattern: RegExp): DominanceComponent | undefined {
  return components?.find((c) => pattern.test(c.name));
}

function componentNorm(c?: DominanceComponent): number {
  if (!c || !Number.isFinite(c.score)) return 0;
  return scoreToNormalized(c.score);
}

function formatVertexValue(id: string, norm: number, current?: RadarCurrent, component?: DominanceComponent): string {
  if (id === "realyield" && current?.realYield != null) {
    return `${current.realYield.toFixed(2)}%`;
  }
  if (id === "vix" && current?.vix != null) {
    return current.vix.toFixed(1);
  }
  if (id === "usd" && current?.usdBroad != null) {
    const arrow = norm >= 0 ? "↑" : "↓";
    return `${current.usdBroad.toFixed(1)} ${arrow}`;
  }
  if (component?.factorSnapshot?.[0]?.value) {
    return component.factorSnapshot[0].value.slice(0, 12);
  }
  const pct = (norm * 100).toFixed(1);
  return `${norm >= 0 ? "+" : ""}${pct}%`;
}

export function buildRadarVertices(
  macro: DominanceResult,
  intraday: DominanceResult,
  intraday4h: DominanceResult,
  macroComponents?: DominanceComponent[],
  intradayComponents?: DominanceComponent[],
  intraday4hComponents?: DominanceComponent[],
  current?: RadarCurrent,
): RadarVertex[] {
  const macroNorm = dominanceToNormalized(macro.bullPct);
  const intra4hNorm = dominanceToNormalized(intraday4h.bullPct);
  const fastNorm = dominanceToNormalized(intraday.bullPct);

  const curveC = findComponent(macroComponents, /10y|2y|curve/i);
  const vixC = findComponent(macroComponents, /^vix|risk on/i) ?? findComponent(macroComponents, /vix/i);
  const usdC = findComponent(macroComponents, /usd|dollar/i);
  const priceC =
    findComponent(intradayComponents, /xau|price|momentum|impulse/i) ??
    findComponent(intraday4hComponents, /xau|price|momentum|impulse/i);
  const yieldC = findComponent(macroComponents, /real yield/i);

  const values: Record<string, number> = {
    macro24h: macroNorm,
    curve: curveC ? componentNorm(curveC) : 0,
    vix: vixC ? componentNorm(vixC) : current?.vix != null ? (current.vix < 18 ? 0.2 : -0.2) : 0,
    usd: usdC ? -componentNorm(usdC) : current?.usdBroad != null ? (current.usdBroad > 110 ? -0.3 : 0.1) : 0,
    intraday4h: -intra4hNorm,
    fast: -fastNorm,
    price: priceC ? -componentNorm(priceC) : 0,
    realyield: yieldC ? -componentNorm(yieldC) : current?.realYield != null ? (current.realYield > 2 ? -0.35 : 0.15) : 0,
  };

  const components: Record<string, DominanceComponent | undefined> = {
    macro24h: undefined,
    curve: curveC,
    vix: vixC,
    usd: usdC,
    intraday4h: undefined,
    fast: undefined,
    price: priceC,
    realyield: yieldC,
  };

  return SPOKES.map((spoke) => {
    const norm = values[spoke.id] ?? 0;
    const side: RadarVertex["side"] = norm > 0.08 ? "bull" : norm < -0.08 ? "bear" : "neutral";
    return {
      id: spoke.id,
      label: spoke.label,
      angleDeg: spoke.angleDeg,
      normalized: norm,
      side,
      sublabel: formatVertexValue(spoke.id, norm, current, components[spoke.id]),
    };
  });
}

export function vertexToPoint(norm: number, angleDeg: number, minR = 100, maxR = 235): { x: number; y: number } {
  const effectiveR = minR + Math.abs(norm) * (maxR - minR);
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.sin(rad) * effectiveR,
    y: -Math.cos(rad) * effectiveR,
  };
}

export function polygonPoints(vertices: RadarVertex[]): string {
  return vertices
    .map((v) => {
      const p = vertexToPoint(v.normalized, v.angleDeg);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

export function radarConviction(macro: DominanceResult, intraday: DominanceResult, split: boolean): string {
  if (split) return "LOW · SPLIT";
  const edge = Math.abs(intraday.edge);
  if (edge < 6) return "LOW · BALANCED";
  if (edge < 18) return "MOD · " + (intraday.leaning === "bull" ? "BULL" : intraday.leaning === "bear" ? "BEAR" : "MIX");
  return "HIGH · " + intraday.magnitude.toUpperCase();
}
