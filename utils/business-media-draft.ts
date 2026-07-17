import type { ImagePickerAsset } from 'expo-image-picker';

export type BusinessMediaDraft = {
  type: 'photo' | 'video';
  uri: string;
  fileName?: string | null;
  duration?: number | null;
  width?: number;
  height?: number;
};

let draft: BusinessMediaDraft | null = null;

export function setBusinessMediaDraft(next: BusinessMediaDraft) {
  draft = next;
}

export function getBusinessMediaDraft(): BusinessMediaDraft | null {
  return draft;
}

export function clearBusinessMediaDraft() {
  draft = null;
}

export function setBusinessMediaDraftFromAsset(type: 'photo' | 'video', asset: ImagePickerAsset) {
  setBusinessMediaDraft({
    type,
    uri: asset.uri,
    fileName: asset.fileName,
    duration: asset.duration,
    width: asset.width,
    height: asset.height,
  });
}
