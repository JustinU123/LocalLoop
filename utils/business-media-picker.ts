import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import {
  CAMERA_DENIED_ALERT,
  IMAGE_PICKER_QUALITY,
  LIBRARY_DENIED_ALERT,
  VIDEO_MAX_DURATION_SECONDS,
} from '@/constants/business-media';

type PermissionKind = 'camera' | 'library';

function showPermissionDeniedAlert(kind: PermissionKind) {
  const copy = kind === 'camera' ? CAMERA_DENIED_ALERT : LIBRARY_DENIED_ALERT;

  Alert.alert(copy.title, copy.message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

async function ensurePermission(kind: PermissionKind): Promise<boolean> {
  const current =
    kind === 'camera'
      ? await ImagePicker.getCameraPermissionsAsync()
      : await ImagePicker.getMediaLibraryPermissionsAsync();

  if (current.granted) {
    return true;
  }

  if (!current.canAskAgain) {
    showPermissionDeniedAlert(kind);
    return false;
  }

  const requested =
    kind === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (requested.granted) {
    return true;
  }

  if (!requested.canAskAgain) {
    showPermissionDeniedAlert(kind);
  }

  return false;
}

function getFirstAsset(result: ImagePicker.ImagePickerResult): ImagePicker.ImagePickerAsset | null {
  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return result.assets[0] ?? null;
}

export async function pickPhotoFromCamera(): Promise<ImagePicker.ImagePickerAsset | null> {
  const granted = await ensurePermission('camera');
  if (!granted) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: IMAGE_PICKER_QUALITY,
  });

  return getFirstAsset(result);
}

export async function pickPhotoFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
  const granted = await ensurePermission('library');
  if (!granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    allowsEditing: true,
    quality: IMAGE_PICKER_QUALITY,
  });

  return getFirstAsset(result);
}

export async function pickVideoFromCamera(): Promise<ImagePicker.ImagePickerAsset | null> {
  const granted = await ensurePermission('camera');
  if (!granted) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    videoMaxDuration: VIDEO_MAX_DURATION_SECONDS,
  });

  return getFirstAsset(result);
}

export async function pickVideoFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
  const granted = await ensurePermission('library');
  if (!granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsMultipleSelection: false,
  });

  return getFirstAsset(result);
}
