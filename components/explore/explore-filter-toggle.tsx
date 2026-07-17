import { SegmentedControl } from '@/components/ui/segmented-control';
import type { ExploreSegment } from '@/data/explore-posts';

const SEGMENT_OPTIONS: { id: ExploreSegment; label: string }[] = [
  { id: 'nearby', label: 'Nearby' },
  { id: 'following', label: 'Following' },
];

type ExploreFilterToggleProps = {
  selectedSegment: ExploreSegment;
  onSelect: (segment: ExploreSegment) => void;
};

export function ExploreFilterToggle({ selectedSegment, onSelect }: ExploreFilterToggleProps) {
  return (
    <SegmentedControl
      options={SEGMENT_OPTIONS}
      selectedId={selectedSegment}
      onSelect={onSelect}
    />
  );
}
