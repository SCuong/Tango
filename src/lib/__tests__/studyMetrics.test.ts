import { describe, it, expect } from 'vitest';
import {
  calculateStudyMetrics,
  getLessonStudyMetrics,
  getBookStudyMetrics,
  getCategoryStudyMetrics,
} from '../studyMetrics';
import { StudyItem, Lesson, ItemProgress } from '../../types';

describe('src/lib/studyMetrics.ts (Study Metrics & Read Selectors)', () => {
  const createMockItem = (id: string, japanese: string, kana?: string): StudyItem => ({
    id,
    japanese,
    kana: kana ?? japanese,
    vietnamese: ['nghĩa ' + id],
  });

  const createMockProgress = (
    itemId: string,
    overrides: Partial<ItemProgress> = {}
  ): ItemProgress => ({
    itemId,
    totalAttempts: 1,
    correctCount: 1,
    incorrectCount: 0,
    lastStudiedAt: '2026-09-27T00:00:00.000Z',
    isMarkedWeak: false,
    ...overrides,
  });

  describe('calculateStudyMetrics', () => {
    it('returns zeroes and null accuracy for an empty items array', () => {
      const metrics = calculateStudyMetrics([]);
      expect(metrics).toEqual({
        itemCount: 0,
        studiedItemCount: 0,
        totalAttempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        weakItemCount: 0,
        coveragePercent: 0,
        accuracyPercent: null,
      });
    });

    it('returns zero coverage and null accuracy when items exist but progress map is empty or unstudied', () => {
      const items = [
        createMockItem('item-1', '私'),
        createMockItem('item-2', '学校'),
      ];

      const metrics = calculateStudyMetrics(items, {});
      expect(metrics).toEqual({
        itemCount: 2,
        studiedItemCount: 0,
        totalAttempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        weakItemCount: 0,
        coveragePercent: 0,
        accuracyPercent: null,
      });
    });

    it('treats items with progress records of totalAttempts === 0 as unstudied', () => {
      const items = [createMockItem('item-1', '私')];
      const progress: Record<string, ItemProgress> = {
        'item-1': createMockProgress('item-1', {
          totalAttempts: 0,
          correctCount: 0,
          incorrectCount: 0,
        }),
      };

      const metrics = calculateStudyMetrics(items, progress);
      expect(metrics.studiedItemCount).toBe(0);
      expect(metrics.coveragePercent).toBe(0);
      expect(metrics.accuracyPercent).toBeNull();
    });

    describe('Study Coverage calculation and rounding', () => {
      const items = [
        createMockItem('item-1', '一'),
        createMockItem('item-2', '二'),
        createMockItem('item-3', '三'),
      ];

      it('rounds 1/3 studied items to 33%', () => {
        const progress = {
          'item-1': createMockProgress('item-1'),
        };
        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.itemCount).toBe(3);
        expect(metrics.studiedItemCount).toBe(1);
        expect(metrics.coveragePercent).toBe(33);
      });

      it('rounds 2/3 studied items to 67%', () => {
        const progress = {
          'item-1': createMockProgress('item-1'),
          'item-2': createMockProgress('item-2'),
        };
        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.itemCount).toBe(3);
        expect(metrics.studiedItemCount).toBe(2);
        expect(metrics.coveragePercent).toBe(67);
      });

      it('calculates 3/3 studied items as 100%', () => {
        const progress = {
          'item-1': createMockProgress('item-1'),
          'item-2': createMockProgress('item-2'),
          'item-3': createMockProgress('item-3'),
        };
        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.itemCount).toBe(3);
        expect(metrics.studiedItemCount).toBe(3);
        expect(metrics.coveragePercent).toBe(100);
      });
    });

    describe('Answer Accuracy calculation and rounding', () => {
      it('returns null accuracy when aggregate totalAttempts === 0', () => {
        const items = [createMockItem('item-1', '花')];
        const metrics = calculateStudyMetrics(items, {});
        expect(metrics.accuracyPercent).toBeNull();
      });

      it('rounds 1 correct out of 3 attempts to 33%', () => {
        const items = [createMockItem('item-1', '花')];
        const progress = {
          'item-1': createMockProgress('item-1', {
            totalAttempts: 3,
            correctCount: 1,
            incorrectCount: 2,
          }),
        };
        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.totalAttempts).toBe(3);
        expect(metrics.correctCount).toBe(1);
        expect(metrics.incorrectCount).toBe(2);
        expect(metrics.accuracyPercent).toBe(33);
      });

      it('rounds 2 correct out of 3 attempts to 67%', () => {
        const items = [createMockItem('item-1', '花')];
        const progress = {
          'item-1': createMockProgress('item-1', {
            totalAttempts: 3,
            correctCount: 2,
            incorrectCount: 1,
          }),
        };
        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.accuracyPercent).toBe(67);
      });

      it('calculates 100% accuracy for all-correct attempts', () => {
        const items = [createMockItem('item-1', '花')];
        const progress = {
          'item-1': createMockProgress('item-1', {
            totalAttempts: 10,
            correctCount: 10,
            incorrectCount: 0,
          }),
        };
        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.accuracyPercent).toBe(100);
      });

      it('calculates 0% accuracy for all-incorrect attempts', () => {
        const items = [createMockItem('item-1', '花')];
        const progress = {
          'item-1': createMockProgress('item-1', {
            totalAttempts: 5,
            correctCount: 0,
            incorrectCount: 5,
          }),
        };
        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.accuracyPercent).toBe(0);
      });
    });

    describe('Independence of Study Coverage and Answer Accuracy', () => {
      it('supports 100% coverage with low (50%) accuracy', () => {
        const items = [
          createMockItem('item-1', '一'),
          createMockItem('item-2', '二'),
        ];
        const progress = {
          'item-1': createMockProgress('item-1', {
            totalAttempts: 2,
            correctCount: 1,
            incorrectCount: 1,
          }),
          'item-2': createMockProgress('item-2', {
            totalAttempts: 2,
            correctCount: 1,
            incorrectCount: 1,
          }),
        };

        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.coveragePercent).toBe(100);
        expect(metrics.accuracyPercent).toBe(50);
      });

      it('supports low (20%) coverage with 100% accuracy', () => {
        const items = [
          createMockItem('item-1', '一'),
          createMockItem('item-2', '二'),
          createMockItem('item-3', '三'),
          createMockItem('item-4', '四'),
          createMockItem('item-5', '五'),
        ];
        const progress = {
          'item-1': createMockProgress('item-1', {
            totalAttempts: 5,
            correctCount: 5,
            incorrectCount: 0,
          }),
        };

        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.coveragePercent).toBe(20);
        expect(metrics.accuracyPercent).toBe(100);
      });
    });

    describe('Weak item count and pure selector contract', () => {
      it('counts only items in scope that have isMarkedWeak === true', () => {
        const items = [
          createMockItem('item-1', '猫'),
          createMockItem('item-2', '犬'),
        ];
        const progress = {
          'item-1': createMockProgress('item-1', { isMarkedWeak: true }),
          'item-2': createMockProgress('item-2', { isMarkedWeak: false }),
        };

        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.weakItemCount).toBe(1);
      });

      it('does NOT infer weak status from error rates (pure reader contract)', () => {
        const items = [createMockItem('item-1', '猫')];
        // 0 correct out of 10 attempts, but isMarkedWeak is false
        const progress = {
          'item-1': createMockProgress('item-1', {
            totalAttempts: 10,
            correctCount: 0,
            incorrectCount: 10,
            isMarkedWeak: false,
          }),
        };

        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.weakItemCount).toBe(0);
      });

      it('ignores weak items that are not in the scoped items array', () => {
        const items = [createMockItem('item-1', '猫')];
        const progress = {
          'item-1': createMockProgress('item-1', { isMarkedWeak: false }),
          'item-999': createMockProgress('item-999', { isMarkedWeak: true }),
        };

        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.weakItemCount).toBe(0);
      });
    });

    describe('Orphaned progress records', () => {
      it('completely ignores progress records for items outside the scope', () => {
        const items = [createMockItem('item-1', '車')];
        const progress = {
          'item-1': createMockProgress('item-1', {
            totalAttempts: 2,
            correctCount: 2,
            incorrectCount: 0,
          }),
          'orphan-item-a': createMockProgress('orphan-item-a', {
            totalAttempts: 100,
            correctCount: 0,
            incorrectCount: 100,
            isMarkedWeak: true,
          }),
        };

        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.itemCount).toBe(1);
        expect(metrics.studiedItemCount).toBe(1);
        expect(metrics.totalAttempts).toBe(2);
        expect(metrics.correctCount).toBe(2);
        expect(metrics.incorrectCount).toBe(0);
        expect(metrics.weakItemCount).toBe(0);
        expect(metrics.coveragePercent).toBe(100);
        expect(metrics.accuracyPercent).toBe(100);
      });
    });

    describe('Curriculum symmetry (no quiz deduplication)', () => {
      it('counts distinct StudyItems even if they share the same Japanese/kana text', () => {
        const itemA = createMockItem('item-a', '行く', 'いく');
        const itemB = createMockItem('item-b', '行く', 'いく');
        const items = [itemA, itemB];

        const progress = {
          'item-a': createMockProgress('item-a', {
            totalAttempts: 4,
            correctCount: 3,
            incorrectCount: 1,
          }),
        };

        const metrics = calculateStudyMetrics(items, progress);
        expect(metrics.itemCount).toBe(2);
        expect(metrics.studiedItemCount).toBe(1);
        expect(metrics.coveragePercent).toBe(50);
        expect(metrics.totalAttempts).toBe(4);
        expect(metrics.correctCount).toBe(3);
        expect(metrics.accuracyPercent).toBe(75);
      });
    });
  });

  describe('getLessonStudyMetrics', () => {
    it('calculates metrics for a single lesson items', () => {
      const lesson: Lesson = {
        id: 'lesson-1',
        title: 'Bài 1: Chào hỏi',
        category: 'vocabulary',
        bookId: 'book-1',
        items: [
          createMockItem('item-1', 'おはよう'),
          createMockItem('item-2', 'こんにちは'),
        ],
      };

      const progress = {
        'item-1': createMockProgress('item-1', {
          totalAttempts: 2,
          correctCount: 2,
          incorrectCount: 0,
        }),
      };

      const metrics = getLessonStudyMetrics(lesson, progress);
      expect(metrics.itemCount).toBe(2);
      expect(metrics.studiedItemCount).toBe(1);
      expect(metrics.coveragePercent).toBe(50);
      expect(metrics.accuracyPercent).toBe(100);
    });
  });

  describe('getBookStudyMetrics', () => {
    const vocabLesson: Lesson = {
      id: 'lesson-v1',
      title: 'Từ vựng 1',
      category: 'vocabulary',
      bookId: 'book-target',
      items: [
        createMockItem('v1', '本'),
        createMockItem('v2', 'ペン'),
      ],
    };

    const kanjiLesson: Lesson = {
      id: 'lesson-k1',
      title: 'Hán tự 1',
      category: 'kanji',
      bookId: 'book-target',
      items: [
        createMockItem('k1', '日'),
        createMockItem('k2', '月'),
      ],
    };

    const otherBookLesson: Lesson = {
      id: 'lesson-other',
      title: 'Bài sách khác',
      category: 'vocabulary',
      bookId: 'book-other',
      items: [
        createMockItem('other-1', '机'),
      ],
    };

    const unassignedLesson: Lesson = {
      id: 'lesson-unassigned',
      title: 'Bài chưa gán sách',
      category: 'vocabulary',
      items: [
        createMockItem('unassigned-1', '椅子'),
      ],
    };

    it('aggregates both vocabulary and kanji lessons for the matching bookId', () => {
      const lessons = [vocabLesson, kanjiLesson, otherBookLesson, unassignedLesson];
      const progress = {
        v1: createMockProgress('v1', { totalAttempts: 2, correctCount: 2, incorrectCount: 0 }),
        k1: createMockProgress('k1', { totalAttempts: 2, correctCount: 1, incorrectCount: 1 }),
      };

      const metrics = getBookStudyMetrics('book-target', lessons, progress);
      expect(metrics.lessonCount).toBe(2);
      expect(metrics.itemCount).toBe(4); // 2 vocab + 2 kanji
      expect(metrics.studiedItemCount).toBe(2);
      expect(metrics.coveragePercent).toBe(50);
      expect(metrics.totalAttempts).toBe(4);
      expect(metrics.correctCount).toBe(3);
      expect(metrics.accuracyPercent).toBe(75);
    });

    it('works with a Record<string, Lesson> dictionary', () => {
      const lessonsDict: Record<string, Lesson> = {
        [vocabLesson.id]: vocabLesson,
        [kanjiLesson.id]: kanjiLesson,
        [otherBookLesson.id]: otherBookLesson,
      };

      const metrics = getBookStudyMetrics('book-target', lessonsDict);
      expect(metrics.lessonCount).toBe(2);
      expect(metrics.itemCount).toBe(4);
      expect(metrics.studiedItemCount).toBe(0);
      expect(metrics.coveragePercent).toBe(0);
      expect(metrics.accuracyPercent).toBeNull();
    });

    it('returns 0 counts when no lessons match the bookId', () => {
      const metrics = getBookStudyMetrics('non-existent-book', [vocabLesson]);
      expect(metrics.lessonCount).toBe(0);
      expect(metrics.itemCount).toBe(0);
      expect(metrics.coveragePercent).toBe(0);
      expect(metrics.accuracyPercent).toBeNull();
    });
  });

  describe('getCategoryStudyMetrics', () => {
    const bookVocab1: Lesson = {
      id: 'bv1',
      title: 'Từ vựng Sách 1',
      category: 'vocabulary',
      bookId: 'book-1',
      items: [createMockItem('bv1-1', '水')],
    };

    const bookVocab2: Lesson = {
      id: 'bv2',
      title: 'Từ vựng Sách 2',
      category: 'vocabulary',
      bookId: 'book-2',
      items: [createMockItem('bv2-1', '火')],
    };

    const bookKanji1: Lesson = {
      id: 'bk1',
      title: 'Hán tự Sách 1',
      category: 'kanji',
      bookId: 'book-1',
      items: [createMockItem('bk1-1', '木')],
    };

    const unassignedVocab: Lesson = {
      id: 'uv1',
      title: 'Từ vựng Tự do',
      category: 'vocabulary',
      items: [createMockItem('uv1-1', '金')],
    };

    const lessons = [bookVocab1, bookVocab2, bookKanji1, unassignedVocab];

    it('global category scope (no bookId) aggregates all lessons of category, including unassigned', () => {
      const progress = {
        'bv1-1': createMockProgress('bv1-1', { totalAttempts: 1, correctCount: 1, incorrectCount: 0 }),
        'uv1-1': createMockProgress('uv1-1', { totalAttempts: 1, correctCount: 0, incorrectCount: 1 }),
      };

      const metrics = getCategoryStudyMetrics('vocabulary', lessons, progress);
      // Includes bv1, bv2, uv1 (3 lessons, 3 items), excludes bk1 (kanji)
      expect(metrics.lessonCount).toBe(3);
      expect(metrics.itemCount).toBe(3);
      expect(metrics.studiedItemCount).toBe(2);
      expect(metrics.coveragePercent).toBe(67);
      expect(metrics.totalAttempts).toBe(2);
      expect(metrics.correctCount).toBe(1);
      expect(metrics.accuracyPercent).toBe(50);
    });

    it('book-scoped category only includes lessons matching both category and bookId', () => {
      const progress = {
        'bv1-1': createMockProgress('bv1-1', { totalAttempts: 2, correctCount: 2, incorrectCount: 0 }),
      };

      const metrics = getCategoryStudyMetrics('vocabulary', lessons, progress, 'book-1');
      // Only bv1 matches (book-1 && vocabulary)
      expect(metrics.lessonCount).toBe(1);
      expect(metrics.itemCount).toBe(1);
      expect(metrics.studiedItemCount).toBe(1);
      expect(metrics.coveragePercent).toBe(100);
      expect(metrics.accuracyPercent).toBe(100);
    });

    it('book-scoped category works with Record<string, Lesson>', () => {
      const dict: Record<string, Lesson> = {
        [bookVocab1.id]: bookVocab1,
        [bookKanji1.id]: bookKanji1,
      };

      const metrics = getCategoryStudyMetrics('kanji', dict, {}, 'book-1');
      expect(metrics.lessonCount).toBe(1);
      expect(metrics.itemCount).toBe(1);
    });
  });
});
