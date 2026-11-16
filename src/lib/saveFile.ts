import { saveAs } from 'file-saver';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.substring(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });

/**
 * Save/export a file.
 * Web: normal browser download.
 * Native (Android/iOS): WebViews cannot download blob: URLs, so write the file
 * to the app cache and open the system share sheet (Save to Files, WhatsApp, Mail...).
 */
export async function saveBlob(blob: Blob, fileName: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    saveAs(blob, fileName);
    return;
  }
  const safeName = fileName.replace(/[^\w.\- ]+/g, '_');
  const data = await blobToBase64(blob);
  const written = await Filesystem.writeFile({
    path: safeName,
    data,
    directory: Directory.Cache,
  });
  await Share.share({ title: safeName, url: written.uri, dialogTitle: safeName });
}

/** Escape text before interpolating into generated HTML. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
