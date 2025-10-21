import { differenceInMonths, differenceInYears } from 'date-fns';

/**
 * 開始日から現在までの経験年数・月数を計算
 */
export function calculateExperience(startedAt: string | Date): {
  years: number;
  months: number;
  totalMonths: number;
} {
  const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
  const now = new Date();

  const totalMonths = differenceInMonths(now, start);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return {
    years,
    months,
    totalMonths,
  };
}

/**
 * 経験年数を表示用文字列に変換
 * 例: "1年6ヶ月", "2年", "6ヶ月"
 */
export function formatExperience(startedAt: string | Date): string {
  const { years, months } = calculateExperience(startedAt);

  if (years === 0) {
    return `${months}ヶ月`;
  }

  if (months === 0) {
    return `${years}年`;
  }

  return `${years}年${months}ヶ月`;
}

/**
 * 年月から日付を生成（日は常に1日）
 */
export function createStartDate(year: number, month: number): Date {
  return new Date(year, month - 1, 1); // monthは0-indexedなので-1
}
