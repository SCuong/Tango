/**
 * Tango — Bundled Seed Data Registry & Library Initialization
 *
 * Governed by:
 * - docs/ARCHITECTURE.md (§§1, 4.1, 7.1)
 * - docs/DATA_MODEL.md (§4.1)
 * - docs/CONTENT_LIBRARY_SPEC.md (§2.3)
 */

import { Lesson } from '../types';
import {
  loadLessons,
  saveLessons,
  isLibraryInitialized,
  setLibraryInitialized,
} from '../lib/storage';

/**
 * Returns bundled seed lessons available in the distribution.
 * Currently empty until approved curriculum datasets are introduced.
 */
export function getSeedLessons(): Lesson[] {
  return [];
}

/**
 * Initializes the canonical mutable runtime lesson store (tango_v1_lessons)
 * from the bundled seed registry.
 *
 * Lifecycle Rules:
 * 1. If library is already initialized, no-op immediately and return false.
 * 2. If the seed registry is empty (length === 0), do NOT write the initialization
 *    marker; this ensures future approved seed content is not permanently locked out.
 * 3. Seed lessons are copied into tango_v1_lessons.
 * 4. The initialization marker (tango_v1_library_init) is written ONLY AFTER
 *    the lesson store write succeeds.
 * 5. Once initialized, subsequent application startups never re-copy or merge bundled
 *    seed lessons, ensuring that user edits or permanent deletions are never resurrected.
 *
 * @returns boolean indicating whether seed lessons were persisted in this invocation.
 */
export function initializeLibrary(seedLessons: Lesson[] = getSeedLessons()): boolean {
  if (isLibraryInitialized()) {
    return false;
  }

  // An empty seed registry must not permanently lock out future initialization
  if (seedLessons.length === 0) {
    return false;
  }

  const currentLessons = loadLessons();
  const updatedLessons: Record<string, Lesson> = { ...currentLessons };

  for (const lesson of seedLessons) {
    if (!updatedLessons[lesson.id]) {
      updatedLessons[lesson.id] = lesson;
    }
  }

  // 1. Write to canonical mutable store first
  saveLessons(updatedLessons);

  // 2. Mark initialization complete only after successful persistence
  setLibraryInitialized();

  return true;
}
