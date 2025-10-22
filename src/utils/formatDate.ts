/**
 * 投稿日時を相対時間で表示する（Instagram風）
 * @param dateString ISO 8601形式の日時文字列
 * @returns 相対時間の文字列
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  // 1分未満
  if (diffInSeconds < 60) {
    return 'たった今';
  }

  // 1時間未満
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  }

  // 24時間未満
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  }

  // 1週間未満
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}日前`;
  }

  // 1週間以上 - 日付表示
  const year = postDate.getFullYear();
  const month = postDate.getMonth() + 1;
  const day = postDate.getDate();

  // 同じ年なら年を省略
  const currentYear = now.getFullYear();
  if (year === currentYear) {
    return `${month}月${day}日`;
  }

  return `${year}年${month}月${day}日`;
}

/**
 * 投稿日時を完全な形式で表示する（投稿詳細用）
 * @param dateString ISO 8601形式の日時文字列
 * @returns 完全な日時の文字列（例: 2024年10月21日 12:34）
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${year}年${month}月${day}日 ${paddedHours}:${paddedMinutes}`;
}
