export function formatViewCount(viewCount: number): string {
  if (viewCount >= 1000) {
    return `${(viewCount / 1000).toFixed(1)}K`;
  }

  return `${viewCount}`;
}
