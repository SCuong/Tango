import { describe, it, expect } from 'vitest';
import { Lesson, StudyItem } from '../../types/study';
import { QuestionType, QuizQuestion } from '../../types/quiz';
import {
  getPrimaryVietnamese,
  getQuizEligibility,
  getAvailableQuestionCounts,
  generateQuizQuestions,
  evaluateQuizAnswer,
  CANDIDATE_QUESTION_COUNTS,
} from '../quizEngine';

/**
 * Creates a deterministic pseudo-random generator (Mulberry32) for reproducible tests.
 */
function createDeterministicRng(seed: number = 42): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t >>> 0) / 4294967296;
  };
}

/**
 * Test fixture factory for StudyItem.
 */
function createItem(
  id: string,
  japanese: string,
  kana?: string,
  vietnamese: string[] = [],
  hanViet?: string
): StudyItem {
  return { id, japanese, kana, vietnamese, hanViet };
}

/**
 * Test fixture factory for Lesson.
 */
function createLesson(
  id: string,
  items: StudyItem[],
  category: 'vocabulary' | 'kanji' = 'vocabulary'
): Lesson {
  return {
    id,
    category,
    title: `Lesson ${id}`,
    items,
  };
}

describe('quizEngine', () => {
  describe('getPrimaryVietnamese', () => {
    it('returns the first non-empty normalized entry', () => {
      const item = createItem('1', '旅行', 'りょこう', ['  du lịch  ', 'chuyến đi']);
      expect(getPrimaryVietnamese(item)).toBe('du lịch');
    });

    it('skips empty or whitespace-only entries', () => {
      const item = createItem('1', '旅行', 'りょこう', ['', '   ', 'du lịch']);
      expect(getPrimaryVietnamese(item)).toBe('du lịch');
    });

    it('returns undefined if vietnamese array is empty or has only blank entries', () => {
      const itemEmpty = createItem('1', '旅行', 'りょこう', []);
      expect(getPrimaryVietnamese(itemEmpty)).toBeUndefined();

      const itemBlanks = createItem('2', '旅行', 'りょこう', ['', '  ']);
      expect(getPrimaryVietnamese(itemBlanks)).toBeUndefined();
    });

    it('normalizes Unicode NFC diacritics in Vietnamese text', () => {
      // Decomposed "u" + combining acute accent
      const decomposed = 'du li\u0323ch';
      const item = createItem('1', '旅行', 'りょこう', [decomposed]);
      expect(getPrimaryVietnamese(item)).toBe('du lịch'.normalize('NFC'));
    });
  });

  describe('getQuizEligibility & Canonical Pool Resolution', () => {
    it('determines raw item count and preserves deterministic collection order', () => {
      const itemA = createItem('v1', '本', 'ほん', ['sách']);
      const itemB = createItem('v2', '車', 'くるま', ['xe hơi']);
      const itemC = createItem('k1', '木', 'き', ['cây']);
      const itemD = createItem('k2', '火', 'ひ', ['lửa']);

      const lessons: Record<string, Lesson> = {
        'vocab-1': createLesson('vocab-1', [itemA, itemB]),
        'kanji-1': createLesson('kanji-1', [itemC, itemD]),
      };

      const eligibility = getQuizEligibility(
        ['vocab-1', 'kanji-1'],
        lessons,
        ['kana_to_japanese']
      );

      // 4 distinct items across 2 lessons
      expect(eligibility.rawItemCount).toBe(4);
      // All 4 have Kana, and each can draw 3 distinct distractors from the other 3
      expect(eligibility.eligibleCount).toBe(4);
      expect(eligibility.hasEligibleQuestions).toBe(true);
    });

    it('deduplicates items sharing normalized Japanese and Kana into lexical groups', () => {
      // Same word in both vocab and kanji
      const itemV = createItem('v1', '旅行', 'りょこう', ['du lịch']);
      const itemK = createItem('k1', '旅行', 'りょこう', ['chuyến du hành']);
      const item2 = createItem('v2', '車', 'くるま', ['xe hơi']);
      const item3 = createItem('v3', '木', 'き', ['cây']);
      const item4 = createItem('v4', '火', 'ひ', ['lửa']);

      const lessons: Record<string, Lesson> = {
        'vocab-1': createLesson('vocab-1', [itemV, item2, item3, item4]),
        'kanji-1': createLesson('kanji-1', [itemK]),
      };

      const eligibility = getQuizEligibility(
        ['vocab-1', 'kanji-1'],
        lessons,
        ['japanese_to_vi']
      );

      // 5 raw items, but itemV and itemK form 1 lexical group -> 4 lexical groups total
      expect(eligibility.rawItemCount).toBe(5);
      expect(eligibility.eligibleCount).toBe(4);
    });

    it('does NOT create synthetic merged StudyItems and preserves real item references', () => {
      const item1 = createItem('item-1', '旅行', 'りょこう', ['du lịch']);
      const item2 = createItem('item-2', '旅行', 'りょこう', ['du hành']);
      const itemB = createItem('item-b', '車', 'くるま', ['xe']);
      const itemC = createItem('item-c', '木', 'き', ['cây']);
      const itemD = createItem('item-d', '火', 'ひ', ['lửa']);

      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', [item1, item2, itemB, itemC, itemD]),
      };

      const questions = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['japanese_to_vi'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(100)
      );

      const travelQ = questions.find((q) => q.targetItem.japanese === '旅行');
      expect(travelQ).toBeDefined();
      // First encountered duplicate should be targetItem
      expect(travelQ!.targetItem.id).toBe('item-1');
      expect(travelQ!.targetItem).toBe(item1);
      // Not a synthetic object
      expect(travelQ!.targetItem.vietnamese).toEqual(['du lịch']);
    });

    it('selects the first compatible real member if earlier duplicate lacks required fields', () => {
      // First duplicate lacks kana
      const itemWithoutKana = createItem('v1', '旅行', undefined, ['du lịch']);
      // Second duplicate has kana
      const itemWithKana = createItem('k1', '旅行', 'りょこう', ['chuyến đi']);
      const itemB = createItem('b', '車', 'くるま', ['xe']);
      const itemC = createItem('c', '木', 'き', ['cây']);
      const itemD = createItem('d', '火', 'ひ', ['lửa']);

      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', [
          itemWithoutKana,
          itemWithKana,
          itemB,
          itemC,
          itemD,
        ]),
      };

      // When kana_to_japanese is requested, group is compatible because itemWithKana has kana
      const eligibility = getQuizEligibility(
        ['lesson-1'],
        lessons,
        ['kana_to_japanese']
      );
      expect(eligibility.eligibleCount).toBe(4);

      const questions = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['kana_to_japanese'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(42)
      );

      const travelQ = questions.find((q) => q.correctAnswer === '旅行');
      expect(travelQ).toBeDefined();
      // Must pick itemWithKana as targetItem because itemWithoutKana is incompatible with kana_to_japanese
      expect(travelQ!.targetItem.id).toBe('k1');
      expect(travelQ!.prompt).toBe('りょこう');
    });

    it('safely skips missing lesson IDs without crashing', () => {
      const itemA = createItem('a', '本', 'ほん', ['sách']);
      const lessons: Record<string, Lesson> = {
        'valid-lesson': createLesson('valid-lesson', [itemA]),
      };

      const eligibility = getQuizEligibility(
        ['non-existent-lesson', 'valid-lesson', 'another-missing'],
        lessons,
        ['vi_to_text']
      );

      expect(eligibility.rawItemCount).toBe(1);
      expect(eligibility.eligibleCount).toBe(1);
    });

    it('does not multiply N when multiple question types are enabled', () => {
      const items = [
        createItem('1', '本', 'ほん', ['sách']),
        createItem('2', '車', 'くるま', ['xe']),
        createItem('3', '木', 'き', ['cây']),
        createItem('4', '火', 'ひ', ['lửa']),
      ];
      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', items),
      };

      const allFourTypes: QuestionType[] = [
        'kana_to_japanese',
        'japanese_to_vi',
        'vi_to_japanese',
        'vi_to_text',
      ];

      const eligibility = getQuizEligibility(['lesson-1'], lessons, allFourTypes);
      // N must be exactly 4 (one per lexical group), never 4 * 4 = 16
      expect(eligibility.eligibleCount).toBe(4);
    });

    it('supports getQuizEligibility called with a config object', () => {
      const items = [
        createItem('1', '本', 'ほん', ['sách']),
        createItem('2', '車', 'くるま', ['xe']),
      ];
      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', items),
      };

      const eligibility = getQuizEligibility(
        { lessonIds: ['lesson-1'], allowedTypes: ['vi_to_text'] },
        lessons
      );
      expect(eligibility.rawItemCount).toBe(2);
      expect(eligibility.eligibleCount).toBe(2);
    });
  });

  describe('Question-Type Compatibility & Distractor Contract', () => {
    it('disables kana_to_japanese for lexical groups missing Kana', () => {
      const itemNoKana = createItem('1', '旅行', undefined, ['du lịch']);
      const itemB = createItem('2', '車', 'くるま', ['xe']);
      const itemC = createItem('3', '木', 'き', ['cây']);
      const itemD = createItem('4', '火', 'ひ', ['lửa']);
      const itemE = createItem('5', '水', 'みず', ['nước']);

      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', [itemNoKana, itemB, itemC, itemD, itemE]),
      };

      // Only kana_to_japanese enabled
      const eligibility = getQuizEligibility(
        ['lesson-1'],
        lessons,
        ['kana_to_japanese']
      );
      // itemNoKana cannot generate kana_to_japanese, so only the other 4 groups are eligible
      expect(eligibility.rawItemCount).toBe(5);
      expect(eligibility.eligibleCount).toBe(4);

      const questions = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['kana_to_japanese'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(42)
      );

      // Verify no question was generated with itemNoKana as targetItem
      expect(questions.length).toBe(4);
      expect(questions.some((q) => q.targetItem.id === '1')).toBe(false);

      // If all items lack kana, N is 0
      const noKanaLesson = {
        'no-kana': createLesson('no-kana', [
          createItem('1', '本', undefined, ['sách']),
          createItem('2', '車', undefined, ['xe']),
          createItem('3', '木', undefined, ['cây']),
          createItem('4', '火', undefined, ['lửa']),
        ]),
      };
      const zeroEligibility = getQuizEligibility(
        ['no-kana'],
        noKanaLesson,
        ['kana_to_japanese']
      );
      expect(zeroEligibility.eligibleCount).toBe(0);
    });

    it('disables Vietnamese-based types when Vietnamese definition is empty', () => {
      const itemNoVi = createItem('1', '旅行', 'りょこう', []);
      const itemB = createItem('2', '車', 'くるま', ['xe']);
      const itemC = createItem('3', '木', 'き', ['cây']);
      const itemD = createItem('4', '火', 'ひ', ['lửa']);
      const itemE = createItem('5', '水', 'みず', ['nước']);

      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', [itemNoVi, itemB, itemC, itemD, itemE]),
      };

      // japanese_to_vi: itemNoVi cannot be a target, but others have 3 distractors
      const eligibilityVi = getQuizEligibility(
        ['lesson-1'],
        lessons,
        ['japanese_to_vi']
      );
      expect(eligibilityVi.eligibleCount).toBe(4); // 4 groups with Vietnamese

      // kana_to_japanese: all 5 have kana and 4 distractors
      const eligibilityKana = getQuizEligibility(
        ['lesson-1'],
        lessons,
        ['kana_to_japanese']
      );
      expect(eligibilityKana.eligibleCount).toBe(5);
    });

    it('produces N = 0 for MC-only allowedTypes when pool has fewer than 4 lexical groups', () => {
      // Pool with only 3 items cannot supply 3 distinct distractors (each target only sees 2 other groups)
      const items = [
        createItem('1', '本', 'ほん', ['sách']),
        createItem('2', '車', 'くるま', ['xe']),
        createItem('3', '木', 'き', ['cây']),
      ];
      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', items),
      };

      const eligibilityMC = getQuizEligibility(['lesson-1'], lessons, [
        'kana_to_japanese',
        'japanese_to_vi',
        'vi_to_japanese',
      ]);
      expect(eligibilityMC.rawItemCount).toBe(3);
      expect(eligibilityMC.eligibleCount).toBe(0);
      expect(eligibilityMC.hasEligibleQuestions).toBe(false);
    });

    it('keeps vi_to_text eligible even when pool has fewer than 4 lexical groups', () => {
      // Written answer does not need distractors!
      const items = [
        createItem('1', '本', 'ほん', ['sách']),
        createItem('2', '車', 'くるま', ['xe']),
        createItem('3', '木', 'き', ['cây']),
      ];
      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', items),
      };

      const eligibilityText = getQuizEligibility(
        ['lesson-1'],
        lessons,
        ['vi_to_text']
      );
      expect(eligibilityText.rawItemCount).toBe(3);
      expect(eligibilityText.eligibleCount).toBe(3);
      expect(eligibilityText.hasEligibleQuestions).toBe(true);
    });

    it('eliminates duplicate visible distractor values and verifies 3 distinct distractors', () => {
      // 4 groups, but groups 2, 3, 4 share the identical primary Vietnamese meaning "xe"
      const item1 = createItem('1', '車', 'くるま', ['xe']);
      const item2 = createItem('2', '自動車', 'じどうしゃ', ['xe']);
      const item3 = createItem('3', '車両', 'しゃりょう', ['xe']);
      const item4 = createItem('4', '汽車', 'きしゃ', ['xe lửa']);

      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', [item1, item2, item3, item4]),
      };

      // For item 4 (correctAnswer = "xe lửa"), other groups only provide ONE unique Vietnamese string ("xe").
      // That is fewer than 3 distinct distractors! So japanese_to_vi cannot be generated.
      const eligibilityVi = getQuizEligibility(
        ['lesson-1'],
        lessons,
        ['japanese_to_vi']
      );
      expect(eligibilityVi.eligibleCount).toBe(0);

      // But for kana_to_japanese, the Japanese characters are distinct (車, 自動車, 車両, 汽車).
      // Each group has 3 distinct Japanese distractors!
      const eligibilityKana = getQuizEligibility(
        ['lesson-1'],
        lessons,
        ['kana_to_japanese']
      );
      expect(eligibilityKana.eligibleCount).toBe(4);
    });

    it('ensures generated multiple-choice questions have exactly 4 distinct options', () => {
      const items = [
        createItem('1', '本', 'ほん', ['sách']),
        createItem('2', '車', 'くるま', ['xe']),
        createItem('3', '木', 'き', ['cây']),
        createItem('4', '火', 'ひ', ['lửa']),
        createItem('5', '水', 'みず', ['nước']),
      ];
      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', items),
      };

      const mcTypes: QuestionType[] = [
        'kana_to_japanese',
        'japanese_to_vi',
        'vi_to_japanese',
      ];

      for (const type of mcTypes) {
        const questions = generateQuizQuestions(
          {
            lessonIds: ['lesson-1'],
            allowedTypes: [type],
            questionCount: 'all',
          },
          lessons,
          createDeterministicRng(123)
        );

        expect(questions.length).toBe(5);
        for (const q of questions) {
          expect(q.options).toBeDefined();
          expect(q.options!.length).toBe(4);
          // All 4 options must be distinct
          const uniqueOptions = new Set(q.options);
          expect(uniqueOptions.size).toBe(4);
          // Correct answer must be one of the options
          expect(uniqueOptions.has(q.correctAnswer)).toBe(true);
        }
      }
    });

    it('never draws distractors from unselected lessons', () => {
      const selectedItems = [
        createItem('1', '本', 'ほん', ['sách']),
        createItem('2', '車', 'くるま', ['xe']),
        createItem('3', '木', 'き', ['cây']),
        createItem('4', '火', 'ひ', ['lửa']),
      ];
      const unselectedItems = [
        createItem('un-1', '東京', 'とうきょう', ['Tokyo']),
        createItem('un-2', '京都', 'きょうと', ['Kyoto']),
      ];

      const lessons: Record<string, Lesson> = {
        'selected-lesson': createLesson('selected-lesson', selectedItems),
        'unselected-lesson': createLesson('unselected-lesson', unselectedItems),
      };

      const questions = generateQuizQuestions(
        {
          lessonIds: ['selected-lesson'],
          allowedTypes: ['kana_to_japanese', 'japanese_to_vi', 'vi_to_japanese'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(999)
      );

      for (const q of questions) {
        if (q.options) {
          expect(q.options).not.toContain('東京');
          expect(q.options).not.toContain('京都');
          expect(q.options).not.toContain('Tokyo');
          expect(q.options).not.toContain('Kyoto');
        }
      }
    });

    it('properly formats vi_to_japanese questions', () => {
      const items = [
        createItem('1', '旅行', 'りょこう', ['du lịch']),
        createItem('2', '車', 'くるま', ['xe']),
        createItem('3', '木', 'き', ['cây']),
        createItem('4', '火', 'ひ', ['lửa']),
      ];
      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', items),
      };

      const questions = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['vi_to_japanese'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(42)
      );

      const travelQ = questions.find((q) => q.correctAnswer === '旅行');
      expect(travelQ).toBeDefined();
      expect(travelQ!.prompt).toBe('du lịch');
      expect(travelQ!.correctAnswer).toBe('旅行');
      expect(travelQ!.options).toBeDefined();
      expect(travelQ!.options!.length).toBe(4);
      expect(travelQ!.options).toContain('旅行');
    });

    it('sets subPrompt to Kana for japanese_to_vi when Kana is present', () => {
      const itemWithKana = createItem('1', '旅行', 'りょこう', ['du lịch']);
      const itemB = createItem('2', '車', 'くるま', ['xe']);
      const itemC = createItem('3', '木', 'き', ['cây']);
      const itemD = createItem('4', '火', 'ひ', ['lửa']);

      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', [itemWithKana, itemB, itemC, itemD]),
      };

      const questions = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['japanese_to_vi'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(42)
      );

      const travelQ = questions.find((q) => q.prompt === '旅行');
      expect(travelQ).toBeDefined();
      expect(travelQ!.subPrompt).toBe('りょこう');
    });

    it('leaves options undefined for vi_to_text', () => {
      const items = [
        createItem('1', '本', 'ほん', ['sách']),
        createItem('2', '車', 'くるま', ['xe']),
      ];
      const lessons: Record<string, Lesson> = {
        'lesson-1': createLesson('lesson-1', items),
      };

      const questions = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['vi_to_text'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(42)
      );

      expect(questions.length).toBe(2);
      for (const q of questions) {
        expect(q.type).toBe('vi_to_text');
        expect(q.options).toBeUndefined();
      }
    });
  });

  describe('Question Pool Slicing & Stable IDs', () => {
    const items = [
      createItem('1', '本', 'ほん', ['sách']),
      createItem('2', '車', 'くるま', ['xe']),
      createItem('3', '木', 'き', ['cây']),
      createItem('4', '火', 'ひ', ['lửa']),
      createItem('5', '水', 'みず', ['nước']),
    ];
    const lessons: Record<string, Lesson> = {
      'lesson-1': createLesson('lesson-1', items),
    };

    it("'all' returns exactly N initial questions", () => {
      const questions = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['vi_to_text'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(42)
      );

      expect(questions.length).toBe(5);
      expect(questions.map((q) => q.id)).toEqual([
        'q-1',
        'q-2',
        'q-3',
        'q-4',
        'q-5',
      ]);
    });

    it('numeric questionCount slices properly and never exceeds N', () => {
      const sliced = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['vi_to_text'],
          questionCount: 3,
        },
        lessons,
        createDeterministicRng(42)
      );

      expect(sliced.length).toBe(3);
      expect(sliced.map((q) => q.id)).toEqual(['q-1', 'q-2', 'q-3']);

      // Requesting 10 when N = 5 caps at 5
      const capped = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['vi_to_text'],
          questionCount: 10,
        },
        lessons,
        createDeterministicRng(42)
      );
      expect(capped.length).toBe(5);
    });

    it('returns empty array when N = 0', () => {
      const emptyQuestions = generateQuizQuestions(
        {
          lessonIds: ['non-existent'],
          allowedTypes: ['vi_to_text'],
          questionCount: 'all',
        },
        lessons
      );
      expect(emptyQuestions).toEqual([]);
    });

    it('injectable deterministic RNG produces identical stable output', () => {
      const run1 = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['kana_to_japanese', 'japanese_to_vi'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(777)
      );

      const run2 = generateQuizQuestions(
        {
          lessonIds: ['lesson-1'],
          allowedTypes: ['kana_to_japanese', 'japanese_to_vi'],
          questionCount: 'all',
        },
        lessons,
        createDeterministicRng(777)
      );

      expect(run1).toEqual(run2);
    });
  });

  describe('getAvailableQuestionCounts', () => {
    it('obeys candidate <= N rule', () => {
      expect(CANDIDATE_QUESTION_COUNTS).toEqual([10, 20, 40]);

      expect(getAvailableQuestionCounts(0)).toEqual([]);
      expect(getAvailableQuestionCounts(7)).toEqual([]);
      expect(getAvailableQuestionCounts(10)).toEqual([10]);
      expect(getAvailableQuestionCounts(16)).toEqual([10]);
      expect(getAvailableQuestionCounts(20)).toEqual([10, 20]);
      expect(getAvailableQuestionCounts(27)).toEqual([10, 20]);
      expect(getAvailableQuestionCounts(40)).toEqual([10, 20, 40]);
      expect(getAvailableQuestionCounts(81)).toEqual([10, 20, 40]);
      expect(getAvailableQuestionCounts(-5)).toEqual([]);
    });
  });

  describe('evaluateQuizAnswer', () => {
    const targetItem: StudyItem = {
      id: 'travel-item',
      japanese: '旅行',
      kana: 'りょこう',
      vietnamese: ['du lịch', 'chuyến đi'],
    };

    it('evaluates multiple-choice questions against correctAnswer without fuzzy matching', () => {
      const mcQuestion: QuizQuestion = {
        id: 'q-1',
        type: 'japanese_to_vi',
        prompt: '旅行',
        correctAnswer: 'du lịch',
        options: ['du lịch', 'xe', 'cây', 'lửa'],
        targetItem,
      };

      expect(evaluateQuizAnswer(mcQuestion, 'du lịch')).toBe(true);
      expect(evaluateQuizAnswer(mcQuestion, '  du lịch  ')).toBe(true);
      expect(evaluateQuizAnswer(mcQuestion, 'du lich')).toBe(false); // No fuzzy matching for diacritics
      expect(evaluateQuizAnswer(mcQuestion, 'chuyến đi')).toBe(false); // Only generated correctAnswer is accepted
      expect(evaluateQuizAnswer(mcQuestion, 'xe')).toBe(false);
    });

    it('accepts normalized Japanese in vi_to_text mode', () => {
      const textQuestion: QuizQuestion = {
        id: 'q-2',
        type: 'vi_to_text',
        prompt: 'du lịch',
        correctAnswer: '旅行',
        targetItem,
      };

      expect(evaluateQuizAnswer(textQuestion, '旅行')).toBe(true);
      expect(evaluateQuizAnswer(textQuestion, '  旅行  ')).toBe(true);
      expect(evaluateQuizAnswer(textQuestion, '　旅行　')).toBe(true); // Full-width Japanese space
    });

    it('accepts normalized Kana in vi_to_text mode when Kana is present', () => {
      const textQuestion: QuizQuestion = {
        id: 'q-2',
        type: 'vi_to_text',
        prompt: 'du lịch',
        correctAnswer: '旅行',
        targetItem,
      };

      expect(evaluateQuizAnswer(textQuestion, 'りょこう')).toBe(true);
      expect(evaluateQuizAnswer(textQuestion, '  りょこう  ')).toBe(true);
    });

    it('normalizes half-width to full-width Katakana during vi_to_text evaluation', () => {
      const katakanaItem: StudyItem = {
        id: 'fastfood-item',
        japanese: 'ファストフード',
        kana: 'ふぁすとふーど',
        vietnamese: ['đồ ăn nhanh'],
      };

      const textQuestion: QuizQuestion = {
        id: 'q-3',
        type: 'vi_to_text',
        prompt: 'đồ ăn nhanh',
        correctAnswer: 'ファストフード',
        targetItem: katakanaItem,
      };

      // Half-width Katakana for ファストフード: ﾌｧｽﾄﾌｰﾄﾞ
      expect(evaluateQuizAnswer(textQuestion, 'ﾌｧｽﾄﾌｰﾄﾞ')).toBe(true);
      // Hiragana reading also accepted
      expect(evaluateQuizAnswer(textQuestion, 'ふぁすとふーど')).toBe(true);
    });

    it('rejects incorrect answers and blank inputs in vi_to_text mode', () => {
      const textQuestion: QuizQuestion = {
        id: 'q-2',
        type: 'vi_to_text',
        prompt: 'du lịch',
        correctAnswer: '旅行',
        targetItem,
      };

      expect(evaluateQuizAnswer(textQuestion, 'りょこ')).toBe(false);
      expect(evaluateQuizAnswer(textQuestion, '旅')).toBe(false);
      expect(evaluateQuizAnswer(textQuestion, '')).toBe(false);
      expect(evaluateQuizAnswer(textQuestion, '   ')).toBe(false);
      expect(evaluateQuizAnswer(textQuestion, 'du lịch')).toBe(false);
    });

    it('does not mutate the QuizQuestion object during evaluation', () => {
      const question: QuizQuestion = {
        id: 'q-1',
        type: 'japanese_to_vi',
        prompt: '旅行',
        correctAnswer: 'du lịch',
        options: ['du lịch', 'xe', 'cây', 'lửa'],
        targetItem,
      };

      const originalSnapshot = JSON.stringify(question);
      evaluateQuizAnswer(question, 'du lịch');
      expect(JSON.stringify(question)).toBe(originalSnapshot);
    });
  });
});
