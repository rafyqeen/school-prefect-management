
export type FeeSettings = {
  monthlyFee: number;
  totalMonths: number;
};

const STORAGE_KEY = "prefectFeeSettings";

export const DEFAULT_FEE_SETTINGS: FeeSettings = {
  monthlyFee: 3,
  totalMonths: 11,
};

export function getFeeSettings(): FeeSettings {
  if (typeof window === "undefined") {
    return DEFAULT_FEE_SETTINGS;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_FEE_SETTINGS;
    }

    const parsed = JSON.parse(saved);

    return {
      monthlyFee: Number(parsed.monthlyFee) || 0,
      totalMonths: Number(parsed.totalMonths) || 0,
    };
  } catch {
    return DEFAULT_FEE_SETTINGS;
  }
}

export function saveFeeSettings(settings: FeeSettings): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getTotalFee(settings: FeeSettings): number {
  return settings.monthlyFee * settings.totalMonths;
}
