import { Lesson, StudyItem } from '../types/study';
import { QuestionType, QuizConfig, QuizQuestion } from '../types/quiz';
import {
  getDeduplicationKey,
  normalizeJapanese,
  normalizeKana,
  normalizeVietnamese,
} from './textNormalization';

/**
 * Candidate fixed counts offered in quiz configuration screens.
 */
export const CANDIDATE_QUESTION_COUNTS = [10, 20, 40] as const;

/**
 * Quiz eligibility result exposing raw item count and canonical eligible count N.
 */
export interface QuizEligibility {
  rawItemCount: number;
  eligibleCount: number; // N: deduplicated lexical groups supporting at least one enabled compatible QuestionType
  hasEligibleQuestions: boolean; // Convenience flag: eligibleCount > 0
}

/**
 * Options accepted by getQuizEligibility or generateQuizQuestions.
 */
export interface QuizEngineConfig {
  lessonIds: string[];
  allowedTypes: QuestionType[];
  questionCount?: number | 'all';
  mode?: QuizConfig['mode'];
  /**
   * Optional review focus (Review Missed Words). When present, only lexical groups containing
   * one of these real StudyItem IDs are eligible, and the target item is always one of them.
   * Distractors are still drawn from every other lexical group of the selected lesson pool.
   */
  focusItemIds?: string[];
}

/**
 * Internal representation of a deduplicated lexical group.
 * Preserves real StudyItems in deterministic appearance order without synthetic merging.
 */
interface LexicalGroup {
  key: string;
  items: StudyItem[];
}

/**
 * Extracts the primary Vietnamese meaning from a StudyItem:
 * The first entry whose normalizeVietnamese(...) result is non-empty.
 */
export function getPrimaryVietnamese(item: StudyItem): string | undefined {
  if (!item || !Array.isArray(item.vietnamese)) return undefined;
  for (const entry of item.vietnamese) {
    const normalized = normalizeVietnamese(entry);
    if (normalized !== '') {
      return normalized;
    }
  }
  return undefined;
}

/**
 * Collects StudyItems in deterministic lesson and item order and groups
 * them into lexical groups using getDeduplicationKey(japanese, kana).
 * Missing lesson IDs are safely skipped.
 */
function collectLexicalGroups(
  lessonIds: string[],
  lessons: Record<string, Lesson>
): { rawItemCount: number; groups: LexicalGroup[] } {
  let rawItemCount = 0;
  const groupMap = new Map<string, StudyItem[]>();
  const groupKeys: string[] = [];

  for (const lessonId of lessonIds) {
    const lesson = lessons[lessonId];
    if (!lesson || !Array.isArray(lesson.items)) continue;

    for (const item of lesson.items) {
      rawItemCount++;
      const key = getDeduplicationKey(item.japanese, item.kana);
      const existing = groupMap.get(key);
      if (existing) {
        existing.push(item);
      } else {
        groupMap.set(key, [item]);
        groupKeys.push(key);
      }
    }
  }

  const groups: LexicalGroup[] = groupKeys.map((key) => ({
    key,
    items: groupMap.get(key)!,
  }));

  return { rawItemCount, groups };
}

/**
 * Returns the primary Vietnamese meaning for an entire lexical group:
 * The primary meaning of the first member in deterministic order that possesses one.
 */
function getGroupPrimaryVietnamese(items: StudyItem[]): string | undefined {
  for (const item of items) {
    const primary = getPrimaryVietnamese(item);
    if (primary !== undefined) {
      return primary;
    }
  }
  return undefined;
}

/**
 * Finds the first real member of a lexical group compatible with the given QuestionType.
 */
function findTargetItemForType(
  items: StudyItem[],
  type: QuestionType,
  focus?: ReadonlySet<string>
): StudyItem | undefined {
  for (const item of items) {
    if (focus && !focus.has(item.id)) continue;
    switch (type) {
      case 'kana_to_japanese':
        if (item.kana && normalizeKana(item.kana) !== '') {
          return item;
        }
        break;
      case 'japanese_to_vi':
      case 'vi_to_japanese':
      case 'vi_to_text':
        if (getPrimaryVietnamese(item) !== undefined) {
          return item;
        }
        break;
    }
  }
  return undefined;
}

/**
 * Gathers all distinct candidate distractor strings from OTHER lexical groups in the pool.
 * Does not use unselected lessons, fake answers, or the target group itself.
 * `limit` stops the scan early once enough distinct candidates exist (compatibility checks only
 * need 3); question generation always gathers the full candidate list.
 */
function getDistractorCandidates(
  targetGroup: LexicalGroup,
  targetItem: StudyItem,
  type: QuestionType,
  allGroups: LexicalGroup[],
  limit: number = Infinity
): string[] {
  const distractors = new Set<string>();

  if (type === 'kana_to_japanese' || type === 'vi_to_japanese') {
    const correctAnswer = targetItem.japanese;
    const normalizedCorrect = normalizeJapanese(correctAnswer);

    for (const otherGroup of allGroups) {
      if (distractors.size >= limit) break;
      if (otherGroup.key === targetGroup.key) continue;
      const candidate = otherGroup.items[0].japanese;
      if (
        candidate !== correctAnswer &&
        normalizeJapanese(candidate) !== normalizedCorrect
      ) {
        distractors.add(candidate);
      }
    }
  } else if (type === 'japanese_to_vi') {
    const correctAnswer = getPrimaryVietnamese(targetItem)!;
    const normalizedCorrect = normalizeVietnamese(correctAnswer);

    for (const otherGroup of allGroups) {
      if (distractors.size >= limit) break;
      if (otherGroup.key === targetGroup.key) continue;
      const candidate = getGroupPrimaryVietnamese(otherGroup.items);
      if (
        candidate !== undefined &&
        candidate !== correctAnswer &&
        normalizeVietnamese(candidate) !== normalizedCorrect
      ) {
        distractors.add(candidate);
      }
    }
  }

  return Array.from(distractors);
}

/**
 * Determines whether a lexical group is compatible with a QuestionType:
 * 1. At least one real member must satisfy required field availability.
 * 2. For multiple-choice types, the pool must supply at least 3 distinct distractors.
 */
function isGroupCompatibleWithType(
  group: LexicalGroup,
  type: QuestionType,
  allGroups: LexicalGroup[],
  focus?: ReadonlySet<string>
): boolean {
  const targetItem = findTargetItemForType(group.items, type, focus);
  if (!targetItem) return false;

  if (type === 'vi_to_text') {
    return true; // Written answer requires no options/distractors
  }

  const distractorCandidates = getDistractorCandidates(group, targetItem, type, allGroups, 3);
  return distractorCandidates.length >= 3;
}

function toFocusSet(focusItemIds?: string[]): ReadonlySet<string> | undefined {
  return Array.isArray(focusItemIds) ? new Set(focusItemIds) : undefined;
}

/**
 * Fisher-Yates unbiased shuffle algorithm using an injectable RNG.
 */
function shuffleArray<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Calculates quiz pool eligibility.
 * Supports both (lessonIds, lessons, allowedTypes) and (config, lessons) signatures.
 */
export function getQuizEligibility(
  lessonIds: string[],
  lessons: Record<string, Lesson>,
  allowedTypes: QuestionType[]
): QuizEligibility;
export function getQuizEligibility(
  config: QuizEngineConfig,
  lessons: Record<string, Lesson>
): QuizEligibility;
export function getQuizEligibility(
  firstArg: string[] | QuizEngineConfig,
  lessons: Record<string, Lesson>,
  allowedTypesParam?: QuestionType[]
): QuizEligibility {
  const lessonIds = Array.isArray(firstArg) ? firstArg : firstArg.lessonIds;
  const allowedTypes = Array.isArray(firstArg)
    ? (allowedTypesParam || [])
    : firstArg.allowedTypes;
  const focus = toFocusSet(Array.isArray(firstArg) ? undefined : firstArg.focusItemIds);

  const { rawItemCount, groups } = collectLexicalGroups(lessonIds, lessons);

  let eligibleCount = 0;
  for (const group of groups) {
    const isEligible = allowedTypes.some((type) =>
      isGroupCompatibleWithType(group, type, groups, focus)
    );
    if (isEligible) {
      eligibleCount++;
    }
  }

  return {
    rawItemCount,
    eligibleCount,
    hasEligibleQuestions: eligibleCount > 0,
  };
}

/**
 * Returns available fixed candidate counts (10, 20, 40) where candidate <= N.
 */
export function getAvailableQuestionCounts(eligibleCount: number): number[] {
  if (eligibleCount <= 0) return [];
  return CANDIDATE_QUESTION_COUNTS.filter((count) => count <= eligibleCount);
}

/**
 * Generates quiz questions for a test session according to the locked engine contract:
 * 1. Groups items into lexical groups.
 * 2. Filters against enabled QuestionTypes and distractor availability.
 * 3. Selects exactly ONE compatible QuestionType per eligible lexical group.
 * 4. Shuffles the complete eligible question pool.
 * 5. Slices to requested count (numeric <= N or 'all' = N).
 * 6. Assigns stable sequential IDs ("q-1", "q-2", ...).
 */
export function generateQuizQuestions(
  config: QuizConfig | (QuizEngineConfig & { questionCount: number | 'all' }),
  lessons: Record<string, Lesson>,
  rng: () => number = Math.random
): QuizQuestion[] {
  const { lessonIds, allowedTypes, questionCount } = config;
  const focus = toFocusSet('focusItemIds' in config ? config.focusItemIds : undefined);
  const { groups } = collectLexicalGroups(lessonIds, lessons);

  // 1. Identify eligible groups and their compatible types
  const eligibleGroupsWithTypes: { group: LexicalGroup; compatibleTypes: QuestionType[] }[] = [];

  for (const group of groups) {
    const compatibleTypes = allowedTypes.filter((type) =>
      isGroupCompatibleWithType(group, type, groups, focus)
    );
    if (compatibleTypes.length > 0) {
      eligibleGroupsWithTypes.push({ group, compatibleTypes });
    }
  }

  if (eligibleGroupsWithTypes.length === 0) {
    return [];
  }

  // 2. Generate exactly ONE initial question per eligible lexical group
  const questions: QuizQuestion[] = [];

  for (const { group, compatibleTypes } of eligibleGroupsWithTypes) {
    const chosenType =
      compatibleTypes.length === 1
        ? compatibleTypes[0]
        : compatibleTypes[Math.floor(rng() * compatibleTypes.length)];

    const targetItem = findTargetItemForType(group.items, chosenType, focus)!;

    let prompt: string;
    let subPrompt: string | undefined;
    let correctAnswer: string;
    let options: string[] | undefined;

    switch (chosenType) {
      case 'kana_to_japanese': {
        prompt = targetItem.kana!.trim();
        correctAnswer = targetItem.japanese;
        const candidates = getDistractorCandidates(group, targetItem, chosenType, groups);
        candidates.sort(); // Deterministic base before RNG shuffle
        const shuffledCandidates = shuffleArray(candidates, rng);
        const distractors = shuffledCandidates.slice(0, 3);
        options = shuffleArray([correctAnswer, ...distractors], rng);
        break;
      }
      case 'japanese_to_vi': {
        prompt = targetItem.japanese;
        subPrompt =
          targetItem.kana && normalizeKana(targetItem.kana) !== ''
            ? targetItem.kana.trim()
            : undefined;
        correctAnswer = getPrimaryVietnamese(targetItem)!;
        const candidates = getDistractorCandidates(group, targetItem, chosenType, groups);
        candidates.sort();
        const shuffledCandidates = shuffleArray(candidates, rng);
        const distractors = shuffledCandidates.slice(0, 3);
        options = shuffleArray([correctAnswer, ...distractors], rng);
        break;
      }
      case 'vi_to_japanese': {
        prompt = getPrimaryVietnamese(targetItem)!;
        correctAnswer = targetItem.japanese;
        const candidates = getDistractorCandidates(group, targetItem, chosenType, groups);
        candidates.sort();
        const shuffledCandidates = shuffleArray(candidates, rng);
        const distractors = shuffledCandidates.slice(0, 3);
        options = shuffleArray([correctAnswer, ...distractors], rng);
        break;
      }
      case 'vi_to_text': {
        prompt = getPrimaryVietnamese(targetItem)!;
        correctAnswer = targetItem.japanese;
        options = undefined;
        break;
      }
    }

    questions.push({
      id: '', // Will assign stable IDs after slicing
      type: chosenType,
      prompt,
      subPrompt,
      correctAnswer,
      options,
      targetItem,
    });
  }

  // 3. Shuffle full question pool using Fisher-Yates
  const shuffledQuestions = shuffleArray(questions, rng);

  // 4. Slice to requested count
  let slicedQuestions: QuizQuestion[];
  if (questionCount === 'all') {
    slicedQuestions = shuffledQuestions;
  } else {
    const limit = Math.max(0, Math.min(questionCount, shuffledQuestions.length));
    slicedQuestions = shuffledQuestions.slice(0, limit);
  }

  // 5. Assign stable sequential IDs ("q-1", "q-2", ...)
  return slicedQuestions.map((q, idx) => ({
    ...q,
    id: `q-${idx + 1}`,
  }));
}

/**
 * Pure answer evaluator:
 * - For multiple-choice: checks user answer against correctAnswer (no fuzzy matching).
 * - For vi_to_text: normalizes input with normalizeJapanese, accepts normalized target Japanese
 *   or normalized target Kana (when present).
 * Does not mutate the question object.
 */
export function evaluateQuizAnswer(
  question: QuizQuestion,
  userAnswer: string
): boolean {
  if (typeof userAnswer !== 'string') return false;

  if (question.type === 'vi_to_text') {
    const normalizedInput = normalizeJapanese(userAnswer);
    if (!normalizedInput) return false;

    const normalizedTargetJapanese = normalizeJapanese(question.targetItem.japanese);
    if (normalizedInput === normalizedTargetJapanese) {
      return true;
    }

    if (question.targetItem.kana) {
      const normalizedTargetKana = normalizeKana(question.targetItem.kana);
      if (normalizedTargetKana && normalizedInput === normalizedTargetKana) {
        return true;
      }
    }

    return false;
  }

  return userAnswer === question.correctAnswer;
}
