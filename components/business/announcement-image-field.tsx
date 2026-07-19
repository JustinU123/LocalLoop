import { PromotionImageField } from '@/components/business/promotion-image-field';

type AnnouncementImageFieldProps = {
  imageUri: string | null;
  onChange: (uri: string | null) => void;
  disabled?: boolean;
};

export function AnnouncementImageField(props: AnnouncementImageFieldProps) {
  return (
    <PromotionImageField
      {...props}
      label="Announcement Image"
      addButtonLabel="Add Image"
      changeButtonLabel="Change Image"
      removeButtonLabel="Remove Image"
      modalTitle="Announcement Image"
      placeholderText="Add an optional image to support your announcement."
    />
  );
}
