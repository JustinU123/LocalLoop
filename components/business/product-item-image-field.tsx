import { PromotionImageField } from '@/components/business/promotion-image-field';

type ProductItemImageFieldProps = {
  imageUri: string | null;
  onChange: (uri: string | null) => void;
  disabled?: boolean;
  error?: string;
};

export function ProductItemImageField({
  imageUri,
  onChange,
  disabled,
  error,
}: ProductItemImageFieldProps) {
  return (
    <PromotionImageField
      imageUri={imageUri}
      onChange={onChange}
      disabled={disabled}
      label="Product or Menu Item Image"
      addButtonLabel="Add Item Image"
      changeButtonLabel="Change Image"
      removeButtonLabel="Remove Image"
      modalTitle="Item Image"
      placeholderText="Add a photo so customers can see what you are offering."
      error={error}
    />
  );
}
