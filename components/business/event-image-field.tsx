import { PromotionImageField } from '@/components/business/promotion-image-field';

type EventImageFieldProps = {
  imageUri: string | null;
  onChange: (uri: string | null) => void;
  disabled?: boolean;
};

export function EventImageField(props: EventImageFieldProps) {
  return (
    <PromotionImageField
      {...props}
      label="Event Cover Image"
      addButtonLabel="Add Event Image"
      changeButtonLabel="Change Image"
      removeButtonLabel="Remove Image"
      modalTitle="Event Cover Image"
      placeholderText="Add a cover image to help your event stand out."
    />
  );
}
