import * as ImageManipulator from 'expo-image-manipulator';

import {
  BUSINESS_BRANDING_JPEG_QUALITY,
  type BusinessBrandingImageKind,
} from '@/constants/business-branding';
import {
  buildResizePlan,
  validateOutputByteSize,
  validateSourceByteSize,
} from '@/utils/business-branding-image-spec';

export type PrepareBusinessBrandingImageResult =
  | {
      ok: true;
      uri: string;
      width: number;
      height: number;
      byteLength: number;
      contentType: 'image/jpeg' | 'image/png';
      extension: 'jpg' | 'png';
    }
  | { ok: false; message: string };

async function readByteLength(uri: string): Promise<number> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read image (${response.status})`);
  }
  const blob = await response.blob();
  return blob.size;
}

function preferPngOutput(fileName?: string | null): boolean {
  const candidate = fileName?.trim().toLowerCase() ?? '';
  return candidate.endsWith('.png');
}

/**
 * Validates size, resizes/compresses for profile logo or cover banner uploads.
 * Output is JPEG by default; PNG when the picked file name ends with .png (e.g. logos with transparency).
 */
export async function prepareBusinessBrandingImage(params: {
  uri: string;
  kind: BusinessBrandingImageKind;
  width?: number | null;
  height?: number | null;
  fileName?: string | null;
}): Promise<PrepareBusinessBrandingImageResult> {
  try {
    const sourceBytes = await readByteLength(params.uri);
    const sourceError = validateSourceByteSize(sourceBytes);
    if (sourceError) {
      return { ok: false, message: sourceError };
    }

    const width = params.width ?? 0;
    const height = params.height ?? 0;
    const plan = buildResizePlan(params.kind, width, height);

    const actions: ImageManipulator.Action[] = [];
    if (plan.resizeWidth && plan.resizeHeight) {
      actions.push({ resize: { width: plan.resizeWidth, height: plan.resizeHeight } });
    }

    const usePng = params.kind === 'logo' && preferPngOutput(params.fileName);
    const format = usePng ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG;

    const manipulated = await ImageManipulator.manipulateAsync(params.uri, actions, {
      compress: usePng ? 1 : BUSINESS_BRANDING_JPEG_QUALITY,
      format,
    });

    const outputBytes = await readByteLength(manipulated.uri);
    const outputError = validateOutputByteSize(outputBytes, params.kind);
    if (outputError) {
      return { ok: false, message: outputError };
    }

    return {
      ok: true,
      uri: manipulated.uri,
      width: manipulated.width,
      height: manipulated.height,
      byteLength: outputBytes,
      contentType: usePng ? 'image/png' : 'image/jpeg',
      extension: usePng ? 'png' : 'jpg',
    };
  } catch {
    return {
      ok: false,
      message: "We couldn't prepare this image for upload. Try a different photo.",
    };
  }
}
