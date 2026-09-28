import { describe, it, expect } from 'vitest';
import { translate, TranslationKey } from '../i18n';
import {
  QuizReturnTarget,
  formatQuizReturnLabel,
  getQuizReturnAction,
  isQuizReturnTarget,
  lessonReturnTarget,
} from '../quizReturn';
import { buildQuizSessionResult, createQuizSession } from '../quizSession';
import { quizConfigReturnTarget } from '../../features/quiz/QuizConfigScreen';
import { buildLessonQuizConfig } from '../../features/study/LessonDetail';
import { buildReviewConfig } from '../../features/quiz/QuizSessionContext';
import { Lesson } from '../../types';

const label = (target: unknown, language: 'vi' | 'en') =>
  formatQuizReturnLabel(getQuizReturnAction(target), (key: TranslationKey, params?: Record<string, string>) =>
    translate(language, key, params)
  );

describe('quiz return targets at every entry point', () => {
  it('Kanji category test returns to the same Kanji category', () => {
    const target = quizConfigReturnTarget({ kind: 'category', bookId: 'b1', category: 'kanji' });
    expect(target).toEqual({ type: 'category_inside_book', bookId: 'b1', category: 'kanji' });
    expect(getQuizReturnAction(target)).toMatchObject({ route: target, icon: 'back' });
    expect(label(target, 'vi')).toBe('Về Hán tự');
    expect(label(target, 'en')).toBe('Back to Kanji');
  });

  it('Vocabulary category test returns to the same Vocabulary category', () => {
    const target = quizConfigReturnTarget({ kind: 'category', bookId: 'b2', category: 'vocabulary' });
    expect(target).toEqual({ type: 'category_inside_book', bookId: 'b2', category: 'vocabulary' });
    expect(label(target, 'vi')).toBe('Về Từ vựng');
    expect(label(target, 'en')).toBe('Back to Vocabulary');
  });

  it('Book test returns to the book', () => {
    const target = quizConfigReturnTarget({ kind: 'book', bookId: 'b1' });
    expect(target).toEqual({ type: 'book_study', bookId: 'b1' });
    expect(label(target, 'vi')).toBe('Về giáo trình');
    expect(label(target, 'en')).toBe('Back to book');
  });

  it('Lesson Quick Test and Practice return to the lesson', () => {
    const quickTest = buildLessonQuizConfig('l1', 'test', 10);
    const practice = buildLessonQuizConfig('l1', 'practice');
    expect(quickTest).toMatchObject({ lessonIds: ['l1'], mode: 'test', questionCount: 10, returnTarget: { type: 'lesson_detail', lessonId: 'l1' } });
    expect(practice).toMatchObject({ lessonIds: ['l1'], mode: 'practice', questionCount: 'all', returnTarget: { type: 'lesson_detail', lessonId: 'l1' } });
    expect(label(practice.returnTarget, 'vi')).toBe('Về bài học');
    expect(label(quickTest.returnTarget, 'en')).toBe('Back to lesson');
  });

  it('Mixed Test returns to the Test root with the Test icon', () => {
    const target = quizConfigReturnTarget({ kind: 'mixed' });
    expect(target).toEqual({ type: 'mixed_quiz_config' });
    expect(getQuizReturnAction(target).icon).toBe('test');
    expect(label(target, 'vi')).toBe('Về Kiểm tra');
    expect(label(target, 'en')).toBe('Back to Test');
  });

  it('falls back to Home when the metadata is missing or malformed', () => {
    for (const target of [undefined, null, {}, { type: 'quiz_results' }, { type: 'lesson_detail' }, { type: 'category_inside_book', bookId: 'b', category: 'grammar' }]) {
      expect(getQuizReturnAction(target), JSON.stringify(target)).toEqual({ route: { type: 'home' }, labelKey: 'results.home', icon: 'home' });
    }
    expect(label(undefined, 'vi')).toBe('Về trang chủ');
    expect(label(undefined, 'en')).toBe('Back to Home');
  });

  it('accepts only the restricted quiz-origin routes', () => {
    const valid: QuizReturnTarget[] = [
      lessonReturnTarget('l1'),
      { type: 'category_inside_book', bookId: 'b', category: 'kanji' },
      { type: 'book_study', bookId: 'b' },
      { type: 'mixed_quiz_config' },
      { type: 'home' },
    ];
    for (const target of valid) expect(isQuizReturnTarget(target)).toBe(true);
    for (const route of [{ type: 'settings' }, { type: 'quiz_session' }, { type: 'book_study', bookId: '' }]) {
      expect(isQuizReturnTarget(route)).toBe(false);
    }
  });
});

describe('return target across Review and history', () => {
  const lesson: Lesson = {
    id: 'l1',
    category: 'kanji',
    title: 'Bài 1',
    items: [
      { id: 'i1', japanese: '旅行', kana: 'りょこう', vietnamese: ['du lịch'] },
      { id: 'i2', japanese: '実際', kana: 'じっさい', vietnamese: ['thực tế'] },
      { id: 'i3', japanese: '礼儀', kana: 'れいぎ', vietnamese: ['lễ nghi'] },
      { id: 'i4', japanese: '景観', kana: 'けいかん', vietnamese: ['cảnh quan'] },
    ],
  };
  const origin = quizConfigReturnTarget({ kind: 'category', bookId: 'b1', category: 'kanji' });

  it('a review config carries the original origin, never the previous Results screen', () => {
    expect(buildReviewConfig(['l1'], ['i1'], { l1: lesson }, origin).returnTarget).toEqual(origin);
    // Lesson review returns to its lesson; a review without metadata falls back Home
    expect(buildReviewConfig(['l1'], ['i1'], { l1: lesson }, lessonReturnTarget('l1')).returnTarget).toEqual(lessonReturnTarget('l1'));
    expect(buildReviewConfig(['l1'], ['i1'], { l1: lesson }).returnTarget).toBeUndefined();
  });

  it('is runtime metadata only: the persisted result has no return target', () => {
    const config = { ...buildLessonQuizConfig('l1', 'test', 'all'), returnTarget: origin };
    let session = createQuizSession(config, [], 0);
    session = { ...session, status: 'finished', finishedAt: 1000 };
    const result = buildQuizSessionResult(session, 's1', new Date(0));
    expect(JSON.stringify(result)).not.toContain('returnTarget');
    expect(JSON.stringify(result)).not.toContain('category_inside_book');
  });
});
