import type { DominanceModels } from "./dominance-models";
import { dominanceInterpretation, splitRegimeFlag } from "./dominance-models";
import type { SignalData } from "./signal-types";

const SESSIONS = [
  { name: "Asia", start: 0, end: 8 },
  { name: "London", start: 7, end: 15 },
  { name: "New York", start: 13, end: 21 },
];

function activeSessionName(nowHour: number): string {
  for (const s of SESSIONS) {
    if (nowHour >= s.start && nowHour < s.end) return s.name;
  }
  return "Off-hours";
}

function nextPrimarySession(nowHour: number): string | null {
  if (nowHour < 7) return "London";
  if (nowHour >= 7 && nowHour < 13) return "London";
  if (nowHour >= 13 && nowHour < 21) return "New York";
  return "Asia";
}

export type GoldDecisionBrief = {
  headline: string;
  body: string;
  whatChanged?: string;
};

export function buildGoldDecisionBrief(
  signal: SignalData,
  models: DominanceModels,
  regimeLabel: string,
  positioningTitle: string,
  options?: {
    scoreLastChangedIso?: string;
    narrativeChanged?: boolean;
    scoreDelta?: number | null;
  },
): GoldDecisionBrief {
  const now = new Date();
  const nowHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  const active = activeSessionName(nowHour);
  const primary = nextPrimarySession(nowHour);
  const split = splitRegimeFlag(models.macro, models.intraday4h);
  const interpretation = dominanceInterpretation(models.macro, models.intraday4h);

  let headline = positioningTitle.replace(/\.$/, "");
  if (signal.score >= 50 && signal.score < 65 && primary === "London" && active !== "London") {
    headline = `Neutral — wait for ${primary} confirmation.`;
  } else if (signal.bias === "NEUTRAL") {
    headline = `Neutral — ${active === "London" ? "no clean execution signal yet" : `wait for ${primary} confirmation`}.`;
  }

  const intraBear = models.intraday.bearPct > models.intraday.bullPct;
  const macroBull = models.macro.bullPct > models.macro.bearPct;
  const parts: string[] = [];

  if (intraBear && macroBull) {
    parts.push("Opposing pressure dominates intraday flow. Macro remains constructive, but timing is not confirmed.");
  } else if (split) {
    parts.push("Macro and intraday layers disagree — stand aside until structure aligns.");
  } else {
    parts.push(interpretation);
  }

  if (signal.tradeZone) {
    parts.push(signal.tradeZone);
  }
  if (signal.continuation && !parts.some((p) => p.includes(signal.continuation.slice(0, 20)))) {
    parts.push(signal.continuation);
  }

  if (signal.score >= 45 && signal.score < 65) {
    parts.push("No clean execution signal yet.");
  }

  const body = parts.filter(Boolean).join(" ");

  let whatChanged: string | undefined;
  if (options?.narrativeChanged) {
    whatChanged = "Headline narrative updated since last pulse.";
  } else if (options?.scoreDelta != null && Math.abs(options.scoreDelta) >= 0.1) {
    whatChanged = `Score moved ${options.scoreDelta >= 0 ? "+" : ""}${options.scoreDelta.toFixed(1)} pts since last log entry.`;
  } else if (options?.scoreLastChangedIso) {
    try {
      const d = new Date(options.scoreLastChangedIso);
      const mins = Math.floor((Date.now() - d.getTime()) / 60000);
      if (mins < 120) {
        whatChanged = `Regime score stable for ${mins < 1 ? "<1" : mins}m — no material shift in composite.`;
      }
    } catch {
      /* ignore */
    }
  }

  return { headline, body, whatChanged };
}

export function postureStep(score: number): "observe" | "prepare" | "act" | "manage" {
  if (score >= 75) return "act";
  if (score >= 65) return "manage";
  if (score >= 45) return "prepare";
  return "observe";
}
