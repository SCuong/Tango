import { describe, it, expect } from 'vitest';
import {
  parseRoute,
  buildPath,
  isStudyCategory,
  safeDecodeURIComponent,
  AppRoute,
} from '../routes';

describe('src/lib/routes.ts (Route Parser & Canonical Route Model)', () => {
  describe('isStudyCategory', () => {
    it('accepts vocabulary and kanji', () => {
      expect(isStudyCategory('vocabulary')).toBe(true);
      expect(isStudyCategory('kanji')).toBe(true);
    });

    it('rejects invalid categories without coercion', () => {
      expect(isStudyCategory('grammar')).toBe(false);
      expect(isStudyCategory('reading')).toBe(false);
      expect(isStudyCategory('')).toBe(false);
      expect(isStudyCategory(null)).toBe(false);
      expect(isStudyCategory(undefined)).toBe(false);
    });
  });

  describe('safeDecodeURIComponent', () => {
    it('decodes valid percent-encoded strings', () => {
      expect(safeDecodeURIComponent('hello%20world')).toBe('hello world');
      expect(safeDecodeURIComponent('%E6%97%A5%E6%9C%AC%E8%AA%9E')).toBe('日本語');
    });

    it('returns null instead of throwing on malformed percent encoding', () => {
      expect(safeDecodeURIComponent('%E0%A4%A')).toBeNull();
      expect(safeDecodeURIComponent('%')).toBeNull();
      expect(safeDecodeURIComponent('%1')).toBeNull();
    });
  });

  describe('parseRoute', () => {
    describe('home route', () => {
      it('treats "/" as home', () => {
        expect(parseRoute('/')).toEqual({ type: 'home' });
      });

      it('treats empty string and multiple slashes as home', () => {
        expect(parseRoute('')).toEqual({ type: 'home' });
        expect(parseRoute('///')).toEqual({ type: 'home' });
        expect(parseRoute('  /  ')).toEqual({ type: 'home' });
      });
    });

    describe('trailing slashes, query params, and hash handling', () => {
      it('handles harmless trailing slashes consistently', () => {
        expect(parseRoute('/settings/')).toEqual({ type: 'settings' });
        expect(parseRoute('/book/book-01/')).toEqual({
          type: 'book_study',
          bookId: 'book-01',
        });
        expect(parseRoute('/learn/vocabulary/')).toEqual({
          type: 'learn_by_type',
          category: 'vocabulary',
        });
      });

      it('strips query parameters and hashes before parsing', () => {
        expect(parseRoute('/settings?theme=dark#top')).toEqual({ type: 'settings' });
        expect(parseRoute('/book/book_1?preview=true')).toEqual({
          type: 'book_study',
          bookId: 'book_1',
        });
      });
    });

    describe('book routes', () => {
      it('parses /book/:bookId', () => {
        expect(parseRoute('/book/minna-1')).toEqual({
          type: 'book_study',
          bookId: 'minna-1',
        });
      });

      it('parses /book/:bookId/category/:category for valid categories', () => {
        expect(parseRoute('/book/minna-1/category/vocabulary')).toEqual({
          type: 'category_inside_book',
          bookId: 'minna-1',
          category: 'vocabulary',
        });
        expect(parseRoute('/book/minna-1/category/kanji')).toEqual({
          type: 'category_inside_book',
          bookId: 'minna-1',
          category: 'kanji',
        });
      });

      it('parses /book/:bookId/quiz-config', () => {
        expect(parseRoute('/book/minna-1/quiz-config')).toEqual({
          type: 'book_quiz_config',
          bookId: 'minna-1',
        });
      });

      it('parses /book/:bookId/category/:category/quiz-config', () => {
        expect(
          parseRoute('/book/minna-1/category/vocabulary/quiz-config')
        ).toEqual({
          type: 'category_quiz_config',
          bookId: 'minna-1',
          category: 'vocabulary',
        });
        expect(parseRoute('/book/minna-1/category/kanji/quiz-config')).toEqual({
          type: 'category_quiz_config',
          bookId: 'minna-1',
          category: 'kanji',
        });
      });
    });

    describe('learn by type routes', () => {
      it('parses /learn/vocabulary and /learn/kanji', () => {
        expect(parseRoute('/learn/vocabulary')).toEqual({
          type: 'learn_by_type',
          category: 'vocabulary',
        });
        expect(parseRoute('/learn/kanji')).toEqual({
          type: 'learn_by_type',
          category: 'kanji',
        });
      });

      it('rejects invalid category in /learn/:category', () => {
        expect(parseRoute('/learn/grammar')).toEqual({
          type: 'not_found',
          pathname: '/learn/grammar',
        });
      });
    });

    describe('lesson routes', () => {
      it('parses /lesson/:lessonId', () => {
        expect(parseRoute('/lesson/vocab-01')).toEqual({
          type: 'lesson_detail',
          lessonId: 'vocab-01',
        });
      });

      it('parses /lesson/:lessonId/items', () => {
        expect(parseRoute('/lesson/vocab-01/items')).toEqual({
          type: 'lesson_items',
          lessonId: 'vocab-01',
        });
      });
    });

    describe('quiz routes', () => {
      it('parses /quiz/mixed-config', () => {
        expect(parseRoute('/quiz/mixed-config')).toEqual({
          type: 'mixed_quiz_config',
        });
      });

      it('parses /quiz/session', () => {
        expect(parseRoute('/quiz/session')).toEqual({
          type: 'quiz_session',
        });
      });

      it('parses /quiz/results', () => {
        expect(parseRoute('/quiz/results')).toEqual({
          type: 'quiz_results',
        });
      });

      it('parses /quiz/review', () => {
        expect(parseRoute('/quiz/review')).toEqual({
          type: 'quiz_review',
        });
      });
    });

    describe('settings and content-management routes', () => {
      it('parses /settings', () => {
        expect(parseRoute('/settings')).toEqual({
          type: 'settings',
        });
      });

      it('parses /settings/content-management', () => {
        expect(parseRoute('/settings/content-management')).toEqual({
          type: 'content_management',
        });
      });

      it('parses /settings/content-management/add-book', () => {
        expect(parseRoute('/settings/content-management/add-book')).toEqual({
          type: 'add_book',
        });
      });

      it('parses /settings/content-management/book/:bookId', () => {
        expect(parseRoute('/settings/content-management/book/book-99')).toEqual({
          type: 'manage_book',
          bookId: 'book-99',
        });
      });

      it('parses /settings/content-management/lesson/:lessonId', () => {
        expect(
          parseRoute('/settings/content-management/lesson/lesson-42')
        ).toEqual({
          type: 'manage_lesson',
          lessonId: 'lesson-42',
        });
      });

      it('parses /settings/content-management/import', () => {
        expect(parseRoute('/settings/content-management/import')).toEqual({
          type: 'import',
        });
      });
    });

    describe('encoding and resilience', () => {
      it('correctly decodes encoded IDs containing spaces and unicode', () => {
        expect(parseRoute('/book/book%20one')).toEqual({
          type: 'book_study',
          bookId: 'book one',
        });

        expect(
          parseRoute('/lesson/%E6%97%A5%E6%9C%AC%E8%AA%9E')
        ).toEqual({
          type: 'lesson_detail',
          lessonId: '日本語',
        });
      });

      it('does not throw on malformed percent encoding and returns not_found', () => {
        expect(parseRoute('/book/%E0%A4%A')).toEqual({
          type: 'not_found',
          pathname: '/book/%E0%A4%A',
        });
        expect(parseRoute('/lesson/%FF')).toEqual({
          type: 'not_found',
          pathname: '/lesson/%FF',
        });
      });

      it('returns not_found for unknown paths', () => {
        expect(parseRoute('/dashboard')).toEqual({
          type: 'not_found',
          pathname: '/dashboard',
        });
        expect(parseRoute('/settings/profile')).toEqual({
          type: 'not_found',
          pathname: '/settings/profile',
        });
        expect(parseRoute('/quiz/unknown-subroute')).toEqual({
          type: 'not_found',
          pathname: '/quiz/unknown-subroute',
        });
      });

      it('returns not_found when bookId or lessonId is missing/empty', () => {
        expect(parseRoute('/book/')).toEqual({
          type: 'not_found',
          pathname: '/book/',
        });
        expect(parseRoute('/lesson/')).toEqual({
          type: 'not_found',
          pathname: '/lesson/',
        });
      });
    });
  });

  describe('buildPath', () => {
    it('produces canonical pathnames for all route types', () => {
      expect(buildPath({ type: 'home' })).toBe('/');
      expect(buildPath({ type: 'book_study', bookId: 'b-1' })).toBe('/book/b-1');
      expect(
        buildPath({
          type: 'category_inside_book',
          bookId: 'b-1',
          category: 'vocabulary',
        })
      ).toBe('/book/b-1/category/vocabulary');
      expect(buildPath({ type: 'learn_by_type', category: 'kanji' })).toBe(
        '/learn/kanji'
      );
      expect(buildPath({ type: 'lesson_detail', lessonId: 'les-1' })).toBe(
        '/lesson/les-1'
      );
      expect(buildPath({ type: 'lesson_items', lessonId: 'les-1' })).toBe(
        '/lesson/les-1/items'
      );
      expect(
        buildPath({
          type: 'category_quiz_config',
          bookId: 'b-1',
          category: 'vocabulary',
        })
      ).toBe('/book/b-1/category/vocabulary/quiz-config');
      expect(buildPath({ type: 'book_quiz_config', bookId: 'b-1' })).toBe(
        '/book/b-1/quiz-config'
      );
      expect(buildPath({ type: 'mixed_quiz_config' })).toBe('/quiz/mixed-config');
      expect(buildPath({ type: 'quiz_session' })).toBe('/quiz/session');
      expect(buildPath({ type: 'quiz_results' })).toBe('/quiz/results');
      expect(buildPath({ type: 'quiz_review' })).toBe('/quiz/review');
      expect(buildPath({ type: 'settings' })).toBe('/settings');
      expect(buildPath({ type: 'content_management' })).toBe(
        '/settings/content-management'
      );
      expect(buildPath({ type: 'add_book' })).toBe(
        '/settings/content-management/add-book'
      );
      expect(buildPath({ type: 'manage_book', bookId: 'b-1' })).toBe(
        '/settings/content-management/book/b-1'
      );
      expect(buildPath({ type: 'manage_lesson', lessonId: 'les-1' })).toBe(
        '/settings/content-management/lesson/les-1'
      );
      expect(buildPath({ type: 'import' })).toBe(
        '/settings/content-management/import'
      );
      expect(buildPath({ type: 'not_found', pathname: '/unknown' })).toBe(
        '/unknown'
      );
    });

    it('percent-encodes dynamic parameters with encodeURIComponent', () => {
      expect(
        buildPath({ type: 'book_study', bookId: 'book with spaces' })
      ).toBe('/book/book%20with%20spaces');
      expect(
        buildPath({ type: 'manage_lesson', lessonId: 'bài 1' })
      ).toBe('/settings/content-management/lesson/b%C3%A0i%201');
    });
  });

  describe('route build -> parse round trips', () => {
    const sampleRoutes: AppRoute[] = [
      { type: 'home' },
      { type: 'book_study', bookId: 'book_123' },
      {
        type: 'category_inside_book',
        bookId: 'book_123',
        category: 'vocabulary',
      },
      { type: 'category_inside_book', bookId: 'book_123', category: 'kanji' },
      { type: 'learn_by_type', category: 'vocabulary' },
      { type: 'learn_by_type', category: 'kanji' },
      { type: 'lesson_detail', lessonId: 'lesson_456' },
      { type: 'lesson_items', lessonId: 'lesson_456' },
      {
        type: 'category_quiz_config',
        bookId: 'book_123',
        category: 'vocabulary',
      },
      {
        type: 'category_quiz_config',
        bookId: 'book_123',
        category: 'kanji',
      },
      { type: 'book_quiz_config', bookId: 'book_123' },
      { type: 'mixed_quiz_config' },
      { type: 'quiz_session' },
      { type: 'quiz_results' },
      { type: 'quiz_review' },
      { type: 'settings' },
      { type: 'content_management' },
      { type: 'add_book' },
      { type: 'manage_book', bookId: 'book_123' },
      { type: 'manage_lesson', lessonId: 'lesson_456' },
      { type: 'import' },
    ];

    it.each(sampleRoutes)('preserves route identity across build -> parse ($type)', (route) => {
      const path = buildPath(route);
      const parsed = parseRoute(path);
      expect(parsed).toEqual(route);
    });

    it('round trips routes with special characters in IDs', () => {
      const specialRoute: AppRoute = {
        type: 'book_study',
        bookId: '中級へ行こう (Vol 1)',
      };
      const path = buildPath(specialRoute);
      expect(parseRoute(path)).toEqual(specialRoute);
    });
  });
});
