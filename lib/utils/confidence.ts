export type ConfidenceDisplay = {
  percentage: string;
  label: "High" | "Medium" | "Low";
  className: string;
};

export function getConfidenceDisplay(confidence: number): ConfidenceDisplay {
  const percentage = `${Math.round(confidence * 100)}%`;

  if (confidence >= 0.8) {
    return { percentage, label: "High", className: "text-cyan-400" };
  }

  if (confidence >= 0.5) {
    return { percentage, label: "Medium", className: "text-amber-400" };
  }

  return { percentage, label: "Low", className: "text-rose-400" };
}