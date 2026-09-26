export type PostEngagementCounts = {
  postId: string;
  likeCount: number;
  commentCount: number;
};

export type BusinessPostEngagementSummary = {
  totalLikes: number;
  totalComments: number;
  byPostId: Record<string, PostEngagementCounts>;
};
