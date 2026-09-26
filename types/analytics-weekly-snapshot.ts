export type WeeklySnapshotMetricState =
  | { state: 'loading' }
  | { state: 'unavailable' }
  | { state: 'ready'; value: number };

export type WeeklySnapshotViewModel = {
  posts: WeeklySnapshotMetricState;
  likes: WeeklySnapshotMetricState;
  comments: WeeklySnapshotMetricState;
  newFollowers: WeeklySnapshotMetricState;
};
