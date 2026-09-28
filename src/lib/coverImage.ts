/**
 * Tango — Book Cover Image Handling
 *
 * Governed by:
 * - docs/CONTENT_LIBRARY_SPEC.md (§§5.2, 5.3, 14, 19)
 * - docs/ARCHITECTURE.md (§4.2)
 * - docs/SCREEN_SPEC.md (§5 Validation Invariants)
 *
 * Covers are stored as binary Blobs in IndexedDB (never base64 in localStorage). Large photos
 * are downscaled in the browser before saving so local storage stays small.
 */

import { StudyBook } from '../types';
import { createId } from './ids';
import { deleteCoverBlob, loadBooks, saveBooks, saveCoverBlob } from './storage';
import { updateStudyBook } from './contentActions';

export const COVER_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Longest cover edge kept after downscaling (3:4 covers at 2x density on large cards). */
export const COVER_MAX_EDGE = 900;

/** Accepts only .jpg, .jpeg, .png, and .webp files (by extension and, when known, MIME type). */
export function isSupportedCoverFile(file: { name: string; type: string }): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) return false;
  return file.type === '' || ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
}

/** Target size that keeps the aspect ratio and fits inside `maxEdge`. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge || longest === 0) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Downscales large images to WebP/JPEG. Falls back to the original file when the browser
 * cannot decode or re-encode it, so a valid cover is never rejected.
 */
export async function prepareCoverBlob(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, COVER_MAX_EDGE);
    if (width === bitmap.width && height === bitmap.height && file.size < 400_000) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const encoded = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.86)
    );
    if (encoded && encoded.size > 0 && encoded.size < file.size) return encoded;
    return file;
  } catch {
    return file;
  }
}

/** Stores a new cover Blob and returns its opaque `coverImageId`. */
export async function storeCoverBlob(file: Blob): Promise<string> {
  const blob = await prepareCoverBlob(file);
  const coverImageId = createId('cover');
  await saveCoverBlob(coverImageId, blob);
  return coverImageId;
}

/**
 * Replaces a book cover: saves the new Blob, points the book at it, then deletes the
 * obsolete Blob so no orphaned image remains (CONTENT_LIBRARY_SPEC §5.3).
 * If the metadata write fails, the new Blob is deleted and the old cover stays referenced
 * and intact, so the operation can simply be retried.
 */
export async function replaceBookCover(bookId: string, file: Blob, now: Date): Promise<StudyBook | null> {
  const current = loadBooks()[bookId];
  if (!current) return null;
  const coverImageId = await storeCoverBlob(file);
  const books = loadBooks();
  if (!books[bookId]) {
    await deleteCoverBlob(coverImageId);
    return null;
  }
  const oldCoverId = books[bookId].coverImageId;
  books[bookId] = updateStudyBook(books[bookId], { coverImageId }, now);
  try {
    saveBooks(books);
  } catch (error) {
    // Metadata still points at the old cover: drop the new Blob so nothing is orphaned
    await deleteCoverBlob(coverImageId).catch(() => undefined);
    throw error;
  }
  // Only after the new reference is persisted is the obsolete Blob removed
  if (oldCoverId && oldCoverId !== coverImageId) {
    await deleteCoverBlob(oldCoverId);
  }
  return books[bookId];
}
