/** Shared owner period metrics (not tier-specific). */
export type BusinessAnalyticsPeriodMetrics = {
  likesReceived: number;
  commentsReceived: number;
  followersGained: number;
};

export type BusinessAnalyticsPeriodPartialMetrics = {
  likesReceived: number | null;
  commentsReceived: number | null;
  followersGained: number | null;
};
